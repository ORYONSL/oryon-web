/* =========================================================
   Albar · Casa de Mar — datos del hotel (ficticios)
   En la Fase 2 esto vendrá de la base de datos (Supabase).
   ========================================================= */

/* SUSTITUIR: fotos de Unsplash usadas como placeholder hasta tener las del hotel */
const IMG = (id, w = 1600) => `assets/img/${id}.jpg`;

const PHOTOS = {
  heroDia: '1686953377261-8a47e200fe52',
  heroAtardecer: '1674338340494-a13b6400e7dc',
  heroNoche: '1782067170882-6f720f230f82',
  cupula: '1715597809718-f0c6ba5c1da0',
  callejon: '1712096712531-46f32f10107c',
  iglesia: '1645640939550-a4a4c60b65f3',
  tejados: '1712045927218-521b149861b2',
  puerta: '1534345297779-87af8f3a4455',
  balcon: '1686953377385-c26161ce0971',
  piscina: '1562407132-e23789f81bb7',
  paella: '1763647738062-d83e44328a6f',
  chef: '1775513153018-0c7ac7899751',
  pan: '1582536446725-5ad9e6ef0535',
  coctel: '1643633052713-3978931c81a6',
  azoteaNoche: '1621275471769-e6aa344546d5',
  hammam: '1761470575018-135c213340eb',
  spaLuz: '1773924093206-9a433a14bb44',
  boda: '1781090876896-2dd07110eb55',
  pareja: '1780383925160-503f1ad2a6a9',
  piedra: '1776001109514-6fc611ac036a',
  desayuno: '1638826108040-8205e0323486',
  limonero: '1767498691864-e278d7d2c1a5',
  ventanaMar: '1709809994973-3440fac94d65',
};

const HOTEL = {
  name: 'Albar · Casa de Mar',
  phone: '+34 965 00 00 00',          // ficticio
  whatsapp: '+34 600 000 000',        // ficticio
  email: 'hola@albarcasademar.com',   // ficticio
  address: 'Carrer Major, 12 · 03590 Altea (Alicante)',
  checkIn: '15:00', checkOut: '12:00',
  minAge: 16,
  closed: [{ from: '2027-01-07', to: '2027-01-29' }], // cierre de invierno
  rating: 9.7, reviewsCount: 412,
};

