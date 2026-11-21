/* ==========================================================================
   Capa de datos con adaptadores intercambiables
   --------------------------------------------------------------------------
   · LocalAdapter  → DEMO. Guarda todo en este navegador (localStorage) y
                     sincroniza en vivo entre pestañas (web ⇄ panel).
                     Usa Web Locks para que dos pestañas no puedan reservar
                     el mismo hueco a la vez.
   · RemoteAdapter → PRODUCCIÓN. Mismos métodos contra una API propia
                     (p. ej. Supabase/Edge Functions, ver supabase/schema.sql).
                     El servidor vuelve a validar la disponibilidad y la base
                     de datos impide solapes con una restricción EXCLUDE.
   La interfaz pública (ORY.store.*) es asíncrona en ambos casos.
   ========================================================================== */
(function (ORY) {
  'use strict';
  const U = ORY.U, A = ORY.availability;
  const KEY = 'nacar.demo.v1';
  const listeners = new Set();
  const channel = 'BroadcastChannel' in window ? new BroadcastChannel('nacar-demo') : null;

  class BookingError extends Error {
    constructor(code, message) { super(message); this.code = code; }
  }

  function defaults() {
    const c = ORY.config;
    return {
      version: 1,
      services: c.services.map((s) => Object.assign({ active: true, buffer: null, priceFrom: false }, s)),
      staff: c.staff.map((s) => Object.assign({ active: true }, s)),
      timeOff: [],
      bookings: [],
      outbox: [],
      feed: [],
      testimonials: [],
      settings: {
        business: JSON.parse(JSON.stringify(c.business)),
        booking: Object.assign({}, c.booking),
        reviews: Object.assign({}, c.reviews),
        integrations: JSON.parse(JSON.stringify(c.integrations))
      },
      meta: { createdAt: Date.now(), seeded: false }
    };
  }

  function safeGet() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  let memory = null; // respaldo si el navegador bloquea el almacenamiento

  /* ---------------------------------------------------------------- Local */
  const Local = {
    read() {
      const raw = safeGet();
      if (raw) { try { return JSON.parse(raw); } catch (e) { /* corrupto → reinicia */ } }
      return memory ? JSON.parse(JSON.stringify(memory)) : null;
    },
    write(db, reason) {
      memory = db;
      try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* modo privado: queda en memoria */ }
      cache = db;
      if (channel) channel.postMessage({ reason });
      emit(reason);
    },
    async lock(fn) {
      if (navigator.locks && navigator.locks.request) return navigator.locks.request('nacar-booking', fn);
      return fn();
    }
  };

  let cache = null;
  function emit(reason) { listeners.forEach((fn) => { try { fn(reason); } catch (e) { console.error(e); } }); }
  function onExternal() { cache = Local.read() || cache; emit('external'); }
  if (channel) channel.onmessage = onExternal;
  window.addEventListener('storage', (e) => { if (e.key === KEY) onExternal(); });

  function fresh() { const db = Local.read() || defaults(); cache = db; return db; }
  const latency = () => U.delay(180 + Math.random() * 260); // simula red para mostrar estados de carga

  function applyPlan(db, event, b) {
    const p = ORY.notify.plan(db, event, b);
    db.outbox.push(...p.outbox);
    db.feed.unshift(...p.feed);
    db.feed = db.feed.slice(0, 200);
  }

  function validateClient(c) {
    if (!c || !String(c.name || '').trim() || String(c.name).trim().length < 2) throw new BookingError('invalid', 'Indica tu nombre.');
    if (!U.validPhone(c.phone)) throw new BookingError('invalid', 'El teléfono no parece válido.');
    if (!U.validEmail(c.email)) throw new BookingError('invalid', 'El correo electrónico no parece válido.');
  }

  const LocalAdapter = {
    mode: 'local',
    async init() {
      let db = Local.read();
      if (!db) { db = defaults(); Local.write(db, 'init'); }
      // Migración: fotos que antes venían de Unsplash ahora van dentro de la demo (img/)
      let migrated = false;
      db.services.forEach((s) => {
        const c = ORY.config.services.find((x) => x.id === s.id);
        if (c && /images\.unsplash\.com/.test(s.image || '') && c.image !== s.image) { s.image = c.image; migrated = true; }
      });
      if (migrated) Local.write(db, 'services:migrate');
      cache = db;
      return db;
    },
    snapshot() { return cache || fresh(); },

    async getSettings() { return fresh().settings; },
    async saveSettings(patch) {
      await latency();
      const db = fresh();
      Object.keys(patch).forEach((k) => { db.settings[k] = Object.assign({}, db.settings[k], patch[k]); });
      Local.write(db, 'settings');
      return db.settings;
    },

    /* ---- Reservas ---- */
    async createBooking(input) {
      validateClient(input.client);
      if (!input.consent || !input.consent.privacy) throw new BookingError('consent', 'Necesitamos tu consentimiento para gestionar la cita.');
      if (input.website) throw new BookingError('spam', 'No se ha podido completar la reserva.'); // honeypot anti-bots
      await latency();
      return Local.lock(async () => {
        const db = fresh();
        const svc = db.services.find((s) => s.id === input.serviceId && s.active !== false);
        if (!svc) throw new BookingError('invalid', 'Este servicio ya no está disponible.');
        let staffId = input.staffId;
        if (!staffId || staffId === 'any') {
          const slot = A.slotsForDay(db, { serviceId: svc.id, staffId: 'any', date: new Date(input.start) }).find((s) => s.start === input.start);
          if (!slot) throw new BookingError('taken', 'Ese horario acaba de ocuparse. Elige otro, por favor.');
          staffId = A.pickStaff(db, slot.staffIds, input.start);
        }
        if (!A.isFree(db, { serviceId: svc.id, staffId, start: input.start })) {
          throw new BookingError('taken', 'Ese horario acaba de ocuparse. Elige otro, por favor.');
        }
        const b = {
          id: U.uid('bk'), code: U.code(), token: U.token(),
          serviceId: svc.id, staffId, start: input.start, end: input.start + svc.duration * U.MIN,
          price: svc.price,
          client: { name: input.client.name.trim(), phone: U.normPhone(input.client.phone), email: U.normEmail(input.client.email) },
          notes: String(input.notes || '').slice(0, 500),
          status: 'confirmed', source: input.source || 'web', demo: !!input.demo,
          consent: { privacy: true, marketing: !!(input.consent && input.consent.marketing), at: Date.now(), policyVersion: '2026-11' },
          createdAt: Date.now(),
          history: [{ at: Date.now(), action: 'created', by: input.source === 'admin' ? 'salon' : 'clienta' }]
        };
        db.bookings.push(b);
        applyPlan(db, 'created', b);
        Local.write(db, 'booking:create');
        return b;
      });
    },

    async findBooking(code, contact) {
      await latency();
      const db = fresh();
      const c = String(contact || '').trim();
      const b = db.bookings.find((x) => x.code.toUpperCase() === String(code || '').trim().toUpperCase());
      if (!b) return null;
      const ok = U.normEmail(c) === b.client.email || (U.validPhone(c) && U.normPhone(c) === b.client.phone);
      return ok ? b : null;
    },

    canClientChange(b) {
      const db = this.snapshot();
      return b.status === 'confirmed' && b.start - Date.now() > db.settings.booking.cancelCutoffHours * 3600000;
    },

    async cancelBooking(id, { by = 'clienta', reason = '' } = {}) {
      await latency();
      return Local.lock(async () => {
        const db = fresh();
        const b = db.bookings.find((x) => x.id === id);
        if (!b) throw new BookingError('not_found', 'No encontramos la reserva.');
        if (b.status === 'cancelled') return b;
        if (by === 'clienta' && !this.canClientChange(b)) throw new BookingError('cutoff', `Las cancelaciones online se admiten hasta ${db.settings.booking.cancelCutoffHours} h antes. Llámanos y lo vemos.`);
        b.status = 'cancelled';
        b.cancelledAt = Date.now();
        b.history.push({ at: Date.now(), action: 'cancelled', by, reason });
        ORY.notify.voidPending(db, b.id);
        applyPlan(db, 'cancelled', b);
        Local.write(db, 'booking:cancel');
        return b;
      });
    },

    async rescheduleBooking(id, { start, staffId, serviceId, by = 'clienta' }) {
      await latency();
      return Local.lock(async () => {
        const db = fresh();
        const b = db.bookings.find((x) => x.id === id);
        if (!b) throw new BookingError('not_found', 'No encontramos la reserva.');
        if (by === 'clienta' && !this.canClientChange(b)) throw new BookingError('cutoff', 'Ya no es posible modificar esta cita online.');
        const sid = serviceId || b.serviceId;
        const svc = db.services.find((s) => s.id === sid);
        let st = staffId || b.staffId;
        if (st === 'any') {
          const slot = A.slotsForDay(db, { serviceId: sid, staffId: 'any', date: new Date(start), excludeBookingId: b.id }).find((s) => s.start === start);
          if (!slot) throw new BookingError('taken', 'Ese horario acaba de ocuparse.');
          st = A.pickStaff(db, slot.staffIds, start);
        }
        if (!A.isFree(db, { serviceId: sid, staffId: st, start, excludeBookingId: b.id })) throw new BookingError('taken', 'Ese horario acaba de ocuparse.');
        const prev = { start: b.start, staffId: b.staffId, serviceId: b.serviceId };
        Object.assign(b, { start, end: start + svc.duration * U.MIN, staffId: st, serviceId: sid, price: svc.price });
        b.history.push({ at: Date.now(), action: 'rescheduled', by, from: prev });
        ORY.notify.voidPending(db, b.id);
        applyPlan(db, 'rescheduled', b);
        Local.write(db, 'booking:reschedule');
        return b;
      });
    },

    async setStatus(id, status, by = 'salon') {
      await latency();
      const db = fresh();
      const b = db.bookings.find((x) => x.id === id);
      if (!b) throw new BookingError('not_found', 'No encontramos la reserva.');
      if (status === 'cancelled') return this.cancelBooking(id, { by });
      b.status = status;
      b.history.push({ at: Date.now(), action: status, by });
      if (status === 'no_show') ORY.notify.voidPending(db, b.id);
      Local.write(db, 'booking:status');
      return b;
    },

    async attendanceConfirmed(id) {
      const db = fresh();
      const b = db.bookings.find((x) => x.id === id);
      if (!b) return;
      b.attendanceConfirmedAt = Date.now();
      b.history.push({ at: Date.now(), action: 'attendance_confirmed', by: 'clienta' });
      db.feed.unshift({ id: U.uid('nt'), type: 'attendance', bookingId: b.id, title: 'Asistencia confirmada', text: `${b.client.name} confirma que vendrá el ${U.fmtDateShort(b.start)} a las ${U.fmtTime(b.start)}.`, at: Date.now(), read: false });
      Local.write(db, 'booking:attendance');
    },

    /* ---- Catálogo, equipo y bloqueos ---- */
    async save(collection, item) {
      await latency();
      const db = fresh();
      const list = db[collection];
      const i = list.findIndex((x) => x.id === item.id);
      if (i >= 0) list[i] = Object.assign({}, list[i], item); else list.push(item);
      Local.write(db, collection + ':save');
      return item;
    },
    async remove(collection, id) {
      await latency();
      const db = fresh();
      if ((collection === 'services' || collection === 'staff') && db.bookings.some((b) => (b.serviceId === id || b.staffId === id) && b.start > Date.now() && b.status === 'confirmed')) {
        throw new BookingError('in_use', 'Tiene citas futuras. Desactívalo en lugar de borrarlo.');
      }
      db[collection] = db[collection].filter((x) => x.id !== id);
      Local.write(db, collection + ':remove');
    },
    async markFeedRead() { const db = fresh(); db.feed.forEach((n) => { n.read = true; }); Local.write(db, 'feed:read'); },
    async markMessage(id, status) {
      const db = fresh();
      const m = db.outbox.find((x) => x.id === id);
      if (m) { m.status = status; m.handledAt = Date.now(); Local.write(db, 'outbox'); }
    },

    /* ---- Demo ---- */
    async seedDemo() { const db = fresh(); ORY.seed(db); db.meta.seeded = true; Local.write(db, 'seed'); },
    async clearDemo() {
      const db = fresh();
      const ids = new Set(db.bookings.filter((b) => b.demo).map((b) => b.id));
      db.bookings = db.bookings.filter((b) => !b.demo);
      db.outbox = db.outbox.filter((m) => !ids.has(m.bookingId));
      db.feed = db.feed.filter((n) => !ids.has(n.bookingId));
      Local.write(db, 'seed:clear');
    },
    async factoryReset() { Local.write(defaults(), 'reset'); },
    exportJSON() { return JSON.stringify(fresh(), null, 2); }
  };

  /* --------------------------------------------------------------- Remote */
  /* Esqueleto listo para conectar. Requiere el backend descrito en README.
     Autenticación del panel: token de sesión (Supabase Auth u otro) en
     cabecera Authorization; la web pública solo accede a endpoints públicos. */
  function RemoteAdapter(base) {
    let snap = null;
    const req = async (path, opts = {}) => {
      const res = await fetch(base + path, Object.assign({ headers: { 'Content-Type': 'application/json' }, credentials: 'include' }, opts));
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new BookingError(data.code || 'server', data.message || 'Error del servidor.');
      return data;
    };
    return {
      mode: 'remote',
      async init() { snap = await req('/bootstrap'); return snap; },           // servicios, equipo, horarios, huecos ocupados (sin datos personales)
      snapshot() { return snap; },
      getSettings: () => req('/settings'),
      saveSettings: (p) => req('/settings', { method: 'PATCH', body: JSON.stringify(p) }),
      createBooking: (b) => req('/bookings', { method: 'POST', body: JSON.stringify(b) }),
      findBooking: (code, contact) => req('/bookings/lookup', { method: 'POST', body: JSON.stringify({ code, contact }) }).catch(() => null),
      canClientChange: (b) => b.status === 'confirmed' && b.start - Date.now() > snap.settings.booking.cancelCutoffHours * 3600000,
      cancelBooking: (id, o) => req('/bookings/' + id + '/cancel', { method: 'POST', body: JSON.stringify(o || {}) }),
      rescheduleBooking: (id, o) => req('/bookings/' + id + '/reschedule', { method: 'POST', body: JSON.stringify(o) }),
      setStatus: (id, status) => req('/bookings/' + id, { method: 'PATCH', body: JSON.stringify({ status }) }),
      attendanceConfirmed: (id) => req('/bookings/' + id + '/attendance', { method: 'POST' }),
      save: (col, item) => req('/' + col + '/' + item.id, { method: 'PUT', body: JSON.stringify(item) }),
      remove: (col, id) => req('/' + col + '/' + id, { method: 'DELETE' }),
      markFeedRead: () => req('/feed/read', { method: 'POST' }),
      markMessage: (id, status) => req('/outbox/' + id, { method: 'PATCH', body: JSON.stringify({ status }) }),
      seedDemo: async () => { throw new BookingError('unsupported', 'No disponible en producción.'); },
      clearDemo: async () => { throw new BookingError('unsupported', 'No disponible en producción.'); },
      factoryReset: async () => { throw new BookingError('unsupported', 'No disponible en producción.'); },
      exportJSON: () => JSON.stringify(snap, null, 2)
    };
  }

  const adapter = ORY.config.integrations.dataAdapter === 'remote' ? RemoteAdapter(ORY.config.integrations.apiBaseUrl) : LocalAdapter;
  adapter.subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
  adapter.BookingError = BookingError;
  ORY.store = adapter;
})(window.ORY = window.ORY || {});
