// Comprueba que ninguna marca del servicio premium se filtra al código publicado.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

var prohibidas = [/balancet/i, /\bMMF\b/, /MOOV/];
var errores = [];

function recorrer(dir) {
  readdirSync(dir).forEach(function (nombre) {
    var ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) { recorrer(ruta); return; }
    if (!/\.(html|js|css|json|webmanifest|txt)$/.test(nombre)) { return; }
    var texto = readFileSync(ruta, 'utf8');
    prohibidas.forEach(function (re) {
      if (re.test(texto)) { errores.push(ruta + ' contiene ' + re); }
    });
  });
}

recorrer('dist');
if (errores.length) {
  console.error('Fuga de marca detectada:\n' + errores.join('\n'));
  process.exit(1);
}
console.log('Marca limpia: ninguna referencia al servicio premium en dist/.');
