// Firebase del cliente (Auth con enlace por correo y lectura de Firestore).
// Configuración web del proyecto lock21 (pública por diseño: la seguridad la dan las reglas
// de Firestore y la verificación de tokens en las funciones). Las variables VITE_FIREBASE_*
// la sustituyen si existen.
// Si falta alguna, la app no se rompe: muestra un aviso claro y ofrece el modo demostración.
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

var PROYECTO = {
  apiKey: 'AIzaSyCRUHd1K6-MU7mWd1MKoIuMb81YIUvqblE',
  authDomain: 'lock21.firebaseapp.com',
  projectId: 'lock21',
  appId: '1:726074710075:web:54830653f6d5dd6b60a41e',
  messagingSenderId: '726074710075'
};

var VARIABLES = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || PROYECTO.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || PROYECTO.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || PROYECTO.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || PROYECTO.appId
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
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || PROYECTO.messagingSenderId
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
