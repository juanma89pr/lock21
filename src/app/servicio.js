// Capa de datos de la app del reto. Dos implementaciones con la misma interfaz:
// - real: Firebase Auth (enlace por correo) + Netlify Functions para escribir +
//   lectura en tiempo real de Firestore. Mientras el servidor no tenga Firestore
//   (guardado: false), lo que devuelven las funciones se guarda en este navegador.
// - demo: todo en este navegador, sin cuenta ni IA. Sirve para enseñar la app y
//   para probarla antes de configurar Firebase (/app?demo=1).
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { obtenerAuth, obtenerDb } from '../lib/firebase.js';
import { estadoReto, calcularRacha, mediaSrbai, testAbierto, toca } from '../lib/reto.js';
import { esGrupoValido, fechaEnZona, opcionesGrupo, proximoGrupo, sumarDias } from '../lib/grupos.js';
import { misionDelDia } from '../datos/calentamiento.js';
import { respuestaFija, TEXTO_RIESGO } from '../lib/guardarrailes.js';
import { respaldoCheckin, respaldoChat } from '../lib/respaldo.js';
import { PRIVACIDAD, MAYOR_EDAD, AVISO_IA, COMPARTIR } from '../lib/consentimientos.js';
import { buscarHabito } from '../datos/habitos.js';
import config from '../config.js';

var CLAVE_EMAIL = 'lock21-email';

function leerLocal(clave) {
  try {
    var t = window.localStorage.getItem(clave);
    return t ? JSON.parse(t) : null;
  } catch (e) {
    return null;
  }
}

function guardarLocal(clave, valor) {
  try { window.localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) { /* sin almacenamiento */ }
}

function vacio() {
  return { perfil: {}, checkins: {}, srbai: {}, chat: [] };
}

// Pub-sub mínimo para avisar a React de los cambios.
function crearEmisor() {
  var oyentes = [];
  return {
    escuchar: function (f) {
      oyentes.push(f);
      return function () { oyentes = oyentes.filter(function (o) { return o !== f; }); };
    },
    emitir: function (valor) { oyentes.forEach(function (f) { f(valor); }); }
  };
}

// Mezcla los datos locales con los remotos: lo remoto manda cuando existe.
function mezclar(local, remoto) {
  return {
    perfil: Object.assign({}, local.perfil, remoto.perfil),
    checkins: Object.assign({}, local.checkins, remoto.checkins),
    srbai: Object.assign({}, local.srbai, remoto.srbai),
    chat: remoto.chat && remoto.chat.length ? remoto.chat : local.chat
  };
}

// Lo mínimo del perfil que necesitan las funciones cuando no hay Firestore.
function perfilMinimo(p) {
  var x = p || {};
  return { alta: x.alta, grupo: x.grupo, habito: x.habito, senal: x.senal, accion: x.accion, minima: x.minima, calentamiento: x.calentamiento };
}

// Opciones de grupo calculadas en el navegador (sin plazas reales) por si falla el servidor.
function opcionesLocales(ocupacion) {
  var hoy = fechaEnZona(new Date());
  return { hoy: hoy, plazas: config.grupos.plazas, opciones: opcionesGrupo(hoy, ocupacion || {}), exacto: false };
}

function historial(checkins) {
  return Object.keys(checkins).map(function (k) { return { dia: Number(k), hecho: checkins[k].hecho === true }; });
}

/* ---------------------------------------------------------------- real */