const ROOMS = [
  {
    id: 'cal', n: '01', name: 'Cal', units: 4, m2: 22, pax: 2,
    prices: { baja: 140, media: 175, alta: 210 },
    img: '1631642659688-ea5ee49f099e',
    gallery: ['1631642659688-ea5ee49f099e', '1601276174812-63280a55656e', '1639678349557-ffe5bed73ce7'],
    bed: { es: 'Cama de 180', en: 'King bed (180)', fr: 'Lit 180', de: 'Bett 180' },
    view: { es: 'Patio interior', en: 'Inner patio', fr: 'Patio intérieur', de: 'Innenhof' },
    tagline: {
      es: 'Muros de piedra, patio interior y el silencio de una casa antigua.',
      en: 'Stone walls, an inner patio and the hush of an old house.',
      fr: 'Murs de pierre, patio intérieur et le silence d’une maison ancienne.',
      de: 'Steinmauern, ein Innenhof und die Stille eines alten Hauses.',
    },
    desc: {
      es: 'Las habitaciones Cal son el corazón más antiguo de la casa. Muros de piedra de sesenta centímetros que guardan el fresco en verano, suelos de barro cocido hechos a mano en la Vall d’Uixó y una ventana que mira al patio, donde a media mañana solo se oye el agua de la fuente. Pequeñas en metros, enormes en calma.',
      en: 'The Cal rooms are the oldest heart of the house. Sixty-centimetre stone walls that keep the cool in summer, handmade terracotta floors and a window onto the patio, where by mid-morning all you hear is the fountain. Small in square metres, vast in calm.',
    },
    love: {
      es: ['La ducha de lluvia en piedra natural, con amenities de aceite de oliva de la Marina Baixa.', 'El patio a primera hora: café, la fuente y nadie más.', 'Es la forma más asequible de vivir Albar, con todo lo que incluye la casa.'],
      en: ['The rain shower in natural stone, with olive-oil amenities from the Marina Baixa.', 'The patio at first light: coffee, the fountain and no one else.', 'The most affordable way to live Albar, with everything the house includes.'],
    },
  },
  {
    id: 'terraza', n: '02', name: 'Terraza', units: 4, m2: 28, pax: 2,
    prices: { baja: 190, media: 235, alta: 280 },
    img: '1686953377385-c26161ce0971',
    gallery: ['1686953377385-c26161ce0971', '1780988304043-1f4e4aa1e236', '1704789202340-85a4786aa2c0'],
    bed: { es: 'Cama de 180', en: 'King bed (180)', fr: 'Lit 180', de: 'Bett 180' },
    view: { es: 'Tejados y mar', en: 'Rooftops & sea', fr: 'Toits et mer', de: 'Dächer & Meer' },
    tagline: {
      es: 'Una terraza privada sobre los tejados, para desayunar mirando al mar.',
      en: 'A private terrace above the rooftops, made for breakfast facing the sea.',
      fr: 'Une terrasse privée au-dessus des toits, pour déjeuner face à la mer.',
      de: 'Eine private Terrasse über den Dächern – Frühstück mit Meerblick.',
    },
    desc: {
      es: 'Abres la puerta y Altea entera se pone a tus pies: tejas árabes, la cúpula azul a la izquierda y, al fondo, el Mediterráneo. Cada habitación Terraza tiene su propio rincón exterior con dos hamacas, una mesa para el desayuno y toldo de lino. Por dentro, cal blanca, madera de olivo y lino lavado.',
      en: 'Open the door and all of Altea lies at your feet: clay tiles, the blue dome to your left and, beyond, the Mediterranean. Each Terrace room has its own outdoor nook with two loungers, a breakfast table and a linen awning. Inside: whitewash, olive wood and washed linen.',
    },
    love: {
      es: ['Pedir el desayuno a la terraza sin coste adicional.', 'Ver encenderse las luces del pueblo desde la hamaca.', 'Toldo y cortinas de lino para la siesta perfecta.'],
      en: ['Breakfast served on your terrace at no extra cost.', 'Watching the village lights come on from your lounger.', 'Linen awning and curtains for the perfect siesta.'],
    },
  },
  {
    id: 'mirador', n: '03', name: 'Suite Mirador', units: 3, m2: 42, pax: 2,
    prices: { baja: 290, media: 350, alta: 420 },
    img: '1779942578833-5f00dc79d6d1',
    gallery: ['1779942578833-5f00dc79d6d1', '1709809994973-3440fac94d65', '1760204741315-abfc98ce3bf5'],
    bed: { es: 'Cama de 200', en: 'Super king (200)', fr: 'Lit 200', de: 'Bett 200' },
    view: { es: 'Mar abierto', en: 'Open sea', fr: 'Pleine mer', de: 'Offenes Meer' },
    tagline: {
      es: 'Una bañera exenta frente a un ventanal al mar. No hace falta más.',
      en: 'A freestanding bathtub facing a wall of sea. Nothing else needed.',
      fr: 'Une baignoire îlot face à une baie vitrée sur la mer. Rien de plus.',
      de: 'Eine freistehende Wanne vor einem Fenster aufs Meer. Mehr braucht es nicht.',
    },
    desc: {
      es: 'Las Suites Mirador ocupan la fachada que da al mar. Un arco de piedra enmarca el horizonte y, justo delante, la bañera exenta: el sitio donde todo el mundo acaba viendo amanecer. Zona de estar con sofá de lino, tocadiscos con una selección de vinilos mediterráneos y una botella de cava local esperando a tu llegada.',
      en: 'The Mirador Suites sit on the sea-facing façade. A stone arch frames the horizon and, right in front, the freestanding tub: the place where everyone ends up watching the sunrise. A lounge with a linen sofa, a record player with Mediterranean vinyl and a bottle of local cava awaiting your arrival.',
    },
    love: {
      es: ['El amanecer desde la bañera: la luz entra directa por el arco.', 'Tocadiscos y vinilos elegidos por el equipo.', 'Cava de bienvenida y late check-out preferente.'],
      en: ['Sunrise from the tub: light pours straight through the arch.', 'Record player and vinyl chosen by the team.', 'Welcome cava and priority late check-out.'],
    },
  },
  {
    id: 'aljibe', n: '04', name: 'Suite Aljibe', units: 2, m2: 55, pax: 2,
    prices: { baja: 380, media: 460, alta: 560 },
    img: '1562778612-e1e0cda9915c',
    gallery: ['1562778612-e1e0cda9915c', '1758072328635-586f3c121af2', '1528908929486-dfaa209c6986'],
    bed: { es: 'Cama de 200', en: 'Super king (200)', fr: 'Lit 200', de: 'Bett 200' },
    view: { es: 'Patio con piscina', en: 'Pool courtyard', fr: 'Cour avec piscine', de: 'Poolhof' },
    tagline: {
      es: 'Tu propia piscina, en el aljibe donde la casa guardaba el agua de lluvia.',
      en: 'Your own pool, in the cistern where the house once stored rainwater.',
      fr: 'Votre propre piscine, dans la citerne où la maison gardait l’eau de pluie.',
      de: 'Ihr eigener Pool – in der Zisterne, in der das Haus einst Regenwasser sammelte.',
    },
    desc: {
      es: 'Durante cien años, el aljibe recogió el agua de lluvia de la casa. Hoy es una piscina privada de agua salada, climatizada todo el año, en un patio que solo es tuyo. Las dos Suites Aljibe son las más reservadas de Albar: dormitorio, salón, baño de piedra con doble ducha y acceso directo al agua desde la cama.',
      en: 'For a hundred years, the cistern collected the house’s rainwater. Today it is a private saltwater pool, heated year-round, in a courtyard that is yours alone. The two Aljibe Suites are Albar’s most secluded: bedroom, living room, stone bathroom with double shower and direct access to the water from bed.',
    },
    love: {
      es: ['Piscina privada climatizada: bañarse en noviembre es posible.', 'Desayuno y cena servidos en tu patio.', 'Masaje de 60 minutos de bienvenida incluido.'],
      en: ['Private heated pool: a swim in November is possible.', 'Breakfast and dinner served in your courtyard.', 'A 60-minute welcome massage included.'],
    },
  },
  {
    id: 'jardin', n: '05', name: 'Casa del Jardín', units: 1, m2: 70, pax: 4,
    prices: { baja: 450, media: 540, alta: 650 },
    img: '1767498691864-e278d7d2c1a5',
    gallery: ['1767498691864-e278d7d2c1a5', '1784841525371-197d22736101', '1638826108040-8205e0323486'],
    bed: { es: '2 dormitorios', en: '2 bedrooms', fr: '2 chambres', de: '2 Schlafzimmer' },
    view: { es: 'Jardín privado', en: 'Private garden', fr: 'Jardin privé', de: 'Privatgarten' },
    tagline: {
      es: 'Dos dormitorios y un jardín con limoneros, para viajar con amigos.',
      en: 'Two bedrooms and a lemon-tree garden, for travelling with friends.',
      fr: 'Deux chambres et un jardin de citronniers, pour voyager entre amis.',
      de: 'Zwei Schlafzimmer und ein Zitronengarten – für Reisen mit Freunden.',
    },
    desc: {
      es: 'La antigua casa del jardinero, con entrada independiente. Dos dormitorios con baño propio, cocina pequeña para el café de media tarde y un jardín privado donde los limoneros dan sombra a una mesa larga. Es para quien viaja con amigos o en familia adulta y quiere sentirse en su propia casa de Altea, con el hotel a diez pasos.',
      en: 'The old gardener’s house, with its own entrance. Two bedrooms with en-suite bathrooms, a small kitchen for afternoon coffee and a private garden where lemon trees shade a long table. For those travelling with friends or adult family who want their own home in Altea, with the hotel ten steps away.',
    },
    love: {
      es: ['Cenas privadas en el jardín preparadas por Salmorra.', 'Limones del árbol para tu gin-tonic.', 'Entrada independiente: total privacidad.'],
      en: ['Private garden dinners prepared by Salmorra.', 'Lemons from the tree for your G&T.', 'Separate entrance: complete privacy.'],
    },
  },
];

