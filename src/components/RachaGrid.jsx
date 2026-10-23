import { useEffect, useState } from 'react';
import Icono from './Icono.jsx';

var DIAS = [];
for (var i = 1; i <= 21; i++) { DIAS.push(i); }

function prefiereSinMovimiento() {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function RachaGrid() {
  var estado = useState(prefiereSinMovimiento() ? 21 : 0);
  var hechos = estado[0];
  var setHechos = estado[1];

  useEffect(function () {
    if (prefiereSinMovimiento()) { return undefined; }
    var n = 0;
    var temporizador = setInterval(function () {
      n = n + 1;
      setHechos(n);
      if (n >= 21) { clearInterval(temporizador); }
    }, 90);
    return function () { clearInterval(temporizador); };
  }, []);

  return (
    <figure className="w-full">
      <div className="grid grid-cols-7 gap-2 sm:gap-2.5" aria-hidden="true">
        {DIAS.map(function (dia) {
          var hecha = dia <= hechos;
          var ultima = dia === 21;
          var base = 'casilla aspect-square rounded-lg border-2 flex items-center justify-center font-display font-extrabold text-lg sm:text-2xl ';
          var estilo;
          if (ultima) {
            estilo = hecha ? 'bg-tinta border-tinta text-sol' : 'bg-papel border-tinta text-tinta';
          } else {
            estilo = hecha ? 'bg-sol border-sol text-papel' : 'bg-papel border-linea text-tinta-2';
          }
          return (
            <div key={dia} className={base + estilo} data-hecha={hecha ? 'true' : 'false'}>
              {ultima ? <Icono nombre="candado" size={22} grosor={2.25} /> : dia}
            </div>
          );
        })}
      </div>
      <figcaption className="mt-4 text-sm text-tinta-2 max-w-sm">
        Una casilla por cada día cumplido. Al llegar al 21, el hábito queda cerrado con llave.
      </figcaption>
    </figure>
  );
}
