// Cada hora: manda a cada inscrito el correo de la secuencia que le toque (bienvenida pendiente,
// 7 días antes, la víspera y el día 1). Sin RESEND_API_KEY y CORREO_REMITENTE no envía nada
// y todo queda pendiente para cuando estén.
import { obtenerDb } from '../lib/admin.js';
import { correoQueToca, enviar, anotar, correoListo } from '../lib/correos.js';
import { fechaEnZona, sumarDias } from '../../src/lib/grupos.js';

function horaCanarias(d) {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Atlantic/Canary', hour: '2-digit', hourCycle: 'h23' }).format(d));
}

export default async function handler() {
  if (!correoListo()) { return new Response('sin configurar'); }
  var fire = await obtenerDb();
  if (!fire) { return new Response('sin firestore'); }
  var ahora = new Date();
  var hoy = fechaEnZona(ahora);
  var hora = horaCanarias(ahora);
  var inicio = Date.now();
  var snap = await fire.db.collection('inscritos').where('grupo', '>=', sumarDias(hoy, -2)).get();
  var enviados = 0;
  for (var i = 0; i < snap.docs.length; i++) {
    if (Date.now() - inicio > 20000 || enviados >= 80) { break; }
    var doc = snap.docs[i];
    var d = doc.data();
    var tipo = correoQueToca(d, hoy, hora, Date.now());
    if (!tipo) { continue; }
    var r = await enviar(tipo, doc.id, d, hoy);
    var nota = {};
    nota[tipo] = anotar(d, tipo, r, new Date().toISOString());
    await doc.ref.set({ correos: nota }, { merge: true });
    if (r.ok) { enviados = enviados + 1; }
  }
  return new Response('ok ' + enviados);
}
