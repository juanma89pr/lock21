// Solo el propietario: reenvía al momento un correo de la secuencia (bienvenida, 7 días, víspera
// o día 1) a una persona ({ id, tipo }) o a todas las inscritas de los próximos grupos ({ todos: true, tipo }).
// Sirve para probar cómo llega y para recuperar a quien no lo recibió. No cuenta como intento fallido.
import { json, leerJson } from '../lib/http.js';
import { verificarUsuario } from '../lib/auth.js';
import { obtenerDb } from '../lib/admin.js';
import { esPropietario } from '../lib/propietarios.js';
import { enviar, anotar, TIPOS, EMPUJES, correoListo } from '../lib/correos.js';
import { fechaEnZona, diasEntre } from '../../src/lib/grupos.js';

export default async function handler(req) {
  if (req.method !== 'POST') { return json(405, { error: 'metodo' }); }
  var acceso = await verificarUsuario(req);
  if (acceso.error) { return acceso.error; }
  if (!esPropietario(acceso.usuario)) { return json(403, { error: 'sin_permiso' }); }
  if (!correoListo()) { return json(409, { error: 'correo_sin_configurar' }); }
  var cuerpo = await leerJson(req, 2000);
  if (cuerpo.error) { return json(400, { error: cuerpo.error }); }
  var d = cuerpo.datos;
  var tipo = TIPOS.concat(EMPUJES).filter(function (t) { return t !== 'hito'; }).indexOf(d.tipo) !== -1 ? d.tipo : 'bienvenida';
  var fire = await obtenerDb();
  if (!fire) { return json(503, { error: 'sin_firestore' }); }
  var hoy = fechaEnZona(new Date());
  var docs = [];
  if (d.todos === true) {
    var snap = await fire.db.collection('inscritos').get();
    snap.forEach(function (doc) {
      var x = doc.data();
      if (!x.baja && x.grupo && diasEntre(hoy, x.grupo) >= -2) { docs.push(doc); }
    });
  } else {
    if (!/^[a-f0-9]{24}$/.test(String(d.id || ''))) { return json(400, { error: 'falta_persona' }); }
    var uno = await fire.db.collection('inscritos').doc(d.id).get();
    if (!uno.exists) { return json(404, { error: 'no_encontrada' }); }
    if (uno.data().baja) { return json(409, { error: 'de_baja' }); }
    docs.push(uno);
  }
  var resultado = [];
  for (var i = 0; i < docs.length && i < 60; i++) {
    var x = docs[i].data();
    var r = await enviar(tipo, docs[i].id, x, hoy);
    var cambio = { correos: {} };
    cambio.correos[tipo] = Object.assign(anotar({ correos: {} }, tipo, r, new Date().toISOString()), { reenviado: true });
    await docs[i].ref.set(cambio, { merge: true });
    resultado.push({ nombre: x.nombre, email: x.email, tipo: tipo, ok: r.ok, motivo: r.motivo });
  }
  return json(200, { ok: true, resultado: resultado });
}
