import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/archivo/wdth.css';
import './index.css';
import App from './App.jsx';
import Pausa from './components/Pausa.jsx';
import config from './config.js';
import medir from './lib/medir.js';

// La landing sigue en /; la app del reto vive bajo /app y se carga aparte
// para que Firebase no pese en la portada.
var AppReto = lazy(function () { return import('./app/AppReto.jsx'); });
var enApp = /^\/app(\/|$)/.test(window.location.pathname);
var enDentro = /^\/dentro\/?$/.test(window.location.pathname);
// En pausa: portada, /dentro y la app enseñan la página de pausa; el panel (/app/admin) sigue.
var enAdmin = /^\/app\/admin(\/|$)/.test(window.location.pathname);
var enPausa = config.pausa && config.pausa.activa && !enAdmin;
var PaginaDentro = lazy(function () { return import('./components/PaginaDentro.jsx'); });
if (import.meta.env.PROD && !enDentro) { medir(enApp ? 'visita_app' : 'visita'); }

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {enPausa ? <Pausa /> : enApp ? (
      <Suspense fallback={<div className="min-h-screen bg-cobalto" />}>
        <AppReto />
      </Suspense>
    ) : enDentro ? (
      <Suspense fallback={<div className="min-h-screen bg-cobalto" />}>
        <PaginaDentro />
      </Suspense>
    ) : <App />}
  </StrictMode>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () { /* sin PWA, la web sigue igual */ });
  });
}
