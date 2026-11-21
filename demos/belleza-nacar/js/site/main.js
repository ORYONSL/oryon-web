/* ==========================================================================
   Web pública: render de contenido dinámico + interacción general
   ========================================================================== */
(function (ORY) {
  'use strict';
  const U = ORY.U, A = ORY.availability;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const db = () => ORY.store.snapshot();
  const STAR = '<svg viewBox="0 0 24 24"><path fill="#C39A55" d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z"/></svg>';
  const STAR_EMPTY = '<svg viewBox="0 0 24 24"><path fill="none" stroke="#D8BC8B" d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z"/></svg>';
  const G_ICON = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.8-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.8 6C6.6 42.6 14.6 48 24 48z"/></svg>';

  /* ---------------- UI helpers ---------------- */
  const ui = {
    toast(msg, err) {
      const t = $('[data-toast]');
      t.textContent = msg; t.classList.toggle('err', !!err); t.classList.add('is-on');
      clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('is-on'), 4200);
    },
    legal(key) {
      const d = $('[data-legal-dlg]');
      $('[data-legal-body]', d).innerHTML = ORY.legal[key] ? ORY.legal[key]() : '';
      if (!d.open) d.showModal();
    }
  };
  ORY.ui = ui;

  /* ---------------- Servicios ---------------- */
  let currentCat = 'all';
  function renderServices() {
    const d = db();
    const cats = ORY.config.categories.filter((c) => d.services.some((s) => s.cat === c.id && s.active !== false));
    $('[data-chips]').innerHTML = [{ id: 'all', name: 'Todo' }].concat(cats).map((c) =>
      `<button class="chip" role="tab" data-cat="${c.id}" aria-selected="${c.id === currentCat}">${U.esc(c.name)}</button>`).join('');
    const list = d.services.filter((s) => s.active !== false);
    const catName = (id) => (ORY.config.categories.find((c) => c.id === id) || {}).name || '';
    $('[data-track]').innerHTML = list.map((s, i) => `
      <article class="svc${currentCat !== 'all' && s.cat !== currentCat ? ' is-out' : ''}" data-cat="${s.cat}">
        <div class="svc-media" data-cursor="Reservar" data-book-service="${s.id}">
          <img src="${U.esc(s.image)}" alt="${U.esc(s.name)}" loading="lazy" onerror="this.remove()">
          <span class="svc-num">${String(i + 1).padStart(2, '0')}</span>
          <span class="svc-cat">${U.esc(catName(s.cat))}</span>
        </div>
        <div class="svc-body">
          <h3>${U.esc(s.name)}</h3>
          <p>${U.esc(s.desc)}</p>
          <div class="svc-meta">
            <div class="svc-facts"><b>${s.priceFrom ? '<small>desde</small>' : ''}${U.money(s.price)}</b><span>${U.fmtDuration(s.duration)}</span></div>
            <button class="btn btn--sm btn--rose" data-book-service="${s.id}">Reservar</button>
          </div>
        </div>
      </article>`).join('') + `
      <div class="svc-end"><div><p>¿No sabes qué elegir?</p><a class="btn btn--ghost btn--sm" data-wa target="_blank" rel="noopener">Pregúntanos por WhatsApp</a></div></div>`;
    applyContactLinks();
    if (ORY.fx && ORY.fx.relayout) ORY.fx.relayout();
  }

  /* ---------------- Equipo + disponibilidad ---------------- */
  function renderTeam() {
    const d = db();
    const names = (ids) => ids.map((id) => (d.services.find((s) => s.id === id) || {}).name).filter(Boolean);
    $('[data-team]').innerHTML = d.staff.filter((m) => m.active !== false).map((m) => `
      <article class="member reveal">
        <span class="avatar avatar--lg" style="--h:${m.hue}">${U.esc(m.name[0])}</span>
        <h3>${U.esc(m.name)}</h3>
        <p>${U.esc(m.role)}</p>
        <div class="tags">${names(m.services).slice(0, 3).map((n) => `<span>${U.esc(n)}</span>`).join('')}</div>
        <button class="btn btn--ghost btn--sm" data-book-staff="${m.id}">Reservar con ${U.esc(m.name)}</button>
      </article>`).join('');
    $$('[data-team] .reveal').forEach((e) => ORY.fx.observe && ORY.fx.observe(e));
  }

  function renderLive() {
    const d = db();
    const n = A.nextAvailable(d, {});
    const next = $('[data-next-slot]');
    if (next) next.textContent = n ? (U.sameDay(n.start, Date.now()) ? 'hoy' : U.sameDay(n.start, U.addDays(Date.now(), 1)) ? 'mañana' : U.fmtDateShort(n.start)) + ', ' + n.label : 'consultar';
    const team = $('[data-team-next]');
    if (team) team.innerHTML = d.staff.filter((m) => m.active !== false).map((m) => {
      let best = null;
      m.services.forEach((sid) => {
        const s = A.nextAvailable(d, { serviceId: sid, staffId: m.id, days: 14 });
        if (s && (!best || s.start < best.start)) best = Object.assign({ serviceId: sid }, s);
      });
      return `<button class="next-card" ${best ? `data-book-next="${m.id}|${best.serviceId}|${best.start}"` : `data-book-staff="${m.id}"`}>
        <span class="avatar" style="--h:${m.hue}">${U.esc(m.name[0])}</span>
        <span><b>${U.esc(m.name)}</b><span>${best ? `<span class="t">${U.esc(U.fmtDateShort(best.start))} · ${best.label}</span>` : 'Agenda completa'}</span></span>
      </button>`;
    }).join('');
    // Contadores ORYON (datos reales de esta demo)
    const live = $('[data-oryon-live]');
    if (live) {
      const now = Date.now();
      const active = d.bookings.filter((b) => b.status !== 'cancelled');
      const web = d.bookings.filter((b) => b.source === 'web').length;
      const pct = d.bookings.length ? Math.round(web / d.bookings.length * 100) : 0;
      const reminders = d.outbox.filter((m) => m.template === 'reminder' && m.scheduledFor > now && m.status !== 'void').length;
      const reviews = d.outbox.filter((m) => m.template === 'review_request' && m.status !== 'void').length;
      live.innerHTML = `
        <div><b>${active.length}</b><span>citas en la agenda de esta demo (incl. ejemplos)</span></div>
        <div><b>${pct}%</b><span>reservadas online, sin llamadas</span></div>
        <div><b>${reminders}</b><span>recordatorios programados</span></div>
        <div><b>${reviews}</b><span>solicitudes de reseña</span></div>`;
    }
  }

  /* ---------------- Reseñas (Google) ---------------- */
  async function renderReviews() {
    const d = db();
    const url = U.reviewUrl(d.settings);
    const endpoint = d.settings.reviews.reviewsEndpoint;
    const card = $('[data-rating]'), list = $('[data-reviews]');
    const leaveBtn = url
      ? `<a class="btn btn--rose" href="${U.esc(url)}" target="_blank" rel="noopener">Dejar una reseña en Google</a>`
      : `<button class="btn btn--rose" data-review-help>Dejar una reseña en Google</button>`;
    const honesty = `<div class="honesty"><svg viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>
      <span>Pedimos opinión a <b>todas</b> nuestras clientas después de su visita, sin filtrar. Publicamos únicamente reseñas reales del Perfil de Empresa de Google, tal como aparecen allí.</span></div>`;

    let data = null;
    if (endpoint) {
      list.innerHTML = '<div class="loading-line">Cargando reseñas de Google…</div>';
      try {
        const r = await fetch(endpoint, { headers: { Accept: 'application/json' } });
        if (!r.ok) throw new Error(r.status);
        data = await r.json();
      } catch (e) { data = { error: true }; }
    }

    if (data && !data.error && data.rating) {
      const full = Math.round(data.rating);
      card.innerHTML = `<div class="g-badge">${G_ICON} Reseñas de Google</div>
        <div class="rating-score">${Number(data.rating).toFixed(1).replace('.', ',')}</div>
        <div class="stars" aria-label="${data.rating} de 5">${STAR.repeat(full)}${STAR_EMPTY.repeat(5 - full)}</div>
        <p>${data.total} opiniones verificadas en Google</p>${leaveBtn}
        ${data.url ? `<a class="link-btn" href="${U.esc(data.url)}" target="_blank" rel="noopener">Ver todas en Google</a>` : ''}`;
      list.innerHTML = (data.reviews || []).map((r) => `
        <article class="review">
          <div class="stars">${STAR.repeat(r.rating)}${STAR_EMPTY.repeat(5 - r.rating)}</div>
          <blockquote>${U.esc(r.text)}</blockquote>
          <footer><span class="avatar" style="width:34px;height:34px;font-size:15px">${U.esc(U.initials(r.author))}</span><span><b>${U.esc(r.author)}</b><br>${U.esc(r.relativeTime || '')} · Google</span></footer>
        </article>`).join('') + honesty;
    } else {
      card.innerHTML = `<div class="g-badge">${G_ICON} Perfil de Empresa de Google</div>
        <div class="rating-score" aria-label="Sin datos">—</div>
        <div class="stars">${STAR_EMPTY.repeat(5)}</div>
        <p>${data && data.error ? 'No hemos podido cargar las reseñas ahora mismo.' : 'Aquí se mostrará automáticamente la puntuación media real del salón en Google.'}</p>${leaveBtn}`;
      const testimonials = (d.testimonials || []).filter((t) => t.published);
      list.innerHTML = (testimonials.length ? testimonials.map((t) => `
        <article class="review">
          <blockquote>${U.esc(t.text)}</blockquote>
          <footer><span class="avatar" style="width:34px;height:34px;font-size:15px">${U.esc(U.initials(t.author))}</span><span><b>${U.esc(t.author)}</b><br>Testimonio recogido en el salón, publicado con su permiso</span></footer>
        </article>`).join('') : [1, 2].map(() => `
        <article class="review review--ghost" aria-hidden="true"><span class="bar"></span><span class="bar"></span><span class="bar"></span>
        <small>Espacio para una reseña real de Google</small></article>`).join('')) + honesty;
    }
  }

  function reviewHelp() {
    const d = $('[data-legal-dlg]');
    $('[data-legal-body]', d).innerHTML = `<h2>Enlace de reseñas pendiente</h2>
      <p>Este botón abre el formulario oficial de reseñas del <b>Perfil de Empresa de Google</b> del salón.</p>
      <p>En la demo aún no hay ningún perfil conectado. Para activarlo, abre el panel › <b>Reseñas</b> y pega el enlace que Google proporciona en “Pedir reseñas” (o el Place ID).</p>
      <div class="dlg-actions"><a class="btn btn--rose" href="admin.html#resenas" target="_blank" rel="noopener">Abrir el panel</a></div>`;
    d.showModal();
  }

  /* Página de aterrizaje para QR del salón y mensajes post-visita: ?opinion */
  function reviewLanding() {
    const url = U.reviewUrl(db().settings);
    const d = $('[data-legal-dlg]');
    $('[data-legal-body]', d).innerHTML = `<h2>¿Qué tal tu visita?</h2>
      <p>Gracias por venir a ${U.esc(db().settings.business.name)}. Nos encantaría conocer tu opinión sincera, sea cual sea: nos ayuda a mejorar y a que otras personas nos encuentren.</p>
      <div class="dlg-actions">${url ? `<a class="btn btn--rose btn--lg" href="${U.esc(url)}" target="_blank" rel="noopener">Escribir mi reseña en Google</a>` : '<button class="btn btn--rose" data-review-help>Escribir mi reseña en Google</button>'}</div>`;
    d.showModal();
  }

  /* ---------------- Contacto ---------------- */
  const SOC = {
    instagram: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24"><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.5 2.6 2.4 4.5 5 4.8"/></svg>',
    facebook: '<svg viewBox="0 0 24 24"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/></svg>'
  };
  const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  function applyContactLinks() {
    const b = db().settings.business;
    $$('[data-wa]').forEach((a) => { a.href = U.waLink(b.whatsapp, `Hola ${b.name}, tengo una consulta:`); });
    $$('[data-call]').forEach((a) => { a.href = 'tel:' + b.phone.replace(/\s/g, ''); });
  }

  function openNow(hours) {
    const now = new Date(), wd = now.getDay(), min = now.getHours() * 60 + now.getMinutes();
    return (hours[wd] || []).some(([s, e]) => min >= U.toMin(s) && min < U.toMin(e));
  }

  function renderContact() {
    const b = db().settings.business;
    $('[data-contact]').innerHTML = `
      <li><span>Dirección</span><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}" target="_blank" rel="noopener">${U.esc(b.address)}</a></li>
      <li><span>Teléfono</span><a href="tel:${U.esc(b.phone.replace(/\s/g, ''))}">${U.esc(b.phone)}</a></li>
      <li><span>WhatsApp</span><a data-wa target="_blank" rel="noopener">Escríbenos</a></li>
      <li><span>Email</span><a href="mailto:${U.esc(b.email)}">${U.esc(b.email)}</a></li>`;
    $('[data-socials]').innerHTML = Object.entries(b.social || {}).filter(([, v]) => v).map(([k, v]) =>
      `<a href="${U.esc(v)}" target="_blank" rel="noopener" aria-label="${k}">${SOC[k] || ''}</a>`).join('');
    const wd = new Date().getDay();
    const open = openNow(b.hours);
    $('[data-hours]').innerHTML = `<div class="hours-head"><h3>Horario</h3><span class="status ${open ? '' : 'status--closed'}"><i></i>${open ? 'Abierto ahora' : 'Cerrado ahora'}</span></div>
      <table>${[1, 2, 3, 4, 5, 6, 0].map((i) => `<tr class="${i === wd ? 'today' : ''}"><td>${DAYS[i]}</td><td>${(b.hours[i] || []).length ? b.hours[i].map(([s, e]) => s + ' – ' + e).join(', ') : 'Cerrado'}</td></tr>`).join('')}</table>
      <p class="small" style="margin:14px 0 0">La reserva online está abierta 24 h, también cuando el salón está cerrado.</p>`;
    $('[data-map-link]').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(b.address);
    applyContactLinks();
  }

  function loadMap() {
    const m = $('[data-map]');
    if (m.querySelector('iframe')) return;
    const q = db().settings.business.mapQuery || db().settings.business.address;
    const f = document.createElement('iframe');
    f.title = 'Mapa de ubicación'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade';
    f.src = 'https://www.google.com/maps?q=' + encodeURIComponent(q) + '&output=embed';
    m.innerHTML = ''; m.appendChild(f);
  }

  /* ---------------- Cookies ---------------- */
  function consent() {
    let v = null;
    try { v = localStorage.getItem('nacar.consent'); } catch (e) { /* noop */ }
    const banner = $('[data-cookie]');
    if (!v) setTimeout(() => { banner.hidden = false; }, 2600);
    if (v === 'all') loadMap();
    $$('[data-cookie-choice]').forEach((b) => b.addEventListener('click', () => {
      try { localStorage.setItem('nacar.consent', b.dataset.cookieChoice); } catch (e) { /* noop */ }
      banner.hidden = true;
      if (b.dataset.cookieChoice === 'all') loadMap();
    }));
    $$('[data-cookie-settings]').forEach((b) => b.addEventListener('click', () => { banner.hidden = false; }));
  }

  /* ---------------- Gestionar reserva ---------------- */
  const manage = {
    dlg: null, booking: null,
    open(code) {
      this.dlg = $('[data-manage]');
      this.booking = null;
      let last = '';
      try { last = localStorage.getItem('nacar.lastBooking') || ''; } catch (e) { /* noop */ }
      this.lookup(code || last);
      if (!this.dlg.open) this.dlg.showModal();
    },
    body(html) { $('[data-manage-body]', this.dlg).innerHTML = html; },
    lookup(code, error) {
      this.body(`<p class="eyebrow">Mi reserva</p><h2>Gestiona tu cita</h2>
        <p>Introduce el código que recibiste al reservar y el email o teléfono que usaste.</p>
        <form class="form" data-lookup novalidate>
          ${error ? `<div class="note note--err" role="alert">${U.esc(error)}</div>` : ''}
          <div class="field"><label for="m-code">Código de reserva</label><input id="m-code" name="code" required autocomplete="off" placeholder="NC-XXXXXX" value="${U.esc(code || '')}" style="text-transform:uppercase;letter-spacing:.1em"></div>
          <div class="field"><label for="m-contact">Email o teléfono</label><input id="m-contact" name="contact" required autocomplete="email"></div>
          <button class="btn btn--rose btn--lg">Buscar mi cita</button>
        </form>`);
      const f = $('[data-lookup]', this.dlg);
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = f.querySelector('button'); btn.classList.add('is-busy'); btn.textContent = 'Buscando…';
        const fd = new FormData(f);
        const b = await ORY.store.findBooking(fd.get('code'), fd.get('contact'));
        if (!b) return this.lookup(fd.get('code'), 'No encontramos ninguna cita con esos datos. Revisa el código y el contacto.');
        this.booking = b; this.detail();
      });
      setTimeout(() => f.querySelector(code ? '#m-contact' : '#m-code').focus(), 60);
    },
    detail(msg) {
      const b = this.booking, d = db();
      const s = d.services.find((x) => x.id === b.serviceId), m = d.staff.find((x) => x.id === b.staffId);
      const can = ORY.store.canClientChange(b);
      const future = b.start > Date.now();
      const statusTxt = { confirmed: 'Confirmada', cancelled: 'Cancelada', completed: 'Realizada', no_show: 'No asistida', pending: 'Pendiente' }[b.status];
      this.body(`<p class="eyebrow">Reserva ${U.esc(b.code)}</p><h2>${U.esc(s ? s.name : 'Tu cita')}</h2>
        ${msg ? `<div class="note" role="status">${msg}</div>` : ''}
        <div class="summary" style="margin-top:14px"><dl>
          <dt>Estado</dt><dd>${statusTxt}${b.attendanceConfirmedAt ? ' · asistencia confirmada' : ''}</dd>
          <dt>Fecha</dt><dd>${U.esc(U.cap(U.fmtDate(b.start)))}</dd>
          <dt>Hora</dt><dd>${U.fmtTime(b.start)} – ${U.fmtTime(b.end)}</dd>
          <dt>Profesional</dt><dd>${U.esc(m ? m.name : '')}</dd>
        </dl></div>
        ${b.status === 'confirmed' && future ? `
          <div class="dlg-actions">
            ${!b.attendanceConfirmedAt ? '<button class="btn btn--rose" data-m="attend">Confirmo que voy</button>' : ''}
            ${can ? '<button class="btn btn--ghost" data-m="move">Cambiar fecha u hora</button><button class="btn btn--ghost" data-m="cancel">Cancelar cita</button>' : ''}
            <button class="btn btn--ghost" data-m="ics">Añadir al calendario</button>
          </div>
          ${!can ? `<p class="small">Faltan menos de ${d.settings.booking.cancelCutoffHours} h para tu cita, así que ya no se puede modificar online. Escríbenos por <a data-wa target="_blank" rel="noopener">WhatsApp</a> o llama al ${U.esc(d.settings.business.phone)}.</p>` : ''}` : ''}
        ${b.status === 'cancelled' ? '<div class="dlg-actions"><button class="btn btn--rose" data-m="new">Reservar otra cita</button></div>' : ''}`);
      applyContactLinks();
      this.dlg.querySelectorAll('[data-m]').forEach((x) => x.addEventListener('click', () => this.action(x.dataset.m, x)));
    },
    async action(a, btn) {
      const b = this.booking;
      if (a === 'attend') { await ORY.store.attendanceConfirmed(b.id); b.attendanceConfirmedAt = Date.now(); this.detail('¡Gracias! Hemos avisado al salón de que vienes.'); }
      if (a === 'move') { this.dlg.close(); ORY.booking.openReschedule(b); }
      if (a === 'new') { this.dlg.close(); ORY.booking.open(); }
      if (a === 'ics') {
        const d = db(), s = d.services.find((x) => x.id === b.serviceId);
        U.download('cita-' + b.code + '.ics', U.ics({ uid: b.id + '@nacar', start: b.start, end: b.end, title: s.name + ' · ' + d.settings.business.name, description: 'Código ' + b.code, location: d.settings.business.address }), 'text/calendar');
      }
      if (a === 'cancel') {
        if (btn.dataset.sure !== '1') { btn.dataset.sure = '1'; btn.textContent = 'Sí, cancelar definitivamente'; btn.classList.remove('btn--ghost'); btn.classList.add('btn--rose'); return; }
        btn.classList.add('is-busy');
        try { this.booking = await ORY.store.cancelBooking(b.id, { by: 'clienta' }); this.detail('Tu cita está cancelada y el hueco vuelve a estar disponible. ¡Gracias por avisar!'); }
        catch (e) { this.detail(U.esc(e.message)); }
      }
    }
  };
  ORY.manage = manage;

  /* ---------------- Delegación global ---------------- */
  function delegate() {
    document.addEventListener('click', (e) => {
      const t = e.target;
      const book = t.closest('[data-book]');
      if (book) { e.preventDefault(); return ORY.booking.open(); }
      const bs = t.closest('[data-book-service]');
      if (bs) return ORY.booking.open({ serviceId: bs.dataset.bookService });
      const st = t.closest('[data-book-staff]');
      if (st) {
        const m = db().staff.find((x) => x.id === st.dataset.bookStaff);
        return ORY.booking.open(m && m.services.length === 1 ? { serviceId: m.services[0], staffId: m.id } : {});
      }
      const nx = t.closest('[data-book-next]');
      if (nx) { const [staffId, serviceId, start] = nx.dataset.bookNext.split('|'); return ORY.booking.open({ staffId, serviceId, start: Number(start) }); }
      const chip = t.closest('[data-cat]');
      if (chip && chip.classList.contains('chip')) {
        currentCat = chip.dataset.cat;
        $$('.chip').forEach((c) => c.setAttribute('aria-selected', c === chip));
        $$('.svc').forEach((c) => c.classList.toggle('is-out', currentCat !== 'all' && c.dataset.cat !== currentCat));
        if (ORY.fx.relayout) ORY.fx.relayout();
        const tr = $('[data-track]'); if (tr) tr.scrollLeft = 0;
        return;
      }
      if (t.closest('[data-open-manage]')) return manage.open();
      const lg = t.closest('[data-legal]');
      if (lg) return ui.legal(lg.dataset.legal);
      if (t.closest('[data-review-help]')) { const d = $('[data-legal-dlg]'); if (d.open) d.close(); return reviewHelp(); }
      if (t.closest('[data-load-map]')) return loadMap();
    });
    // Píldora ORYON
    const pill = $('[data-oryon-pill]'), sheet = $('[data-oryon-sheet]');
    pill.addEventListener('click', () => { sheet.hidden = !sheet.hidden; });
    $('[data-close-sheet]').addEventListener('click', () => { sheet.hidden = true; });
    // Cerrar dialogs al pulsar fuera
    $$('dialog').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));
  }

  /* ---------------- Arranque ---------------- */
  async function boot() {
    await ORY.store.init();
    const snap = db();
    if (!snap.meta.seeded && ORY.store.mode === 'local') await ORY.store.seedDemo();
    $('[data-year]').textContent = new Date().getFullYear();
    renderServices(); renderTeam(); renderContact(); renderLive(); renderReviews();
    ORY.booking.init();
    ORY.fx.init();
    delegate(); consent();
    ORY.store.subscribe(U.debounce((reason) => {
      renderLive();
      if (reason === 'external' || /^(services|staff|settings)/.test(reason)) { renderServices(); renderTeam(); renderContact(); renderReviews(); }
    }, 120));
    setInterval(renderLive, 60000);
    const params = new URLSearchParams(location.search);
    if (params.get('reserva') || location.hash === '#gestionar') setTimeout(() => manage.open(params.get('reserva')), 1600);
    if (params.has('opinion')) setTimeout(reviewLanding, 1600);
  }
  document.addEventListener('DOMContentLoaded', boot);
})(window.ORY = window.ORY || {});
