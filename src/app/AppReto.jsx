// App del reto bajo /app. Rutas: /app (Hoy), /app/progreso, /app/coach,
// /app/informe y /app/admin. El orden de pantallas lo marca el estado:
// entrar -> alta (18+, privacidad, aviso IA) -> hábito y señal -> test día 0 -> Hoy.
import { useEffect, useState } from 'react';
import Icono from '../components/Icono.jsx';
import { configurado, faltan } from '../lib/firebase.js';
import { crearServicioReal, crearServicioDemo } from './servicio.js';
import { testAbierto } from '../lib/reto.js';
import { Cargando } from './componentes/ui.jsx';
import Instalar from './componentes/Instalar.jsx';
import Entrar from './pantallas/Entrar.jsx';
import SinConfig from './pantallas/SinConfig.jsx';
import Alta from './pantallas/Alta.jsx';
import ElegirHabito from './pantallas/ElegirHabito.jsx';
import TestSrbai from './pantallas/TestSrbai.jsx';
import Hoy from './pantallas/Hoy.jsx';
import Progreso from './pantallas/Progreso.jsx';
import Coach from './pantallas/Coach.jsx';
import Informe from './pantallas/Informe.jsx';
import Admin from './pantallas/Admin.jsx';
import config from '../config.js';

function parametros() {
  var p = new URLSearchParams(window.location.search);
  return { demo: p.get('demo'), escenario: p.get('escenario'), dia: p.get('dia') };
}

var servicioGlobal = null;
function obtenerServicio() {
  if (servicioGlobal) { return servicioGlobal; }
  var p = parametros();
  var demo = p.demo === '1' || !configurado;
  servicioGlobal = demo ? crearServicioDemo({ escenario: p.escenario, dia: p.dia }) : crearServicioReal();
  return servicioGlobal;
}

export function navegar(ruta) {
  var p = parametros();
  // En demostración se conservan los parámetros para poder enseñar escenarios.
  var extra = p.demo ? ('?demo=1' + (p.dia ? '&dia=' + p.dia : '')) : '';
  window.history.pushState(null, '', ruta + extra);
  window.dispatchEvent(new Event('lock21-ruta'));
  window.scrollTo(0, 0);
}

function useRuta() {
  var est = useState(window.location.pathname);
  var ruta = est[0];
  var setRuta = est[1];
  useEffect(function () {
    function cambiar() { setRuta(window.location.pathname); }
    window.addEventListener('popstate', cambiar);
    window.addEventListener('lock21-ruta', cambiar);
    return function () {
      window.removeEventListener('popstate', cambiar);
      window.removeEventListener('lock21-ruta', cambiar);
    };
  }, []);
  return ruta.replace(/\/+$/, '') || '/app';
}

function useServicio(servicio) {
  var est = useState(servicio.actual());
  var estado = est[0];
  var setEstado = est[1];
  useEffect(function () {
    var baja = servicio.escuchar(setEstado);
    var parar = servicio.iniciar();
    return function () { baja(); parar(); };
  }, [servicio]);
  return estado;
}

var PESTANAS = [
  { ruta: '/app', nombre: 'Hoy', icono: 'hoy' },
  { ruta: '/app/progreso', nombre: 'Progreso', icono: 'progreso' },
  { ruta: '/app/coach', nombre: 'Coach', icono: 'chat' }
];

function Enlace(props) {
  function ir(e) {
    e.preventDefault();
    navegar(props.ruta);
  }
  return <a href={props.ruta} onClick={ir} aria-current={props.activo ? 'page' : undefined} className={props.className}>{props.children}</a>;
}

