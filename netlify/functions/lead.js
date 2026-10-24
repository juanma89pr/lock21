// Crea un lead cuando la persona acepta, con su casilla separada, compartir su
// resumen con el entrenador. POST { acepto: true, version, texto }.
// Guarda versión y hash del texto aceptado; genera el resumen (IA o plantilla);
// avisa por correo si hay RESEND_API_KEY y, si no, lo deja en Firestore.
import { createHash } from 'node:crypto';
import { json, leerJson, recortar } from '../lib/http.js';
import { verificarUsuario } from '../lib/auth.js';
import { obtenerDb, leerUsuario } from '../lib/admin.js';
import { grupoDePersona } from '../lib/grupos.js';
import { llamarClaude, MODELO_CHAT } from '../lib/claude.js';
import { SISTEMA_RESUMEN } from '../lib/prompts.js';
import { enviarCorreo } from '../lib/avisos.js';
import { calcularRacha } from '../../src/lib/reto.js';
import { filtroSalida } from '../../src/lib/guardarrailes.js';
import { COMPARTIR } from '../../src/lib/consentimientos.js';
import { buscarHabito } from '../../src/datos/habitos.js';

function hash(texto) {
  return createHash('sha256').update(texto, 'utf8').digest('hex');
}

function resumenPlantilla(datos) {
  return [
    'Hábito: ' + datos.habito + '.',
    'Señal: ' + datos.senal + '.',
    'Adherencia ' + datos.adherencia + ' % (' + datos.hechos + ' de ' + datos.programados + ' días programados), mejor racha ' + datos.mejor + ', fallos perdonados ' + datos.perdonados + '.',
    'Test SRBAI: ' + datos.curva + '.',
    datos.notas ? 'Notas recientes: ' + datos.notas : ''
  ].join(' ').trim();
}

export default async function handler(req) {
  if (req.method !== 'POST') { return json(405, { error: 'metodo' }); }
  var acceso = await verificarUsuario(req);
  if (acceso.error) { return acceso.error; }
  var u = acceso.usuario;
  var cuerpo = await leerJson(req, 4000);
  if (cuerpo.error) { return json(400, { error: cuerpo.error }); }
  var d = cuerpo.datos;
  // Consentimiento explícito: casilla marcada y el texto exacto de la versión vigente.
  if (d.acepto !== true || d.version !== COMPARTIR.version || d.texto !== COMPARTIR.texto) {
    return json(400, { error: 'consentimiento_invalido', version: COMPARTIR.version });
  }

  var fire = await obtenerDb();
  try {
    var guardado = await leerUsuario(fire, u.uid);
    var perfil = (guardado && guardado.perfil) || {};
    var estado = (await grupoDePersona(fire, u, perfil)).estado;
    var habito = buscarHabito(perfil.habito);
    var racha = calcularRacha(perfil.habito, guardado ? guardado.checkins : {}, estado.dia, estado.grupo);
    var curva = [];
    var notas = [];
    if (fire) {
      var tests = await fire.db.collection('usuarios').doc(u.uid).collection('srbai').get();
      tests.forEach(function (t) { curva.push('día ' + t.id + ': ' + String(t.data().media).replace('.', ',')); });
      Object.keys(guardado.checkins).sort(function (a, b) { return Number(b) - Number(a); }).slice(0, 5).forEach(function (k) {
        var n = recortar(guardado.checkins[k].nota, 140);
        if (n) { notas.push('día ' + k + ': ' + n); }
      });
    }
    var datos = {
      habito: habito.nombre,
      senal: 'después de "' + recortar(perfil.senal || habito.senal, 160) + '", ' + recortar(perfil.accion || habito.accion, 160),
      adherencia: racha.adherencia,
      hechos: racha.hechos,
      programados: racha.programados,
      mejor: racha.mejor,
      perdonados: racha.perdonados,
      curva: curva.length ? curva.join(', ') : 'sin datos',
      notas: notas.join(' | ')
    };
    var resumen = resumenPlantilla(datos);
    var r = await llamarClaude({
      modelo: MODELO_CHAT,
      sistema: SISTEMA_RESUMEN,
      mensajes: [{ role: 'user', content: 'Datos del reto:\n' + JSON.stringify(datos) }],
      maxTokens: 350
    });
    var resumenIa = r && r.texto && filtroSalida(r.texto).ok ? recortar(r.texto, 1500) : '';

    var lead = {
      uid: u.uid,
      email: u.email,
      fecha: new Date().toISOString(),
      diaReto: estado.dia,
      grupo: estado.grupo,
      consentimiento: { version: COMPARTIR.version, hash: hash(COMPARTIR.texto), fecha: new Date().toISOString() },
      datos: datos,
      resumen: resumenIa || resumen,
      resumenFuente: resumenIa ? 'ia' : 'plantilla',
      estado: 'nuevo'
    };
    if (fire) {
      await fire.db.collection('leads').doc(u.uid).set(lead, { merge: true });
      await fire.db.collection('usuarios').doc(u.uid).set({ compartir: lead.consentimiento }, { merge: true });
    }
    var correo = await enviarCorreo('Lock21: nuevo lead (' + habito.corto + ')', [
      'Alguien ha terminado el reto y ha pedido que le contactes.',
      'Correo: ' + u.email,
      'Resumen: ' + lead.resumen,
      'Consentimiento ' + COMPARTIR.version + ' aceptado el ' + lead.fecha + '.'
    ]);
    if (!fire && !correo) {
      console.warn('lead: sin Firestore ni Resend; el lead solo queda en el registro de la función');
      console.log('lead', JSON.stringify({ email: u.email, habito: habito.nombre, adherencia: racha.adherencia }));
    }
    // Solo tras el consentimiento se revela el servicio premium (variable SERVICIO_PREMIUM).
    return json(200, {
      ok: true,
      guardado: Boolean(fire),
      correo: correo,
      servicio: process.env.SERVICIO_PREMIUM_NOMBRE || '',
      servicioUrl: process.env.SERVICIO_PREMIUM_URL || ''
    });
  } catch (e) {
    console.error('lead: error', e && e.message);
    return json(500, { error: 'interno' });
  }
}
