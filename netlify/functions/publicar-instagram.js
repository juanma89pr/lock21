// Función programada (cada 10 minutos, ver netlify.toml): publica en Instagram lo que
// ya toca de la cola (contenido/cola/*.json, empaquetada en el build).
// Sin IG_PUBLICAR=1 solo simula y lo registra. Estado en Netlify Blobs (publicador-instagram).
import { getStore } from '@netlify/blobs';
import cola from '../lib/cola-instagram.generada.json';
import { ejecutarPublicador } from '../lib/instagram.js';

export default async function handler() {
  var store = getStore({ name: 'publicador-instagram', consistency: 'strong' });
  var resumen = await ejecutarPublicador({
    cola: cola.piezas,
    store: store,
    fetch: fetch,
    env: process.env,
    log: function (t) { console.log(t); }
  });
  console.log('publicar-instagram: ' + JSON.stringify(resumen));
  return new Response(null, { status: 204 });
}
