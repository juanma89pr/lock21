import { useState } from 'react';
import HABITOS, { buscarHabito } from '../datos/habitos.js';
import config from '../config.js';

function codificar(datos) {
  return Object.keys(datos).map(function (clave) {
    return encodeURIComponent(clave) + '=' + encodeURIComponent(datos[clave]);
  }).join('&');
}

var CAMPO = 'w-full rounded-xl border-2 border-lila bg-white px-3.5 py-3 text-base font-normal text-noche focus:border-cobalto';

export default function Inscripcion(props) {
  var est = useState({ nombre: '', email: '', privacidad: false, entrenador: false, empresa: '' });
  var datos = est[0];
  var setDatos = est[1];
  var est2 = useState('listo');
  var fase = est2[0];
  var setFase = est2[1];
  var est3 = useState('');
  var error = est3[0];
  var setError = est3[1];

  function cambiar(e) {
    var campo = e.target.name;
    var valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    var nuevo = Object.assign({}, datos);
    nuevo[campo] = valor;
    setDatos(nuevo);
  }

  function cambiarHabito(e) {
    props.onHabito(e.target.value);
  }

  function enviar(e) {
    e.preventDefault();
    setError('');
    if (!datos.nombre.trim()) { setError('Escribe tu nombre para que el coach sepa cómo llamarte.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) { setError('Escribe un correo válido, por ejemplo nombre@gmail.com.'); return; }
    if (!datos.privacidad) { setError('Para apuntarte tienes que aceptar la política de privacidad.'); return; }
    setFase('enviando');
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: codificar({
        'form-name': 'lista-espera',
        nombre: datos.nombre.trim(),
        email: datos.email.trim(),
        habito: buscarHabito(props.habito).nombre,
        grupo: props.grupo,
        privacidad: 'si',
        entrenador: datos.entrenador ? 'si' : 'no',
        empresa: datos.empresa
      })
    }).then(function (r) {
      if (!r.ok) { throw new Error('estado ' + r.status); }
      setFase('hecho');
    }).catch(function () {
      setFase('listo');
      setError('No se ha podido guardar tu plaza. Revisa la conexión e inténtalo otra vez.');
    });
  }

  if (fase === 'hecho') {
    return (
      <div className="rounded-[28px] bg-dorsal text-noche p-6 sm:p-8" role="status">
        <p className="titular text-5xl sm:text-6xl">Plaza pedida, {datos.nombre.trim()}.</p>
        <p className="mt-4 max-w-md leading-relaxed">Te escribimos a {datos.email.trim()} antes del {props.grupoTexto} con tu hábito, {buscarHabito(props.habito).corto.toLowerCase()}, y el test del día 0. Si las {config.grupos.plazas} plazas ya estaban cubiertas, pasas al grupo siguiente, dos semanas después.</p>
      </div>
    );
  }

  return (
    <form name="lista-espera" onSubmit={enviar} noValidate className="rounded-[28px] bg-pista text-noche p-5 sm:p-8 grid gap-5">
      <p className="hidden"><label>No rellenar <input name="empresa" value={datos.empresa} onChange={cambiar} tabIndex={-1} autoComplete="off" /></label></p>
      <input type="hidden" name="grupo" value={props.grupo} />
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="grid gap-1.5 text-sm font-semibold">Tu nombre
          <input name="nombre" required value={datos.nombre} onChange={cambiar} autoComplete="given-name" className={CAMPO} />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">Tu correo
          <input name="email" type="email" required value={datos.email} onChange={cambiar} autoComplete="email" className={CAMPO} />
        </label>
      </div>
      <label className="grid gap-1.5 text-sm font-semibold">El hábito que vas a trabajar
        <select name="habito" value={props.habito} onChange={cambiarHabito} className={CAMPO + ' appearance-auto'}>
          {HABITOS.map(function (h) {
            return <option key={h.id} value={h.id}>{h.nombre}</option>;
          })}
        </select>
      </label>
      <div className="grid gap-3 border-t-2 border-lila pt-5">
        <label className="flex gap-3 items-start text-sm leading-relaxed">
          <input type="checkbox" name="privacidad" required checked={datos.privacidad} onChange={cambiar} className="mt-0.5 size-5 shrink-0 accent-cobalto" />
          <span>Acepto que {config.titular} use mis datos para gestionar mi participación en el reto {config.marca}, según la <a href="/privacidad.html" className="underline font-semibold text-cobalto">política de privacidad</a>. Obligatoria.</span>
        </label>
        <label className="flex gap-3 items-start text-sm leading-relaxed text-gris">
          <input type="checkbox" name="entrenador" checked={datos.entrenador} onChange={cambiar} className="mt-0.5 size-5 shrink-0 accent-cobalto" />
          <span>Quiero que me cuenten cómo funciona el acompañamiento con entrenador personal. Opcional: si no la marcas, solo recibes lo del reto.</span>
        </label>
      </div>
      {error ? <p className="text-sm font-bold text-cobalto-hondo bg-lila/50 rounded-lg px-3 py-2" role="alert">{error}</p> : null}
      <button type="submit" disabled={fase === 'enviando'} className="boton justify-center bg-cobalto hover:bg-cobalto-hondo text-white text-lg disabled:opacity-60">
        {fase === 'enviando' ? 'Pidiendo tu plaza…' : 'Pedir mi plaza gratis'}
      </button>
      <p className="text-xs text-gris -mt-2">Gratis. Sin tarjeta. Te puedes dar de baja con un clic.</p>
    </form>
  );
}