export function crearServicioReal() {
  var auth = obtenerAuth();
  var db = obtenerDb();
  var emisor = crearEmisor();
  var estado = { cargando: true, modo: 'real', usuario: null, datos: vacio(), reto: estadoReto(new Date(), null), remoto: false, errorEnlace: '' };
  var local = vacio();
  var remoto = vacio();
  var bajas = [];
  // Último estado del reto calculado por el servidor (manda sobre el cálculo local).
  var retoServidor = null;

  function retoActual(datos) {
    var g = datos.perfil.grupo;
    if (retoServidor && (!esGrupoValido(g) || retoServidor.grupo === g)) { return retoServidor; }
    return estadoReto(new Date(), g);
  }

  function claveCache() { return 'lock21-cache-' + (estado.usuario ? estado.usuario.uid : 'nadie'); }

  function publicar(cambios) {
    var datos = mezclar(local, remoto);
    estado = Object.assign({}, estado, cambios || {}, { datos: datos, reto: retoActual(datos) });
    emisor.emitir(estado);
  }

  function guardarCache() { guardarLocal(claveCache(), local); }

  function cancelarEscuchas() {
    bajas.forEach(function (f) { f(); });
    bajas = [];
  }

  function escucharFirestore(uid) {
    cancelarEscuchas();
    remoto = vacio();
    function error(e) { console.warn('Lock21: lectura de Firestore no disponible', e && e.code); }
    var ref = doc(db, 'usuarios', uid);
    bajas.push(onSnapshot(ref, function (s) {
      remoto.perfil = s.exists() ? s.data() : {};
      publicar({ remoto: s.exists() });
    }, error));
    ['checkins', 'srbai'].forEach(function (nombre) {
      bajas.push(onSnapshot(collection(db, 'usuarios', uid, nombre), function (q) {
        var mapa = {};
        q.forEach(function (d) { mapa[d.id] = d.data(); });
        remoto[nombre] = mapa;
        publicar();
      }, error));
    });
    bajas.push(onSnapshot(query(collection(db, 'usuarios', uid, 'chat'), orderBy('fecha', 'asc'), limit(60)), function (q) {
      var lista = [];
      q.forEach(function (d) { lista.push(d.data()); });
      remoto.chat = lista;
      publicar();
    }, error));
  }

  async function llamar(nombre, cuerpo) {
    var usuario = auth.currentUser;
    if (!usuario) { throw new Error('sin_sesion'); }
    var token = await usuario.getIdToken();
    var res = await fetch('/.netlify/functions/' + nombre, {
      method: cuerpo ? 'POST' : 'GET',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined
    });
    var datos = {};
    try { datos = await res.json(); } catch (e) { datos = {}; }
    if (datos.estado) { retoServidor = datos.estado; publicar(); }
    if (!res.ok) {
      var error = new Error(datos.error || ('estado_' + res.status));
      error.codigo = datos.error || ('estado_' + res.status);
      throw error;
    }
    return datos;
  }

  async function cargarReto() {
    try {
      var res = await fetch('/.netlify/functions/checkin');
      if (res.ok) {
        var d = await res.json();
        if (d.estado && !retoServidor) { retoServidor = d.estado; publicar(); }
      }
    } catch (e) { /* se queda con el cálculo local */ }
  }

  async function completarEnlace(email) {
    try {
      await signInWithEmailLink(auth, email, window.location.href);
      try { window.localStorage.removeItem(CLAVE_EMAIL); } catch (e) { /* nada */ }
      window.history.replaceState(null, '', window.location.pathname);
      publicar({ pideEmailEnlace: false, errorEnlace: '' });
    } catch (e) {
      publicar({ cargando: false, errorEnlace: 'El enlace ha caducado o ya se usó. Pide uno nuevo.' });
    }
  }

  return {
    iniciar: function () {
      cargarReto();
      if (isSignInWithEmailLink(auth, window.location.href)) {
        var email = leerLocal(CLAVE_EMAIL);
        if (email) { completarEnlace(email); } else { publicar({ pideEmailEnlace: true }); }
      }
      var bajaAuth = onAuthStateChanged(auth, function (u) {
        if (u) {
          estado.usuario = { uid: u.uid, email: u.email };
          local = Object.assign(vacio(), leerLocal(claveCache()) || {});
          escucharFirestore(u.uid);
          publicar({ cargando: false, usuario: estado.usuario });
          // Estado del reto de SU grupo (si se inscribió antes de los grupos, aquí se le asigna).
          llamar('checkin').catch(function () { /* se queda con el cálculo local */ });
        } else {
          cancelarEscuchas();
          local = vacio();
          remoto = vacio();
          retoServidor = null;
          publicar({ cargando: false, usuario: null });
        }
      });
      return function () { bajaAuth(); cancelarEscuchas(); };
    },
    escuchar: emisor.escuchar,
    actual: function () { return estado; },
    enviarEnlace: async function (email) {
      await sendSignInLinkToEmail(auth, email, { url: window.location.origin + '/app', handleCodeInApp: true });
      guardarLocal(CLAVE_EMAIL, email);
    },
    completarEnlace: completarEnlace,
    salir: function () { return signOut(auth); },
    opcionesGrupo: async function () {
      try {
        var res = await fetch('/.netlify/functions/perfil');
        if (!res.ok) { throw new Error('estado_' + res.status); }
        return await res.json();
      } catch (e) {
        return opcionesLocales();
      }
    },
    alta: async function (grupo) {
      var r = await llamar('perfil', {
        tipo: 'alta', mayorEdad: true, privacidad: true, avisoIa: true, grupo: grupo || null,
        versiones: { privacidad: PRIVACIDAD.version, edad: MAYOR_EDAD.version, ia: AVISO_IA.version }
      });
      local.perfil = Object.assign({}, local.perfil, r.perfil);
      guardarCache();
      publicar();
    },
    cambiarGrupo: async function (grupo) {
      var r = await llamar('perfil', { tipo: 'grupo', grupo: grupo, perfil: perfilMinimo(estado.datos.perfil) });
      local.perfil = Object.assign({}, local.perfil, r.perfil);
      guardarCache();
      publicar();
    },
    marcarCalentamiento: async function () {
      var r = await llamar('checkin', { tipo: 'calentamiento', perfil: perfilMinimo(estado.datos.perfil) });
      local.perfil = Object.assign({}, local.perfil, { calentamiento: r.calentamiento });
      guardarCache();
      publicar();
      return r;
    },
    guardarHabito: async function (datos) {
      var r = await llamar('perfil', Object.assign({ tipo: 'habito', perfil: perfilMinimo(estado.datos.perfil) }, datos));
      local.perfil = Object.assign({}, local.perfil, r.perfil);
      guardarCache();
      publicar();
    },
    enviarSrbai: async function (dia, respuestas) {
      var r = await llamar('checkin', { tipo: 'srbai', dia: dia, respuestas: respuestas, perfil: perfilMinimo(estado.datos.perfil) });
      local.srbai = Object.assign({}, local.srbai);
      local.srbai[String(dia)] = r.srbai;
      guardarCache();
      publicar();
      return r.srbai;
    },
    enviarCheckin: async function (datos) {
      var d = estado.datos;
      var r = await llamar('checkin', Object.assign({ tipo: 'diario', perfil: perfilMinimo(d.perfil), historial: historial(d.checkins) }, datos));
      local.checkins = Object.assign({}, local.checkins);
      local.checkins[String(r.checkin.dia)] = r.checkin;
      guardarCache();
      publicar();
      return r.checkin;
    },
    chatear: async function (mensaje) {
      var d = estado.datos;
      var r = await llamar('coach', { mensaje: mensaje, perfil: perfilMinimo(d.perfil), historial: d.chat.slice(-6) });
      if (!r.guardado) {
        local.chat = d.chat.concat([{ rol: 'persona', texto: mensaje }, { rol: 'coach', texto: r.respuesta, fuente: r.fuente }]);
        guardarCache();
        publicar();
      }
      return r;
    },
    crearLead: async function () {
      var r = await llamar('lead', { acepto: true, version: COMPARTIR.version, texto: COMPARTIR.texto });
      local.perfil = Object.assign({}, local.perfil, { compartir: { version: COMPARTIR.version, fecha: new Date().toISOString() } });
      guardarCache();
      publicar();
      return r;
    },
    metricas: function () { return llamar('metricas'); }
  };
}

