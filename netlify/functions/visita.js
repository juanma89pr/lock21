// Contador propio de visitas y clics (sin cookies ni datos personales): suma por día y por origen.
import { getStore } from '@netlify/blobs';
import { json } from '../lib/http.js';

var EVENTOS = ['visita', 'visita_app', 'clic_plaza', 'solicitud'];
var BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse/i;

function diaCanarias(d) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Atlantic/Canary', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

export default async function handler(req) {
  if (req.method !== 'POST') { return json(405, { error: 'metodo' }); }
  if (BOT.test(req.headers.get('user-agent') || '')) { return new Response(null, { status: 204 }); }
  var datos = null;
  try {
    var texto = await req.text();
    if (texto.length > 300) { return json(400, { error: 'largo' }); }
    datos = JSON.parse(texto);
  } catch (e) {
    return json(400, { error: 'json' });
  }
  var ev = datos && datos.e;
  if (EVENTOS.indexOf(ev) === -1) { return json(400, { error: 'evento' }); }
  var o = String((datos && datos.o) || 'directo').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 20) || 'directo';
  var store = getStore({ name: 'metricas-web', consistency: 'strong' });
  var clave = diaCanarias(new Date());
  var dia = null;
  try { dia = await store.get(clave, { type: 'json' }); } catch (e) { dia = null; }
  if (!dia) { dia = {}; }
  if (!dia[ev]) { dia[ev] = { total: 0, origen: {} }; }
  dia[ev].total = dia[ev].total + 1;
  if (Object.keys(dia[ev].origen).length < 30 || dia[ev].origen[o]) { dia[ev].origen[o] = (dia[ev].origen[o] || 0) + 1; }
  await store.setJSON(clave, dia);
  return new Response(null, { status: 204 });
}
