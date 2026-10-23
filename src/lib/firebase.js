// Firebase del cliente (Auth con enlace por correo y lectura de Firestore).
// La configuración llega por variables VITE_FIREBASE_* (ver docs/puesta-en-marcha.md).
// Si falta alguna, la app no se rompe: muestra un aviso claro y ofrece el modo demostración.
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

var VARIABLES = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

var NOMBRES = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  appId: 'VITE_FIREBASE_APP_ID'
};

export var faltan = Object.keys(VARIABLES).filter(function (k) { return !VARIABLES[k]; }).map(function (k) { return NOMBRES[k]; });
export var configurado = faltan.length === 0;

if (!configurado && typeof console !== 'undefined') {
  console.warn('Lock21: Firebase sin configurar. Faltan: ' + faltan.join(', ') + '. Revisa docs/puesta-en-marcha.md.');
}

var app = null;
var auth = null;
var db = null;

function iniciar() {
  if (!configurado) { return false; }
  if (!app) {
    app = initializeApp({
      apiKey: VARIABLES.apiKey,
      authDomain: VARIABLES.authDomain,
      projectId: VARIABLES.projectId,
      appId: VARIABLES.appId,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || undefined
    });
    auth = getAuth(app);
    auth.languageCode = 'es';
    db = getFirestore(app);
  }
  return true;
}

export function obtenerAuth() {
  return iniciar() ? auth : null;
}

export function obtenerDb() {
  return iniciar() ? db : null;
}
