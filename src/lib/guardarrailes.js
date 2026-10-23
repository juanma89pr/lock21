// Guardarraíles del coach IA (docs/capa-ia.md). Sin dependencias: lo usan las
// funciones de Netlify, el modo demostración de la app y el test de frases trampa.
//
// Capa 1: filtroPrevio (expresiones regulares, antes de llamar al modelo).
// Capa 2: prompt de sistema (netlify/lib/prompts.js).
// Capa 3: filtroSalida (expresiones regulares sobre lo que devuelve el modelo).

export var TEXTO_RIESGO = 'Lo que me cuentas es importante y mereces apoyo de una persona ahora mismo. Soy una IA y no puedo ayudarte con esto. Llama al 024 (atención a la conducta suicida, gratuito, 24 h) o, si estás en peligro, al 112. También puedes hablarlo con alguien de confianza o con tu médico de cabecera.';

export var TEXTO_DERIVAR = 'Eso no te lo puedo responder: soy una IA y no doy pautas de comida, cantidades, productos ni consejos de salud. Para eso lo mejor es un profesional en persona: tu médico, un dietista-nutricionista o un fisioterapeuta, según el caso. Yo sigo contigo con tu hábito.';

function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Señales de riesgo: conducta alimentaria de riesgo, autolesión, ideas de suicidio.
// Se comprueban antes que nada y responden siempre con TEXTO_RIESGO.
var RIESGO = [
  /\b\d+\s*(dias?|semanas?)\s+sin\s+comer/,
  /\bsin\s+comer\b.*\b(seguir|aguantar|mas)\b/,
  /\bno\s+(he\s+)?com(o|er|ido)\s+(nada\s+)?(en|desde)\s+\d+/,
  /\bvomit/,
  /\b(me\s+)?provoco\s+el\s+vomito/,
  /\batracon/,
  /\bpurg(o|ar|arme)\b/,
  /\blaxantes?\b/,
  /\bcompensar\s+(lo\s+que\s+)?(como|comi|he\s+comido)/,
  /\bpara\s+compensar\b/,
  /\bmejor\s+muert[oa]/,
  /\b(me\s+)?quiero\s+morir/,
  /\bno\s+quiero\s+(seguir\s+)?vivir/,
  /\bmatarme\b/,
  /\bquitarme\s+la\s+vida/,
  /\bsuicid/,
  /\bme\s+he\s+(hecho|vuelto\s+a\s+hacer)\s+cortes/,
  /\bhacerme\s+(dano|cortes)/,
  /\bautolesi/,
  /\bme\s+corto\b/,
  /\bme\s+odio\b/
];

// Temas fuera de alcance: alimentación con cifras, suplementos, salud, lesiones,
// medicación, juegos de rol e intentos de saltarse las instrucciones.
var DERIVAR = [
  /\bmenus?\b/,
  /\bdietas?\b/,
  /\bdietetic/,
  /\bnutricionista/,
  /\bnutricion/,
  /\bcalorias?\b/,
  /\bkcal\b/,
  /\bmacros?\b/,
  /\bmacronutrientes?/,
  /\bgramos?\b/,
  /\bproteinas?\b/,
  /\bcarbohidratos?\b|\bhidratos\b/,
  /\bgrasas?\b/,
  /\bsuplement/,
  /\bcreatina\b/,
  /\bquemagrasas\b/,
  /\bdetox\b/,
  /\bzumos?\b/,
  /\bayun/,
  /\b16\s*\/\s*8\b/,
  /\bimc\b/,
  /\bpeso\s+ideal/,
  /\b(kilos?|kg)\b/,
  /\badelgaz/,
  /\bperder\s+peso/,
  /\bcucharadas?\b/,
  /\bcantidad(es)?\b/,
  /\bduele\b|\bdolor\b|\bme\s+lesione\b|\blesion/,
  /\bembarazad/,
  /\blactancia\b/,
  /\bibuprofeno\b|\bparacetamol\b|\bmedicacion\b|\bmedicamento|\bpastillas?\b|\bantidepresiv/,
  /\bdiabet/,
  /\bhipotiroid|\bhipertiroid|\btiroides\b/,
  /\bhernia/,
  /\bcolesterol\b|\btension\s+alta\b|\bhipertension/,
  /\bpersona\s+real\b/,
  /\beres\s+(un|una)\s+(humano|persona|medico|nutricionista|entrenador)/,
  /\bignora\s+(tus|las)\s+(instrucciones|normas|reglas)/,
  /\bolvida\s+(tus|las)\s+(instrucciones|normas|reglas)/,
  /\bhagamos\s+un\s+juego\b|\bjuego\s+de\s+rol\b|\beres\s+nutricionista\b|\bhaz\s+de\s+nutricionista/,
  /\bmodo\s+desarrollador\b|\bjailbreak\b|\bprompt\s+de\s+sistema\b/
];

// Clasifica un texto del usuario. Devuelve { tipo: 'riesgo' | 'derivar' | 'ok', regla }.
export function filtroPrevio(texto) {
  var t = normalizar(texto);
  if (!t) { return { tipo: 'ok', regla: null }; }
  for (var i = 0; i < RIESGO.length; i++) {
    if (RIESGO[i].test(t)) { return { tipo: 'riesgo', regla: String(RIESGO[i]) }; }
  }
  for (var j = 0; j < DERIVAR.length; j++) {
    if (DERIVAR[j].test(t)) { return { tipo: 'derivar', regla: String(DERIVAR[j]) }; }
  }
  return { tipo: 'ok', regla: null };
}

// Lo que el modelo nunca debe devolver: cifras con unidades de alimentación o peso,
// macros, ayunos, suplementos, diagnósticos o el plural "vosotros".
var SALIDA = [
  /\b\d+([.,]\d+)?\s*(kcal|calorias?|gramos?|g|mg|kg|kilos?)\b/,
  /\b(kcal|calorias?)\b/,
  /\bmacros?\b|\bmacronutrientes?/,
  /\bproteinas?\b|\bcarbohidratos?\b|\bhidratos\s+de\s+carbono\b/,
  /\bayun/,
  /\bdietas?\b|\bmenu\s+(semanal|diario)/,
  /\bsuplement|\bcreatina\b|\bquemagrasas\b|\bdetox\b/,
  /\bimc\b|\bpeso\s+ideal/,
  /\bdiagnostic|\bmedicacion\b|\bibuprofeno\b|\bparacetamol\b/,
  /\bvosotr[oa]s\b|\bos\s+(recomiendo|propongo|animo|cuento|digo)\b|\bpodeis\b|\bteneis\b|\bhaceis\b|\bquereis\b|\bsabeis\b/
];

// Devuelve { ok: true } o { ok: false, regla }.
export function filtroSalida(texto) {
  var t = normalizar(texto);
  for (var i = 0; i < SALIDA.length; i++) {
    if (SALIDA[i].test(t)) { return { ok: false, regla: String(SALIDA[i]) }; }
  }
  return { ok: true };
}

// Ruta completa sin modelo: qué texto fijo se responde para una entrada.
// Devuelve null si la entrada puede ir al modelo.
export function respuestaFija(texto) {
  var previo = filtroPrevio(texto);
  if (previo.tipo === 'riesgo') { return { tipo: 'riesgo', texto: TEXTO_RIESGO, derivar: true }; }
  if (previo.tipo === 'derivar') { return { tipo: 'derivar', texto: TEXTO_DERIVAR, derivar: true }; }
  return null;
}
