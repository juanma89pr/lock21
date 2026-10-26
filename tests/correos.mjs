// Pruebas de la secuencia de correos y de las inscripciones (sin red ni Firestore).
import { correoQueToca, componer, anotar, TIPOS } from '../netlify/lib/correos.js';
import { nombreDeCorreo, grupoPedido, codigoValido, codigoNuevo, idDe } from '../netlify/lib/inscritos.js';

var fallos = [];
var bien = 0;
function igual(nombre, real, esperado) {
  var a = JSON.stringify(real);
  var b = JSON.stringify(esperado);
  if (a === b) { bien = bien + 1; } else { fallos.push(nombre + ': esperado ' + b + ', obtenido ' + a); }
}

var H = 3600000;
var base = { email: 'ana@ejemplo.com', nombre: 'Ana López', grupo: '2026-11-16', habito: 'pasos', dorsal: 7, codigo: 'ABC234', token: 'f'.repeat(32), correos: {} };
function con(correos) { return Object.assign({}, base, { correos: correos }); }
var ahora = Date.parse('2026-10-27T12:00:00Z');

// Bienvenida pendiente (sin clave al apuntarse) sale en cuanto haya clave.
igual('bienvenida pendiente', correoQueToca(con({ bienvenida: { ok: false, motivo: 'sin_configurar', intentos: 0, en: '2026-10-26T20:00:00Z' } }), '2026-10-27', 12, ahora), 'bienvenida');
igual('nada si ya salió y faltan muchos días', correoQueToca(con({ bienvenida: { ok: true, en: '2026-10-26T20:00:00Z' } }), '2026-10-27', 12, ahora), null);
// 7 días antes, a partir de las 10.
var bOk = { bienvenida: { ok: true, en: '2026-10-26T20:00:00Z' } };
igual('d7 a las 10', correoQueToca(con(bOk), '2026-11-09', 10, Date.parse('2026-11-09T10:00:00Z')), 'd7');
igual('d7 no antes de las 10', correoQueToca(con(bOk), '2026-11-09', 9, Date.parse('2026-11-09T09:00:00Z')), null);
igual('d7 no si la bienvenida salió hace menos de 3 días', correoQueToca(con({ bienvenida: { ok: true, en: '2026-11-08T10:00:00Z' } }), '2026-11-09', 12, Date.parse('2026-11-09T12:00:00Z')), null);
igual('d7 no si la bienvenida no salió (sale la bienvenida)', correoQueToca(con({}), '2026-11-09', 12, Date.parse('2026-11-09T12:00:00Z')), 'bienvenida');
// Víspera y día 1.
igual('d1', correoQueToca(con(bOk), '2026-11-15', 10, Date.parse('2026-11-15T10:00:00Z')), 'd1');
igual('d0 a las 7', correoQueToca(con(bOk), '2026-11-16', 7, Date.parse('2026-11-16T07:00:00Z')), 'd0');
igual('d0 no a las 6', correoQueToca(con(bOk), '2026-11-16', 6, Date.parse('2026-11-16T06:00:00Z')), null);
igual('d0 recupera al día siguiente', correoQueToca(con(bOk), '2026-11-17', 3, Date.parse('2026-11-17T03:00:00Z')), 'd0');
igual('d0 no al tercer día', correoQueToca(con(bOk), '2026-11-19', 12, Date.parse('2026-11-19T12:00:00Z')), null);
igual('baja: nada', correoQueToca(Object.assign(con(bOk), { baja: true }), '2026-11-16', 9, Date.parse('2026-11-16T09:00:00Z')), null);
igual('tres fallos: se deja', correoQueToca(con({ bienvenida: { ok: true, en: '2026-10-26T20:00:00Z' }, d1: { ok: false, intentos: 3 } }), '2026-11-15', 12, Date.parse('2026-11-15T12:00:00Z')), null);
igual('sin configurar no gasta intentos', anotar(con({}), 'd1', { ok: false, motivo: 'sin_configurar' }, 'x').intentos, 0);
igual('un fallo real gasta un intento', anotar(con({}), 'd1', { ok: false, motivo: 'brevo_400' }, 'x').intentos, 1);

// Contenido: sin segunda persona del plural peninsular, sin profesión regulada, con baja.
var prohibidas = [/vosotros/i, /\bos\b/, /empezáis|tenéis|podéis|apuntaos/i, /nutrici/i, /dieta(?!s ni)/i, /dietista/i];
TIPOS.forEach(function (t) {
  ['2026-10-26', '2026-11-09', '2026-11-15', '2026-11-16'].forEach(function (hoy) {
    var m = componer(t, 'a'.repeat(24), base, hoy);
    var todo = m.asunto + ' ' + m.texto;
    prohibidas.forEach(function (re) { if (re.test(todo)) { fallos.push(t + ' ' + hoy + ' contiene ' + re); } });
    if (m.texto.indexOf('/.netlify/functions/baja?i=') === -1) { fallos.push(t + ' sin enlace de baja'); }
    if (/undefined|null|NaN/.test(todo)) { fallos.push(t + ' ' + hoy + ' tiene un hueco sin rellenar'); }
    bien = bien + 1;
  });
});
igual('asunto con dorsal', componer('bienvenida', 'a'.repeat(24), base, '2026-10-26').asunto, 'Dentro, Ana. Tu dorsal es el 07');
igual('bienvenida a 1 día lleva el enlace a la app', componer('bienvenida', 'a'.repeat(24), base, '2026-11-15').texto.indexOf('Entrar en Lock21') !== -1, true);

igual('d7 no pide compartir a quien ya compartió', componer('d7', 'a'.repeat(24), Object.assign({}, base, { compartidos: 2 }), '2026-11-09').texto.indexOf('Compartir mi dorsal'), -1);
igual('d7 sí lo pide a quien no', componer('d7', 'a'.repeat(24), base, '2026-11-09').texto.indexOf('Compartir mi dorsal') !== -1, true);

// Inscripciones.
igual('nombre de correo', nombreDeCorreo('maria.perez93@gmail.com'), 'Maria');
igual('nombre de correo con números delante', nombreDeCorreo('93@x.com'), '');
igual('grupo pedido válido', grupoPedido('2026-10-26', '2026-11-30'), '2026-11-30');
igual('grupo pedido fuera de los elegibles', grupoPedido('2026-10-26', '2026-12-14'), '2026-11-16');
igual('código nuevo válido', codigoValido(codigoNuevo()), true);
igual('código con letras ambiguas no vale', codigoValido('ABCDE0'), false);
igual('mismo correo, mismo id', idDe(' Ana@Ejemplo.com '), idDe('ana@ejemplo.com'));

if (fallos.length) {
  console.error('Correos: ' + fallos.length + ' fallos\n' + fallos.join('\n'));
  process.exit(1);
}
console.log('Correos: ' + bien + ' comprobaciones bien');
