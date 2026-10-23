# Plan técnico — app filtro de retos de hábitos con coach IA

Resumen del plan de arquitectura (oct 2026). Detalle completo en la conversación.

## Cambio de enfoque (23/10/2026)
- Lock21 pasa a ser un reto GRATUITO de 21 días que sirve de captación para el servicio premium de entrenador personal. Se eliminan precios, pagos y Stripe; lo que sigue sobre pagos queda obsoleto.
- Un hábito de un menú cerrado (`src/datos/habitos.js`), atado a una señal; regla "nunca dos fallos seguidos"; test SRBAI (4 preguntas) los días 0, 7 y 21; mensaje honesto: consolidación hacia el día 66 (Lally 2010, Singh 2024).
- Primer grupo: 1 de diciembre de 2026, 30 plazas (`src/config.js`).
- Formulario `lista-espera`: nombre, email, habito, privacidad (obligatoria), entrenador (consentimiento comercial opcional y separado), honeypot `empresa`.

## Decisiones
- Marca nueva, proyecto Firebase, sitio Netlify, dominio y cuenta Stripe propios. "Balancet" no aparece en el código del cliente; el servidor lo revela solo tras el consentimiento de derivación.
- Stack: Vite + React + Tailwind v4 + Firebase (Auth, Firestore) + Netlify Functions (incl. programadas) + API de Anthropic (Haiku) + Stripe Checkout/webhooks (fase 1).
- Convenciones impuestas por ESLint: sin arrow functions, sin template literals, var, setDoc solo vía guardarDoc con {merge:true}, build + lint obligatorios. Sin emojis; Icono sobre lucide-react.
- Registro del coach: tuteo en singular (registro canario), "ustedes" en textos a la comunidad.

## Coach IA
- Guardarraíles en 3 capas: filtro previo sin llamar al modelo (dieta, kcal, gramos, ayuno, medicación…), señales de riesgo (respuesta fija con 024 y 112, aviso a Juanma), filtro posterior de cifras y menús.
- Aviso del art. 50 del Reglamento de IA: banner fijo, etiqueta "Coach IA" en cada mensaje, aceptación registrada.
- Límites: 20 mensajes/día, 300 tokens por respuesta, tope mensual, presupuesto global con interruptor.

## Derivación
- Disparadores: fin del reto, petición de dieta filtrada, adherencia ≥85 % tras 5 días. Máximo 1 oferta cada 7 días.
- Pantalla de consentimiento explícito (casilla sin marcar, versión y hash guardados) → resumen IA → lead en el panel → correo a Juanma → se revela el servicio premium.

## Fases
- Fase 0: lista de espera (landing, doble confirmación, métricas sin cookies, textos legales). 0 €.
- Fase 1 (requiere alta de autónomo): reto de 7 días con pago, check-in con IA, coach, avisos push/correo, tareas diarias.
- Fase 2: reto de 21 días, suscripción, resumen semanal por lotes, derivación y leads, derechos RGPD.

## Costes estimados
- 100 usuarios: ~25–55 €/mes. 1.000 usuarios: ~250–560 €/mes. Stripe ~1,5 % + 0,25 € por cobro → reto de 7 días mejor a 5,99 €.

## Riesgos clave
- Límites de tiempo de Netlify (tandas con cursor, Batches API), idempotencia de webhooks, jailbreaks anti-dieta (test con frases trampa en CI), push en iPhone solo con PWA instalada, IVA/IGIC a validar con gestor antes de cobrar.
