// Misiones de calentamiento: una al día, de un minuto, mientras se espera a que empiece
// el grupo. No cuentan para los 21 días ni para la racha. La misión del día rota según
// los días que han pasado desde el alta (la primera, el mismo día del alta).
// texto(p): p = { senal, accion, minima, habito } con la señal y la versión mínima de la persona.
import { fechaEnZona, diasEntre } from '../lib/grupos.js';

var PREPARAR = {
  entrenar: 'la ropa y las zapatillas de entrenar',
  pasos: 'las zapatillas de caminar junto a la puerta',
  dormir: 'la alarma de las 23:00 puesta para todos los días',
  movilidad: 'un hueco despejado en el salón (y la esterilla, si tienes)',
  agua: 'una botella llena y a la vista',
  pantalla: 'un cargador fuera del dormitorio'
};

function limpio(texto) {
  return String(texto || '').replace(/[.,\s]+$/, '');
}

function minuscula(texto) {
  var t = limpio(texto);
  return t.charAt(0).toLowerCase() + t.slice(1);
}

var MISIONES = [
  {
    id: 'porque',
    titulo: 'Tu porqué',
    texto: function () { return 'Escribe en una nota del móvil por qué quieres este hábito. Una frase sincera basta.'; }
  },
  {
    id: 'detente',
    titulo: 'Detente 5 segundos',
    texto: function (p) { return 'Hoy, cuando llegue tu señal (' + minuscula(p.senal) + '), solo detente 5 segundos y piensa en tu hábito. Nada más.'; }
  },
  {
    id: 'preparar',
    titulo: 'Déjalo preparado',
    texto: function (p) { return 'Deja listo lo que vas a necesitar: ' + (PREPARAR[p.habito] || 'lo que uses para tu hábito') + '. Que el día 1 no tengas que buscar nada.'; }
  },
  {
    id: 'minima',
    titulo: 'Prueba tu versión mínima',
    texto: function (p) { return 'Haz una vez tu versión de 2 minutos: ' + minuscula(p.minima) + '. Solo para comprobar que de verdad es fácil.'; }
  },
  {
    id: 'hora',
    titulo: 'La hora exacta',
    texto: function (p) { return 'Elige la hora exacta a la que suele llegar tu señal (' + minuscula(p.senal) + ') y apúntala. Cuanto más concreta, mejor funciona.'; }
  },
  {
    id: 'obstaculo',
    titulo: 'Tu obstáculo',
    texto: function () { return 'Piensa en lo que más probablemente te va a hacer fallar y escribe tu plan: "si pasa esto, entonces hago mi versión mínima".'; }
  },
  {
    id: 'visualiza',
    titulo: 'Ensáyalo en la cabeza',
    texto: function (p) { return 'Cierra los ojos un minuto e imagina la escena entera: llega tu señal y haces lo que te propusiste ("' + minuscula(p.accion) + '").'; }
  },
  {
    id: 'sitio',
    titulo: 'El sitio',
    texto: function () { return 'Decide dónde vas a hacerlo exactamente. Mismo momento y mismo sitio cada día: así se forma el hábito.'; }
  },
  {
    id: 'cuenta',
    titulo: 'Cuéntaselo a alguien',
    texto: function () { return 'Dile a una persona de confianza qué hábito vas a trabajar y cuándo empiezas. Decirlo en voz alta ayuda a sostenerlo.'; }
  },
  {
    id: 'senal-real',
    titulo: 'Observa tu señal',
    texto: function (p) { return 'Hoy fíjate en si tu señal (' + minuscula(p.senal) + ') pasa de verdad todos los días. Si no, busca otra más fija.'; }
  },
  {
    id: 'friccion',
    titulo: 'Quita un estorbo',
    texto: function () { return 'Elimina una sola cosa que te pondría difícil empezar: un mueble en medio, una notificación, un cajón desordenado.'; }
  },
  {
    id: 'ensayo',
    titulo: 'Ensayo general',
    texto: function () { return 'Cuando llegue tu señal, haz solo el primer paso de tu hábito durante un minuto. Es un ensayo: sirve para que el día 1 no sea la primera vez.'; }
  }
];

// Índice de la misión del día: días desde el alta, en bucle.
export function indiceMision(alta, hoy) {
  var desde = alta ? fechaEnZona(new Date(alta)) : hoy;
  var n = diasEntre(desde, hoy);
  if (!(n >= 0)) { n = 0; }
  return n % MISIONES.length;
}

export function misionDelDia(perfil, hoy) {
  var p = perfil || {};
  var m = MISIONES[indiceMision(p.alta, hoy)];
  return { id: m.id, titulo: m.titulo, texto: m.texto({ senal: p.senal, accion: p.accion, minima: p.minima, habito: p.habito }) };
}

export default MISIONES;
