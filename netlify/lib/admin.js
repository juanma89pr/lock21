// Acceso a Firestore desde las funciones con firebase-admin.
// Solo se activa si existe FIREBASE_SERVICE_ACCOUNT: el JSON de la cuenta de servicio pegado tal cual
// (recomendado: ocupa menos) o en base64.
// Sin ella, las funciones responden igual pero no guardan nada (guardado: false).

var instancia = null;
var intentado = false;

export async function obtenerDb() {
  if (intentado) { return instancia; }
  intentado = true;
  var b64 = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!b64) { return null; }
  try {
    var bruto = b64.trim();
    var texto = bruto.charAt(0) === '{' ? bruto : Buffer.from(bruto, 'base64').toString('utf8');
    var credenciales = JSON.parse(texto);
    var app = await import('firebase-admin/app');
    var fs = await import('firebase-admin/firestore');
    var existente = app.getApps().length ? app.getApps()[0] : app.initializeApp({ credential: app.cert(credenciales) });
    instancia = { db: fs.getFirestore(existente), FieldValue: fs.FieldValue, app: existente };
  } catch (e) {
    console.error('firebase-admin: no se pudo iniciar', e && e.message);
    instancia = null;
  }
  return instancia;
}

// Lee perfil, check-ins y chat reciente de un usuario. Devuelve null sin Firestore.
export async function leerUsuario(fire, uid) {
  if (!fire) { return null; }
  var ref = fire.db.collection('usuarios').doc(uid);
  var perfil = await ref.get();
  var checks = await ref.collection('checkins').get();
  var checkins = {};
  checks.forEach(function (d) { checkins[d.id] = d.data(); });
  return { perfil: perfil.exists ? perfil.data() : {}, checkins: checkins };
}

export async function leerChatReciente(fire, uid, n) {
  if (!fire) { return []; }
  var q = await fire.db.collection('usuarios').doc(uid).collection('chat').orderBy('fecha', 'desc').limit(n).get();
  var lista = [];
  q.forEach(function (d) { lista.push(d.data()); });
  return lista.reverse();
}