const AMENITIES = {
  es: ['Wifi de fibra', 'Aire acondicionado silencioso', 'Ropa de cama de lino', 'Amenities de aceite de oliva', 'Cafetera y té de hierbas locales', 'Minibar de productores de la zona', 'Albornoz y zapatillas', 'Caja fuerte', 'Altavoz Bluetooth', 'Toallas para la azotea'],
  en: ['Fibre wifi', 'Silent air conditioning', 'Linen bedding', 'Olive-oil amenities', 'Coffee maker & local herbal teas', 'Minibar from local producers', 'Bathrobe & slippers', 'Safe', 'Bluetooth speaker', 'Rooftop towels'],
};

const EXTRAS = [
  { id: 'early', price: 30, unit: 'stay', es: 'Early check-in (12:00)', en: 'Early check-in (12:00)' },
  { id: 'late', price: 40, unit: 'stay', es: 'Late check-out (16:00)', en: 'Late check-out (16:00)' },
  { id: 'cena', price: 140, unit: 'stay', es: 'Cena romántica en la azotea', en: 'Romantic rooftop dinner' },
  { id: 'masaje', price: 85, unit: 'person', es: 'Masaje de 60 min', en: '60-min massage' },
  { id: 'traslado', price: 75, unit: 'stay', es: 'Traslado desde el aeropuerto', en: 'Airport transfer' },
];

