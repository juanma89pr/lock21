// Métricas de solo lectura. Acceso:
// - Authorization: Bearer <METRICAS_TOKEN> (tarea semanal): solo agregados, sin correos.
// - Token de Firebase de un propietario (panel /app/admin): agregados + detalle de inscritos y leads.
import { timingSafeEqual } from 'node:crypto';
import { json } from '../lib/http.js';
import { verificarUsuario, tokenDeCabecera } from '../lib/auth.js';
import { obtenerDb } from '../lib/admin.js';
import { esPropietario } from '../lib/propietarios.js';
import { estadoReto, calcularRacha } from '../../src/lib/reto.js';
import { buscarHabito } from '../../src/datos/habitos.js';

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

  var estado = estadoReto(new Date());
  var fire = await obtenerDb();
  if (!fire) { return json(503, { error: 'sin_firestore', estado: estado }); }

  try {
    var usuarios = await fire.db.collection('usuarios').get();
    var checkins = await fire.db.collectionGroup('checkins').get();
    var tests = await fire.db.collectionGroup('srbai').get();
    var leads = await fire.db.collection('leads').get();

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
    usuarios.forEach(function (d) {
      var p = d.data();
      if (!p.habito) { return; }
      porHabito[p.habito] = (porHabito[p.habito] || 0) + 1;
      var r = calcularRacha(p.habito, porUsuario[d.id] || {}, estado.dia);
      if (estado.fase !== 'antes') { adherencias.push(r.adherencia); }
      inscritos.push({
        uid: d.id.slice(0, 8),
        email: conDetalle ? (p.email || '') : undefined,
        habito: buscarHabito(p.habito).corto,
        racha: r.racha,
        adherencia: r.adherencia,
        checkins: Object.keys(porUsuario[d.id] || {}).length,
        srbai: srbaiPorUsuario[d.id] || {},
        alta: p.alta || ''
      });
    });

    var cuerpo = {
      generado: new Date().toISOString(),
      estado: estado,
      inscritos: inscritos.length,
      registrados: usuarios.size,
      porHabito: porHabito,
      checkins: checkins.size,
      adherenciaMedia: media(adherencias),
      srbaiMedio: { '0': media(srbaiPorDia['0']), '7': media(srbaiPorDia['7']), '21': media(srbaiPorDia['21']) },
      srbaiRespuestas: { '0': srbaiPorDia['0'].length, '7': srbaiPorDia['7'].length, '21': srbaiPorDia['21'].length },
      leads: leads.size
    };
    if (conDetalle) {
      cuerpo.detalleInscritos = inscritos;
      cuerpo.detalleLeads = [];
      leads.forEach(function (d) {
        var l = d.data();
        cuerpo.detalleLeads.push({ email: l.email, fecha: l.fecha, resumen: l.resumen, habito: l.datos && l.datos.habito, adherencia: l.datos && l.datos.adherencia, consentimiento: l.consentimiento && l.consentimiento.version, estado: l.estado });
      });
    }
    return json(200, cuerpo);
  } catch (e) {
    console.error('metricas: error', e && e.message);
    return json(500, { error: 'interno' });
  }
}
