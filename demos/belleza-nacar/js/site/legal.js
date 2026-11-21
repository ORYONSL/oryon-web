/* Textos legales PLANTILLA (RGPD / LOPDGDD / LSSI). Deben revisarse con la
   asesoría del salón antes de publicar la web real. */
(function (ORY) {
  'use strict';
  const b = () => ORY.store.snapshot().settings.business;
  ORY.legal = {
    privacidad: () => `
      <h2>Política de privacidad</h2>
      <p class="note">Plantilla de demostración: completar con los datos fiscales reales y revisar con la asesoría.</p>
      <h3>Responsable</h3><p>${b().legalName} · ${b().address} · ${b().email}</p>
      <h3>Qué datos tratamos y para qué</h3>
      <ul><li><b>Nombre, teléfono y email</b>: gestionar tu cita, enviarte la confirmación, los recordatorios y, tras la visita, una invitación para opinar.</li>
      <li><b>Observaciones</b> que nos indiques (p. ej. alergias): solo para atenderte con seguridad.</li>
      <li><b>Comunicaciones comerciales</b>: únicamente si marcas la casilla correspondiente.</li></ul>
      <h3>Base legal</h3><p>La ejecución del servicio que solicitas (art. 6.1.b RGPD) y tu consentimiento para comunicaciones comerciales (art. 6.1.a), que puedes retirar en cualquier momento.</p>
      <h3>Conservación</h3><p>Mientras exista relación comercial y, después, durante los plazos legales. El historial de citas se anonimiza a los 24 meses sin actividad.</p>
      <h3>Destinatarios</h3><p>Proveedores tecnológicos que actúan como encargados del tratamiento (alojamiento, envío de email/SMS/WhatsApp), con contrato y garantías del art. 28 RGPD. No vendemos tus datos.</p>
      <h3>Tus derechos</h3><p>Acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a ${b().email}. Puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p>`,
    cookies: () => `
      <h2>Política de cookies</h2>
      <h3>Almacenamiento técnico (necesario)</h3>
      <ul><li><code>nacar.consent</code>: recuerda tu elección sobre cookies.</li>
      <li><code>nacar.client</code>: solo si lo pides, recuerda tus datos para reservar más rápido en este dispositivo.</li>
      <li><code>nacar.demo.v1</code>: en esta demostración, guarda las reservas en tu navegador.</li></ul>
      <h3>Terceros (opcional)</h3>
      <ul><li><b>Google Maps</b>: el mapa solo se carga si lo aceptas o pulsas “Mostrar mapa”. Google puede instalar sus propias cookies.</li></ul>
      <p>No usamos cookies publicitarias ni de analítica de terceros. Puedes cambiar tu elección desde “Preferencias de cookies” en el pie de página.</p>`,
    aviso: () => `
      <h2>Aviso legal</h2>
      <p class="note">“Nácar” es un salón ficticio creado por ORYON como demostración comercial. Los datos de contacto son de ejemplo.</p>
      <p>Titular: ${b().legalName}. Domicilio: ${b().address}. Contacto: ${b().email}. Datos registrales y NIF: [completar].</p>
      <p>Las imágenes de la demo proceden de bancos de imágenes con licencia libre (Unsplash).</p>`
  };
})(window.ORY = window.ORY || {});
