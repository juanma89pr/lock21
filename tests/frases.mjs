// Pasa las frases trampa por los filtros previo y de salida, sin llamar a la API.
// D: debe derivarse (texto fijo de derivación). R: debe dar el texto fijo de riesgo.
// También comprueba que frases normales del reto NO se bloquean y que los textos
// fijos pasan el filtro de salida.
import { readFileSync } from 'node:fs';
import { filtroPrevio, filtroSalida, respuestaFija, TEXTO_RIESGO, TEXTO_DERIVAR } from '../src/lib/guardarrailes.js';
import { RESPALDO_CHECKIN, RESPALDO_CHAT } from '../src/lib/respaldo.js';

var frases = JSON.parse(readFileSync(new URL('./frases-trampa.json', import.meta.url), 'utf8'));
var fallos = [];
var bien = 0;

frases.forEach(function (par) {
  var frase = par[0];
  var esperado = par[1];
  var r = respuestaFija(frase);
  if (esperado === 'R') {
    if (!r || r.tipo !== 'riesgo' || r.texto !== TEXTO_RIESGO || r.texto.indexOf('024') === -1 || r.texto.indexOf('112') === -1) {
      fallos.push('[R] no da el texto de riesgo: ' + frase + ' -> ' + JSON.stringify(filtroPrevio(frase)));
      return;
    }
  } else if (esperado === 'D') {
    if (!r || r.tipo !== 'derivar' || r.texto !== TEXTO_DERIVAR) {
      fallos.push('[D] no se deriva: ' + frase + ' -> ' + JSON.stringify(filtroPrevio(frase)));
      return;
    }
  }
  bien = bien + 1;
});

// Frases normales que no deben bloquearse (falsos positivos).
var normales = [
  'Hoy salí a caminar después de comer y me sentó genial',
  'Me costó, llegué tarde del trabajo pero lo hice igual',
  'Dormí fatal y no tuve ganas',
  'Se me olvidó la botella en casa',
  '¿Cómo hago para no saltármelo el fin de semana?',
  'Mañana tengo cena con amigos, ¿qué hago con mi señal?',
  'Hice la versión mínima de 2 minutos'
];
normales.forEach(function (frase) {
  var p = filtroPrevio(frase);
  if (p.tipo !== 'ok') { fallos.push('[OK] falso positivo: ' + frase + ' -> ' + p.regla); } else { bien = bien + 1; }
});

// Salidas que el filtro de salida debe cortar.
var salidasMalas = [
  'Prueba a comer 150 g de pollo en la cena',
  'Con 1800 kcal irías bien',
  'Os recomiendo que salgáis a caminar',
  'Vosotros podéis con esto',
  'Un poco de creatina te ayudaría',
  'Haz ayuno intermitente los lunes'
];
salidasMalas.forEach(function (s) {
  if (filtroSalida(s).ok) { fallos.push('[SALIDA] no se corta: ' + s); } else { bien = bien + 1; }
});

// Los textos fijos y los mensajes de respaldo deben pasar el filtro de salida.
var fijos = [TEXTO_DERIVAR].concat(RESPALDO_CHAT);
Object.keys(RESPALDO_CHECKIN).forEach(function (k) {
  RESPALDO_CHECKIN[k].forEach(function (m) { fijos.push(m.mensaje); fijos.push(m.tareaManana); });
});
fijos.forEach(function (s) {
  var r = filtroSalida(s);
  if (!r.ok) { fallos.push('[FIJO] el texto fijo no pasa el filtro de salida (' + r.regla + '): ' + s); } else { bien = bien + 1; }
});

if (fallos.length) {
  console.error(fallos.join('\n'));
  console.error('\n' + fallos.length + ' fallos, ' + bien + ' correctas.');
  process.exit(1);
}
console.log('Frases trampa: ' + frases.length + '/' + frases.length + ' bien clasificadas. Comprobaciones totales correctas: ' + bien + '.');
