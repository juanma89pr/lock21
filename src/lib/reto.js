// Lógica del reto compartida por la app y las funciones del servidor.
// El día del reto lo decide el servidor (zona Atlantic/Canary); la app usa
// estas mismas funciones solo para pintar mientras llega la respuesta.
import config from '../config.js';
import { buscarHabito } from '../datos/habitos.js';

var MS_DIA = 86400000;
var DURACION = config.grupo.duracion;

// Fecha 'AAAA-MM-DD' de un instante en una zona horaria.
export function fechaEnZona(instante, zona) {
  var partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: zona || config.grupo.zona,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(instante || new Date());
  var datos = {};
  partes.forEach(function (p) { datos[p.type] = p.value; });
  return datos.year + '-' + datos.month + '-' + datos.day;
}

function aUtc(fecha) {
  var t = fecha.split('-');
  return Date.UTC(parseInt(t[0], 10), parseInt(t[1], 10) - 1, parseInt(t[2], 10));
}

// Día del reto para una fecha local: 1 el día de inicio, 0 o menos antes.
export function diaParaFecha(fecha) {
  return Math.round((aUtc(fecha) - aUtc(config.grupo.inicio)) / MS_DIA) + 1;
}

// Estado completo del reto en un instante.
export function estadoReto(instante) {
  var hoy = fechaEnZona(instante || new Date(), config.grupo.zona);
  var dia = diaParaFecha(hoy);
  var fase = 'curso';
  if (dia < 1) { fase = 'antes'; }
  if (dia > DURACION) { fase = 'fin'; }
  return {
    hoy: hoy,
    dia: dia,
    fase: fase,
    diasHastaInicio: dia < 1 ? 1 - dia : 0,
    duracion: DURACION,
    zona: config.grupo.zona,
    inicio: config.grupo.inicio
  };
}

export function diaSemana(n) {
  return (config.grupo.diaSemanaInicio + n - 1 + 7 * 10) % 7;
}

export function toca(habito, n) {
  if (!habito || habito.dias === 'todos') { return true; }
  return habito.dias.indexOf(diaSemana(n)) !== -1;
}

// Racha con la regla "nunca dos fallos seguidos": un fallo suelto se perdona,
// el segundo seguido (entre días en los que toca) la pone a cero.
// checkins: objeto { '1': { hecho: true }, ... }. diaActual: día del reto hoy.
export function calcularRacha(habitoId, checkins, diaActual) {
  var habito = buscarHabito(habitoId);
  var lista = checkins || {};
  var tope = Math.min(diaActual, DURACION);
  var racha = 0;
  var mejor = 0;
  var hechos = 0;
  var programados = 0;
  var seguidos = 0;
  var perdonados = 0;
  var estados = [];
  for (var n = 1; n <= DURACION; n++) {
    if (n > tope) { estados.push({ dia: n, estado: toca(habito, n) ? 'futuro' : 'libre' }); continue; }
    if (!toca(habito, n)) { estados.push({ dia: n, estado: 'libre' }); continue; }
    var c = lista[String(n)];
    if (!c && n === diaActual) { estados.push({ dia: n, estado: 'pendiente' }); continue; }
    programados = programados + 1;
    if (c && c.hecho) {
      hechos = hechos + 1;
      racha = racha + 1;
      seguidos = 0;
      estados.push({ dia: n, estado: 'hecho' });
    } else {
      seguidos = seguidos + 1;
      if (seguidos >= 2) {
        racha = 0;
        estados.push({ dia: n, estado: c ? 'fallo' : 'vacio' });
      } else {
        perdonados = perdonados + 1;
        estados.push({ dia: n, estado: c ? 'perdonado' : 'vacio-perdonado' });
      }
    }
    if (racha > mejor) { mejor = racha; }
  }
  return {
    racha: racha,
    mejor: mejor,
    hechos: hechos,
    programados: programados,
    perdonados: perdonados,
    // El fallo de ayer está perdonado: hoy no se puede fallar.
    alerta: seguidos === 1,
    adherencia: programados ? Math.round((hechos / programados) * 100) : 0,
    estados: estados
  };
}

// Test SRBAI (Gardner, Abraham, Lally y de Bruijn, 2012): 4 ítems, escala 1 a 7.
export var SRBAI_ITEMS = [
  'lo hago automáticamente.',
  'lo hago sin tener que acordarme a propósito.',
  'lo hago sin pensarlo.',
  'empiezo a hacerlo antes de darme cuenta de que lo estoy haciendo.'
];
export var SRBAI_DIAS = [0, 7, 21];

export function mediaSrbai(respuestas) {
  if (!respuestas || respuestas.length !== 4) { return null; }
  var suma = 0;
  for (var i = 0; i < 4; i++) {
    var v = Number(respuestas[i]);
    if (!(v >= 1 && v <= 7) || Math.round(v) !== v) { return null; }
    suma = suma + v;
  }
  return Math.round((suma / 4) * 100) / 100;
}

// Qué test toca hacer según el día (null si ninguno está abierto).
// Día 0: antes del inicio o el día 1. Día 7: del 7 al 13. Día 21: del 21 en adelante.
export function testAbierto(dia, hechos) {
  var ya = hechos || {};
  if (!ya['0'] && dia <= 1) { return 0; }
  if (!ya['7'] && dia >= 7 && dia <= 13) { return 7; }
  if (!ya['21'] && dia >= DURACION) { return 21; }
  return null;
}

export function formatoNumero(n) {
  if (n === null || n === undefined) { return '—'; }
  return String(n).replace('.', ',');
}
