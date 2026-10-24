// Grupos en el servidor: plazas ocupadas por grupo y grupo de cada persona.
// Compatibilidad: quien se inscribió antes de los grupos quincenales no tiene grupo
// válido (no lo tiene o tiene '2026-12-01'); la primera vez que la app llama al
// servidor se le asigna el primer grupo con plazas y se guarda (con merge).
import config from '../../src/config.js';
import { fechaEnZona, esGrupoValido, proximosGrupos, opcionesGrupo, asignarGrupo } from '../../src/lib/grupos.js';
import { estadoReto } from '../../src/lib/reto.js';
import { esPropietario } from './propietarios.js';

export async function plazasOcupadas(fire, fecha) {
  if (!fire) { return 0; }
  var total = await fire.db.collection('usuarios').where('grupo', '==', fecha).count().get();
  return total.data().count;
}

// Ocupación de los próximos grupos hasta encontrar 'cuantos' con plazas (máximo 12 consultas).
export async function ocupacionProxima(fire, hoy, cuantos) {
  var ocupacion = {};
  var candidatos = proximosGrupos(hoy, 12);
  var conPlazas = 0;
  for (var i = 0; i < candidatos.length && conPlazas < (cuantos || config.grupos.elegibles); i++) {
    var n = await plazasOcupadas(fire, candidatos[i]);
    ocupacion[candidatos[i]] = n;
    if (n < config.grupos.plazas) { conPlazas = conPlazas + 1; }
  }
  return ocupacion;
}

export async function opcionesConPlazas(fire, hoy) {
  var ocupacion = await ocupacionProxima(fire, hoy, config.grupos.elegibles);
  return opcionesGrupo(hoy, ocupacion, config.grupos.elegibles, config.grupos.plazas);
}

// Elige grupo para una persona: los propietarios no ocupan plaza ni se quedan fuera.
export async function elegirGrupo(fire, usuario, hoy, preferido) {
  var ocupacion = esPropietario(usuario) ? {} : await ocupacionProxima(fire, hoy, config.grupos.elegibles);
  return asignarGrupo(hoy, ocupacion, preferido, config.grupos.plazas);
}

// Grupo efectivo de una persona ya dada de alta. Si no tiene uno válido, se le asigna
// el primer grupo con plazas y se guarda. Devuelve { grupo, estado, asignadoAhora }.
export async function grupoDePersona(fire, usuario, perfil, instante) {
  var p = perfil || {};
  var hoy = fechaEnZona(instante || new Date());
  if (esGrupoValido(p.grupo)) {
    return { grupo: p.grupo, estado: estadoReto(instante, p.grupo), asignadoAhora: false };
  }
  if (!fire || !p.alta) {
    // Sin Firestore o sin alta: se usa el próximo grupo sin guardar nada.
    return { grupo: null, estado: estadoReto(instante, null), asignadoAhora: false };
  }
  var grupo = await elegirGrupo(fire, usuario, hoy, null);
  var cambios = { grupo: grupo, grupoAsignado: new Date().toISOString(), grupoOrigen: 'automatico' };
  if (p.grupo) { cambios.grupoPrevio = String(p.grupo); }
  await fire.db.collection('usuarios').doc(usuario.uid).set(cambios, { merge: true });
  return { grupo: grupo, estado: estadoReto(instante, grupo), asignadoAhora: true };
}
