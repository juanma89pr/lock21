// Alta y perfil del participante. Todas las escrituras pasan por aquí (el cliente
// no escribe en Firestore). POST { tipo: 'alta', ... } registra mayoría de edad,
// privacidad y aviso de IA con versión y hash. POST { tipo: 'habito', ... } guarda
// el hábito, la señal y la versión mínima (solo hasta el día 1 de su grupo).
// POST { tipo: 'grupo', grupo } cambia a otro de los próximos grupos con plazas.
// GET (sin sesión): próximos grupos que se pueden elegir y plazas libres.
// Grupos: uno cada dos semanas (src/lib/grupos.js), 30 plazas cada uno.
import { createHash } from 'node:crypto';
import { json, leerJson, recortar } from '../lib/http.js';
import { verificarUsuario } from '../lib/auth.js';
import { obtenerDb, leerUsuario } from '../lib/admin.js';
import { esPropietario } from '../lib/propietarios.js';
import { opcionesConPlazas, elegirGrupo, grupoDePersona } from '../lib/grupos.js';
import { estadoReto } from '../../src/lib/reto.js';
import { fechaEnZona, esGrupoValido } from '../../src/lib/grupos.js';
import { PRIVACIDAD, MAYOR_EDAD, AVISO_IA } from '../../src/lib/consentimientos.js';
import config from '../../src/config.js';
import HABITOS from '../../src/datos/habitos.js';
import { inscribir } from '../lib/inscritos.js';
import { enviar, anotar } from '../lib/correos.js';

function hash(texto) {
  return createHash('sha256').update(texto, 'utf8').digest('hex');
}

function registro(c, ahora) {
  return { version: c.version, hash: hash(c.texto), fecha: ahora };
}

export default async function handler(req) {
  var fire = await obtenerDb();
  var hoy = fechaEnZona(new Date());
  if (req.method === 'GET') {
    try {
      var opciones = await opcionesConPlazas(fire, hoy);
      return json(200, { hoy: hoy, plazas: config.grupos.plazas, opciones: opciones, exacto: Boolean(fire) });
    } catch (e) {
      console.error('perfil: error en opciones', e && e.message);
      return json(500, { error: 'interno' });
    }
  }
  if (req.method !== 'POST') { return json(405, { error: 'metodo' }); }
  var acceso = await verificarUsuario(req);
  if (acceso.error) { return acceso.error; }
  var u = acceso.usuario;
  var cuerpo = await leerJson(req, 4000);
  if (cuerpo.error) { return json(400, { error: cuerpo.error }); }
  var d = cuerpo.datos;
  var ahora = new Date().toISOString();
  var cambios = null;
  var estado = null;

  try {
    var guardado = await leerUsuario(fire, u.uid);
    var actual = guardado ? guardado.perfil : (d.perfil || {});

    if (d.tipo === 'alta') {
      if (d.mayorEdad !== true || d.privacidad !== true || d.avisoIa !== true) {
        return json(400, { error: 'faltan_aceptaciones' });
      }
      if (d.versiones && (d.versiones.privacidad !== PRIVACIDAD.version || d.versiones.edad !== MAYOR_EDAD.version || d.versiones.ia !== AVISO_IA.version)) {
        return json(409, { error: 'version_desfasada' });
      }
      // Quien ya tiene grupo válido lo conserva; si no, el elegido si le quedan plazas
      // o, si se ha llenado, el siguiente con plazas.
      var grupo = esGrupoValido(actual.grupo) && guardado ? actual.grupo : await elegirGrupo(fire, u, hoy, d.grupo);
      if (!grupo) { return json(409, { error: 'grupo_completo' }); }
      cambios = {
        email: u.email,
        alta: actual.alta || ahora,
        grupo: grupo,
        aceptaciones: {
          edad: registro(MAYOR_EDAD, ahora),
          privacidad: registro(PRIVACIDAD, ahora),
          avisoIa: registro(AVISO_IA, ahora)
        }
      };
      if (d.grupo && d.grupo !== grupo) { cambios.grupoPedido = String(d.grupo).slice(0, 10); }
      estado = estadoReto(new Date(), grupo);
    } else if (d.tipo === 'grupo') {
      if (!actual.alta) { return json(409, { error: 'sin_alta' }); }
      var previo = await grupoDePersona(fire, u, actual);
      var sinEmpezar = previo.estado.fase === 'antes' || !guardado || Object.keys(guardado.checkins).length === 0;
      if (!sinEmpezar) { return json(409, { error: 'grupo_en_marcha', estado: previo.estado }); }
      var nuevo = await elegirGrupo(fire, u, hoy, d.grupo);
      if (!nuevo || nuevo !== d.grupo) { return json(409, { error: 'grupo_completo', estado: previo.estado }); }
      cambios = { grupo: nuevo, grupoCambiado: ahora, grupoOrigen: 'elegido' };
      estado = estadoReto(new Date(), nuevo);
    } else if (d.tipo === 'habito') {
      var valido = false;
      HABITOS.forEach(function (h) { if (h.id === d.habito) { valido = true; } });
      var senal = recortar(d.senal, 160);
      var accion = recortar(d.accion, 160);
      var minima = recortar(d.minima, 160);
      if (!valido || !senal || !accion || !minima) { return json(400, { error: 'datos_incompletos' }); }
      estado = (await grupoDePersona(fire, u, actual)).estado;
      if (estado.dia > 1) { return json(409, { error: 'habito_cerrado', estado: estado }); }
      cambios = { habito: d.habito, senal: senal, accion: accion, minima: minima, habitoFecha: ahora };
    } else {
      return json(400, { error: 'tipo' });
    }

    if (fire) {
      await fire.db.collection('usuarios').doc(u.uid).set(cambios, { merge: true });
    }
    // Quien entra directo en la app también recibe su dorsal y la secuencia de correos.
    if (fire && d.tipo === 'alta' && !actual.alta && u.email && !esPropietario(u)) {
      try {
        var ins = await inscribir(fire, { email: u.email, nombre: '', habito: actual.habito, grupo: cambios.grupo, via: 'app', origen: 'app' });
        if (ins.nuevo) {
          var envio = await enviar('bienvenida', ins.id, ins.datos, hoy);
          await fire.db.collection('inscritos').doc(ins.id).set({ correos: { bienvenida: anotar(ins.datos, 'bienvenida', envio, ahora) } }, { merge: true });
        }
      } catch (eIns) {
        console.error('perfil: no se pudo inscribir', eIns && eIns.message);
      }
    }
    return json(200, { ok: true, guardado: Boolean(fire), estado: estado, perfil: cambios });
  } catch (e) {
    console.error('perfil: error', e && e.message);
    return json(500, { error: 'interno' });
  }
}
