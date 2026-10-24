# Publicador automático de Instagram

Lock21 publica sola en **@reto.lock21** lo que haya en la cola (`contenido/cola/`): carruseles, imágenes, reels y historias. Una función de Netlify mira la cola cada 10 minutos y publica lo que ya toca. Para que funcione tienes que hacer **una sola vez** la configuración de abajo. Calcula unos **20-30 minutos**.

Mientras no termines el paso 5, el publicador funciona en **modo simulación**: apunta lo que publicaría, pero no publica nada.

---

## Antes de empezar

- @reto.lock21 tiene que ser una **cuenta profesional** (Empresa o Creador) y **pública**. En la app de Instagram: Perfil > menú (las tres rayas) > Tipo de cuenta y herramientas.
- **No hace falta página de Facebook.** Este método ("Instagram API with Instagram Login") no la necesita.
- Necesitas una cuenta de Facebook para entrar en developers.facebook.com. La primera vez te pedirá registrarte como desarrollador: es gratis y solo hay que aceptar las condiciones y verificar el teléfono o el correo.

## Paso 1. Crear la app en Meta (5 min)

1. Entra en **https://developers.facebook.com/apps** con tu cuenta de Facebook.
2. Pulsa **Create App** (arriba a la derecha). Si es tu primera app, el botón se llama **Create First App**.
3. Si te pregunta por un portfolio empresarial (*business portfolio*), elige no conectar ninguno de momento y pulsa **Next**.
4. En el caso de uso (*use case*), elige **Other** y pulsa **Next**.
5. En el tipo de app, elige **Business** y pulsa **Next**.
6. Ponle un nombre, por ejemplo `Lock21 publicador`, y tu correo de contacto. Pulsa **Create app** (puede pedirte la contraseña de Facebook).

La app se queda en **modo desarrollo** (*Development*). Así está bien: en ese modo puede publicar en las cuentas que añadas tú mismo. No hace falta enviarla a revisión (*App Review*) ni verificar el negocio.

## Paso 2. Añadir Instagram y tu cuenta (5 min)

1. En el panel de la app, baja hasta **Instagram** y pulsa **Set up**. Se añade solo **API setup with Instagram login**.
   - Si ves la opción "API setup with Facebook login", no es esa: tiene que ser la de **Instagram login**.
2. En el menú de la izquierda, entra en **Instagram > API setup with Instagram business login**.
3. En el apartado **1. Generate access tokens**, pulsa **Add account** e inicia sesión con **@reto.lock21**. Acepta los permisos que te pida. Entre ellos están `instagram_business_basic` e `instagram_business_content_publish`, que son los que se usan para publicar.
4. Si Instagram dice que tienes una invitación pendiente, acéptala en la app de Instagram: Configuración > Apps y sitios web > Invitaciones de evaluador. También puedes ir a **App Roles > Roles** en el panel de Meta.

## Paso 3. Generar el token y copiar el ID (5 min)

1. En esa misma pantalla, junto a @reto.lock21, pulsa **Generate token**. Vuelve a entrar con la cuenta si te lo pide.
2. Copia el token: es un texto muy largo (suele empezar por `IG`). **Es una contraseña: no lo mandes por WhatsApp ni lo pegues en ningún sitio que no sea Netlify.** Dura 60 días, y Lock21 lo renueva sola cada semana.
3. Copia el **ID de usuario de Instagram**. Junto a la cuenta aparece un número largo (suele empezar por `178414...`). Si no lo ves, abre esta dirección en el navegador cambiando `TU_TOKEN` por el token:
   `https://graph.instagram.com/v26.0/me?fields=user_id,username&access_token=TU_TOKEN`
   Copia el número que sale en `user_id` y comprueba que en `username` aparece `reto.lock21`.

## Paso 4. Inventar la clave para consultar el estado (2 min)

Si ya tienes `METRICAS_TOKEN` en Netlify (es la misma clave que usa la tarea semanal de métricas), no la cambies y pasa al paso 5.

Si no la tienes, invéntate una clave larga y aleatoria de al menos 40 caracteres, solo con letras y números. Lo más fácil es el generador de contraseñas del móvil o del navegador. Guárdala en tu gestor de contraseñas.

## Paso 5. Pegarlo todo en Netlify (5 min)

1. Entra en **https://app.netlify.com**, abre el sitio **lock21**.
2. Ve a **Site configuration > Environment variables** y pulsa **Add a variable** (o **Add a single variable**) para cada una de estas:

| Nombre (Key) | Valor |
|---|---|
| `IG_ACCESS_TOKEN` | el token del paso 3 |
| `IG_USER_ID` | el número del paso 3 |
| `IG_PUBLICAR` | `1` |
| `METRICAS_TOKEN` | la clave del paso 4 (solo si no existía) |

   Deja el ámbito (*scopes*) en todos y el mismo valor para todos los contextos. Si te deja marcar la variable como secreta (*Contains secret values*), márcala en el token y en `METRICAS_TOKEN`.
3. Ve a **Deploys** y pulsa **Trigger deploy > Deploy site** para que las funciones arranquen con las variables nuevas.

Listo. A partir de aquí, lo que esté en la cola se publica solo. Puede tardar **hasta 10 minutos** desde la hora programada.

