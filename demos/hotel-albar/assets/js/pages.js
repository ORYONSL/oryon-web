/* =========================================================
   Albar · Casa de Mar — lógica de cada página
   ========================================================= */
const REVIEWS = [
  { name: 'Lucía y Andrés', from: { es: 'Madrid', en: 'Madrid' }, text: { es: '“Abrimos la ventana de la Suite Mirador y nos quedamos diez minutos sin hablar. Volvemos en septiembre.”', en: '“We opened the Mirador Suite window and stood there for ten minutes without a word. Coming back in September.”' } },
  { name: 'Hannah W.', from: { es: 'Ámsterdam', en: 'Amsterdam' }, text: { es: '“El mejor arroz que he comido en España, y lo comí en pijama en mi terraza.”', en: '“The best rice dish I’ve had in Spain, and I ate it in my pyjamas on my terrace.”' } },
  { name: 'Thomas & Claire', from: { es: 'Lyon', en: 'Lyon' }, text: { es: '“Catorce habitaciones y aun así sabían cómo nos gustaba el café el segundo día.”', en: '“Fourteen rooms, and by day two they knew how we take our coffee.”' } },
];

const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';

window.PAGE_INIT = (A) => {
  const { t, L, eur, icon } = A;
  const page = document.body.dataset.page;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const roomCard = (r) => `<a class="room-card reveal" href="habitacion.html?id=${r.id}" data-cursor>
      <div class="room-card__img reveal-img"><img src="${IMG(r.img, 1000)}" alt="${r.name}: ${L(r.tagline)}" loading="lazy"></div>
      <div class="room-card__meta"><span><span class="room-card__n">${r.n}</span>&nbsp; <span class="h3">${r.name}</span></span>
      <span class="price">${t('from')} ${eur(r.prices.baja)}</span></div>
      <p>${L(r.tagline)}</p></a>`;

  /* ---------- Portada ---------- */
  if (page === 'home') {
    A.renderers.push(() => { $('#home-rooms').innerHTML = ROOMS.map(roomCard).join(''); A.reveals(); });

    const stage = $('#reviews'), dots = $('#reviews-dots');
    let i = 0, timer;
    const show = (n) => {
      i = (n + REVIEWS.length) % REVIEWS.length;
      $$('.review', stage).forEach((r, k) => r.classList.toggle('is-on', k === i));
      $$('button', dots).forEach((d, k) => d.setAttribute('aria-current', String(k === i)));
    };
    const renderReviews = () => {
      stage.innerHTML = REVIEWS.map(r => `<figure class="review" style="margin:0"><blockquote>${L(r.text)}</blockquote><figcaption class="small">${r.name} · ${L(r.from)}</figcaption></figure>`).join('');
      dots.innerHTML = REVIEWS.map((_, k) => `<button type="button" aria-label="${k + 1}"></button>`).join('');
      show(i);
    };
    dots.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; show([...dots.children].indexOf(b)); restart(); });
    const restart = () => { clearInterval(timer); timer = setInterval(() => show(i + 1), 6500); };
    A.renderers.push(renderReviews);
    restart();
  }

  /* ---------- Listado de habitaciones ---------- */
  if (page === 'rooms') {
    A.renderers.push(() => {
      $('#rooms-list').innerHTML = ROOMS.map(r => `<article class="rrow" id="${r.id}">
        <a class="rrow__img reveal-img" href="habitacion.html?id=${r.id}" data-cursor><img src="${IMG(r.img, 1400)}" alt="${r.name}" loading="lazy"></a>
        <div class="rrow__txt">
          <p class="chapter-num reveal" aria-hidden="true">${r.n}</p>
          <h2 class="h1 reveal">${r.name}</h2>
          <p class="reveal" style="margin-top:16px;color:var(--text-muted)">${L(r.tagline)}</p>
          <div class="rrow__kv reveal"><span>${icon('size')} ${r.m2} m²</span><span>${icon('users')} ${r.pax} ${t('people')}</span><span>${icon('bed')} ${L(r.bed)}</span><span>${icon('eye')} ${L(r.view)}</span></div>
          <p class="reveal"><span class="small">${t('from')}</span> <span class="price" style="font-size:22px">${eur(r.prices.baja)}</span> <span class="small">${t('per_night')} · ${r.units} ${r.units === 1 ? t('room') : t('rooms_l')}</span></p>
          <div class="rrow__actions reveal"><a class="btn btn--primary" href="${A.bookingUrl(r.id)}">${t('book')}</a><a class="link" href="habitacion.html?id=${r.id}">${t('see_room')}${ARROW}</a></div>
        </div></article>`).join('');
      A.reveals();
    });
  }

  /* ---------- Ficha de habitación ---------- */
  if (page === 'room') {
    const id = new URLSearchParams(location.search).get('id');
    const r = ROOMS.find(x => x.id === id) || ROOMS[2];
    document.body.dataset.roomId = r.id;
    const root = $('#room-root');
    root.innerHTML = `
      <section class="room-hero">
        <img src="${IMG(r.img, 1400)}" srcset="${IMG(r.img, 800)} 800w, ${IMG(r.img, 1400)} 1400w, ${IMG(r.img, 2000)} 2000w" sizes="100vw" alt="${r.name}" fetchpriority="high">
        <div class="wrap">
          <nav class="breadcrumbs" aria-label="Migas" style="color:#fff;opacity:.85"><a href="index.html">Albar</a> / <a href="habitaciones.html" data-ui="nav_rooms"></a> / ${r.name}</nav>
          <p class="eyebrow">${r.n} — ${r.m2} m²</p>
          <h1 class="display">${r.name}</h1>
          <p class="lead" style="margin-top:20px" data-slot="tagline"></p>
        </div>
      </section>
      <section class="section">
        <div class="wrap room-layout">
          <div class="room-main">
            <p class="display-quote reveal" style="font:340 clamp(24px,2.6vw,34px)/1.35 var(--font-display);margin:0" data-slot="desc"></p>
            <div class="specs reveal" data-slot="specs"></div>
            <p class="eyebrow reveal" data-slot="love-h"></p>
            <ol class="love reveal" data-slot="love"></ol>
          </div>
          <aside class="room-aside">
            <div class="bookcard">
              <div class="bookcard__price"><span class="small" data-ui="from"></span><b>${eur(r.prices.baja)}</b><span class="small" data-ui="per_night"></span></div>
              <div data-booker="card" data-room="${r.id}"></div>
              <ul class="bookcard__perks" data-slot="perks"></ul>
            </div>
          </aside>
        </div>
      </section>
      <section class="section" style="padding-top:0">
        <div class="wrap">
          <div class="gallery" data-slot="gallery">${r.gallery.map((g, k) => `<button type="button" data-k="${k}" class="reveal-img" data-cursor><img src="${IMG(g, 1400)}" alt="${r.name}, ${k + 1}" loading="lazy"></button>`).join('')}</div>
        </div>
      </section>
      <section class="section section--surface">
        <div class="wrap grid12">
          <div style="grid-column:1 / span 5" class="reveal">
            <p class="eyebrow" data-slot="tour-h"></p>
            <h2 class="h2" data-slot="tour-t"></h2>
            <p style="margin-top:20px;color:var(--text-muted)" data-slot="tour-p"></p>
            <p class="eyebrow" style="margin-top:48px" data-slot="amen-h"></p>
            <ul class="amen" data-slot="amen"></ul>
          </div>
          <div style="grid-column:7 / span 6" class="reveal">
            <div class="tour"><img src="${IMG(r.gallery[1], 1000)}" alt="" loading="lazy">
              <div class="tour__in">${icon('globe', 'tour-ico')}<p class="h3" style="margin-top:12px" data-slot="tour-ph"></p><p class="small" data-slot="tour-note"></p></div></div>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="wrap">
          <p class="eyebrow reveal" data-slot="others-h"></p>
          <div class="others" data-slot="others"></div>
        </div>
      </section>
      <div class="lightbox" role="dialog" aria-modal="true" aria-label="Galería">
        <button class="iconbtn lightbox__close" type="button" aria-label="Cerrar">${icon('x')}</button>
        <button class="iconbtn lightbox__prev" type="button" aria-label="Anterior">${icon('left')}</button>
        <img alt="">
        <button class="iconbtn lightbox__next" type="button" aria-label="Siguiente">${icon('right')}</button>
        <p class="lightbox__count"></p>
      </div>`;
    $('.tour-ico', root).style.cssText = 'width:40px;height:40px;margin:auto;display:block';

    const S = (k) => $(`[data-slot="${k}"]`, root);
    const RT = {
      es: { love: 'Por qué te va a encantar', amen: 'En la habitación', tour: 'Recorrido 360°', tourT: 'Entra antes de llegar.', tourP: 'Pronto podrás recorrer cada habitación en 360° desde el móvil, con medidas reales y la vista exacta desde la cama.', tourPh: 'Recorrido virtual', tourNote: 'Espacio reservado para el tour 360° del hotel', others: 'Otras habitaciones', perks: ['Cancelación gratuita hasta 7 días antes', 'Cava de bienvenida reservando aquí', 'Pagas en el hotel con la tarifa flexible'], specs: ['Superficie', 'Huéspedes', 'Cama', 'Vista'] },
      en: { love: 'Why you’ll love it', amen: 'In the room', tour: '360° tour', tourT: 'Step inside before you arrive.', tourP: 'Soon you’ll be able to walk through every room in 360° from your phone, with real dimensions and the exact view from the bed.', tourPh: 'Virtual tour', tourNote: 'Reserved space for the hotel’s 360° tour', others: 'Other rooms', perks: ['Free cancellation up to 7 days before', 'Welcome cava when booking here', 'Pay at the hotel with the flexible rate'], specs: ['Size', 'Guests', 'Bed', 'View'] },
      fr: { love: 'Pourquoi vous allez l’aimer', amen: 'Dans la chambre', tour: 'Visite 360°', tourT: 'Entrez avant d’arriver.', tourP: 'Bientôt, vous pourrez parcourir chaque chambre en 360° depuis votre téléphone, avec les vraies dimensions et la vue exacte depuis le lit.', tourPh: 'Visite virtuelle', tourNote: 'Espace réservé à la visite 360° de l’hôtel', others: 'Autres chambres', perks: ['Annulation gratuite jusqu’à 7 jours avant', 'Cava de bienvenue en réservant ici', 'Paiement à l’hôtel avec le tarif flexible'], specs: ['Surface', 'Personnes', 'Lit', 'Vue'] },
      de: { love: 'Warum Sie es lieben werden', amen: 'Im Zimmer', tour: '360°-Rundgang', tourT: 'Treten Sie ein, bevor Sie ankommen.', tourP: 'Bald können Sie jedes Zimmer in 360° vom Handy aus erkunden – mit echten Maßen und dem genauen Blick vom Bett.', tourPh: 'Virtueller Rundgang', tourNote: 'Platzhalter für den 360°-Rundgang des Hotels', others: 'Weitere Zimmer', perks: ['Kostenlose Stornierung bis 7 Tage vorher', 'Cava zur Begrüßung bei Direktbuchung', 'Zahlung im Hotel mit dem flexiblen Tarif'], specs: ['Größe', 'Gäste', 'Bett', 'Aussicht'] },
    };
    const paint = () => {
      const lang = A.lang(); const rt = RT[lang] || RT.en;
      const title = `${r.name} — Albar · Casa de Mar, Altea`;
      document.title = title;
      S('tagline').textContent = L(r.tagline);
      S('desc').textContent = L(r.desc);
      S('specs').innerHTML = [[icon('size'), `${r.m2} m²`, rt.specs[0]], [icon('users'), `${r.pax}`, rt.specs[1]], [icon('bed'), L(r.bed), rt.specs[2]], [icon('eye'), L(r.view), rt.specs[3]]]
        .map(([i, v, k]) => `<div>${i}<b>${v}</b><span>${k}</span></div>`).join('');
      S('love-h').textContent = rt.love;
      S('love').innerHTML = (r.love[lang] || r.love.en).map(x => `<li>${x}</li>`).join('');
      S('desc').textContent = (r.desc[lang] || r.desc.en);
      S('perks').innerHTML = rt.perks.map(p => `<li>${icon('check')}<span>${p}</span></li>`).join('');
      S('tour-h').textContent = rt.tour; S('tour-t').textContent = rt.tourT; S('tour-p').textContent = rt.tourP; S('tour-ph').textContent = rt.tourPh; S('tour-note').textContent = rt.tourNote;
      S('amen-h').textContent = rt.amen;
      S('amen').innerHTML = (AMENITIES[lang] || AMENITIES.en).map(a => `<li>${icon('check')}${a}</li>`).join('');
      S('others-h').textContent = rt.others;
      S('others').innerHTML = ROOMS.filter(x => x.id !== r.id).map(roomCard).join('');
      $$('[data-ui]', root).forEach(x => { x.textContent = t(x.dataset.ui); });
      A.reveals();
    };
    A.renderers.push(paint);

    // JSON-LD de la habitación
    const ld = document.createElement('script'); ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'HotelRoom', name: r.name, description: r.tagline.es, floorSize: { '@type': 'QuantitativeValue', value: r.m2, unitCode: 'MTK' }, occupancy: { '@type': 'QuantitativeValue', maxValue: r.pax }, image: IMG(r.img, 1200), offers: { '@type': 'Offer', priceCurrency: 'EUR', price: r.prices.baja } });
    document.head.appendChild(ld);

    // Galería a pantalla completa
    const lb = $('.lightbox', root), lbImg = $('img', lb);
    let k = 0;
    const open = (n) => { k = (n + r.gallery.length) % r.gallery.length; lbImg.src = IMG(r.gallery[k], 2200); lbImg.alt = `${r.name}, ${k + 1}`; $('.lightbox__count', lb).textContent = `${k + 1} / ${r.gallery.length}`; lb.classList.add('is-open'); document.body.style.overflow = 'hidden'; $('.lightbox__close', lb).focus(); };
    const close = () => { lb.classList.remove('is-open'); document.body.style.overflow = ''; };
    S('gallery').addEventListener('click', e => { const b = e.target.closest('button'); if (b) open(+b.dataset.k); });
    $('.lightbox__close', lb).addEventListener('click', close);
    $('.lightbox__prev', lb).addEventListener('click', () => open(k - 1));
    $('.lightbox__next', lb).addEventListener('click', () => open(k + 1));
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    addEventListener('keydown', e => { if (!lb.classList.contains('is-open')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') open(k - 1); if (e.key === 'ArrowRight') open(k + 1); });
  }

  /* ---------- Resultados de reserva ---------- */
  if (page === 'book') {
    const want = new URLSearchParams(location.search).get('room');
    const out = $('#results'), sum = $('#res-summary');
    const paint = () => {
      const B = A.B;
      if (!B.in || !B.out) {
        sum.innerHTML = `<span>${t('no_dates')}</span>`;
        out.innerHTML = ROOMS.map(r => `<article class="res"><img src="${IMG(r.img, 700)}" alt="${r.name}" loading="lazy"><div>
          <div class="res__top"><h2 class="h3">${r.n} · ${r.name}</h2><span><span class="small">${t('from')}</span> <span class="price">${eur(r.prices.baja)}</span> <span class="small">${t('per_night')}</span></span></div>
          <p style="color:var(--text-muted);margin-top:8px">${L(r.tagline)}</p><a class="link" href="habitacion.html?id=${r.id}">${t('see_room')}${ARROW}</a></div></article>`).join('');
        return;
      }
      const n = A.nightsCount();
      sum.innerHTML = `<span>${t('results_for')}</span><b>${A.fmtD(B.in, { weekday: 'short', day: 'numeric', month: 'long' })} → ${A.fmtD(B.out, { weekday: 'short', day: 'numeric', month: 'long' })}</b>
        <span>${n} ${n === 1 ? t('night') : t('nights')}</span><span>${A.guestsLabel()}</span>${B.code ? `<span>${t('code')}: <b>${B.code}</b></span>` : ''}`;
      const list = [...ROOMS].sort((a, b) => (b.id === want) - (a.id === want));
      out.innerHTML = list.map(r => {
        const q = quote(r, B.in, B.out, B.adults, B.rooms);
        const tag = !q.fits ? `<span class="res__tag res__tag--no">${q.left < B.rooms ? t('sold') : t('too_many', { n: r.pax * B.rooms })}</span>`
          : q.left === 1 ? `<span class="res__tag res__tag--warn">${t('left_one')}</span>`
          : q.left <= 2 ? `<span class="res__tag res__tag--warn">${t('left_n', { n: q.left })}</span>` : '';
        const promo = q.promo ? `<span class="res__tag res__tag--ok">${t('promo_' + q.promo.key)}</span>` : '';
        const rate = (name, desc, price, was, rid) => `<div class="rate"><div><b>${name}</b><span>${desc}</span></div>
          <div class="rate__price">${was ? `<s>${eur(was)}</s>` : ''}<strong>${eur(price)}</strong><span>${t('total')}</span></div>
          <button type="button" class="btn btn--primary" data-choose="${r.id}" data-rate="${rid}">${t('choose')}</button></div>`;
        return `<article class="res ${q.fits ? '' : 'res--out'}" ${r.id === want ? 'style="border-top:2px solid var(--accent)"' : ''}>
          <a href="habitacion.html?id=${r.id}"><img src="${IMG(r.img, 700)}" alt="${r.name}" loading="lazy"></a>
          <div><div class="res__top"><h2 class="h3">${r.n} · ${r.name}</h2><span>${tag}${promo}</span></div>
          <p style="color:var(--text-muted);margin:8px 0 0">${L(r.tagline)} · ${r.m2} m² · ${L(r.view)}</p>
          ${q.fits ? `<div class="rates">
            ${rate(t('rate_flex'), t('rate_flex_d'), q.flex, q.promo ? q.base : null, 'flex')}
            ${rate(t('rate_bf'), t('rate_bf_d'), q.breakfast, null, 'bf')}
            ${rate(t('rate_nr'), t('rate_nr_d'), q.nonref, null, 'nonref')}
            ${rate(t('rate_hb'), t('rate_hb_d'), q.halfBoard, null, 'hb')}
          </div><p class="small" style="margin-top:10px">${t('taxes')}</p>` : ''}
          </div></article>`;
      }).join('');
    };
    /* Elegir tarifa → paso 2 (datos, extras y pago simulado) */
    out.addEventListener('click', e => {
      const b = e.target.closest('[data-choose]');
      if (!b) return;
      const B = A.B, u = new URLSearchParams({ room: b.dataset.choose, rate: b.dataset.rate, in: ymd(B.in), out: ymd(B.out), ad: B.adults, rm: B.rooms, lang: A.lang() });
      if (B.code) u.set('code', B.code);
      location.href = 'checkout.html?' + u;
    });
    A.renderers.push(paint);
    A.listeners.add(paint);
  }

  /* ---------- Reservas reales de mesa y spa (Fase 4) ---------- */
  const FT = {
    es: { pick: 'Elige una fecha para ver las horas libres.', none: 'No quedan horas libres ese día (o es martes, día de descanso).', loading: 'Buscando huecos…', need: 'Elige una hora.', required: 'Este campo es obligatorio.', consent: 'Tienes que aceptar la política de privacidad.', full: 'Esa hora se acaba de llenar. Elige otra.', err: 'No se ha podido reservar. Inténtalo de nuevo.', table: (r) => `${r.people} personas · ${r.date} a las ${r.time} · ${r.zone === 'azotea' ? 'azotea' : 'comedor'}.`, spa: (r) => `${r.date} a las ${r.time} · ${r.price} € (se paga en el hotel).`, zoneAz: 'azotea', zoneIn: 'comedor', from: 'Entre', and: 'y' },
    fr: { pick: 'Choisissez une date pour voir les horaires libres.', none: 'Aucun horaire libre ce jour-là (ou c’est mardi, jour de repos).', loading: 'Recherche des disponibilités…', need: 'Choisissez un horaire.', required: 'Champ obligatoire.', consent: 'Vous devez accepter la politique de confidentialité.', full: 'Cet horaire vient d’être complet. Choisissez-en un autre.', err: 'La réservation a échoué. Réessayez.', table: (r) => `${r.people} personnes · ${r.date} à ${r.time} · ${r.zone === 'azotea' ? 'toit-terrasse' : 'salle'}.`, spa: (r) => `${r.date} à ${r.time} · ${r.price} € (à régler à l’hôtel).` },
    de: { pick: 'Wählen Sie ein Datum, um freie Zeiten zu sehen.', none: 'An diesem Tag keine freien Zeiten (oder Dienstag, Ruhetag).', loading: 'Suche freie Zeiten…', need: 'Wählen Sie eine Uhrzeit.', required: 'Pflichtfeld.', consent: 'Bitte akzeptieren Sie die Datenschutzerklärung.', full: 'Diese Zeit ist gerade voll geworden. Bitte eine andere wählen.', err: 'Buchung fehlgeschlagen. Bitte erneut versuchen.', table: (r) => `${r.people} Personen · ${r.date} um ${r.time} · ${r.zone === 'azotea' ? 'Dachterrasse' : 'Speisesaal'}.`, spa: (r) => `${r.date} um ${r.time} · ${r.price} € (Zahlung im Hotel).` },
    en: { pick: 'Choose a date to see free times.', none: 'No free times that day (or it’s Tuesday, our day off).', loading: 'Looking for free times…', need: 'Choose a time.', required: 'This field is required.', consent: 'You need to accept the privacy policy.', full: 'That time has just filled up. Choose another.', err: 'Booking failed. Please try again.', table: (r) => `${r.people} guests · ${r.date} at ${r.time} · ${r.zone === 'azotea' ? 'rooftop' : 'dining room'}.`, spa: (r) => `${r.date} at ${r.time} · €${r.price} (pay at the hotel).`, zoneAz: 'rooftop', zoneIn: 'dining room', from: 'Between', and: 'and' },
  };
  const ft = () => FT[A.lang()] || FT.en;

  /* Modo estático (demo sin servidor): mismas reglas, calculadas en el navegador */
  const STATIC = !!window.ALBAR_STATIC;
  const SPA_PRICE = { ritual: 125, relax: 85, profundo: 95, pareja: 230, facial: 70 };
  const LOCAL = {
    tableSlots(date) {
      const d = new Date(date + 'T00:00:00');
      if (d.getDay() === 2) return []; // descanso los martes
      return ['13:30', '14:00', '14:30', '15:00', '20:00', '20:30', '21:00', '21:30', '22:00'].map(t => ({ time: t, zones: t < '17' ? { comedor: 24 } : { comedor: 24, azotea: 16 } }));
    },
    spaSlots(tr) { return tr === 'ritual' || tr === 'pareja' ? ['10:00', '11:00', '12:00', '16:00', '17:00', '18:00'] : ['10:00', '11:00', '12:00', '13:00', '16:00', '17:00', '18:00', '19:00']; },
    estimate(s) {
      const guests = Math.max(2, Math.min(40, s.guests || 2)), nights = Math.max(1, Math.min(3, s.nights || 1));
      const m = /^\d{4}-\d{2}$/.test(s.month) ? Number(s.month.slice(5)) : 6;
      const season = m === 7 || m === 8 ? 'alta' : [5, 6, 9, 10].includes(m) ? 'media' : 'baja';
      const o = new Set(s.options); const lines = [];
      if (o.has('exclusive')) lines.push({ label: `Alojamiento: casa completa · ${nights} ${nights === 1 ? 'noche' : 'noches'}`, amount: Math.round(ROOMS.reduce((a, r) => a + r.units * r.prices[season], 0) * 1.1 * nights) });
      else { const rooms = Math.min(14, Math.ceil(guests / 2)); lines.push({ label: `Alojamiento: ${rooms} habitaciones · ${nights} ${nights === 1 ? 'noche' : 'noches'}`, amount: Math.round(rooms * (ROOMS[0].prices[season] + ROOMS[1].prices[season]) / 2 * 1.1 * nights) }); }
      if (o.has('dinner')) lines.push({ label: `Cena · ${guests} invitados × 95 €`, amount: guests * 95 });
      if (o.has('cocktail')) lines.push({ label: `Cóctel · ${guests} invitados × 35 €`, amount: guests * 35 });
      if (o.has('ceremony')) lines.push({ label: 'Ceremonia en la azotea', amount: 1500 });
      if (o.has('flowers')) lines.push({ label: 'Flores y decoración', amount: 900 });
      if (o.has('music')) lines.push({ label: 'Música o DJ', amount: 1200 });
      if (s.kind === 'boda') lines.push({ label: 'Coordinación del día', amount: 1000 });
      const total = lines.reduce((a, l) => a + l.amount, 0);
      return { lines, total, low: Math.round(total * 0.92 / 100) * 100, high: Math.round(total * 1.1 / 100) * 100 };
    },
  };
  const todayIso = new Date().toISOString().slice(0, 10);

  $$('form[data-venue]').forEach(form => {
    const kind = form.dataset.venue;
    const box = $('[data-slots]', form);
    const q = (id) => $('#' + id, form);
    const dateEl = kind === 'table' ? q('m-date') : q('s-date');
    dateEl.min = todayIso;
    let selected = null;
    async function loadSlots() {
      selected = null;
      if (!dateEl.value) { box.innerHTML = `<span class="small">${ft().pick}</span>`; return; }
      box.innerHTML = `<span class="small">${ft().loading}</span>`;
      const params = kind === 'table'
        ? `kind=table&date=${dateEl.value}&people=${q('m-pax').value}`
        : `kind=spa&date=${dateEl.value}&treatment=${q('s-tr').value}&people=${q('s-pax').value}`;
      try {
        const j = STATIC
          ? { slots: kind === 'table' ? LOCAL.tableSlots(dateEl.value) : LOCAL.spaSlots(q('s-tr').value) }
          : await (await fetch('/api/venues?' + params)).json();
        let slots = j.slots || [];
        if (kind === 'table') { const z = q('m-zone').value; slots = slots.filter(s => z === 'any' || s.zones[z] != null).map(s => s.time); }
        box.innerHTML = slots.length ? slots.map(t => `<button type="button" class="chip" role="radio" aria-checked="false" aria-pressed="false" data-time="${t}">${t}</button>`).join('') : `<span class="small">${ft().none}</span>`;
      } catch { box.innerHTML = `<span class="small">${ft().err}</span>`; }
    }
    box.addEventListener('click', e => { const c = e.target.closest('[data-time]'); if (!c) return; selected = c.dataset.time; $$('[data-time]', box).forEach(b => { const on = b === c; b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-checked', String(on)); }); $('[data-slot-err]', form).textContent = ''; });
    ['change'].forEach(ev => form.addEventListener(ev, e => { if (e.target.matches('input[type=date], select')) loadSlots(); }));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      let ok = true;
      const reqIds = kind === 'table' ? ['m-date', 'm-name', 'm-phone'] : ['s-date', 's-name', 's-phone'];
      reqIds.forEach(id => { const el = q(id); const fl = el.closest('.field'); const bad = !el.value.trim(); fl.classList.toggle('is-bad', bad); const er = $('.err', fl); if (er) er.textContent = ft().required; if (bad && ok) { el.focus(); ok = false; } });
      if (ok && !selected) { $('[data-slot-err]', form).textContent = ft().need; $('[data-slot-err]', form).style.display = 'block'; ok = false; }
      const consent = $('input[name="consent"]', form);
      if (ok && !consent.checked) { A.toast(ft().consent); consent.focus(); ok = false; }
      if (!ok) return;
      const body = kind === 'table'
        ? { kind, date: dateEl.value, time: selected, people: q('m-pax').value, zone: q('m-zone').value, name: q('m-name').value, phone: q('m-phone').value, email: q('m-mail').value, notes: q('m-notes').value, consent: true }
        : { kind, date: dateEl.value, time: selected, treatment: q('s-tr').value, people: q('s-pax').value, name: q('s-name').value, phone: q('s-phone').value, email: q('s-mail').value, bookingRef: q('s-ref').value, consent: true };
      const btn = $('button[type=submit]', form); btn.classList.add('is-loading');
      try {
        let j;
        if (STATIC) {
          const people = kind === 'spa' && body.treatment === 'pareja' ? 2 : Number(body.people);
          j = { ...body, people, zone: body.zone === 'any' || !body.zone ? 'comedor' : body.zone, price: kind === 'spa' ? (body.treatment === 'pareja' ? 230 : SPA_PRICE[body.treatment] * people) : 0 };
        } else {
          const r = await fetch('/api/venues', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          j = await r.json();
          if (!r.ok) { A.toast(j.error === 'full' || j.error === 'zone_full' ? ft().full : ft().err); loadSlots(); return; }
        }
        form.style.display = 'none';
        const done = $('.done', form.parentElement);
        $('[data-done-detail]', done).textContent = kind === 'table' ? ft().table(j) : ft().spa(j);
        done.classList.add('is-on'); done.focus();
      } catch { A.toast(ft().err); }
      finally { btn.classList.remove('is-loading'); }
    });
  });

  /* ---------- Presupuesto de bodas al momento ---------- */
  $$('form[data-lead]').forEach(form => {
    const q = (s) => $(s, form);
    const state = () => ({
      kind: (q('[data-kind] [aria-pressed="true"]') || {}).dataset?.v || 'boda',
      month: q('#b-date').value, guests: Number(q('#b-guests').value) || 2, nights: Number(q('#b-nights').value) || 1,
      options: $$('[data-opts] [aria-pressed="true"]', form).map(b => b.dataset.v),
    });
    const fmt = (n) => new Intl.NumberFormat(A.lang() === 'es' ? 'es-ES' : 'en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
    let timer;
    async function preview() {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          const j = STATIC ? LOCAL.estimate(state())
            : await (await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'preview', ...state() }) })).json();
          q('[data-q-total]').textContent = `${fmt(j.low)} – ${fmt(j.high)}`;
          q('[data-q-lines]').innerHTML = j.lines.map(l => `<li><span>${l.label}</span><span class="num">${fmt(l.amount)}</span></li>`).join('');
        } catch { /* sin servidor: se queda el texto por defecto */ }
      }, 200);
    }
    form.addEventListener('input', preview);
    form.addEventListener('click', e => { if (e.target.closest('.chip')) setTimeout(preview, 0); });
    preview();
    form.addEventListener('submit', async e => {
      e.preventDefault();
      let ok = true;
      ['#b-name', '#b-mail'].forEach(s => { const el = q(s); const fl = el.closest('.field'); const bad = !el.value.trim() || !el.checkValidity(); fl.classList.toggle('is-bad', bad); const er = $('.err', fl); if (er) er.textContent = ft().required; if (bad && ok) { el.focus(); ok = false; } });
      const consent = $('input[name="consent"]', form);
      if (ok && !consent.checked) { A.toast(ft().consent); ok = false; }
      if (!ok) return;
      const btn = $('button[type=submit]', form); btn.classList.add('is-loading');
      try {
        if (!STATIC) {
          const r = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...state(), name: q('#b-name').value, email: q('#b-mail').value, message: q('#b-msg').value, lang: A.lang(), consent: true }) });
          if (!r.ok) throw 0;
        }
        form.style.display = 'none';
        const done = $('.done', form.parentElement); done.classList.add('is-on'); done.focus();
      } catch { A.toast(ft().err); }
      finally { btn.classList.remove('is-loading'); }
    });
  });

  /* ---------- Altea: mapa + guía ---------- */
  if (page === 'altea') {
    const pins = $$('.map .pin'), items = $$('.plan li[data-pin]');
    const on = (id) => { pins.forEach(p => p.classList.toggle('is-on', p.dataset.pin === id)); items.forEach(i => i.classList.toggle('is-on', i.dataset.pin === id)); };
    items.forEach(i => { i.addEventListener('mouseenter', () => on(i.dataset.pin)); i.addEventListener('click', () => on(i.dataset.pin)); i.tabIndex = 0; i.addEventListener('focus', () => on(i.dataset.pin)); });
    pins.forEach(p => p.addEventListener('click', () => { on(p.dataset.pin); const it = items.find(i => i.dataset.pin === p.dataset.pin); it && it.scrollIntoView({ behavior: 'smooth', block: 'center' }); }));
  }
};
