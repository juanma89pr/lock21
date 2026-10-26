// Solo el propietario: trae a inscritos las plazas que se pidieron antes de que existiera el
// registro en el servidor (estaban solo en Netlify Forms). Cada una recibe su dorsal en el orden
// en que se pidió y la bienvenida (al momento si los correos están activos; si no, cuando lo estén).
import { json, leerJson } from '../lib/http.js';
import { verificarUsuario } from '../lib/auth.js';
import { obtenerDb } from '../lib/admin.js';
import { esPropietario } from '../lib/propietarios.js';
import { inscribir, idDe } from '../lib/inscritos.js';
import { plazasDeTexto } from '../lib/importar.js';
import { enviar, anotar } from '../lib/correos.js';
import { fechaEnZona } from '../../src/lib/grupos.js';

export default async function handler(req) {
  if (req.method !== 'POST') { return json(405, { error: 'metodo' }); }
  var acceso = await verificarUsuario(req);
  if (acceso.error) { return acceso.error; }
  if (!esPropietario(acceso.usuario)) { return json(403, { error: 'sin_permiso' }); }
  var cuerpo = await leerJson(req, 200000);
  if (cuerpo.error) { return json(400, { error: cuerpo.error }); }
  var fire = await obtenerDb();
  if (!fire) { return json(503, { error: 'sin_firestore' }); }
  var plazas = plazasDeTexto(cuerpo.datos.texto).slice(0, 200);
  if (!plazas.length) { return json(400, { error: 'sin_plazas_en_el_texto' }); }
  var hoy = fechaEnZona(new Date());
  var resultado = [];
  for (var i = 0; i < plazas.length; i++) {
    var p = plazas[i];
    try {
      var existe = (await fire.db.collection('inscritos').doc(idDe(p.email)).get()).exists;
      if (existe) { resultado.push({ email: p.email, nombre: p.nombre, ya: true }); continue; }
      var r = await inscribir(fire, {
        nombre: p.nombre, email: p.email, habito: p.habito, grupo: p.grupo,
        acompanamiento: p.acompanamiento, origen: 'importado', via: 'web'
      });
      await fire.db.collection('inscritos').doc(r.id).set({ importado: true, pedidoEn: p.fecha || null }, { merge: true });
      var envio = await enviar('bienvenida', r.id, r.datos, hoy);
      await fire.db.collection('inscritos').doc(r.id).set({ correos: { bienvenida: anotar(r.datos, 'bienvenida', envio, new Date().toISOString()) } }, { merge: true });
      resultado.push({ email: p.email, nombre: r.datos.nombre, dorsal: r.datos.dorsal, grupo: r.datos.grupo, correo: envio.ok ? 'enviado' : (envio.motivo === 'sin_configurar' ? 'pendiente' : envio.motivo) });
    } catch (e) {
      resultado.push({ email: p.email, nombre: p.nombre, error: String(e && e.message).slice(0, 80) });
    }
  }
  return json(200, { ok: true, resultado: resultado });
}
