/* ==========================================================================
   NÁCAR · Atelier de Belleza — Configuración del negocio
   --------------------------------------------------------------------------
   Este es el ÚNICO archivo que hay que tocar para adaptar la demo a un
   salón real: datos de contacto, horarios, servicios, equipo e integraciones.
   (Los servicios, precios y equipo también se editan desde el panel /admin.html;
   lo de aquí son los valores iniciales.)
   ========================================================================== */
window.ORY = window.ORY || {};

ORY.config = {
  business: {
    name: 'Nácar',
    legalName: 'Nácar Atelier de Belleza (nombre ficticio de demostración)',
    tagline: 'Atelier de belleza',
    claim: 'La belleza, en su versión más serena.',
    // Datos de contacto de DEMOSTRACIÓN: sustituir por los reales.
    address: 'Calle Ejemplo 12, 28001 Madrid',
    mapQuery: '28001 Madrid',
    phone: '+34 600 000 000',
    whatsapp: '34600000000', // formato internacional sin "+" ni espacios
    email: 'hola@ejemplo-salon.com',
    social: {
      instagram: 'https://www.instagram.com/',
      tiktok: 'https://www.tiktok.com/',
      facebook: 'https://www.facebook.com/'
    },
    // 0 = domingo … 6 = sábado. Varios tramos por día permitidos.
    hours: {
      0: [],
      1: [['10:00', '20:00']],
      2: [['09:30', '20:30']],
      3: [['09:30', '20:30']],
      4: [['09:30', '21:00']],
      5: [['09:30', '21:00']],
      6: [['09:30', '15:00']]
    }
  },

  booking: {
    slotStepMinutes: 15,        // granularidad de los huecos
    minNoticeMinutes: 90,       // antelación mínima para reservar
    maxDaysAhead: 60,           // hasta cuántos días se puede reservar
    cancelCutoffHours: 12,      // cancelar/modificar online hasta X h antes
    reminderOffsetsHours: [24, 2], // recordatorios automáticos
    reviewRequestDelayHours: 3, // solicitud de reseña tras la cita (a TODAS las clientas)
    defaultBufferMinutes: 10    // limpieza / preparación entre citas
  },

  reviews: {
    // Enlace oficial para dejar reseña. Dos opciones (basta con una):
    //  1) Place ID del Perfil de Empresa → se genera el enlace oficial
    //     https://search.google.com/local/writereview?placeid=PLACE_ID
    //  2) Enlace corto que da Google en el Perfil ("Pedir reseñas"): https://g.page/r/XXXX/review
    googlePlaceId: '',
    googleReviewUrl: '',
    // Endpoint propio (servidor) que devuelve las reseñas reales vía Google Places API.
    // Ver /api/google-reviews.js. Vacío = no se muestran reseñas (nunca se inventan).
    reviewsEndpoint: ''
  },

  integrations: {
    // 'local' = demo en este navegador · 'remote' = API propia (ver js/core/store.js y supabase/schema.sql)
    dataAdapter: 'local',
    apiBaseUrl: '/api',
    email: { provider: '', configured: false },     // p. ej. Resend, Brevo, SendGrid (clave en servidor)
    sms: { provider: '', configured: false },       // p. ej. Twilio
    whatsapp: { provider: '', configured: false },  // WhatsApp Business Cloud API (plantillas aprobadas)
    payments: { provider: '', configured: false }   // opcional: señal anti-ausencias con Stripe
  },

  categories: [
    { id: 'cabello', name: 'Cabello' },
    { id: 'color', name: 'Color' },
    { id: 'manos', name: 'Manos y pies' },
    { id: 'rostro', name: 'Rostro' },
    { id: 'cuerpo', name: 'Cuerpo' },
    { id: 'maquillaje', name: 'Maquillaje' }
  ],

  // Valores iniciales; luego se gestionan desde el panel.
  services: [
    { id: 'corte-peinado', cat: 'cabello', name: 'Corte & peinado de autor', duration: 60, price: 48,
      desc: 'Diagnóstico de tu cabello, corte a medida de tus facciones y un peinado que dura días.',
      image: 'img/corte-peinado.jpg' },
    { id: 'coloracion', cat: 'color', name: 'Coloración & balayage', duration: 150, price: 120, priceFrom: true,
      desc: 'Color pintado a mano, matices luminosos y tratamiento de enlaces para que tu fibra salga más fuerte.',
      image: 'img/coloracion.jpg' },
    { id: 'ritual-capilar', cat: 'cabello', name: 'Ritual capilar reparador', duration: 45, price: 55,
      desc: 'Exfoliación del cuero cabelludo, mascarilla de queratina y masaje craneal con aceites tibios.',
      image: 'img/ritual-capilar.jpg' },
    { id: 'manicura', cat: 'manos', name: 'Manicura semipermanente', duration: 50, price: 32,
      desc: 'Cutículas impecables, nivelación y esmaltado de larga duración en tu tono favorito.',
      image: 'img/manicura.jpg' },
    { id: 'pedicura', cat: 'manos', name: 'Pedicura spa', duration: 60, price: 42,
      desc: 'Baño de sales, exfoliación, hidratación profunda y esmaltado para unos pies de pasarela.',
      image: 'img/pedicura.jpg' },
    { id: 'limpieza-facial', cat: 'rostro', name: 'Limpieza facial luminosa', duration: 75, price: 68,
      desc: 'Higiene profunda, extracción delicada, peeling enzimático y mascarilla iluminadora.',
      image: 'img/limpieza-facial.jpg' },
    { id: 'corporal', cat: 'cuerpo', name: 'Ritual corporal drenante', duration: 90, price: 85,
      desc: 'Exfoliación, envoltura de algas y masaje drenante para una piel ligera y luminosa.',
      image: 'img/corporal.jpg' },
    { id: 'maquillaje', cat: 'maquillaje', name: 'Maquillaje de evento', duration: 60, price: 65,
      desc: 'Piel jugosa y mirada definida que resiste fotos, abrazos y la noche entera.',
      image: 'img/maquillaje.jpg' }
  ],

  // Profesionales (nombres ficticios de demostración).
  staff: [
    { id: 'lucia', name: 'Lucía', role: 'Directora creativa · Color', hue: 8,
      services: ['corte-peinado', 'coloracion', 'ritual-capilar'],
      schedule: { 1: [['10:00', '14:00'], ['15:00', '20:00']], 2: [['09:30', '14:00'], ['15:00', '18:30']], 3: [['09:30', '14:00'], ['15:00', '18:30']], 4: [['12:00', '21:00']], 5: [['12:00', '21:00']], 6: [['09:30', '15:00']] } },
    { id: 'carmen', name: 'Carmen', role: 'Estilista senior', hue: 28,
      services: ['corte-peinado', 'ritual-capilar', 'maquillaje'],
      schedule: { 2: [['12:00', '20:30']], 3: [['12:00', '20:30']], 4: [['09:30', '14:30'], ['15:30', '19:00']], 5: [['09:30', '14:30'], ['15:30', '19:00']], 6: [['09:30', '15:00']] } },
    { id: 'aitana', name: 'Aitana', role: 'Nail artist', hue: 340,
      services: ['manicura', 'pedicura'],
      schedule: { 1: [['10:00', '20:00']], 2: [['09:30', '17:30']], 3: [['09:30', '17:30']], 4: [['13:00', '21:00']], 5: [['13:00', '21:00']] } },
    { id: 'noa', name: 'Noa', role: 'Esteticista facial y corporal', hue: 40,
      services: ['limpieza-facial', 'corporal', 'maquillaje'],
      schedule: { 1: [['10:00', '18:00']], 3: [['09:30', '14:00'], ['15:00', '20:30']], 4: [['09:30', '14:00'], ['15:00', '21:00']], 5: [['09:30', '14:00'], ['15:00', '21:00']], 6: [['09:30', '15:00']] } }
  ]
};
