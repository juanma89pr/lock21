// Publicador automático de Instagram (Instagram API with Instagram Login).
// Toda la lógica vive aquí y recibe sus dependencias (fetch, almacén, reloj, variables)
// para poder probarla sin red. Las funciones de netlify/functions solo la conectan.
//
// Flujo por pieza: contenedores (POST /{ig-user-id}/media) -> esperar status_code FINISHED
// (GET /{contenedor}?fields=status_code) -> POST /{ig-user-id}/media_publish.
// Documentación: https://developers.facebook.com/docs/instagram-platform/content-publishing
import { createHash } from 'node:crypto';

export var API_HOST = 'https://graph.instagram.com';
export var API_VERSION_POR_DEFECTO = 'v26.0';
export var BASE_MEDIOS_POR_DEFECTO = 'https://lock21.netlify.app';
export var TIPOS = ['carrusel', 'imagen', 'reel', 'historia'];
export var MAX_INTENTOS = 3;
export var VENTANA_MS = 6 * 60 * 60 * 1000;      // no se publica nada con más de 6 h de retraso
export var CONTENEDOR_MS = 23 * 60 * 60 * 1000;  // los contenedores caducan a las 24 h
export var LIMITE_POR_DEFECTO = 50;              // quota_total de content_publishing_limit
var CLAVE_ESTADO = 'estado';
var CLAVE_TOKEN = 'token';
var CLAVE_BLOQUEO = 'bloqueo';
var MAX_REGISTRO = 60;
var MAX_ERRORES = 30;

// ---------- utilidades ----------

function huella(texto) {
  if (!texto) { return ''; }
  return createHash('sha256').update(String(texto)).digest('hex').slice(0, 16);
}

function esVideo(ruta) { return /\.(mp4|mov)$/i.test(ruta); }
function esJpeg(ruta) { return /\.jpe?g$/i.test(ruta); }

