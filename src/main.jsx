import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/archivo/wdth.css';
import './index.css';
import App from './App.jsx';
import medir from './lib/medir.js';

// La landing sigue en /; la app del reto vive bajo /app y se carga aparte
// para que Firebase no pese en la portada.
var AppReto = lazy(function () { return import('./app/AppReto.jsx'); });
var enApp = /^\/app(\/|$)/.test(window.location.pathname);
if (import.meta.env.PROD) { medir(enApp ? 'visita_app' : 'visita'); }

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {enApp ? (
      <Suspense fallback={<div className="min-h-screen bg-cobalto" />}>
        <AppReto />
      </Suspense>
    ) : <App />}
  </StrictMode>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () { /* sin PWA, la web sigue igual */ });
  });
}
