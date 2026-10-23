import { useState } from 'react';
import config from '../config.js';

function codificar(datos) {
  return Object.keys(datos).map(function (clave) {
    return encodeURIComponent(clave) + '=' + encodeURIComponent(datos[clave]);
  }).join('&');
}

export default function ListaEspera() {
  var est = useState({ nombre: '', email: '', reto: 'Lock21', privacidad: false, empresa: '' });
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

  function enviar(e) {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) { setError('Escribe un correo válido, por ejemplo nombre@gmail.com.'); return; }
    if (!datos.privacidad) { setError('Para apuntarte tienes que aceptar la política de privacidad.'); return; }
    setFase('enviando');
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: codificar({ 'form-name': 'lista-espera', nombre: datos.nombre, email: datos.email, reto: datos.reto, privacidad: 'si', empresa: datos.empresa })
    }).then(function (r) {
      if (!r.ok) { throw new Error('estado ' + r.status); }
      setFase('hecho');
    }).catch(function () {
      setFase('listo');
      setError('No se ha podido guardar tu correo. Inténtalo de nuevo en un momento.');
    });
  }

  if (fase === 'hecho') {
    return (
      <div className="rounded-2xl bg-tinta text-papel p-6 sm:p-8" role="status">
        <p className="font-display font-extrabold text-4xl">Estás dentro.</p>
        <p className="mt-3 text-papel/80 max-w-md">Te escribimos a {datos.email} en cuanto abra el primer reto, con el precio de lanzamiento reservado para la lista.</p>
      </div>
    );
  }

  return (
    <form name="lista-espera" onSubmit={enviar} noValidate className="rounded-2xl bg-papel border-2 border-tinta p-6 sm:p-8 grid gap-4">
      <p className="hidden"><label>No rellenar <input name="empresa" value={datos.empresa} onChange={cambiar} tabIndex={-1} autoComplete="off" /></label></p>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="grid gap-1.5 text-sm font-semibold">Tu nombre
          <input name="nombre" value={datos.nombre} onChange={cambiar} autoComplete="given-name" className="rounded-lg border-2 border-linea bg-bruma px-3 py-2.5 text-base font-normal" />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">Tu correo
          <input name="email" type="email" required value={datos.email} onChange={cambiar} autoComplete="email" className="rounded-lg border-2 border-linea bg-bruma px-3 py-2.5 text-base font-normal" />
        </label>
      </div>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-semibold mb-1.5">Me interesa empezar con</legend>
        <div className="flex flex-wrap gap-2">
          <label className={'cursor-pointer rounded-full border-2 px-4 py-2 text-sm font-semibold ' + (datos.reto === 'Lock7' ? 'border-tinta bg-tinta text-papel' : 'border-linea')}>
            <input type="radio" name="reto" value="Lock7" checked={datos.reto === 'Lock7'} onChange={cambiar} className="sr-only" />Lock7, una semana
          </label>
          <label className={'cursor-pointer rounded-full border-2 px-4 py-2 text-sm font-semibold ' + (datos.reto === 'Lock21' ? 'border-tinta bg-tinta text-papel' : 'border-linea')}>
            <input type="radio" name="reto" value="Lock21" checked={datos.reto === 'Lock21'} onChange={cambiar} className="sr-only" />Lock21, el reto completo
          </label>
        </div>
      </fieldset>
      <label className="flex gap-3 items-start text-sm text-tinta-2">
        <input type="checkbox" name="privacidad" checked={datos.privacidad} onChange={cambiar} className="mt-1 size-4 accent-sol" />
        <span>Acepto que {config.titular} use mi correo para avisarme del lanzamiento de {config.marca}, según la <a href="/privacidad.html" className="underline text-tinta">política de privacidad</a>. Puedo darme de baja cuando quiera.</span>
      </label>
      {error ? <p className="text-sm font-semibold text-sol-hondo" role="alert">{error}</p> : null}
      <button type="submit" disabled={fase === 'enviando'} className="justify-self-start rounded-full bg-sol hover:bg-sol-hondo text-papel font-bold px-6 py-3 disabled:opacity-60">
        {fase === 'enviando' ? 'Apuntando…' : 'Apuntarme a la lista'}
      </button>
    </form>
  );
}
