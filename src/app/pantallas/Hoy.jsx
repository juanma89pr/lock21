import { useState } from 'react';
import Icono from '../../components/Icono.jsx';
import { Boton, Aviso, Escala, EtiquetaIA, CAMPO } from '../componentes/ui.jsx';
import { calcularRacha, toca, testAbierto } from '../../lib/reto.js';
import { buscarHabito } from '../../datos/habitos.js';
import { navegar } from '../AppReto.jsx';
import { fechaLarga } from '../../lib/grupos.js';
import Calentamiento from '../componentes/Calentamiento.jsx';
import CambiarGrupo from '../componentes/CambiarGrupo.jsx';

var ANIMO = [
  { valor: 1, etiqueta: '1', texto: 'Fatal' },
  { valor: 2, etiqueta: '2', texto: 'Bajo' },
  { valor: 3, etiqueta: '3', texto: 'Normal' },
  { valor: 4, etiqueta: '4', texto: 'Bien' },
  { valor: 5, etiqueta: '5', texto: 'Genial' }
];
var SUENO = [
  { valor: 1, etiqueta: '1', texto: 'Fatal' },
  { valor: 2, etiqueta: '2', texto: 'Mal' },
  { valor: 3, etiqueta: '3', texto: 'Regular' },
  { valor: 4, etiqueta: '4', texto: 'Bien' },
  { valor: 5, etiqueta: '5', texto: 'Muy bien' }
];
var SI_NO = [
  { valor: true, icono: 'check', texto: 'Sí' },
  { valor: false, icono: 'fallo', texto: 'No' }
];

function Senal(props) {
  var h = buscarHabito(props.perfil.habito);
  return (
    <div className="rounded-[24px] bg-cobalto text-white p-5">
      <div className="flex items-center gap-3">
        <span className="size-11 shrink-0 rounded-full bg-dorsal text-noche flex items-center justify-center"><Icono nombre={h.icono} size={22} grosor={2} /></span>
        <p className="titular-medio text-2xl leading-none">{h.nombre}</p>
      </div>
      <p className="mt-4 leading-snug"><Icono nombre="senal" size={16} grosor={2.25} className="inline -mt-0.5 mr-1.5 text-dorsal" /><strong>{props.perfil.senal.replace(/[.,\s]+$/, '')},</strong> {props.perfil.accion}</p>
      <p className="mt-2 text-sm text-white/85"><Icono nombre="minima" size={14} grosor={2.25} className="inline -mt-0.5 mr-1.5 text-dorsal" />Versión mínima: {props.perfil.minima}</p>
    </div>
  );
}

function RespuestaCoach(props) {
  var c = props.coach;
  if (!c) { return null; }
  var riesgo = c.fuente === 'riesgo';
  return (
    <section aria-labelledby="titulo-coach" className={'rounded-[24px] p-5 ' + (riesgo ? 'bg-dorsal text-noche' : 'bg-noche text-pista')}>
      <div className="flex items-center justify-between gap-2">
        <h2 id="titulo-coach" className="titular-medio text-2xl">Tu coach</h2>
        <EtiquetaIA />
      </div>
      <p className="mt-3 leading-relaxed" aria-live="polite">{c.mensaje}</p>
      {riesgo ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <a href="tel:024" className="boton justify-center bg-noche text-dorsal">Llamar al 024</a>
          <a href="tel:112" className="boton justify-center bg-white text-noche">Llamar al 112</a>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-white/10 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-dorsal">Para mañana{c.nivel === 'minimo' ? ' · versión mínima' : ''}</p>
          <p className="mt-1 font-semibold leading-snug">{c.tareaManana}</p>
        </div>
      )}
      {c.fuente === 'respaldo' ? <p className="mt-3 text-xs opacity-70">Mensaje automático del coach (sin IA en este momento).</p> : null}
    </section>
  );
}

