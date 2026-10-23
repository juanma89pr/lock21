import { useState } from 'react';
import Icono from '../../components/Icono.jsx';
import { Boton, Aviso, CAMPO } from '../componentes/ui.jsx';
import config from '../../config.js';

export default function Entrar(props) {
  var est = useState('');
  var email = est[0];
  var setEmail = est[1];
  var est2 = useState('listo');
  var fase = est2[0];
  var setFase = est2[1];
  var est3 = useState('');
  var error = est3[0];
  var setError = est3[1];
  var pideEmail = props.estado.pideEmailEnlace;

  function enviar(e) {
    e.preventDefault();
    setError('');
    var limpio = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio)) { setError('Escribe un correo válido, por ejemplo nombre@gmail.com.'); return; }
    if (props.demo) { props.servicio.entrarDemo(); return; }
    setFase('enviando');
    var promesa = pideEmail ? props.servicio.completarEnlace(limpio) : props.servicio.enviarEnlace(limpio);
    promesa.then(function () {
      setFase(pideEmail ? 'listo' : 'enviado');
    }).catch(function () {
      setFase('listo');
      setError('No se ha podido enviar el enlace. Revisa el correo y la conexión e inténtalo otra vez.');
    });
  }

  if (fase === 'enviado') {
    return (
      <div className="pt-6">
        <span className="size-16 rounded-full bg-dorsal text-noche flex items-center justify-center"><Icono nombre="correo" size={30} grosor={2} /></span>
        <h1 className="titular uppercase text-5xl mt-5" tabIndex={-1}>Mira tu correo</h1>
        <p className="mt-4 text-lg leading-relaxed">Te hemos mandado un enlace a <strong>{email.trim()}</strong>. Ábrelo desde este mismo móvil y entras directamente, sin contraseña.</p>
        <p className="mt-3 text-gris">Si no lo ves en un par de minutos, mira en promociones o spam.</p>
        <button type="button" onClick={function () { setFase('listo'); }} className="mt-6 font-semibold underline underline-offset-4 text-cobalto">Usar otro correo</button>
      </div>
    );
  }

  return (
    <div className="pt-4">
      <div className="rounded-[28px] bg-cobalto text-white p-6 -mx-1">
        <p className="inline-flex items-center gap-2 rounded-full bg-noche/35 px-3 py-1 text-sm font-semibold"><span className="size-2 rounded-full bg-dorsal" />Grupo del {config.grupo.fechaTexto}</p>
        <h1 className="titular uppercase text-[3.4rem] mt-4" tabIndex={-1}>Tu reto de 21 días empieza aquí</h1>
        <p className="mt-3 text-white/90 leading-relaxed">Entra con tu correo. Te mandamos un enlace y listo: sin contraseñas que recordar.</p>
      </div>
      <form onSubmit={enviar} noValidate className="mt-6 grid gap-4">
        {props.estado.errorEnlace ? <Aviso tono="error">{props.estado.errorEnlace}</Aviso> : null}
        {pideEmail ? <Aviso>Para terminar de entrar, confirma el correo con el que pediste el enlace.</Aviso> : null}
        <label className="grid gap-1.5 text-sm font-semibold">Tu correo
          <input type="email" inputMode="email" autoComplete="email" required value={email} onChange={function (e) { setEmail(e.target.value); }} className={CAMPO} placeholder="nombre@gmail.com" />
        </label>
        {error ? <Aviso tono="error">{error}</Aviso> : null}
        <Boton type="submit" cargando={fase === 'enviando'} icono="siguiente">{pideEmail ? 'Entrar' : 'Mandarme el enlace'}</Boton>
        {props.demo ? <p className="text-sm text-gris">Estás en modo demostración: no se envía ningún correo y los datos se quedan en este navegador.</p> : null}
      </form>
      <ul className="mt-8 grid gap-3 text-sm">
        <li className="flex gap-3"><Icono nombre="escudo" size={20} grosor={2} className="shrink-0 text-cobalto" /><span>Gratis y sin tarjeta. Solo para mayores de 18 años.</span></li>
        <li className="flex gap-3"><Icono nombre="ia" size={20} grosor={2} className="shrink-0 text-cobalto" /><span>Tu coach diario es una inteligencia artificial, y te lo diremos en cada mensaje.</span></li>
      </ul>
    </div>
  );
}
