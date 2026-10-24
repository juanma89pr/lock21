import { useEffect, useState } from 'react';
import Icono from '../../components/Icono.jsx';
import { Boton, Aviso } from './ui.jsx';
import { fechaLarga } from '../../lib/grupos.js';

// Pasar a otro de los próximos grupos con plazas. El servidor solo lo permite
// mientras el grupo actual no ha empezado (o si la persona aún no ha hecho ningún check-in).
export default function CambiarGrupo(props) {
  var e1 = useState(Boolean(props.abierto));
  var e2 = useState(null);
  var e3 = useState('');
  var e4 = useState('');
  var abierto = e1[0];
  var opciones = e2[0];
  var actual = props.reto.grupo;

  function cargar() {
    props.servicio.opcionesGrupo().then(function (r) { e2[1](r); }).catch(function () { e3[1]('No se han podido cargar los grupos.'); });
  }

  function abrir() {
    e1[1](true);
    if (!opciones) { cargar(); }
  }

  // Si se muestra abierto desde el principio, carga los grupos una vez.
  var abiertoAlInicio = Boolean(props.abierto);
  var servicio = props.servicio;
  useEffect(function () {
    if (!abiertoAlInicio) { return; }
    servicio.opcionesGrupo().then(function (r) { e2[1](r); }).catch(function () { e3[1]('No se han podido cargar los grupos.'); });
  }, [abiertoAlInicio, servicio]);

  function cambiar(fecha) {
    e3[1]('');
    e4[1](fecha);
    props.servicio.cambiarGrupo(fecha).then(function () {
      e4[1]('hecho');
      e1[1](false);
      if (props.onCambio) { props.onCambio(fecha); }
    }).catch(function (err) {
      e4[1]('');
      e3[1](err.codigo === 'grupo_completo' ? 'Ese grupo se acaba de llenar. Elige otro.' : err.codigo === 'grupo_en_marcha' ? 'Tu grupo ya está en marcha: ya no se puede cambiar.' : 'No se ha podido cambiar. Inténtalo otra vez.');
    });
  }

  if (!abierto) {
    return (
      <div className={props.className}>
        {e4[0] === 'hecho' ? <Aviso className="mb-2">Grupo cambiado: empiezas el {fechaLarga(actual, props.reto.hoy)}.</Aviso> : null}
        <button type="button" onClick={abrir} className="flex items-center gap-2 text-sm font-semibold text-cobalto underline underline-offset-4">
          <Icono nombre="grupo" size={16} grosor={2.25} className="shrink-0" />Cambiar de grupo
        </button>
      </div>
    );
  }

  var lista = opciones ? opciones.opciones.filter(function (o) { return o.fecha !== actual; }) : [];

  return (
    <div className={'rounded-2xl bg-white border-2 border-lila p-4 ' + (props.className || '')}>
      <p className="font-bold flex items-center gap-2"><Icono nombre="grupo" size={18} grosor={2.25} className="text-cobalto" />Elige otro grupo</p>
      <p className="mt-1 text-sm text-gris">Empieza un grupo nuevo cada dos semanas, siempre en lunes.</p>
      {!opciones && !e3[0] ? <p className="mt-3 text-sm text-gris">Cargando grupos…</p> : null}
      {opciones && lista.length === 0 ? <p className="mt-3 text-sm text-gris">Ahora mismo no hay otro grupo con plazas.</p> : null}
      <div className="mt-3 grid gap-2">
        {lista.map(function (o) {
          return (
            <Boton key={o.fecha} tono="claro" cargando={e4[0] === o.fecha} onClick={function () { cambiar(o.fecha); }} className="w-full">
              <span className="block text-center first-letter:uppercase">{fechaLarga(o.fecha, props.reto.hoy)}{opciones.exacto ? <span className="block text-xs font-semibold text-gris">Quedan {o.libres} plazas</span> : null}</span>
            </Boton>
          );
        })}
      </div>
      {e3[0] ? <Aviso tono="error" className="mt-3">{e3[0]}</Aviso> : null}
      {props.abierto ? null : <button type="button" onClick={function () { e1[1](false); }} className="mt-3 text-sm font-semibold text-gris underline underline-offset-4">Me quedo en mi grupo</button>}
    </div>
  );
}
