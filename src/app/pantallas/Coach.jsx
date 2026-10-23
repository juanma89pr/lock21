import { useEffect, useRef, useState } from 'react';
import Icono from '../../components/Icono.jsx';
import { Boton, Aviso, EtiquetaIA, CAMPO } from '../componentes/ui.jsx';

// Chat opcional con el coach (20 mensajes al día).
export default function Coach(props) {
  var chat = props.estado.datos.chat || [];
  var e1 = useState('');
  var texto = e1[0];
  var setTexto = e1[1];
  var e2 = useState(false);
  var e3 = useState('');
  var e4 = useState(null);
  var final = useRef(null);

  useEffect(function () {
    if (final.current && chat.length) { final.current.scrollIntoView({ block: 'end' }); }
  }, [chat.length]);

  function enviar(e) {
    e.preventDefault();
    var limpio = texto.trim();
    if (!limpio) { return; }
    e3[1]('');
    e2[1](true);
    props.servicio.chatear(limpio).then(function (r) {
      e2[1](false);
      setTexto('');
      if (typeof r.quedan === 'number') { e4[1](r.quedan); }
    }).catch(function (err) {
      e2[1](false);
      e3[1](err.codigo === 'limite_diario' ? 'Has llegado a los 20 mensajes de hoy. Mañana seguimos.' : 'No se ha podido enviar. Inténtalo otra vez.');
    });
  }

  return (
    <div className="grid gap-4">
      <h1 className="titular uppercase text-5xl" tabIndex={-1}>Coach</h1>
      <Aviso icono="ia">Estás hablando con una IA. No da dietas, cantidades ni consejos médicos. Si estás mal de verdad, llama al 024 o al 112.</Aviso>

      <ol className="grid gap-3" aria-live="polite" aria-label="Conversación con el coach">
        {chat.length === 0 ? (
          <li className="rounded-2xl bg-white p-4 text-gris shadow-[0_2px_0_var(--color-lila)]">Pregúntale lo que quieras sobre tu hábito: qué hacer un día raro, cómo encajar tu señal en un viaje, por qué te cuesta más los lunes.</li>
        ) : null}
        {chat.map(function (m, i) {
          var coach = m.rol === 'coach';
          return (
            <li key={i} className={'max-w-[88%] rounded-2xl px-4 py-3 leading-relaxed ' + (coach ? 'bg-noche text-pista justify-self-start rounded-bl-md' : 'bg-cobalto text-white justify-self-end rounded-br-md')}>
              {coach ? <div className="mb-1.5"><EtiquetaIA /></div> : <span className="sr-only">Tú: </span>}
              {m.texto}
            </li>
          );
        })}
      </ol>
      <div ref={final} className="h-32" aria-hidden="true" />

      <form onSubmit={enviar} className="fixed inset-x-0 bottom-[calc(4.6rem+env(safe-area-inset-bottom))] z-10 mx-auto max-w-xl grid gap-2 bg-pista px-4 pt-2 pb-2 border-t border-lila">
        <label htmlFor="mensaje-coach" className="sr-only">Mensaje para el coach</label>
        <div className="flex gap-2">
          <textarea id="mensaje-coach" value={texto} onChange={function (e) { setTexto(e.target.value); }} maxLength={800} rows={2} placeholder="Escribe al coach" className={CAMPO + ' resize-none flex-1'} />
          <Boton type="submit" cargando={e2[0]} disabled={!texto.trim()} className="self-stretch px-4" ><span className="sr-only">Enviar</span>{e2[0] ? null : <Icono nombre="enviar" size={20} grosor={2.5} />}</Boton>
        </div>
        {e3[0] ? <Aviso tono="error">{e3[0]}</Aviso> : null}
        {typeof e4[0] === 'number' ? <p className="text-xs text-gris">Te quedan {e4[0]} mensajes hoy.</p> : null}
      </form>
    </div>
  );
}
