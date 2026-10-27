// Baja de los correos del reto con un clic. GET enseña la confirmación (los antivirus del correo
// abren los enlaces y no deben dar de baja a nadie); POST la hace (botón o List-Unsubscribe-Post).
import { obtenerDb } from '../lib/admin.js';
import { leerConToken } from '../lib/inscritos.js';

function pagina(titulo, texto, formulario) {
  var html = '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + titulo + ' · Lock21</title>' +
    '<style>body{margin:0;font-family:system-ui,Arial,sans-serif;background:#F5F2EA;color:#121212;display:grid;place-items:center;min-height:100vh;padding:16px;box-sizing:border-box}' +
    'main{max-width:420px}h1{color:#2433D9;font-size:30px;letter-spacing:-1px;margin:0 0 12px}p{line-height:1.5}button{font:inherit;font-weight:700;background:#2433D9;color:#fff;border:0;border-radius:999px;padding:14px 24px;cursor:pointer}a{color:#2433D9}</style></head>' +
    '<body><main><h1>' + titulo + '</h1><p>' + texto + '</p>' + (formulario || '') + '</main></body></html>';
  return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
}

export default async function handler(req) {
  var url = new URL(req.url);
  var i = url.searchParams.get('i');
  var t = url.searchParams.get('t');
  var fire = await obtenerDb();
  var doc = await leerConToken(fire, i, t);
  if (!doc) { return pagina('Enlace no válido', 'No encontramos esta inscripción. Si quieres darte de baja, responde a cualquiera de nuestros correos y lo hacemos a mano.'); }
  if (req.method === 'POST') {
    await doc.ref.set({ baja: true, bajaEn: new Date().toISOString() }, { merge: true });
    return pagina('Hecho', 'No te escribiremos más. Tu plaza queda libre. Si cambias de idea, puedes volver a apuntarte cuando quieras en <a href="/">lock21.balancet.org</a>.');
  }
  if (doc.data().baja) { return pagina('Ya estás de baja', 'No te escribiremos más.'); }
  return pagina('¿Darte de baja?', 'Dejarás de recibir los correos del reto y tu plaza quedará libre.',
    '<form method="post"><button type="submit">Sí, darme de baja</button></form>');
}