/* ---------- Motor de precios (simulado en la Fase 1) ---------- */
const PRICING = {
  weekendUplift: 0.15,
  nonRefundable: 0.12,
  earlyBird: { days: 60, off: 0.10 },
  lastMinute: { days: 3, off: 0.15 },
  breakfastPP: 18,
  halfBoardPP: 55,
  otaCommission: 0.18,
};

function season(d) {
  const m = d.getMonth() + 1;
  if (m === 7 || m === 8) return 'alta';
  if ([5, 6, 9, 10].includes(m)) return 'media';
  return 'baja';
}
function ymd(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function parseYmd(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function isClosed(d) { const s = ymd(d); return HOTEL.closed.some(c => s >= c.from && s <= c.to); }
function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h); }

function nightly(room, d) {
  let p = room.prices[season(d)];
  const dow = d.getDay();
  if (dow === 5 || dow === 6) p *= 1 + PRICING.weekendUplift;
  return Math.round(p);
}

/* Ocupación simulada pero estable: misma fecha → mismo resultado */
function unitsLeft(room, d) {
  if (isClosed(d)) return 0;
  const s = season(d);
  let occ = { alta: 0.78, media: 0.55, baja: 0.3 }[s];
  const dow = d.getDay();
  if (dow === 5 || dow === 6) occ += 0.2;
  const daysOut = (d - new Date()) / 864e5;
  if (daysOut > 45) occ -= 0.2;
  let booked = 0;
  for (let i = 0; i < room.units; i++) if (hash(room.id + ymd(d) + i) % 100 < occ * 100) booked++;
  return room.units - booked;
}

function minNightFrom(d) { const m = d.getMonth() + 1; return (m === 7 || m === 8) ? 2 : 1; }

/* Precio "desde" de un día: la habitación más barata con hueco */
function dayFrom(d) {
  let best = null;
  for (const r of ROOMS) if (unitsLeft(r, d) > 0) { const p = nightly(r, d); if (best === null || p < best) best = p; }
  return best;
}

function quote(room, checkin, checkout, adults, roomsCount = 1) {
  const nights = [];
  let left = room.units;
  for (let d = new Date(checkin); d < checkout; d = addDays(d, 1)) {
    nights.push({ date: new Date(d), price: nightly(room, d) });
    left = Math.min(left, unitsLeft(room, d));
  }
  const base = nights.reduce((a, n) => a + n.price, 0) * roomsCount;
  const daysOut = Math.round((checkin - new Date().setHours(0, 0, 0, 0)) / 864e5);
  let promo = null;
  if (daysOut >= PRICING.earlyBird.days) promo = { key: 'early', off: PRICING.earlyBird.off };
  else if (daysOut <= PRICING.lastMinute.days && left >= 2) promo = { key: 'last', off: PRICING.lastMinute.off };
  const flex = Math.round(base * (1 - (promo ? promo.off : 0)));
  return {
    nights, n: nights.length, left, fits: adults <= room.pax * roomsCount && left >= roomsCount,
    base, promo, flex,
    nonref: Math.round(flex * (1 - PRICING.nonRefundable)),
    breakfast: Math.round(flex + PRICING.breakfastPP * adults * nights.length),
    halfBoard: Math.round(flex + PRICING.halfBoardPP * adults * nights.length),
  };
}

function minPrice() { return Math.min(...ROOMS.map(r => r.prices.baja)); }

