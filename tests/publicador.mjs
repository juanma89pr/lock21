// Pruebas del publicador de Instagram sin red: fetch y Netlify Blobs simulados.
// Cubre carrusel, imagen, reel (IN_PROGRESS -> FINISHED), historia, duplicados,
// reintentos, límite diario, token caducado, simulación, variables y renovación del token.
import { readdirSync, readFileSync } from 'node:fs';
import { ejecutarPublicador, renovarToken, informeEstado, validarPieza, obtenerToken, MAX_INTENTOS } from '../netlify/lib/instagram.js';

var fallos = [];
var bien = 0;

function igual(nombre, real, esperado) {
  var a = JSON.stringify(real);
  var b = JSON.stringify(esperado);
  if (a === b) { bien = bien + 1; } else { fallos.push(nombre + ': esperado ' + b + ', obtenido ' + a); }
}

function almacen() {
  var datos = {};
  return {
    datos: datos,
    get: async function (k, op) {
      if (datos[k] === undefined) { return null; }
      return op && op.type === 'json' ? JSON.parse(datos[k]) : datos[k];
    },
    setJSON: async function (k, v) { datos[k] = JSON.stringify(v); }
  };
}

function respuesta(codigo, cuerpo) {
  return { ok: codigo >= 200 && codigo < 300, status: codigo, json: async function () { return cuerpo; } };
}

// API simulada de Instagram. opciones: { procesando: n (consultas IN_PROGRESS antes de FINISHED),
// fallosCrear: n, tokenCaducado: bool, cuotaUso: n, medios404: [url] }
function api(opciones) {
  var o = opciones || {};
  var s = { llamadas: [], contenedores: {}, publicados: [], siguiente: 100, fallosCrear: o.fallosCrear || 0 };
  s.fetch = async function (url, init) {
    var metodo = (init && init.method) || 'GET';
    var u = new URL(url);
    var params = metodo === 'POST' ? new URLSearchParams(init.body) : u.searchParams;
    s.llamadas.push({ metodo: metodo, ruta: u.pathname, params: Object.fromEntries(params) });
    if (metodo === 'HEAD') {
      if (u.hostname !== 'lock21.netlify.app') { return respuesta(500, null); }
      return respuesta((o.medios404 || []).indexOf(u.pathname) >= 0 ? 404 : 200, null);
    }
    if (u.hostname !== 'graph.instagram.com') { return respuesta(500, null); }
    if (o.tokenCaducado || params.get('access_token') !== (o.token || 'tok-variable')) {
      return respuesta(400, { error: { message: 'Error validating access token: Session has expired', type: 'OAuthException', code: 190, error_subcode: 463 } });
    }
    if (u.pathname === '/refresh_access_token') {
      return respuesta(200, { access_token: 'tok-renovado', token_type: 'bearer', expires_in: 5184000 });
    }
    var partes = u.pathname.split('/').filter(Boolean); // [v26.0, id, edge?]
    if (partes[2] === 'content_publishing_limit') {
      return respuesta(200, { data: [{ quota_usage: o.cuotaUso || 0, config: { quota_total: 50, quota_duration: 86400 } }] });
    }
    if (metodo === 'POST' && partes[2] === 'media') {
      if (s.fallosCrear > 0) {
        s.fallosCrear = s.fallosCrear - 1;
        return respuesta(400, { error: { message: 'The media could not be fetched from this uri', type: 'OAuthException', code: 9004, error_subcode: 2207052 } });
      }
      var id = 'c' + (s.siguiente++);
      var p = Object.fromEntries(params);
      var video = !!p.video_url;
      s.contenedores[id] = { params: p, pendientes: video ? (o.procesando || 0) : 0, publicado: false };
      return respuesta(200, { id: id });
    }
    if (metodo === 'POST' && partes[2] === 'media_publish') {
      var c = s.contenedores[params.get('creation_id')];
      if (!c || c.pendientes > 0) { return respuesta(400, { error: { message: 'Media ID is not available', code: 9007, error_subcode: 2207027 } }); }
      if (c.publicado) { return respuesta(400, { error: { message: 'ya publicado', code: 100 } }); }
      c.publicado = true;
      var mid = 'm' + (s.siguiente++);
      s.publicados.push({ media: mid, contenedor: params.get('creation_id'), params: c.params });
      return respuesta(200, { id: mid });
    }
    if (metodo === 'GET' && partes.length === 2 && s.contenedores[partes[1]]) {
      var ct = s.contenedores[partes[1]];
      if (ct.publicado) { return respuesta(200, { status_code: 'PUBLISHED', id: partes[1] }); }
      if (ct.pendientes > 0) { ct.pendientes = ct.pendientes - 1; return respuesta(200, { status_code: 'IN_PROGRESS', id: partes[1] }); }
      return respuesta(200, { status_code: 'FINISHED', id: partes[1] });
    }
    return respuesta(404, { error: { message: 'ruta desconocida ' + u.pathname, code: 100 } });
  };
  return s;
}

