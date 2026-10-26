// Lee las plazas pedidas que se quedaron solo en Netlify Forms (antes del 26 oct 2026) a partir
// del CSV que se descarga en Netlify → Forms → lista-espera, o de líneas «Nombre, correo».
import HABITOS from '../../src/datos/habitos.js';

// Separa un CSV respetando comillas («"Pérez, Ana"»).
export function filasCsv(texto) {
  var filas = [];
  var fila = [];
  var celda = '';
  var entreComillas = false;
  var t = String(texto || '').replace(/^﻿/, '');
  for (var i = 0; i < t.length; i++) {
    var c = t.charAt(i);
    if (entreComillas) {
      if (c === '"' && t.charAt(i + 1) === '"') { celda = celda + '"'; i = i + 1; }
      else if (c === '"') { entreComillas = false; }
      else { celda = celda + c; }
    } else if (c === '"') { entreComillas = true; }
    else if (c === ',' || c === ';' || c === '\t') { fila.push(celda.trim()); celda = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t.charAt(i + 1) === '\n') { i = i + 1; }
      fila.push(celda.trim()); celda = '';
      if (fila.join('') !== '') { filas.push(fila); }
      fila = [];
    } else { celda = celda + c; }
  }
  fila.push(celda.trim());
  if (fila.join('') !== '') { filas.push(fila); }
  return filas;
}

function normal(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

export function habitoDe(texto) {
  var n = normal(texto);
  var encontrado = null;
  HABITOS.forEach(function (h) {
    if (!encontrado && (normal(h.id) === n || normal(h.nombre) === n || normal(h.corto) === n)) { encontrado = h.id; }
  });
  return encontrado;
}

var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// → [{ nombre, email, habito, grupo, acompanamiento, fecha }] sin repetidos, de la más antigua a la más nueva.
export function plazasDeTexto(texto) {
  var filas = filasCsv(texto);
  if (!filas.length) { return []; }
  var cab = filas[0].map(normal);
  var tieneCabecera = cab.some(function (c) { return c === 'email' || c === 'correo' || c === 'e mail'; });
  function col(nombres) {
    for (var i = 0; i < cab.length; i++) { if (nombres.indexOf(cab[i]) !== -1) { return i; } }
    return -1;
  }
  var iNombre = tieneCabecera ? col(['nombre', 'name', 'tu nombre']) : 0;
  var iEmail = tieneCabecera ? col(['email', 'correo', 'e mail', 'tu correo']) : -1;
  var iHabito = tieneCabecera ? col(['habito', 'el habito que vas a trabajar']) : -1;
  var iGrupo = tieneCabecera ? col(['grupo']) : -1;
  var iAcomp = tieneCabecera ? col(['acompanamiento', 'entrenador']) : -1;
  var iFecha = tieneCabecera ? col(['created at', 'created_at', 'fecha', 'date']) : -1;
  var vistas = {};
  var lista = [];
  filas.slice(tieneCabecera ? 1 : 0).forEach(function (f) {
    var email = '';
    if (iEmail !== -1) { email = f[iEmail] || ''; }
    else { f.forEach(function (c) { if (!email && EMAIL.test(c)) { email = c; } }); }
    email = String(email).trim().toLowerCase();
    if (!EMAIL.test(email) || vistas[email]) { return; }
    vistas[email] = true;
    var nombre = iNombre !== -1 ? f[iNombre] : '';
    if (EMAIL.test(nombre || '')) { nombre = ''; }
    lista.push({
      nombre: String(nombre || '').slice(0, 60),
      email: email,
      habito: iHabito !== -1 ? habitoDe(f[iHabito]) : null,
      grupo: iGrupo !== -1 ? String(f[iGrupo] || '').slice(0, 10) : '',
      acompanamiento: iAcomp !== -1 ? /^(si|sí|true|yes|on)$/i.test(String(f[iAcomp] || '').trim()) : false,
      fecha: iFecha !== -1 ? String(f[iFecha] || '') : ''
    });
  });
  lista.sort(function (a, b) { return String(a.fecha).localeCompare(String(b.fecha)); });
  return lista;
}