/* ---------- Textos de interfaz generados por JS ---------- */
const UI = {
  es: {
    nav_rooms: 'Habitaciones', nav_salmorra: 'Salmorra & azotea', nav_spa: 'Spa', nav_bodas: 'Bodas', nav_altea: 'Altea', nav_us: 'La casa', nav_contact: 'Contacto',
    book: 'Reservar', book_from: 'Reservar · desde', search: 'Ver disponibilidad', dates: 'Fechas', arrival: 'Llegada', departure: 'Salida', guests: 'Huéspedes',
    add_dates: 'Añadir fechas', adults: 'Adultos', adults_note: 'Mayores de 16 años', rooms: 'Habitaciones', adults_only: 'Albar es una casa solo para adultos (+16).',
    code: 'Código', code_ph: 'Opcional', night: 'noche', nights: 'noches', from: 'desde', per_night: '/ noche', clear: 'Borrar', apply: 'Aplicar', close: 'Cerrar',
    cal_low: 'Mejor precio', cal_closed: 'Sin disponibilidad', min_stay: 'En julio y agosto, estancia mínima de 2 noches.',
    choose_out: 'Ahora elige la salida', choose_in: 'Elige la llegada',
    moment_dia: 'Día', moment_atardecer: 'Atardecer', moment_noche: 'Noche',
    greet_dia: 'Buenos días desde Altea', greet_atardecer: 'Empieza la hora dorada', greet_noche: 'La azotea está encendida',
    adult: 'adulto', adults_l: 'adultos', room: 'habitación', rooms_l: 'habitaciones',
    see_room: 'Ver habitación', m2: 'm²', people: 'personas', left_one: 'Última disponible', left_n: 'Quedan {n}', sold: 'Agotada estas fechas', too_many: 'Capacidad máxima: {n} personas',
    rate_flex: 'Flexible · solo alojamiento', rate_flex_d: 'Cancelación gratuita hasta 7 días antes. Pagas en el hotel.',
    rate_bf: 'Flexible · con desayuno', rate_bf_d: 'Desayuno mediterráneo a la carta, en el patio o en tu terraza.',
    rate_nr: 'No reembolsable', rate_nr_d: '12 % menos. Se cobra al reservar.', rate_hb: 'Media pensión', rate_hb_d: 'Desayuno y cena de menú en Salmorra.',
    total: 'Total', taxes: 'IVA incluido · tasa turística aparte', choose: 'Elegir',
    promo_early: 'Reserva anticipada −10 %', promo_last: 'Última hora −15 %',
    demo_book: 'Demo: en la Fase 2 aquí se abre el pago seguro con Stripe y se confirma la reserva al momento.',
    sent: 'Recibido. Te respondemos en menos de 2 horas.', news_ok: 'Gracias. Te escribiremos poco y solo cuando merezca la pena.',
    cookies_txt: 'Usamos cookies técnicas para que la web funcione y, solo si aceptas, cookies de analítica para mejorarla.', accept: 'Aceptar', reject: 'Rechazar', more: 'Más información',
    direct_badge: 'Mejor precio reservando aquí', photo: 'Foto', of: 'de', view: 'Ver',
    no_dates: 'Elige fechas para ver precios exactos.', results_for: 'Disponibilidad para', change: 'Cambiar',
    err_required: 'Este campo es obligatorio.', err_email: 'Revisa el email.', now: 'ahora',
  },
  en: {
    nav_rooms: 'Rooms', nav_salmorra: 'Salmorra & rooftop', nav_spa: 'Spa', nav_bodas: 'Weddings', nav_altea: 'Altea', nav_us: 'The house', nav_contact: 'Contact',
    book: 'Book', book_from: 'Book · from', search: 'Check availability', dates: 'Dates', arrival: 'Arrival', departure: 'Departure', guests: 'Guests',
    add_dates: 'Add dates', adults: 'Adults', adults_note: 'Aged 16 and over', rooms: 'Rooms', adults_only: 'Albar is an adults-only house (16+).',
    code: 'Code', code_ph: 'Optional', night: 'night', nights: 'nights', from: 'from', per_night: '/ night', clear: 'Clear', apply: 'Apply', close: 'Close',
    cal_low: 'Best price', cal_closed: 'Unavailable', min_stay: 'In July and August, minimum stay is 2 nights.',
    choose_out: 'Now choose departure', choose_in: 'Choose arrival',
    moment_dia: 'Day', moment_atardecer: 'Sunset', moment_noche: 'Night',
    greet_dia: 'Good morning from Altea', greet_atardecer: 'Golden hour begins', greet_noche: 'The rooftop is lit',
    adult: 'adult', adults_l: 'adults', room: 'room', rooms_l: 'rooms',
    see_room: 'View room', m2: 'm²', people: 'guests', left_one: 'Last one left', left_n: '{n} left', sold: 'Sold out for these dates', too_many: 'Max capacity: {n} guests',
    rate_flex: 'Flexible · room only', rate_flex_d: 'Free cancellation up to 7 days before. Pay at the hotel.',
    rate_bf: 'Flexible · with breakfast', rate_bf_d: 'À la carte Mediterranean breakfast, in the patio or on your terrace.',
    rate_nr: 'Non-refundable', rate_nr_d: '12% less. Charged at booking.', rate_hb: 'Half board', rate_hb_d: 'Breakfast and set dinner at Salmorra.',
    total: 'Total', taxes: 'VAT included · tourist tax extra', choose: 'Select',
    promo_early: 'Early booking −10%', promo_last: 'Last minute −15%',
    demo_book: 'Demo: in Phase 2 this opens secure Stripe checkout and confirms the booking instantly.',
    sent: 'Received. We reply within 2 hours.', news_ok: 'Thank you. We write rarely, and only when it’s worth it.',
    cookies_txt: 'We use technical cookies so the site works and, only if you accept, analytics cookies to improve it.', accept: 'Accept', reject: 'Reject', more: 'More info',
    direct_badge: 'Best price booking here', photo: 'Photo', of: 'of', view: 'View',
    no_dates: 'Choose dates to see exact prices.', results_for: 'Availability for', change: 'Change',
    err_required: 'This field is required.', err_email: 'Please check the email.', now: 'now',
  },
  fr: {
    nav_rooms: 'Chambres', nav_salmorra: 'Salmorra & rooftop', nav_spa: 'Spa', nav_bodas: 'Mariages', nav_altea: 'Altea', nav_us: 'La maison', nav_contact: 'Contact',
    book: 'Réserver', book_from: 'Réserver · dès', search: 'Voir les disponibilités', dates: 'Dates', arrival: 'Arrivée', departure: 'Départ', guests: 'Voyageurs',
    add_dates: 'Ajouter des dates', adults: 'Adultes', adults_note: '16 ans et plus', rooms: 'Chambres', adults_only: 'Albar est une maison réservée aux adultes (16+).',
    code: 'Code', code_ph: 'Facultatif', night: 'nuit', nights: 'nuits', from: 'dès', per_night: '/ nuit', clear: 'Effacer', apply: 'Appliquer', close: 'Fermer',
    cal_low: 'Meilleur prix', cal_closed: 'Indisponible', min_stay: 'En juillet et août, séjour minimum de 2 nuits.',
    choose_out: 'Choisissez le départ', choose_in: 'Choisissez l’arrivée',
    moment_dia: 'Jour', moment_atardecer: 'Couchant', moment_noche: 'Nuit',
    greet_dia: 'Bonjour d’Altea', greet_atardecer: 'L’heure dorée commence', greet_noche: 'Le rooftop s’allume',
    adult: 'adulte', adults_l: 'adultes', room: 'chambre', rooms_l: 'chambres',
    see_room: 'Voir la chambre', m2: 'm²', people: 'personnes', left_one: 'Dernière disponible', left_n: 'Plus que {n}', sold: 'Complet à ces dates', too_many: 'Capacité max : {n} personnes',
    rate_flex: 'Flexible · chambre seule', rate_flex_d: 'Annulation gratuite jusqu’à 7 jours avant. Paiement à l’hôtel.',
    rate_bf: 'Flexible · petit-déjeuner', rate_bf_d: 'Petit-déjeuner méditerranéen à la carte.',
    rate_nr: 'Non remboursable', rate_nr_d: '12 % de moins. Payé à la réservation.', rate_hb: 'Demi-pension', rate_hb_d: 'Petit-déjeuner et dîner au Salmorra.',
    total: 'Total', taxes: 'TVA incluse · taxe de séjour en sus', choose: 'Choisir',
    promo_early: 'Réservation anticipée −10 %', promo_last: 'Dernière minute −15 %',
    demo_book: 'Démo : en Phase 2, le paiement sécurisé Stripe s’ouvre ici.',
    sent: 'Reçu. Nous répondons en moins de 2 heures.', news_ok: 'Merci. Nous écrivons rarement.',
    cookies_txt: 'Nous utilisons des cookies techniques et, seulement si vous acceptez, des cookies d’analyse.', accept: 'Accepter', reject: 'Refuser', more: 'En savoir plus',
    direct_badge: 'Meilleur prix ici', photo: 'Photo', of: 'sur', view: 'Voir',
    no_dates: 'Choisissez des dates pour voir les prix exacts.', results_for: 'Disponibilités pour', change: 'Modifier',
    err_required: 'Champ obligatoire.', err_email: 'Vérifiez l’email.', now: 'maintenant',
  },
  de: {
    nav_rooms: 'Zimmer', nav_salmorra: 'Salmorra & Dachterrasse', nav_spa: 'Spa', nav_bodas: 'Hochzeiten', nav_altea: 'Altea', nav_us: 'Das Haus', nav_contact: 'Kontakt',
    book: 'Buchen', book_from: 'Buchen · ab', search: 'Verfügbarkeit prüfen', dates: 'Daten', arrival: 'Anreise', departure: 'Abreise', guests: 'Gäste',
    add_dates: 'Daten wählen', adults: 'Erwachsene', adults_note: 'Ab 16 Jahren', rooms: 'Zimmer', adults_only: 'Albar ist ein Haus nur für Erwachsene (16+).',
    code: 'Code', code_ph: 'Optional', night: 'Nacht', nights: 'Nächte', from: 'ab', per_night: '/ Nacht', clear: 'Löschen', apply: 'Übernehmen', close: 'Schließen',
    cal_low: 'Bester Preis', cal_closed: 'Nicht verfügbar', min_stay: 'Im Juli und August mindestens 2 Nächte.',
    choose_out: 'Jetzt Abreise wählen', choose_in: 'Anreise wählen',
    moment_dia: 'Tag', moment_atardecer: 'Abend', moment_noche: 'Nacht',
    greet_dia: 'Guten Morgen aus Altea', greet_atardecer: 'Die goldene Stunde beginnt', greet_noche: 'Die Dachterrasse leuchtet',
    adult: 'Erwachsener', adults_l: 'Erwachsene', room: 'Zimmer', rooms_l: 'Zimmer',
    see_room: 'Zimmer ansehen', m2: 'm²', people: 'Personen', left_one: 'Nur noch eins', left_n: 'Noch {n}', sold: 'Ausgebucht', too_many: 'Max. {n} Personen',
    rate_flex: 'Flexibel · ohne Frühstück', rate_flex_d: 'Kostenlose Stornierung bis 7 Tage vorher. Zahlung im Hotel.',
    rate_bf: 'Flexibel · mit Frühstück', rate_bf_d: 'Mediterranes Frühstück à la carte.',
    rate_nr: 'Nicht erstattbar', rate_nr_d: '12 % günstiger. Zahlung bei Buchung.', rate_hb: 'Halbpension', rate_hb_d: 'Frühstück und Abendmenü im Salmorra.',
    total: 'Gesamt', taxes: 'inkl. MwSt. · zzgl. Kurtaxe', choose: 'Wählen',
    promo_early: 'Frühbucher −10 %', promo_last: 'Last Minute −15 %',
    demo_book: 'Demo: In Phase 2 öffnet sich hier die sichere Stripe-Zahlung.',
    sent: 'Erhalten. Wir antworten innerhalb von 2 Stunden.', news_ok: 'Danke. Wir schreiben selten.',
    cookies_txt: 'Wir nutzen technische Cookies und, nur mit Ihrer Zustimmung, Analyse-Cookies.', accept: 'Akzeptieren', reject: 'Ablehnen', more: 'Mehr erfahren',
    direct_badge: 'Bester Preis hier', photo: 'Foto', of: 'von', view: 'Ansehen',
    no_dates: 'Wählen Sie Daten für genaue Preise.', results_for: 'Verfügbarkeit für', change: 'Ändern',
    err_required: 'Pflichtfeld.', err_email: 'Bitte E-Mail prüfen.', now: 'jetzt',
  },
};
