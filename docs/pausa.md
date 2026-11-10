# Lock21 en pausa (desde el 10 de noviembre de 2026)

Decisión de Juanma (10 nov 2026): con 2 inscritos a 6 días de la salida del grupo 01, se pausa
todo el proceso para ahorrar carga, dinero y dedicación. La idea volverá más adelante lanzada
desde la cuenta de Balancet (@balancet.fit), con su público.

## Qué está parado

- **Web:** `config.pausa.activa = true` (`src/config.js`). La portada, `/dentro` y `/app` enseñan
  `src/components/Pausa.jsx` con «Avísame cuando vuelva» (Netlify Forms, formulario
  `avisame-vuelta`; se ven en Netlify → Forms). El panel `/app/admin` sigue funcionando.
- **Inscripciones:** `netlify/functions/inscripcion.js` responde 409 `en_pausa`.
- **Correos:** `correos-programados` sin horario en `netlify.toml` y, si se lanza, sale sin enviar.
- **Instagram:** las 40 piezas del 10 al 24 nov se movieron a `contenido/pausa/` (no se publican).
  En la cola quedan solo el carrusel y la historia de cierre en estado `borrador`
  (12 nov, 19:30 y 20:00): el publicador solo lanza `programado`.
- **Cifras e historia del sábado** (GitHub Actions): sin horario, solo a mano.
- **Tareas programadas de Claude** de Lock21 (marketing diario, ideas para grabar y reunión de
  los miércoles): desactivadas. La reunión de marketing de Balancet sigue.

## Lo que hace Juanma

1. **Hablar con los 2 inscritos antes de publicar el cierre** (texto abajo).
2. **Parar los anuncios de Meta** de Lock21.
3. **Aprobar el cierre** (o pedir cambios). Para publicarlo: estado `programado` en
   `contenido/cola/2026-11-12_*-pausa.json`.
4. **Bio de @reto.lock21:** «En pausa. Volverá desde @balancet.fit». Y fijar el carrusel de cierre.
   La cuenta se deja dormida, sin borrarla.

### Mensaje para los 2 inscritos (WhatsApp o correo, en tu voz)

> Hola, [NOMBRE]. Te escribo yo antes de que lo veas en redes: he decidido pausar Lock21 y el
> grupo del lunes 16 no va a salir. Para que un reto en grupo funcione hace falta grupo, y prefiero
> pararlo a hacerlo a medias. Gracias de verdad por pedir tu plaza. Cuando vuelva, serás de los
> primeros en saberlo. Y si mientras tanto quieres empezar con tu hábito por tu cuenta, cuéntame
> cuál era y te echo una mano.

## Para volver

`config.pausa.activa = false`, devolver el horario de `correos-programados` y de
`historia-cifras.yml`, mover a `contenido/cola/` las piezas que sigan valiendo (con fechas
nuevas) y reactivar las tareas programadas.
