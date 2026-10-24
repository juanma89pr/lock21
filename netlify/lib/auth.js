// Verifica el token de ID de Firebase con jose y las claves públicas de Google,
// sin necesitar cuenta de servicio (mismo patrón que el repo hermano).
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { json } from './http.js';

var CLAVES = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

export function proyectoFirebase() {
  return process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'lock21';
}

export function tokenDeCabecera(req) {
  var cabecera = req.headers.get('authorization') || '';
  if (cabecera.indexOf('Bearer ') !== 0) { return ''; }
  return cabecera.slice(7).trim();
}

// Devuelve { usuario } con { uid, email, admin, email_verified } o { error: Response }.
export async function verificarUsuario(req) {
  var proyecto = proyectoFirebase();
  if (!proyecto) { return { error: json(503, { error: 'sin_proyecto_firebase' }) }; }
  var token = tokenDeCabecera(req);
  if (!token) { return { error: json(401, { error: 'sin_sesion' }) }; }
  try {
    var verificado = await jwtVerify(token, CLAVES, {
      issuer: 'https://securetoken.google.com/' + proyecto,
      audience: proyecto
    });
    var p = verificado.payload;
    if (!p.sub) { return { error: json(401, { error: 'sesion_invalida' }) }; }
    return {
      usuario: {
        uid: p.sub,
        email: String(p.email || '').toLowerCase(),
        email_verified: p.email_verified,
        admin: p.admin === true
      }
    };
  } catch (e) {
    return { error: json(401, { error: 'sesion_invalida' }) };
  }
}
