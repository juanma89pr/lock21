// Inscripción al reto desde la web (y lectura de la propia inscripción para compartir).
// POST { nombre, email, habito, grupo, acompanamiento, privacidad: true, empresa (trampa), r, origen }
//   → { ok, guardado, id, token, dorsal, grupo, plazas, codigo, nuevo, cambioGrupo, correo }
// GET ?i=&t= → resumen de esa inscripción (para la pantalla de compartir que enlazan los correos).
// POST { accion: 'compartido', i, t, canal } → suma uno a lo que ha compartido esa persona.
import { json, leerJson, recortar } from '../lib/http.js';
import { obtenerDb } from '../lib/admin.js';
import { inscribir, emailValido, leerConToken, resumen } from '../lib/inscritos.js';
import { enviar, anotar } from '../lib/correos.js';
import { fechaEnZona } from '../../src/lib/grupos.js';

var CANALES = ['historia', 'publicacion', 'whatsapp', 'enlace', 'texto', 'descarga', 'nativo'];

export default async function handler(req) {
  var fire = await obtenerDb();

  if (req.method === 'GET') {
    var url = new URL(req.url);
    var doc = await leerConToken(fire, url.searchParams.get('i'), url.searchParams.get('t'));
    if (!doc) { return json(404, { error: 'no_encontrada' }); }
    return json(200, Object.assign({ ok: true }, resumen(doc.data())));
  }
  if (req.method !== 'POST') { return json(405, { error: 'metodo' }); }

  var cuerpo = await leerJson(req, 3000);
  if (cuerpo.error) { return json(400, { error: cuerpo.error }); }
  var d = cuerpo.datos;

  if (d.accion === 'compartido') {
    var c = await leerConToken(fire, d.i, d.t);
    if (!c) { return json(404, { error: 'no_encontrada' }); }
    var canal = CANALES.indexOf(d.canal) !== -1 ? d.canal : 'nativo';
    var cambios = { compartidos: fire.FieldValue.increment(1), ultimoCompartido: new Date().toISOString() };
    cambios['canales.' + canal] = fire.FieldValue.increment(1);
    await c.ref.update(cambios);
    return json(200, { ok: true });
  }

  // Trampa para robots: se responde como si nada.
  if (d.empresa) { return json(200, { ok: true, guardado: false }); }
  var nombre = recortar(d.nombre, 60);
  var email = recortar(d.email, 120).toLowerCase();
  if (!nombre) { return json(400, { error: 'falta_nombre' }); }
  if (!emailValido(email)) { return json(400, { error: 'email_invalido' }); }
  if (d.privacidad !== true) { return json(400, { error: 'falta_privacidad' }); }
  if (!fire) { return json(200, { ok: true, guardado: false }); }

  try {
    var r = await inscribir(fire, {
      nombre: nombre, email: email, habito: recortar(d.habito, 30), grupo: recortar(d.grupo, 10),
      acompanamiento: d.acompanamiento === true, invitadoPor: recortar(d.r, 6).toUpperCase(),
      origen: recortar(d.origen, 20).toLowerCase(), via: 'web'
    });
    var correo = null;
    // Bienvenida al momento solo a quien entra nuevo (o cambia de grupo); a quien repite, nada.
    if (r.nuevo || r.cambioGrupo || !(r.datos.correos && r.datos.correos.bienvenida && r.datos.correos.bienvenida.ok)) {
      var envio = await enviar('bienvenida', r.id, r.datos, fechaEnZona(new Date()));
      var nota = anotar(r.datos, 'bienvenida', envio, new Date().toISOString());
      await fire.db.collection('inscritos').doc(r.id).set({ correos: { bienvenida: nota } }, { merge: true });
      correo = envio.ok ? 'enviado' : 'pendiente';
    }
    return json(200, Object.assign({ ok: true, guardado: true, id: r.id, token: r.datos.token, nuevo: r.nuevo, cambioGrupo: r.cambioGrupo, correo: correo }, resumen(r.datos)));
  } catch (e) {
    if (String(e && e.message) === 'sin_plazas') { return json(409, { error: 'sin_plazas' }); }
    console.error('inscripcion: error', e && e.message);
    return json(500, { error: 'interno' });
  }
}
