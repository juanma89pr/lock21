// Mensajes fijos del coach cuando no hay IA (sin clave, error de la API o salida
// bloqueada por el filtro). Así la app funciona igual sin modelo.
// nivel: 'normal' (repetir), 'minimo' (versión de 2 minutos), 'subir' (afianzar).

export var RESPALDO_CHECKIN = {
  hecho: [
    { nivel: 'normal', mensaje: 'Hecho. Cada repetición en el mismo contexto le enseña a tu cabeza que esa señal va con ese hábito. Mañana, lo mismo y a la misma hora.', tareaManana: 'Repite tu señal tal cual: mismo momento, mismo sitio.' },
    { nivel: 'normal', mensaje: 'Un día más sumado. No hace falta que sea perfecto, hace falta que se repita. Vas bien.', tareaManana: 'Cuando llegue tu señal, empieza sin negociar contigo.' },
    { nivel: 'subir', mensaje: 'Si hoy te salió casi sin pensarlo, es justo lo que buscamos. Que no te pida más: la clave es la constancia, no la intensidad.', tareaManana: 'Hazlo igual que hoy y fíjate en si te sale solo.' }
  ],
  fallo: [
    { nivel: 'minimo', mensaje: 'Un fallo suelto no rompe nada: la racha se perdona una vez. La única regla es que mañana no se repita. Baja el listón y haz la versión mínima.', tareaManana: 'Haz tu versión mínima de 2 minutos justo después de tu señal.' },
    { nivel: 'minimo', mensaje: 'Pasa. Lo que cuenta es lo que haces mañana. Ponlo tan fácil que sea imposible decir que no.', tareaManana: 'Solo los 2 minutos de tu versión mínima. Nada más.' }
  ],
  alerta: [
    { nivel: 'minimo', mensaje: 'Ojo: ayer ya fue un fallo, así que hoy cuenta doble. Olvídate de hacerlo entero: haz la versión mínima y salvas la racha.', tareaManana: 'Versión mínima de 2 minutos, pase lo que pase.' }
  ]
};

export var RESPALDO_CHAT = [
  'Ahora mismo respondo con mensajes fijos, sin IA. Lo que más ayuda es volver a tu señal: cuando ocurra, haz al menos tu versión mínima de 2 minutos.',
  'Te leo. Si el día se complica, recuerda la regla: nunca dos fallos seguidos. Mañana, versión mínima y listo.'
];

// Elige un mensaje de respaldo de forma estable (sin azar, para poder probarlo).
export function respaldoCheckin(hecho, alerta, dia) {
  var lista = hecho ? RESPALDO_CHECKIN.hecho : (alerta ? RESPALDO_CHECKIN.alerta : RESPALDO_CHECKIN.fallo);
  var elegido = lista[Math.abs(dia || 0) % lista.length];
  return { tareaManana: elegido.tareaManana, nivel: elegido.nivel, mensaje: elegido.mensaje, derivar: false, fuente: 'respaldo' };
}

export function respaldoChat(n) {
  return RESPALDO_CHAT[Math.abs(n || 0) % RESPALDO_CHAT.length];
}
