# Puesta en marcha de la app del reto (/app)

La landing sigue en `/`; la app vive en `/app`. Sin configurar nada, `/app` muestra un aviso
("La app aún no está conectada") y un botón al **modo demostración** (`/app?demo=1`), que guarda
todo en el navegador y responde con los mensajes fijos del coach.

## 1. Firebase (lo hace Juanma)
1. Crear proyecto nuevo en console.firebase.google.com (sin Analytics).
2. Firestore: crear base de datos en modo producción, **región UE** (`eur3` o `europe-southwest1`).
3. Authentication → Método de acceso → **Correo electrónico/contraseña** → activar **Vínculo de correo electrónico (acceso sin contraseña)**.
4. Authentication → Configuración → Dominios autorizados: añadir `lock21.netlify.app` (y el dominio propio cuando exista).
5. Configuración del proyecto → Tus apps → Web → registrar app y copiar `apiKey`, `authDomain`, `projectId`, `appId`.
6. Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada (JSON). **No subirla al repo.**
7. Publicar las reglas: `npx firebase-tools deploy --only firestore:rules` (o pegar `firestore.rules` en la consola).
8. Opcional: en Firestore → TTL, política sobre el campo `caduca` del grupo de colecciones `chat` (borrado a los 90 días).

## 2. Variables en Netlify (Site configuration → Environment variables)

| Variable | Obligatoria | Para qué |
| --- | --- | --- |
| `VITE_FIREBASE_API_KEY` | Sí | Config web de Firebase (pública, va al cliente) |
| `VITE_FIREBASE_AUTH_DOMAIN` | Sí | Ídem |
| `VITE_FIREBASE_PROJECT_ID` | Sí | Ídem; las funciones también la usan para verificar tokens |
| `VITE_FIREBASE_APP_ID` | Sí | Ídem |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | No | Ídem |
| `FIREBASE_SERVICE_ACCOUNT` | Sí para guardar datos | JSON de la cuenta de servicio en **base64** (`base64 -w0 cuenta.json`; en Mac `base64 -i cuenta.json`). Sin ella las funciones responden pero no guardan nada en Firestore |
| `FIREBASE_PROJECT_ID` | No | Solo si quieres separarlo de la variable `VITE_` |
| `ANTHROPIC_API_KEY` | No | Clave de la API (workspace "lock21"). **Nunca con prefijo `VITE_`**. Sin ella el coach usa mensajes fijos |
| `MODELO_RAPIDO` / `MODELO_CHAT` | No | Por defecto `claude-haiku-5-5` (moderación y check-in) y `claude-sonnet-5-5` (chat y resumen del lead) |
| `IA_DESACTIVADA` | No | `1` = interruptor de presupuesto: todo pasa a mensajes fijos |
| `COACH_LIMITE_DIA` | No | Mensajes de chat por persona y día (20) |
| `METRICAS_TOKEN` | Sí para la tarea semanal | Token largo aleatorio para `GET /.netlify/functions/metricas` con `Authorization: Bearer <token>` (solo agregados, sin correos) |
| `RESEND_API_KEY` | No | Aviso por correo de leads y señales de riesgo. Sin ella los leads quedan solo en Firestore (`leads`) y los avisos en `avisos` |
| `AVISO_EMAIL` / `AVISO_REMITENTE` | No | Destino (por defecto jmmoreno19@gmail.com) y remitente verificado en Resend |
| `SERVICIO_PREMIUM_NOMBRE` / `SERVICIO_PREMIUM_URL` | No | Se revelan solo tras aceptar el consentimiento del día 21 (nunca en el código publicado) |

Las variables `VITE_` se leen al compilar: tras cambiarlas, **redesplegar**.

## 3. Administración
- Propietarios: `netlify/lib/propietarios.js` (único archivo; no se publica en `dist`).
- El panel `/app/admin` pide las métricas a la función, que comprueba el correo o el claim `admin`.
- Para que las reglas de Firestore dejen leer leads al propietario desde el cliente, poner el claim una vez:
  `FIREBASE_SERVICE_ACCOUNT=... node scripts/dar-admin.mjs` (después de que cada propietario haya entrado una vez).

## 4. Comprobaciones
- `npx eslint src netlify` · `npm run build` (incluye `check-marca`) · `npm run test:frases` · `npm run build:funciones` (esbuild).
- El build de Netlify ejecuta lint, test de frases y build.

## 5. Funciones
| Función | Método | Qué hace |
| --- | --- | --- |
| `checkin` | GET | Estado del reto (día calculado en `Atlantic/Canary`, inicio 1/12/2026) |
| `checkin` | POST | `tipo: 'diario'` guarda check-in + respuesta del coach (JSON `{tareaManana, nivel, mensaje, derivar}`); `tipo: 'srbai'` guarda el test (días 0, 7, 21) |
| `perfil` | POST | Alta (18+, privacidad, aviso IA con versión y hash) y hábito/señal/versión mínima; controla las 30 plazas |
| `coach` | POST | Chat (20/día, 350 tokens) con las tres capas de guardarraíles |
| `lead` | POST | Consentimiento separado y versionado → lead + resumen + correo |
| `metricas` | GET | Inscritos, check-ins, adherencia media, SRBAI medio por día, leads |

Ninguna escritura sale del cliente: todo pasa por las funciones con firebase-admin.
