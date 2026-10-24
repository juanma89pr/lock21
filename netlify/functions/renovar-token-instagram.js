// Función programada semanal (ver netlify.toml): renueva el token de larga duración de
// Instagram (60 días) y lo guarda en Netlify Blobs. Instagram exige que el token tenga
// al menos 24 h y que no haya caducado; si caduca, hay que generar uno nuevo a mano.
import { getStore } from '@netlify/blobs';
import { renovarToken } from '../lib/instagram.js';

export default async function handler() {
  var store = getStore({ name: 'publicador-instagram', consistency: 'strong' });
  var r = await renovarToken({ store: store, fetch: fetch, env: process.env });
  console.log('renovar-token-instagram: ' + (r.ok ? 'renovado, caduca ' + r.expira : 'no renovado (' + r.motivo + ')'));
  return new Response(null, { status: 204 });
}
