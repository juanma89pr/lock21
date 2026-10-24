// GET: estado del reto calculado en el servidor (zona Atlantic/Canary). Sin sesión, el del
// próximo grupo; con sesión, el del grupo de la persona (y se le asigna uno si no lo tiene).
// POST { tipo: 'calentamiento' }: marca hecha la misión de calentamiento de hoy (solo antes
// de que empiece su grupo; no cuenta para el reto ni para la racha).
// POST { tipo: 'diario', ... }: guarda el check-in del día y devuelve la respuesta del coach.
// POST { tipo: 'srbai', dia, respuestas }: guarda el test de automaticidad (días 0, 7 y 21).
import { json, leerJson, recortar, entero } from '../lib/http.js';
import { verificarUsuario, tokenDeCabecera } from '../lib/auth.js';
import { obtenerDb, leerUsuario } from '../lib/admin.js';
import { grupoDePersona } from '../lib/grupos.js';
import { llamarClaude, clasificarEntrada, MODELO_RAPIDO } from '../lib/claude.js';
import { SISTEMA_CHECKIN, ESQUEMA_CHECKIN } from '../lib/prompts.js';
import { avisarRiesgo } from '../lib/avisos.js';
import { estadoReto, calcularRacha, toca, mediaSrbai, testAbierto } from '../../src/lib/reto.js';
import { filtroSalida, TEXTO_RIESGO, TEXTO_DERIVAR, TEXTO_SUSTANCIAS } from '../../src/lib/guardarrailes.js';
import { respaldoCheckin } from '../../src/lib/respaldo.js';
import HABITOS, { buscarHabito } from '../../src/datos/habitos.js';
import { misionDelDia } from '../../src/datos/calentamiento.js';

function habitoValido(id) {
  var ok = false;
  HABITOS.forEach(function (h) { if (h.id === id) { ok = true; } });
  return ok;
}

// Perfil: el de Firestore manda; si no hay Firestore, el que manda la app.
function mezclarPerfil(guardado, enviado) {
  var p = Object.assign({}, enviado || {}, guardado || {});
  return {
    habito: habitoValido(p.habito) ? p.habito : null,
    senal: recortar(p.senal, 160),
    accion: recortar(p.accion, 160),
    minima: recortar(p.minima, 160)
  };
}

function historialDeApp(lista) {
  var out = {};
  if (!Array.isArray(lista)) { return out; }
  lista.slice(0, 30).forEach(function (c) {
    var d = entero(c && c.dia, 1, 21);
    if (d) { out[String(d)] = { hecho: c.hecho === true }; }
  });
  return out;
}

function textoUsuario(seudonimo, perfil, estado, entrada, racha, previos, falloAyer) {
  var habito = buscarHabito(perfil.habito);
  var lineas = [
    'Participante: ' + seudonimo,
    'Hábito: ' + habito.nombre,
    'Señal: después de "' + (perfil.senal || habito.senal) + '", hace "' + (perfil.accion || habito.accion) + '"',
    'Versión mínima de 2 minutos: ' + (perfil.minima || 'sin definir'),
    'Día del reto: ' + estado.dia + ' de ' + estado.duracion,
    'Hoy le tocaba: ' + (toca(habito, estado.dia, estado.grupo) ? 'sí' : 'no (día libre en su plan)'),
    'Lo hizo hoy: ' + (entrada.hecho ? 'sí' : 'no'),
    'Le salió sin pensarlo: ' + (entrada.sinPensar ? 'sí' : 'no'),
    'Ánimo (1-5): ' + entrada.animo,
    'Sueño (1-5): ' + entrada.sueno,
    'Racha actual: ' + racha.racha + ' (mejor: ' + racha.mejor + '). Adherencia: ' + racha.adherencia + ' %.',
    'El día anterior que le tocaba fue un fallo: ' + (falloAyer ? 'sí' : 'no'),
    'Mañana no puede fallar (regla nunca dos seguidos): ' + (racha.alerta ? 'sí' : 'no'),
    'Últimos días: ' + (previos || 'sin datos')
  ];
  if (entrada.nota) { lineas.push('Nota de la persona:\n"""\n' + entrada.nota + '\n"""'); }
  return lineas.join('\n');
}

