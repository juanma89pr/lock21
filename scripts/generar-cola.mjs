// Reúne la cola de Instagram (contenido/cola/*.json), la valida y la deja en
// netlify/lib/cola-instagram.generada.json para que esbuild la meta en las funciones.
// Falla (código 1) si una pieza no es válida o le falta un archivo en public/.
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { validarPieza } from '../netlify/lib/instagram.js';

var DIR = 'contenido/cola';
var SALIDA = 'netlify/lib/cola-instagram.generada.json';
var errores = [];
var piezas = [];
var ids = {};

var nombres = existsSync(DIR) ? readdirSync(DIR).filter(function (n) { return /\.json$/.test(n); }).sort() : [];
nombres.forEach(function (n) {
  var ruta = join(DIR, n);
  var p;
  try { p = JSON.parse(readFileSync(ruta, 'utf8')); } catch (e) { errores.push(ruta + ': JSON no válido'); return; }
  if (!/^\d{4}-\d{2}-\d{2}_\d{4}_[a-z0-9-]+\.json$/.test(n)) { errores.push(ruta + ': el nombre debe ser AAAA-MM-DD_HHMM_slug.json'); }
  p.id = n.replace(/\.json$/, '');
  if (ids[p.id]) { errores.push(ruta + ': id repetido'); }
  ids[p.id] = true;
  validarPieza(p).forEach(function (e) { errores.push(ruta + ': ' + e); });
  (p.archivos || []).concat(p.portada ? [p.portada] : []).forEach(function (a) {
    var f = join('public', a);
    if (!existsSync(f)) { errores.push(ruta + ': no existe ' + f); return; }
    var tam = statSync(f).size;
    if (/\.jpe?g$/i.test(a) && tam > 8 * 1024 * 1024) { errores.push(ruta + ': ' + f + ' pasa de 8 MB'); }
    if (/\.mp4$/i.test(a) && tam > 100 * 1024 * 1024) { errores.push(ruta + ': ' + f + ' pasa de 100 MB'); }
  });
  piezas.push({ id: p.id, fecha: p.fecha, tipo: p.tipo, archivos: p.archivos, portada: p.portada || null, pie: p.pie || '', prueba: !!p.prueba, audio: p.audio || null, colaboradores: p.colaboradores || null, estado: p.estado || 'programado' });
});

if (errores.length) {
  console.error('Cola de Instagram no válida:\n' + errores.join('\n'));
  process.exit(1);
}
writeFileSync(SALIDA, JSON.stringify({ generada: new Date().toISOString(), piezas: piezas }, null, 1) + '\n');
console.log('Cola de Instagram: ' + piezas.length + ' piezas -> ' + SALIDA);