/* ---------------------------------------------------------------- demo */

// Escenarios para enseñar la app: nuevo (vacío), listo (preparado antes del inicio),
// curso (con días ya registrados hasta el día indicado) y fin (día 22).
function sembrar(escenario, diaActual) {
  var d = vacio();
  if (escenario === 'nuevo') { return d; }
  var ahora = new Date().toISOString();
  var hoy = fechaEnZona(new Date());
  d.perfil = {
    email: 'demo@lock21.app', alta: new Date(Date.now() - 2 * 86400000).toISOString(), grupo: proximoGrupo(hoy),
    aceptaciones: { edad: { version: MAYOR_EDAD.version }, privacidad: { version: PRIVACIDAD.version }, avisoIa: { version: AVISO_IA.version } }
  };
  if (escenario === 'alta') { return d; }
  var h = buscarHabito('pasos');
  d.perfil.habito = h.id;
  d.perfil.senal = h.senal;
  d.perfil.accion = h.accion;
  d.perfil.minima = h.minima;
  if (escenario === 'habito') { return d; }
  d.srbai['0'] = { dia: 0, respuestas: [2, 2, 3, 1], media: 2 };
  if (escenario === 'listo') {
    // Dos días de calentamiento ya hechos.
    d.perfil.calentamiento = {};
    d.perfil.calentamiento[sumarDias(hoy, -2)] = { mision: 'porque', fecha: ahora };
    d.perfil.calentamiento[sumarDias(hoy, -1)] = { mision: 'detente', fecha: ahora };
    return d;
  }
  var animos = [4, 3, 4, 2, 3, 4, 5, 4, 3, 2, 4, 4, 5, 4, 3, 4, 5, 5, 4, 4, 5];
  for (var n = 1; n < Math.min(diaActual, 22); n++) {
    var hecho = n !== 5 && n !== 12;
    d.checkins[String(n)] = { dia: n, hecho: hecho, animo: animos[n - 1], sueno: hecho ? 4 : 2, sinPensar: n > 9 && hecho, nota: '', coach: respaldoCheckin(hecho, false, n) };
  }
  if (diaActual >= 8) { d.srbai['7'] = { dia: 7, respuestas: [3, 4, 3, 3], media: 3.25 }; }
  if (escenario === 'fin') { d.srbai['21'] = { dia: 21, respuestas: [5, 5, 4, 4], media: 4.5 }; }
  if (escenario === 'chat') {
    d.chat = [
      { rol: 'persona', texto: 'Mañana tengo cena con amigos, ¿qué hago con mi señal?' },
      { rol: 'coach', texto: 'Buena pregunta. Si la cena cae justo después de comer, mueve la señal a otro momento fijo: por ejemplo, después del café de media tarde. Y si se complica, la versión mínima: 2 minutos de calle y cuenta.', fuente: 'respaldo' },
      { rol: 'persona', texto: '¿Cuántas calorías quemo caminando?' },
      { rol: 'coach', texto: respuestaFija('calorias').texto, fuente: 'filtro' }
    ];
  }
  return d;
}

