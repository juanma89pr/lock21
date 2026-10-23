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
    minima: 'Me pongo las zapatillas y hago 2 minutos de sentadillas.',
    dias: [1, 3, 5]
  },
  {
    id: 'pasos',
    icono: 'pasos',
    nombre: '8.000 pasos al día',
    corto: '8.000 pasos',
    senal: 'Después de comer',
    accion: 'salgo a caminar 20 minutos antes de volver a lo mío.',
    minima: 'Bajo a la calle y camino 2 minutos.',
    dias: 'todos'
  },
  {
    id: 'dormir',
    icono: 'dormir',
    nombre: 'Acostarme antes de las 23:30',
    corto: 'Cama antes de 23:30',
    senal: 'Cuando suena la alarma de las 23:00',
    accion: 'apago la tele, me lavo los dientes y me voy a la cama.',
    minima: 'Apago la tele y me lavo los dientes.',
    dias: 'todos'
  },
  {
    id: 'movilidad',
    icono: 'movilidad',
    nombre: '10 minutos de movilidad al día',
    corto: '10 min de movilidad',
    senal: 'Después del café de la mañana',
    accion: 'hago 10 minutos de movilidad en el salón.',
    minima: 'Hago 2 minutos de círculos de cadera y hombros.',
    dias: 'todos'
  },
  {
    id: 'agua',
    icono: 'agua',
    nombre: 'Beber 2 litros de agua al día',
    corto: '2 litros de agua',
    senal: 'Después de cada comida',
    accion: 'relleno la botella de un litro y la dejo a la vista.',
    minima: 'Me bebo un vaso de agua de pie en la cocina.',
    dias: 'todos'
  },
  {
    id: 'pantalla',
    icono: 'pantalla',
    nombre: 'Sin pantalla 30 minutos antes de dormir',
    corto: 'Sin pantalla al dormir',
    senal: 'Después de lavarme los dientes',
    accion: 'dejo el móvil cargando fuera del cuarto.',
    minima: 'Pongo el móvil en modo avión y boca abajo.',
    dias: 'todos'
  }
];

export function buscarHabito(id) {
  var encontrado = HABITOS[0];
  HABITOS.forEach(function (h) { if (h.id === id) { encontrado = h; } });
  return encontrado;
}

export default HABITOS;
