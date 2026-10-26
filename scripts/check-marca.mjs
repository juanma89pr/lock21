// Comprueba que ningún nombre interno se filtra al código publicado.
// Desde el 26 oct 2026 Lock21 se presenta como proyecto de Balancet (decisión de Juanma):
// el nombre Balancet ya se puede ver; los nombres internos del método, no.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

var prohibidas = [/\bMMF\b/, /MOOV/];
var errores = [];

function recorrer(dir) {
  readdirSync(dir).forEach(function (nombre) {
    var ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) { recorrer(ruta); return; }
    if (!/\.(html|js|css|json|webmanifest|txt)$/.test(nombre)) { return; }
    var texto = readFileSync(ruta, 'utf8');
    // Única excepción: el correo legal de contacto, y solo en la página de privacidad.
    if (/privacidad\.html$/.test(nombre)) { texto = texto.split('lock21@balancet.org').join(''); }
    prohibidas.forEach(function (re) {
      if (re.test(texto)) { errores.push(ruta + ' contiene ' + re); }
    });
  });
}

recorrer('dist');
// Los pies de Instagram van dentro de las funciones, no en dist: se revisan también.
['netlify/lib/cola-instagram.generada.json', 'contenido/cola'].forEach(function (ruta) {
  try { statSync(ruta); } catch (e) { return; }
  if (statSync(ruta).isDirectory()) { recorrer(ruta); return; }
  var texto = readFileSync(ruta, 'utf8');
  prohibidas.forEach(function (re) { if (re.test(texto)) { errores.push(ruta + ' contiene ' + re); } });
});
if (errores.length) {
  console.error('Fuga de marca detectada:\n' + errores.join('\n'));
  process.exit(1);
}
console.log('Marca limpia: ninguna referencia al servicio premium en dist/ ni en la cola de Instagram.');
