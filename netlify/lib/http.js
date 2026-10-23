// Utilidades HTTP comunes a las funciones (formato Netlify Functions v2: Request/Response).

export function json(codigo, cuerpo) {
  return new Response(JSON.stringify(cuerpo), {
    status: codigo,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

export async function leerJson(req, maximo) {
  var texto = await req.text();
  if (texto.length > (maximo || 8000)) { return { error: 'demasiado_largo' }; }
  if (!texto) { return { datos: {} }; }
  try {
    return { datos: JSON.parse(texto) };
  } catch (e) {
    return { error: 'json_invalido' };
  }
}

export function recortar(texto, maximo) {
  return String(texto === undefined || texto === null ? '' : texto).slice(0, maximo).trim();
}

export function entero(valor, min, max) {
  var n = Number(valor);
  if (!(n >= min && n <= max) || Math.round(n) !== n) { return null; }
  return n;
}