async function respuestaCoach(contexto) {
  var r = await llamarClaude({
    modelo: MODELO_RAPIDO,
    sistema: SISTEMA_CHECKIN,
    mensajes: [{ role: 'user', content: contexto.texto }],
    maxTokens: 300,
    esquema: ESQUEMA_CHECKIN
  });
  if (!r || !r.datos) { return null; }
  var d = r.datos;
  var mensaje = recortar(d.mensaje, 600);
  var tarea = recortar(d.tareaManana, 200);
  if (!mensaje || !tarea) { return null; }
  // Capa 3: filtro de salida.
  if (!filtroSalida(mensaje).ok || !filtroSalida(tarea).ok) {
    console.warn('checkin: salida bloqueada por el filtro');
    return null;
  }
  var nivel = String(d.nivel || 'normal').toLowerCase();
  if (['minimo', 'normal', 'subir'].indexOf(nivel) === -1) { nivel = 'normal'; }
  return { mensaje: mensaje, tareaManana: tarea, nivel: nivel, derivar: d.derivar === true, fuente: 'ia' };
}

async function diario(usuario, datos, estado, fire, guardado) {
  if (estado.fase !== 'curso') {
    return json(409, { error: estado.fase === 'antes' ? 'reto_no_empezado' : 'reto_terminado', estado: estado });
  }
  var animo = entero(datos.animo, 1, 5);
  var sueno = entero(datos.sueno, 1, 5);
  if (typeof datos.hecho !== 'boolean' || !animo || !sueno) { return json(400, { error: 'datos_incompletos' }); }
  var entrada = {
    hecho: datos.hecho,
    animo: animo,
    sueno: sueno,
    sinPensar: datos.sinPensar === true,
    nota: recortar(datos.nota, 500)
  };

  var perfil = mezclarPerfil(guardado && guardado.perfil, datos.perfil);
  if (!perfil.habito) { return json(409, { error: 'sin_habito' }); }
  var checkins = guardado ? guardado.checkins : historialDeApp(datos.historial);
  checkins = Object.assign({}, checkins);
  delete checkins[String(estado.dia)];
  // Antes de sumar hoy: ¿ayer ya fue un fallo?
  var falloAyer = calcularRacha(perfil.habito, checkins, estado.dia, estado.grupo).alerta;
  checkins[String(estado.dia)] = { hecho: entrada.hecho };
  var racha = calcularRacha(perfil.habito, checkins, estado.dia, estado.grupo);
  var previos = racha.estados.filter(function (e) { return e.dia < estado.dia && e.dia >= estado.dia - 3; })
    .map(function (e) { return 'día ' + e.dia + ': ' + e.estado; }).join(', ');

  var coach = null;
  var categoria = entrada.nota ? await clasificarEntrada(entrada.nota) : 'ok';
  var base = respaldoCheckin(entrada.hecho, falloAyer, estado.dia);
  if (categoria === 'riesgo') {
    coach = { mensaje: TEXTO_RIESGO, tareaManana: 'Habla hoy con alguien de confianza.', nivel: 'minimo', derivar: true, fuente: 'riesgo' };
    await avisarRiesgo(fire, usuario.uid, 'nota del check-in');
  } else if (categoria === 'sustancias') {
    coach = { mensaje: TEXTO_SUSTANCIAS, tareaManana: base.tareaManana, nivel: base.nivel, derivar: true, fuente: 'filtro' };
  } else if (categoria === 'derivar') {
    coach = { mensaje: TEXTO_DERIVAR, tareaManana: base.tareaManana, nivel: base.nivel, derivar: true, fuente: 'filtro' };
  } else {
    coach = await respuestaCoach({
      texto: textoUsuario('P-' + usuario.uid.slice(0, 6), perfil, estado, entrada, racha, previos, falloAyer)
    });
    if (!coach) { coach = base; }
  }

  var registro = {
    dia: estado.dia,
    fecha: estado.hoy,
    grupo: estado.grupo,
    hecho: entrada.hecho,
    animo: entrada.animo,
    sueno: entrada.sueno,
    sinPensar: entrada.sinPensar,
    nota: entrada.nota,
    coach: coach,
    actualizado: new Date().toISOString()
  };
  var seGuardo = false;
  if (fire) {
    var ref = fire.db.collection('usuarios').doc(usuario.uid);
    await ref.collection('checkins').doc(String(estado.dia)).set(registro, { merge: true });
    await ref.set({ ultimoCheckin: estado.hoy, racha: racha.racha, adherencia: racha.adherencia }, { merge: true });
    seGuardo = true;
  }
  return json(200, { ok: true, guardado: seGuardo, estado: estado, checkin: registro, racha: { racha: racha.racha, mejor: racha.mejor, adherencia: racha.adherencia, alerta: racha.alerta } });
}

