/* Utilidades compartidas (web pública + panel). Sin dependencias. */
(function (ORY) {
  'use strict';
  const MIN = 60000;
  const pad = (n) => String(n).padStart(2, '0');

  const U = {
    MIN,
    pad,
    toMin(hhmm) { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; },
    fromMin(min) { return pad(Math.floor(min / 60)) + ':' + pad(min % 60); },
    startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; },
    addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; },
    dateKey(d) { d = new Date(d); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); },
    fromKey(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); },
    sameDay(a, b) { return U.dateKey(a) === U.dateKey(b); },
    fmtTime(ms) { const d = new Date(ms); return pad(d.getHours()) + ':' + pad(d.getMinutes()); },
    fmtDate(ms, opts) {
      return new Intl.DateTimeFormat('es-ES', opts || { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(ms));
    },
    fmtDateShort(ms) { return U.fmtDate(ms, { weekday: 'short', day: 'numeric', month: 'short' }); },
    fmtDuration(min) {
      if (min < 60) return min + ' min';
      const h = Math.floor(min / 60), m = min % 60;
      return h + ' h' + (m ? ' ' + m + ' min' : '');
    },
    money(n) { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: n % 1 ? 2 : 0 }).format(n); },
    cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; },
    uid(prefix) {
      const r = (crypto.getRandomValues ? Array.from(crypto.getRandomValues(new Uint8Array(8))) : Array.from({ length: 8 }, () => Math.random() * 256 | 0))
        .map((b) => b.toString(16).padStart(2, '0')).join('');
      return (prefix || 'id') + '_' + r;
    },
    /** Código legible para la clienta (sin caracteres ambiguos). */
    code() {
      const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const bytes = crypto.getRandomValues(new Uint8Array(6));
      return 'NC-' + Array.from(bytes, (b) => abc[b % abc.length]).join('');
    },
    token() { return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join(''); },
    esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },
    normPhone(p) {
      let d = String(p || '').replace(/[^\d+]/g, '');
      if (d.startsWith('00')) d = '+' + d.slice(2);
      if (!d.startsWith('+') && d.length === 9) d = '+34' + d; // España por defecto
      return d;
    },
    validPhone(p) { const d = U.normPhone(p).replace('+', ''); return /^\d{9,15}$/.test(d); },
    validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim()); },
    normEmail(e) { return String(e || '').trim().toLowerCase(); },
    delay(ms) { return new Promise((r) => setTimeout(r, ms)); },
    debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; },
    initials(name) { return String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase(); },

    /** Enlace oficial de reseñas de Google a partir de los ajustes. */
    reviewUrl(settings) {
      const r = (settings && settings.reviews) || {};
      if (r.googleReviewUrl) return r.googleReviewUrl;
      if (r.googlePlaceId) return 'https://search.google.com/local/writereview?placeid=' + encodeURIComponent(r.googlePlaceId);
      return '';
    },
    waLink(number, text) {
      const n = String(number || '').replace(/[^\d]/g, '');
      return 'https://wa.me/' + n + (text ? '?text=' + encodeURIComponent(text) : '');
    },

    /** Archivo .ics (calendario) — funciona con Apple, Google y Outlook. */
    ics({ uid, start, end, title, description, location }) {
      const f = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const e = (s) => String(s || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
      return [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ORYON//Reservas//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
        'BEGIN:VEVENT', 'UID:' + uid, 'DTSTAMP:' + f(Date.now()), 'DTSTART:' + f(start), 'DTEND:' + f(end),
        'SUMMARY:' + e(title), 'DESCRIPTION:' + e(description), 'LOCATION:' + e(location),
        'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:' + e(title), 'END:VALARM',
        'END:VEVENT', 'END:VCALENDAR'
      ].join('\r\n');
    },
    googleCalUrl({ start, end, title, description, location }) {
      const f = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const p = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: f(start) + '/' + f(end), details: description, location });
      return 'https://calendar.google.com/calendar/render?' + p.toString();
    },
    download(filename, content, type) {
      const blob = new Blob([content], { type: type || 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    },
    prefersReducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    isTouch: () => window.matchMedia('(hover: none), (pointer: coarse)').matches
  };

  ORY.U = U;

  /* Dentro de un iframe (visor de claude.ai) una pestaña nueva pierde el acceso:
     los enlaces internos (index/admin) se abren en la misma ventana. */
  if (window.top !== window) {
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[target="_blank"]');
      if (!a) return;
      const h = a.getAttribute('href') || '';
      if (/^[a-z]+:|^\/\//i.test(h)) return; // enlaces externos: sin cambios
      e.preventDefault();
      location.href = a.href;
    }, true);
  }
})(window.ORY = window.ORY || {});
