/* =========================================================
   Albar — conserje (chat). Funciona en la web estática y en el motor de reservas.
   ========================================================= */
(() => {
  'use strict';
  if (window.__albarConcierge || /^\/(admin|demo|pago)(\/|$)|^\/mi-reserva\/[^/]+\/factura/.test(location.pathname)) return;
  window.__albarConcierge = true;
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { /* nada */ } } };
  const lang = () => (document.documentElement.lang || 'es').slice(0, 2);
  const T = {
    es: { open: 'Pregúntanos', title: 'Conserje de Albar', sub: 'Te respondemos al momento, 24 h', ph: 'Escribe tu pregunta…', send: 'Enviar', hello: '¡Hola! Soy el conserje de Albar. Pregúntame por habitaciones y precios, el restaurante, el spa o cómo llegar.', staff: 'Equipo de Albar', handoff: 'Te ha atendido el conserje. Ahora te contestará una persona del equipo aquí mismo.', demo: 'Modo demo: respuestas predefinidas (sin IA conectada)', err: 'No se ha podido enviar. Inténtalo de nuevo.', close: 'Cerrar', chips: ['¿Precio para 2 noches?', '¿Hay parking?', 'Reservar mesa', 'Hablar con una persona'] },
    en: { open: 'Ask us', title: 'Albar concierge', sub: 'Instant replies, 24/7', ph: 'Type your question…', send: 'Send', hello: 'Hi! I’m Albar’s concierge. Ask me about rooms and prices, the restaurant, the spa or getting here.', staff: 'Albar team', handoff: 'A member of the team will reply here shortly.', demo: 'Demo mode: preset answers (no AI connected)', err: 'Couldn’t send. Please try again.', close: 'Close', chips: ['Price for 2 nights?', 'Is there parking?', 'Book a table', 'Talk to a person'] },
    fr: { open: 'Une question ?', title: 'Concierge d’Albar', sub: 'Réponse immédiate, 24 h/24', ph: 'Votre question…', send: 'Envoyer', hello: 'Bonjour ! Je suis le concierge d’Albar. Chambres, prix, restaurant, spa ou accès : demandez-moi.', staff: 'Équipe d’Albar', handoff: 'Un membre de l’équipe va vous répondre ici.', demo: 'Mode démo : réponses prédéfinies', err: 'Envoi impossible. Réessayez.', close: 'Fermer', chips: ['Prix pour 2 nuits ?', 'Y a-t-il un parking ?', 'Réserver une table', 'Parler à quelqu’un'] },
    de: { open: 'Fragen Sie uns', title: 'Albar Concierge', sub: 'Sofortige Antwort, rund um die Uhr', ph: 'Ihre Frage…', send: 'Senden', hello: 'Hallo! Ich bin der Concierge von Albar. Fragen Sie mich zu Zimmern, Preisen, Restaurant, Spa oder Anreise.', staff: 'Albar-Team', handoff: 'Ein Teammitglied antwortet Ihnen gleich hier.', demo: 'Demo-Modus: vordefinierte Antworten', err: 'Senden fehlgeschlagen.', close: 'Schließen', chips: ['Preis für 2 Nächte?', 'Gibt es Parkplätze?', 'Tisch reservieren', 'Mit einer Person sprechen'] },
  };
  const t = (k) => (T[lang()] || T.en)[k];
  const esc = (s) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const linkify = (s) => esc(s).replace(/(^|\s)(\/[a-z\-]+(?:[?#][^\s<]*)?)/gi, '$1<a href="$2">$2</a>').replace(/\n/g, '<br>');

  const root = document.createElement('div');
  root.className = 'cg';
  root.innerHTML = `
    <button class="cg__fab" type="button" aria-expanded="false" aria-controls="cg-panel"><span class="cg__dot" aria-hidden="true"></span><span data-t="open"></span></button>
    <section class="cg__panel" id="cg-panel" role="dialog" aria-modal="false" aria-labelledby="cg-title" hidden>
      <header class="cg__head"><div><strong id="cg-title" data-t="title"></strong><small data-t="sub"></small></div>
        <button class="cg__x" type="button" data-x aria-label="Cerrar">✕</button></header>
      <div class="cg__demo" hidden data-t="demo"></div>
      <div class="cg__log" role="log" aria-live="polite"></div>
      <div class="cg__chips"></div>
      <form class="cg__form"><label class="vh" for="cg-in" data-t="ph"></label>
        <textarea id="cg-in" rows="1" maxlength="1500" autocomplete="off"></textarea>
        <button type="submit" class="cg__send" aria-label="Enviar">→</button></form>
    </section>`;
  document.body.appendChild(root);
  const $ = (s) => root.querySelector(s);
  const log = $('.cg__log'), panel = $('.cg__panel'), fab = $('.cg__fab'), input = $('#cg-in');
  let id = store.get('albar.cg'); let status = 'new'; let seen = 0; let poll = null; let busy = false;

  function paintTexts() {
    root.querySelectorAll('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
    fab.setAttribute('aria-label', t('open'));
    $('[data-x]').setAttribute('aria-label', t('close'));
    input.placeholder = t('ph');
    $('.cg__chips').innerHTML = t('chips').map(c => `<button type="button" class="cg__chip">${esc(c)}</button>`).join('');
  }
  function line(role, text) {
    const d = document.createElement('div');
    d.className = 'cg__msg cg__msg--' + role;
    d.innerHTML = (role === 'staff' ? `<small>${esc(t('staff'))}</small>` : '') + linkify(text);
    log.appendChild(d); log.scrollTop = log.scrollHeight;
  }
  function typing(on) {
    let el = log.querySelector('.cg__typing');
    if (on && !el) { el = document.createElement('div'); el.className = 'cg__msg cg__msg--ai cg__typing'; el.innerHTML = '<span></span><span></span><span></span>'; log.appendChild(el); log.scrollTop = log.scrollHeight; }
    if (!on && el) el.remove();
  }
  /* Modo estático (demo sin servidor): respuestas predefinidas en el navegador */
  const STATIC = location.protocol === 'file:' || document.documentElement.hasAttribute('data-static');
  const LOCAL = [
    { k: /(persona|humano|alguien|recepci|queja|reclam|human|someone|staff|complain)/i, es: 'Te paso con una persona del equipo; te contestará aquí mismo en breve (de 8:00 a 23:00). (Demo: en la versión completa el hotel recibe el aviso y responde desde su panel.)', en: 'I’m passing you to a member of the team; they’ll reply here shortly. (Demo: in the full version the hotel is notified and replies from its dashboard.)' },
    { k: /(precio|cu[aá]nto|disponib|libre|reserv|fechas|noche|price|available|book|night)/i, es: 'Para ver precios y disponibilidad, elige fechas aquí: reservar.html. Las habitaciones van desde 140 € la noche en temporada baja, y reservando en la web tienes cava de bienvenida y late check-out gratis.', en: 'To see prices and availability, pick your dates here: reservar.html. Rooms start at €140 a night in low season, and booking on our website includes welcome cava and free late check-out.' },
    { k: /(parking|aparca|coche|car|park)/i, es: 'El casco antiguo es peatonal. Tenemos parking concertado a 200 m por 14 € al día y te ayudamos con las maletas.', en: 'The old town is pedestrian. We have a partner car park 200 m away for €14 a day, and we’ll help with your luggage.' },
    { k: /(perro|mascota|gato|pet|dog)/i, es: 'Lo sentimos, por ahora no admitimos mascotas.', en: 'Sorry, we don’t accept pets for now.' },
    { k: /(niñ|hij|beb|child|kid|baby)/i, es: 'Albar es una casa solo para adultos, a partir de 16 años.', en: 'Albar is adults-only, from age 16.' },
    { k: /(check.?in|entrada|llegada|salida|check.?out|hora)/i, es: 'La entrada es desde las 15:00 y la salida hasta las 12:00. Reservando en la web, late check-out gratis hasta las 14:00 según disponibilidad.', en: 'Check-in from 3 pm, check-out by noon. Booking on our website, free late check-out until 2 pm subject to availability.' },
    { k: /(restaur|cena|comer|mesa|salmorra|dinner|table|eat)/i, es: 'Salmorra abre para comidas (13:30-16:00) y cenas (20:00-23:00), descanso los martes. Puedes reservar mesa en salmorra.html#mesa.', en: 'Salmorra is open for lunch (1:30-4 pm) and dinner (8-11 pm), closed on Tuesdays. Book a table at salmorra.html#mesa.' },
    { k: /(spa|masaje|hammam|massage)/i, es: 'El hammam está incluido en tu estancia. Los masajes empiezan en 85 €; puedes reservarlos en spa.html#cita.', en: 'The hammam is included in your stay. Massages start at €85; book at spa.html#cita.' },
    { k: /(aeropuerto|llegar|tren|tram|airport|get there)/i, es: 'Estamos a 45 min del aeropuerto de Alicante; te recogemos por 75 €. También puedes venir en el TRAM línea 9 hasta Altea.', en: 'We’re 45 min from Alicante airport; we can pick you up for €75. You can also take TRAM line 9 to Altea.' },
    { k: /(boda|evento|celebra|wedding|event)/i, es: 'Hacemos bodas íntimas de hasta 40 invitados con la casa en exclusiva. En bodas.html tienes un presupuesto orientativo al momento.', en: 'We host intimate weddings of up to 40 guests with exclusive use. Get an instant estimate at bodas.html.' },
  ];
  const localReply = (text) => {
    const es = lang() === 'es'; const hit = LOCAL.find(d => d.k.test(text));
    if (hit) return es ? hit.es : hit.en;
    return es ? 'Puedo ayudarte con habitaciones y precios, el restaurante, el spa, cómo llegar o bodas. Si prefieres, te paso con una persona del equipo.' : 'I can help with rooms and prices, the restaurant, the spa, getting here or weddings. Or I can pass you to a member of the team.';
  };
  const linkifyLocal = (s) => esc(s).replace(/(^|\s)([a-z\-]+\.html(?:#[a-z\-]+)?)/gi, '$1<a href="$2">$2</a>');

  async function load() {
    if (STATIC) { $('.cg__demo').hidden = false; if (!log.querySelector('.cg__hello')) { line('ai', t('hello')); log.lastElementChild.classList.add('cg__hello'); } return; }
    try {
      const r = await fetch('/api/concierge' + (id ? '?id=' + encodeURIComponent(id) : ''));
      if (!r.ok) throw 0;
      const j = await r.json();
      $('.cg__demo').hidden = j.mode !== 'demo';
      status = j.status;
      if (!j.lines.length) {
        if (!log.querySelector('.cg__hello')) { line('ai', t('hello')); const h = log.lastElementChild; h.classList.add('cg__hello'); log.prepend(h); }
        return;
      }
      if (seen === 0) log.innerHTML = '';
      j.lines.slice(seen).forEach(l => line(l.role === 'guest' ? 'guest' : l.role, l.text));
      seen = j.lines.length;
      $('.cg__chips').hidden = seen > 0;
    } catch { if (!log.children.length) line('ai', t('hello')); }
  }
  async function send(text) {
    if (!text.trim() || busy) return;
    busy = true; line('guest', text); seen++; input.value = ''; typing(true); $('.cg__chips').hidden = true;
    if (STATIC) {
      setTimeout(() => { typing(false); line('ai', ''); log.lastElementChild.innerHTML = linkifyLocal(localReply(text)); busy = false; }, 600);
      return;
    }
    try {
      const r = await fetch('/api/concierge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, text, lang: lang() }) });
      const j = await r.json();
      typing(false);
      if (!r.ok) { line('ai', t('err')); return; }
      if (j.id && j.id !== id) { id = j.id; store.set('albar.cg', id); }
      $('.cg__demo').hidden = j.mode !== 'demo';
      if (j.reply) { line('ai', j.reply); seen++; }
      if (j.status === 'handoff' && status !== 'handoff') { line('note', t('handoff')); }
      status = j.status; startPoll();
    } catch { typing(false); line('ai', t('err')); }
    finally { busy = false; }
  }
  function startPoll() {
    clearInterval(poll);
    if (status === 'handoff' && !panel.hidden) poll = setInterval(load, 5000);
  }
  function open(o) {
    panel.hidden = !o; fab.setAttribute('aria-expanded', String(o)); root.classList.toggle('is-open', o);
    if (o) { load().then(startPoll); setTimeout(() => input.focus(), 50); } else clearInterval(poll);
  }
  fab.addEventListener('click', () => open(panel.hidden));
  $('[data-x]').addEventListener('click', () => open(false));
  root.addEventListener('keydown', e => { if (e.key === 'Escape') open(false); });
  $('.cg__form').addEventListener('submit', e => { e.preventDefault(); send(input.value); });
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input.value); } });
  $('.cg__chips').addEventListener('click', e => { const c = e.target.closest('.cg__chip'); if (c) send(c.textContent); });
  new MutationObserver(paintTexts).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  paintTexts();
})();
