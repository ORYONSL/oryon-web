/* =========================================================
   Albar · Casa de Mar — interacción común
   ========================================================= */
(() => {
'use strict';

/* ---------- Utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = {
  get(k, s) { try { return (s === undefined ? localStorage : s).getItem(k); } catch { return null; } },
  set(k, v, s) { try { (s === undefined ? localStorage : s).setItem(k, v); } catch { /* sin almacenamiento */ } },
};
const ss = (() => { try { return sessionStorage; } catch { return null; } })();
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
/* Modo estático (demo sin servidor: doble clic o publicada como página): todo funciona en el navegador */
const STATIC = location.protocol === 'file:' || document.documentElement.hasAttribute('data-static');
window.ALBAR_STATIC = STATIC;
const isMobile = () => matchMedia('(max-width: 960px)').matches;
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

const LOCALES = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', de: 'de-DE' };
let lang = (() => {
  const saved = store.get('albar.lang');
  if (saved && UI[saved]) return saved;
  const nav = (navigator.language || 'es').slice(0, 2);
  return UI[nav] ? nav : 'es';
})();
const t = (k, vars) => {
  let s = (UI[lang] && UI[lang][k]) ?? UI.en[k] ?? UI.es[k] ?? k;
  if (vars) for (const [a, b] of Object.entries(vars)) s = s.replace(`{${a}}`, b);
  return s;
};
const L = (obj) => obj ? (obj[lang] ?? obj.en ?? obj.es) : '';
const eur = (n) => new Intl.NumberFormat(LOCALES[lang], { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const fmtD = (d, o = { day: 'numeric', month: 'short' }) => d.toLocaleDateString(LOCALES[lang], o).replace('.', '');

/* ---------- Iconos (trazo estilo Lucide) ---------- */
const P = {
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  menu: '<path d="M3 9h18"/><path d="M3 15h18"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  sunset: '<path d="M12 10V2"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m16 6-4 4-4-4"/><path d="M16 18a4 4 0 0 0-8 0"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  bed: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
  size: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  wine: '<path d="M8 22h8"/><path d="M7 10h10"/><path d="M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 0 20"/><path d="M12 2a15.3 15.3 0 0 0 0 20"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
};
const icon = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
window.ALBAR_ICON = icon;

/* ---------- Estado de la reserva ---------- */
const B = (() => {
  let s = {};
  try { s = JSON.parse((ss && ss.getItem('albar.booking')) || '{}'); } catch { s = {}; }
  const q = new URLSearchParams(location.search);
  const pick = (k, qk) => q.get(qk) ?? s[k];
  const b = {
    in: pick('in', 'in') ? parseYmd(pick('in', 'in')) : null,
    out: pick('out', 'out') ? parseYmd(pick('out', 'out')) : null,
    adults: Math.min(8, Math.max(1, +(pick('adults', 'ad') || 2))),
    rooms: Math.min(4, Math.max(1, +(pick('rooms', 'rm') || 1))),
    code: pick('code', 'code') || '',
  };
  if (b.in && b.in < today()) { b.in = null; b.out = null; }
  if (b.in && b.out && b.out <= b.in) b.out = null;
  return b;
})();
const saveB = () => { try { ss && ss.setItem('albar.booking', JSON.stringify({ in: B.in && ymd(B.in), out: B.out && ymd(B.out), adults: B.adults, rooms: B.rooms, code: B.code })); } catch { /* nada */ } };
const nightsCount = () => (B.in && B.out) ? Math.round((B.out - B.in) / 864e5) : 0;
const bookingUrl = (roomId) => {
  const q = new URLSearchParams();
  if (B.in) q.set('in', ymd(B.in));
  if (B.out) q.set('out', ymd(B.out));
  q.set('ad', B.adults); q.set('rm', B.rooms);
  if (B.code) q.set('code', B.code);
  if (roomId) q.set('room', roomId);
  q.set('lang', lang);
  return (STATIC ? 'reservar.html?' : '/reservar?') + q.toString();
};

/* Disponibilidad real desde el motor de reservas (Fase 2). Si no hay servidor, se usa el cálculo local. */
const LIVE = {};
const liveLoaded = new Set();
function loadLive(first, months, roomId, onLoad) {
  if (STATIC) return;
  const key = ymd(first) + '|' + (roomId || '');
  if (liveLoaded.has(key)) return;
  liveLoaded.add(key);
  const to = new Date(first.getFullYear(), first.getMonth() + months + 1, 1);
  fetch(`/api/availability?from=${ymd(first)}&to=${ymd(to)}${roomId ? '&room=' + roomId : ''}`)
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(j => { for (const d of j.days) LIVE[(roomId || '') + d.date] = roomId ? (d.prices[roomId] ?? null) : d.from; onLoad(); })
    .catch(() => { /* web estática sin servidor: seguimos con el cálculo local */ });
}
function priceFor(date, room) {
  const k = (room ? room.id : '') + ymd(date);
  if (k in LIVE) return LIVE[k];
  return room ? (unitsLeft(room, date) > 0 ? nightly(room, date) : null) : dayFrom(date);
}
const listeners = new Set();
const bookingChanged = () => { saveB(); listeners.forEach(fn => fn()); };

/* ---------- Momento del día ---------- */
const autoMoment = () => { const h = new Date().getHours(); return h >= 7 && h < 17 ? 'dia' : h >= 17 && h < 21 ? 'atardecer' : 'noche'; };
let moment = store.get('albar.moment', ss || undefined) || autoMoment();
function setMoment(m, persist) {
  moment = m;
  document.documentElement.dataset.moment = m;
  if (persist && ss) store.set('albar.moment', m, ss);
  $$('.hero__media img[data-m]').forEach(img => {
    const on = img.dataset.m === m;
    if (on && window.albarHeroLoad) window.albarHeroLoad(img, false);
    img.classList.toggle('is-on', on);
  });
  $$('[data-greet]').forEach(el => { el.textContent = t('greet_' + m); });
  $$('[data-set-moment]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.setMoment === m)));
  $$('.moment-card__time').forEach(el => { el.dataset.now = t('now'); });
}

/* ---------- Idioma ---------- */
const renderers = [];
function applyI18n() {
  document.documentElement.lang = lang;
  const dict = (window.I18N && (I18N[lang] || {})) || {};
  const fallback = (window.I18N && I18N.en) || {};
  $$('[data-i18n]').forEach(el => {
    if (el.dataset.es === undefined) el.dataset.es = el.innerHTML;
    const k = el.dataset.i18n;
    el.innerHTML = lang === 'es' ? el.dataset.es : (dict[k] ?? fallback[k] ?? el.dataset.es);
  });
  $$('[data-i18n-ph]').forEach(el => {
    if (el.dataset.esPh === undefined) el.dataset.esPh = el.placeholder;
    const k = el.dataset.i18nPh;
    el.placeholder = lang === 'es' ? el.dataset.esPh : (dict[k] ?? fallback[k] ?? el.dataset.esPh);
  });
  $$('[data-ui]').forEach(el => { el.textContent = t(el.dataset.ui); });
  $$('select[data-lang]').forEach(s => { s.value = lang; });
  const titleKey = document.body.dataset.title;
  if (titleKey) {
    if (!document.body.dataset.esTitle) document.body.dataset.esTitle = document.title;
    document.title = lang === 'es' ? document.body.dataset.esTitle : (dict[titleKey] ?? fallback[titleKey] ?? document.body.dataset.esTitle);
  }
  setMoment(moment);
  renderers.forEach(fn => fn());
}
function setLang(l) {
  lang = l; store.set('albar.lang', l);
  try { document.cookie = `albar_lang=${l}; path=/; max-age=31536000; SameSite=Lax`; } catch { /* nada */ }
  applyI18n();
  listeners.forEach(fn => fn());
}

/* ---------- Navegación ---------- */
const LINKS = [
  ['habitaciones.html', 'nav_rooms'], ['salmorra.html', 'nav_salmorra'], ['spa.html', 'nav_spa'],
  ['bodas.html', 'nav_bodas'], ['altea.html', 'nav_altea'], ['nosotros.html', 'nav_us'],
];
const here = location.pathname.split('/').pop() || 'index.html';

function langSelect() {
  return `<div class="lang"><label class="vh" for="lang-${Math.random().toString(36).slice(2, 7)}">Idioma</label>
    <select data-lang aria-label="Idioma / Language">${Object.keys(UI).map(l => `<option value="${l}">${l.toUpperCase()}</option>`).join('')}</select></div>`;
}
function momentSwitch() {
  return `<div class="moment" role="group" aria-label="Momento del día">
    <button type="button" data-set-moment="dia" aria-label="Día" title="Día">${icon('sun')}</button>
    <button type="button" data-set-moment="atardecer" aria-label="Atardecer" title="Atardecer">${icon('sunset')}</button>
    <button type="button" data-set-moment="noche" aria-label="Noche" title="Noche">${icon('moon')}</button></div>`;
}

function buildShell() {
  const nav = $('#nav');
  if (nav) {
    nav.className = 'nav';
    nav.innerHTML = `<div class="wrap nav__in">
      <a class="nav__logo" href="index.html"><b>ALBAR</b><span>Casa de Mar · Altea</span></a>
      <ul class="nav__links">${LINKS.map(([h, k]) => `<li><a href="${h}" data-ui="${k}" ${h === here ? 'aria-current="page"' : ''}></a></li>`).join('')}</ul>
      <div class="nav__tools">${momentSwitch()}${langSelect()}
        <a class="btn btn--primary nav__book" href="${bookingUrl()}" data-book data-ui="book"></a>
        <button class="burger" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="menu">${icon('menu')}</button></div></div>`;
  }
  document.body.insertAdjacentHTML('beforeend', `
  <div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="Menú">
    <div class="menu__top"><a class="nav__logo" href="index.html"><b>ALBAR</b><span>Casa de Mar · Altea</span></a>
      <button class="iconbtn" type="button" data-close-menu aria-label="Cerrar">${icon('x')}</button></div>
    <ul class="menu__list">${[...LINKS, ['contacto.html', 'nav_contact']].map(([h, k], i) => `<li><a href="${h}"><span style="transition-delay:${80 + i * 50}ms" data-ui="${k}"></span></a></li>`).join('')}</ul>
    <div class="menu__foot">${momentSwitch()}${langSelect()}<button class="btn btn--primary" type="button" data-open-sheet data-ui="book"></button></div>
  </div>
  <div class="mbar"><button class="btn btn--primary" type="button" data-open-sheet><span data-ui="book_from"></span><span class="price">${eur(minPrice())} ${icon('arrow')}</span></button></div>
  <div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
    <div class="sheet__top"><strong id="sheet-title" data-ui="book"></strong><button class="iconbtn" type="button" data-close-sheet aria-label="Cerrar">${icon('x')}</button></div>
    <div class="sheet__body"><div data-sheet-cal></div><div data-sheet-guests></div></div>
    <div class="sheet__foot"><button class="btn btn--primary btn--block" type="button" data-sheet-go><span data-ui="search"></span></button></div>
  </div>
  <div class="cookies" role="dialog" aria-live="polite" aria-label="Cookies"><p data-ui="cookies_txt"></p>
    <div class="cookies__btns"><button class="btn btn--secondary" type="button" data-cookies="reject" data-ui="reject"></button><button class="btn btn--secondary" type="button" data-cookies="accept" data-ui="accept"></button></div>
    <p style="margin:12px 0 0"><a href="legal.html#cookies"><span data-ui="more"></span> · cookies</a></p></div>
  <div class="toast" role="status" aria-live="polite"></div>
  <div class="cursor" aria-hidden="true"></div>`);

  const foot = $('#footer');
  if (foot) {
    foot.className = 'footer';
    foot.innerHTML = `<div class="wrap">
      <div class="footer__grid">
        <div><p class="footer__h" data-i18n="f_news_h">Cartas desde Altea</p>
          <p data-i18n="f_news_p">Una vez por estación: lo que florece, lo que se cocina y alguna tarifa que no publicamos en ningún otro sitio.</p>
          <form class="footer__news" data-news novalidate><label class="vh" for="news-mail">Email</label><input id="news-mail" type="email" required placeholder="tu@email.com" data-i18n-ph="f_news_ph"><button type="submit" aria-label="Suscribirme">${icon('arrow')}</button></form></div>
        <div><p class="footer__h" data-i18n="f_h_house">La casa</p><ul>${LINKS.map(([h, k]) => `<li><a href="${h}" data-ui="${k}"></a></li>`).join('')}</ul></div>
        <div><p class="footer__h" data-i18n="f_h_contact">Contacto</p><ul>
          <li>${HOTEL.address}</li><li><a href="tel:${HOTEL.phone.replace(/\s/g, '')}">${HOTEL.phone}</a></li>
          <li><a href="mailto:${HOTEL.email}">${HOTEL.email}</a></li><li><a href="contacto.html" data-i18n="f_how">Cómo llegar</a></li></ul></div>
        <div><p class="footer__h" data-i18n="f_h_more">Más</p><ul>
          <li><a href="${STATIC ? 'contacto.html' : '/bonos'}" data-i18n="f_gift">Bonos regalo</a></li><li><a href="${STATIC ? 'contacto.html' : '/mi-reserva'}" data-i18n="f_manage">Gestionar mi reserva</a></li><li><a href="bodas.html" data-i18n="f_events">Eventos privados</a></li>
          <li><a href="https://www.instagram.com" rel="noopener">Instagram</a></li><li><a href="contacto.html#faq" data-i18n="f_faq">Preguntas frecuentes</a></li></ul></div>
      </div>
      <div class="footer__big" aria-hidden="true">ALBAR</div>
      <div class="footer__legal"><span>© ${new Date().getFullYear()} Albar · Casa de Mar · <span data-i18n="f_demo">Proyecto de demostración: hotel y datos ficticios.</span></span>
        <nav><a href="legal.html#aviso" data-i18n="f_legal">Aviso legal</a><a href="legal.html#privacidad" data-i18n="f_privacy">Privacidad</a><a href="legal.html#cookies">Cookies</a></nav></div>
    </div>`;
  }
}

function navBehaviour() {
  const nav = $('#nav'); if (!nav) return;
  const hero = $('.hero, .room-hero');
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    const overHero = hero && y < hero.offsetHeight - 90;
    nav.classList.toggle('nav--over', !!overHero);
    nav.classList.toggle('nav--solid', !overHero);
    nav.classList.toggle('nav--hidden', y > 600 && y > lastY && !$('.pop.is-open'));
    lastY = y;
    const mbar = $('.mbar');
    if (mbar) mbar.classList.add('is-on');
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const menu = $('#menu'), burger = $('.burger');
  const openMenu = (o) => {
    menu.classList.toggle('is-open', o);
    burger && burger.setAttribute('aria-expanded', String(o));
    document.body.style.overflow = o ? 'hidden' : '';
    if (o) setTimeout(() => $('[data-close-menu]', menu).focus(), 50);
  };
  burger && burger.addEventListener('click', () => openMenu(true));
  $('[data-close-menu]').addEventListener('click', () => openMenu(false));
  addEventListener('keydown', e => { if (e.key === 'Escape') { openMenu(false); closePops(); openSheet(false); } });

  document.addEventListener('click', e => {
    const m = e.target.closest('[data-set-moment]');
    if (m) setMoment(m.dataset.setMoment, true);
    const os = e.target.closest('[data-open-sheet]');
    if (os) { openMenu(false); openSheet(true); }
    if (e.target.closest('[data-close-sheet]')) openSheet(false);
  });
  document.addEventListener('change', e => { if (e.target.matches('select[data-lang]')) setLang(e.target.value); });
}

/* ---------- Calendario ---------- */
function rangeOk(a, b, room) {
  for (let d = new Date(a); d < b; d = addDays(d, 1)) {
    if (priceFor(d, room) === null) return false;
  }
  return true;
}
function calendar(el, opts = {}) {
  const months = opts.months || 2;
  if (el._offset === undefined) el._offset = B.in ? Math.max(0, (B.in.getFullYear() - today().getFullYear()) * 12 + B.in.getMonth() - today().getMonth()) : 0;
  const t0 = today();
  loadLive(new Date(t0.getFullYear(), t0.getMonth() + el._offset, 1), months, opts.room && opts.room.id, () => { if (el.isConnected) calendar(el, opts); });
  const dows = [...Array(7)].map((_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(LOCALES[lang], { weekday: 'short' }).slice(0, 2));
  let html = '';
  for (let m = 0; m < months; m++) {
    const first = new Date(t0.getFullYear(), t0.getMonth() + el._offset + m, 1);
    const pad = (first.getDay() + 6) % 7;
    const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    let cells = '';
    for (let i = 0; i < pad; i++) cells += '<span></span>';
    for (let d = 1; d <= days; d++) {
      const date = new Date(first.getFullYear(), first.getMonth(), d);
      const past = date < t0;
      const price = priceFor(date, opts.room);
      const asCheckout = B.in && !B.out && date > B.in && rangeOk(B.in, date, opts.room);
      const disabled = past || (price === null && !asCheckout);
      const isS = B.in && +date === +B.in, isE = B.out && +date === +B.out;
      const inR = B.in && B.out && date > B.in && date < B.out;
      const low = price !== null && price <= (opts.room ? opts.room.prices.baja : minPrice());
      const cls = ['cal__day', isS && 'is-start', isE && 'is-end', inR && 'is-range', +date === +t0 && 'is-today'].filter(Boolean).join(' ');
      const label = fmtD(date, { weekday: 'long', day: 'numeric', month: 'long' }) + (price ? `, ${eur(price)}` : `, ${t('cal_closed')}`);
      cells += `<button type="button" class="${cls}" data-d="${ymd(date)}" ${disabled ? 'disabled' : ''} aria-label="${label}" ${isS || isE ? 'aria-pressed="true"' : ''}>${d}${!past && price ? `<small class="${low ? 'is-low' : ''}">${price}</small>` : '<small>&nbsp;</small>'}</button>`;
    }
    const title = first.toLocaleDateString(LOCALES[lang], { month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase());
    html += `<div><div class="cal__head"><span class="cal__title">${title}</span>
      ${m === 0 ? `<span class="cal__nav"><button type="button" data-cal="-1" aria-label="Mes anterior" ${el._offset === 0 ? 'disabled' : ''}>${icon('left')}</button><button type="button" data-cal="1" aria-label="Mes siguiente" ${el._offset > 16 ? 'disabled' : ''}>${icon('right')}</button></span>` : ''}</div>
      <div class="cal__grid">${dows.map(w => `<span class="cal__dow">${w}</span>`).join('')}${cells}</div></div>`;
  }
  const n = nightsCount();
  const status = !B.in ? t('choose_in') : !B.out ? t('choose_out') : `${fmtD(B.in)} → ${fmtD(B.out)} · ${n} ${n === 1 ? t('night') : t('nights')}`;
  const warn = B.in && minNightFrom(B.in) > 1 ? `<span class="small">${t('min_stay')}</span>` : '';
  html += `<div class="cal__foot"><div><strong>${status}</strong><div class="cal__legend"><span><i></i>${t('cal_low')}</span>${warn}</div></div>
    <div style="display:flex;gap:8px">${B.in ? `<button type="button" class="btn btn--secondary" style="height:40px;padding:0 16px" data-cal-clear>${t('clear')}</button>` : ''}</div></div>`;
  el.innerHTML = `<div class="cal">${html}</div>`;

  el.onclick = (e) => {
    e.stopPropagation();
    const nav = e.target.closest('[data-cal]');
    if (nav) { el._offset = Math.max(0, el._offset + +nav.dataset.cal); calendar(el, opts); return; }
    if (e.target.closest('[data-cal-clear]')) { B.in = B.out = null; bookingChanged(); calendar(el, opts); return; }
    const b = e.target.closest('.cal__day'); if (!b || b.disabled) return;
    const d = parseYmd(b.dataset.d);
    if (!B.in || B.out || d <= B.in) { B.in = d; B.out = null; }
    else {
      const min = minNightFrom(B.in);
      if ((d - B.in) / 864e5 < min) { toast(t('min_stay')); return; }
      if (!rangeOk(B.in, d, opts.room)) { B.in = d; B.out = null; }
      else B.out = d;
    }
    bookingChanged();
    calendar(el, opts);
    if (B.in && B.out && opts.onDone) opts.onDone();
  };
}

function guestsPicker(el, onDone) {
  const row = (k, label, note, min, max) => `<div class="guests__row"><div><strong>${label}</strong>${note ? `<small>${note}</small>` : ''}</div>
    <div class="step"><button type="button" data-g="${k}" data-v="-1" aria-label="−" ${B[k] <= min ? 'disabled' : ''}>−</button><output aria-live="polite">${B[k]}</output><button type="button" data-g="${k}" data-v="1" aria-label="+" ${B[k] >= max ? 'disabled' : ''}>+</button></div></div>`;
  el.innerHTML = `<div class="guests">${row('adults', t('adults'), t('adults_note'), 1, 8)}${row('rooms', t('rooms'), '', 1, 4)}<p class="guests__note">${t('adults_only')}</p></div>`;
  el.onclick = (e) => {
    e.stopPropagation();
    const b = e.target.closest('[data-g]'); if (!b) return;
    const k = b.dataset.g, lim = k === 'adults' ? [1, 8] : [1, 4];
    B[k] = Math.min(lim[1], Math.max(lim[0], B[k] + +b.dataset.v));
    if (k === 'rooms' && B.adults < B.rooms) B.adults = B.rooms;
    bookingChanged(); guestsPicker(el, onDone);
  };
}

const guestsLabel = () => `${B.adults} ${B.adults === 1 ? t('adult') : t('adults_l')} · ${B.rooms} ${B.rooms === 1 ? t('room') : t('rooms_l')}`;
const datesLabel = () => !B.in ? null : !B.out ? `${fmtD(B.in)} → …` : `${fmtD(B.in)} → ${fmtD(B.out)}`;

/* ---------- Buscadores ---------- */
function closePops(except) { $$('.pop.is-open').forEach(p => { if (p !== except) { p.classList.remove('is-open'); const f = p._field; f && f.setAttribute('aria-expanded', 'false'); } }); }
document.addEventListener('click', e => { if (!e.target.closest('.booker')) closePops(); });

function booker(host) {
  const variant = host.dataset.booker; // hero | inline | card
  const room = host.dataset.room ? ROOMS.find(r => r.id === host.dataset.room) : null;
  const card = variant === 'card';
  host.innerHTML = `<div class="booker ${variant === 'inline' ? 'booker--inline' : ''}" role="search">
    ${card ? `
      <button type="button" class="booker__field" data-open="cal" aria-expanded="false"><span class="booker__label" data-ui="arrival"></span><span class="booker__value" data-v="in"></span></button>
      <button type="button" class="booker__field" data-open="cal" aria-expanded="false"><span class="booker__label" data-ui="departure"></span><span class="booker__value" data-v="out"></span></button>
      <button type="button" class="booker__field" data-open="guests" aria-expanded="false"><span class="booker__label" data-ui="guests"></span><span class="booker__value" data-v="guests"></span></button>`
    : `
      <button type="button" class="booker__field" data-open="cal" aria-expanded="false"><span class="booker__label" data-ui="dates"></span><span class="booker__value" data-v="dates"></span></button>
      <button type="button" class="booker__field" data-open="guests" aria-expanded="false"><span class="booker__label" data-ui="guests"></span><span class="booker__value" data-v="guests"></span></button>
      <label class="booker__field"><span class="booker__label" data-ui="code"></span><input class="booker__value" data-v="code" autocomplete="off" spellcheck="false"></label>
      <button type="button" class="btn btn--primary booker__go" data-go><span data-ui="search"></span></button>`}
    <div class="pop ${variant !== 'hero' ? 'pop--down' : ''}" data-pop="cal" role="dialog" aria-label="Calendario"></div>
    <div class="pop ${variant !== 'hero' ? 'pop--down' : ''}" data-pop="guests" role="dialog" aria-label="Huéspedes"></div>
  </div>
  ${card ? `<div data-quote></div><a class="btn btn--primary btn--block" data-go-link href="#"><span data-ui="book"></span>${icon('arrow')}</a>` : ''}`;

  const el = $('.booker', host);
  const pops = { cal: $('[data-pop="cal"]', el), guests: $('[data-pop="guests"]', el) };

  const paint = () => {
    $$('[data-ui]', host).forEach(x => { x.textContent = t(x.dataset.ui); });
    const set = (k, v, ph) => { const x = $(`[data-v="${k}"]`, el); if (!x) return; x.textContent = v || ph; x.classList.toggle('is-empty', !v); };
    set('dates', datesLabel(), t('add_dates'));
    set('in', B.in && fmtD(B.in, { weekday: 'short', day: 'numeric', month: 'short' }), t('add_dates'));
    set('out', B.out && fmtD(B.out, { weekday: 'short', day: 'numeric', month: 'short' }), '—');
    set('guests', guestsLabel());
    const code = $('[data-v="code"]', el);
    if (code) { code.value = B.code; code.placeholder = t('code_ph'); }
    if (pops.cal.classList.contains('is-open')) calendar(pops.cal, { room, onDone: () => setTimeout(() => toggle('cal', false), 350) });
    if (card) {
      const qEl = $('[data-quote]', host), link = $('[data-go-link]', host);
      link.href = bookingUrl(room.id);
      if (B.in && B.out) {
        const q = quote(room, B.in, B.out, B.adults, B.rooms);
        qEl.innerHTML = q.fits
          ? `<ul class="list-dash" style="margin:16px 0"><li><span>${q.n} ${q.n === 1 ? t('night') : t('nights')}</span><span class="price">${eur(q.base)}</span></li>
             ${q.promo ? `<li><span class="price--accent">${t('promo_' + q.promo.key)}</span><span class="price price--accent">−${eur(q.base - q.flex)}</span></li>` : ''}
             <li><strong>${t('total')}</strong><strong class="price">${eur(q.flex)}</strong></li></ul>`
          : `<p class="small" style="color:var(--error);margin:16px 0">${q.left < B.rooms ? t('sold') : t('too_many', { n: room.pax * B.rooms })}</p>`;
      } else qEl.innerHTML = `<p class="small" style="margin:12px 0 16px">${t('no_dates')}</p>`;
    }
  };

  const toggle = (kind, force) => {
    if (isMobile()) { openSheet(true); return; }
    const p = pops[kind];
    const open = force ?? !p.classList.contains('is-open');
    closePops(open ? p : null);
    p.classList.toggle('is-open', open);
    const field = $(`[data-open="${kind}"]`, el);
    p._field = field;
    $$(`[data-open="${kind}"]`, el).forEach(f => f.setAttribute('aria-expanded', String(open)));
    if (!open) return;
    if (kind === 'guests' && !card) p.style.left = field.offsetLeft + 'px';
    if (kind === 'cal') calendar(p, { room, onDone: () => setTimeout(() => { toggle('cal', false); if (!card) toggle('guests', true); }, 350) });
    else guestsPicker(p);
  };

  el.addEventListener('click', e => {
    const f = e.target.closest('[data-open]');
    if (f) { e.stopPropagation(); toggle(f.dataset.open); }
    if (e.target.closest('[data-go]')) {
      if (!B.in || !B.out) { toggle('cal', true); return; }
      location.href = bookingUrl();
    }
  });
  const code = $('[data-v="code"]', el);
  code && code.addEventListener('input', () => { B.code = code.value.trim().toUpperCase(); saveB(); });

  listeners.add(paint);
  renderers.push(paint);
  paint();
}

/* ---------- Hoja móvil ---------- */
function openSheet(o) {
  const sh = $('#sheet'); if (!sh) return;
  sh.classList.toggle('is-open', o);
  document.body.style.overflow = o ? 'hidden' : '';
  if (o) paintSheet();
}
function paintSheet() {
  const sh = $('#sheet');
  const roomId = document.body.dataset.roomId;
  const room = roomId && ROOMS.find(r => r.id === roomId);
  calendar($('[data-sheet-cal]', sh), { months: 2, room });
  guestsPicker($('[data-sheet-guests]', sh));
}
function sheetInit() {
  const sh = $('#sheet'); if (!sh) return;
  listeners.add(() => { if (sh.classList.contains('is-open')) guestsPicker($('[data-sheet-guests]', sh)); });
  $('[data-sheet-go]', sh).addEventListener('click', () => {
    if (!B.in || !B.out) { toast(t('no_dates')); return; }
    location.href = bookingUrl(document.body.dataset.roomId);
  });
}

/* ---------- Revelados, parallax, cursor ---------- */
function reveals() {
  const els = $$('.reveal, .reveal-img');
  if (reduced || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-in')); return; }
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach(e => io.observe(e));
}
window.ALBAR_REVEAL = reveals;

function parallax() {
  if (reduced) return;
  const els = $$('[data-parallax]');
  if (!els.length) return;
  let ticking = false;
  const run = () => {
    const vh = innerHeight;
    els.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const k = parseFloat(el.dataset.parallax) || 0.08;
      const p = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = `translate3d(0, ${(-p * k * 100).toFixed(2)}%, 0)`;
    });
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
  run();
}

function cursor() {
  const c = $('.cursor');
  if (!c || reduced || !matchMedia('(pointer: fine)').matches) return;
  let x = -100, y = -100, cx = -100, cy = -100;
  addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; }, { passive: true });
  const loop = () => { cx += (x - cx) * 0.2; cy += (y - cy) * 0.2; c.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(loop); };
  loop();
  document.addEventListener('pointerover', e => {
    const tgt = e.target.closest('[data-cursor]');
    c.classList.toggle('is-big', !!tgt);
    c.textContent = tgt ? (tgt.dataset.cursor || t('view')) : '';
  });
}

/* ---------- Toast, cookies, formularios ---------- */
let toastTimer;
function toast(msg) {
  const el = $('.toast'); if (!el) return;
  el.textContent = msg; el.classList.add('is-on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('is-on'), 4200);
}
window.ALBAR_TOAST = toast;

function cookies() {
  const el = $('.cookies');
  if (!el || store.get('albar.cookies')) return;
  setTimeout(() => el.classList.add('is-on'), 1800);
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-cookies]'); if (!b) return;
    store.set('albar.cookies', b.dataset.cookies);
    el.classList.remove('is-on');
  });
}

function forms() {
  $$('form[data-news]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const i = $('input', f);
    if (!i.value || !i.checkValidity()) { i.focus(); toast(t('err_email')); return; }
    i.value = ''; toast(t('news_ok'));
  }));
  $$('form[data-form]').forEach(f => {
    f.addEventListener('submit', e => {
      e.preventDefault();
      let ok = true;
      $$('.field', f).forEach(fl => {
        const inp = $('input, textarea, select', fl);
        if (!inp) return;
        const bad = !inp.checkValidity();
        fl.classList.toggle('is-bad', bad);
        const err = $('.err', fl);
        if (err) err.textContent = inp.type === 'email' && inp.value ? t('err_email') : t('err_required');
        if (bad && ok) { inp.focus(); ok = false; }
      });
      const consent = $('input[name="consent"]', f);
      if (consent && !consent.checked) { consent.focus(); toast(t('err_required')); ok = false; }
      if (!ok) return;
      const done = $('.done', f.parentElement);
      f.style.display = 'none';
      if (done) { done.classList.add('is-on'); done.focus && done.focus(); }
      else toast(t('sent'));
    });
  });
  $$('.chips').forEach(g => g.addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (!c) return;
    if (g.dataset.single !== undefined) $$('.chip', g).forEach(x => x.setAttribute('aria-pressed', 'false'));
    c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true'));
  }));
}

/* ---------- Exponer para páginas ---------- */
window.ALBAR = { B, t, L, eur, fmtD, icon, lang: () => lang, renderers, listeners, bookingUrl, nightsCount, toast, reveals, setMoment, booker, guestsLabel, saveB, bookingChanged };

/* ---------- Arranque ---------- */
document.addEventListener('DOMContentLoaded', () => {
  try { document.cookie = `albar_lang=${lang}; path=/; max-age=31536000; SameSite=Lax`; } catch { /* nada */ }
  buildShell();
  if (typeof window.PAGE_INIT === 'function') window.PAGE_INIT(window.ALBAR);
  $$('[data-booker]').forEach(booker);
  sheetInit();
  navBehaviour();
  applyI18n();
  reveals(); parallax(); cursor(); cookies(); forms();
  listeners.add(() => $$('[data-book]').forEach(a => { a.href = bookingUrl(); }));
});
})();