function Formulario(props) {
  var e1 = useState(null);
  var e2 = useState(null);
  var e3 = useState(null);
  var e4 = useState(null);
  var e5 = useState('');
  var e6 = useState('');
  var e7 = useState(false);

  function enviar(e) {
    e.preventDefault();
    if (e1[0] === null || e2[0] === null || e3[0] === null) { e6[1]('Responde si lo hiciste, tu ánimo y tu sueño.'); return; }
    e6[1]('');
    e7[1](true);
    props.servicio.enviarCheckin({ hecho: e1[0], animo: e2[0], sueno: e3[0], sinPensar: e1[0] && e4[0] === true, nota: e5[0].trim() }).then(function () {
      e7[1](false);
    }).catch(function (err) {
      e7[1](false);
      e6[1](err.codigo === 'reto_no_empezado' ? 'El reto aún no ha empezado.' : 'No se ha podido guardar. Revisa la conexión e inténtalo otra vez.');
    });
  }

  return (
    <form onSubmit={enviar} noValidate aria-labelledby="titulo-checkin" className="rounded-[24px] bg-white p-5 grid gap-6 shadow-[0_2px_0_var(--color-lila)]">
      <h2 id="titulo-checkin" className="titular-medio text-3xl">Check-in del día {props.dia}</h2>
      {props.alerta ? <Aviso tono="alerta" icono="alerta">Ayer fue un fallo. Hoy cuenta doble: aunque sea, haz tu versión mínima.</Aviso> : null}
      <Escala nombre="hecho" leyenda="¿Lo hiciste hoy?" valor={e1[0]} onCambio={e1[1]} opciones={SI_NO} columnas="grid-cols-2" />
      {e1[0] === true ? (
        <Escala nombre="sin-pensar" leyenda="¿Hoy lo hiciste sin pensarlo?" ayuda="Si te salió casi solo, sin tener que convencerte." valor={e4[0]} onCambio={e4[1]} opciones={SI_NO} columnas="grid-cols-2" />
      ) : null}
      <Escala nombre="animo" leyenda="¿Cómo está tu ánimo?" valor={e2[0]} onCambio={e2[1]} opciones={ANIMO} />
      <Escala nombre="sueno" leyenda="¿Cómo dormiste anoche?" valor={e3[0]} onCambio={e3[1]} opciones={SUENO} />
      <label className="grid gap-1.5">
        <span className="text-base font-bold">Nota para el coach <span className="font-normal text-gris">(opcional)</span></span>
        <textarea value={e5[0]} onChange={function (e) { e5[1](e.target.value); }} maxLength={500} rows={3} className={CAMPO + ' resize-y'} placeholder="Qué te ayudó o qué se cruzó hoy" />
        <span className="text-xs text-gris">La lee una IA. No pongas tu nombre ni datos de salud.</span>
      </label>
      {e6[0] ? <Aviso tono="error">{e6[0]}</Aviso> : null}
      <Boton type="submit" cargando={e7[0]} icono="enviar" className="w-full">{e7[0] ? 'El coach está leyendo…' : 'Enviar check-in'}</Boton>
    </form>
  );
}

function Cuenta(props) {
  var dias = props.reto.diasHastaInicio;
  return (
    <div className="grid gap-4">
      <div className="rounded-[24px] bg-noche text-pista p-6 text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-dorsal">Tu grupo empieza en</p>
        <p className="titular text-[7rem] leading-none mt-2 text-dorsal">{dias}</p>
        <p className="titular-medio text-3xl">{dias === 1 ? 'día' : 'días'}</p>
        <p className="mt-3 text-pista/80">Empiezas el {fechaLarga(props.reto.grupo, props.reto.hoy)}, con tu grupo. Ese día recibirás tu primer check-in.</p>
      </div>
      <Calentamiento servicio={props.servicio} perfil={props.perfil} reto={props.reto} />
      <Senal perfil={props.perfil} />
      <section aria-labelledby="titulo-preparar" className="rounded-[24px] bg-white p-5 shadow-[0_2px_0_var(--color-lila)]">
        <h2 id="titulo-preparar" className="titular-medio text-2xl">Tu preparación</h2>
        <ul className="mt-3 grid gap-3">
          <li className="flex gap-3 items-start"><Icono nombre="check" size={20} grosor={3} className="shrink-0 text-cobalto mt-0.5" /><span>Hábito y señal elegidos.</span></li>
          <li className="flex gap-3 items-start"><Icono nombre="check" size={20} grosor={3} className="shrink-0 text-cobalto mt-0.5" /><span>Test del día 0 hecho. Puedes repetirlo hasta el día 1 si cambias de hábito.</span></li>
        </ul>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Boton tono="claro" onClick={function () { navegar('/app/habito'); }}>Cambiar hábito</Boton>
          <Boton tono="claro" onClick={function () { navegar('/app/test'); }}>Repetir test</Boton>
        </div>
        <CambiarGrupo servicio={props.servicio} reto={props.reto} className="mt-5" />
      </section>
    </div>
  );
}

