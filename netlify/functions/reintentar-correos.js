// Solo el propietario: vuelve a intentar al momento los correos que fallaron (pone a cero sus
// intentos) y manda la bienvenida a quien no la tenga. Devuelve el resultado por persona.
import { json } from '../lib/http.js';
import { verificarUsuario } from '../lib/auth.js';
import { obtenerDb } from '../lib/admin.js';
import { esPropietario } from '../lib/propietarios.js';
import { enviar, anotar, TIPOS, correoListo } from '../lib/correos.js';
import { fechaEnZona, diasEntre } from '../../src/lib/grupos.js';

export default async function handler(req) {
  if (req.method !== 'POST') { return json(405, { error: 'metodo' }); }
  var acceso = await verificarUsuario(req);
  if (acceso.error) { return acceso.error; }
  if (!esPropietario(acceso.usuario)) { return json(403, { error: 'sin_permiso' }); }
  if (!correoListo()) { return json(409, { error: 'correo_sin_configurar' }); }
  var fire = await obtenerDb();
  if (!fire) { return json(503, { error: 'sin_firestore' }); }
  var hoy = fechaEnZona(new Date());
  var snap = await fire.db.collection('inscritos').get();
  var resultado = [];
  for (var i = 0; i < snap.docs.length && resultado.length < 60; i++) {
    var doc = snap.docs[i];
    var d = doc.data();
    if (d.baja || !d.grupo || diasEntre(hoy, d.grupo) < -2) { continue; }
    var c = d.correos || {};
    // Lo que falló, y la bienvenida si nunca salió.
    var tipos = TIPOS.filter(function (t) { return c[t] && !c[t].ok; });
    if (!(c.bienvenida && c.bienvenida.ok) && tipos.indexOf('bienvenida') === -1) { tipos.unshift('bienvenida'); }
    for (var k = 0; k < tipos.length; k++) {
      var t = tipos[k];
      var r = await enviar(t, doc.id, d, hoy);
      var nota = anotar({ correos: {} }, t, r, new Date().toISOString());
      var cambio = { correos: {} };
      cambio.correos[t] = nota;
      await doc.ref.set(cambio, { merge: true });
      resultado.push({ nombre: d.nombre, tipo: t, ok: r.ok, motivo: r.motivo });
      if (!r.ok) { break; }
    }
  }
  return json(200, { ok: true, resultado: resultado });
}