// Reloj controlable: cada llamada a esperar() adelanta el tiempo.
function reloj(isoInicio) {
  var t = Date.parse(isoInicio);
  return {
    ahora: function () { return new Date(t); },
    esperar: async function (ms) { t = t + ms; },
    avanzar: function (ms) { t = t + ms; }
  };
}

var ENV = { IG_PUBLICAR: '1', IG_ACCESS_TOKEN: 'tok-variable', IG_USER_ID: '17841400000000000' };

function pieza(id, fecha, tipo, archivos, extra) {
  var p = { id: id, fecha: fecha, tipo: tipo, archivos: archivos, pie: 'Pie de ' + id, estado: 'programado' };
  Object.keys(extra || {}).forEach(function (k) { p[k] = extra[k]; });
  return p;
}

var CAR = pieza('2026-10-28_1930_carrusel-6-habitos', '2026-10-28T19:30:00+00:00', 'carrusel', ['redes/2026-10-28/c/01.jpg', 'redes/2026-10-28/c/02.jpg', 'redes/2026-10-28/c/03.jpg']);
var IMG = pieza('2026-10-28_1800_imagen-suelta', '2026-10-28T18:00:00+00:00', 'imagen', ['redes/2026-10-28/i/01.jpg']);
var REEL = pieza('2026-10-26_1930_reel-lunes', '2026-10-26T19:30:00+00:00', 'reel', ['redes/2026-10-26/r/reel.mp4'], { portada: 'redes/2026-10-26/r/portada.jpg' });
var HIST = pieza('2026-10-25_2000_historia-01', '2026-10-25T20:00:00+00:00', 'historia', ['redes/2026-10-25/historias/01.jpg'], { pie: '' });
var FUTURA = pieza('2026-10-31_2000_historia-01', '2026-10-31T20:00:00+00:00', 'historia', ['redes/2026-10-31/historias/01.jpg'], { pie: '' });

function publicadosPorTipo(s) {
  return s.publicados.map(function (p) { return p.params.media_type || 'IMAGE'; });
}

// 1. Carrusel: 3 hijos con is_carousel_item, contenedor CAROUSEL con children y pie, publicación.
var s1 = api();
var st1 = almacen();
var r1 = reloj('2026-10-28T19:31:00Z');
var res1 = await ejecutarPublicador({ cola: [CAR, FUTURA], store: st1, fetch: s1.fetch, env: ENV, ahora: r1.ahora, esperar: r1.esperar });
igual('carrusel publicado', res1.publicadas, [CAR.id]);
var hijos1 = s1.llamadas.filter(function (l) { return l.params.is_carousel_item === 'true'; });
igual('carrusel: 3 hijos', hijos1.length, 3);
igual('carrusel: hijos con image_url pública', hijos1[0].params.image_url, 'https://lock21.netlify.app/redes/2026-10-28/c/01.jpg');
igual('carrusel: hijos sin pie', hijos1[0].params.caption, undefined);
igual('carrusel: contenedor final', [s1.publicados[0].params.media_type, s1.publicados[0].params.children.split(',').length, s1.publicados[0].params.caption], ['CAROUSEL', 3, 'Pie de ' + CAR.id]);
igual('carrusel: la futura no se toca', res1.publicadas.indexOf(FUTURA.id), -1);
var e1 = JSON.parse(st1.datos.estado);
igual('carrusel: estado guardado', [e1.piezas[CAR.id].estado, e1.piezas[CAR.id].mediaId], ['publicado', s1.publicados[0].media]);