export default function Hoy(props) {
  var estado = props.estado;
  var reto = estado.reto;
  var d = estado.datos;
  var perfil = d.perfil;

  if (reto.fase === 'antes') {
    return (
      <div>
        <h1 className="titular uppercase text-5xl mb-4" tabIndex={-1}>Todo listo</h1>
        <Cuenta reto={reto} perfil={perfil} servicio={props.servicio} />
      </div>
    );
  }

  var racha = calcularRacha(perfil.habito, d.checkins, reto.dia, reto.grupo);
  var hechos = {};
  Object.keys(d.srbai).forEach(function (k) { hechos[k] = true; });
  var test = testAbierto(reto.dia, hechos);

  if (reto.fase === 'fin') {
    return (
      <div className="grid gap-4">
        <h1 className="titular uppercase text-5xl" tabIndex={-1}>Reto terminado</h1>
        <p className="leading-relaxed text-gris">Has llegado al final de los 21 días. Cumpliste {racha.hechos} de {racha.programados} días programados.</p>
        {test === 21 ? <Boton tono="dorsal" icono="siguiente" onClick={function () { navegar('/app/test'); }}>Hacer el test final del día 21</Boton> : null}
        <Boton icono="informe" onClick={function () { navegar('/app/informe'); }}>Ver mi informe</Boton>
      </div>
    );
  }

  var habito = buscarHabito(perfil.habito);
  var hoy = d.checkins[String(reto.dia)];
  var tocaHoy = toca(habito, reto.dia, reto.grupo);

  return (
    <div className="grid gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-cobalto">Día {reto.dia} de {reto.duracion}</p>
          <h1 className="titular uppercase text-5xl mt-0.5" tabIndex={-1}>Hoy</h1>
        </div>
        <div className="rounded-2xl bg-dorsal text-noche px-4 py-2 text-center" aria-label={'Racha de ' + racha.racha + ' días'}>
          <p className="flex items-center gap-1 titular text-4xl leading-none"><Icono nombre="racha" size={24} grosor={2.5} />{racha.racha}</p>
          <p className="text-xs font-bold">racha</p>
        </div>
      </div>

      {test !== null ? (
        <button type="button" onClick={function () { navegar('/app/test'); }} className="flex items-center gap-3 rounded-2xl bg-noche text-pista p-4 text-left">
          <span className="size-10 shrink-0 rounded-full bg-dorsal text-noche flex items-center justify-center"><Icono nombre="cerebro" size={20} grosor={2.25} /></span>
          <span className="flex-1"><strong className="block">Toca el test del día {test}</strong><span className="text-sm text-pista/80">Cuatro preguntas, un minuto.</span></span>
          <Icono nombre="siguiente" size={20} grosor={2.5} />
        </button>
      ) : null}

      <Senal perfil={perfil} />

      {hoy ? (
        <div className="grid gap-4">
          <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_0_var(--color-lila)]" role="status">
            <span className={'size-10 shrink-0 rounded-full flex items-center justify-center ' + (hoy.hecho ? 'bg-cobalto text-white' : 'bg-lila text-cobalto-hondo')}><Icono nombre={hoy.hecho ? 'check' : 'fallo'} size={20} grosor={3} /></span>
            <p className="font-semibold leading-snug">{hoy.hecho ? 'Check-in de hoy hecho. Un día más sumado.' : 'Check-in de hoy hecho. Mañana no puede fallar.'}</p>
          </div>
          <RespuestaCoach coach={hoy.coach} />
          <Boton tono="claro" icono="chat" onClick={function () { navegar('/app/coach'); }}>Hablar con el coach</Boton>
        </div>
      ) : tocaHoy ? (
        <Formulario servicio={props.servicio} dia={reto.dia} alerta={racha.alerta} />
      ) : (
        <div className="rounded-[24px] bg-white p-5 shadow-[0_2px_0_var(--color-lila)]">
          <h2 className="titular-medio text-2xl">Hoy es día libre</h2>
          <p className="mt-2 text-gris leading-relaxed">Tu hábito no toca hoy según tu plan. Descansa: también forma parte.</p>
        </div>
      )}
    </div>
  );
}
