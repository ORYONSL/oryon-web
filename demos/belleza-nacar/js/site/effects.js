/* ==========================================================================
   Efectos y transiciones
   Un único bucle requestAnimationFrame lee el scroll una vez por frame y
   escribe variables CSS; el resto lo pinta la GPU (transform / clip-path).
   ========================================================================== */
(function (ORY) {
  'use strict';
  const U = ORY.U;
  const reduced = U.prefersReducedMotion();
  const touch = U.isTouch();
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => (v !== v ? a : Math.min(b, Math.max(a, v))); // NaN-safe

  /* ---------------- Intro ---------------- */
  function intro() {
    const body = document.body;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    if (!location.hash) scrollTo(0, 0);
    const finish = () => {
      body.classList.add('intro-out');
      setTimeout(() => body.classList.add('is-ready'), 350);
      setTimeout(() => { body.classList.add('intro-done'); body.classList.remove('is-loading'); }, 1400);
    };
    if (reduced) { body.classList.add('is-ready', 'intro-done'); body.classList.remove('is-loading'); return; }
    const minTime = new Promise((r) => setTimeout(r, 1500));
    const img = $('.hero-media img');
    const imgReady = new Promise((r) => { if (!img || img.complete) r(); else { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); setTimeout(r, 2600); } });
    Promise.all([minTime, imgReady]).then(finish);
  }

  /* ---------------- Cursor + magnetismo ---------------- */
  function cursor() {
    if (touch || reduced) return;
    document.documentElement.classList.add('has-cursor');
    const c = $('.cursor'), ring = $('.cursor-ring'), dot = $('.cursor-dot'), label = $('.cursor-label');
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
    (function loop() {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      dot.style.transform = `translate3d(${x}px,${y}px,0)`;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      label.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener('pointerover', (e) => {
      const v = e.target.closest('[data-cursor]');
      const h = e.target.closest('a, button, .opt, .chip, input, textarea, select, label');
      c.classList.toggle('is-view', !!v);
      c.classList.toggle('is-hover', !v && !!h);
      label.textContent = v ? v.dataset.cursor : '';
    });
    document.addEventListener('pointerleave', () => { c.style.opacity = 0; });
    document.addEventListener('pointerenter', () => { c.style.opacity = 1; });
  }

  function magnetic() {
    if (touch || reduced) return;
    document.addEventListener('pointermove', (e) => {
      const b = e.target.closest('.btn');
      if (b) {
        const r = b.getBoundingClientRect();
        b.style.setProperty('--bx', (e.clientX - r.left) + 'px');
        b.style.setProperty('--by', (e.clientY - r.top) + 'px');
        if (b.classList.contains('magnetic')) {
          const dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height;
          b.style.transform = `translate(${dx * 10}px, ${dy * 8}px)`;
        }
      }
    }, { passive: true });
    document.addEventListener('pointerout', (e) => {
      const b = e.target.closest && e.target.closest('.magnetic');
      if (b && !b.contains(e.relatedTarget)) b.style.transform = '';
    });
  }

  /* Brillo nacarado + leve inclinación en las tarjetas */
  function cardSheen() {
    if (touch || reduced) return;
    document.addEventListener('pointermove', (e) => {
      const card = e.target.closest('.svc');
      if (!card) return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--cx', px * 100 + '%');
      card.style.setProperty('--cy', py * 100 + '%');
      card.style.transform = `perspective(900px) rotateY(${(px - 0.5) * 6}deg) rotateX(${(0.5 - py) * 5}deg) translateY(-4px)`;
    }, { passive: true });
    document.addEventListener('pointerout', (e) => {
      const card = e.target.closest && e.target.closest('.svc');
      if (card && !card.contains(e.relatedTarget)) card.style.transform = '';
    });
  }

  /* ---------------- Polvo de iluminador (hero) ---------------- */
  function dust() {
    const cv = $('[data-dust]');
    if (!cv || reduced) return;
    const ctx = cv.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 1.75);
    let w, h, parts = [], running = true, mx = -999, my = -999;
    const N = innerWidth < 700 ? 34 : 80;
    const colors = ['255,250,244', '233,205,160', '240,196,188', '255,236,214'];
    function size() {
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn(p, initial) {
      p.x = Math.random() * w; p.y = initial ? Math.random() * h : h + 10;
      p.r = 0.6 + Math.random() * 2.2; p.vx = (Math.random() - 0.5) * 0.15; p.vy = -(0.12 + Math.random() * 0.35);
      p.ph = Math.random() * Math.PI * 2; p.c = colors[Math.random() * colors.length | 0]; p.ox = 0; p.oy = 0;
      return p;
    }
    size();
    for (let i = 0; i < N; i++) parts.push(spawn({}, true));
    addEventListener('resize', U.debounce(size, 200));
    cv.parentElement.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }, { passive: true });
    cv.parentElement.addEventListener('pointerleave', () => { mx = my = -999; });
    new IntersectionObserver(([en]) => { running = en.isIntersecting; if (running) requestAnimationFrame(tick); }).observe(cv);
    document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) requestAnimationFrame(tick); });
    let t = 0;
    function tick() {
      if (!running) return;
      if (document.body.classList.contains('lock')) { setTimeout(() => requestAnimationFrame(tick), 300); return; }
      t += 0.016;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.vx + Math.sin(t + p.ph) * 0.12; p.y += p.vy;
        const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
        if (d2 < 16000) { const f = (1 - d2 / 16000) * 2.2; p.ox += dx / Math.sqrt(d2 + 1) * f; p.oy += dy / Math.sqrt(d2 + 1) * f; }
        p.ox *= 0.92; p.oy *= 0.92;
        if (p.y < -10) spawn(p, false);
        const a = 0.35 + Math.sin(t * 2 + p.ph) * 0.3;
        const x = p.x + p.ox, y = p.y + p.oy;
        ctx.fillStyle = `rgba(${p.c},${a * 0.25})`;
        ctx.beginPath(); ctx.arc(x, y, p.r * 3.2, 0, 6.283); ctx.fill();
        ctx.fillStyle = `rgba(${p.c},${Math.min(1, a + 0.35)})`;
        ctx.beginPath(); ctx.arc(x, y, p.r, 0, 6.283); ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------------- Manifiesto: palabras que se encienden ---------------- */
  function splitWords() {
    const el = $('[data-words]');
    if (!el) return [];
    const accents = ['belleza', 'mano,', 'respira', 'tuya.', 'escuchándote.'];
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w${accents.includes(w) ? ' accent' : ''}">${U.esc(w)}</span>`).join(' ');
    return $$('.w', el);
  }

  /* ---------------- Bucle de scroll ---------------- */
  function scrollScene() {
    const root = document.documentElement;
    const hero = $('[data-hero]');
    const nav = $('[data-nav]');
    const strands = $('[data-strands]');
    const manifesto = $('.manifesto');
    const words = splitWords();
    const hs = $('[data-hscroll]');
    const track = $('[data-track]');
    const hprog = $('[data-hprogress]');
    const expand = $('[data-expand]');
    const strokes = $$('[data-stroke]').map((p) => p.closest('section'));
    const mobileBar = $('.mobile-bar');
    let lastY = scrollY, vh = innerHeight, hsDist = 0;

    function layoutH() {
      if (!hs || !track) return;
      if (innerWidth <= 900 || reduced) { hs.style.height = ''; hsDist = 0; track.style.setProperty('--tx', '0px'); return; }
      hsDist = Math.max(0, track.scrollWidth - innerWidth);
      hs.style.height = (innerHeight + hsDist) + 'px';
    }
    ORY.fx.relayout = () => { vh = innerHeight; layoutH(); };
    addEventListener('resize', U.debounce(ORY.fx.relayout, 150));
    layoutH();

    // mouse para parallax del hero
    if (!touch && !reduced) {
      addEventListener('pointermove', (e) => {
        hero.style.setProperty('--mx', ((e.clientX / innerWidth) - 0.5).toFixed(3));
        hero.style.setProperty('--my', ((e.clientY / innerHeight) - 0.5).toFixed(3));
      }, { passive: true });
    }

    function frame() {
      const y = scrollY;
      vh = innerHeight || 1;
      // Hero: la cámara se aleja y el marco se convierte en tarjeta
      const hp = clamp(y / vh);
      if (!reduced) hero.style.setProperty('--hp', hp.toFixed(4));
      // Nav
      nav.classList.toggle('is-solid', y > 40);
      nav.classList.toggle('is-hidden', y > vh && y > lastY + 2 && !document.body.classList.contains('menu-open'));
      if (y < lastY - 2) nav.classList.remove('is-hidden');
      if (mobileBar) mobileBar.classList.toggle('is-on', y > vh * 0.6);
      // Manifiesto
      if (manifesto) {
        const r = manifesto.getBoundingClientRect();
        const p = clamp((vh - r.top) / (r.height + vh * 0.2));
        if (strands) strands.style.setProperty('--sp', clamp(p * 1.3).toFixed(4));
        const lit = Math.floor(clamp((vh * 0.85 - r.top) / (r.height * 0.75)) * words.length);
        words.forEach((w, i) => w.classList.toggle('on', i < lit || reduced));
      }
      // Servicios horizontales
      if (hs && hsDist > 0) {
        const r = hs.getBoundingClientRect();
        const p = clamp(-r.top / hsDist);
        track.style.setProperty('--tx', (-p * hsDist).toFixed(1) + 'px');
        hprog.style.setProperty('--hpr', p.toFixed(4));
      } else if (hprog && track) {
        const p = track.scrollWidth > track.clientWidth ? track.scrollLeft / (track.scrollWidth - track.clientWidth) : 0;
        hprog.style.setProperty('--hpr', p.toFixed(4));
      }
      // Pinceladas divisorias
      strokes.forEach((s) => {
        const r = s.getBoundingClientRect();
        s.querySelector('.stroke-divider').style.setProperty('--dp', clamp((vh - r.top) / (vh * 0.8)).toFixed(4));
      });
      // Imagen que se expande
      if (expand && !reduced) {
        const r = expand.getBoundingClientRect();
        const p = clamp(-r.top / (r.height - vh));
        expand.style.setProperty('--ep', (p < 0.08 ? 0 : clamp((p - 0.08) / 0.62)).toFixed(4));
      }
      lastY = y;
    }
    let ticking = false;
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { frame(); ticking = false; }); } };
    addEventListener('scroll', onScroll, { passive: true });
    if (track) track.addEventListener('scroll', onScroll, { passive: true });
    frame();

    // Enlace activo
    const links = $$('.nav-links a');
    const io = new IntersectionObserver((ens) => ens.forEach((en) => {
      if (en.isIntersecting) links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    ['tratamientos', 'reservar', 'atelier', 'opiniones', 'contacto'].forEach((id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------------- Revelados ---------------- */
  function reveals() {
    const io = new IntersectionObserver((ens) => ens.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
    ORY.fx.observe = (el) => io.observe(el);
    $$('.reveal, .brush, .gallery-grid figure').forEach((el) => io.observe(el));
  }

  /* ---------------- Menú móvil ---------------- */
  function menu() {
    const b = $('[data-burger]'), m = $('[data-menu]');
    const set = (open) => {
      document.body.classList.toggle('menu-open', open);
      document.body.classList.toggle('lock', open);
      b.setAttribute('aria-expanded', open); m.setAttribute('aria-hidden', !open);
      b.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    };
    b.addEventListener('click', () => set(!document.body.classList.contains('menu-open')));
    m.addEventListener('click', (e) => { if (e.target.closest('a, button')) set(false); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
  }

  ORY.fx = { init() { intro(); cursor(); magnetic(); cardSheen(); dust(); scrollScene(); reveals(); menu(); } };
})(window.ORY = window.ORY || {});
