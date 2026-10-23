import { useState } from 'react';
import Icono from '../../components/Icono.jsx';
import { Boton, Aviso } from '../componentes/ui.jsx';
import { PRIVACIDAD, MAYOR_EDAD, AVISO_IA } from '../../lib/consentimientos.js';

var ERRORES = {
  grupo_completo: 'Las plazas de este grupo ya están cubiertas. Te avisaremos para el siguiente.',
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
  var todo = e1[0] && e2[0] && e3[0];

  function seguir() {
    if (!todo) { e4[1]('Para empezar necesitas marcar las tres casillas.'); return; }
    e4[1]('');
    e5[1](true);
    props.servicio.alta().catch(function (err) {
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
        <p className="mt-2 text-sm leading-relaxed text-pista/90">El coach del reto es una inteligencia artificial. Te acompaña con tu hábito, pero no da dietas, cantidades, productos ni consejos médicos: para eso te dirá que acudas a un profesional en persona. Sus mensajes llevan siempre la etiqueta "Coach IA".</p>
      </div>
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
