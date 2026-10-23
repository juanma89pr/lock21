// Comprueba que las Netlify Functions se empaquetan con esbuild sin errores
// (igual que hace Netlify con node_bundler = "esbuild"). Salida en .funciones/.
import { build } from 'esbuild';
import { readdirSync } from 'node:fs';

var entradas = readdirSync('netlify/functions').filter(function (n) { return /\.m?js$/.test(n); }).map(function (n) { return 'netlify/functions/' + n; });

await build({
  entryPoints: entradas,
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outdir: '.funciones',
  external: ['firebase-admin', 'firebase-admin/*', '@netlify/blobs'],
  logLevel: 'warning'
});
console.log('Funciones empaquetadas: ' + entradas.join(', '));