// 2. Duplicados: una segunda ejecución no vuelve a publicar.
r1.avanzar(10 * 60 * 1000);
var res1b = await ejecutarPublicador({ cola: [CAR, FUTURA], store: st1, fetch: s1.fetch, env: ENV, ahora: r1.ahora, esperar: r1.esperar });
igual('duplicado: no republica', [res1b.publicadas.length, s1.publicados.length], [0, 1]);

// 2b. Ejecución solapada (bloqueo reciente): no hace nada.
var st1c = almacen();
await st1c.setJSON('bloqueo', { desde: new Date(r1.ahora().getTime() - 30000).toISOString() });
var s1c = api();
var res1c = await ejecutarPublicador({ cola: [CAR], store: st1c, fetch: s1c.fetch, env: ENV, ahora: r1.ahora, esperar: r1.esperar });
igual('bloqueo: se omite', [res1c.parada, s1c.publicados.length], ['bloqueado', 0]);

// 3. Imagen suelta: image_url + caption, sin media_type.
var s3 = api();
var r3 = reloj('2026-10-28T18:05:00Z');
var res3 = await ejecutarPublicador({ cola: [IMG], store: almacen(), fetch: s3.fetch, env: ENV, ahora: r3.ahora, esperar: r3.esperar });
igual('imagen publicada', [res3.publicadas, publicadosPorTipo(s3), s3.publicados[0].params.caption], [[IMG.id], ['IMAGE'], 'Pie de ' + IMG.id]);

// 4. Reel: IN_PROGRESS -> FINISHED dentro de la misma ejecución, con portada.
var s4 = api({ procesando: 2 });
var r4 = reloj('2026-10-26T19:30:30Z');
var res4 = await ejecutarPublicador({ cola: [REEL], store: almacen(), fetch: s4.fetch, env: ENV, ahora: r4.ahora, esperar: r4.esperar });
igual('reel publicado tras esperar', res4.publicadas, [REEL.id]);
igual('reel: parámetros', [s4.publicados[0].params.media_type, s4.publicados[0].params.cover_url, s4.publicados[0].params.share_to_feed], ['REELS', 'https://lock21.netlify.app/redes/2026-10-26/r/portada.jpg', 'true']);
igual('reel: 3 consultas de estado', s4.llamadas.filter(function (l) { return l.metodo === 'GET' && /\/c\d+$/.test(l.ruta); }).length, 3);

// 4b. Reel que no termina en el límite de tiempo: queda pendiente y se publica en la siguiente.
var s4b = api({ procesando: 20 });
var st4b = almacen();
var r4b = reloj('2026-10-26T19:31:00Z');
var res4b = await ejecutarPublicador({ cola: [REEL], store: st4b, fetch: s4b.fetch, env: ENV, ahora: r4b.ahora, esperar: r4b.esperar });
igual('reel lento: pendiente', [res4b.pendientes, res4b.publicadas, s4b.publicados.length], [[REEL.id], [], 0]);
var contenedor4b = JSON.parse(st4b.datos.estado).piezas[REEL.id].contenedor;
igual('reel lento: contenedor guardado', !!contenedor4b, true);
s4b.contenedores[contenedor4b].pendientes = 0;
r4b.avanzar(10 * 60 * 1000);
var res4c = await ejecutarPublicador({ cola: [REEL], store: st4b, fetch: s4b.fetch, env: ENV, ahora: r4b.ahora, esperar: r4b.esperar });
igual('reel lento: publicado en la siguiente sin crear otro contenedor', [res4c.publicadas, Object.keys(s4b.contenedores).length], [[REEL.id], 1]);