> ¿Quieres probar antes de publicar de verdad? Pega primero solo `IG_ACCESS_TOKEN` e `IG_USER_ID`, sin `IG_PUBLICAR`. El publicador simulará y comprobará que las imágenes y los vídeos se pueden descargar. Cuando lo veas bien, añade `IG_PUBLICAR` = `1` y vuelve a desplegar.

---

## Cómo ver qué ha pasado

**Opción fácil.** Netlify > **Logs > Functions** > `publicar-instagram`. Cada 10 minutos aparece una línea con lo publicado, lo pendiente y los errores.

**Opción completa.** El estado de toda la cola, con los últimos errores:

```
curl -H "Authorization: Bearer TU_METRICAS_TOKEN" https://lock21.netlify.app/.netlify/functions/estado-instagram
```

Cada pieza aparece con uno de estos estados:

| Estado | Qué significa |
|---|---|
| `programada` | todavía no le toca |
| `publicado` | publicada (se incluye el `mediaId` de Instagram) |
| `procesando` | Instagram aún está preparando el vídeo; se publica en la siguiente vuelta |
| `esperando_medios` | la imagen o el vídeo todavía no está en la web (el despliegue no ha terminado) |
| `error` | falló; se reintenta en la siguiente vuelta (como mucho 3 intentos) |
| `fallido` | falló 3 veces y ya no se reintenta |
| `caducada` | le tocaba hace más de 6 h (por ejemplo, porque el publicador estaba apagado) y no se publica, para no soltar varias piezas viejas de golpe |

## Si algo falla

- **"Token no válido o caducado"**: repite el paso 3 (Generate token) y pega el token nuevo en `IG_ACCESS_TOKEN`. Después, **Trigger deploy**. El token nuevo pasa a mandar automáticamente sobre el renovado.
- **El token caduca a los 60 días**: Lock21 lo renueva cada lunes a las 04:17 UTC. Instagram solo deja renovar un token que tenga **más de 24 horas y menos de 60 días**. Si el publicador estuvo parado más de 60 días, hay que generar uno nuevo (paso 3).
- **`esperando_medios` durante mucho rato**: la pieza está en la cola, pero sus archivos no están publicados en `lock21.netlify.app/redes/...`. Comprueba que el último despliegue de `main` ha terminado bien.
- **`fallido` con un mensaje de formato**: Instagram solo acepta JPEG en imágenes y MP4 (H.264 con audio AAC) en vídeos. Vuelve a encolar con el script, que convierte los archivos solo.
- **"Límite diario"**: Instagram permite 50 publicaciones por API en 24 horas. Lo que no cabe se publica en cuanto hay hueco, siempre que no lleve más de 6 h de retraso.
- **Quiero parar una pieza**: en su JSON de `contenido/cola/`, cambia `"estado": "programado"` por `"estado": "pausado"` y despliega.
- **Quiero parar todo**: borra `IG_PUBLICAR` en Netlify (o ponle `0`) y despliega. Vuelve a modo simulación.

## Lo que la API de Instagram no permite (verificado en la documentación de Meta, octubre de 2026)

- **Historias sin pegatinas**: ni enlace, ni encuesta, ni pregunta, ni test. Por eso las historias con "Pide tu plaza aquí" se generan con el rótulo "El enlace está en la bio" (`ENLACE_BIO=1` en `historias.py`). Las encuestas y preguntas de `historias/interactivas.md` hay que ponerlas a mano desde el móvil.
- **Sin música de Instagram ni filtros**: los reels salen con una pista de audio en silencio. Si quieres música, ese reel hay que subirlo a mano. Para que no salga dos veces, en su JSON pon `"estado": "pausado"`.
- **Los Trial Reels** se publican con `trial_params` y graduación automática por rendimiento (`SS_PERFORMANCE`): si funcionan bien con quien no te sigue, Instagram los comparte solo con tus seguidores, sin que tengas que hacer nada.

## Para encolar una semana nueva

Desde la raíz del repositorio (necesita Python con Pillow y ffmpeg):

```
python3 herramientas/contenido/encolar_semana.py /ruta/a/semana-N
```

El script convierte los PNG a JPEG (calidad 92) y añade audio AAC en silencio a los reels que no lo tienen. Copia los archivos a `public/redes/AAAA-MM-DD/`, cambia "Comenta LOCK..." por "El enlace para pedir tu plaza está en la bio" y crea un JSON por pieza en `contenido/cola/`. No encola nada anterior a ahora. Opciones:

- `--desde AAAA-MM-DD`: empieza en ese día.
- `--excluir texto`: salta las carpetas que contengan ese texto.
- `--simular`: solo muestra lo que haría.

Las historias salen a las 20:00 de su día, salvo que pongas un `hora.txt` en `historias/AAAA-MM-DD/`. Después, haz commit, súbelo a `main` y espera a que Netlify despliegue antes de la hora de la primera pieza.

## Fuentes

- Content Publishing: https://developers.facebook.com/docs/instagram-platform/content-publishing
- POST /{ig-user-id}/media (parámetros y requisitos de archivos): https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media
- Estado del contenedor: https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-container
- Límite de publicación: https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/content_publishing_limit
- Renovar el token: https://developers.facebook.com/docs/instagram-platform/reference/refresh_access_token
- Crear la app: https://developers.facebook.com/docs/instagram-platform/create-an-instagram-app
- Primeros pasos (token desde el panel, ID de usuario): https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/get-started
- Sin página de Facebook: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
