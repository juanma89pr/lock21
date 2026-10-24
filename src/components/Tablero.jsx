import { useEffect, useState } from 'react';
import Icono from './Icono.jsx';
import { diaSemanaDe, fechaLarga } from '../lib/grupos.js';

var NOMBRES_DIA = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
var DIAS = [];
for (var i = 1; i <= 21; i++) { DIAS.push(i); }

function prefiereSinMovimiento() {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function toca(habito, n, base) {
  if (habito.dias === 'todos') { return true; }
  return habito.dias.indexOf((base + n - 1) % 7) !== -1;
}

// Recorrido de ejemplo: un fallo suelto en la segunda semana que no rompe la racha.
function estadoEjemplo(habito, n, base) {
  if (!toca(habito, n, base)) { return 'libre'; }
  var fallo = habito.dias === 'todos' ? 10 : 9;
  return n === fallo ? 'fallo' : 'hecho';
}

export default function Tablero(props) {
  var habito = props.habito;
  // El tablero arranca en la fecha del próximo grupo (siempre lunes).
  var base = diaSemanaDe(props.inicio);
  var est = useState(prefiereSinMovimiento() ? 21 : 0);
  var hasta = est[0];
  var setHasta = est[1];

  useEffect(function () {
    if (prefiereSinMovimiento()) { setHasta(21); return undefined; }
    var n = 0;
    setHasta(0);
    var temporizador = setInterval(function () {
      n = n + 1;
      setHasta(n);
      if (n >= 21) { clearInterval(temporizador); }
    }, 55);
    return function () { clearInterval(temporizador); };
  }, [habito.id]);

  var cabecera = [];
  for (var d = 0; d < 7; d++) { cabecera.push(NOMBRES_DIA[(base + d) % 7]); }

  return (
    <figure className="w-full rounded-[28px] bg-pista text-noche p-4 sm:p-6 shadow-[0_24px_0_-12px_var(--color-noche)]">
      <div className="flex items-center gap-3">
        <span className="shrink-0 size-11 rounded-full bg-dorsal text-noche flex items-center justify-center"><Icono nombre={habito.icono} size={22} grosor={2} /></span>
        <div className="min-w-0">
          <p className="titular-medio text-2xl sm:text-3xl leading-none">{habito.nombre}</p>
          <p className="mt-1 text-sm text-gris">Desde el {fechaLarga(props.inicio)}</p>
        </div>
      </div>

      <p className="mt-4 rounded-2xl bg-lila/45 px-4 py-3 text-[0.95rem] leading-snug">
        <Icono nombre="senal" size={16} grosor={2.25} className="inline -mt-0.5 mr-1.5 text-cobalto" />
        <strong className="font-bold">{habito.senal},</strong> {habito.accion}
      </p>

      <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2" aria-hidden="true">
        {cabecera.map(function (nombre) {
          return <span key={nombre} className="text-center text-xs font-semibold text-gris">{nombre}</span>;
        })}
        {DIAS.map(function (n) {
          var visible = n <= hasta;
          var estado = visible ? estadoEjemplo(habito, n, base) : 'pendiente';
          var test = n === 7 || n === 21;
          var clases = 'dia relative aspect-square rounded-xl border-2 flex items-center justify-center ';
          var contenido = <span className="titular-medio text-lg sm:text-2xl">{n}</span>;
          if (estado === 'hecho') {
            clases = clases + 'bg-cobalto border-cobalto text-pista';
            contenido = <Icono nombre="check" size={20} grosor={3} />;
          } else if (estado === 'fallo') {
            clases = clases + 'bg-pista border-dashed border-gris text-gris';
            contenido = <Icono nombre="fallo" size={18} grosor={2.5} />;
          } else if (estado === 'libre') {
            clases = clases + 'bg-transparent border-transparent text-gris/70';
            contenido = <Icono nombre="menos" size={16} grosor={2} />;
          } else {
            clases = clases + 'bg-white border-lila text-gris';
          }
          if (n === 21 && estado === 'hecho') {
            clases = clases.replace('bg-cobalto border-cobalto text-pista', 'bg-noche border-noche text-dorsal');
            contenido = <Icono nombre="candado" size={20} grosor={2.5} />;
          }
          return (
            <div key={n} className={clases}>
              {contenido}
              {test ? <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-dorsal ring-2 ring-pista" /> : null}
            </div>
          );
        })}
      </div>

      <figcaption className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm text-gris">
        <span className="flex items-center gap-1.5"><span className="size-3.5 rounded bg-cobalto" />Cumplido</span>
        <span className="flex items-center gap-1.5"><span className="size-3.5 rounded border-2 border-dashed border-gris" />Fallo suelto, la racha sigue</span>
        <span className="flex items-center gap-1.5"><span className="size-3.5 rounded-full bg-dorsal" />Test de automaticidad</span>
      </figcaption>
      <p className="sr-only">Ejemplo de calendario de 21 días para {habito.nombre}: casi todos los días cumplidos, un fallo suelto en la segunda semana que no rompe la racha y tests de automaticidad los días 7 y 21.</p>
    </figure>
  );
}