// 4c. Reel de prueba (Trial Reel): trial_params MANUAL.
var s4d = api();
var REEL_PRUEBA = pieza('2026-10-27_1930_reel-prueba-lunes', '2026-10-27T19:30:00+00:00', 'reel', ['redes/2026-10-26/r/reel.mp4'], { prueba: true });
await ejecutarPublicador({ cola: [REEL_PRUEBA], store: almacen(), fetch: s4d.fetch, env: ENV, ahora: reloj('2026-10-27T19:31:00Z').ahora, esperar: r4.esperar });
igual('reel de prueba: trial_params', s4d.publicados[0].params.trial_params, '{"graduation_strategy":"MANUAL"}');

// 5. Historia: STORIES con image_url y sin pie.
var s5 = api();
var r5 = reloj('2026-10-25T20:00:10Z');
var res5 = await ejecutarPublicador({ cola: [HIST], store: almacen(), fetch: s5.fetch, env: ENV, ahora: r5.ahora, esperar: r5.esperar });
igual('historia publicada', [res5.publicadas, s5.publicados[0].params.media_type, s5.publicados[0].params.image_url, s5.publicados[0].params.caption], [[HIST.id], 'STORIES', 'https://lock21.netlify.app/redes/2026-10-25/historias/01.jpg', undefined]);

// 6. Reintentos: dos fallos y a la tercera se publica; con 3 fallos queda como fallido.
var s6 = api({ fallosCrear: 2 });
var st6 = almacen();
var r6 = reloj('2026-10-28T18:01:00Z');
var c6 = { cola: [IMG], store: st6, fetch: s6.fetch, env: ENV, ahora: r6.ahora, esperar: r6.esperar };
await ejecutarPublicador(c6);
igual('reintento 1: error', JSON.parse(st6.datos.estado).piezas[IMG.id].estado, 'error');
r6.avanzar(600000);
await ejecutarPublicador(c6);
r6.avanzar(600000);
var res6 = await ejecutarPublicador(c6);
igual('reintento 3: publicado', [res6.publicadas, JSON.parse(st6.datos.estado).piezas[IMG.id].intentos], [[IMG.id], 2]);

var s6b = api({ fallosCrear: 10 });
var st6b = almacen();
var c6b = { cola: [IMG], store: st6b, fetch: s6b.fetch, env: ENV, ahora: r6.ahora, esperar: r6.esperar };
for (var n = 0; n < 5; n++) { await ejecutarPublicador(c6b); r6.avanzar(600000); }
var e6b = JSON.parse(st6b.datos.estado);
igual('máx. 3 intentos y luego fallido', [e6b.piezas[IMG.id].estado, e6b.piezas[IMG.id].intentos, s6b.llamadas.filter(function (l) { return l.metodo === 'POST'; }).length], ['fallido', MAX_INTENTOS, 3]);
igual('errores registrados', e6b.errores.length >= 3 && /2207052/.test(e6b.errores[0].error), true);

