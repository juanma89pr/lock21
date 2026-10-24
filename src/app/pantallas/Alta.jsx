import { useEffect, useState } from 'react';
import Icono from '../../components/Icono.jsx';
import { Boton, Aviso } from '../componentes/ui.jsx';
import { PRIVACIDAD, MAYOR_EDAD, AVISO_IA } from '../../lib/consentimientos.js';
import { fechaLarga } from '../../lib/grupos.js';

var ERRORES = {
  grupo_completo: 'No quedan plazas en los próximos grupos. Inténtalo de nuevo en unos días.',
  version_desfasada: 'Los textos legales han cambiado. Recarga la página para ver la versión actual.'
};

function Casilla(props) {
  return (
    <label className="flex gap-3 items-start rounded-2xl bg-white border-2 border-lila p-4 cursor-pointer has-[:checked]:border-cobalto">
      <input type="checkbox" checked={props.valor} onChange={function (e) { props.onCambio(e.target.checked); }} className="mt-0.5 size-5 shrink-0 accent-cobalto" />
      <span className="text-sm leading-relaxed">{props.children}</span>
    </label>
  );
}

export default function Alta(props) {
  var e1 = useState(false);
  var e2 = useState(false);
  var e3 = useState(false);
  var e4 = useState('');
  var e5 = useState(false);
  var e6 = useState(null);
  var e7 = useState('');
  var opciones = e6[0];
  var grupo = e7[0];
  var setGrupo = e7[1];
  var todo = e1[0] && e2[0] && e3[0];
  var servicio = props.servicio;

  // Próximos grupos con plazas: por defecto, el primero.
  useEffect(function () {
    servicio.opcionesGrupo().then(function (r) {
      e6[1](r);
      if (r.opciones.length) { setGrupo(r.opciones[0].fecha); }
    });
  }, [servicio]);

  function seguir() {
    if (!todo) { e4[1]('Para empezar necesitas marcar las tres casillas.'); return; }
    e4[1]('');
    e5[1](true);
    props.servicio.alta(grupo).catch(function (err) {
      e5[1](false);
      e4[1](ERRORES[err.codigo] || 'No se ha podido guardar. Revisa la conexión e inténtalo otra vez.');
    });
  }

  return (
    <div>
      <p className="text-sm font-bold text-cobalto">Paso 1 de 3</p>
      <h1 className="titular uppercase text-5xl mt-1" tabIndex={-1}>Antes de empezar</h1>
      <div className="mt-5 rounded-2xl bg-noche text-pista p-5">
        <p className="flex items-center gap-2 font-bold text-dorsal"><Icono nombre="ia" size={20} grosor={2.25} />Estás hablando con una IA</p>
        <p className="mt-2 text-sm leading-relaxed text-pista/90">El coach del reto es una inteligencia artificial. Te acompaña con tu hábito, pero no da dietas, cantidades, productos ni consejos médicos: para eso te dirá que acudas a tu médico o a otro profesional sanitario. Sus mensajes llevan siempre la etiqueta "Coach IA".</p>
      </div>
      {opciones && opciones.opciones.length ? (
        <fieldset className="mt-5">
          <legend className="font-bold flex items-center gap-2"><Icono nombre="grupo" size={18} grosor={2.25} className="text-cobalto" />Tu grupo</legend>
          <p className="text-sm text-gris mt-1">Empieza un grupo cada dos semanas, en lunes, con {opciones.plazas} plazas. Si el que eliges se llena, pasas al siguiente.</p>
          <div className="mt-3 grid gap-2">
            {opciones.opciones.map(function (o, i) {
              var activo = o.fecha === grupo;
              return (
                <label key={o.fecha} className={'cursor-pointer flex items-center gap-3 rounded-2xl border-2 px-4 py-3 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-dorsal has-[:focus-visible]:outline-offset-2 ' + (activo ? 'bg-cobalto border-cobalto text-white' : 'bg-white border-lila hover:border-cobalto')}>
                  <input type="radio" name="grupo" value={o.fecha} checked={activo} onChange={function () { setGrupo(o.fecha); }} className="sr-only" />
                  <Icono nombre="calendario" size={20} grosor={2.25} className={activo ? 'text-dorsal' : 'text-cobalto'} />
                  <span className="flex-1 leading-snug">
                    <span className="block font-bold first-letter:uppercase">{fechaLarga(o.fecha, opciones.hoy)}</span>
                    <span className={'block text-xs font-semibold ' + (activo ? 'text-white/85' : 'text-gris')}>{i === 0 ? 'El próximo grupo' : 'Dos semanas después'}{opciones.exacto ? ' · quedan ' + o.libres + ' plazas' : ''}</span>
                  </span>
                  {activo ? <Icono nombre="check" size={20} grosor={3} className="shrink-0" /> : null}
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}
      <div className="mt-5 grid gap-3">
        <Casilla valor={e1[0]} onCambio={e1[1]}>{MAYOR_EDAD.texto}</Casilla>
        <Casilla valor={e2[0]} onCambio={e2[1]}>{PRIVACIDAD.texto} <a href="/privacidad.html" target="_blank" rel="noopener" className="underline font-semibold text-cobalto">Leer la política de privacidad</a>.</Casilla>
        <Casilla valor={e3[0]} onCambio={e3[1]}>{AVISO_IA.texto}</Casilla>
      </div>
      {e4[0] ? <Aviso tono="error" className="mt-4">{e4[0]}</Aviso> : null}
      <Boton onClick={seguir} cargando={e5[0]} icono="siguiente" className="mt-5 w-full">Aceptar y seguir</Boton>
    </div>
  );
}
