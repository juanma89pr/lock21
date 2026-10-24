// Pruebas rápidas del calendario de grupos, del día del reto por grupo y de la
// asignación de plaza (incluida la de quien se inscribió antes de los grupos).
// Sin red ni Firestore: el servidor se simula con un objeto en memoria.
import { proximosGrupos, proximoGrupo, esGrupoValido, opcionesGrupo, asignarGrupo, fechaEnZona, fechaLarga, fechaCorta, diaSemanaDe } from '../src/lib/grupos.js';
import { estadoReto, toca, calcularRacha } from '../src/lib/reto.js';
import { misionDelDia, indiceMision } from '../src/datos/calentamiento.js';
import MISIONES from '../src/datos/calentamiento.js';
import { grupoDePersona, elegirGrupo } from '../netlify/lib/grupos.js';
import { buscarHabito } from '../src/datos/habitos.js';

var fallos = [];
var bien = 0;

function igual(nombre, real, esperado) {
  var a = JSON.stringify(real);
  var b = JSON.stringify(esperado);
  if (a === b) { bien = bien + 1; } else { fallos.push(nombre + ': esperado ' + b + ', obtenido ' + a); }
}

// 1. Próximos grupos desde varias fechas de hoy.
igual('antes del primero', proximosGrupos('2026-10-24', 3), ['2026-11-16', '2026-11-30', '2026-12-14']);
igual('víspera del primero', proximosGrupos('2026-11-15', 2), ['2026-11-16', '2026-11-30']);
igual('el día que empieza el primero ya no se ofrece', proximosGrupos('2026-11-16', 2), ['2026-11-30', '2026-12-14']);
igual('a mitad de un grupo', proximosGrupos('2026-11-23', 1), ['2026-11-30']);
igual('paso de año', proximosGrupos('2026-12-31', 3), ['2027-01-11', '2027-01-25', '2027-02-08']);
igual('el 28 dic empieza un grupo', proximosGrupos('2026-12-27', 2), ['2026-12-28', '2027-01-11']);
igual('cambio de hora de marzo de 2027', proximosGrupos('2027-03-28', 2), ['2027-04-05', '2027-04-19']);
igual('todos en lunes', proximosGrupos('2026-10-24', 30).map(diaSemanaDe).filter(function (d) { return d !== 1; }), []);
igual('año bisiesto 2028 sin desfase', proximosGrupos('2028-02-20', 2).map(diaSemanaDe), [1, 1]);

// 2. Fecha de hoy en Canarias (cambio de hora: 25 oct 2026 y 28 mar 2027).
igual('23:30 UTC en verano ya es el día siguiente en Canarias', fechaEnZona(new Date('2026-10-24T23:30:00Z')), '2026-10-25');
igual('23:30 UTC en invierno sigue siendo el mismo día', fechaEnZona(new Date('2026-11-15T23:30:00Z')), '2026-11-15');
igual('próximo grupo a las 23:30 del domingo 15 nov', proximoGrupo(fechaEnZona(new Date('2026-11-15T23:30:00Z'))), '2026-11-16');
igual('próximo grupo a las 00:10 del lunes 16 nov', proximoGrupo(fechaEnZona(new Date('2026-11-16T00:10:00Z'))), '2026-11-30');
igual('noche del cambio de hora de octubre', fechaEnZona(new Date('2026-10-25T00:59:00Z')), '2026-10-25');
igual('noche del cambio de hora de marzo', fechaEnZona(new Date('2027-03-28T00:59:00Z')), '2027-03-28');

// 3. Validez de grupos (el 1 dic antiguo no vale).
igual('16 nov válido', esGrupoValido('2026-11-16'), true);
igual('11 ene 2027 válido', esGrupoValido('2027-01-11'), true);
igual('1 dic antiguo no válido', esGrupoValido('2026-12-01'), false);
igual('sin grupo no válido', esGrupoValido(undefined), false);
igual('fecha imposible', esGrupoValido('2026-11-31'), false);
igual('anterior al primero', esGrupoValido('2026-11-02'), false);

