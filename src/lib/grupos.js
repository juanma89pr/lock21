// Calendario de grupos: el primero en config.grupos.primero y después uno cada
// config.grupos.cadaDias días. Todo trabaja con fechas 'AAAA-MM-DD' en la zona
// Atlantic/Canary y aritmética de calendario en UTC, así el cambio de hora no
// mueve ningún día. Lo usan la landing, la app y las funciones del servidor.
import config from '../config.js';

var MS_DIA = 86400000;
var G = config.grupos;
var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
var MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
var DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

// Fecha 'AAAA-MM-DD' de un instante en una zona horaria.
export function fechaEnZona(instante, zona) {
  var partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: zona || G.zona,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(instante || new Date());
  var datos = {};
  partes.forEach(function (p) { datos[p.type] = p.value; });
  return datos.year + '-' + datos.month + '-' + datos.day;
}

export function aUtc(fecha) {
  var t = String(fecha).split('-');
  return Date.UTC(parseInt(t[0], 10), parseInt(t[1], 10) - 1, parseInt(t[2], 10));
}

function deUtc(ms) {
  var d = new Date(ms);
  var m = d.getUTCMonth() + 1;
  var dia = d.getUTCDate();
  return d.getUTCFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dia < 10 ? '0' : '') + dia;
}

// Días de calendario entre dos fechas (b - a).
export function diasEntre(a, b) {
  return Math.round((aUtc(b) - aUtc(a)) / MS_DIA);
}

export function sumarDias(fecha, n) {
  return deUtc(aUtc(fecha) + n * MS_DIA);
}

// 0 = domingo ... 6 = sábado.
export function diaSemanaDe(fecha) {
  return new Date(aUtc(fecha)).getUTCDay();
}

export function fechaGrupo(indice) {
  return sumarDias(G.primero, indice * G.cadaDias);
}

// true si la fecha es el inicio de un grupo del calendario (descarta valores
// antiguos como '2026-12-01', del grupo único previo).
export function esGrupoValido(fecha) {
  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) { return false; }
  if (deUtc(aUtc(fecha)) !== fecha) { return false; }
  var d = diasEntre(G.primero, fecha);
  return d >= 0 && d % G.cadaDias === 0;
}

// Los próximos n grupos que empiezan después de hoy (el que empieza hoy ya está en marcha).
export function proximosGrupos(hoy, n) {
  var d = diasEntre(G.primero, hoy);
  var k = d < 0 ? 0 : Math.floor(d / G.cadaDias) + 1;
  var lista = [];
  for (var i = 0; i < (n || 1); i++) { lista.push(fechaGrupo(k + i)); }
  return lista;
}

export function proximoGrupo(hoy) {
  return proximosGrupos(hoy || fechaEnZona(new Date()), 1)[0];
}

// Grupos que se pueden elegir: los primeros 'cuantos' con plazas libres.
// ocupacion: { 'AAAA-MM-DD': personas }. Devuelve [{ fecha, libres }].
export function opcionesGrupo(hoy, ocupacion, cuantos, plazas) {
  var tope = plazas || G.plazas;
  var lista = [];
  var candidatos = proximosGrupos(hoy, 26);
  for (var i = 0; i < candidatos.length && lista.length < (cuantos || G.elegibles); i++) {
    var usadas = (ocupacion && ocupacion[candidatos[i]]) || 0;
    if (usadas < tope) { lista.push({ fecha: candidatos[i], libres: tope - usadas }); }
  }
  return lista;
}

// Grupo asignado al inscribirse: el preferido si está entre las opciones con plazas;
// si no (lleno, pasado o no indicado), el primero con plazas.
export function asignarGrupo(hoy, ocupacion, preferido, plazas) {
  var opciones = opcionesGrupo(hoy, ocupacion, G.elegibles, plazas);
  for (var i = 0; i < opciones.length; i++) {
    if (opciones[i].fecha === preferido) { return preferido; }
  }
  return opciones.length ? opciones[0].fecha : null;
}

// 'lunes 16 de noviembre' (con el año si no es el de 'hoy').
export function fechaLarga(fecha, hoy) {
  var t = fecha.split('-');
  var texto = DIAS_SEMANA[diaSemanaDe(fecha)] + ' ' + parseInt(t[2], 10) + ' de ' + MESES[parseInt(t[1], 10) - 1];
  var referencia = hoy || fechaEnZona(new Date());
  if (referencia.slice(0, 4) !== t[0]) { texto = texto + ' de ' + t[0]; }
  return texto;
}

// '16 nov'
export function fechaCorta(fecha) {
  var t = fecha.split('-');
  return parseInt(t[2], 10) + ' ' + MESES_CORTOS[parseInt(t[1], 10) - 1];
}
