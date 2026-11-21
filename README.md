# Web oficial de ORYON

**Esta es la ÚNICA versión oficial de la web.** Ya no se cambia en ningún otro sitio: ni en artefactos de claude.ai, ni en zips, ni en el Drive.

Estado: **BORRADOR**. Está oculta de Google y en la página legal aparecen datos de ejemplo.

## Cómo se cambia algo

1. Antes de empezar, coge la última versión: `git pull`.
2. Haz el cambio.
3. Súbelo: `git add -A && git commit -m "qué has cambiado" && git push`.
4. En un par de minutos la web publicada ya enseña la versión nueva, en el mismo enlace.

Si no sabes hacerlo, pídeselo a Claude con esta frase: *«Trabaja sobre el repositorio de GitHub ORYONSL/oryon-web: haz `git pull`, cambia lo que te digo y haz `push`»*.

Si algo se rompe, GitHub guarda todas las versiones y se puede volver a cualquiera anterior.

## Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Página principal (todo en un archivo) | `index.html` |
| Textos en español, catalán e inglés | `index.html` → `ORYON_DICT`, más el bloque «Textos añadidos» que va justo debajo |
| WhatsApp, correo y destino del formulario | `index.html` → `ORYON_CONTACT` |
| Aviso legal, privacidad y cookies | `legal.html` |
| Demos | `demos/` (restaurante Gota, belleza Nácar, hotel Albar) |
| Fotos de las tarjetas de demos | `demos/fotos-tarjetas/` |

## Lista para la inauguración

- [ ] Datos reales de la empresa en `legal.html` (titular, NIF, domicilio y registro) y quitar el aviso «Página en preparación».
- [ ] Número de WhatsApp en `ORYON_CONTACT.whatsapp`. Los botones aparecen solos.
- [ ] Demo de la clínica dental dentro de `demos/`, enlazada en lugar de «Próximamente».
- [ ] Dirección del n8n del servidor en `ORYON_CONTACT.formEndpoint`. Hasta entonces, el formulario abre el correo del visitante con el mensaje ya escrito.
- [ ] Dominio propio.
- [ ] Quitar las líneas `<meta name="robots" content="noindex, nofollow"/>` de todas las páginas para que Google la muestre.

## Ver la web en tu ordenador

Abre `index.html` con doble clic. El formulario solo envía de verdad a n8n si la web se sirve desde `localhost`.
