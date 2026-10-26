// Página /dentro?i=&t= que enlazan los correos: vuelve a enseñar el dorsal para compartirlo.
import { useEffect, useState } from 'react';
import Dentro from './Dentro.jsx';
import { ARCO, CUERPO, DIGITOS } from '../lib/candadoTrazos.js';

export default function PaginaDentro() {
  var e = useState(null);
  var datos = e[0];
  var eErr = useState('');
  var error = eErr[0];

  useEffect(function () {
    var q = new URLSearchParams(window.location.search);
    fetch('/.netlify/functions/inscripcion?i=' + encodeURIComponent(q.get('i') || '') + '&t=' + encodeURIComponent(q.get('t') || ''))
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (j) { e[1](Object.assign({ id: q.get('i'), token: q.get('t') }, j)); })
      .catch(function () { eErr[1]('No encontramos tu plaza con este enlace. Abre el último correo que te mandamos o apúntate otra vez con el mismo correo: conservas tu dorsal.'); });
  }, []);

  return (
    <main className="min-h-screen bg-cobalto px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl grid gap-6">
        <a href="/" className="flex items-center gap-2 text-white titular text-3xl" aria-label="Lock21, inicio">
          <svg width="22" height="36" viewBox="0 -30 100 162" aria-hidden="true"><path fill="currentColor" d={ARCO} /><path fill="currentColor" fillRule="evenodd" d={CUERPO + DIGITOS} /></svg>
          LOCK21
        </a>
        {datos ? <Dentro datos={datos} /> : null}
        {error ? <p className="rounded-[28px] bg-white p-6 text-noche leading-relaxed">{error} <a href="/#plaza" className="font-bold text-cobalto underline">Ir a la web</a></p> : null}
        {!datos && !error ? <div className="h-64 rounded-[28px] bg-white/10 animate-pulse" /> : null}
      </div>
    </main>
  );
}