// 4. Día del reto según el grupo.
var e1 = estadoReto(new Date('2026-11-16T09:00:00Z'), '2026-11-16');
igual('día 1 del primer grupo', [e1.dia, e1.fase], [1, 'curso']);
var e2 = estadoReto(new Date('2026-11-16T09:00:00Z'), '2026-11-30');
igual('segundo grupo aún no empieza', [e2.dia, e2.fase, e2.diasHastaInicio], [-13, 'antes', 14]);
var e3 = estadoReto(new Date('2026-12-07T09:00:00Z'), '2026-11-16');
igual('día 22 = fin', [e3.dia, e3.fase], [22, 'fin']);
var e4 = estadoReto(new Date('2027-01-01T12:00:00Z'), '2026-12-28');
igual('grupo del 28 dic cruzando el año', [e4.dia, e4.fase], [5, 'curso']);
var e5 = estadoReto(new Date('2026-10-24T12:00:00Z'), '2026-12-01');
igual('grupo antiguo inválido usa el próximo', [e5.grupo, e5.asignado], ['2026-11-16', false]);
var e6 = estadoReto(new Date('2026-11-15T23:30:00Z'), '2026-11-16');
igual('víspera a las 23:30 UTC sigue siendo día 0', e6.dia, 0);

// 5. Días que tocan (entrenar L-X-V): el día 1 es lunes.
var entrenar = buscarHabito('entrenar');
igual('entrenar toca días 1, 3, 5, 8', [1, 2, 3, 4, 5, 6, 7, 8].filter(function (n) { return toca(entrenar, n, '2026-11-16'); }), [1, 3, 5, 8]);
igual('racha usa el grupo', calcularRacha('entrenar', { '1': { hecho: true }, '3': { hecho: true } }, 3, '2026-11-16').racha, 2);

// 6. Opciones y asignación de plaza (30 por grupo).
var lleno = { '2026-11-16': 30 };
igual('opciones con el primero lleno', opcionesGrupo('2026-10-24', lleno), [{ fecha: '2026-11-30', libres: 30 }, { fecha: '2026-12-14', libres: 30 }]);
igual('opciones con plazas', opcionesGrupo('2026-10-24', { '2026-11-16': 29 }), [{ fecha: '2026-11-16', libres: 1 }, { fecha: '2026-11-30', libres: 30 }]);
igual('sin preferencia, el primero con plazas', asignarGrupo('2026-10-24', {}, null), '2026-11-16');
igual('elige el segundo', asignarGrupo('2026-10-24', {}, '2026-11-30'), '2026-11-30');
igual('preferido lleno pasa al siguiente', asignarGrupo('2026-10-24', lleno, '2026-11-16'), '2026-11-30');
igual('preferido demasiado lejano no vale', asignarGrupo('2026-10-24', {}, '2027-01-11'), '2026-11-16');
igual('preferido antiguo 1 dic no vale', asignarGrupo('2026-10-24', {}, '2026-12-01'), '2026-11-16');
igual('dos llenos seguidos', asignarGrupo('2026-10-24', { '2026-11-16': 30, '2026-11-30': 31 }, null), '2026-12-14');

// 7. Servidor simulado: plazas contadas por grupo y usuario antiguo sin grupo.
function crearFire(usuarios) {
  var escrituras = [];
  return {
    escrituras: escrituras,
    db: {
      collection: function () {
        return {
          where: function (campo, op, valor) {
            return {
              count: function () {
                return {
                  get: async function () {
                    var n = Object.keys(usuarios).filter(function (k) { return usuarios[k].grupo === valor; }).length;
                    return { data: function () { return { count: n }; } };
                  }
                };
              }
            };
          },
          doc: function (uid) {
            return {
              set: async function (datos, opciones) {
                escrituras.push({ uid: uid, datos: datos, merge: opciones && opciones.merge });
                usuarios[uid] = Object.assign({}, usuarios[uid], datos);
              }
            };
          }
        };
      }
    }
  };
}

