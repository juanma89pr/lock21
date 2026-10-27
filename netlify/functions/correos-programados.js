// Cada hora: manda a cada inscrito el correo de la secuencia que le toque (bienvenida pendiente,
// 7 días antes, la víspera y el día 1). Sin RESEND_API_KEY y CORREO_REMITENTE no envía nada
// y todo queda pendiente para cuando estén.
import { obtenerDb } from '../lib/admin.js';
import { correoQueToca, enviar, anotar, correoListo, hitoPendiente, horasDesdeUltimo } from '../lib/correos.js';
import { fechaEnZona, sumarDias, diasEntre } from '../../src/lib/grupos.js';

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
  // Cifras reales del grupo: al pasar de 5, 10, 15… dorsales se lo contamos a todo el grupo, una vez.
  if (hora >= 10 && hora <= 21) {
    var porGrupo = {};
    snap.docs.forEach(function (doc) {
      var x = doc.data();
      if (x.baja || !x.grupo || diasEntre(hoy, x.grupo) < 2) { return; }
      if (!porGrupo[x.grupo]) { porGrupo[x.grupo] = []; }
      porGrupo[x.grupo].push(doc);
    });
    var grupos = Object.keys(porGrupo);
    for (var g = 0; g < grupos.length; g++) {
      if (Date.now() - inicio > 22000) { break; }
      var gref = fire.db.collection('grupos_inscritos').doc(grupos[g]);
      var gdoc = await gref.get();
      var anunciado = gdoc.exists ? (gdoc.data().hitoAnunciado || 0) : 0;
      var n = porGrupo[grupos[g]].length;
      var hito = hitoPendiente(n, anunciado);
      if (!hito) { continue; }
      await gref.set({ hitoAnunciado: hito, hitoEn: new Date().toISOString() }, { merge: true });
      for (var k = 0; k < porGrupo[grupos[g]].length; k++) {
        var m = porGrupo[grupos[g]][k];
        var md = m.data();
        if (horasDesdeUltimo(md, Date.now()) < 20) { continue; }
        var rh = await enviar('hito', m.id, md, hoy, { n: n });
        await m.ref.set({ correos: { hito: anotar({ correos: {} }, 'hito', rh, new Date().toISOString()) } }, { merge: true });
        if (rh.ok) { enviados = enviados + 1; }
      }
    }
  }
  return new Response('ok ' + enviados);
}
