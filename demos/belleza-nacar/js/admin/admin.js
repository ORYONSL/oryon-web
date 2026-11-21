/* ==========================================================================
   Panel de gestión de la propietaria
   Vistas: resumen · agenda · reservas · clientas · servicios · equipo ·
           automatizaciones · reseñas · ajustes
   ========================================================================== */
(function (ORY) {
  'use strict';
  const U = ORY.U, A = ORY.availability, S = ORY.store;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const db = () => S.snapshot();
  const esc = U.esc;
  const DAY = 86400000;
  const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const STATUS = { confirmed: 'Confirmada', completed: 'Realizada', cancelled: 'Cancelada', no_show: 'No asistió', pending: 'Pendiente' };
  const MSG_STATUS = { needs_provider: 'Sin proveedor conectado', queued: 'En cola de envío', void: 'Anulado', sent_manual: 'Enviado a mano', sent: 'Enviado', failed: 'Error' };
  const TEMPLATE = { booking_confirmed: 'Confirmación', reminder: 'Recordatorio', booking_cancelled: 'Cancelación', booking_rescheduled: 'Cambio de cita', review_request: 'Solicitud de reseña', business_new_booking: 'Aviso al salón: nueva', business_cancelled: 'Aviso al salón: cancelación', business_rescheduled: 'Aviso al salón: cambio' };
  const TITLES = { resumen: 'Resumen', agenda: 'Agenda', reservas: 'Reservas', clientes: 'Clientas', servicios: 'Servicios y precios', equipo: 'Equipo y horarios', automatizaciones: 'Automatizaciones', resenas: 'Reseñas', ajustes: 'Ajustes' };

  const st = { view: 'resumen', agendaDate: U.startOfDay(Date.now()), resFilter: 'upcoming', resStaff: 'all', resQuery: '', cliQuery: '', outFilter: 'pending', seenFeed: 0 };

  const svcOf = (id) => db().services.find((s) => s.id === id) || { name: '(servicio eliminado)', duration: 0, price: 0 };
  const staffOf = (id) => db().staff.find((m) => m.id === id) || { name: '—', hue: 0 };
  const pill = (s, map = STATUS) => `<span class="pill pill--${s}">${esc(map[s] || s)}</span>`;
  const demoTag = (x) => x.demo ? ' <span class="pill pill--demo">ejemplo</span>' : '';

  function toast(msg, err) {
    const t = $('[data-toast]');
    t.textContent = msg; t.classList.toggle('err', !!err); t.classList.add('is-on');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('is-on'), 3800);
  }
  function modal(html, bind) {
    const d = $('[data-modal]');
    $('[data-modal-body]', d).innerHTML = html;
    if (!d.open) d.showModal();
    if (bind) bind($('[data-modal-body]', d));
  }
  const closeModal = () => { const d = $('[data-modal]'); if (d.open) d.close(); };
  async function busyRun(btn, fn) {
    if (btn) btn.classList.add('is-busy');
    try { await fn(); } catch (e) { toast(e.message || 'Error', true); } finally { if (btn) btn.classList.remove('is-busy'); }
  }

  /* ======================= RESUMEN ======================= */
  function vResumen() {
    const d = db(), now = Date.now(), today = U.startOfDay(now).getTime();
    const act = d.bookings.filter((b) => b.status !== 'cancelled');
    const todayB = act.filter((b) => b.start >= today && b.start < today + DAY).sort((a, b) => a.start - b.start);
    const weekEnd = today + 7 * DAY;
    const week = act.filter((b) => b.start >= today && b.start < weekEnd);
    const past30 = d.bookings.filter((b) => b.start < now && b.start > now - 30 * DAY);
    const noShow = past30.filter((b) => b.status === 'no_show').length;
    const attended = past30.filter((b) => b.status === 'completed' || b.status === 'no_show').length;
    const cancelled30 = past30.filter((b) => b.status === 'cancelled').length;
    const online = d.bookings.length ? Math.round(d.bookings.filter((b) => b.source === 'web').length / d.bookings.length * 100) : 0;
    const revenueToday = todayB.reduce((s, b) => s + (b.price || 0), 0);
    const days = Array.from({ length: 7 }, (_, i) => { const s = today + i * DAY; return { s, n: act.filter((b) => b.start >= s && b.start < s + DAY).length }; });
    const max = Math.max(1, ...days.map((x) => x.n));
    const upcoming = todayB.filter((b) => b.end > now);
    const nightly = d.bookings.filter((b) => { const h = new Date(b.createdAt).getHours(); return b.source === 'web' && (h >= 21 || h < 9); }).length;

    return `
      <div class="grid g-4">
        <div class="card kpi kpi--accent"><span>Citas hoy</span><b>${todayB.length}</b><small>${upcoming.length} pendientes · ${U.money(revenueToday)} previstos</small></div>
        <div class="card kpi"><span>Próximos 7 días</span><b>${week.length}</b><small>${U.money(week.reduce((s, b) => s + (b.price || 0), 0))} en agenda</small></div>
        <div class="card kpi"><span>Ausencias (30 d)</span><b>${attended ? Math.round(noShow / attended * 100) : 0}%</b><small>${noShow} sin aviso · ${cancelled30} cancelaron a tiempo</small></div>
        <div class="card kpi"><span>Reservas online</span><b>${online}%</b><small>${nightly} hechas con el salón cerrado</small></div>
      </div>
      <div class="grid g-2" style="margin-top:16px">
        <div class="card">
          <div class="card-head"><div><h2>Hoy</h2><p class="muted">${esc(U.cap(U.fmtDate(now)))}</p></div><a class="btn btn--ghost btn--sm" href="#agenda">Ver agenda</a></div>
          <div class="list">${todayB.length ? todayB.map(rowBooking).join('') : '<div class="empty-state"><b>Día tranquilo</b>No hay citas para hoy.</div>'}</div>
        </div>
        <div class="grid" style="align-content:start">
          <div class="card">
            <div class="card-head"><h2>Próxima semana</h2></div>
            <div class="bars">${days.map((x, i) => `<div class="bar ${i === 0 ? 'today' : ''}"><b>${x.n}</b><i style="height:${Math.round(x.n / max * 100)}%"></i>${esc(U.fmtDate(x.s, { weekday: 'short' }))}</div>`).join('')}</div>
          </div>
          <div class="card">
            <div class="card-head"><h2>Actividad</h2><button class="link-btn" data-act="feed">Ver todo</button></div>
            <div class="list">${d.feed.slice(0, 5).map(feedItem).join('') || '<p class="muted">Sin novedades.</p>'}</div>
          </div>
        </div>
      </div>`;
  }

  function rowBooking(b) {
    const m = staffOf(b.staffId);
    return `<button class="li" data-act="booking" data-id="${b.id}">
      <span class="li-time">${U.fmtTime(b.start)}</span>
      <span class="avatar" style="--h:${m.hue};width:34px;height:34px;font-size:15px">${esc(m.name[0])}</span>
      <span class="li-main"><b>${esc(b.client.name)}${b.attendanceConfirmedAt ? ' ✓' : ''}</b>${esc(svcOf(b.serviceId).name)} · ${esc(m.name)}</span>
      ${pill(b.status)}</button>`;
  }
  function feedItem(n) {
    return `<div class="feed-item ${n.read ? '' : 'unread'} ${n.type}" ${n.bookingId ? `data-act="booking" data-id="${n.bookingId}" style="cursor:pointer"` : ''}>
      <span class="feed-dot"></span><span><b>${esc(n.title)}</b>${esc(n.text)}<br><time>${esc(ago(n.at))}</time></span></div>`;
  }
  function ago(t) {
    const m = Math.round((Date.now() - t) / 60000);
    if (m < 1) return 'ahora mismo'; if (m < 60) return 'hace ' + m + ' min';
    const h = Math.round(m / 60); if (h < 24) return 'hace ' + h + ' h';
    return U.fmtDateShort(t);
  }

  /* ======================= AGENDA ======================= */
  function vAgenda() {
    const d = db(), day = st.agendaDate, dayMs = day.getTime(), wd = day.getDay();
    const staff = d.staff.filter((m) => m.active !== false);
    const biz = (d.settings.business.hours[wd] || []);
    const openMin = biz.length ? Math.min(...biz.map(([s]) => U.toMin(s))) : 9 * 60;
    const closeMin = biz.length ? Math.max(...biz.map(([, e]) => U.toMin(e))) : 20 * 60;
    const from = Math.floor(openMin / 60) * 60, to = Math.ceil(closeMin / 60) * 60;
    const px = (min) => ((min - from) / 15) * 22; // --row = 22px por 15 min
    const totalH = px(to);
    const hours = []; for (let h = from; h < to; h += 60) hours.push(`<div>${U.fromMin(h)}</div>`);
    const nowMin = (Date.now() - dayMs) / 60000;

    const cols = staff.map((m) => {
      const shifts = (m.schedule[wd] || []).map(([s, e]) => [U.toMin(s), U.toMin(e)]);
      // zonas fuera de turno
      let off = '', cur = from;
      shifts.slice().sort((a, b) => a[0] - b[0]).forEach(([s, e]) => { if (s > cur) off += `<div class="ag-off" style="top:${px(cur)}px;height:${px(s) - px(cur)}px"></div>`; cur = Math.max(cur, e); });
      if (cur < to) off += `<div class="ag-off" style="top:${px(cur)}px;height:${px(to) - px(cur)}px"></div>`;
      const blocks = d.bookings.filter((b) => b.staffId === m.id && b.start >= dayMs && b.start < dayMs + DAY).map((b) => {
        const s = (b.start - dayMs) / 60000, e = (b.end - dayMs) / 60000;
        const fresh = Date.now() - b.createdAt < 3600000 && b.status === 'confirmed';
        return `<button class="ag-block ${b.status}" style="--h:${m.hue};top:${px(s)}px;height:${Math.max(px(e) - px(s) - 2, 24)}px" data-act="booking" data-id="${b.id}">
          ${fresh ? '<i class="new" title="Nueva"></i>' : ''}<b>${U.fmtTime(b.start)} · ${esc(b.client.name)}</b><span>${esc(svcOf(b.serviceId).name)}</span></button>`;
      }).join('');
      const toff = d.timeOff.filter((t) => (!t.staffId || t.staffId === m.id) && t.start < dayMs + DAY && t.end > dayMs).map((t) => {
        const s = Math.max(from, (t.start - dayMs) / 60000), e = Math.min(to, (t.end - dayMs) / 60000);
        return `<div class="ag-block timeoff" style="--h:0;top:${px(s)}px;height:${Math.max(px(e) - px(s) - 2, 24)}px"><b>Bloqueado</b><span>${esc(t.reason || '')}</span></div>`;
      }).join('');
      const now = nowMin > from && nowMin < to ? `<div class="ag-now" style="top:${px(nowMin)}px"></div>` : '';
      return `<div class="ag-col" style="height:${totalH}px">${off}${toff}${blocks}${now}</div>`;
    }).join('');

    const isToday = U.sameDay(day, Date.now());
    return `
      <div class="toolbar">
        <button class="icon-btn" data-act="day" data-d="-1" aria-label="Día anterior"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button>
        <button class="btn btn--ghost btn--sm" data-act="day" data-d="0" ${isToday ? 'disabled' : ''}>Hoy</button>
        <button class="icon-btn" data-act="day" data-d="1" aria-label="Día siguiente"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>
        <input type="date" value="${U.dateKey(day)}" data-agenda-date>
        <h2 style="margin:0 0 0 6px;font:400 26px var(--f-display)">${esc(U.cap(U.fmtDate(day)))}</h2>
        <span class="muted" style="margin-left:auto">${biz.length ? 'Abierto ' + biz.map(([s, e]) => s + '–' + e).join(', ') : 'Salón cerrado'}</span>
        <button class="btn btn--ghost btn--sm" data-act="timeoff">Bloquear horas</button>
      </div>
      <div class="agenda" style="--cols:${staff.length}">
        <div class="ag-head corner"></div>
        ${staff.map((m) => `<div class="ag-head"><span class="avatar" style="--h:${m.hue}">${esc(m.name[0])}</span>${esc(m.name)}</div>`).join('')}
        <div class="ag-times" style="height:${totalH}px">${hours.join('')}</div>
        ${cols}
      </div>`;
  }

  /* ======================= RESERVAS ======================= */
  function vReservas() {
    const d = db(), now = Date.now();
    let list = d.bookings.slice();
    const f = st.resFilter;
    if (f === 'upcoming') list = list.filter((b) => b.end >= now && b.status === 'confirmed').sort((a, b) => a.start - b.start);
    else if (f === 'past') list = list.filter((b) => b.end < now).sort((a, b) => b.start - a.start);
    else if (f === 'cancelled') list = list.filter((b) => b.status === 'cancelled').sort((a, b) => b.start - a.start);
    else if (f === 'no_show') list = list.filter((b) => b.status === 'no_show').sort((a, b) => b.start - a.start);
    else list.sort((a, b) => b.createdAt - a.createdAt);
    if (st.resStaff !== 'all') list = list.filter((b) => b.staffId === st.resStaff);
    const q = st.resQuery.trim().toLowerCase();
    if (q) list = list.filter((b) => (b.client.name + ' ' + b.client.phone + ' ' + b.client.email + ' ' + b.code).toLowerCase().includes(q));
    const total = list.length; list = list.slice(0, 150);
    const segs = [['upcoming', 'Próximas'], ['recent', 'Recién creadas'], ['past', 'Pasadas'], ['cancelled', 'Canceladas'], ['no_show', 'Ausencias']];
    return `
      <div class="toolbar">
        <div class="seg">${segs.map(([k, l]) => `<button class="${f === k ? 'on' : ''}" data-act="resfilter" data-f="${k}">${l}</button>`).join('')}</div>
        <select data-res-staff><option value="all">Todo el equipo</option>${d.staff.map((m) => `<option value="${m.id}" ${st.resStaff === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select>
        <input class="grow" type="search" placeholder="Buscar por nombre, teléfono, email o código" value="${esc(st.resQuery)}" data-res-q>
      </div>
      <div class="table-wrap"><table class="t">
        <thead><tr><th>Fecha</th><th>Clienta</th><th>Servicio</th><th>Profesional</th><th>Origen</th><th>Estado</th><th>Código</th></tr></thead>
        <tbody>${list.map((b) => `<tr data-act="booking" data-id="${b.id}">
          <td><b>${esc(U.fmtDateShort(b.start))}</b> ${U.fmtTime(b.start)}</td>
          <td>${esc(b.client.name)}${demoTag(b)}<br><span class="muted">${esc(b.client.phone)}</span></td>
          <td>${esc(svcOf(b.serviceId).name)}</td><td>${esc(staffOf(b.staffId).name)}</td>
          <td>${b.source === 'web' ? 'Web' : 'Salón'}</td><td>${pill(b.status)}</td><td class="muted">${esc(b.code)}</td></tr>`).join('') ||
          '<tr><td colspan="7"><div class="empty-state"><b>Sin resultados</b>Prueba con otro filtro.</div></td></tr>'}</tbody>
      </table></div>
      ${total > 150 ? `<p class="muted">Mostrando 150 de ${total}.</p>` : ''}`;
  }

  /* ======================= CLIENTAS ======================= */
  function clients() {
    const map = new Map();
    db().bookings.forEach((b) => {
      const k = b.client.phone || b.client.email;
      if (!map.has(k)) map.set(k, { key: k, name: b.client.name, phone: b.client.phone, email: b.client.email, list: [], marketing: false, demo: b.demo });
      const c = map.get(k);
      c.list.push(b); c.name = b.client.name;
      if (b.consent && b.consent.marketing) c.marketing = true;
    });
    const now = Date.now();
    return Array.from(map.values()).map((c) => {
      c.list.sort((a, b) => b.start - a.start);
      c.visits = c.list.filter((b) => b.status === 'completed').length;
      c.noShows = c.list.filter((b) => b.status === 'no_show').length;
      c.spent = c.list.filter((b) => b.status === 'completed').reduce((s, b) => s + (b.price || 0), 0);
      c.last = c.list.find((b) => b.status === 'completed');
      c.next = c.list.filter((b) => b.start > now && b.status === 'confirmed').sort((a, b) => a.start - b.start)[0];
      return c;
    }).sort((a, b) => b.spent - a.spent);
  }
  function vClientes() {
    const q = st.cliQuery.trim().toLowerCase();
    const list = clients().filter((c) => !q || (c.name + c.phone + c.email).toLowerCase().includes(q));
    return `
      <div class="toolbar">
        <input class="grow" type="search" placeholder="Buscar clienta" value="${esc(st.cliQuery)}" data-cli-q>
        <button class="btn btn--ghost btn--sm" data-act="csv">Exportar CSV</button>
      </div>
      <div class="table-wrap"><table class="t">
        <thead><tr><th>Clienta</th><th>Contacto</th><th>Visitas</th><th>Ausencias</th><th>Gastado</th><th>Última visita</th><th>Próxima cita</th><th>Promos</th></tr></thead>
        <tbody>${list.map((c) => `<tr data-act="client" data-id="${esc(c.key)}">
          <td><b>${esc(c.name)}</b>${demoTag(c)}</td><td>${esc(c.phone)}<br><span class="muted">${esc(c.email)}</span></td>
          <td>${c.visits}</td><td>${c.noShows ? `<span class="client-flag">${c.noShows}</span>` : '0'}</td><td>${U.money(c.spent)}</td>
          <td>${c.last ? esc(U.fmtDateShort(c.last.start)) : '—'}</td><td>${c.next ? esc(U.fmtDateShort(c.next.start)) + ' ' + U.fmtTime(c.next.start) : '—'}</td>
          <td>${c.marketing ? 'Sí' : 'No'}</td></tr>`).join('') || '<tr><td colspan="8"><div class="empty-state"><b>Aún no hay clientas</b>Aparecerán con la primera reserva.</div></td></tr>'}</tbody>
      </table></div>`;
  }
  function clientModal(key) {
    const c = clients().find((x) => x.key === key);
    if (!c) return;
    modal(`<p class="eyebrow">Ficha de clienta</p><h2>${esc(c.name)}</h2>
      <p>${esc(c.phone)} · ${esc(c.email)} · ${c.marketing ? 'Acepta promociones' : 'No acepta promociones'}</p>
      <div class="grid g-3" style="margin:16px 0">
        <div class="card kpi"><span>Visitas</span><b>${c.visits}</b></div>
        <div class="card kpi"><span>Gastado</span><b>${U.money(c.spent)}</b></div>
        <div class="card kpi"><span>Ausencias</span><b>${c.noShows}</b>${c.noShows >= 2 ? '<small class="client-flag">Valorar pedir señal</small>' : ''}</div>
      </div>
      <div class="dlg-actions" style="margin:0 0 14px">
        <a class="btn btn--ghost btn--sm" href="${esc(U.waLink(c.phone))}" target="_blank" rel="noopener">WhatsApp</a>
        <a class="btn btn--ghost btn--sm" href="tel:${esc(c.phone)}">Llamar</a>
        <a class="btn btn--ghost btn--sm" href="mailto:${esc(c.email)}">Email</a>
      </div>
      <h3 style="font:500 22px var(--f-display)">Historial</h3>
      <div class="list">${c.list.map(rowBookingDated).join('')}</div>`);
  }
  function rowBookingDated(b) {
    return `<button class="li" data-act="booking" data-id="${b.id}"><span class="li-main"><b>${esc(U.cap(U.fmtDateShort(b.start)))} · ${U.fmtTime(b.start)}</b>${esc(svcOf(b.serviceId).name)} con ${esc(staffOf(b.staffId).name)}</span>${pill(b.status)}</button>`;
  }

  /* ======================= DETALLE DE CITA ======================= */
  function bookingModal(id) {
    const d = db(), b = d.bookings.find((x) => x.id === id);
    if (!b) return toast('La cita ya no existe', true);
    const s = svcOf(b.serviceId), m = staffOf(b.staffId);
    const future = b.start > Date.now();
    const reviewUrl = U.reviewUrl(d.settings);
    const remindTxt = `Hola ${b.client.name.split(' ')[0]}, te recordamos tu cita en ${d.settings.business.name} el ${U.fmtDate(b.start)} a las ${U.fmtTime(b.start)} (${s.name}). ¿Nos confirmas que vienes? 💗`;
    const reviewTxt = ORY.notify.templates.review_request(b, ORY.notify.context(d, b)).text;
    const msgs = d.outbox.filter((x) => x.bookingId === b.id).sort((a, c) => a.scheduledFor - c.scheduledFor);
    modal(`<p class="eyebrow">Cita ${esc(b.code)}${b.demo ? ' · ejemplo' : ''}</p>
      <h2>${esc(b.client.name)}</h2>
      <p>${pill(b.status)} ${b.attendanceConfirmedAt ? '<span class="pill pill--confirmed">Asistencia confirmada</span>' : ''} <span class="muted">· reservada ${b.source === 'web' ? 'online' : 'en el salón'} ${esc(ago(b.createdAt))}</span></p>
      <div class="summary" style="margin:14px 0"><dl>
        <dt>Servicio</dt><dd>${esc(s.name)} · ${U.money(b.price || s.price)}</dd>
        <dt>Cuándo</dt><dd>${esc(U.cap(U.fmtDate(b.start)))}, ${U.fmtTime(b.start)}–${U.fmtTime(b.end)}</dd>
        <dt>Profesional</dt><dd>${esc(m.name)}</dd>
        <dt>Contacto</dt><dd>${esc(b.client.phone)}<br>${esc(b.client.email)}</dd>
        ${b.notes ? `<dt>Notas</dt><dd>${esc(b.notes)}</dd>` : ''}
        <dt>Consentimiento</dt><dd>Privacidad ✓ · Promos ${b.consent && b.consent.marketing ? '✓' : '✗'}</dd>
      </dl></div>
      <div class="dlg-actions">
        ${b.status === 'confirmed' && !future ? '<button class="btn btn--rose btn--sm" data-st="completed">Marcar realizada</button><button class="btn btn--ghost btn--sm" data-st="no_show">No se presentó</button>' : ''}
        ${b.status === 'confirmed' && future ? '<button class="btn btn--ghost btn--sm" data-move>Mover cita</button>' : ''}
        ${b.status === 'confirmed' ? '<button class="btn btn--ghost btn--sm" data-st="cancelled">Cancelar</button>' : ''}
        ${b.status !== 'confirmed' && future ? '<button class="btn btn--ghost btn--sm" data-st="confirmed">Reactivar</button>' : ''}
      </div>
      <div data-move-box></div>
      <div class="dlg-actions">
        ${future && b.status === 'confirmed' ? `<a class="btn btn--ghost btn--sm" target="_blank" rel="noopener" href="${esc(U.waLink(b.client.phone, remindTxt))}">Recordar por WhatsApp</a>` : ''}
        ${b.status === 'completed' ? `<a class="btn btn--ghost btn--sm" target="_blank" rel="noopener" href="${esc(U.waLink(b.client.phone, reviewTxt))}">Pedir reseña por WhatsApp</a>` : ''}
        <a class="btn btn--ghost btn--sm" href="tel:${esc(b.client.phone)}">Llamar</a>
      </div>
      ${b.status === 'completed' && !reviewUrl ? '<p class="muted">Configura el enlace de Google en Reseñas para incluirlo en el mensaje.</p>' : ''}
      <h3 style="font:500 22px var(--f-display);margin-top:20px">Automatizaciones de esta cita</h3>
      <div class="list">${msgs.map((x) => `<div class="li"><span class="li-main"><b>${esc(TEMPLATE[x.template] || x.template)} · ${esc(x.channel)}</b>${esc(U.fmtDateShort(x.scheduledFor))} ${U.fmtTime(x.scheduledFor)}</span>${pill(x.status, MSG_STATUS)}</div>`).join('') || '<p class="muted">Sin mensajes.</p>'}</div>
      <h3 style="font:500 22px var(--f-display);margin-top:20px">Historial</h3>
      <div class="list">${b.history.map((h) => `<div class="li"><span class="li-main"><b>${esc({ created: 'Creada', cancelled: 'Cancelada', rescheduled: 'Movida', completed: 'Realizada', no_show: 'No asistió', confirmed: 'Reactivada', attendance_confirmed: 'Asistencia confirmada' }[h.action] || h.action)}</b>por ${esc(h.by)} · ${esc(U.fmtDateShort(h.at))} ${U.fmtTime(h.at)}</span></div>`).join('')}</div>`,
    (root) => {
      $$('[data-st]', root).forEach((btn) => btn.addEventListener('click', () => busyRun(btn, async () => {
        await S.setStatus(b.id, btn.dataset.st, 'salon');
        toast('Cita actualizada'); bookingModal(b.id);
      })));
      const mv = $('[data-move]', root);
      if (mv) mv.addEventListener('click', () => moveForm($('[data-move-box]', root), b));
    });
  }

  function moveForm(box, b) {
    const d = db();
    const team = d.staff.filter((m) => A.canDo(m, b.serviceId));
    box.innerHTML = `<div class="card" style="margin-top:14px;box-shadow:inset 0 0 0 1px var(--line)">
      <div class="form-grid">
        <div class="field"><label>Profesional</label><select data-mv-staff>${team.map((m) => `<option value="${m.id}" ${m.id === b.staffId ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></div>
        <div class="field"><label>Día</label><input type="date" data-mv-date value="${U.dateKey(b.start)}" min="${U.dateKey(Date.now())}"></div>
        <div class="field full"><label>Hora libre</label><select data-mv-time></select></div>
      </div>
      <div class="dlg-actions"><button class="btn btn--rose btn--sm" data-mv-save>Guardar cambio y avisar</button></div></div>`;
    const fill = () => {
      const slots = A.slotsForDay(db(), { serviceId: b.serviceId, staffId: $('[data-mv-staff]', box).value, date: U.fromKey($('[data-mv-date]', box).value), excludeBookingId: b.id, now: Date.now() - 3600000 });
      $('[data-mv-time]', box).innerHTML = slots.length ? slots.map((s) => `<option value="${s.start}">${s.label}</option>`).join('') : '<option value="">Sin huecos ese día</option>';
    };
    fill();
    $('[data-mv-staff]', box).addEventListener('change', fill);
    $('[data-mv-date]', box).addEventListener('change', fill);
    $('[data-mv-save]', box).addEventListener('click', (e) => busyRun(e.currentTarget, async () => {
      const start = Number($('[data-mv-time]', box).value);
      if (!start) throw new Error('Elige una hora disponible');
      await S.rescheduleBooking(b.id, { start, staffId: $('[data-mv-staff]', box).value, by: 'salon' });
      toast('Cita movida · la clienta recibirá el aviso'); bookingModal(b.id);
    }));
  }

  /* ======================= NUEVA CITA (teléfono / mostrador) ======================= */
  function newBookingModal() {
    const d = db();
    const svcs = d.services.filter((s) => s.active !== false);
    modal(`<p class="eyebrow">Reserva desde el salón</p><h2>Nueva cita</h2>
      <form class="form" data-nb novalidate>
        <div class="form-grid">
          <div class="field"><label>Servicio</label><select name="service">${svcs.map((s) => `<option value="${s.id}">${esc(s.name)} · ${U.fmtDuration(s.duration)}</option>`).join('')}</select></div>
          <div class="field"><label>Profesional</label><select name="staff"></select></div>
          <div class="field"><label>Día</label><input type="date" name="date" value="${U.dateKey(Date.now())}" min="${U.dateKey(Date.now())}"></div>
          <div class="field"><label>Hora libre</label><select name="time"></select></div>
          <div class="field"><label>Nombre</label><input name="name" required></div>
          <div class="field"><label>Teléfono</label><input name="phone" type="tel" required></div>
          <div class="field full"><label>Email</label><input name="email" type="email" required></div>
          <div class="field full"><label>Notas</label><textarea name="notes"></textarea></div>
        </div>
        <label class="check"><input type="checkbox" name="privacy" required><span>La clienta ha sido informada de la política de privacidad y acepta recibir confirmación y recordatorios.</span></label>
        <div class="note note--err" data-nb-err hidden></div>
        <button class="btn btn--rose btn--lg">Crear cita</button>
      </form>`, (root) => {
      const f = $('[data-nb]', root);
      const fillStaff = () => {
        const team = db().staff.filter((m) => A.canDo(m, f.service.value));
        f.staff.innerHTML = '<option value="any">Primera disponible</option>' + team.map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join('');
      };
      const fillTime = () => {
        const slots = A.slotsForDay(db(), { serviceId: f.service.value, staffId: f.staff.value, date: U.fromKey(f.date.value), now: Date.now() - 3600000 });
        f.time.innerHTML = slots.length ? slots.map((s) => `<option value="${s.start}">${s.label}</option>`).join('') : '<option value="">Sin huecos</option>';
      };
      fillStaff(); fillTime();
      f.service.addEventListener('change', () => { fillStaff(); fillTime(); });
      f.staff.addEventListener('change', fillTime);
      f.date.addEventListener('change', fillTime);
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        const err = $('[data-nb-err]', root);
        busyRun(f.querySelector('button.btn--lg'), async () => {
          try {
            if (!f.time.value) throw new Error('Elige una hora disponible.');
            const b = await S.createBooking({ serviceId: f.service.value, staffId: f.staff.value, start: Number(f.time.value), source: 'admin',
              client: { name: f.name.value, phone: f.phone.value, email: f.email.value }, notes: f.notes.value,
              consent: { privacy: f.privacy.checked, marketing: false } });
            toast('Cita creada · ' + b.code); bookingModal(b.id);
          } catch (ex) { err.hidden = false; err.textContent = ex.message; }
        });
      });
    });
  }

  /* ======================= SERVICIOS ======================= */
  function vServicios() {
    const d = db();
    return `<div class="toolbar"><p class="muted" style="margin:0">Los cambios se publican al instante en la web y en el sistema de reservas.</p><button class="btn btn--rose btn--sm" style="margin-left:auto" data-act="svc-edit" data-id="">+ Añadir servicio</button></div>
      <div class="grid">${ORY.config.categories.map((c) => {
        const list = d.services.filter((s) => s.cat === c.id);
        if (!list.length) return '';
        return `<div class="card"><h3>${esc(c.name)}</h3><div class="list">${list.map((s) => `
          <div class="li svc-row ${s.active === false ? 'off' : ''}">
            ${s.image ? `<img src="${esc(s.image)}" alt="" loading="lazy">` : '<span class="ph"></span>'}
            <span class="li-main"><b>${esc(s.name)} ${s.active === false ? '<span class="pill pill--void">Oculto</span>' : ''}</b>${U.fmtDuration(s.duration)} · ${s.priceFrom ? 'desde ' : ''}${U.money(s.price)} · margen ${s.buffer != null ? s.buffer : d.settings.booking.defaultBufferMinutes} min · ${d.staff.filter((m) => m.services.includes(s.id)).map((m) => esc(m.name)).join(', ') || '<span class="client-flag">sin profesional asignada</span>'}</span>
            <span style="display:flex;gap:8px;align-items:center"><label class="switch"><input type="checkbox" data-act="svc-toggle" data-id="${s.id}" ${s.active !== false ? 'checked' : ''}><span class="sr">Visible</span></label>
            <button class="btn btn--ghost btn--sm" data-act="svc-edit" data-id="${s.id}">Editar</button></span>
          </div>`).join('')}</div></div>`;
      }).join('')}</div>`;
  }
  function serviceModal(id) {
    const d = db();
    const s = d.services.find((x) => x.id === id) || { id: '', cat: ORY.config.categories[0].id, name: '', desc: '', duration: 60, price: 0, priceFrom: false, buffer: null, image: '', active: true };
    modal(`<p class="eyebrow">${id ? 'Editar' : 'Nuevo'} servicio</p><h2>${esc(s.name || 'Nuevo servicio')}</h2>
      <form class="form" data-svc>
        <div class="form-grid">
          <div class="field full"><label>Nombre</label><input name="name" required value="${esc(s.name)}"></div>
          <div class="field"><label>Categoría</label><select name="cat">${ORY.config.categories.map((c) => `<option value="${c.id}" ${c.id === s.cat ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
          <div class="field"><label>Duración (min)</label><input name="duration" type="number" min="10" step="5" required value="${s.duration}"></div>
          <div class="field"><label>Precio (€)</label><input name="price" type="number" min="0" step="0.5" required value="${s.price}"></div>
          <div class="field"><label>Margen tras la cita (min, vacío = general)</label><input name="buffer" type="number" min="0" step="5" value="${s.buffer != null ? s.buffer : ''}"></div>
          <div class="field full"><label>Descripción</label><textarea name="desc">${esc(s.desc)}</textarea></div>
          <div class="field full"><label>URL de la fotografía</label><input name="image" type="url" value="${esc(s.image)}" placeholder="https://…"></div>
          <div class="field full"><label>Profesionales que lo realizan</label><div class="checks">${d.staff.map((m) => `<label><input type="checkbox" name="staff" value="${m.id}" ${m.services.includes(s.id) ? 'checked' : ''}>${esc(m.name)}</label>`).join('')}</div></div>
        </div>
        <label class="check"><input type="checkbox" name="priceFrom" ${s.priceFrom ? 'checked' : ''}><span>Mostrar como “desde” (precio orientativo)</span></label>
        <div class="dlg-actions"><button class="btn btn--rose">Guardar</button>${id ? '<button type="button" class="btn btn--ghost" data-del>Eliminar</button>' : ''}</div>
      </form>`, (root) => {
      const f = $('[data-svc]', root);
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        busyRun(f.querySelector('.btn--rose'), async () => {
          const item = { id: s.id || U.uid('svc').slice(0, 12), cat: f.cat.value, name: f.name.value.trim(), desc: f.desc.value.trim(),
            duration: Math.max(10, Number(f.duration.value)), price: Number(f.price.value), priceFrom: f.priceFrom.checked,
            buffer: f.buffer.value === '' ? null : Number(f.buffer.value), image: f.image.value.trim(), active: s.active !== false };
          if (!item.name) throw new Error('El nombre es obligatorio');
          await S.save('services', item);
          const chosen = $$('input[name="staff"]:checked', f).map((x) => x.value);
          for (const m of db().staff) {
            const has = m.services.includes(item.id), want = chosen.includes(m.id);
            if (has !== want) await S.save('staff', { id: m.id, services: want ? m.services.concat(item.id) : m.services.filter((x) => x !== item.id) });
          }
          closeModal(); toast('Servicio guardado');
        });
      });
      const del = $('[data-del]', root);
      if (del) del.addEventListener('click', () => busyRun(del, async () => { await S.remove('services', s.id); closeModal(); toast('Servicio eliminado'); }));
    });
  }

  /* ======================= EQUIPO ======================= */
  const fmtRanges = (r) => (r || []).map(([a, b]) => a + '-' + b).join(', ');
  function parseRanges(txt) {
    const out = [];
    String(txt || '').split(',').map((x) => x.trim()).filter(Boolean).forEach((p) => {
      const m = p.match(/^(\d{1,2}):?(\d{2})\s*[-–]\s*(\d{1,2}):?(\d{2})$/);
      if (!m) throw new Error('Formato de horario no válido: "' + p + '" (usa 09:30-14:00)');
      const a = U.pad(m[1]) + ':' + m[2], b = U.pad(m[3]) + ':' + m[4];
      if (U.toMin(b) <= U.toMin(a)) throw new Error('El tramo ' + p + ' termina antes de empezar');
      out.push([a, b]);
    });
    return out;
  }
  function vEquipo() {
    const d = db();
    const offs = d.timeOff.filter((t) => t.end > Date.now()).sort((a, b) => a.start - b.start);
    return `<div class="toolbar"><p class="muted" style="margin:0">El horario de cada profesional se cruza con el del salón para calcular los huecos.</p><button class="btn btn--rose btn--sm" style="margin-left:auto" data-act="staff-edit" data-id="">+ Añadir profesional</button></div>
      <div class="grid g-2">
        <div class="grid">${d.staff.map((m) => `<div class="card">
          <div class="card-head"><div style="display:flex;gap:12px;align-items:center"><span class="avatar" style="--h:${m.hue}">${esc(m.name[0])}</span><div><h3 style="margin:0">${esc(m.name)} ${m.active === false ? '<span class="pill pill--void">Inactiva</span>' : ''}</h3><span class="muted">${esc(m.role)}</span></div></div>
          <button class="btn btn--ghost btn--sm" data-act="staff-edit" data-id="${m.id}">Editar</button></div>
          <div class="sched">${[1, 2, 3, 4, 5, 6, 0].map((i) => `<span class="muted">${DAYS[i]}</span><span>${fmtRanges(m.schedule[i]) || '—'}</span>`).join('')}</div>
        </div>`).join('')}</div>
        <div class="card" style="align-self:start">
          <div class="card-head"><h2>Ausencias y bloqueos</h2><button class="btn btn--ghost btn--sm" data-act="timeoff">+ Añadir</button></div>
          <p class="muted">Vacaciones, formación o cualquier bloqueo. Esas horas desaparecen de la reserva online al momento.</p>
          <div class="list">${offs.map((t) => `<div class="li"><span class="li-main"><b>${esc(t.staffId ? staffOf(t.staffId).name : 'Todo el salón')}</b>${esc(U.fmtDateShort(t.start))} ${U.fmtTime(t.start)} → ${esc(U.fmtDateShort(t.end))} ${U.fmtTime(t.end)}${t.reason ? ' · ' + esc(t.reason) : ''}</span><button class="btn btn--ghost btn--sm" data-act="timeoff-del" data-id="${t.id}">Quitar</button></div>`).join('') || '<p class="muted">No hay bloqueos próximos.</p>'}</div>
        </div>
      </div>`;
  }
  function staffModal(id) {
    const d = db();
    const m = d.staff.find((x) => x.id === id) || { id: '', name: '', role: '', hue: Math.floor(Math.random() * 60), services: [], schedule: {}, active: true };
    modal(`<p class="eyebrow">${id ? 'Editar' : 'Nueva'} profesional</p><h2>${esc(m.name || 'Nueva profesional')}</h2>
      <form class="form" data-staff-f>
        <div class="form-grid">
          <div class="field"><label>Nombre</label><input name="name" required value="${esc(m.name)}"></div>
          <div class="field"><label>Especialidad</label><input name="role" value="${esc(m.role)}"></div>
          <div class="field full"><label>Servicios que realiza</label><div class="checks">${d.services.map((s) => `<label><input type="checkbox" name="svc" value="${s.id}" ${m.services.includes(s.id) ? 'checked' : ''}>${esc(s.name)}</label>`).join('')}</div></div>
          <div class="field full"><label>Horario semanal (tramos separados por comas, p. ej. 10:00-14:00, 15:00-20:00)</label>
            <div class="sched">${[1, 2, 3, 4, 5, 6, 0].map((i) => `<span>${DAYS[i]}</span><input name="d${i}" value="${esc(fmtRanges(m.schedule[i]))}" placeholder="Libre">`).join('')}</div></div>
        </div>
        <label class="switch"><input type="checkbox" name="active" ${m.active !== false ? 'checked' : ''}> Activa (acepta reservas)</label>
        <div class="dlg-actions"><button class="btn btn--rose">Guardar</button>${id ? '<button type="button" class="btn btn--ghost" data-del>Eliminar</button>' : ''}</div>
      </form>`, (root) => {
      const f = $('[data-staff-f]', root);
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        busyRun(f.querySelector('.btn--rose'), async () => {
          const schedule = {};
          [0, 1, 2, 3, 4, 5, 6].forEach((i) => { const r = parseRanges(f['d' + i].value); if (r.length) schedule[i] = r; });
          if (!f.name.value.trim()) throw new Error('El nombre es obligatorio');
          await S.save('staff', { id: m.id || U.uid('st').slice(0, 11), name: f.name.value.trim(), role: f.role.value.trim(), hue: m.hue,
            services: $$('input[name="svc"]:checked', f).map((x) => x.value), schedule, active: f.active.checked });
          closeModal(); toast('Equipo actualizado');
        });
      });
      const del = $('[data-del]', root);
      if (del) del.addEventListener('click', () => busyRun(del, async () => { await S.remove('staff', m.id); closeModal(); toast('Profesional eliminada'); }));
    });
  }
  function timeOffModal() {
    const d = db(), today = U.dateKey(st.agendaDate);
    modal(`<p class="eyebrow">Gestión de disponibilidad</p><h2>Bloquear horas</h2>
      <form class="form" data-to>
        <div class="form-grid">
          <div class="field full"><label>¿Quién?</label><select name="staff"><option value="">Todo el salón</option>${d.staff.map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}</select></div>
          <div class="field"><label>Desde</label><input type="datetime-local" name="start" required value="${today}T10:00"></div>
          <div class="field"><label>Hasta</label><input type="datetime-local" name="end" required value="${today}T14:00"></div>
          <div class="field full"><label>Motivo (interno)</label><input name="reason" placeholder="Vacaciones, formación…"></div>
        </div>
        <p class="muted" data-to-warn></p>
        <button class="btn btn--rose">Guardar bloqueo</button>
      </form>`, (root) => {
      const f = $('[data-to]', root);
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        busyRun(f.querySelector('.btn--rose'), async () => {
          const start = new Date(f.start.value).getTime(), end = new Date(f.end.value).getTime();
          if (!(end > start)) throw new Error('La fecha de fin debe ser posterior');
          const clash = db().bookings.filter((b) => b.status === 'confirmed' && b.start < end && b.end > start && (!f.staff.value || b.staffId === f.staff.value));
          await S.save('timeOff', { id: U.uid('to'), staffId: f.staff.value || null, start, end, reason: f.reason.value.trim() });
          closeModal();
          toast(clash.length ? `Bloqueado. Ojo: ${clash.length} cita(s) ya existentes en ese tramo; revísalas en la agenda.` : 'Horas bloqueadas', !!clash.length);
        });
      });
    });
  }

  /* ======================= AUTOMATIZACIONES ======================= */
  function vAuto() {
    const d = db(), now = Date.now(), integ = d.settings.integrations;
    let list = d.outbox.slice();
    if (st.outFilter === 'pending') list = list.filter((m) => m.scheduledFor >= now - 3600000 && m.status !== 'void').sort((a, b) => a.scheduledFor - b.scheduledFor);
    else list.sort((a, b) => b.scheduledFor - a.scheduledFor);
    const total = list.length; list = list.slice(0, 120);
    const card = (ico, name, key, need) => `<div class="card integ"><span class="ico">${ico}</span><div><b>${name}</b> ${integ[key] && integ[key].configured ? '<span class="pill pill--queued">Conectado</span>' : '<span class="pill pill--needs_provider">Pendiente de conectar</span>'}<p>${need}</p></div></div>`;
    const notifState = 'Notification' in window ? Notification.permission : 'unsupported';
    return `
      <div class="grid g-4">
        <div class="card kpi"><span>Programados</span><b>${d.outbox.filter((m) => m.scheduledFor > now && m.status !== 'void').length}</b><small>mensajes futuros</small></div>
        <div class="card kpi"><span>Recordatorios</span><b>${d.outbox.filter((m) => m.template === 'reminder' && m.scheduledFor > now && m.status !== 'void').length}</b><small>24 h y 2 h antes</small></div>
        <div class="card kpi"><span>Solicitudes de reseña</span><b>${d.outbox.filter((m) => m.template === 'review_request' && m.status !== 'void').length}</b><small>a todas las clientas</small></div>
        <div class="card kpi"><span>Anulados</span><b>${d.outbox.filter((m) => m.status === 'void').length}</b><small>por cancelación o cambio</small></div>
      </div>
      <h2 style="font:400 28px var(--f-display);margin:26px 0 12px">Canales</h2>
      <div class="grid g-3">
        ${card('✉︎', 'Email', 'email', 'Confirmaciones y avisos. Requiere un proveedor transaccional (Resend, Brevo o SendGrid): <code>EMAIL_API_KEY</code> y dominio remitente verificado (SPF/DKIM).')}
        ${card('💬', 'WhatsApp', 'whatsapp', 'Recordatorios y reseñas. Requiere WhatsApp Business Cloud API: <code>WA_TOKEN</code>, <code>WA_PHONE_ID</code> y plantillas aprobadas por Meta.')}
        ${card('📱', 'SMS', 'sms', 'Alternativa a WhatsApp. Requiere Twilio u otro: <code>TWILIO_SID</code>, <code>TWILIO_TOKEN</code> y número remitente.')}
        <div class="card integ"><span class="ico">🔔</span><div><b>Avisos en este panel</b> <span class="pill pill--queued">Activo</span><p>Cada nueva reserva, cambio o cancelación aparece al instante en la campana.</p>
          ${notifState === 'default' ? '<button class="btn btn--ghost btn--sm" data-act="notif" style="margin-top:10px">Activar notificaciones del navegador</button>' : `<p class="muted">Notificaciones del navegador: ${notifState === 'granted' ? 'activadas' : notifState === 'denied' ? 'bloqueadas en el navegador' : 'no disponibles'}</p>`}</div></div>
        ${card('🛡️', 'Señal anti-ausencias (opcional)', 'payments', 'Cobro de señal al reservar servicios largos. Requiere Stripe: <code>STRIPE_SECRET_KEY</code> y webhook.')}
        <div class="card integ"><span class="ico">⏱</span><div><b>Envío programado</b><p>En producción, una tarea cada minuto (cron) envía los mensajes vencidos de esta cola. Ver <code>README.md</code>.</p></div></div>
      </div>
      <div class="card-head" style="margin:26px 0 12px"><h2 style="font:400 28px var(--f-display);margin:0">Cola de mensajes</h2>
        <div class="seg"><button class="${st.outFilter === 'pending' ? 'on' : ''}" data-act="outfilter" data-f="pending">Próximos</button><button class="${st.outFilter === 'all' ? 'on' : ''}" data-act="outfilter" data-f="all">Todos</button></div></div>
      <div class="table-wrap"><table class="t">
        <thead><tr><th>Programado</th><th>Tipo</th><th>Canal</th><th>Para</th><th>Estado</th></tr></thead>
        <tbody>${list.map((m) => `<tr data-act="msg" data-id="${m.id}"><td><b>${esc(U.fmtDateShort(m.scheduledFor))}</b> ${U.fmtTime(m.scheduledFor)}</td><td>${esc(TEMPLATE[m.template] || m.template)}${demoTag(m)}</td><td>${esc(m.channel)}</td><td>${esc(m.to)}</td><td>${pill(m.status, MSG_STATUS)}</td></tr>`).join('') || '<tr><td colspan="5"><div class="empty-state"><b>Cola vacía</b></div></td></tr>'}</tbody>
      </table></div>${total > 120 ? `<p class="muted">Mostrando 120 de ${total}.</p>` : ''}`;
  }
  function msgModal(id) {
    const m = db().outbox.find((x) => x.id === id);
    if (!m) return;
    const b = db().bookings.find((x) => x.id === m.bookingId);
    const manual = m.channel === 'whatsapp' ? U.waLink(m.to, m.text) : m.channel === 'email' ? `mailto:${m.to}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.text)}` : `sms:${m.to}?body=${encodeURIComponent(m.text)}`;
    modal(`<p class="eyebrow">${esc(TEMPLATE[m.template] || m.template)} · ${esc(m.channel)}</p><h2>${esc(m.subject)}</h2>
      <p>${pill(m.status, MSG_STATUS)} <span class="muted">Para ${esc(m.to)} · ${esc(U.fmtDate(m.scheduledFor))} ${U.fmtTime(m.scheduledFor)}</span></p>
      <div class="msg-preview">${esc(m.text)}</div>
      ${m.status === 'needs_provider' ? '<p class="muted">Este mensaje no se ha enviado porque el canal aún no tiene proveedor conectado. Mientras tanto puedes enviarlo tú desde tu móvil:</p>' : ''}
      <div class="dlg-actions">
        ${m.status === 'needs_provider' ? `<a class="btn btn--rose btn--sm" href="${esc(manual)}" target="_blank" rel="noopener" data-manual>Enviar manualmente</a>` : ''}
        ${b ? `<button class="btn btn--ghost btn--sm" data-open-b>Ver cita</button>` : ''}
      </div>`, (root) => {
      const man = $('[data-manual]', root); if (man) man.addEventListener('click', () => S.markMessage(m.id, 'sent_manual'));
      const ob = $('[data-open-b]', root); if (ob) ob.addEventListener('click', () => bookingModal(b.id));
    });
  }

  /* ======================= RESEÑAS ======================= */
  function vResenas() {
    const d = db(), r = d.settings.reviews, url = U.reviewUrl(d.settings), now = Date.now();
    const recent = d.bookings.filter((b) => b.status === 'completed' && b.end > now - 14 * DAY).sort((a, b) => b.end - a.end).slice(0, 25);
    const landing = location.href.split('#')[0].replace(/admin\.html.*$/, 'index.html') + '?opinion';
    return `
      <div class="grid g-2">
        <div class="card">
          <h2>Perfil de Empresa de Google</h2>
          <p class="muted">Pega el enlace de “Pedir reseñas” de tu Perfil de Empresa (o el Place ID). Se usará en la web, en los mensajes automáticos y en el QR.</p>
          <form class="form" data-rv>
            <div class="field"><label>Enlace de reseñas (https://g.page/r/…/review)</label><input name="url" type="url" value="${esc(r.googleReviewUrl)}" placeholder="https://g.page/r/XXXXXXXX/review"></div>
            <div class="field"><label>o Place ID</label><input name="place" value="${esc(r.googlePlaceId)}" placeholder="ChIJ…"></div>
            <div class="field"><label>Endpoint de reseñas (servidor, opcional)</label><input name="endpoint" value="${esc(r.reviewsEndpoint)}" placeholder="/api/google-reviews"><span class="muted">Para mostrar la puntuación y reseñas reales en la web. Requiere <code>GOOGLE_PLACES_API_KEY</code> en el servidor (ver <code>api/google-reviews.js</code>).</span></div>
            <div class="dlg-actions"><button class="btn btn--rose btn--sm">Guardar</button>${url ? `<a class="btn btn--ghost btn--sm" href="${esc(url)}" target="_blank" rel="noopener">Probar enlace</a>` : ''}</div>
          </form>
        </div>
        <div class="card">
          <h2>QR para el mostrador</h2>
          <p class="muted">Imprímelo junto a caja. Lleva a una página de agradecimiento con el botón oficial de Google.</p>
          <div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap"><div class="qr" data-qr></div><div><p class="muted" style="word-break:break-all">${esc(landing)}</p><button class="btn btn--ghost btn--sm" data-act="print-qr">Imprimir</button></div></div>
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="card-head"><div><h2>Pedir opinión a clientas recientes</h2><p class="muted">Se pide a <b>todas</b>, sin filtrar por satisfacción (así lo exigen las políticas de Google). Las automáticas salen ${d.settings.booking.reviewRequestDelayHours} h después de la cita.</p></div></div>
        <div class="list">${recent.map((b) => `<div class="li"><span class="li-main"><b>${esc(b.client.name)}${demoTag(b)}</b>${esc(svcOf(b.serviceId).name)} · ${esc(U.fmtDateShort(b.start))}</span>
          <a class="btn btn--ghost btn--sm" target="_blank" rel="noopener" href="${esc(U.waLink(b.client.phone, ORY.notify.templates.review_request(b, ORY.notify.context(d, b)).text))}">WhatsApp</a>
          <a class="btn btn--ghost btn--sm" href="mailto:${esc(b.client.email)}?subject=${encodeURIComponent('¿Qué tal tu visita?')}&body=${encodeURIComponent(ORY.notify.templates.review_request(b, ORY.notify.context(d, b)).text)}">Email</a></div>`).join('') || '<p class="muted">Aún no hay citas realizadas en los últimos 14 días.</p>'}</div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="card-head"><div><h2>Testimonios propios</h2><p class="muted">Opiniones recogidas en el salón. Solo se publican con permiso expreso de la clienta y nunca se presentan como reseñas de Google.</p></div></div>
        <form class="form" data-tm><div class="form-grid"><div class="field"><label>Nombre a mostrar</label><input name="author" required placeholder="Marta G."></div><div class="field full"><label>Testimonio (literal)</label><textarea name="text" required></textarea></div></div>
          <label class="check"><input type="checkbox" name="ok" required><span>La clienta ha dado su permiso para publicarlo con este nombre.</span></label>
          <button class="btn btn--rose btn--sm" style="align-self:flex-start">Añadir testimonio</button></form>
        <div class="list" style="margin-top:12px">${(d.testimonials || []).map((t) => `<div class="li"><span class="li-main"><b>${esc(t.author)}</b>${esc(t.text)}</span><button class="btn btn--ghost btn--sm" data-act="tm-del" data-id="${t.id}">Quitar</button></div>`).join('')}</div>
      </div>`;
  }
  function afterResenas(root) {
    const f = $('[data-rv]', root);
    f.addEventListener('submit', (e) => { e.preventDefault(); busyRun(f.querySelector('button'), async () => {
      const u = f.url.value.trim();
      if (u && !/^https:\/\/(g\.page|search\.google\.com|www\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl)\//.test(u)) throw new Error('El enlace debe ser de Google (g.page, search.google.com o maps.app.goo.gl)');
      await S.saveSettings({ reviews: { googleReviewUrl: u, googlePlaceId: f.place.value.trim(), reviewsEndpoint: f.endpoint.value.trim() } }); toast('Guardado');
    }); });
    const t = $('[data-tm]', root);
    t.addEventListener('submit', (e) => { e.preventDefault(); busyRun(t.querySelector('button'), async () => {
      if (!t.ok.checked) throw new Error('Hace falta el permiso de la clienta');
      await S.save('testimonials', { id: U.uid('tm'), author: t.author.value.trim(), text: t.text.value.trim(), published: true, consentAt: Date.now() }); toast('Testimonio publicado');
    }); });
    const q = $('[data-qr]', root);
    const landing = location.href.split('#')[0].replace(/admin\.html.*$/, 'index.html') + '?opinion';
    const draw = () => { if (window.QRCode) { q.innerHTML = ''; new QRCode(q, { text: landing, width: 144, height: 144, colorDark: '#3B2A28', colorLight: '#ffffff' }); } else q.innerHTML = '<span class="muted">QR no disponible sin conexión</span>'; };
    if (window.QRCode) draw(); else setTimeout(draw, 1200);
  }

  /* ======================= AJUSTES ======================= */
  function vAjustes() {
    const s = db().settings, b = s.business, k = s.booking;
    return `
      <div class="grid g-2">
        <form class="card form" data-biz>
          <h2>Datos del negocio</h2>
          <div class="form-grid">
            <div class="field"><label>Nombre comercial</label><input name="name" value="${esc(b.name)}"></div>
            <div class="field"><label>Teléfono</label><input name="phone" value="${esc(b.phone)}"></div>
            <div class="field"><label>WhatsApp (formato 34600000000)</label><input name="whatsapp" value="${esc(b.whatsapp)}"></div>
            <div class="field"><label>Email (recibe los avisos)</label><input name="email" type="email" value="${esc(b.email)}"></div>
            <div class="field full"><label>Dirección</label><input name="address" value="${esc(b.address)}"></div>
            <div class="field full"><label>Horario del salón</label><div class="sched">${[1, 2, 3, 4, 5, 6, 0].map((i) => `<span>${DAYS[i]}</span><input name="h${i}" value="${esc(fmtRanges(b.hours[i]))}" placeholder="Cerrado">`).join('')}</div></div>
          </div>
          <button class="btn btn--rose btn--sm" style="align-self:flex-start">Guardar datos</button>
        </form>
        <div class="grid" style="align-content:start">
          <form class="card form" data-pol>
            <h2>Reglas de reserva</h2>
            <div class="form-grid">
              <div class="field"><label>Antelación mínima (min)</label><input name="minNoticeMinutes" type="number" min="0" value="${k.minNoticeMinutes}"></div>
              <div class="field"><label>Reservar hasta (días)</label><input name="maxDaysAhead" type="number" min="1" max="365" value="${k.maxDaysAhead}"></div>
              <div class="field"><label>Cancelar online hasta (h antes)</label><input name="cancelCutoffHours" type="number" min="0" value="${k.cancelCutoffHours}"></div>
              <div class="field"><label>Intervalo de huecos (min)</label><select name="slotStepMinutes">${[10, 15, 20, 30].map((x) => `<option ${x === k.slotStepMinutes ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
              <div class="field"><label>Margen entre citas (min)</label><input name="defaultBufferMinutes" type="number" min="0" value="${k.defaultBufferMinutes}"></div>
              <div class="field"><label>Recordatorios (h antes, separados por coma)</label><input name="reminders" value="${k.reminderOffsetsHours.join(', ')}"></div>
            </div>
            <button class="btn btn--rose btn--sm" style="align-self:flex-start">Guardar reglas</button>
          </form>
          <div class="card">
            <h2>Datos de la demo</h2>
            <p class="muted">Las citas de ejemplo llevan la etiqueta “ejemplo”. Puedes borrarlas para enseñar la agenda vacía y hacer reservas en directo.</p>
            <div class="dlg-actions">
              <button class="btn btn--ghost btn--sm" data-act="seed">Cargar citas de ejemplo</button>
              <button class="btn btn--ghost btn--sm" data-act="clear-demo">Borrar citas de ejemplo</button>
              <button class="btn btn--ghost btn--sm" data-act="export">Exportar copia (JSON)</button>
              <button class="btn btn--ghost btn--sm" data-act="reset">Restablecer todo</button>
            </div>
          </div>
          <div class="card">
            <h2>Seguridad y privacidad</h2>
            <ul class="muted" style="padding-left:18px;margin:0;display:flex;flex-direction:column;gap:6px">
              <li>Consentimiento de privacidad obligatorio y registrado con fecha en cada reserva; promociones solo con casilla aparte.</li>
              <li>La clienta solo accede a su cita con código + email/teléfono.</li>
              <li>Protección anti-bots (campo trampa) y revalidación de disponibilidad antes de guardar.</li>
              <li>Producción: panel con inicio de sesión, base de datos con reglas por rol (RLS) y claves solo en el servidor.</li>
            </ul>
          </div>
        </div>
      </div>`;
  }
  function afterAjustes(root) {
    const biz = $('[data-biz]', root);
    biz.addEventListener('submit', (e) => { e.preventDefault(); busyRun(biz.querySelector('button'), async () => {
      const hours = {}; [0, 1, 2, 3, 4, 5, 6].forEach((i) => { hours[i] = parseRanges(biz['h' + i].value); });
      if (biz.email.value && !U.validEmail(biz.email.value)) throw new Error('Email no válido');
      await S.saveSettings({ business: { name: biz.name.value.trim(), phone: biz.phone.value.trim(), whatsapp: biz.whatsapp.value.replace(/[^\d]/g, ''), email: biz.email.value.trim(), address: biz.address.value.trim(), hours } });
      toast('Datos guardados · la web ya los muestra');
    }); });
    const pol = $('[data-pol]', root);
    pol.addEventListener('submit', (e) => { e.preventDefault(); busyRun(pol.querySelector('button'), async () => {
      const rem = pol.reminders.value.split(',').map((x) => Number(x.trim())).filter((x) => x > 0);
      await S.saveSettings({ booking: { minNoticeMinutes: Number(pol.minNoticeMinutes.value), maxDaysAhead: Number(pol.maxDaysAhead.value), cancelCutoffHours: Number(pol.cancelCutoffHours.value), slotStepMinutes: Number(pol.slotStepMinutes.value), defaultBufferMinutes: Number(pol.defaultBufferMinutes.value), reminderOffsetsHours: rem } });
      toast('Reglas guardadas');
    }); });
  }

  /* ======================= ENRUTADO Y EVENTOS ======================= */
  const VIEWS = { resumen: vResumen, agenda: vAgenda, reservas: vReservas, clientes: vClientes, servicios: vServicios, equipo: vEquipo, automatizaciones: vAuto, resenas: vResenas, ajustes: vAjustes };
  const AFTER = { resenas: afterResenas, ajustes: afterAjustes };

  function render(keepScroll) {
    const root = $('[data-root]');
    const y = scrollY;
    root.innerHTML = VIEWS[st.view]();
    if (AFTER[st.view]) AFTER[st.view](root);
    $('[data-title]').textContent = TITLES[st.view];
    $$('.side-nav a').forEach((a) => a.classList.toggle('is-active', a.dataset.view === st.view));
    if (keepScroll) scrollTo(0, y);
    chrome();
  }
  function chrome() {
    const d = db();
    const unread = d.feed.filter((n) => !n.read).length;
    $('[data-bell-count]').textContent = unread || '';
    $('[data-badge-out]').textContent = d.outbox.filter((m) => m.status === 'needs_provider' && m.scheduledFor > Date.now()).length || '';
    $('[data-demo-banner]').hidden = S.mode !== 'local';
    $('[data-today]').textContent = U.cap(U.fmtDate(Date.now(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  }
  function route() {
    const v = (location.hash || '#resumen').slice(1);
    st.view = VIEWS[v] ? v : 'resumen';
    $('[data-side]').classList.remove('open');
    render();
    scrollTo(0, 0);
  }

  function onClick(e) {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const id = el.dataset.id, act = el.dataset.act;
    if (act === 'svc-toggle') return; // gestionado en change
    switch (act) {
      case 'booking': return bookingModal(id);
      case 'client': return clientModal(id);
      case 'msg': return msgModal(id);
      case 'feed': return toggleFeed(true);
      case 'day': st.agendaDate = el.dataset.d === '0' ? U.startOfDay(Date.now()) : U.addDays(st.agendaDate, Number(el.dataset.d)); return render();
      case 'resfilter': st.resFilter = el.dataset.f; return render();
      case 'outfilter': st.outFilter = el.dataset.f; return render();
      case 'svc-edit': return serviceModal(id);
      case 'staff-edit': return staffModal(id);
      case 'timeoff': return timeOffModal();
      case 'timeoff-del': return busyRun(el, async () => { await S.remove('timeOff', id); toast('Bloqueo eliminado'); });
      case 'tm-del': return busyRun(el, async () => { await S.remove('testimonials', id); toast('Testimonio retirado'); });
      case 'notif': return Notification.requestPermission().then(() => render(true));
      case 'csv': return exportCSV();
      case 'print-qr': { const w = open('', '_blank'); const img = $('[data-qr] img, [data-qr] canvas'); const src = img ? (img.tagName === 'CANVAS' ? img.toDataURL() : img.src) : ''; w.document.write(`<title>QR reseñas</title><body style="font-family:sans-serif;text-align:center;padding:60px"><h1 style="font-weight:300">¿Qué tal tu visita?</h1><p>Escanea y cuéntanoslo en Google</p><img src="${src}" style="width:260px"><script>setTimeout(()=>print(),300)<\/script>`); return w.document.close(); }
      case 'seed': return busyRun(el, async () => { await S.seedDemo(); toast('Citas de ejemplo cargadas'); });
      case 'clear-demo': return busyRun(el, async () => { await S.clearDemo(); toast('Citas de ejemplo eliminadas'); });
      case 'export': return U.download('nacar-copia-' + U.dateKey(Date.now()) + '.json', S.exportJSON(), 'application/json');
      case 'reset': if (el.dataset.sure !== '1') { el.dataset.sure = '1'; el.textContent = 'Pulsa otra vez para confirmar'; return; } return busyRun(el, async () => { await S.factoryReset(); toast('Demo restablecida'); });
    }
  }

  function toggleFeed(force) {
    const pop = $('[data-feed]');
    const show = force !== undefined ? force : pop.hidden;
    pop.hidden = !show;
    if (show) {
      pop.innerHTML = db().feed.slice(0, 30).map(feedItem).join('') || '<p class="muted" style="padding:12px">Sin notificaciones.</p>';
      setTimeout(() => S.markFeedRead(), 1500);
    }
  }

  function exportCSV() {
    const rows = [['Nombre', 'Teléfono', 'Email', 'Visitas', 'Ausencias', 'Gastado', 'Acepta promociones']].concat(
      clients().map((c) => [c.name, c.phone, c.email, c.visits, c.noShows, c.spent, c.marketing ? 'sí' : 'no']));
    U.download('clientas-' + U.dateKey(Date.now()) + '.csv', '﻿' + rows.map((r) => r.map((x) => '"' + String(x).replace(/"/g, '""') + '"').join(';')).join('\n'), 'text/csv');
  }

  function notifyNew() {
    const d = db();
    const fresh = d.feed.filter((n) => !n.read && n.at > st.seenFeed);
    if (st.seenFeed && fresh.length) {
      const n = fresh[0];
      toast('🔔 ' + n.title);
      const bell = $('[data-bell]'); bell.classList.remove('ring'); void bell.offsetWidth; bell.classList.add('ring');
      if ('Notification' in window && Notification.permission === 'granted' && document.hidden) new Notification(n.title, { body: n.text });
    }
    st.seenFeed = Math.max(st.seenFeed, ...d.feed.map((n) => n.at), Date.now() - 1000);
  }

  async function boot() {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    scrollTo(0, 0);
    await S.init();
    if (!db().meta.seeded && S.mode === 'local') await S.seedDemo();
    st.seenFeed = Math.max(0, ...db().feed.map((n) => n.at));
    route();
    addEventListener('hashchange', route);
    document.addEventListener('click', (e) => {
      onClick(e);
      if (e.target.closest('[data-new-booking]')) newBookingModal();
      if (e.target.closest('[data-bell]')) toggleFeed();
      else if (!e.target.closest('[data-feed]')) toggleFeed(false);
      if (e.target.closest('[data-side-toggle]')) $('[data-side]').classList.toggle('open');
    });
    document.addEventListener('change', (e) => {
      const t = e.target;
      if (t.matches('[data-act="svc-toggle"]')) busyRun(null, async () => { await S.save('services', { id: t.dataset.id, active: t.checked }); toast(t.checked ? 'Servicio visible en la web' : 'Servicio oculto'); });
      if (t.matches('[data-agenda-date]') && t.value) { st.agendaDate = U.fromKey(t.value); render(); }
      if (t.matches('[data-res-staff]')) { st.resStaff = t.value; render(); }
    });
    document.addEventListener('input', U.debounce((e) => {
      const t = e.target;
      if (t.matches('[data-res-q]')) { st.resQuery = t.value; render(true); const i = $('[data-res-q]'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
      if (t.matches('[data-cli-q]')) { st.cliQuery = t.value; render(true); const i = $('[data-cli-q]'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
    }, 250));
    $$('dialog').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));
    // En vivo: cualquier cambio (también desde la web pública en otra pestaña) refresca el panel.
    S.subscribe(U.debounce(() => {
      notifyNew();
      const typing = document.activeElement && document.activeElement.closest('form');
      if (!typing) render(true); else chrome();
    }, 150));
    setInterval(() => { if (st.view === 'agenda' || st.view === 'resumen') render(true); }, 60000);
  }
  document.addEventListener('DOMContentLoaded', boot);
})(window.ORY = window.ORY || {});