var usuarios = {};
for (var i = 0; i < 30; i++) { usuarios['u' + i] = { grupo: '2026-11-16', alta: '2026-10-20T10:00:00Z' }; }
usuarios.antiguo = { grupo: '2026-12-01', alta: '2026-10-22T10:00:00Z', habito: 'pasos' };
usuarios.sinCampo = { alta: '2026-10-22T10:00:00Z' };
var fire = crearFire(usuarios);
var persona = { uid: 'nueva', email: 'nueva@correo.es', email_verified: true };
var dueno = { uid: 'dueno', email: 'jmmoreno19@gmail.com', email_verified: true };
var instante = new Date('2026-10-24T12:00:00Z');

var r1 = await elegirGrupo(fire, persona, '2026-10-24', '2026-11-16');
igual('servidor: 16 nov lleno, pasa al 30 nov', r1, '2026-11-30');
var r2 = await elegirGrupo(fire, dueno, '2026-10-24', '2026-11-16');
igual('servidor: el propietario no se queda fuera', r2, '2026-11-16');
var r3 = await grupoDePersona(fire, { uid: 'antiguo', email: 'a@b.es' }, usuarios.antiguo, instante);
igual('antiguo con 1 dic: se le asigna el primer grupo con plazas', [r3.grupo, r3.asignadoAhora, r3.estado.grupo], ['2026-11-30', true, '2026-11-30']);
igual('antiguo: se guarda con merge y conserva el valor previo', [fire.escrituras[0].merge, fire.escrituras[0].datos.grupoPrevio, usuarios.antiguo.habito], [true, '2026-12-01', 'pasos']);
var r4 = await grupoDePersona(fire, { uid: 'sinCampo', email: 'c@d.es' }, usuarios.sinCampo, instante);
igual('antiguo sin campo de grupo: primer grupo con plazas', r4.grupo, '2026-11-30');
var r5 = await grupoDePersona(fire, { uid: 'antiguo', email: 'a@b.es' }, usuarios.antiguo, instante);
igual('segunda vez no reasigna', [r5.grupo, r5.asignadoAhora, fire.escrituras.length], ['2026-11-30', false, 2]);
var r6 = await grupoDePersona(null, { uid: 'x' }, { alta: '2026-10-22T10:00:00Z' }, instante);
igual('sin Firestore no guarda y usa el próximo grupo', [r6.grupo, r6.estado.grupo], [null, '2026-11-16']);
var r7 = await grupoDePersona(fire, { uid: 'sinAlta' }, {}, instante);
igual('sin alta no se asigna nada', [r7.grupo, fire.escrituras.length], [null, 2]);

// 8. Misiones de calentamiento.
igual('entre 10 y 14 misiones', MISIONES.length >= 10 && MISIONES.length <= 14, true);
igual('ids únicos', new Set(MISIONES.map(function (m) { return m.id; })).size, MISIONES.length);
igual('misión del día del alta es la primera', indiceMision('2026-10-24T08:00:00Z', '2026-10-24'), 0);
igual('rota cada día', indiceMision('2026-10-24T08:00:00Z', '2026-10-26'), 2);
igual('vuelve a empezar', indiceMision('2026-10-24T08:00:00Z', '2026-11-05'), 12 % MISIONES.length);
var perfil = { alta: '2026-10-24T08:00:00Z', habito: 'agua', senal: 'Después de cada comida', accion: 'relleno la botella.', minima: 'Me bebo un vaso de agua.' };
MISIONES.forEach(function (m, k) {
  var t = misionDelDia(perfil, '2026-10-' + (24 + k)).texto;
  if (!t || /undefined|null/.test(t) || /vosotros|podéis|tenéis/i.test(t)) { fallos.push('misión ' + m.id + ' mal formada: ' + t); } else { bien = bien + 1; }
});

// 9. Textos de fecha.
igual('fecha larga', fechaLarga('2026-11-16', '2026-10-24'), 'lunes 16 de noviembre');
igual('fecha larga con año', fechaLarga('2027-01-11', '2026-12-20'), 'lunes 11 de enero de 2027');
igual('fecha corta', fechaCorta('2026-11-30'), '30 nov');

if (fallos.length) {
  console.error(fallos.join('\n'));
  console.error('\n' + fallos.length + ' fallos, ' + bien + ' correctas.');
  process.exit(1);
}
console.log('Grupos: ' + bien + ' comprobaciones correctas.');
