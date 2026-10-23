import Icono from '../../components/Icono.jsx';
import config from '../../config.js';

var NOMBRES_DIA = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
var TEXTOS = {
  hecho: 'cumplido',
  perdonado: 'fallo perdonado',
  'vacio-perdonado': 'sin registrar, perdonado',
  fallo: 'segundo fallo seguido',
  vacio: 'sin registrar',
  libre: 'día libre',
  pendiente: 'hoy, pendiente',
  futuro: 'por llegar'
};

// Calendario real de los 21 días a partir del cálculo de racha.
export default function Calendario(props) {
  var cabecera = [];
  for (var d = 0; d < 7; d++) { cabecera.push(NOMBRES_DIA[(config.grupo.diaSemanaInicio + d) % 7]); }
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5">
        {cabecera.map(function (n) { return <span key={n} aria-hidden="true" className="text-center text-xs font-semibold text-gris">{n}</span>; })}
        {props.estados.map(function (e) {
          var hoy = e.dia === props.diaActual;
          var clases = 'relative aspect-square rounded-xl border-2 flex items-center justify-center ';
          var contenido = <span className="titular-medio text-lg">{e.dia}</span>;
          if (e.estado === 'hecho') {
            clases = clases + 'bg-cobalto border-cobalto text-white';
            contenido = <Icono nombre="check" size={18} grosor={3} />;
          } else if (e.estado === 'perdonado' || e.estado === 'vacio-perdonado') {
            clases = clases + 'bg-white border-dashed border-gris text-gris';
            contenido = <Icono nombre="fallo" size={16} grosor={2.5} />;
          } else if (e.estado === 'fallo' || e.estado === 'vacio') {
            clases = clases + 'bg-lila border-lila text-cobalto-hondo';
            contenido = <Icono nombre="fallo" size={16} grosor={3} />;
          } else if (e.estado === 'libre') {
            clases = clases + 'border-transparent text-gris/70';
            contenido = <Icono nombre="menos" size={14} grosor={2} />;
          } else if (e.estado === 'pendiente') {
            clases = clases + 'bg-dorsal border-noche text-noche';
          } else {
            clases = clases + 'bg-white border-lila text-gris';
          }
          if (hoy && e.estado !== 'pendiente') { clases = clases + ' ring-2 ring-dorsal ring-offset-2'; }
          return (
            <div key={e.dia} className={clases} title={'Día ' + e.dia + ': ' + TEXTOS[e.estado]}>
              {contenido}
              <span className="sr-only">{'Día ' + e.dia + ': ' + TEXTOS[e.estado]}</span>
              {e.dia === 7 || e.dia === 21 ? <span aria-hidden="true" className="absolute -top-1 -right-1 size-3 rounded-full bg-dorsal ring-2 ring-white" /> : null}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gris">
        <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-cobalto" />Cumplido</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded border-2 border-dashed border-gris" />Fallo perdonado</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-lila" />Dos seguidos</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-dorsal" />Test</span>
      </div>
    </div>
  );
}
