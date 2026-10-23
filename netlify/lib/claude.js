// Cliente mínimo de la API de Anthropic (Messages). La clave solo vive en
// ANTHROPIC_API_KEY en Netlify. Si falta, o si IA_DESACTIVADA=1, devuelve null
// y quien llama usa los mensajes fijos de respaldo.
import { SISTEMA_MODERACION, ESQUEMA_MODERACION } from './prompts.js';
import { filtroPrevio } from '../../src/lib/guardarrailes.js';

export var MODELO_RAPIDO = process.env.MODELO_RAPIDO || 'claude-haiku-5-5';
export var MODELO_CHAT = process.env.MODELO_CHAT || 'claude-sonnet-5-5';

export function iaDisponible() {
  return Boolean(process.env.ANTHROPIC_API_KEY) && process.env.IA_DESACTIVADA !== '1';
}

// opciones: { modelo, sistema, mensajes, maxTokens, esquema }
// Devuelve { texto, datos } o null si no hay IA o falla.
export async function llamarClaude(opciones) {
  if (!iaDisponible()) { return null; }
  var cuerpo = {
    model: opciones.modelo,
    max_tokens: opciones.maxTokens || 350,
    // Prompt de sistema cacheado: es fijo y largo, así solo se cobra entero la primera vez.
    system: [{ type: 'text', text: opciones.sistema, cache_control: { type: 'ephemeral' } }],
    messages: opciones.mensajes
  };
  if (opciones.esquema) {
    cuerpo.output_config = { format: { type: 'json_schema', schema: opciones.esquema } };
  }
  var controlador = new AbortController();
  var temporizador = setTimeout(function () { controlador.abort(); }, opciones.tiempo || 9000);
  try {
    var res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(cuerpo),
      signal: controlador.signal
    });
    if (!res.ok) {
      console.error('anthropic: estado', res.status, (await res.text()).slice(0, 300));
      return null;
    }
    var datos = await res.json();
    if (datos.stop_reason === 'refusal') { return null; }
    var texto = '';
    (datos.content || []).forEach(function (b) { if (b.type === 'text') { texto = texto + b.text; } });
    var resultado = { texto: texto.trim(), datos: null };
    if (opciones.esquema) {
      try { resultado.datos = JSON.parse(texto); } catch (e) { return null; }
    }
    return resultado;
  } catch (e) {
    console.error('anthropic: error', e && e.message);
    return null;
  } finally {
    clearTimeout(temporizador);
  }
}

// Capa 1 completa: expresiones regulares y, si pasan y hay IA, moderación con Haiku.
// Devuelve 'ok' | 'derivar' | 'riesgo'.
export async function clasificarEntrada(texto) {
  var previo = filtroPrevio(texto);
  if (previo.tipo !== 'ok') { return previo.tipo; }
  if (!texto || !String(texto).trim() || !iaDisponible()) { return 'ok'; }
  var r = await llamarClaude({
    modelo: MODELO_RAPIDO,
    sistema: SISTEMA_MODERACION,
    mensajes: [{ role: 'user', content: 'Texto a clasificar:\n"""\n' + String(texto).slice(0, 1200) + '\n"""' }],
    maxTokens: 30,
    esquema: ESQUEMA_MODERACION,
    tiempo: 5000
  });
  if (!r || !r.datos) { return 'ok'; }
  var c = String(r.datos.categoria || 'ok').toLowerCase();
  return c === 'riesgo' || c === 'derivar' ? c : 'ok';
}
