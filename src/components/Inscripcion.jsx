import { useState } from 'react';
import HABITOS, { buscarHabito } from '../datos/habitos.js';
import config from '../config.js';
import medir, { origenActual } from '../lib/medir.js';
import Dentro from './Dentro.jsx';
import { fechaEnZona, proximosGrupos, fechaLarga } from '../lib/grupos.js';

// Quien llega con el enlace de un amigo (?r=CODIGO&g=AAAA-MM-DD) se apunta a su mismo grupo si
// todavía se puede elegir. Se guarda en el navegador por si navega antes de apuntarse.
function invitacion() {
  var q = new URLSearchParams(window.location.search);
  var r = (q.get('r') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  var g = q.get('g') || '';
  try {
    if (r) { window.localStorage.setItem('lock21_invitacion', JSON.stringify({ r: r, g: g })); }
    else {
      var guardada = JSON.parse(window.localStorage.getItem('lock21_invitacion') || 'null');
      if (guardada) { r = guardada.r; g = guardada.g; }
    }
  } catch (e) { /* sin almacenamiento, se usa solo la URL */ }
  var elegibles = proximosGrupos(fechaEnZona(new Date()), config.grupos.elegibles);
  return { r: r, g: elegibles.indexOf(g) !== -1 ? g : '' };
}
var INVITACION = invitacion();

function codificar(datos) {
  return Object.keys(datos).map(function (clave) {
    return encodeURIComponent(clave) + '=' + encodeURIComponent(datos[clave]);
  }).join('&');
}

var CAMPO = 'w-full rounded-xl border-2 border-lila bg-white px-3.5 py-3 text-base font-normal text-noche focus:border-cobalto';

export default function Inscripcion(props) {
  var est = useState({ nombre: '', email: '', privacidad: false, acompanamiento: false, empresa: '' });
  var datos = est[0];
  var setDatos = est[1];
  var est2 = useState('listo');
  var fase = est2[0];
  var setFase = est2[1];
  var est4 = useState(null);
  var resultado = est4[0];
  var setResultado = est4[1];
  var grupo = INVITACION.g || props.grupo;
  var grupoTexto = INVITACION.g ? fechaLarga(INVITACION.g) : props.grupoTexto;
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
    var h = buscarHabito(props.habito);
    var base = {
      nombre: datos.nombre.trim(), email: datos.email.trim(), habito: h.id, grupo: grupo,
      privacidad: true, acompanamiento: datos.acompanamiento, empresa: datos.empresa, r: INVITACION.r, origen: origenActual()
    };
    // Copia de seguridad en Netlify Forms (sigue llegando el aviso de siempre).
    var formulario = fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: codificar({
        'form-name': 'lista-espera', nombre: base.nombre, email: base.email, habito: h.nombre, grupo: grupo,
        privacidad: 'si', acompanamiento: datos.acompanamiento ? 'si' : 'no', empresa: datos.empresa
      })
    }).then(function (r) { return r.ok; }).catch(function () { return false; });
    var servidor = fetch('/.netlify/functions/inscripcion', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(base)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { j.estado = r.status; return j; });
    }).catch(function () { return { estado: 0 }; });

    Promise.all([servidor, formulario]).then(function (res) {
      var r = res[0];
      if (r.estado === 409 && r.error === 'sin_plazas') {
        setFase('listo');
        setError('Ahora mismo no quedan plazas en los próximos grupos. Vuelve a intentarlo en unos días.');
        return;
      }
      if (!r.ok && !res[1]) {
        setFase('listo');
        setError('No se ha podido guardar tu plaza. Revisa la conexión e inténtalo otra vez.');
        return;
      }
      medir('solicitud');
      setResultado(Object.assign({
        nombre: base.nombre, email: base.email, grupo: grupo, plazas: config.grupos.plazas,
        habitoNombre: h.nombre, habitoCorto: h.corto, dorsal: null, codigo: null
      }, r.ok && r.guardado ? r : {}, { email: base.email }));
      setFase('hecho');
      try { window.localStorage.removeItem('lock21_invitacion'); } catch (e) { /* nada */ }
      window.setTimeout(function () {
        var el = document.getElementById('plaza');
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      }, 50);
    });
  }

  if (fase === 'hecho' && resultado) {
    return <Dentro datos={resultado} />;
  }

  return (
    <form name="lista-espera" onSubmit={enviar} noValidate className="rounded-[28px] bg-pista text-noche p-5 sm:p-8 grid gap-5">
      <p className="hidden"><label>No rellenar <input name="empresa" value={datos.empresa} onChange={cambiar} tabIndex={-1} autoComplete="off" /></label></p>
      <input type="hidden" name="grupo" value={grupo} />
      {INVITACION.r && INVITACION.g ? <p className="rounded-xl bg-dorsal/70 px-4 py-3 text-sm font-semibold">Vienes con invitación: te apuntamos al grupo del {grupoTexto}, con quien te ha pasado el enlace.</p> : null}
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
          <input type="checkbox" name="acompanamiento" checked={datos.acompanamiento} onChange={cambiar} className="mt-0.5 size-5 shrink-0 accent-cobalto" />
          <span>Quiero que me cuenten cómo funcionará el acompañamiento personalizado cuando haya plazas (será de pago). Opcional: si no la marcas, solo recibes lo del reto.</span>
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
