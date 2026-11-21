/* ==========================================================================
   Automatizaciones y notificaciones
   --------------------------------------------------------------------------
   Cada evento de reserva genera mensajes en una "bandeja de salida" (outbox)
   con su fecha programada. En producción, un proceso del servidor (cron cada
   minuto, ver supabase/schema.sql y README) envía los mensajes vencidos a
   través del proveedor configurado.

   En esta demo NO se envía nada a terceros: si un canal no tiene proveedor
   conectado, el mensaje queda en estado "needs_provider" y se ve en el panel.
   Las notificaciones internas para el salón (panel) sí son reales.
   ========================================================================== */
(function (ORY) {
  'use strict';
  const U = ORY.U;

  const templates = {
    booking_confirmed: (b, ctx) => ({
      subject: `Tu cita en ${ctx.biz} está confirmada · ${b.code}`,
      text: `Hola ${first(b.client.name)}, te esperamos el ${U.fmtDate(b.start)} a las ${U.fmtTime(b.start)} para ${ctx.svc} con ${ctx.staff}.\n` +
        `Dirección: ${ctx.address}.\nPara cambiar o cancelar (hasta ${ctx.cutoff} h antes): ${ctx.manageUrl}`
    }),
    reminder: (b, ctx, hours) => ({
      subject: `Recordatorio: tu cita ${hours >= 24 ? 'es mañana' : 'es en ' + hours + ' h'}`,
      text: `Hola ${first(b.client.name)}, te recordamos tu cita de ${ctx.svc} el ${U.fmtDate(b.start)} a las ${U.fmtTime(b.start)}.\n` +
        `¿Vienes? Confirma o cambia aquí: ${ctx.manageUrl}`
    }),
    booking_cancelled: (b, ctx) => ({
      subject: `Cita cancelada · ${b.code}`,
      text: `Hola ${first(b.client.name)}, hemos cancelado tu cita de ${ctx.svc} del ${U.fmtDate(b.start)} a las ${U.fmtTime(b.start)}. Cuando quieras, reserva de nuevo en nuestra web.`
    }),
    booking_rescheduled: (b, ctx) => ({
      subject: `Tu cita ha cambiado · ${b.code}`,
      text: `Hola ${first(b.client.name)}, tu nueva cita: ${U.fmtDate(b.start)} a las ${U.fmtTime(b.start)} (${ctx.svc} con ${ctx.staff}).`
    }),
    review_request: (b, ctx) => ({
      subject: `¿Qué tal tu experiencia en ${ctx.biz}?`,
      text: `Gracias por venir, ${first(b.client.name)}. Tu opinión sincera —sea cual sea— nos ayuda a mejorar y a que otras personas nos conozcan: ${ctx.reviewUrl || '[enlace de reseñas pendiente de configurar]'}`
    }),
    business_new_booking: (b, ctx) => ({
      subject: `Nueva reserva · ${ctx.svc} · ${U.fmtDateShort(b.start)} ${U.fmtTime(b.start)}`,
      text: `${b.client.name} (${b.client.phone}) ha reservado ${ctx.svc} con ${ctx.staff}.`
    }),
    business_cancelled: (b, ctx) => ({
      subject: `Cancelación · ${U.fmtDateShort(b.start)} ${U.fmtTime(b.start)}`,
      text: `${b.client.name} ha cancelado ${ctx.svc} con ${ctx.staff}. El hueco vuelve a estar disponible online.`
    }),
    business_rescheduled: (b, ctx) => ({
      subject: `Cambio de cita · ${b.client.name}`,
      text: `${b.client.name} ha movido su cita a ${U.fmtDateShort(b.start)} ${U.fmtTime(b.start)} (${ctx.svc}, ${ctx.staff}).`
    })
  };

  function first(n) { return String(n || '').split(' ')[0]; }

  function context(db, b) {
    const s = db.settings;
    const svc = db.services.find((x) => x.id === b.serviceId);
    const st = db.staff.find((x) => x.id === b.staffId);
    const base = location.href.split('#')[0].split('?')[0].replace(/admin\.html$/, 'index.html');
    return {
      biz: s.business.name,
      address: s.business.address,
      svc: svc ? svc.name : 'tu servicio',
      staff: st ? st.name : 'nuestro equipo',
      cutoff: s.booking.cancelCutoffHours,
      manageUrl: base + '?reserva=' + encodeURIComponent(b.code) + '#gestionar',
      reviewUrl: U.reviewUrl(s)
    };
  }

  function channelStatus(db, channel) {
    const i = db.settings.integrations[channel];
    return i && i.configured ? 'queued' : 'needs_provider';
  }

  function msg(db, b, { channel, to, template, at, extra }) {
    const ctx = context(db, b);
    const content = templates[template](b, ctx, extra);
    return {
      id: U.uid('msg'), bookingId: b.id, channel, to, template,
      subject: content.subject, text: content.text,
      scheduledFor: at || Date.now(), createdAt: Date.now(),
      status: channelStatus(db, channel), demo: !!b.demo
    };
  }

  /** Devuelve { outbox: [...], feed: [...] } a añadir para un evento. */
  function plan(db, event, b) {
    const out = [], feed = [];
    const ctx = context(db, b);
    const contactChannel = b.client.phone ? 'whatsapp' : 'email';
    const cfg = db.settings.booking;

    if (event === 'created' || event === 'rescheduled') {
      out.push(msg(db, b, { channel: 'email', to: b.client.email, template: event === 'created' ? 'booking_confirmed' : 'booking_rescheduled' }));
      cfg.reminderOffsetsHours.forEach((h) => {
        const at = b.start - h * 3600000;
        if (at > Date.now()) out.push(msg(db, b, { channel: contactChannel, to: b.client.phone || b.client.email, template: 'reminder', at, extra: h }));
      });
      out.push(msg(db, b, { channel: 'email', to: db.settings.business.email, template: event === 'created' ? 'business_new_booking' : 'business_rescheduled' }));
      const t = templates[event === 'created' ? 'business_new_booking' : 'business_rescheduled'](b, ctx);
      feed.push({ id: U.uid('nt'), type: event, bookingId: b.id, title: t.subject, text: t.text, at: Date.now(), read: false, demo: !!b.demo });
    }
    if (event === 'created' || event === 'rescheduled') {
      // Solicitud de reseña a TODAS las clientas tras su cita (sin filtrar por satisfacción).
      out.push(msg(db, b, { channel: contactChannel, to: b.client.phone || b.client.email, template: 'review_request', at: b.end + cfg.reviewRequestDelayHours * 3600000 }));
    }
    if (event === 'cancelled') {
      out.push(msg(db, b, { channel: 'email', to: b.client.email, template: 'booking_cancelled' }));
      const t = templates.business_cancelled(b, ctx);
      feed.push({ id: U.uid('nt'), type: 'cancelled', bookingId: b.id, title: t.subject, text: t.text, at: Date.now(), read: false, demo: !!b.demo });
    }
    return { outbox: out, feed };
  }

  /** Al cancelar/mover una cita, los mensajes futuros pendientes de esa cita se anulan. */
  function voidPending(db, bookingId) {
    db.outbox.forEach((m) => {
      if (m.bookingId === bookingId && m.scheduledFor > Date.now() && (m.status === 'queued' || m.status === 'needs_provider')) m.status = 'void';
    });
  }

  ORY.notify = { plan, voidPending, templates, context };
})(window.ORY = window.ORY || {});
