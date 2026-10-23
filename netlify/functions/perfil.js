// Alta y perfil del participante. Todas las escrituras pasan por aquí (el cliente
// no escribe en Firestore). POST { tipo: 'alta', ... } registra mayoría de edad,
// privacidad y aviso de IA con versión y hash. POST { tipo: 'habito', ... } guarda
// el hábito, la señal y la versión mínima (solo hasta el día 1 del reto).
import { createHash } from 'node:crypto';
import { json, leerJson, recortar } from '../lib/http.js';
import { verificarUsuario } from '../lib/auth.js';
import { obtenerDb } from '../lib/admin.js';
import { esPropietario } from '../lib/propietarios.js';
import { estadoReto } from '../../src/lib/reto.js';
import { PRIVACIDAD, MAYOR_EDAD, AVISO_IA } from '../../src/lib/consentimientos.js';
import config from '../../src/config.js';
import HABITOS from '../../src/datos/habitos.js';

function hash(texto) {
  return createHash('sha256').update(texto, 'utf8').digest('hex');
}

function registro(c, ahora) {
  return { version: c.version, hash: hash(c.texto), fecha: ahora };
}

export default async function handler(req) {
  if (req.method !== 'POST') { return json(405, { error: 'metodo' }); }
  var acceso = await verificarUsuario(req);
  if (acceso.error) { return acceso.error; }
  var u = acceso.usuario;
  var cuerpo = await leerJson(req, 4000);
  if (cuerpo.error) { return json(400, { error: cuerpo.error }); }
  var d = cuerpo.datos;
  var estado = estadoReto(new Date());
  var ahora = new Date().toISOString();
  var fire = await obtenerDb();
  var cambios = null;

  if (d.tipo === 'alta') {
    if (d.mayorEdad !== true || d.privacidad !== true || d.avisoIa !== true) {
      return json(400, { error: 'faltan_aceptaciones' });
    }
    if (d.versiones && (d.versiones.privacidad !== PRIVACIDAD.version || d.versiones.edad !== MAYOR_EDAD.version || d.versiones.ia !== AVISO_IA.version)) {
      return json(409, { error: 'version_desfasada' });
    }
    cambios = {
      email: u.email,
      alta: ahora,
      grupo: config.grupo.inicio,
      aceptaciones: {
        edad: registro(MAYOR_EDAD, ahora),
        privacidad: registro(PRIVACIDAD, ahora),
        avisoIa: registro(AVISO_IA, ahora)
      }
    };
    if (fire) {
      // Cupo del grupo: los propietarios no cuentan.
      var ref = fire.db.collection('usuarios').doc(u.uid);
      var actual = await ref.get();
      if (!actual.exists && !esPropietario(u)) {
        var total = await fire.db.collection('usuarios').where('grupo', '==', config.grupo.inicio).count().get();
        if (total.data().count >= config.grupo.plazas) { return json(409, { error: 'grupo_completo' }); }
      }
    }
  } else if (d.tipo === 'habito') {
    var valido = false;
    HABITOS.forEach(function (h) { if (h.id === d.habito) { valido = true; } });
    var senal = recortar(d.senal, 160);
    var accion = recortar(d.accion, 160);
    var minima = recortar(d.minima, 160);
    if (!valido || !senal || !accion || !minima) { return json(400, { error: 'datos_incompletos' }); }
    if (estado.dia > 1) { return json(409, { error: 'habito_cerrado', estado: estado }); }
    cambios = { habito: d.habito, senal: senal, accion: accion, minima: minima, habitoFecha: ahora };
  } else {
    return json(400, { error: 'tipo' });
  }

  try {
    if (fire) {
      await fire.db.collection('usuarios').doc(u.uid).set(cambios, { merge: true });
    }
    return json(200, { ok: true, guardado: Boolean(fire), estado: estado, perfil: cambios });
  } catch (e) {
    console.error('perfil: error', e && e.message);
    return json(500, { error: 'interno' });
  }
}