export function crearServicioDemo(opciones) {
  var emisor = crearEmisor();
  var params = opciones || {};
  var CLAVE = 'lock21-demo';
  var diaForzado = params.dia === undefined || params.dia === null ? null : Number(params.dia);

  function reto() {
    var base = estadoReto(new Date(), datos ? datos.perfil.grupo : null);
    if (diaForzado === null || isNaN(diaForzado)) { return base; }
    var dia = diaForzado;
    return Object.assign({}, base, {
      dia: dia,
      fase: dia < 1 ? 'antes' : (dia > base.duracion ? 'fin' : 'curso'),
      diasHastaInicio: dia < 1 ? 1 - dia : 0
    });
  }

  var datos = params.escenario ? sembrar(params.escenario, reto().dia) : (leerLocal(CLAVE) || vacio());
  var usuario = params.escenario === 'entrar' ? null : { uid: 'demo-usuario', email: 'demo@lock21.app' };
  var estado = { cargando: false, modo: 'demo', usuario: usuario, datos: datos, reto: reto(), remoto: false };

  function publicar() {
    estado = Object.assign({}, estado, { datos: datos, reto: reto() });
    guardarLocal(CLAVE, datos);
    emisor.emitir(estado);
  }

  function esperar(ms) {
    return new Promise(function (ok) { setTimeout(ok, ms); });
  }

  return {
    iniciar: function () { publicar(); return function () {}; },
    escuchar: emisor.escuchar,
    actual: function () { return estado; },
    enviarEnlace: async function () { await esperar(400); },
    completarEnlace: async function () {},
    salir: async function () {
      datos = vacio();
      try { window.localStorage.removeItem(CLAVE); } catch (e) { /* nada */ }
      estado = Object.assign({}, estado, { usuario: null });
      publicar();
    },
    entrarDemo: function () {
      estado = Object.assign({}, estado, { usuario: { uid: 'demo-usuario', email: 'demo@lock21.app' } });
      publicar();
    },
    opcionesGrupo: async function () {
      await esperar(200);
      var hoy = fechaEnZona(new Date());
      var ocupacion = {};
      ocupacion[proximoGrupo(hoy)] = 18;
      return Object.assign(opcionesLocales(ocupacion), { exacto: true });
    },
    alta: async function (grupo) {
      await esperar(250);
      var ahora = new Date().toISOString();
      var opciones = opcionesLocales().opciones.map(function (o) { return o.fecha; });
      var elegido = opciones.indexOf(grupo) !== -1 ? grupo : opciones[0];
      datos = Object.assign({}, datos, { perfil: Object.assign({}, datos.perfil, { alta: ahora, grupo: elegido, aceptaciones: { edad: { version: MAYOR_EDAD.version, fecha: ahora }, privacidad: { version: PRIVACIDAD.version, fecha: ahora }, avisoIa: { version: AVISO_IA.version, fecha: ahora } } }) });
      publicar();
    },
    cambiarGrupo: async function (grupo) {
      await esperar(250);
      var opciones = opcionesLocales().opciones.map(function (o) { return o.fecha; });
      if (opciones.indexOf(grupo) === -1) { var e = new Error('grupo_completo'); e.codigo = 'grupo_completo'; throw e; }
      datos = Object.assign({}, datos, { perfil: Object.assign({}, datos.perfil, { grupo: grupo }) });
      publicar();
    },
    marcarCalentamiento: async function () {
      await esperar(250);
      var r = reto();
      if (r.fase !== 'antes') { var e = new Error('reto_empezado'); e.codigo = 'reto_empezado'; throw e; }
      var hechos = Object.assign({}, datos.perfil.calentamiento || {});
      hechos[r.hoy] = { mision: misionDelDia(datos.perfil, r.hoy).id, fecha: new Date().toISOString() };
      datos = Object.assign({}, datos, { perfil: Object.assign({}, datos.perfil, { calentamiento: hechos }) });
      publicar();
      return { calentamiento: hechos, dias: Object.keys(hechos).length };
    },
    guardarHabito: async function (d) {
      await esperar(250);
      if (reto().dia > 1) { var e = new Error('habito_cerrado'); e.codigo = 'habito_cerrado'; throw e; }
      datos = Object.assign({}, datos, { perfil: Object.assign({}, datos.perfil, { habito: d.habito, senal: d.senal, accion: d.accion, minima: d.minima }) });
      publicar();
    },
    enviarSrbai: async function (dia, respuestas) {
      await esperar(250);
      var r = reto();
      var hechos = {};
      Object.keys(datos.srbai).forEach(function (k) { hechos[k] = true; });
      if (testAbierto(r.dia, hechos) !== dia && !(dia === 0 && r.dia <= 1)) { var e = new Error('test_cerrado'); e.codigo = 'test_cerrado'; throw e; }
      var registro = { dia: dia, respuestas: respuestas, media: mediaSrbai(respuestas), fecha: r.hoy };
      var s = Object.assign({}, datos.srbai);
      s[String(dia)] = registro;
      datos = Object.assign({}, datos, { srbai: s });
      publicar();
      return registro;
    },
    enviarCheckin: async function (d) {
      await esperar(500);
      var r = reto();
      if (r.fase !== 'curso') { var e = new Error('reto_no_empezado'); e.codigo = 'reto_no_empezado'; throw e; }
      var previos = Object.assign({}, datos.checkins);
      delete previos[String(r.dia)];
      var falloAyer = calcularRacha(datos.perfil.habito, previos, r.dia, r.grupo).alerta;
      var coach = respaldoCheckin(d.hecho, falloAyer, r.dia);
      var fija = d.nota ? respuestaFija(d.nota) : null;
      if (fija) {
        coach = fija.tipo === 'riesgo'
          ? { mensaje: TEXTO_RIESGO, tareaManana: 'Habla hoy con alguien de confianza.', nivel: 'minimo', derivar: true, fuente: 'riesgo' }
          : Object.assign({}, coach, { mensaje: fija.texto, derivar: true, fuente: 'filtro' });
      }
      var registro = Object.assign({ dia: r.dia, fecha: r.hoy, coach: coach }, d);
      var c = Object.assign({}, datos.checkins);
      c[String(r.dia)] = registro;
      datos = Object.assign({}, datos, { checkins: c });
      publicar();
      return registro;
    },
    chatear: async function (mensaje) {
      await esperar(600);
      var fija = respuestaFija(mensaje);
      var texto = fija ? fija.texto : respaldoChat(datos.chat.length);
      datos = Object.assign({}, datos, { chat: datos.chat.concat([{ rol: 'persona', texto: mensaje }, { rol: 'coach', texto: texto, fuente: fija ? fija.tipo : 'respaldo' }]) });
      publicar();
      return { respuesta: texto, quedan: 20 - datos.chat.length / 2 };
    },
    crearLead: async function () {
      await esperar(500);
      datos = Object.assign({}, datos, { perfil: Object.assign({}, datos.perfil, { compartir: { version: COMPARTIR.version, fecha: new Date().toISOString() } }) });
      publicar();
      return { ok: true, guardado: false, servicio: '', servicioUrl: '' };
    },
    metricas: async function () {
      await esperar(300);
      return metricasDemo();
    }
  };
}