async function srbai(usuario, datos, estado, fire) {
  var dia = entero(datos.dia, 0, 21);
  if (dia === null || [0, 7, 21].indexOf(dia) === -1) { return json(400, { error: 'dia_invalido' }); }
  var respuestas = Array.isArray(datos.respuestas) ? datos.respuestas.map(Number) : [];
  var media = mediaSrbai(respuestas);
  if (media === null) { return json(400, { error: 'respuestas_invalidas' }); }

  var hechos = {};
  var ref = null;
  if (fire) {
    ref = fire.db.collection('usuarios').doc(usuario.uid);
    var previos = await ref.collection('srbai').get();
    previos.forEach(function (d) { hechos[d.id] = true; });
  }
  // El día 0 se puede repetir hasta que empieza el reto; los demás, solo en su ventana.
  var abierto = testAbierto(estado.dia, hechos);
  var repetirCero = dia === 0 && estado.dia <= 1;
  if (abierto !== dia && !repetirCero) { return json(409, { error: 'test_cerrado', estado: estado }); }

  var registro = { dia: dia, respuestas: respuestas, media: media, fecha: estado.hoy, actualizado: new Date().toISOString() };
  if (ref) {
    await ref.collection('srbai').doc(String(dia)).set(registro, { merge: true });
  }
  return json(200, { ok: true, guardado: Boolean(ref), estado: estado, srbai: registro });
}

// Calentamiento: una misión al día mientras se espera al inicio del grupo.
// Se guarda en el documento del usuario: calentamiento: { 'AAAA-MM-DD': { mision, fecha } }.
async function calentamiento(usuario, datos, estado, fire, guardado) {
  if (estado.fase !== 'antes') { return json(409, { error: 'reto_empezado', estado: estado }); }
  var perfil = Object.assign({}, datos.perfil || {}, (guardado && guardado.perfil) || {});
  if (!perfil.habito) { return json(409, { error: 'sin_habito' }); }
  var mision = misionDelDia(perfil, estado.hoy);
  var marca = { mision: mision.id, fecha: new Date().toISOString() };
  var hechos = Object.assign({}, perfil.calentamiento || {});
  hechos[estado.hoy] = marca;
  if (fire) {
    var cambio = { calentamiento: {} };
    cambio.calentamiento[estado.hoy] = marca;
    await fire.db.collection('usuarios').doc(usuario.uid).set(cambio, { merge: true });
  }
  return json(200, { ok: true, guardado: Boolean(fire), estado: estado, calentamiento: hechos, dias: Object.keys(hechos).length });
}

export default async function handler(req) {
  if (req.method !== 'GET' && req.method !== 'POST') { return json(405, { error: 'metodo' }); }
  if (req.method === 'GET' && !tokenDeCabecera(req)) { return json(200, { estado: estadoReto(new Date(), null) }); }

  var acceso = await verificarUsuario(req);
  if (acceso.error) { return acceso.error; }
  var datos = {};
  if (req.method === 'POST') {
    var cuerpo = await leerJson(req, 8000);
    if (cuerpo.error) { return json(400, { error: cuerpo.error }); }
    datos = cuerpo.datos;
  }
  var fire = await obtenerDb();

  try {
    var guardado = await leerUsuario(fire, acceso.usuario.uid);
    // El día del reto depende del grupo de la persona (sin Firestore, el que manda la app).
    var perfil = guardado ? guardado.perfil : (datos.perfil || {});
    var g = await grupoDePersona(fire, acceso.usuario, perfil);
    var estado = g.estado;
    if (req.method === 'GET') { return json(200, { estado: estado, grupo: g.grupo, asignadoAhora: g.asignadoAhora }); }
    if (datos.tipo === 'srbai') { return await srbai(acceso.usuario, datos, estado, fire); }
    if (datos.tipo === 'calentamiento') { return await calentamiento(acceso.usuario, datos, estado, fire, guardado); }
    return await diario(acceso.usuario, datos, estado, fire, guardado);
  } catch (e) {
    console.error('checkin: error', e && e.message);
    return json(500, { error: 'interno' });
  }
}
