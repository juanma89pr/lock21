import { useState } from 'react';
import Icono from './Icono.jsx';
import config from '../config.js';

// Página de pausa (10 nov 2026, Juanma). La lista «avisame-vuelta» va a Netlify Forms
// (formulario oculto en public/__forms.html): sin funciones ni base de datos.
var CAMPO = 'w-full rounded-xl border-2 lila bg-white px-3.5 py-3 text-base font-normal text-noche focus:border-cobalto';

function codificar(datos) {
  return Object.keys(datos).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(datos[k]); }).join('&');
}

export default function Pausa() {
  var est = useState({ email: '', privacidad: false, empresa: '' });
  var datos = est[0];
  var setDatos = est[1];
  var fas = useState('');
  var fase = fas[0];
  var setFase = fas[1];

  function cambiar(e) {
    var n = Object.assign({}, datos);
    n[e.target.name] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setDatos(n);
  }

  function enviar(e) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email) || !datos.privacidad) { setFase('falta'); return; }
    setFase('enviando');
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: codificar({ 'form-name': 'avisame-vuelta', email: datos.email, privacidad: 'si', empresa: datos.empresa })
    }).then(function (r) { setFase(r.ok ? 'hecho' : 'error'); }).catch(function () { setFase('error'); });
  }

  return (
    <div className="min-h-screen bg-cobalto text-white">
      <main className="mx-auto w-full max-w-2xl px-4 sm:px-8 py-12 sm:py-20">
        <p className="titular text-3xl flex items-center gap-1.5">
          <Icono nombre="candado" size={22} grosor={2.75} className="text-dorsal" />{config.marca}
        </p>
        <h1 className="titular mt-10 text-[3.6rem] sm:text-[5.6rem] uppercase">{config.marca} se pausa.</h1>
        <p className="mt-6 text-lg sm:text-xl leading-relaxed text-white/90">
          Un reto en grupo necesita grupo, y todavía somos pocos. Prefiero pararlo a hacerlo a medias. El grupo del lunes 16 de noviembre no sale.
        </p>
        <p className="mt-4 text-lg sm:text-xl leading-relaxed text-white/90">
          La idea sigue viva: un hábito, una señal fija y nunca dos fallos seguidos. {config.marca} volverá más adelante desde {config.pausa.vuelveDesde}. Gracias a quienes pidieron su plaza.
        </p>

        {fase === 'hecho' ? (
          <p className="mt-10 rounded-[28px] bg-pista text-noche p-6 leading-relaxed font-semibold">Apuntado. Te escribiremos solo para avisarte de cuándo vuelve.</p>
        ) : (
          <form name="avisame-vuelta" onSubmit={enviar} noValidate className="mt-10 rounded-[28px] bg-pista text-noche p-5 sm:p-8 grid gap-5">
            <p className="titular-medio text-2xl">Avísame cuando vuelva</p>
            <p className="hidden"><label>No rellenar <input name="empresa" value={datos.empresa} onChange={cambiar} tabIndex={-1} autoComplete="off" /></label></p>
            <label className="grid gap-1.5 font-semibold">Tu correo
              <input name="email" type="email" required value={datos.email} onChange={cambiar} autoComplete="email" className={CAMPO} />
            </label>
            <label className="flex gap-3 items-start text-sm leading-relaxed">
              <input type="checkbox" name="privacidad" required checked={datos.privacidad} onChange={cambiar} className="mt-0.5 size-5 shrink-0 accent-cobalto" />
              <span>Acepto que {config.titular} guarde mi correo solo para avisarme de cuándo vuelve {config.marca}, según la <a href="/privacidad.html" className="underline font-semibold text-cobalto">política de privacidad</a>.</span>
            </label>
            {fase === 'falta' ? <p className="text-sm font-semibold text-noche">Escribe un correo válido y marca la casilla.</p> : null}
            {fase === 'error' ? <p className="text-sm font-semibold text-noche">No se ha podido guardar. Prueba de nuevo en un momento.</p> : null}
            <button type="submit" disabled={fase === 'enviando'} className="boton justify-center bg-cobalto hover:bg-cobalto-hondo text-white text-lg disabled:opacity-60">Avísame</button>
          </form>
        )}
      </main>
    </div>
  );
}
