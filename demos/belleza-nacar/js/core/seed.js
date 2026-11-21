/* Citas de EJEMPLO para enseñar el panel lleno. Todas van marcadas con demo:true,
   se distinguen visualmente en el panel y se pueden borrar con un clic. */
(function (ORY) {
  'use strict';
  const U = ORY.U, A = ORY.availability;
  const names = ['Marta G.', 'Elena R.', 'Paula S.', 'Irene M.', 'Sara L.', 'Laura P.', 'Claudia V.', 'Nerea F.', 'Andrea B.', 'Julia C.',
    'Rocío D.', 'Alba T.', 'Inés H.', 'Sofía N.', 'Lola Q.', 'Vera A.', 'Celia O.', 'Blanca E.', 'Olivia J.', 'Martina K.', 'Ana Z.', 'Lidia U.'];

  let seedN = 7;
  const rnd = () => { seedN = (seedN * 16807) % 2147483647; return (seedN - 1) / 2147483646; };
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

  ORY.seed = function (db) {
    const clients = names.map((n, i) => ({
      name: n, phone: '+34 6' + String(10000000 + i * 3791).slice(0, 8),
      email: n.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') + (i + 1) + '@ejemplo.com'
    }));
    const today = U.startOfDay(Date.now());
    const now = Date.now();
    for (let off = -24; off <= 9; off++) {
      const date = U.addDays(today, off);
      const dayMs = date.getTime();
      db.staff.forEach((m) => {
        let ptr = dayMs;
        let guard = 0;
        while (guard++ < 14) {
          const sid = pick(m.services);
          const slots = A.slotsForDay(db, { serviceId: sid, staffId: m.id, date, now: dayMs - 3600000 });
          const s = slots.find((x) => x.start >= ptr);
          if (!s) break;
          const fill = off < 0 ? 0.72 : off === 0 ? 0.65 : 0.5 - off * 0.03;
          if (rnd() > fill) { ptr = s.start + (30 + Math.floor(rnd() * 4) * 15) * U.MIN; continue; }
          const svc = db.services.find((x) => x.id === sid);
          const c = clients[Math.floor(rnd() * clients.length)];
          const past = s.end < now;
          let status = past ? 'completed' : 'confirmed';
          const r = rnd();
          if (r < 0.07) status = 'cancelled'; else if (past && r < 0.12) status = 'no_show';
          const createdAt = s.start - (1 + Math.floor(rnd() * 9)) * 86400000 - (rnd() < 0.3 ? 11 + Math.floor(rnd() * 3) : 0) * 3600000; // ~30 % reservadas de noche
          const b = {
            id: U.uid('bk'), code: U.code(), token: U.token(), serviceId: sid, staffId: m.id,
            start: s.start, end: s.end, price: svc.price,
            client: { name: c.name, phone: U.normPhone(c.phone), email: c.email }, notes: '',
            status, source: rnd() < 0.82 ? 'web' : 'admin', demo: true,
            consent: { privacy: true, marketing: rnd() < 0.4, at: createdAt, policyVersion: '2026-11' },
            createdAt: Math.min(createdAt, now - 3600000),
            history: [{ at: createdAt, action: 'created', by: 'clienta' }]
          };
          if (status === 'cancelled') b.history.push({ at: s.start - 86400000, action: 'cancelled', by: 'clienta' });
          db.bookings.push(b);
          if (!past && status === 'confirmed') {
            const p = ORY.notify.plan(db, 'created', b);
            db.outbox.push(...p.outbox.filter((x) => x.scheduledFor > now));
          }
          if (status === 'completed') {
            db.outbox.push({ id: U.uid('msg'), bookingId: b.id, channel: 'whatsapp', to: b.client.phone, template: 'review_request',
              subject: 'Solicitud de reseña', text: ORY.notify.templates.review_request(b, ORY.notify.context(db, b)).text,
              scheduledFor: b.end + 3 * 3600000, createdAt: b.createdAt, status: 'needs_provider', demo: true });
          }
          ptr = s.end + (15 + Math.floor(rnd() * 3) * 15) * U.MIN;
        }
      });
    }
    const recent = db.bookings.filter((b) => b.start > now).sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
    recent.forEach((b, i) => {
      const svc = db.services.find((x) => x.id === b.serviceId);
      db.feed.push({ id: U.uid('nt'), type: 'created', bookingId: b.id, title: `Nueva reserva · ${svc.name}`,
        text: `${b.client.name} · ${U.fmtDateShort(b.start)} ${U.fmtTime(b.start)}`, at: now - (i + 1) * 47 * 60000, read: i > 1, demo: true });
    });
  };
})(window.ORY = window.ORY || {});
