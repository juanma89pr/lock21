// Pulso público del publicador de Instagram: solo estados de la cola de las últimas/próximas
// 48 h, la última ejecución y los últimos errores (sin tokens ni datos personales).
// Sirve para vigilar el publicador sin METRICAS_TOKEN.
import { getStore } from '@netlify/blobs';
import { json } from '../lib/http.js';
import cola from '../lib/cola-instagram.generada.json';
import { informeEstado } from '../lib/instagram.js';

var VENTANA = 48 * 60 * 60 * 1000;

export default async function handler(req) {
  if (req.method !== 'GET') { return json(405, { error: 'metodo' }); }
  try {
    var store = getStore({ name: 'publicador-instagram', consistency: 'strong' });
    var inf = await informeEstado({ cola: cola.piezas, store: store, env: process.env });
    var ahora = Date.now();
    var cerca = inf.cola.filter(function (p) { return Math.abs(Date.parse(p.fecha) - ahora) < VENTANA; }).map(function (p) {
      return { id: p.id, fecha: p.fecha, tipo: p.tipo, estado: p.estado, intentos: p.intentos, publicadoEn: p.publicadoEn, ultimoError: p.ultimoError };
    });
    return json(200, {
      generado: inf.generado,
      modo: inf.modo,
      variables: inf.variables,
      tokenInvalido: !!inf.token.invalidoDesde,
      ultimaEjecucion: inf.ultimaEjecucion,
      colaGenerada: cola.generada,
      cola: cerca,
      ultimosErrores: inf.ultimosErrores.slice(0, 8),
      registro: inf.registro.slice(0, 10)
    });
  } catch (e) {
    console.error('pulso-instagram: error', e && e.message);
    return json(500, { error: 'interno' });
  }
}
