// Menú cerrado de hábitos del reto. Cada uno trae una señal de ejemplo
// ("después de X, hago Y") que la persona puede cambiar el día 0.
// dias: 'todos' o lista de días de la semana (0 = domingo) en los que toca.
var HABITOS = [
  {
    id: 'entrenar',
    icono: 'entrenar',
    nombre: 'Entrenar 3 días por semana',
    corto: 'Entrenar 3 días',
    senal: 'Después de salir del trabajo el lunes, el miércoles y el viernes',
    accion: 'me cambio y entreno antes de sentarme en el sofá.',
    dias: [1, 3, 5]
  },
  {
    id: 'pasos',
    icono: 'pasos',
    nombre: '8.000 pasos al día',
    corto: '8.000 pasos',
    senal: 'Después de comer',
    accion: 'salgo a caminar 20 minutos antes de volver a lo mío.',
    dias: 'todos'
  },
  {
    id: 'dormir',
    icono: 'dormir',
    nombre: 'Acostarme antes de las 23:30',
    corto: 'Cama antes de 23:30',
    senal: 'Cuando suena la alarma de las 23:00',
    accion: 'apago la tele, me lavo los dientes y me voy a la cama.',
    dias: 'todos'
  },
  {
    id: 'movilidad',
    icono: 'movilidad',
    nombre: '10 minutos de movilidad al día',
    corto: '10 min de movilidad',
    senal: 'Después del café de la mañana',
    accion: 'hago 10 minutos de movilidad en el salón.',
    dias: 'todos'
  },
  {
    id: 'agua',
    icono: 'agua',
    nombre: 'Beber 2 litros de agua al día',
    corto: '2 litros de agua',
    senal: 'Después de cada comida',
    accion: 'relleno la botella de un litro y la dejo a la vista.',
    dias: 'todos'
  },
  {
    id: 'pantalla',
    icono: 'pantalla',
    nombre: 'Sin pantalla 30 minutos antes de dormir',
    corto: 'Sin pantalla al dormir',
    senal: 'Después de lavarme los dientes',
    accion: 'dejo el móvil cargando fuera del cuarto.',
    dias: 'todos'
  }
];

export function buscarHabito(id) {
  var encontrado = HABITOS[0];
  HABITOS.forEach(function (h) { if (h.id === id) { encontrado = h; } });
  return encontrado;
}

export default HABITOS;