export function urlMedio(base, ruta) {
  var limpia = String(ruta).replace(/^\/+/, '').replace(/^public\//, '');
  return String(base).replace(/\/+$/, '') + '/' + limpia;
}

// Comprueba la forma de una pieza de la cola. Devuelve una lista de problemas (vacía si vale).
export function validarPieza(p) {
  var errores = [];
  if (!p || typeof p !== 'object') { return ['pieza vacía']; }
  if (!p.id) { errores.push('sin id'); }
  if (!p.fecha || isNaN(Date.parse(p.fecha)) || !/([+-]\d{2}:\d{2}|Z)$/.test(p.fecha)) { errores.push('fecha sin zona horaria: ' + p.fecha); }
  if (TIPOS.indexOf(p.tipo) < 0) { errores.push('tipo no válido: ' + p.tipo); }
  if (!Array.isArray(p.archivos) || !p.archivos.length) { errores.push('sin archivos'); return errores; }
  p.archivos.forEach(function (a) {
    if (!/^redes\/[A-Za-z0-9._\/-]+$/.test(a)) { errores.push('ruta no válida (solo ASCII bajo redes/): ' + a); }
    if (!esJpeg(a) && !esVideo(a)) { errores.push('formato no admitido (JPEG o MP4): ' + a); }
  });
  if (p.tipo === 'carrusel' && (p.archivos.length < 2 || p.archivos.length > 20)) { errores.push('un carrusel lleva de 2 a 20 archivos'); }
  if (p.tipo === 'imagen' && (p.archivos.length !== 1 || !esJpeg(p.archivos[0]))) { errores.push('una imagen lleva un único JPEG'); }
  if (p.tipo === 'reel' && (p.archivos.length !== 1 || !esVideo(p.archivos[0]))) { errores.push('un reel lleva un único MP4'); }
  if (p.tipo === 'historia' && p.archivos.length !== 1) { errores.push('una historia lleva un único archivo'); }
  if (p.portada && !esJpeg(p.portada)) { errores.push('la portada debe ser JPEG'); }
  var pie = p.pie || '';
  if (pie.length > 2200) { errores.push('pie de más de 2.200 caracteres'); }
  if ((pie.match(/#[^\s#]+/g) || []).length > 30) { errores.push('más de 30 hashtags'); }
  if (/comenta\s+lock/i.test(pie)) { errores.push('el pie aún dice "Comenta LOCK"'); }
  return errores;
}

// ---------- almacén (Netlify Blobs o simulado) ----------

function estadoVacio() {
  return { piezas: {}, publicaciones: [], simulaciones: {}, errores: [], registro: [], ultimaEjecucion: null };
}

export async function leerEstado(store) {
  var e = null;
  try { e = await store.get(CLAVE_ESTADO, { type: 'json' }); } catch (err) { e = null; }
  var base = estadoVacio();
  if (!e) { return base; }
  Object.keys(base).forEach(function (k) { if (e[k] === undefined) { e[k] = base[k]; } });
  return e;
}

async function guardarEstado(store, estado) {
  await store.setJSON(CLAVE_ESTADO, estado);
}

function anotar(estado, ahora, texto) {
  estado.registro.unshift({ fecha: ahora.toISOString(), texto: texto });
  if (estado.registro.length > MAX_REGISTRO) { estado.registro.length = MAX_REGISTRO; }
}

function anotarError(estado, ahora, id, texto) {
  estado.errores.unshift({ fecha: ahora.toISOString(), pieza: id || null, error: texto });
  if (estado.errores.length > MAX_ERRORES) { estado.errores.length = MAX_ERRORES; }
}

// Token: el de Blobs (renovado) si existe y procede de la variable actual; si el
// propietario pega un token nuevo en la variable, ese pasa a mandar.
export async function obtenerToken(store, env) {
  var guardado = null;
  try { guardado = await store.get(CLAVE_TOKEN, { type: 'json' }); } catch (e) { guardado = null; }
  var deVariable = env.IG_ACCESS_TOKEN || '';
  if (guardado && guardado.token && (!deVariable || guardado.desdeVariable === huella(deVariable))) {
    return { token: guardado.token, origen: 'blobs', renovado: guardado.renovado || null, expira: guardado.expira || null };
  }
  if (deVariable) { return { token: deVariable, origen: 'variable', renovado: null, expira: null }; }
  return { token: '', origen: 'ninguno', renovado: null, expira: null };
}

// ---------- llamadas a la API ----------

function ErrorApi(mensaje, datos) {
  var e = new Error(mensaje);
  e.api = datos || {};
  return e;
}

function clasificar(err) {
  var a = (err && err.api) || {};
  if (a.code === 190 || (a.type === 'OAuthException' && /expired|session|token/i.test(a.message || ''))) { return 'token'; }
  if (a.code === 4 || a.code === 17 || a.code === 32 || a.code === 613 || a.code === 9 || a.error_subcode === 2207042) { return 'limite'; }
  return 'pieza';
}

function textoError(err) {
  var a = (err && err.api) || {};
  var partes = [err && err.message ? err.message : String(err)];
  if (a.code) { partes.push('código ' + a.code + (a.error_subcode ? '/' + a.error_subcode : '')); }
  return partes.join(' · ').slice(0, 400);
}

function cliente(ctx) {
  var base = API_HOST + '/' + (ctx.env.IG_API_VERSION || API_VERSION_POR_DEFECTO);

  async function respuesta(res) {
    var datos = null;
    try { datos = await res.json(); } catch (e) { datos = null; }
    if (!res.ok || !datos || datos.error) {
      var err = (datos && datos.error) || {};
      throw ErrorApi(err.message || ('HTTP ' + res.status), err);
    }
    return datos;
  }

  return {
    post: async function (ruta, params) {
      var cuerpo = new URLSearchParams();
      Object.keys(params).forEach(function (k) {
        if (params[k] === undefined || params[k] === null) { return; }
        cuerpo.set(k, typeof params[k] === 'object' ? JSON.stringify(params[k]) : String(params[k]));
      });
      cuerpo.set('access_token', ctx.token);
      var res = await ctx.fetch(base + ruta, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: cuerpo.toString() });
      return respuesta(res);
    },
    get: async function (ruta, params) {
      var q = new URLSearchParams(params || {});
      q.set('access_token', ctx.token);
      var res = await ctx.fetch(base + ruta + '?' + q.toString(), { method: 'GET' });
      return respuesta(res);
    }
  };
}

async function medioDisponible(ctx, url) {
  try {
    var res = await ctx.fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// Crea los contenedores de una pieza y devuelve el id del contenedor que se publica.
async function crearContenedores(api, ctx, pieza, registro) {
  var igUser = '/' + ctx.env.IG_USER_ID + '/media';
  var urls = pieza.archivos.map(function (a) { return urlMedio(ctx.base, a); });
  var r;
  if (pieza.tipo === 'carrusel') {
    var hijos = [];
    for (var i = 0; i < urls.length; i++) {
      var p = esVideo(urls[i]) ? { video_url: urls[i], media_type: 'VIDEO', is_carousel_item: 'true' } : { image_url: urls[i], is_carousel_item: 'true' };
      r = await api.post(igUser, p);
      hijos.push(r.id);
    }
    registro.hijos = hijos;
    r = await api.post(igUser, { media_type: 'CAROUSEL', children: hijos.join(','), caption: pieza.pie || '' });
    return r.id;
  }
  if (pieza.tipo === 'reel') {
    var pr = { media_type: 'REELS', video_url: urls[0], caption: pieza.pie || '', share_to_feed: 'true' };
    if (pieza.portada) { pr.cover_url = urlMedio(ctx.base, pieza.portada); }
    if (pieza.prueba) { pr.trial_params = { graduation_strategy: 'MANUAL' }; delete pr.share_to_feed; }
    r = await api.post(igUser, pr);
    return r.id;
  }
  if (pieza.tipo === 'historia') {
    r = await api.post(igUser, esVideo(urls[0]) ? { media_type: 'STORIES', video_url: urls[0] } : { media_type: 'STORIES', image_url: urls[0] });
    return r.id;
  }
  r = await api.post(igUser, { image_url: urls[0], caption: pieza.pie || '' });
  return r.id;
}

// ---------- publicador ----------

function piezasVencidas(cola, ahora) {
  return cola.filter(function (p) {
    return (p.estado || 'programado') === 'programado' && Date.parse(p.fecha) <= ahora.getTime();
  }).sort(function (a, b) {
    var d = Date.parse(a.fecha) - Date.parse(b.fecha);
    return d !== 0 ? d : (a.id < b.id ? -1 : 1);
  });
}

function publicacionesUltimas24h(estado, ahora) {
  var desde = ahora.getTime() - 24 * 60 * 60 * 1000;
  estado.publicaciones = estado.publicaciones.filter(function (f) { return Date.parse(f) > desde; });
  return estado.publicaciones.length;
}

// ctx: { cola, store, fetch, env, ahora (función que devuelve Date), esperar(ms), log, presupuestoMs }
export async function ejecutarPublicador(ctx) {
  var log = ctx.log || function () {};
  var reloj = ctx.ahora || function () { return new Date(); };
  var esperar = ctx.esperar || function (ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); };
  var inicio = reloj();
  var presupuesto = ctx.presupuestoMs || 24000;
  var env = ctx.env || {};
  var store = ctx.store;
  var resumen = { modo: env.IG_PUBLICAR === '1' ? 'real' : 'simulacion', publicadas: [], pendientes: [], errores: [], simuladas: [], omitidas: [], parada: null };

  function quedaTiempo(margen) { return reloj().getTime() - inicio.getTime() < presupuesto - (margen || 0); }

  // Bloqueo para que dos ejecuciones solapadas no publiquen lo mismo.
  var bloqueo = null;
  try { bloqueo = await store.get(CLAVE_BLOQUEO, { type: 'json' }); } catch (e) { bloqueo = null; }
  if (bloqueo && inicio.getTime() - Date.parse(bloqueo.desde) < 2 * 60 * 1000) {
    log('publicar-instagram: otra ejecución en curso, se omite');
    resumen.parada = 'bloqueado';
    return resumen;
  }
  await store.setJSON(CLAVE_BLOQUEO, { desde: inicio.toISOString() });

  var estado = await leerEstado(store);
  estado.ultimaEjecucion = { fecha: inicio.toISOString(), modo: resumen.modo };
  var base = env.IG_BASE_MEDIOS || BASE_MEDIOS_POR_DEFECTO;

  try {
    var vencidas = piezasVencidas(ctx.cola || [], inicio);
    var tok = await obtenerToken(store, env);

    if (resumen.modo === 'simulacion') {
      for (var s = 0; s < vencidas.length; s++) {
        var ps = vencidas[s];
        var reg = estado.piezas[ps.id];
        if (estado.simulaciones[ps.id] || (reg && reg.estado === 'publicado')) { continue; }
        var retrasoS = inicio.getTime() - Date.parse(ps.fecha);
        if (retrasoS > VENTANA_MS) { estado.simulaciones[ps.id] = { fecha: inicio.toISOString(), resultado: 'caducada' }; resumen.omitidas.push(ps.id); continue; }
        var faltan = [];
        var todas = ps.archivos.concat(ps.portada ? [ps.portada] : []);
        for (var m = 0; m < todas.length; m++) {
          if (!(await medioDisponible({ fetch: ctx.fetch }, urlMedio(base, todas[m])))) { faltan.push(todas[m]); }
        }
        var texto = '[simulación] publicaría ' + ps.tipo + (ps.prueba ? ' de prueba' : '') + ' ' + ps.id + ' (' + ps.archivos.length + ' archivo/s)' + (faltan.length ? '; NO accesibles: ' + faltan.join(', ') : '; medios accesibles');
        estado.simulaciones[ps.id] = { fecha: inicio.toISOString(), resultado: faltan.length ? 'faltan_medios' : 'ok', faltan: faltan };
        anotar(estado, inicio, texto);
        log(texto);
        resumen.simuladas.push(ps.id);
      }
      if (!tok.token || !env.IG_USER_ID) { anotar(estado, inicio, 'Modo simulación. Faltan variables para publicar de verdad: ' + [!tok.token ? 'IG_ACCESS_TOKEN' : '', !env.IG_USER_ID ? 'IG_USER_ID' : ''].filter(Boolean).join(', ')); }
      return resumen;
    }

    if (!tok.token || !env.IG_USER_ID) {
      var falta = 'Faltan variables: ' + [!tok.token ? 'IG_ACCESS_TOKEN' : '', !env.IG_USER_ID ? 'IG_USER_ID' : ''].filter(Boolean).join(', ') + '. No se publica nada.';
      log('publicar-instagram: ' + falta);
      anotar(estado, inicio, falta);
      resumen.parada = 'sin_variables';
      return resumen;
    }

    var api = cliente({ fetch: ctx.fetch, env: env, token: tok.token });
    var cctx = { fetch: ctx.fetch, env: env, base: base };
    var limite = parseInt(env.IG_LIMITE_DIARIO || '0', 10) || LIMITE_POR_DEFECTO;
    var cuotaConsultada = false;

    for (var i = 0; i < vencidas.length; i++) {
      var pieza = vencidas[i];
      var r = estado.piezas[pieza.id] || { estado: 'nueva', intentos: 0 };
      if (r.estado === 'publicado' || r.estado === 'fallido' || r.estado === 'caducada') { continue; }
      var retraso = inicio.getTime() - Date.parse(pieza.fecha);
      if (!r.contenedor && retraso > VENTANA_MS) {
        r.estado = 'caducada';
        r.actualizado = inicio.toISOString();
        estado.piezas[pieza.id] = r;
        anotar(estado, inicio, 'Se omite ' + pieza.id + ': lleva más de 6 h vencida y no se publica en bloque.');
        resumen.omitidas.push(pieza.id);
        continue;
      }
      if (r.contenedor && inicio.getTime() - Date.parse(r.contenedorCreado) > CONTENEDOR_MS) {
        r.contenedor = null;
        r.hijos = null;
        if (retraso > VENTANA_MS) { r.estado = 'caducada'; estado.piezas[pieza.id] = r; resumen.omitidas.push(pieza.id); continue; }
      }
      if (!quedaTiempo(6000)) { resumen.parada = 'tiempo'; break; }

      // Límite diario: el propio (Blobs) y el de la API (content_publishing_limit).
      if (publicacionesUltimas24h(estado, inicio) >= limite) { resumen.parada = 'limite_diario'; anotar(estado, inicio, 'Límite diario alcanzado (' + limite + '). Se reintentará más tarde.'); break; }
      if (!cuotaConsultada) {
        cuotaConsultada = true;
        try {
          var cuota = await api.get('/' + env.IG_USER_ID + '/content_publishing_limit', { fields: 'quota_usage,config' });
          var dato = cuota && cuota.data && cuota.data[0];
          if (dato) {
            if (dato.config && dato.config.quota_total) { limite = Math.min(limite, dato.config.quota_total); }
            estado.cuota = { uso: dato.quota_usage, total: dato.config ? dato.config.quota_total : null, fecha: inicio.toISOString() };
            if (dato.quota_usage >= (dato.config && dato.config.quota_total ? dato.config.quota_total : limite)) {
              resumen.parada = 'limite_diario';
              anotar(estado, inicio, 'Instagram indica el límite diario alcanzado (' + dato.quota_usage + '). Se reintentará más tarde.');
              break;
            }
          }
        } catch (errCuota) {
          if (clasificar(errCuota) === 'token') { throw errCuota; }
          anotar(estado, inicio, 'No se pudo consultar content_publishing_limit: ' + textoError(errCuota));
        }
      }

      try {
        if (!r.contenedor) {
          var todos = pieza.archivos.concat(pieza.portada ? [pieza.portada] : []);
          var noAccesibles = [];
          for (var k = 0; k < todos.length; k++) {
            if (!(await medioDisponible(cctx, urlMedio(base, todos[k])))) { noAccesibles.push(todos[k]); }
          }
          if (noAccesibles.length) {
            // No cuenta como intento: suele ser que el despliegue aún no ha terminado.
            r.estado = 'esperando_medios';
            r.actualizado = inicio.toISOString();
            estado.piezas[pieza.id] = r;
            anotarError(estado, inicio, pieza.id, 'Medios no accesibles: ' + noAccesibles.join(', '));
            resumen.errores.push(pieza.id);
            continue;
          }
          r.contenedor = await crearContenedores(api, cctx, pieza, r);
          r.contenedorCreado = inicio.toISOString();
          r.estado = 'procesando';
          r.actualizado = inicio.toISOString();
          estado.piezas[pieza.id] = r;
          await guardarEstado(store, estado);
        }

        // Esperar a que el contenedor esté listo (vídeos: puede tardar).
        var codigo = null;
        while (true) {
          var st = await api.get('/' + r.contenedor, { fields: 'status_code,status' });
          codigo = st.status_code;
          if (codigo !== 'IN_PROGRESS') {
            if (codigo === 'ERROR') { r.detalle = st.status || null; }
            break;
          }
          if (!quedaTiempo(6000)) { break; }
          await esperar(5000);
        }
        if (codigo === 'IN_PROGRESS') {
          r.estado = 'procesando';
          r.actualizado = reloj().toISOString();
          estado.piezas[pieza.id] = r;
          anotar(estado, inicio, pieza.id + ': el vídeo sigue procesándose; se publicará en la próxima ejecución.');
          resumen.pendientes.push(pieza.id);
          continue;
        }
        if (codigo === 'PUBLISHED') {
          // Se publicó en una ejecución anterior que no llegó a guardar el resultado.
          r.estado = 'publicado';
          r.publicadoEn = r.publicadoEn || reloj().toISOString();
          r.mediaId = r.mediaId || null;
          estado.piezas[pieza.id] = r;
          estado.publicaciones.push(r.publicadoEn);
          resumen.publicadas.push(pieza.id);
          continue;
        }
        if (codigo !== 'FINISHED') {
          throw ErrorApi('El contenedor terminó en ' + codigo + (r.detalle ? ' (' + r.detalle + ')' : ''), { contenedor: true });
        }
        var pub = await api.post('/' + env.IG_USER_ID + '/media_publish', { creation_id: r.contenedor });
        r.estado = 'publicado';
        r.mediaId = pub.id;
        r.publicadoEn = reloj().toISOString();
        r.actualizado = r.publicadoEn;
        estado.piezas[pieza.id] = r;
        estado.publicaciones.push(r.publicadoEn);
        anotar(estado, inicio, 'Publicado ' + pieza.tipo + ' ' + pieza.id + ' (media ' + pub.id + ').');
        log('publicar-instagram: publicado ' + pieza.id + ' -> ' + pub.id);
        resumen.publicadas.push(pieza.id);
        await guardarEstado(store, estado);
      } catch (err) {
        var clase = clasificar(err);
        if (clase === 'token') { throw err; }
        if (clase === 'limite') {
          r.actualizado = inicio.toISOString();
          estado.piezas[pieza.id] = r;
          anotarError(estado, inicio, pieza.id, 'Límite de la API: ' + textoError(err));
          resumen.parada = 'limite_api';
          break;
        }
        r.intentos = (r.intentos || 0) + 1;
        r.ultimoError = textoError(err);
        r.contenedor = null;
        r.hijos = null;
        r.estado = r.intentos >= MAX_INTENTOS ? 'fallido' : 'error';
        r.actualizado = inicio.toISOString();
        estado.piezas[pieza.id] = r;
        anotarError(estado, inicio, pieza.id, 'Intento ' + r.intentos + '/' + MAX_INTENTOS + ': ' + r.ultimoError);
        log('publicar-instagram: error en ' + pieza.id + ': ' + r.ultimoError);
        resumen.errores.push(pieza.id);
      }
    }
    return resumen;
  } catch (errGlobal) {
    var clase2 = clasificar(errGlobal);
    var msg = (clase2 === 'token' ? 'Token no válido o caducado: genera uno nuevo y pégalo en IG_ACCESS_TOKEN. ' : 'Error general: ') + textoError(errGlobal);
    anotarError(estado, inicio, null, msg);
    estado.tokenInvalido = clase2 === 'token' ? inicio.toISOString() : estado.tokenInvalido || null;
    log('publicar-instagram: ' + msg);
    resumen.parada = clase2 === 'token' ? 'token' : 'error';
    return resumen;
  } finally {
    if (resumen.parada !== 'token' && resumen.modo === 'real' && resumen.parada !== 'sin_variables') { estado.tokenInvalido = null; }
    await guardarEstado(store, estado);
    try { await store.setJSON(CLAVE_BLOQUEO, { desde: '1970-01-01T00:00:00.000Z' }); } catch (e) { log('publicar-instagram: no se pudo liberar el bloqueo'); }
  }
}

// ---------- renovación del token ----------
// GET https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=...
// El token debe tener al menos 24 h y no haber caducado (dura 60 días desde cada renovación).
export async function renovarToken(ctx) {
  var env = ctx.env || {};
  var reloj = ctx.ahora || function () { return new Date(); };
  var ahora = reloj();
  var store = ctx.store;
  var estado = await leerEstado(store);
  var tok = await obtenerToken(store, env);
  if (!tok.token) {
    anotar(estado, ahora, 'Renovación del token: no hay token (falta IG_ACCESS_TOKEN).');
    await guardarEstado(store, estado);
    return { ok: false, motivo: 'sin_token' };
  }
  try {
    var q = new URLSearchParams({ grant_type: 'ig_refresh_token', access_token: tok.token });
    var res = await ctx.fetch(API_HOST + '/refresh_access_token?' + q.toString(), { method: 'GET' });
    var datos = null;
    try { datos = await res.json(); } catch (e) { datos = null; }
    if (!res.ok || !datos || !datos.access_token) {
      var err = (datos && datos.error) || {};
      throw ErrorApi(err.message || ('HTTP ' + res.status), err);
    }
    var expira = new Date(ahora.getTime() + (Number(datos.expires_in) || 0) * 1000).toISOString();
    await store.setJSON(CLAVE_TOKEN, { token: datos.access_token, renovado: ahora.toISOString(), expira: expira, desdeVariable: huella(env.IG_ACCESS_TOKEN || '') });
    estado.token = { renovado: ahora.toISOString(), expira: expira };
    anotar(estado, ahora, 'Token renovado. Caduca el ' + expira.slice(0, 10) + '.');
    await guardarEstado(store, estado);
    return { ok: true, expira: expira };
  } catch (e2) {
    anotarError(estado, ahora, null, 'Renovación del token fallida (' + tok.origen + '): ' + textoError(e2));
    await guardarEstado(store, estado);
    return { ok: false, motivo: textoError(e2) };
  }
}

// ---------- informe de estado ----------

export async function informeEstado(ctx) {
  var env = ctx.env || {};
  var reloj = ctx.ahora || function () { return new Date(); };
  var ahora = reloj();
  var estado = await leerEstado(ctx.store);
  var tok = await obtenerToken(ctx.store, env);
  publicacionesUltimas24h(estado, ahora);
  var cola = (ctx.cola || []).slice().sort(function (a, b) { return Date.parse(a.fecha) - Date.parse(b.fecha); }).map(function (p) {
    var r = estado.piezas[p.id] || {};
    var sim = estado.simulaciones[p.id] || null;
    var situacion = r.estado || (Date.parse(p.fecha) > ahora.getTime() ? 'programada' : 'vencida');
    if ((p.estado || 'programado') !== 'programado') { situacion = p.estado; }
    return {
      id: p.id,
      fecha: p.fecha,
      tipo: p.tipo,
      prueba: !!p.prueba,
      archivos: p.archivos.length,
      pie: (p.pie || '').split('\n')[0].slice(0, 90),
      estado: situacion,
      intentos: r.intentos || 0,
      mediaId: r.mediaId || null,
      publicadoEn: r.publicadoEn || null,
      ultimoError: r.ultimoError || null,
      simulacion: sim
    };
  });
  return {
    generado: ahora.toISOString(),
    modo: env.IG_PUBLICAR === '1' ? 'real' : 'simulacion',
    variables: { IG_ACCESS_TOKEN: !!env.IG_ACCESS_TOKEN, IG_USER_ID: !!env.IG_USER_ID, IG_PUBLICAR: env.IG_PUBLICAR === '1' },
    token: { origen: tok.origen, renovado: tok.renovado, expira: tok.expira, invalidoDesde: estado.tokenInvalido || null },
    publicaciones24h: estado.publicaciones.length,
    cuota: estado.cuota || null,
    ultimaEjecucion: estado.ultimaEjecucion,
    cola: cola,
    ultimosErrores: estado.errores.slice(0, 15),
    registro: estado.registro.slice(0, 25)
  };
}