// 7. Límite diario: propio (publicaciones guardadas) y el de la API (quota_usage).
var s7 = api();
var st7 = almacen();
var lista = [];
for (var k = 0; k < 50; k++) { lista.push(new Date(Date.parse('2026-10-28T10:00:00Z') + k * 60000).toISOString()); }
await st7.setJSON('estado', { piezas: {}, publicaciones: lista, simulaciones: {}, errores: [], registro: [] });
var res7 = await ejecutarPublicador({ cola: [IMG], store: st7, fetch: s7.fetch, env: ENV, ahora: r3.ahora, esperar: r3.esperar });
igual('límite propio: no publica', [res7.parada, s7.publicados.length], ['limite_diario', 0]);
var s7b = api({ cuotaUso: 50 });
var res7b = await ejecutarPublicador({ cola: [IMG], store: almacen(), fetch: s7b.fetch, env: ENV, ahora: r3.ahora, esperar: r3.esperar });
igual('límite de la API: no publica', [res7b.parada, s7b.publicados.length], ['limite_diario', 0]);
var s7c = api();
var res7c = await ejecutarPublicador({ cola: [IMG, CAR], store: almacen(), fetch: s7c.fetch, env: { IG_PUBLICAR: '1', IG_ACCESS_TOKEN: 'tok-variable', IG_USER_ID: '1', IG_LIMITE_DIARIO: '1' }, ahora: reloj('2026-10-28T19:40:00Z').ahora, esperar: r3.esperar });
igual('límite configurable: solo 1', [res7c.publicadas.length, res7c.parada], [1, 'limite_diario']);

// 8. Token caducado: se para, no gasta intentos y queda registrado.
var s8 = api({ tokenCaducado: true });
var st8 = almacen();
var res8 = await ejecutarPublicador({ cola: [IMG], store: st8, fetch: s8.fetch, env: ENV, ahora: r3.ahora, esperar: r3.esperar });
var e8 = JSON.parse(st8.datos.estado);
igual('token caducado: parada', [res8.parada, s8.publicados.length, (e8.piezas[IMG.id] || {}).intentos || 0], ['token', 0, 0]);
igual('token caducado: error claro', /Token no válido o caducado/.test(e8.errores[0].error) && !!e8.tokenInvalido, true);
igual('token: nunca se guarda en el estado', st8.datos.estado.indexOf('tok-variable'), -1);

// 9. Ventana de 6 h: lo vencido hace más de 6 h no se publica en bloque.
var s9 = api();
var res9 = await ejecutarPublicador({ cola: [HIST], store: almacen(), fetch: s9.fetch, env: ENV, ahora: reloj('2026-10-26T02:30:00Z').ahora, esperar: r3.esperar });
igual('más de 6 h: omitida', [res9.omitidas, s9.publicados.length], [[HIST.id], 0]);

// 10. Simulación (sin IG_PUBLICAR=1): no llama a la API de Instagram, solo comprueba medios.
var s10 = api({ medios404: ['/redes/2026-10-26/r/portada.jpg'] });
var st10 = almacen();
var res10 = await ejecutarPublicador({ cola: [REEL, HIST], store: st10, fetch: s10.fetch, env: { IG_ACCESS_TOKEN: 'tok-variable', IG_USER_ID: '1' }, ahora: reloj('2026-10-26T19:35:00Z').ahora, esperar: r3.esperar });
igual('simulación: modo', res10.modo, 'simulacion');
igual('simulación: ninguna llamada a Instagram', s10.llamadas.filter(function (l) { return l.metodo !== 'HEAD'; }).length, 0);
igual('simulación: reel registrado, historia caducada', [res10.simuladas, res10.omitidas], [[REEL.id], [HIST.id]]);
igual('simulación: detecta medio que falta', JSON.parse(st10.datos.estado).simulaciones[REEL.id].faltan, ['redes/2026-10-26/r/portada.jpg']);
var res10b = await ejecutarPublicador({ cola: [REEL], store: st10, fetch: s10.fetch, env: {}, ahora: reloj('2026-10-26T19:45:00Z').ahora, esperar: r3.esperar });
igual('simulación: no repite el registro', res10b.simuladas.length, 0);
var res10c = await ejecutarPublicador({ cola: [REEL], store: st10, fetch: api().fetch, env: ENV, ahora: reloj('2026-10-26T19:50:00Z').ahora, esperar: r3.esperar });
igual('al activar IG_PUBLICAR=1 lo simulado sí se publica', res10c.publicadas, [REEL.id]);