function Cabecera(props) {
  return (
    <header className="sticky top-0 z-20 bg-cobalto text-white">
      <div className="mx-auto max-w-xl px-4 py-3 flex items-center justify-between gap-3">
        <Enlace ruta="/app" className="titular text-2xl flex items-center gap-1.5">
          <Icono nombre="candado" size={19} grosor={2.75} className="text-dorsal" />Lock21
          <span className="sr-only">, inicio de la app</span>
        </Enlace>
        <div className="flex items-center gap-2">
          {props.demo ? <span className="rounded-full bg-dorsal text-noche px-2.5 py-1 text-xs font-bold">Demostración</span> : null}
          {props.usuario ? (
            <button type="button" onClick={props.onSalir} className="rounded-full px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5 hover:bg-white/10">
              <Icono nombre="salir" size={16} grosor={2.25} />Salir
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function Navegacion(props) {
  return (
    <nav aria-label="Secciones de la app" className="fixed bottom-0 inset-x-0 z-20 bg-white border-t-2 border-lila pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto max-w-xl grid grid-cols-3">
        {PESTANAS.map(function (p) {
          var activo = props.ruta === p.ruta;
          return (
            <li key={p.ruta}>
              <Enlace ruta={p.ruta} activo={activo} className={'flex flex-col items-center gap-0.5 py-2.5 text-xs font-bold ' + (activo ? 'text-cobalto' : 'text-gris hover:text-noche')}>
                <span className={'rounded-full px-4 py-1 ' + (activo ? 'bg-lila' : '')}><Icono nombre={p.icono} size={22} grosor={activo ? 2.5 : 2} /></span>
                {p.nombre}
              </Enlace>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default function AppReto() {
  var servicio = obtenerServicio();
  var estado = useServicio(servicio);
  var ruta = useRuta();
  var demo = estado.modo === 'demo';
  var verSinConfig = useState(!configurado && parametros().demo !== '1');

  useEffect(function () {
    document.title = 'Lock21 — Tu reto de 21 días';
  }, []);

  function salir() {
    servicio.salir();
    navegar('/app');
  }

  var contenido = null;
  var conNavegacion = false;
  var d = estado.datos;
  var perfil = d.perfil || {};
  var reto = estado.reto;

  if (verSinConfig[0]) {
    contenido = <SinConfig faltan={faltan} onDemo={function () { verSinConfig[1](false); }} />;
  } else if (estado.cargando) {
    contenido = <Cargando />;
  } else if (!estado.usuario) {
    contenido = <Entrar servicio={servicio} estado={estado} demo={demo} admin={ruta === '/app/admin'} />;
  } else if (ruta === '/app/admin') {
    contenido = <Admin servicio={servicio} demo={demo} />;
  } else if (!perfil.aceptaciones) {
    contenido = <Alta servicio={servicio} />;
  } else if (!perfil.habito || ruta === '/app/habito') {
    contenido = <ElegirHabito servicio={servicio} perfil={perfil} reto={reto} />;
  } else if (!d.srbai['0'] || ruta === '/app/test') {
    var hechos = {};
    Object.keys(d.srbai).forEach(function (k) { hechos[k] = true; });
    var dia = testAbierto(reto.dia, hechos);
    if (!d.srbai['0']) { dia = 0; }
    if (dia === null && reto.dia <= 1) { dia = 0; }
    contenido = dia === null ? <Hoy servicio={servicio} estado={estado} /> : <TestSrbai servicio={servicio} dia={dia} perfil={perfil} srbai={d.srbai} reto={reto} />;
    conNavegacion = dia === null;
  } else if (ruta === '/app/progreso') {
    contenido = <Progreso estado={estado} />;
    conNavegacion = true;
  } else if (ruta === '/app/coach') {
    contenido = <Coach servicio={servicio} estado={estado} />;
    conNavegacion = true;
  } else if (ruta === '/app/informe') {
    contenido = <Informe servicio={servicio} estado={estado} />;
    conNavegacion = true;
  } else {
    contenido = <Hoy servicio={servicio} estado={estado} />;
    conNavegacion = true;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#principal" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-dorsal focus:text-noche focus:px-4 focus:py-2 focus:rounded-full font-bold">Saltar al contenido</a>
      <Cabecera usuario={verSinConfig[0] ? null : estado.usuario} demo={demo && !verSinConfig[0]} onSalir={salir} />
      <main id="principal" className={'flex-1 mx-auto w-full max-w-xl px-4 pt-5 ' + (conNavegacion ? 'pb-28' : 'pb-10')}>
        {verSinConfig[0] || estado.cargando || ruta === '/app/admin' ? null : <Instalar />}
        {contenido}
      </main>
      {conNavegacion ? <Navegacion ruta={ruta} /> : (
        <footer className="mx-auto max-w-xl w-full px-4 pb-6 text-xs text-gris">
          {config.marca}. Reto de hábitos de 21 días. <a href="/privacidad.html" className="underline">Privacidad</a>
        </footer>
      )}
    </div>
  );
}
