import { useState } from 'react';
import Icono from '../../components/Icono.jsx';
import { Boton, Aviso, CAMPO } from '../componentes/ui.jsx';
import HABITOS, { buscarHabito } from '../../datos/habitos.js';
import { navegar } from '../AppReto.jsx';

// Paso 2: un hábito del menú, su señal ("después de X, hago Y") y su versión mínima.
export default function ElegirHabito(props) {
  var perfil = props.perfil;
  var editando = Boolean(perfil.habito);
  var inicial = buscarHabito(perfil.habito || 'pasos');
  var e1 = useState(perfil.habito || '');
  var habitoId = e1[0];
  var e2 = useState({ senal: perfil.senal || '', accion: perfil.accion || '', minima: perfil.minima || '' });
  var campos = e2[0];
  var setCampos = e2[1];
  var e3 = useState('');
  var error = e3[0];
  var setError = e3[1];
  var e4 = useState(false);

  function elegir(id) {
    var h = buscarHabito(id);
    var anterior = buscarHabito(habitoId || inicial.id);
    // Si no ha tocado los textos, se rellenan con el ejemplo del hábito elegido.
    var nuevos = Object.assign({}, campos);
    if (!campos.senal || campos.senal === anterior.senal) { nuevos.senal = h.senal; }
    if (!campos.accion || campos.accion === anterior.accion) { nuevos.accion = h.accion; }
    if (!campos.minima || campos.minima === anterior.minima) { nuevos.minima = h.minima; }
    e1[1](id);
    setCampos(nuevos);
  }

  function cambiar(e) {
    var n = Object.assign({}, campos);
    n[e.target.name] = e.target.value;
    setCampos(n);
  }

  function guardar(e) {
    e.preventDefault();
    if (!habitoId) { setError('Elige un hábito del menú.'); return; }
    if (!campos.senal.trim() || !campos.accion.trim()) { setError('Completa tu señal: después de qué lo haces y qué haces.'); return; }
    if (!campos.minima.trim()) { setError('Escribe tu versión mínima de 2 minutos para los días malos.'); return; }
    setError('');
    e4[1](true);
    props.servicio.guardarHabito({ habito: habitoId, senal: campos.senal.trim(), accion: campos.accion.trim(), minima: campos.minima.trim() }).then(function () {
      e4[1](false);
      if (editando) { navegar('/app'); }
    }).catch(function (err) {
      e4[1](false);
      setError(err.codigo === 'habito_cerrado' ? 'El reto ya ha empezado: el hábito y la señal ya no se pueden cambiar.' : 'No se ha podido guardar. Inténtalo otra vez.');
    });
  }

  var cerrado = props.reto.dia > 1;

  return (
    <form onSubmit={guardar} noValidate>
      {editando ? null : <p className="text-sm font-bold text-cobalto">Paso 2 de 3</p>}
      <h1 className="titular uppercase text-5xl mt-1" tabIndex={-1}>{editando ? 'Tu hábito y tu señal' : 'Elige tu hábito'}</h1>
      <p className="mt-3 leading-relaxed text-gris">Uno solo. Lo vas a repetir 21 días seguidos, siempre después de la misma señal.</p>
      {cerrado ? <Aviso tono="alerta" className="mt-4">El reto ya ha empezado: puedes ver tu hábito, pero ya no cambiarlo.</Aviso> : null}

      <fieldset className="mt-5" disabled={cerrado}>
        <legend className="sr-only">Hábito del reto</legend>
        <div className="grid gap-2">
          {HABITOS.map(function (h) {
            var activo = h.id === habitoId;
            return (
              <label key={h.id} className={'cursor-pointer flex items-center gap-3 rounded-2xl border-2 px-4 py-3 transition-colors motion-reduce:transition-none has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-dorsal has-[:focus-visible]:outline-offset-2 ' + (activo ? 'bg-cobalto border-cobalto text-white' : 'bg-white border-lila hover:border-cobalto')}>
                <input type="radio" name="habito" value={h.id} checked={activo} onChange={function () { elegir(h.id); }} className="sr-only" />
                <span className={'size-10 shrink-0 rounded-full flex items-center justify-center ' + (activo ? 'bg-dorsal text-noche' : 'bg-lila/60 text-cobalto')}><Icono nombre={h.icono} size={20} grosor={2.25} /></span>
                <span className="font-bold leading-snug">{h.nombre}</span>
                {activo ? <Icono nombre="check" size={20} grosor={3} className="ml-auto shrink-0" /> : null}
              </label>
            );
          })}
        </div>
      </fieldset>

      {habitoId ? (
        <fieldset className="mt-7 grid gap-4" disabled={cerrado}>
          <legend className="titular-medio text-3xl flex items-center gap-2"><Icono nombre="senal" size={24} grosor={2.25} className="text-cobalto" />Tu señal</legend>
          <p className="text-sm text-gris">Átalo a algo que ya haces cada día: "después de X, hago Y". Cuanto más concreto, mejor funciona.</p>
          <label className="grid gap-1.5 text-sm font-semibold">El momento (X)
            <input name="senal" value={campos.senal} onChange={cambiar} maxLength={160} placeholder="Después de comer" className={CAMPO} />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">Lo que haces (Y)
            <input name="accion" value={campos.accion} onChange={cambiar} maxLength={160} className={CAMPO} />
          </label>
          <div className="rounded-2xl bg-lila/40 p-4">
            <label className="grid gap-1.5 text-sm font-semibold">
              <span className="flex items-center gap-2"><Icono nombre="minima" size={18} grosor={2.25} className="text-cobalto" />Tu versión mínima de 2 minutos</span>
              <span className="font-normal text-gris">Lo que harás los días malos para no fallar. Tiene que ser ridículamente fácil.</span>
              <input name="minima" value={campos.minima} onChange={cambiar} maxLength={160} className={CAMPO} />
            </label>
          </div>
        </fieldset>
      ) : null}

      {error ? <Aviso tono="error" className="mt-4">{error}</Aviso> : null}
      {cerrado ? (
        <Boton onClick={function () { navegar('/app'); }} tono="claro" icono="atras" className="mt-6 w-full">Volver</Boton>
      ) : (
        <Boton type="submit" cargando={e4[0]} icono="siguiente" className="mt-6 w-full">{editando ? 'Guardar cambios' : 'Guardar y hacer el test'}</Boton>
      )}
    </form>
  );
}
