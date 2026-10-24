import { useState } from 'react';
import Icono from '../../components/Icono.jsx';
import { Boton, Aviso } from './ui.jsx';
import { misionDelDia } from '../../datos/calentamiento.js';

// Misión diaria de 1 minuto mientras se espera al inicio del grupo.
// No cuenta para los 21 días ni para la racha; el "hecha" se guarda en el servidor.
export default function Calentamiento(props) {
  var perfil = props.perfil;
  var reto = props.reto;
  var e1 = useState(false);
  var e2 = useState('');
  var mision = misionDelDia(perfil, reto.hoy);
  var hechos = perfil.calentamiento || {};
  var hechaHoy = Boolean(hechos[reto.hoy]);
  var dias = Object.keys(hechos).length;

  function marcar() {
    e2[1]('');
    e1[1](true);
    props.servicio.marcarCalentamiento().then(function () {
      e1[1](false);
    }).catch(function (err) {
      e1[1](false);
      e2[1](err.codigo === 'reto_empezado' ? 'Tu grupo ya ha empezado: ahora toca el check-in del día.' : 'No se ha podido guardar. Revisa la conexión e inténtalo otra vez.');
    });
  }

  return (
    <section aria-labelledby="titulo-calentamiento" className="rounded-[24px] bg-dorsal text-noche p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide"><Icono nombre="calentamiento" size={16} grosor={2.5} />Calentamiento · 1 minuto</p>
        <p className="rounded-full bg-noche text-dorsal px-2.5 py-1 text-xs font-bold" aria-label={'Días de calentamiento hechos: ' + dias}>{dias} {dias === 1 ? 'día hecho' : 'días hechos'}</p>
      </div>
      <h2 id="titulo-calentamiento" className="titular-medio text-3xl mt-3 leading-none">{mision.titulo}</h2>
      <p className="mt-2 leading-relaxed">{mision.texto}</p>
      {hechaHoy ? (
        <p className="mt-4 flex items-center gap-2.5 rounded-2xl bg-noche text-pista px-4 py-3 font-semibold" role="status">
          <span className="size-8 shrink-0 rounded-full bg-dorsal text-noche flex items-center justify-center"><Icono nombre="check" size={18} grosor={3} /></span>
          Hecha. Mañana tienes otra.
        </p>
      ) : (
        <Boton tono="noche" icono="check" cargando={e1[0]} onClick={marcar} className="mt-4 w-full">Misión hecha</Boton>
      )}
      {e2[0] ? <Aviso tono="error" className="mt-3">{e2[0]}</Aviso> : null}
      <p className="mt-4 text-sm leading-snug text-noche/80">Los días de calentamiento no cuentan para los 21 días ni para la racha. Sirven para que el arranque cueste menos.</p>
    </section>
  );
}