// 11. Sin variables en modo real: no hace nada y lo registra.
var s11 = api();
var st11 = almacen();
var res11 = await ejecutarPublicador({ cola: [IMG], store: st11, fetch: s11.fetch, env: { IG_PUBLICAR: '1' }, ahora: r3.ahora, esperar: r3.esperar });
igual('sin variables', [res11.parada, s11.llamadas.length, /IG_ACCESS_TOKEN, IG_USER_ID/.test(JSON.parse(st11.datos.estado).registro[0].texto)], ['sin_variables', 0, true]);

// 12. Medio no accesible (despliegue pendiente): no gasta intento.
var s12 = api({ medios404: ['/redes/2026-10-28/i/01.jpg'] });
var st12 = almacen();
await ejecutarPublicador({ cola: [IMG], store: st12, fetch: s12.fetch, env: ENV, ahora: r3.ahora, esperar: r3.esperar });
var e12 = JSON.parse(st12.datos.estado).piezas[IMG.id];
igual('medio 404: espera sin gastar intento', [e12.estado, e12.intentos, s12.publicados.length], ['esperando_medios', 0, 0]);

// 13. Renovación del token: guarda el nuevo en Blobs y el publicador lo usa.
var st13 = almacen();
var r13 = await renovarToken({ store: st13, fetch: api().fetch, env: ENV, ahora: function () { return new Date('2026-10-26T04:17:00Z'); } });
igual('renovación ok', [r13.ok, r13.expira], [true, '2026-12-25T04:17:00.000Z']);
igual('token de Blobs en uso', (await obtenerToken(st13, ENV)).origen, 'blobs');
var s13 = api({ token: 'tok-renovado' });
var res13 = await ejecutarPublicador({ cola: [IMG], store: st13, fetch: s13.fetch, env: ENV, ahora: r3.ahora, esperar: r3.esperar });
igual('publica con el token renovado', res13.publicadas, [IMG.id]);
igual('un token nuevo en la variable manda sobre el de Blobs', (await obtenerToken(st13, { IG_ACCESS_TOKEN: 'otro-token' })).token, 'otro-token');
var r13b = await renovarToken({ store: almacen(), fetch: api({ tokenCaducado: true }).fetch, env: ENV });
igual('renovación con token caducado: falla y se registra', r13b.ok, false);
var r13c = await renovarToken({ store: almacen(), fetch: api().fetch, env: {} });
igual('renovación sin token', r13c.motivo, 'sin_token');

// 14. Informe de estado.
var inf = await informeEstado({ cola: [CAR, FUTURA], store: st1, env: ENV, ahora: r1.ahora });
igual('informe: estados', inf.cola.map(function (c) { return c.estado; }), ['publicado', 'programada']);
igual('informe: sin token en claro', JSON.stringify(inf).indexOf('tok-variable'), -1);

// 15. Validación de piezas y de la cola real del repositorio.
igual('valida PNG', validarPieza(pieza('x', '2026-10-28T19:30:00+00:00', 'imagen', ['redes/a.png'])).length > 0, true);
igual('valida fecha sin zona', validarPieza(pieza('x', '2026-10-28T19:30:00', 'imagen', ['redes/a.jpg'])).length > 0, true);
igual('valida Comenta LOCK', validarPieza(pieza('x', '2026-10-28T19:30:00+00:00', 'imagen', ['redes/a.jpg'], { pie: 'Comenta LOCK y te paso el enlace' })).length > 0, true);
var problemas = [];
readdirSync('contenido/cola').filter(function (f) { return /\.json$/.test(f); }).forEach(function (f) {
  var p = JSON.parse(readFileSync('contenido/cola/' + f, 'utf8'));
  p.id = f.replace(/\.json$/, '');
  validarPieza(p).forEach(function (e) { problemas.push(f + ': ' + e); });
});
igual('cola del repositorio válida', problemas, []);

if (fallos.length) {
  console.error('Fallos (' + fallos.length + '):\n' + fallos.join('\n'));
  process.exit(1);
}
console.log('Publicador de Instagram: ' + bien + ' comprobaciones correctas.');
