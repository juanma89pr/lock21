// Marketing · Movimiento 21: el arsenal que preparan Claude y las tareas programadas
// (propuestas, grabaciones y descargables) y la programación de Instagram. Juanma decide
// en cada propuesta (aprobar, más adelante, descartar, hecha) y lo hablamos los miércoles.
import { useEffect, useState } from 'react';
import Icono from '../../components/Icono.jsx';

var PESTANAS = [
  { id: 'propuestas', nombre: 'Propuestas' },
  { id: 'grabaciones', nombre: 'Grabaciones' },
  { id: 'descargables', nombre: 'Descargables' },
  { id: 'programacion', nombre: 'Programación' }
];
var NOMBRE_ESTADO = { propuesta: 'Nueva', aprobada: 'Aprobada', mas_adelante: 'Más adelante', descartada: 'Descartada', hecha: 'Hecha', pendiente: 'Pendiente', grabada: 'Grabada' };
var CATEGORIA = { ugc: 'Contenido de participantes', contenido: 'Contenido', comunidad: 'Comunidad', alianzas: 'Alianzas', producto: 'Producto', pago: 'Promoción pagada', evento: 'Evento' };
var TIPO = { reel: 'Reel', carrusel: 'Carrusel', historia: 'Historia', imagen: 'Foto' };

