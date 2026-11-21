/* ==========================================================================
   Motor de disponibilidad
   - Cruza horario del salón ∩ turno de cada profesional
   - Resta citas activas (+ margen de preparación) y ausencias/bloqueos
   - Respeta duración variable del servicio, antelación mínima y límite de días
   Es una función pura sobre un "snapshot" de datos: la misma lógica sirve en
   el navegador y en el servidor (Node/Edge) para revalidar antes de guardar.
   ========================================================================== */
(function (ORY) {
  'use strict';
  const U = ORY.U;
  const BLOCKING = ['confirmed', 'pending', 'completed', 'no_show'];

  function intersect(a, b) {
    const out = [];
    a.forEach(([s1, e1]) => b.forEach(([s2, e2]) => {
      const s = Math.max(s1, s2), e = Math.min(e1, e2);
      if (e > s) out.push([s, e]);
    }));
    return out;
  }
  const toRanges = (list) => (list || []).map(([s, e]) => [U.toMin(s), U.toMin(e)]);

  function bufferOf(db, serviceId) {
    const s = db.services.find((x) => x.id === serviceId);
    const def = db.settings.booking.defaultBufferMinutes || 0;
    return s && s.buffer != null ? Number(s.buffer) : def;
  }

  /** Intervalos ocupados [inicio, fin+margen) de una profesional en un rango. */
  function busy(db, staffId, from, to, excludeId) {
    const out = [];
    db.bookings.forEach((b) => {
      if (b.staffId !== staffId || b.id === excludeId || !BLOCKING.includes(b.status)) return;
      const end = b.end + bufferOf(db, b.serviceId) * U.MIN;
      if (b.start < to && end > from) out.push([b.start, end]);
    });
    db.timeOff.forEach((t) => {
      if (t.staffId && t.staffId !== staffId) return;
      if (t.start < to && t.end > from) out.push([t.start, t.end]);
    });
    return out;
  }

  function canDo(member, serviceId) { return member.active !== false && member.services.includes(serviceId); }

  /**
   * Huecos de un día.
   * @returns [{ start, end, label, staffIds: [...] }]
   */
  function slotsForDay(db, { serviceId, staffId = 'any', date, excludeBookingId, now = Date.now() }) {
    const svc = db.services.find((s) => s.id === serviceId && s.active !== false);
    if (!svc) return [];
    const cfg = db.settings.booking;
    const day = U.startOfDay(date);
    const dayMs = day.getTime();
    const lastDay = U.addDays(U.startOfDay(now), cfg.maxDaysAhead).getTime();
    if (dayMs > lastDay) return [];
    const earliest = now + cfg.minNoticeMinutes * U.MIN;
    const wd = day.getDay();
    const businessRanges = toRanges(db.settings.business.hours[wd]);
    if (!businessRanges.length) return [];
    const dur = Number(svc.duration);
    const buf = bufferOf(db, serviceId);
    const step = cfg.slotStepMinutes || 15;
    const map = new Map();

    db.staff.filter((m) => canDo(m, serviceId) && (staffId === 'any' || m.id === staffId)).forEach((m) => {
      const shifts = intersect(businessRanges, toRanges(m.schedule[wd]));
      const occupied = busy(db, m.id, dayMs, dayMs + 86400000, excludeBookingId);
      shifts.forEach(([s, e]) => {
        for (let t = Math.ceil(s / step) * step; t + dur <= e; t += step) {
          const start = dayMs + t * U.MIN;
          if (start < earliest) continue;
          const end = start + dur * U.MIN;
          const endWithBuf = end + buf * U.MIN;
          // el margen tras la cita se respeta salvo que la cita termine justo al cierre del turno
          const clash = occupied.some(([bs, be]) => start < be && bs < (end >= dayMs + e * U.MIN ? end : endWithBuf));
          if (clash) continue;
          if (!map.has(start)) map.set(start, { start, end, label: U.fmtTime(start), staffIds: [] });
          map.get(start).staffIds.push(m.id);
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => a.start - b.start);
  }

  /** Revalidación justo antes de guardar (anti-duplicados). */
  function isFree(db, { serviceId, staffId, start, excludeBookingId, now }) {
    const slots = slotsForDay(db, { serviceId, staffId, date: new Date(start), excludeBookingId, now });
    return slots.some((s) => s.start === start && s.staffIds.includes(staffId));
  }

  /** Asigna profesional cuando la clienta elige "cualquiera": la que menos carga tenga ese día. */
  function pickStaff(db, staffIds, start) {
    const day = U.startOfDay(start).getTime();
    const load = (id) => db.bookings.filter((b) => b.staffId === id && BLOCKING.includes(b.status) && b.start >= day && b.start < day + 86400000)
      .reduce((acc, b) => acc + (b.end - b.start), 0);
    return staffIds.slice().sort((a, b) => load(a) - load(b))[0];
  }

  function monthAvailability(db, { serviceId, staffId, year, month, now = Date.now() }) {
    const res = {};
    const days = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
      const date = new Date(year, month, d);
      res[U.dateKey(date)] = slotsForDay(db, { serviceId, staffId, date, now }).length;
    }
    return res;
  }

  function nextAvailable(db, { serviceId, staffId = 'any', days = 21, now = Date.now() } = {}) {
    const services = serviceId ? [serviceId] : db.services.filter((s) => s.active !== false).map((s) => s.id);
    for (let i = 0; i <= days; i++) {
      const date = U.addDays(U.startOfDay(now), i);
      let best = null;
      services.forEach((sid) => {
        const s = slotsForDay(db, { serviceId: sid, staffId, date, now })[0];
        if (s && (!best || s.start < best.start)) best = Object.assign({ serviceId: sid }, s);
      });
      if (best) return best;
    }
    return null;
  }

  ORY.availability = { slotsForDay, isFree, pickStaff, monthAvailability, nextAvailable, canDo, BLOCKING };
})(window.ORY = window.ORY || {});
