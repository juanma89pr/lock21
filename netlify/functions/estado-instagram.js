// Estado del publicador de Instagram. GET con Authorization: Bearer <METRICAS_TOKEN>.
// Devuelve la cola con el estado de cada pieza, los últimos errores y el registro.
import { timingSafeEqual } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import { json } from '../lib/http.js';
import cola from '../lib/cola-instagram.generada.json';
import { informeEstado } from '../lib/instagram.js';

function mismoToken(a, b) {
  var x = Buffer.from(String(a));
  var y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

export default async function handler(req) {
  if (req.method !== 'GET') { return json(405, { error: 'metodo' }); }
  var esperado = process.env.METRICAS_TOKEN;
  if (!esperado) { return json(503, { error: 'sin_metricas_token' }); }
  var cabecera = req.headers.get('authorization') || '';
  var token = cabecera.indexOf('Bearer ') === 0 ? cabecera.slice(7).trim() : '';
  if (!token || !mismoToken(token, esperado)) { return json(401, { error: 'no_autorizado' }); }
  try {
    var store = getStore({ name: 'publicador-instagram', consistency: 'strong' });
    var informe = await informeEstado({ cola: cola.piezas, store: store, env: process.env });
    informe.colaGenerada = cola.generada;
    return json(200, informe);
  } catch (e) {
    console.error('estado-instagram: error', e && e.message);
    return json(500, { error: 'interno' });
  }
}
