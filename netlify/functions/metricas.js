// Métricas de solo lectura. Acceso:
// - Authorization: Bearer <METRICAS_TOKEN> (tarea semanal): solo agregados, sin correos.
// - Token de Firebase de un propietario (panel /app/admin): agregados + detalle de inscritos y leads.
// Todo se desglosa por grupo (porGrupo). Quien aún no tiene grupo válido (inscrito antes de
// los grupos quincenales y sin volver a entrar) sale como 'pendiente': se le asigna al entrar.
import { timingSafeEqual } from 'node:crypto';
import { json } from '../lib/http.js';
import { verificarUsuario, tokenDeCabecera } from '../lib/auth.js';
import { obtenerDb } from '../lib/admin.js';
import { esPropietario } from '../lib/propietarios.js';
import { estadoReto, calcularRacha } from '../../src/lib/reto.js';
import { esGrupoValido, fechaEnZona, proximosGrupos } from '../../src/lib/grupos.js';
import config from '../../src/config.js';
import { buscarHabito } from '../../src/datos/habitos.js';
import { estadosPuente } from '../lib/puente.js';
import { proveedor, remitente, TIPOS, diagnosticoClave } from '../lib/correos.js';

function mismoToken(a, b) {
  var x = Buffer.from(String(a));
  var y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

function media(lista) {
  if (!lista.length) { return null; }
  var s = 0;
  lista.forEach(function (v) { s = s + v; });
  return Math.round((s / lista.length) * 100) / 100;
}

export default async function handler(req) {
  if (req.method !== 'GET') { return json(405, { error: 'metodo' }); }
  var token = tokenDeCabecera(req);
  var conDetalle = false;
  var esperado = process.env.METRICAS_TOKEN;
  if (esperado && token && mismoToken(token, esperado)) {
    conDetalle = false;
  } else {
    var acceso = await verificarUsuario(req);
    if (acceso.error) { return acceso.error; }
    if (!esPropietario(acceso.usuario)) { return json(403, { error: 'sin_permiso' }); }
    conDetalle = true;
  }

  return calcularMetricas(conDetalle);
}

// También la usa pulso-metricas (solo agregados, sin datos personales).
export async function calcularMetricas(conDetalle) {
  var estado = estadoReto(new Date(), null);
  var fire = await obtenerDb();
  if (!fire) { return json(503, { error: 'sin_firestore', estado: estado }); }

  try {
    var usuarios = await fire.db.collection('usuarios').get();
    var checkins = await fire.db.collectionGroup('checkins').get();
    var tests = await fire.db.collectionGroup('srbai').get();
    var leads = await fire.db.collection('leads').get();
    var listaSnap = await fire.db.collection('inscritos').get();

    var porUsuario = {};
    checkins.forEach(function (d) {
      var uid = d.ref.parent.parent.id;
      if (!porUsuario[uid]) { porUsuario[uid] = {}; }
      porUsuario[uid][d.id] = d.data();
    });
    var srbaiPorDia = { '0': [], '7': [], '21': [] };
    var srbaiPorUsuario = {};
    tests.forEach(function (d) {
      var uid = d.ref.parent.parent.id;
      var m = d.data().media;
      if (srbaiPorDia[d.id] && typeof m === 'number') { srbaiPorDia[d.id].push(m); }
      if (!srbaiPorUsuario[uid]) { srbaiPorUsuario[uid] = {}; }
      srbaiPorUsuario[uid][d.id] = m;
    });

    var adherencias = [];
    var inscritos = [];
    var porHabito = {};
    var porGrupo = {};
    function bloque(clave) {
      if (!porGrupo[clave]) {
        var e = clave === 'pendiente' ? null : estadoReto(new Date(), clave);
        porGrupo[clave] = {
          grupo: clave,
          fase: e ? e.fase : 'pendiente',
          dia: e ? e.dia : null,
          diasHastaInicio: e ? e.diasHastaInicio : null,
          plazas: config.grupos.plazas,
          registrados: 0,
          inscritos: 0,
          checkins: 0,
          calentamiento: 0,
          leads: 0,
          adherencias: [],
          srbai: { '0': [], '7': [], '21': [] }
        };
      }
      return porGrupo[clave];
    }
    // Los dos próximos grupos aparecen siempre, aunque estén vacíos.
    proximosGrupos(fechaEnZona(new Date()), config.grupos.elegibles).forEach(bloque);
    var grupoDe = {};

    usuarios.forEach(function (d) {
      var p = d.data();
      var clave = esGrupoValido(p.grupo) ? p.grupo : 'pendiente';
      grupoDe[d.id] = clave;
      var b = bloque(clave);
      b.registrados = b.registrados + 1;
      if (!p.habito) { return; }
      var e = clave === 'pendiente' ? estado : estadoReto(new Date(), clave);
      porHabito[p.habito] = (porHabito[p.habito] || 0) + 1;
      var r = calcularRacha(p.habito, porUsuario[d.id] || {}, e.dia, e.grupo);
      var nCheckins = Object.keys(porUsuario[d.id] || {}).length;
      var nCalentamiento = p.calentamiento ? Object.keys(p.calentamiento).length : 0;
      b.inscritos = b.inscritos + 1;
      b.checkins = b.checkins + nCheckins;
      b.calentamiento = b.calentamiento + nCalentamiento;
      if (e.fase !== 'antes') { adherencias.push(r.adherencia); b.adherencias.push(r.adherencia); }
      var su = srbaiPorUsuario[d.id] || {};
      ['0', '7', '21'].forEach(function (k) { if (typeof su[k] === 'number') { b.srbai[k].push(su[k]); } });
      inscritos.push({
        uid: d.id.slice(0, 8),
        email: conDetalle ? (p.email || '') : undefined,
        grupo: clave,
        habito: buscarHabito(p.habito).corto,
        racha: r.racha,
        adherencia: r.adherencia,
        checkins: nCheckins,
        calentamiento: nCalentamiento,
        srbai: su,
        alta: p.alta || ''
      });
    });
    leads.forEach(function (d) {
      var clave = grupoDe[d.id] || 'pendiente';
      var b = bloque(clave);
      b.leads = b.leads + 1;
    });

    var grupos = Object.keys(porGrupo).sort().map(function (k) {
      var b = porGrupo[k];
      return {
        grupo: b.grupo,
        fase: b.fase,
        dia: b.dia,
        diasHastaInicio: b.diasHastaInicio,
        plazas: b.plazas,
        registrados: b.registrados,
        inscritos: b.inscritos,
        checkins: b.checkins,
        calentamiento: b.calentamiento,
        leads: b.leads,
        adherenciaMedia: media(b.adherencias),
        srbaiMedio: { '0': media(b.srbai['0']), '7': media(b.srbai['7']), '21': media(b.srbai['21']) }
      };
    });

    // Lista de plazas (web y app): dorsales por grupo, invitaciones, compartidos y correos.
    var lista = { erroresCorreo: {}, total: 0, bajas: 0, web: 0, app: 0, invitados: 0, quienesComparten: 0, compartidos: 0, canales: {}, porGrupo: {}, porOrigen: {}, correos: {}, correo: { proveedor: proveedor(), remitente: remitente(), clave: diagnosticoClave() } };
    TIPOS.forEach(function (t) { lista.correos[t] = { enviados: 0, pendientes: 0, fallidos: 0 }; });
    var nombrePorCodigo = {};
    var trajo = {};
    listaSnap.forEach(function (d) {
      var x = d.data();
      if (x.codigo) { nombrePorCodigo[x.codigo] = x.nombre; }
      if (x.invitadoPor && !x.baja) { trajo[x.invitadoPor] = (trajo[x.invitadoPor] || 0) + 1; }
    });
    var detalleLista = [];
    listaSnap.forEach(function (d) {
      var x = d.data();
      if (x.baja) { lista.bajas = lista.bajas + 1; return; }
      lista.total = lista.total + 1;
      if (x.via === 'app') { lista.app = lista.app + 1; } else { lista.web = lista.web + 1; }
      if (x.invitadoPor) { lista.invitados = lista.invitados + 1; }
      if (x.compartidos) { lista.quienesComparten = lista.quienesComparten + 1; lista.compartidos = lista.compartidos + x.compartidos; }
      Object.keys(x.canales || {}).forEach(function (c) { lista.canales[c] = (lista.canales[c] || 0) + x.canales[c]; });
      lista.porGrupo[x.grupo] = (lista.porGrupo[x.grupo] || 0) + 1;
      lista.porOrigen[x.origen || 'directo'] = (lista.porOrigen[x.origen || 'directo'] || 0) + 1;
      TIPOS.forEach(function (t) {
        var c = (x.correos || {})[t];
        if (!c) { return; }
        if (c.ok) { lista.correos[t].enviados = lista.correos[t].enviados + 1; }
        else if (c.motivo === 'sin_configurar') { lista.correos[t].pendientes = lista.correos[t].pendientes + 1; }
        else {
          lista.correos[t].fallidos = lista.correos[t].fallidos + 1;
          // Motivo sin correos de nadie (para diagnosticar desde las cifras públicas).
          var m = String(c.motivo || 'desconocido').replace(/[^\s@"']+@[^\s@"']+/g, '[correo]').slice(0, 140);
          lista.erroresCorreo[m] = (lista.erroresCorreo[m] || 0) + 1;
        }
      });
      if (conDetalle) {
        detalleLista.push({
          nombre: x.nombre, email: x.email, grupo: x.grupo, dorsal: x.dorsal, habito: buscarHabito(x.habito).corto,
          via: x.via, origen: x.origen, creado: x.creado, acompanamiento: Boolean(x.acompanamiento),
          invitadoPor: x.invitadoPor ? (nombrePorCodigo[x.invitadoPor] || x.invitadoPor) : null,
          trajo: trajo[x.codigo] || 0, compartidos: x.compartidos || 0,
          correos: TIPOS.filter(function (t) { return x.correos && x.correos[t] && x.correos[t].ok; }),
          errorCorreo: TIPOS.map(function (t) { var c = x.correos && x.correos[t]; return c && !c.ok && c.motivo !== 'sin_configurar' ? t + ': ' + c.motivo : ''; }).filter(Boolean).join(' · ')
        });
      }
    });
    detalleLista.sort(function (a, b) { return String(b.creado).localeCompare(String(a.creado)); });

    var cuerpo = {
      generado: new Date().toISOString(),
      lista: lista,
      estado: estado,
      inscritos: inscritos.length,
      registrados: usuarios.size,
      porHabito: porHabito,
      porGrupo: grupos,
      checkins: checkins.size,
      adherenciaMedia: media(adherencias),
      srbaiMedio: { '0': media(srbaiPorDia['0']), '7': media(srbaiPorDia['7']), '21': media(srbaiPorDia['21']) },
      srbaiRespuestas: { '0': srbaiPorDia['0'].length, '7': srbaiPorDia['7'].length, '21': srbaiPorDia['21'].length },
      leads: leads.size,
      // Embudo hasta el acompañamiento: cuántos se derivaron, con reunión y que contratan.
      derivados: await estadosPuente()
    };
    if (conDetalle) {
      cuerpo.detalleInscritos = inscritos;
      cuerpo.detalleLista = detalleLista;
      cuerpo.detalleLeads = [];
      leads.forEach(function (d) {
        var l = d.data();
        cuerpo.detalleLeads.push({ grupo: l.grupo || grupoDe[d.id] || 'pendiente', email: l.email, fecha: l.fecha, resumen: l.resumen, habito: l.datos && l.datos.habito, adherencia: l.datos && l.datos.adherencia, consentimiento: l.consentimiento && l.consentimiento.version, estado: l.estado });
      });
    }
    return json(200, cuerpo);
  } catch (e) {
    console.error('metricas: error', e && e.message);
    return json(500, { error: 'interno' });
  }
}
