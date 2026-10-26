// Inscripciones al reto (lista de espera de la web y altas de la app) guardadas en el servidor.
// Colección inscritos/{id}: id = hash del correo (no se repite nadie), dorsal dentro de su grupo,
// código propio para invitar (ref) y quién le invitó, y el estado de cada correo de la secuencia.
// Contador por grupo en grupos_inscritos/{fecha} { n } para dar el dorsal sin repetirlo.
// Solo lo escriben las funciones (firebase-admin); las reglas lo dejan cerrado al cliente.
import { createHash, randomBytes } from 'node:crypto';
import config from '../../src/config.js';
import { fechaEnZona, proximosGrupos, esGrupoValido } from '../../src/lib/grupos.js';
import { buscarHabito } from '../../src/datos/habitos.js';

var ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function idDe(email) {
  return createHash('sha256').update(String(email || '').trim().toLowerCase(), 'utf8').digest('hex').slice(0, 24);
}

export function codigoNuevo() {
  var b = randomBytes(6);
  var c = '';
  for (var i = 0; i < 6; i++) { c = c + ALFABETO.charAt(b[i] % ALFABETO.length); }
  return c;
}

export function codigoValido(c) {
  return typeof c === 'string' && /^[A-HJ-NP-Z2-9]{6}$/.test(c);
}

// 'maria.perez93@gmail.com' → 'Maria' (para saludar a quien entra por la app sin dar su nombre).
export function nombreDeCorreo(email) {
  var base = String(email || '').split('@')[0].split(/[._\-+0-9]/)[0];
  return base ? base.charAt(0).toUpperCase() + base.slice(1).toLowerCase() : '';
}

export function tokenNuevo() {
  return randomBytes(16).toString('hex');
}

export function emailValido(e) {
  return typeof e === 'string' && e.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

// Grupos que se pueden pedir desde la web: los 'elegibles' próximos.
export function grupoPedido(hoy, pedido) {
  var lista = proximosGrupos(hoy, config.grupos.elegibles);
  return lista.indexOf(pedido) !== -1 ? pedido : lista[0];
}

// Lo que se enseña de una inscripción (al navegador con su token o en el panel).
export function resumen(d) {
  var h = buscarHabito(d.habito);
  return {
    nombre: d.nombre,
    dorsal: d.dorsal || null,
    grupo: d.grupo,
    plazas: config.grupos.plazas,
    habito: h.id,
    habitoNombre: h.nombre,
    habitoCorto: h.corto,
    codigo: d.codigo
  };
}

// Crea la inscripción o devuelve la existente (mismo correo = misma plaza y mismo dorsal).
// entrada: { nombre, email, habito, grupo, acompanamiento, invitadoPor, origen, via }
// Devuelve { id, datos, nuevo, cambioGrupo }.
export async function inscribir(fire, entrada, instante) {
  var hoy = fechaEnZona(instante || new Date());
  var ahora = (instante || new Date()).toISOString();
  var email = String(entrada.email).trim().toLowerCase();
  var id = idDe(email);
  var ref = fire.db.collection('inscritos').doc(id);
  var pedido = grupoPedido(hoy, entrada.grupo);
  var habito = buscarHabito(entrada.habito).id;

  return fire.db.runTransaction(async function (tx) {
    var actual = await tx.get(ref);
    if (actual.exists) {
      var previo = actual.data();
      // Ya estaba: se actualiza lo que puede cambiar y conserva plaza, dorsal y código.
      // Si su grupo ya pasó (se apuntó hace tiempo y no empezó), se le da plaza en el siguiente.
      var cambios = { nombre: entrada.nombre || previo.nombre, habito: habito, actualizado: ahora, baja: false };
      if (entrada.acompanamiento) { cambios.acompanamiento = true; }
      if (esGrupoValido(previo.grupo) && previo.grupo > hoy) {
        tx.set(ref, cambios, { merge: true });
        return { id: id, datos: Object.assign({}, previo, cambios), nuevo: false, cambioGrupo: false };
      }
    }
    // Plaza nueva: primer grupo desde el pedido con dorsal libre.
    var candidatos = proximosGrupos(hoy, 12).filter(function (g) { return g >= pedido; });
    var elegido = null;
    var dorsal = 0;
    for (var i = 0; i < candidatos.length && !elegido; i++) {
      var cref = fire.db.collection('grupos_inscritos').doc(candidatos[i]);
      var c = await tx.get(cref);
      var n = c.exists ? (c.data().n || 0) : 0;
      if (n < config.grupos.plazas) {
        elegido = candidatos[i];
        dorsal = n + 1;
        tx.set(cref, { n: dorsal, actualizado: ahora }, { merge: true });
      }
    }
    if (!elegido) { throw new Error('sin_plazas'); }
    var datos;
    if (actual.exists) {
      datos = Object.assign({}, actual.data(), {
        nombre: entrada.nombre || actual.data().nombre, habito: habito, grupo: elegido, dorsal: dorsal,
        grupoPrevio: actual.data().grupo || null, actualizado: ahora, baja: false, correos: {}
      });
    } else {
      datos = {
        nombre: String(entrada.nombre || nombreDeCorreo(email)).slice(0, 60),
        email: email,
        habito: habito,
        grupo: elegido,
        dorsal: dorsal,
        codigo: codigoNuevo(),
        token: tokenNuevo(),
        invitadoPor: codigoValido(entrada.invitadoPor) ? entrada.invitadoPor : null,
        origen: String(entrada.origen || 'directo').replace(/[^a-z0-9_-]/g, '').slice(0, 20) || 'directo',
        via: entrada.via === 'app' ? 'app' : 'web',
        acompanamiento: Boolean(entrada.acompanamiento),
        creado: ahora,
        actualizado: ahora,
        baja: false,
        correos: {},
        compartidos: 0
      };
    }
    tx.set(ref, datos);
    return { id: id, datos: datos, nuevo: !actual.exists, cambioGrupo: elegido !== pedido };
  });
}

// Lee una inscripción comprobando su token (para la pantalla de compartir y la baja).
export async function leerConToken(fire, id, token) {
  if (!fire || !/^[a-f0-9]{24}$/.test(String(id)) || !/^[a-f0-9]{32}$/.test(String(token))) { return null; }
  var d = await fire.db.collection('inscritos').doc(id).get();
  if (!d.exists || d.data().token !== token) { return null; }
  return d;
}
