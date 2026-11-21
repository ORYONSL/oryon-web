/* ==========================================================================
   Asistente de reserva
   Tratamiento → Profesional → Día y hora → Datos → Revisión → Confirmada
   También gestiona el modo "cambiar cita" (reutiliza los mismos pasos).
   ========================================================================== */
(function (ORY) {
  'use strict';
  const U = ORY.U, A = ORY.availability;
  const $ = (s, r = document) => r.querySelector(s);
  const STEPS = ['service', 'staff', 'time', 'details', 'review', 'done'];
  const TITLES = {
    service: 'Elige tu tratamiento', staff: '¿Con quién te apetece?', time: 'Día y hora',
    details: 'Tus datos', review: 'Revisa y confirma', done: '¡Reserva confirmada!'
  };
  const ICON_PREV = '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>';
  const ICON_NEXT = '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>';

  let S, el, lastFocus, busy = false;

  function reset() {
    const now = new Date();
    S = { step: 'service', dir: 1, mode: 'new', serviceId: null, staffId: null, date: null, slot: null,
      month: { y: now.getFullYear(), m: now.getMonth() },
      client: { name: '', phone: '', email: '', notes: '' }, consent: { privacy: false, marketing: false },
      website: '', booking: null, original: null, error: '' };
    try { const saved = JSON.parse(localStorage.getItem('nacar.client') || 'null'); if (saved) Object.assign(S.client, saved); } catch (e) { /* sin almacenamiento */ }
  }

  const db = () => ORY.store.snapshot();
  const svc = () => db().services.find((s) => s.id === S.serviceId);
  const staffName = (id) => (db().staff.find((m) => m.id === id) || {}).name;

  /* ---------------- abrir / cerrar ---------------- */
  function open(opts = {}) {
    reset();
    if (opts.serviceId && db().services.some((s) => s.id === opts.serviceId && s.active !== false)) {
      S.serviceId = opts.serviceId; S.step = 'staff';
    }
    if (opts.staffId && S.serviceId) { S.staffId = opts.staffId; S.step = 'time'; }
    if (opts.start && S.serviceId) { S.date = U.startOfDay(opts.start); S.slot = null; }
    show();
  }

  function openReschedule(b) {
    reset();
    S.mode = 'reschedule'; S.original = b;
    S.serviceId = b.serviceId; S.staffId = b.staffId; S.step = 'time';
    S.client = Object.assign({}, b.client);
    show();
  }

  function show() {
    lastFocus = document.activeElement;
    el.classList.add('is-open'); el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lock');
    $('[data-bk-kicker]', el).textContent = S.mode === 'reschedule' ? 'Cambiar cita · ' + S.original.code : 'Nueva cita';
    if (S.step === 'time') focusDefaultDate();
    render();
    setTimeout(() => $('[data-bk-body]', el).focus({ preventScroll: true }), 50);
  }

  function close() {
    el.classList.remove('is-open'); el.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lock');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function go(step) {
    S.dir = STEPS.indexOf(step) >= STEPS.indexOf(S.step) ? 1 : -1;
    S.step = step; S.error = '';
    if (step === 'time' && !S.date) focusDefaultDate();
    render();
    $('[data-bk-body]', el).scrollTop = 0;
  }

  function back() {
    const order = S.mode === 'reschedule' ? ['time', 'review'] : STEPS;
    const i = order.indexOf(S.step);
    if (i > 0) go(order[i - 1]);
  }

  function focusDefaultDate() {
    const n = A.nextAvailable(db(), { serviceId: S.serviceId, staffId: S.staffId || 'any', days: db().settings.booking.maxDaysAhead });
    const d = S.date || (n ? U.startOfDay(n.start) : U.startOfDay(Date.now()));
    S.date = d; S.month = { y: d.getFullYear(), m: d.getMonth() };
  }

  /* ---------------- render ---------------- */
  function render() {
    const body = $('[data-bk-body]', el), foot = $('[data-bk-foot]', el);
    $('[data-bk-title]', el).textContent = S.mode === 'reschedule' && S.step === 'done' ? 'Cita actualizada' : TITLES[S.step];
    const order = S.mode === 'reschedule' ? ['time', 'review', 'done'] : STEPS;
    $('[data-bk-bar]', el).style.width = ((order.indexOf(S.step) + 1) / order.length * 100) + '%';
    $('[data-bk-back]', el).hidden = order.indexOf(S.step) <= 0 || S.step === 'done';
    body.innerHTML = '<div class="step-anim' + (S.dir < 0 ? ' step-anim--back' : '') + '">' + views[S.step]() + '</div>';
    foot.innerHTML = footer();
    bind(body, foot);
  }

  function summaryLine() {
    const s = svc();
    if (!s) return '';
    const parts = [S.staffId && S.staffId !== 'any' ? staffName(S.staffId) : (S.step !== 'service' && S.step !== 'staff' ? 'Primera disponible' : '')];
    if (S.slot) parts.push(U.cap(U.fmtDateShort(S.slot.start)) + ' · ' + S.slot.label);
    return `<div class="foot-summary"><b>${U.esc(s.name)}</b>${parts.filter(Boolean).map(U.esc).join(' · ') || U.fmtDuration(s.duration)} · ${s.priceFrom ? 'desde ' : ''}${U.money(s.price)}</div>`;
  }

  function footer() {
    switch (S.step) {
      case 'service': return '';
      case 'staff': return summaryLine();
      case 'time': return summaryLine() + `<button class="btn btn--rose" data-next ${S.slot ? '' : 'disabled'}>Continuar ${ICON_NEXT}</button>`;
      case 'details': return summaryLine() + `<button class="btn btn--rose" data-next>Revisar ${ICON_NEXT}</button>`;
      case 'review': return `<button class="btn btn--ghost" data-bk-back-foot>Atrás</button><button class="btn btn--rose btn--lg" data-confirm style="flex:1">${S.mode === 'reschedule' ? 'Confirmar cambio' : 'Confirmar reserva'}</button>`;
      case 'done': return `<button class="btn btn--ghost" data-close-drawer style="flex:1">Cerrar</button>`;
    }
    return '';
  }

  const views = {
    service() {
      const d = db();
      return ORY.config.categories.map((c) => {
        const list = d.services.filter((s) => s.cat === c.id && s.active !== false);
        if (!list.length) return '';
        return `<div class="bk-group"><h4>${U.esc(c.name)}</h4>` + list.map((s) => `
          <button class="opt" data-service="${s.id}" aria-pressed="${S.serviceId === s.id}">
            <img class="opt-img" src="${U.esc(s.image)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">
            <span class="opt-main"><b>${U.esc(s.name)}</b><span>${U.fmtDuration(s.duration)}</span></span>
            <span class="opt-price">${s.priceFrom ? '<small>desde</small>' : ''}${U.money(s.price)}</span>
          </button>`).join('') + '</div>';
      }).join('');
    },

    staff() {
      const d = db(), s = svc();
      const team = d.staff.filter((m) => A.canDo(m, s.id));
      const nextTxt = (id) => {
        const n = A.nextAvailable(d, { serviceId: s.id, staffId: id, days: 21 });
        return n ? `Próximo hueco: <span class="t">${U.esc(U.fmtDateShort(n.start))}, ${n.label}</span>` : 'Sin huecos en las próximas 3 semanas';
      };
      return `<div class="bk-group"><h4>Profesional</h4>
        <button class="opt opt--any" data-staff="any" aria-pressed="${S.staffId === 'any'}">
          <span class="avatar">✦</span>
          <span class="opt-main"><b>Sin preferencia</b><span>${nextTxt('any')}</span></span>
        </button>` +
        team.map((m) => `
        <button class="opt" data-staff="${m.id}" aria-pressed="${S.staffId === m.id}">
          <span class="avatar" style="--h:${m.hue}">${U.esc(m.name[0])}</span>
          <span class="opt-main"><b>${U.esc(m.name)}</b><span>${U.esc(m.role)}<br>${nextTxt(m.id)}</span></span>
        </button>`).join('') + '</div>';
    },

    time() {
      const d = db();
      const { y, m } = S.month;
      const avail = A.monthAvailability(d, { serviceId: S.serviceId, staffId: S.staffId || 'any', year: y, month: m });
      const first = new Date(y, m, 1);
      const offset = (first.getDay() + 6) % 7; // semana empieza en lunes
      const today = U.startOfDay(Date.now());
      const maxDay = U.addDays(today, d.settings.booking.maxDaysAhead);
      const canPrev = new Date(y, m, 1) > today;
      const canNext = new Date(y, m + 1, 1) <= maxDay;
      let cells = ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((x) => `<div class="cal-dow">${x}</div>`).join('');
      for (let i = 0; i < offset; i++) cells += '<span></span>';
      const days = new Date(y, m + 1, 0).getDate();
      for (let i = 1; i <= days; i++) {
        const date = new Date(y, m, i);
        const k = U.dateKey(date), n = avail[k] || 0;
        const sel = S.date && U.dateKey(S.date) === k;
        const cls = ['cal-day', n ? 'has' : '', n && n < 5 ? 'few' : '', U.sameDay(date, today) ? 'today' : ''].join(' ');
        cells += `<button class="${cls}" data-date="${k}" ${n ? '' : 'disabled'} aria-pressed="${sel}" aria-label="${U.esc(U.fmtDate(date))}${n ? ', ' + n + ' huecos' : ', sin disponibilidad'}">${i}</button>`;
      }
      const title = U.cap(new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(first));
      return `
        <div class="cal">
          <div class="cal-head"><b>${title}</b>
            <div class="cal-nav"><button data-month="-1" ${canPrev ? '' : 'disabled'} aria-label="Mes anterior">${ICON_PREV}</button><button data-month="1" ${canNext ? '' : 'disabled'} aria-label="Mes siguiente">${ICON_NEXT}</button></div>
          </div>
          <div class="cal-grid">${cells}</div>
          <div class="cal-legend"><span><i></i>Disponible</span><span><i class="few"></i>Últimos huecos</span></div>
        </div>
        <div class="times" data-times>${timesHTML()}</div>`;
    },

    details() {
      const c = S.client;
      return `
        <form class="form" data-details novalidate>
          ${S.error ? `<div class="note note--err" role="alert">${U.esc(S.error)}</div>` : ''}
          <div class="field"><label for="f-name">Nombre y apellido</label><input id="f-name" name="name" autocomplete="name" required value="${U.esc(c.name)}"><span class="err"></span></div>
          <div class="row2">
            <div class="field"><label for="f-phone">Teléfono</label><input id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required value="${U.esc(c.phone)}" placeholder="600 000 000"><span class="err"></span></div>
            <div class="field"><label for="f-email">Email</label><input id="f-email" name="email" type="email" inputmode="email" autocomplete="email" required value="${U.esc(c.email)}"><span class="err"></span></div>
          </div>
          <div class="field"><label for="f-notes">¿Algo que debamos saber? <span class="small">(opcional)</span></label><textarea id="f-notes" name="notes" maxlength="500" placeholder="Alergias, largo actual del cabello, ocasión especial…">${U.esc(c.notes || '')}</textarea></div>
          <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
          <label class="check"><input type="checkbox" name="privacy" ${S.consent.privacy ? 'checked' : ''} required>
            <span>He leído la <button type="button" class="link-btn" data-legal="privacidad" style="padding:0;font-size:inherit">política de privacidad</button> y acepto que se usen mis datos para gestionar la cita y enviarme la confirmación y los recordatorios.</span></label>
          <label class="check"><input type="checkbox" name="marketing" ${S.consent.marketing ? 'checked' : ''}>
            <span>Quiero recibir novedades y promociones (opcional, puedes darte de baja cuando quieras).</span></label>
          <label class="check"><input type="checkbox" name="remember" ${localStorageHas() ? 'checked' : ''}>
            <span>Recordar mis datos en este dispositivo para la próxima vez.</span></label>
        </form>`;
    },

    review() {
      const s = svc(), d = db();
      const who = S.staffId && S.staffId !== 'any' ? staffName(S.staffId) : 'Primera profesional disponible';
      const cut = d.settings.booking.cancelCutoffHours;
      return `
        <div class="summary">
          <div class="summary-img" style="background-image:url('${U.esc(s.image)}')"></div>
          <dl>
            <dt>Tratamiento</dt><dd>${U.esc(s.name)}</dd>
            <dt>Profesional</dt><dd>${U.esc(who)}</dd>
            <dt>Fecha</dt><dd>${U.esc(U.cap(U.fmtDate(S.slot.start)))}</dd>
            <dt>Hora</dt><dd>${S.slot.label} – ${U.fmtTime(S.slot.end)}</dd>
            <dt>Precio</dt><dd>${s.priceFrom ? 'desde ' : ''}${U.money(s.price)} <span class="small">· pago en el salón</span></dd>
            <dt>A nombre de</dt><dd>${U.esc(S.client.name)}</dd>
          </dl>
        </div>
        ${S.mode === 'reschedule' ? `<p class="note" style="margin-top:14px">Tu cita actual (${U.esc(U.fmtDateShort(S.original.start))}, ${U.fmtTime(S.original.start)}) se liberará al confirmar.</p>` : ''}
        <p class="small" style="margin-top:14px">Puedes cambiar o cancelar online hasta ${cut} h antes. Si no puedes venir, avísanos: así otra clienta podrá aprovechar el hueco.</p>
        ${S.error ? `<div class="note note--err" role="alert">${U.esc(S.error)}</div>` : ''}`;
    },

    done() {
      const b = S.booking, s = svc(), d = db();
      const integ = d.settings.integrations;
      const demo = ORY.store.mode === 'local';
      const remList = d.outbox.filter((m) => m.bookingId === b.id && m.template === 'reminder' && m.status !== 'void')
        .map((m) => U.fmtDateShort(m.scheduledFor) + ' ' + U.fmtTime(m.scheduledFor));
      const rem = remList.length ? 'programados: ' + remList.join(' y ') + '.' : 'no hacen falta: tu cita es muy pronto.';
      return `
        <div class="done">
          <div class="done-pearl"><svg viewBox="0 0 110 110"><circle cx="55" cy="55" r="50"/><path d="M36 56l13 13 25-27"/></svg></div>
          <h3>Te esperamos, ${U.esc(b.client.name.split(' ')[0])}.</h3>
          <p>${U.esc(s.name)} con <b>${U.esc(staffName(b.staffId))}</b><br>${U.esc(U.cap(U.fmtDate(b.start)))} a las <b>${U.fmtTime(b.start)}</b></p>
          <div class="done-code">Código ${U.esc(b.code)} <button data-copy="${U.esc(b.code)}">Copiar</button></div>
          <div class="done-actions">
            <button class="btn btn--rose" data-ics>Añadir a mi calendario</button>
            <a class="btn btn--ghost" target="_blank" rel="noopener" href="${U.esc(calData(b).gcal)}">Google Calendar</a>
          </div>
          <ul class="next-steps">
            <li>✉︎ <span><b>Confirmación</b> a ${U.esc(b.client.email)}. ${!integ.email.configured && demo ? '<span class="tag">Demo</span> Se enviará en cuanto se conecte el proveedor de email.' : ''}</span></li>
            <li>⏰ <span><b>Recordatorios</b> ${U.esc(rem)} Incluyen enlace para confirmar asistencia. ${remList.length && !integ.whatsapp.configured && demo ? '<span class="tag">Demo</span>' : ''}</span></li>
            <li>↺ <span><b>¿Cambio de planes?</b> Usa “Mi reserva” con tu código hasta ${d.settings.booking.cancelCutoffHours} h antes.</span></li>
          </ul>
        </div>`;
    }
  };

  function localStorageHas() { try { return !!localStorage.getItem('nacar.client'); } catch (e) { return false; } }

  function timesHTML() {
    if (!S.date) return '';
    const slots = A.slotsForDay(db(), { serviceId: S.serviceId, staffId: S.staffId || 'any', date: S.date, excludeBookingId: S.original && S.original.id });
    if (S.slot && !slots.some((x) => x.start === S.slot.start)) {
      S.slot = null;
      toast('Ese hueco acaba de reservarse. Elige otro, por favor.', true);
    }
    if (!slots.length) return `<div class="empty"><b>Sin huecos este día</b>Prueba con otra fecha marcada en el calendario.</div>`;
    const group = (name, list) => list.length ? `<div class="bk-group"><h4><span>${name}</span><span>${list.length} ${list.length === 1 ? 'hueco' : 'huecos'}</span></h4><div class="times-grid">${list.map((x) =>
      `<button class="time" data-slot="${x.start}" aria-pressed="${S.slot && S.slot.start === x.start}">${x.label}</button>`).join('')}</div></div>` : '';
    const morning = slots.filter((x) => new Date(x.start).getHours() < 14);
    const afternoon = slots.filter((x) => new Date(x.start).getHours() >= 14);
    return `<p class="small" style="margin:0 0 12px">${U.esc(U.cap(U.fmtDate(S.date)))} · ${U.fmtDuration(svc().duration)}</p>` + group('Mañana', morning) + group('Tarde', afternoon);
  }

  function calData(b) {
    const d = db(), s = d.services.find((x) => x.id === b.serviceId);
    const info = {
      uid: b.id + '@nacar', start: b.start, end: b.end,
      title: `${s.name} · ${d.settings.business.name}`,
      description: `Con ${staffName(b.staffId)}. Código ${b.code}. Gestiona tu cita: ${ORY.notify.context(d, b).manageUrl}`,
      location: d.settings.business.address
    };
    return { info, gcal: U.googleCalUrl(info) };
  }

  /* ---------------- eventos ---------------- */
  function bind(body, foot) {
    body.querySelectorAll('[data-service]').forEach((b) => b.addEventListener('click', () => {
      if (S.serviceId !== b.dataset.service) { S.staffId = null; S.date = null; S.slot = null; }
      S.serviceId = b.dataset.service;
      b.setAttribute('aria-pressed', 'true');
      setTimeout(() => go('staff'), 180);
    }));
    body.querySelectorAll('[data-staff]').forEach((b) => b.addEventListener('click', () => {
      if (S.staffId !== b.dataset.staff) { S.slot = null; S.date = null; }
      S.staffId = b.dataset.staff;
      b.setAttribute('aria-pressed', 'true');
      setTimeout(() => go('time'), 180);
    }));
    body.querySelectorAll('[data-month]').forEach((b) => b.addEventListener('click', () => {
      const d = new Date(S.month.y, S.month.m + Number(b.dataset.month), 1);
      S.month = { y: d.getFullYear(), m: d.getMonth() };
      render();
    }));
    body.querySelectorAll('[data-date]').forEach((b) => b.addEventListener('click', () => {
      S.date = U.fromKey(b.dataset.date); S.slot = null;
      body.querySelectorAll('[data-date]').forEach((x) => x.setAttribute('aria-pressed', x === b));
      refreshTimes();
      foot.innerHTML = footer(); bindFoot(foot);
      const t = $('[data-times]', body); if (t && innerWidth < 900) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
    bindTimes(body);
    const form = $('[data-details]', body);
    if (form) {
      form.addEventListener('submit', (e) => { e.preventDefault(); submitDetails(form); });
      form.querySelectorAll('input').forEach((i) => i.addEventListener('blur', () => validateField(i)));
    }
    body.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Copiado'; } catch (e) { b.textContent = b.dataset.copy; }
    }));
    const ics = $('[data-ics]', body);
    if (ics) ics.addEventListener('click', () => U.download('cita-' + S.booking.code + '.ics', U.ics(calData(S.booking).info), 'text/calendar'));
    bindFoot(foot);
  }

  function bindTimes(root) {
    root.querySelectorAll('[data-slot]').forEach((b) => b.addEventListener('click', () => {
      const start = Number(b.dataset.slot);
      const slots = A.slotsForDay(db(), { serviceId: S.serviceId, staffId: S.staffId || 'any', date: S.date, excludeBookingId: S.original && S.original.id });
      S.slot = slots.find((x) => x.start === start) || null;
      root.querySelectorAll('[data-slot]').forEach((x) => x.setAttribute('aria-pressed', x === b));
      const foot = $('[data-bk-foot]', el); foot.innerHTML = footer(); bindFoot(foot);
    }));
  }

  function refreshTimes() {
    const t = $('[data-times]', el);
    if (!t) return;
    t.innerHTML = timesHTML();
    bindTimes(t);
  }

  function bindFoot(foot) {
    const next = $('[data-next]', foot);
    if (next) next.addEventListener('click', () => {
      if (S.step === 'time' && S.slot) go(S.mode === 'reschedule' ? 'review' : 'details');
      else if (S.step === 'details') submitDetails($('[data-details]', el));
    });
    const b = $('[data-bk-back-foot]', foot); if (b) b.addEventListener('click', back);
    const c = $('[data-confirm]', foot); if (c) c.addEventListener('click', () => confirm(c));
    const x = $('[data-close-drawer]', foot); if (x) x.addEventListener('click', close);
  }

  function validateField(i) {
    let msg = '';
    if (i.name === 'name' && i.value.trim().length < 2) msg = 'Escribe tu nombre.';
    if (i.name === 'phone' && !U.validPhone(i.value)) msg = 'Revisa el teléfono (9 dígitos o formato internacional).';
    if (i.name === 'email' && !U.validEmail(i.value)) msg = 'Revisa el email.';
    const f = i.closest('.field');
    if (f) { f.classList.toggle('invalid', !!msg); f.querySelector('.err').textContent = msg; }
    return !msg;
  }

  function submitDetails(form) {
    const fd = new FormData(form);
    const okFields = ['name', 'phone', 'email'].map((n) => validateField(form.elements[n])).every(Boolean);
    S.client = { name: String(fd.get('name')).trim(), phone: String(fd.get('phone')).trim(), email: String(fd.get('email')).trim(), notes: String(fd.get('notes') || '').trim() };
    S.consent = { privacy: !!fd.get('privacy'), marketing: !!fd.get('marketing') };
    S.website = String(fd.get('website') || '');
    try {
      if (fd.get('remember')) localStorage.setItem('nacar.client', JSON.stringify({ name: S.client.name, phone: S.client.phone, email: S.client.email }));
      else localStorage.removeItem('nacar.client');
    } catch (e) { /* almacenamiento bloqueado */ }
    if (!okFields) { const bad = form.querySelector('.invalid input'); if (bad) bad.focus(); return; }
    if (!S.consent.privacy) { S.error = 'Para reservar necesitamos que aceptes la política de privacidad.'; render(); return; }
    go('review');
  }

  async function confirm(btn) {
    if (busy) return;
    busy = true; btn.classList.add('is-busy'); btn.textContent = S.mode === 'reschedule' ? 'Guardando…' : 'Reservando…';
    try {
      if (S.mode === 'reschedule') {
        S.booking = await ORY.store.rescheduleBooking(S.original.id, { start: S.slot.start, staffId: S.staffId || 'any', by: 'clienta' });
      } else {
        S.booking = await ORY.store.createBooking({
          serviceId: S.serviceId, staffId: S.staffId || 'any', start: S.slot.start,
          client: S.client, notes: S.client.notes, consent: S.consent, website: S.website, source: 'web'
        });
      }
      try { localStorage.setItem('nacar.lastBooking', S.booking.code); } catch (e) { /* noop */ }
      go('done');
    } catch (err) {
      S.error = err.message || 'No se ha podido completar. Inténtalo de nuevo.';
      if (err.code === 'taken') { S.slot = null; go('time'); toast(S.error, true); }
      else if (err.code === 'invalid' || err.code === 'consent') go('details');
      else render();
    } finally { busy = false; }
  }

  function toast(msg, isErr) { if (ORY.ui && ORY.ui.toast) ORY.ui.toast(msg, isErr); }

  /* ---------------- init ---------------- */
  function init() {
    el = $('[data-drawer]');
    reset();
    el.addEventListener('click', (e) => { if (e.target.closest('[data-close-drawer]') && !e.target.closest('.drawer-foot')) close(); });
    $('[data-bk-back]', el).addEventListener('click', back);
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && el.classList.contains('is-open')) close(); });
    // Disponibilidad en vivo: si otra pestaña/clienta reserva, los huecos se actualizan solos.
    ORY.store.subscribe(() => {
      if (!el.classList.contains('is-open')) return;
      if (S.step === 'time') {
        const t = $('[data-times]', el);
        if (t) { refreshTimes(); const foot = $('[data-bk-foot]', el); foot.innerHTML = footer(); bindFoot(foot); }
      }
    });
  }

  ORY.booking = { init, open, openReschedule, close };
})(window.ORY = window.ORY || {});