function fechaBonita(iso) {
  var d = new Date(iso);
  return new Intl.DateTimeFormat('es-ES', { timeZone: 'Atlantic/Canary', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d);
}

function Decidir(props) {
  var eN = useState(props.decision && props.decision.nota ? props.decision.nota : '');
  var nota = eN[0];
  var eG = useState('');
  var guardando = eG[0];
  function guardar(estado) {
    eG[1](estado);
    props.servicio.decidirMarketing({ id: props.id, estado: estado, nota: nota }).then(function (r) {
      eG[1]('');
      props.onCambio(props.id, r.decision);
    }).catch(function () { eG[1]('error'); });
  }
  return (
    <div className="mt-3 grid gap-2">
      <input value={nota} onChange={function (e) { eN[1](e.target.value); }} placeholder="Nota para el miércoles (opcional)" className="w-full rounded-xl border-2 border-lila px-3 py-2 text-sm" />
      <div className="flex flex-wrap gap-2">
        {props.opciones.map(function (o) {
          var activo = props.decision && props.decision.estado === o;
          return <button key={o} type="button" onClick={function () { guardar(o); }} disabled={guardando !== ''} className={'rounded-full px-3 py-1.5 text-xs font-bold border-2 ' + (activo ? 'bg-cobalto text-white border-cobalto' : 'border-lila text-noche')}>{guardando === o ? '…' : NOMBRE_ESTADO[o]}</button>;
        })}
        {guardando === 'error' ? <span className="text-xs font-bold text-cobalto-hondo">No se ha guardado</span> : null}
      </div>
    </div>
  );
}

function Propuestas(props) {
  var eF = useState('abiertas');
  var filtro = eF[0];
  var lista = (props.arsenal.propuestas || []).slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
  var visibles = lista.filter(function (p) {
    var est = (props.decisiones[p.id] || {}).estado || 'propuesta';
    if (filtro === 'abiertas') { return est === 'propuesta' || est === 'aprobada'; }
    if (filtro === 'todas') { return true; }
    return est === filtro;
  });
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {[['abiertas', 'Nuevas y aprobadas'], ['mas_adelante', 'Más adelante'], ['hecha', 'Hechas'], ['descartada', 'Descartadas'], ['todas', 'Todas']].map(function (f) {
          return <button key={f[0]} type="button" onClick={function () { eF[1](f[0]); }} className={'rounded-full px-3 py-1.5 text-xs font-bold border-2 ' + (filtro === f[0] ? 'bg-noche text-white border-noche' : 'border-lila')}>{f[1]}</button>;
        })}
      </div>
      {visibles.length === 0 ? <p className="text-gris text-sm">Nada en esta lista.</p> : null}
      {visibles.map(function (p) {
        var dec = props.decisiones[p.id];
        var est = (dec || {}).estado || 'propuesta';
        return (
          <article key={p.id} className="rounded-2xl bg-white p-4 shadow-[0_2px_0_var(--color-lila)] text-sm">
            <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold uppercase tracking-wide text-gris">
              <span>{CATEGORIA[p.categoria] || p.categoria}</span><span>{p.fecha}</span><span className={est === 'propuesta' ? 'text-cobalto' : ''}>{NOMBRE_ESTADO[est]}</span>
            </p>
            <h3 className="titular-medio text-2xl mt-1">{p.titulo}</h3>
            <p className="mt-2 leading-relaxed">{p.idea}</p>
            {p.porQue ? <p className="mt-2 leading-relaxed text-gris">{p.porQue}</p> : null}
            <p className="mt-2 text-xs font-semibold">Tu tiempo: {p.esfuerzo || '—'} · Coste: {p.coste || '0 €'} · Cuándo: {p.cuando || '—'}</p>
            {p.pasos && p.pasos.length ? (
              <details className="mt-2"><summary className="cursor-pointer font-bold text-cobalto text-xs">Pasos</summary>
                <ol className="mt-2 grid gap-1 list-decimal pl-5">{p.pasos.map(function (x, i) { return <li key={i}>{x}</li>; })}</ol>
              </details>
            ) : null}
            {p.materiales && p.materiales.length ? (
              <p className="mt-2 flex flex-wrap gap-2">{p.materiales.map(function (m) {
                return <a key={m.archivo} href={m.archivo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-pista px-3 py-1 text-xs font-bold text-cobalto"><Icono nombre="descargar" size={14} grosor={2.25} />{m.nombre}</a>;
              })}</p>
            ) : null}
            <Decidir servicio={props.servicio} id={p.id} decision={dec} opciones={['aprobada', 'mas_adelante', 'descartada', 'hecha']} onCambio={props.onCambio} />
          </article>
        );
      })}
    </div>
  );
}

function Grabaciones(props) {
  var lista = props.arsenal.grabaciones || [];
  return (
    <div className="grid gap-3">
      <p className="text-sm text-gris">Cuando grabes, mándame los vídeos por el chat de Claude tal cual salen del móvil (sin editar y en vertical). Así llegan con toda la calidad.</p>
      {lista.length === 0 ? <p className="text-gris text-sm">Todavía no hay grabaciones previstas.</p> : null}
      {lista.map(function (g) {
        var dec = props.decisiones[g.id];
        var est = (dec || {}).estado || g.estado || 'pendiente';
        return (
          <article key={g.id} className="rounded-2xl bg-white p-4 shadow-[0_2px_0_var(--color-lila)] text-sm">
            <p className="flex flex-wrap gap-x-3 text-xs font-bold uppercase tracking-wide text-gris"><span>{g.quien}</span><span>{g.para}</span><span>{NOMBRE_ESTADO[est] || est}</span></p>
            <h3 className="titular-medio text-2xl mt-1">{g.titulo}</h3>
            <ol className="mt-2 grid gap-1 list-decimal pl-5">{(g.guion || []).map(function (x, i) { return <li key={i}>«{x}»</li>; })}</ol>
            {g.como ? <p className="mt-2 text-gris leading-relaxed">{g.como}</p> : null}
            <Decidir servicio={props.servicio} id={g.id} decision={dec} opciones={['pendiente', 'grabada', 'descartada']} onCambio={props.onCambio} />
          </article>
        );
      })}
    </div>
  );
}

function Descargables(props) {
  var lista = props.arsenal.descargables || [];
  return (
    <ul className="grid sm:grid-cols-2 gap-3">
      {lista.map(function (d) {
        var imagen = /\.(jpe?g|png)$/i.test(d.archivo);
        return (
          <li key={d.archivo} className="rounded-2xl bg-white p-3 shadow-[0_2px_0_var(--color-lila)] text-sm grid gap-2">
            {imagen ? <img src={d.archivo} alt="" loading="lazy" className="w-full max-h-56 object-contain rounded-xl bg-pista" /> : null}
            <p className="font-bold">{d.nombre}</p>
            {d.descripcion ? <p className="text-gris">{d.descripcion}</p> : null}
            <a href={d.archivo} target="_blank" rel="noopener noreferrer" download={d.tipo === 'pagina' ? undefined : ''} className="inline-flex items-center gap-1.5 font-bold text-cobalto"><Icono nombre={d.tipo === 'pagina' ? 'siguiente' : 'descargar'} size={16} grosor={2.25} />{d.tipo === 'pagina' ? 'Abrir' : 'Descargar'}</a>
          </li>
        );
      })}
    </ul>
  );
}

function Programacion(props) {
  var lista = props.programacion || [];
  if (!lista.length) { return <p className="text-gris text-sm">No hay nada programado en las próximas tres semanas.</p>; }
  return (
    <ul className="grid gap-2">
      {lista.map(function (p) {
        return (
          <li key={p.id} className="flex gap-3 items-center rounded-2xl bg-white p-2 pr-3 shadow-[0_2px_0_var(--color-lila)] text-sm">
            {p.miniatura ? <img src={p.miniatura} alt="" loading="lazy" className="w-14 h-20 object-cover rounded-lg bg-pista shrink-0" /> : <span className="w-14 h-20 rounded-lg bg-pista shrink-0" />}
            <span className="grid gap-0.5 min-w-0">
              <span className="text-xs font-bold uppercase tracking-wide text-gris">{fechaBonita(p.fecha)} · {TIPO[p.tipo] || p.tipo}</span>
              <span className="font-semibold truncate">{p.titulo}</span>
              <span className={'text-xs font-bold ' + (p.estado === 'publicado' ? 'text-cobalto' : 'text-gris')}>{p.estado === 'publicado' ? 'Publicado' : p.estado === 'programada' ? 'Programado' : p.estado}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function Marketing(props) {
  var eD = useState(null);
  var datos = eD[0];
  var eE = useState('');
  var error = eE[0];
  var eP = useState('propuestas');
  var pestana = eP[0];

  useEffect(function () {
    props.servicio.marketing().then(function (r) { eD[1](r); }).catch(function (err) { eE[1](err.codigo || 'error'); });
  }, [props.servicio]);

  function cambio(id, decision) {
    var d = Object.assign({}, datos.decisiones);
    d[id] = decision;
    eD[1](Object.assign({}, datos, { decisiones: d }));
  }

  var nuevas = datos ? (datos.arsenal.propuestas || []).filter(function (p) { return !datos.decisiones[p.id]; }).length : 0;

  return (
    <section aria-labelledby="t-marketing" className="grid gap-3">
      <h2 id="t-marketing" className="titular-medio text-3xl">Marketing · Movimiento 21</h2>
      <p className="text-sm text-gris">Lo que preparo para ti: propuestas nuevas cada día, grabaciones con guion, material para descargar y lo que sale en Instagram. Lo repasamos los miércoles.</p>
      {error ? <p className="text-sm font-bold text-cobalto-hondo">No se ha podido cargar ({error}).</p> : null}
      {!datos && !error ? <p className="text-sm text-gris">Cargando…</p> : null}
      {datos ? (
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-2" role="tablist">
            {PESTANAS.map(function (p) {
              var activo = p.id === pestana;
              return <button key={p.id} role="tab" aria-selected={activo} type="button" onClick={function () { eP[1](p.id); }} className={'rounded-full px-4 py-2 text-sm font-bold ' + (activo ? 'bg-cobalto text-white' : 'bg-white text-noche border-2 border-lila')}>{p.nombre}{p.id === 'propuestas' && nuevas ? ' (' + nuevas + ' nuevas)' : ''}</button>;
            })}
          </div>
          {pestana === 'propuestas' ? <Propuestas arsenal={datos.arsenal} decisiones={datos.decisiones} servicio={props.servicio} onCambio={cambio} /> : null}
          {pestana === 'grabaciones' ? <Grabaciones arsenal={datos.arsenal} decisiones={datos.decisiones} servicio={props.servicio} onCambio={cambio} /> : null}
          {pestana === 'descargables' ? <Descargables arsenal={datos.arsenal} /> : null}
          {pestana === 'programacion' ? <Programacion programacion={datos.programacion} /> : null}
        </div>
      ) : null}
    </section>
  );
}
