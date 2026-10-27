// Métricas públicas de solo agregados (sin correos ni datos personales): visitas y clics de la web
// por día y origen, y contadores del reto por grupo. Las usa el informe semanal.
import { getStore } from '@netlify/blobs';
import { json } from '../lib/http.js';
import { calcularMetricas } from './metricas.js';
import { diagnosticoDb, obtenerDb } from '../lib/admin.js';

function diaCanarias(d) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Atlantic/Canary', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

export default async function handler(req) {
  if (req.method !== 'GET') { return json(405, { error: 'metodo' }); }
  var web = { dias: [], totales: {} };
  try {
    var store = getStore({ name: 'metricas-web', consistency: 'strong' });
    for (var i = 29; i >= 0; i--) {
      var clave = diaCanarias(new Date(Date.now() - i * 86400000));
      var d = null;
      try { d = await store.get(clave, { type: 'json' }); } catch (e) { d = null; }
      if (!d) { continue; }
      web.dias.push({ dia: clave, datos: d });
      Object.keys(d).forEach(function (ev) {
        if (!web.totales[ev]) { web.totales[ev] = { total: 0, origen: {} }; }
        web.totales[ev].total = web.totales[ev].total + d[ev].total;
        Object.keys(d[ev].origen).forEach(function (o) { web.totales[ev].origen[o] = (web.totales[ev].origen[o] || 0) + d[ev].origen[o]; });
      });
    }
  } catch (e) {
    web.error = 'sin_blobs';
  }
  var reto = null;
  try {
    var r = await calcularMetricas(false);
    reto = JSON.parse(await r.text());
    delete reto.detalleInscritos;
    delete reto.detalleLeads;
    delete reto.detalleLista;
  } catch (e2) {
    reto = { error: 'sin_datos' };
  }
  // Solo el estado de cada propuesta de marketing (sin notas), para que las tareas sepan qué está aprobado.
  var marketing = {};
  try {
    var fire = await obtenerDb();
    if (fire) {
      var snap = await fire.db.collection('marketing_decisiones').get();
      snap.forEach(function (doc) { marketing[doc.id] = doc.data().estado; });
    }
  } catch (e3) {
    marketing = { error: 'sin_datos' };
  }
  return json(200, { generado: new Date().toISOString(), web: web, reto: reto, firestore: diagnosticoDb, marketing: marketing });
}
