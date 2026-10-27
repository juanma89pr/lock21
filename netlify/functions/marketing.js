// Panel de marketing «Movimiento 21» (solo el propietario).
// GET → arsenal (netlify/lib/arsenal.json: propuestas, grabaciones y descargables que preparamos
// Claude y las tareas programadas), las decisiones de Juanma y la programación de Instagram de los
// próximos 21 días con su miniatura. POST { id, estado, nota } → guarda la decisión sobre una
// propuesta o grabación en Firestore (marketing_decisiones/{id}).
import { getStore } from '@netlify/blobs';
import { json, leerJson, recortar } from '../lib/http.js';
import { verificarUsuario } from '../lib/auth.js';
import { obtenerDb } from '../lib/admin.js';
import { esPropietario } from '../lib/propietarios.js';
import { informeEstado } from '../lib/instagram.js';
import arsenal from '../lib/arsenal.json';
import cola from '../lib/cola-instagram.generada.json';

var ESTADOS = ['propuesta', 'aprobada', 'mas_adelante', 'descartada', 'hecha', 'pendiente', 'grabada'];
var DIAS = 21 * 86400000;

function titulo(p) {
  var primera = String(p.pie || '').split('\n')[0].trim();
  if (primera) { return primera.slice(0, 90); }
  return p.id.replace(/^\d{4}-\d{2}-\d{2}_\d{4}_/, '').replace(/-/g, ' ');
}

export default async function handler(req) {
  var acceso = await verificarUsuario(req);
  if (acceso.error) { return acceso.error; }
  if (!esPropietario(acceso.usuario)) { return json(403, { error: 'sin_permiso' }); }
  var fire = await obtenerDb();

  if (req.method === 'POST') {
    var cuerpo = await leerJson(req, 3000);
    if (cuerpo.error) { return json(400, { error: cuerpo.error }); }
    var d = cuerpo.datos;
    var id = recortar(d.id, 80);
    if (!/^[a-z0-9-]+$/.test(id) || ESTADOS.indexOf(d.estado) === -1) { return json(400, { error: 'datos' }); }
    if (!fire) { return json(503, { error: 'sin_firestore' }); }
    var dec = { estado: d.estado, nota: recortar(d.nota, 600), en: new Date().toISOString() };
    await fire.db.collection('marketing_decisiones').doc(id).set(dec, { merge: true });
    return json(200, { ok: true, decision: dec });
  }
  if (req.method !== 'GET') { return json(405, { error: 'metodo' }); }

  var decisiones = {};
  if (fire) {
    var snap = await fire.db.collection('marketing_decisiones').get();
    snap.forEach(function (doc) { decisiones[doc.id] = doc.data(); });
  }
  var programacion = [];
  try {
    var store = getStore({ name: 'publicador-instagram', consistency: 'strong' });
    var inf = await informeEstado({ cola: cola.piezas, store: store, env: process.env });
    var estados = {};
    inf.cola.forEach(function (p) { estados[p.id] = p.estado; });
    var ahora = Date.now();
    programacion = cola.piezas.filter(function (p) {
      var t = Date.parse(p.fecha);
      return t > ahora - 86400000 && t < ahora + DIAS;
    }).map(function (p) {
      var img = p.portada || (p.archivos && p.archivos[0]) || '';
      return { id: p.id, fecha: p.fecha, tipo: p.tipo, titulo: titulo(p), miniatura: img && !/\.mp4$/.test(img) ? '/' + img : '', estado: estados[p.id] || 'programada' };
    });
  } catch (e) {
    console.error('marketing: programación', e && e.message);
  }
  return json(200, { arsenal: arsenal, decisiones: decisiones, programacion: programacion });
}
