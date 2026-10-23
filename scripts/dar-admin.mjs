// Pone el claim admin: true a los correos de netlify/lib/propietarios.js.
// Uso (una vez, en local, después de que cada propietario haya entrado al menos una vez):
//   FIREBASE_SERVICE_ACCOUNT=$(base64 -w0 cuenta-servicio.json) node scripts/dar-admin.mjs
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { PROPIETARIOS } from '../netlify/lib/propietarios.js';

var b64 = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!b64) {
  console.error('Falta FIREBASE_SERVICE_ACCOUNT (JSON de la cuenta de servicio en base64).');
  process.exit(1);
}
initializeApp({ credential: cert(JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))) });
var auth = getAuth();

for (var i = 0; i < PROPIETARIOS.length; i++) {
  var email = PROPIETARIOS[i];
  try {
    var usuario = await auth.getUserByEmail(email);
    await auth.setCustomUserClaims(usuario.uid, Object.assign({}, usuario.customClaims || {}, { admin: true }));
    console.log('admin: ' + email);
  } catch (e) {
    console.warn('sin cuenta todavía (que entre una vez en /app): ' + email);
  }
}
