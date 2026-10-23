// Piezas de interfaz comunes de la app del reto.
import Icono from '../../components/Icono.jsx';

export function Boton(props) {
  var tono = props.tono || 'primario';
  var clases = {
    primario: 'bg-cobalto text-white hover:bg-cobalto-hondo',
    dorsal: 'bg-dorsal text-noche hover:bg-dorsal-hondo',
    noche: 'bg-noche text-dorsal hover:bg-cobalto-hondo',
    claro: 'bg-white text-noche border-2 border-lila hover:border-cobalto'
  };
  return (
    <button
      type={props.type || 'button'}
      onClick={props.onClick}
      disabled={props.disabled || props.cargando}
      aria-busy={props.cargando ? 'true' : undefined}
      className={'boton justify-center text-base disabled:opacity-60 disabled:cursor-not-allowed ' + clases[tono] + ' ' + (props.className || '')}
    >
      {props.cargando ? <Icono nombre="cargando" size={20} grosor={2.5} className="girar" /> : null}
      {props.children}
      {props.icono && !props.cargando ? <Icono nombre={props.icono} size={20} grosor={2.5} /> : null}
    </button>
  );
}

export function Tarjeta(props) {
  return <section aria-labelledby={props.tituloId} className={'rounded-[24px] bg-white p-5 sm:p-6 shadow-[0_2px_0_var(--color-lila)] ' + (props.className || '')}>{props.children}</section>;
}

export function Titulo(props) {
  var Etiqueta = props.nivel === 2 ? 'h2' : 'h1';
  return <Etiqueta id={props.id} tabIndex={props.nivel === 2 ? undefined : -1} className={'titular uppercase outline-none ' + (props.nivel === 2 ? 'text-3xl sm:text-4xl' : 'text-5xl sm:text-6xl') + ' ' + (props.className || '')}>{props.children}</Etiqueta>;
}

export function Aviso(props) {
  var tonos = {
    error: 'bg-lila/60 text-cobalto-hondo',
    info: 'bg-lila/40 text-noche',
    alerta: 'bg-dorsal text-noche'
  };
  return (
    <p role={props.tono === 'error' ? 'alert' : 'status'} className={'flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold leading-snug ' + tonos[props.tono || 'info'] + ' ' + (props.className || '')}>
      <Icono nombre={props.icono || (props.tono === 'error' ? 'alerta' : 'info')} size={18} grosor={2.25} className="shrink-0 mt-px" />
      <span>{props.children}</span>
    </p>
  );
}

// Grupo de botones de radio para escalas (1-5, 1-7, sí/no).
export function Escala(props) {
  return (
    <fieldset className={props.className}>
      <legend className="text-base font-bold leading-snug mb-1">{props.leyenda}</legend>
      {props.ayuda ? <p className="text-sm text-gris mb-3">{props.ayuda}</p> : <div className="mb-3" />}
      <div className={'grid gap-1.5 ' + (props.columnas || 'grid-cols-5')}>
        {props.opciones.map(function (o) {
          var activo = props.valor === o.valor;
          return (
            <label key={String(o.valor)} className={'cursor-pointer select-none rounded-xl border-2 min-h-12 px-1 py-2 flex flex-col items-center justify-center text-center transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-dorsal has-[:focus-visible]:outline-offset-2 motion-reduce:transition-none ' + (activo ? 'bg-cobalto border-cobalto text-white' : 'bg-white border-lila text-noche hover:border-cobalto')}>
              <input type="radio" name={props.nombre} value={String(o.valor)} checked={activo} onChange={function () { props.onCambio(o.valor); }} className="sr-only" />
              <span className={o.icono ? '' : 'titular-medio text-2xl leading-none'}>{o.icono ? <Icono nombre={o.icono} size={22} grosor={2.5} /> : o.etiqueta}</span>
              {o.texto ? <span className="text-xs font-semibold mt-1 leading-tight">{o.texto}</span> : null}
            </label>
          );
        })}
      </div>
      {props.extremos ? (
        <div className="mt-1.5 flex justify-between text-xs text-gris font-semibold"><span>{props.extremos[0]}</span><span>{props.extremos[1]}</span></div>
      ) : null}
    </fieldset>
  );
}

export function EtiquetaIA() {
  return <span className="inline-flex items-center gap-1 rounded-full bg-lila px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide text-cobalto-hondo"><Icono nombre="ia" size={12} grosor={2.5} />Coach IA</span>;
}

export function Cargando(props) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-gris" role="status">
      <Icono nombre="cargando" size={32} grosor={2.25} className="girar text-cobalto" />
      <span className="font-semibold">{props.texto || 'Cargando…'}</span>
    </div>
  );
}

export var CAMPO = 'w-full rounded-xl border-2 border-lila bg-white px-3.5 py-3 text-base font-normal text-noche focus:border-cobalto';
