import { useEffect, useState } from 'react';
import Icono from '../../components/Icono.jsx';

// Aviso discreto y descartable para instalar la app en el móvil.
// Android/Chrome: botón que lanza el diálogo del sistema (beforeinstallprompt).
// iPhone/Safari: instrucciones (Compartir -> Añadir a pantalla de inicio).
// No aparece si la app ya está instalada (display-mode standalone) ni tras descartarlo.
var CLAVE = 'lock21-instalar-descartado';

function instalada() {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  } catch (e) {
    return false;
  }
}

function esIphone() {
  var ua = window.navigator.userAgent || '';
  var ipadNuevo = window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1;
  return /iphone|ipad|ipod/i.test(ua) || ipadNuevo;
}

function descartadoAntes() {
  try { return window.localStorage.getItem(CLAVE) === '1'; } catch (e) { return false; }
}

export default function Instalar() {
  var e1 = useState(null);
  var aviso = e1[0];
  var setAviso = e1[1];
  var e2 = useState(function () { return instalada() || descartadoAntes(); });
  var oculto = e2[0];
  var setOculto = e2[1];
  var iphone = esIphone();

  useEffect(function () {
    function antesDeInstalar(evento) {
      evento.preventDefault();
      setAviso(evento);
    }
    function alInstalar() { setOculto(true); }
    window.addEventListener('beforeinstallprompt', antesDeInstalar);
    window.addEventListener('appinstalled', alInstalar);
    return function () {
      window.removeEventListener('beforeinstallprompt', antesDeInstalar);
      window.removeEventListener('appinstalled', alInstalar);
    };
  }, []);

  function descartar() {
    try { window.localStorage.setItem(CLAVE, '1'); } catch (e) { /* sin almacenamiento */ }
    setOculto(true);
  }

  function instalar() {
    if (!aviso) { return; }
    aviso.prompt();
    aviso.userChoice.then(function (r) {
      setAviso(null);
      if (r && r.outcome === 'accepted') { setOculto(true); }
    }).catch(function () { setAviso(null); });
  }

  if (oculto || (!aviso && !iphone)) { return null; }

  return (
    <aside aria-label="Instalar la app" className="mb-4 rounded-2xl bg-white border-2 border-lila p-4 flex gap-3 items-start">
      <span className="size-9 shrink-0 rounded-full bg-lila text-cobalto flex items-center justify-center"><Icono nombre="movil" size={18} grosor={2.25} /></span>
      <div className="flex-1 min-w-0 text-sm leading-snug">
        <p className="font-bold text-base">Instala Lock21 en tu móvil</p>
        {iphone ? (
          <div>
            <p className="mt-1">
              Toca <Icono nombre="compartir" size={15} grosor={2.25} className="inline -mt-0.5 text-cobalto" /> <strong>Compartir</strong> en Safari y luego <Icono nombre="anadir" size={15} grosor={2.25} className="inline -mt-0.5 text-cobalto" /> <strong>Añadir a pantalla de inicio</strong>.
            </p>
            <p className="mt-1 text-gris">En iPhone, los avisos del reto solo llegan con la app instalada.</p>
          </div>
        ) : (
          <div>
            <p className="mt-1 text-gris">La tienes a un toque cada día, como una app más.</p>
            <button type="button" onClick={instalar} className="mt-2.5 rounded-full bg-cobalto text-white px-4 py-2 text-sm font-bold flex items-center gap-1.5 hover:bg-cobalto-hondo">
              <Icono nombre="descargar" size={16} grosor={2.5} />Instalar
            </button>
          </div>
        )}
      </div>
      <button type="button" onClick={descartar} className="shrink-0 -m-1 p-1.5 rounded-full text-gris hover:text-noche hover:bg-lila/50" aria-label="Cerrar aviso de instalación">
        <Icono nombre="fallo" size={18} grosor={2.5} />
      </button>
    </aside>
  );
}