function metricasDemo() {
  var nombres = ['Pasos', 'Cama antes de 23:30', 'Entrenar 3 días', '2 litros de agua', 'Sin pantalla al dormir', '10 min de movilidad'];
  var inscritos = [];
  var hoy = fechaEnZona(new Date());
  var g1 = proximoGrupo(hoy);
  var g2 = sumarDias(g1, config.grupos.cadaDias);
  for (var i = 0; i < 12; i++) {
    inscritos.push({ uid: 'a1b2c3' + i, email: 'persona' + (i + 1) + '@correo.es', grupo: i < 9 ? g1 : g2, calentamiento: i % 4, habito: nombres[i % 6], racha: (i * 3) % 9, adherencia: 60 + (i * 7) % 38, checkins: 7 + (i % 3), srbai: { '0': 2 + (i % 3) * 0.5, '7': 3 + (i % 4) * 0.5 } });
  }
  return {
    estado: estadoReto(new Date(), null),
    porGrupo: [
      { grupo: g1, fase: 'antes', dia: estadoReto(new Date(), g1).dia, diasHastaInicio: estadoReto(new Date(), g1).diasHastaInicio, plazas: 30, registrados: 10, inscritos: 9, checkins: 0, calentamiento: 14, leads: 0, adherenciaMedia: null, srbaiMedio: { '0': 2.4, '7': null, '21': null } },
      { grupo: g2, fase: 'antes', dia: estadoReto(new Date(), g2).dia, diasHastaInicio: estadoReto(new Date(), g2).diasHastaInicio, plazas: 30, registrados: 4, inscritos: 3, checkins: 0, calentamiento: 3, leads: 0, adherenciaMedia: null, srbaiMedio: { '0': 2.2, '7': null, '21': null } }
    ],
    inscritos: 12,
    registrados: 14,
    checkins: 96,
    adherenciaMedia: 78.5,
    srbaiMedio: { '0': 2.4, '7': 3.6, '21': null },
    srbaiRespuestas: { '0': 12, '7': 11, '21': 0 },
    leads: 2,
    detalleInscritos: inscritos,
    detalleLeads: [
      { email: 'persona3@correo.es', fecha: new Date().toISOString(), habito: '8.000 pasos al día', adherencia: 90, consentimiento: COMPARTIR.version, resumen: 'Completó 19 de 21 días con dos fallos sueltos que nunca encadenó. Su automaticidad subió de 2 a 4,5. Los días de peor sueño coinciden con los fallos; en las notas aparece el turno de tarde como obstáculo.' },
      { email: 'persona8@correo.es', fecha: new Date().toISOString(), habito: 'Entrenar 3 días por semana', adherencia: 78, consentimiento: COMPARTIR.version, resumen: 'Mantuvo la señal de salir del trabajo casi todas las semanas. Curva de 2,5 a 4. Pide ayuda para sostenerlo cuando cambie de horario en enero.' }
    ]
  };
}

export { toca, config };
