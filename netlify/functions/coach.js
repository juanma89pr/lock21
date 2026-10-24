// Chat opcional con el coach. POST { mensaje, historial? }.
// Límite: 20 mensajes por persona y día (Netlify Blobs; si no está, Firestore).
// Tres capas: filtro previo + moderación, prompt de sistema, filtro de salida.
import { getStore } from '@netlify/blobs';
import { json, leerJson, recortar } from '../lib/http.js';
import { verificarUsuario } from '../lib/auth.js';
import { obtenerDb, leerUsuario, leerChatReciente } from '../lib/admin.js';
import { grupoDePersona } from '../lib/grupos.js';
import { llamarClaude, clasificarEntrada, MODELO_CHAT } from '../lib/claude.js';
import { SISTEMA_CHAT } from '../lib/prompts.js';
import { avisarRiesgo } from '../lib/avisos.js';
import { calcularRacha } from '../../src/lib/reto.js';
import { filtroSalida, TEXTO_RIESGO, TEXTO_DERIVAR } from '../../src/lib/guardarrailes.js';
import { respaldoChat } from '../../src/lib/respaldo.js';
import { buscarHabito } from '../../src/datos/habitos.js';

var LIMITE_DIA = parseInt(process.env.COACH_LIMITE_DIA || '20', 10);
var MAX_TOKENS = 350;

// Suma un uso y devuelve cuántos quedan (o -1 si ya no quedan).
async function sumarUso(uid, hoy, fire) {
  var clave = uid + '/' + hoy;
  try {
    var store = getStore('cuota-coach');
    var actual = parseInt((await store.get(clave)) || '0', 10) || 0;
    if (actual >= LIMITE_DIA) { return -1; }
    await store.set(clave, String(actual + 1));
    return LIMITE_DIA - actual - 1;
  } catch (e) {
    if (!fire) { return LIMITE_DIA; }
    var ref = fire.db.collection('usuarios').doc(uid).collection('cuota').doc(hoy);
    var doc = await ref.get();
    var n = doc.exists ? (doc.data().n || 0) : 0;
    if (n >= LIMITE_DIA) { return -1; }
    await ref.set({ n: n + 1 }, { merge: true });
    return LIMITE_DIA - n - 1;
  }
}

function contexto(perfil, estado, racha) {
  var habito = buscarHabito(perfil.habito);
  return [
    'Contexto (no lo repitas literal):',
    'Hábito: ' + habito.nombre + '. Señal: después de "' + recortar(perfil.senal || habito.senal, 160) + '", "' + recortar(perfil.accion || habito.accion, 160) + '". Versión mínima: ' + recortar(perfil.minima || 'sin definir', 160) + '.',
    'Día del reto: ' + (estado.fase === 'antes' ? 'aún no ha empezado (faltan ' + estado.diasHastaInicio + ' días)' : estado.dia + ' de ' + estado.duracion) + '.',
    racha ? 'Racha: ' + racha.racha + '. Adherencia: ' + racha.adherencia + ' %.' : ''
  ].join('\n');
}

async function guardarTurnos(fire, uid, turnos) {
  if (!fire) { return; }
  var col = fire.db.collection('usuarios').doc(uid).collection('chat');
  var base = Date.now();
  for (var i = 0; i < turnos.length; i++) {
    // Se borra a los 90 días (política de privacidad); 'caduca' sirve para la TTL de Firestore.
    var t = Object.assign({}, turnos[i], { fecha: new Date(base + i).toISOString(), caduca: new Date(base + 90 * 86400000) });
    await col.doc().set(t, { merge: true });
  }
}

export default async function handler(req) {
  if (req.method !== 'POST') { return json(405, { error: 'metodo' }); }
  var acceso = await verificarUsuario(req);
  if (acceso.error) { return acceso.error; }
  var uid = acceso.usuario.uid;
  var cuerpo = await leerJson(req, 6000);
  if (cuerpo.error) { return json(400, { error: cuerpo.error }); }
  var mensaje = recortar(cuerpo.datos.mensaje, 800);
  if (!mensaje) { return json(400, { error: 'mensaje_vacio' }); }

  var fire = await obtenerDb();
  try {
    var guardado = await leerUsuario(fire, uid);
    var estado = (await grupoDePersona(fire, acceso.usuario, guardado ? guardado.perfil : (cuerpo.datos.perfil || {}))).estado;
    var quedan = await sumarUso(uid, estado.hoy, fire);
    if (quedan < 0) { return json(429, { error: 'limite_diario', limite: LIMITE_DIA }); }

    var respuesta = null;
    var fuente = 'ia';
    var derivar = false;
    var categoria = await clasificarEntrada(mensaje);
    if (categoria === 'riesgo') {
      respuesta = TEXTO_RIESGO;
      fuente = 'riesgo';
      derivar = true;
      await avisarRiesgo(fire, uid, 'chat del coach');
    } else if (categoria === 'derivar') {
      respuesta = TEXTO_DERIVAR;
      fuente = 'filtro';
      derivar = true;
    } else {
      var perfil = (guardado && guardado.perfil && guardado.perfil.habito) ? guardado.perfil : (cuerpo.datos.perfil || {});
      var racha = guardado && perfil.habito ? calcularRacha(perfil.habito, guardado.checkins, estado.dia, estado.grupo) : null;
      // Perfil compacto + últimos 6 turnos.
      var previos = fire ? await leerChatReciente(fire, uid, 6) : (Array.isArray(cuerpo.datos.historial) ? cuerpo.datos.historial.slice(-6) : []);
      var mensajes = [];
      previos.forEach(function (t) {
        var rol = t.rol === 'coach' ? 'assistant' : 'user';
        var texto = recortar(t.texto, 800);
        if (!texto) { return; }
        if (mensajes.length && mensajes[mensajes.length - 1].role === rol) {
          mensajes[mensajes.length - 1].content = mensajes[mensajes.length - 1].content + '\n' + texto;
        } else {
          mensajes.push({ role: rol, content: texto });
        }
      });
      if (mensajes.length && mensajes[0].role === 'assistant') { mensajes.shift(); }
      var actual = contexto(perfil, estado, racha) + '\n\nMensaje de la persona:\n"""\n' + mensaje + '\n"""';
      if (mensajes.length && mensajes[mensajes.length - 1].role === 'user') {
        mensajes[mensajes.length - 1].content = mensajes[mensajes.length - 1].content + '\n\n' + actual;
      } else {
        mensajes.push({ role: 'user', content: actual });
      }
      var r = await llamarClaude({ modelo: MODELO_CHAT, sistema: SISTEMA_CHAT, mensajes: mensajes, maxTokens: MAX_TOKENS });
      if (r && r.texto && filtroSalida(r.texto).ok) {
        respuesta = recortar(r.texto, 1500);
      } else {
        if (r && r.texto) { console.warn('coach: salida bloqueada por el filtro'); }
        respuesta = r && r.texto ? TEXTO_DERIVAR : respaldoChat(quedan);
        fuente = r && r.texto ? 'filtro' : 'respaldo';
      }
    }

    await guardarTurnos(fire, uid, [
      { rol: 'persona', texto: mensaje },
      { rol: 'coach', texto: respuesta, fuente: fuente }
    ]);
    return json(200, { ok: true, respuesta: respuesta, fuente: fuente, derivar: derivar, quedan: quedan, guardado: Boolean(fire) });
  } catch (e) {
    console.error('coach: error', e && e.message);
    return json(500, { error: 'interno' });
  }
}
