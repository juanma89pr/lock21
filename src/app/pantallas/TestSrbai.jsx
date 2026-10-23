import { useState } from 'react';
import { Boton, Aviso, Escala } from '../componentes/ui.jsx';
import { SRBAI_ITEMS, mediaSrbai, formatoNumero } from '../../lib/reto.js';
import { buscarHabito } from '../../datos/habitos.js';
import { navegar } from '../AppReto.jsx';

var OPCIONES = [1, 2, 3, 4, 5, 6, 7].map(function (n) { return { valor: n, etiqueta: String(n) }; });

// Test de automaticidad SRBAI: 4 ítems, escala 1 (nada de acuerdo) a 7 (totalmente de acuerdo).
export default function TestSrbai(props) {
  var habito = buscarHabito(props.perfil.habito);
  var previo = props.srbai[String(props.dia)];
  var e1 = useState(previo && previo.respuestas ? previo.respuestas.slice() : [null, null, null, null]);
  var resp = e1[0];
  var setResp = e1[1];
  var e2 = useState('');
  var e3 = useState(false);
  var e4 = useState(null);

  function poner(i, v) {
    var n = resp.slice();
    n[i] = v;
    setResp(n);
  }

  function enviar(e) {
    e.preventDefault();
    if (resp.indexOf(null) !== -1) { e2[1]('Responde las cuatro frases.'); return; }
    e2[1]('');
    e3[1](true);
    props.servicio.enviarSrbai(props.dia, resp).then(function (r) {
      e3[1](false);
      e4[1](r);
    }).catch(function () {
      e3[1](false);
      e2[1]('No se ha podido guardar el test. Inténtalo otra vez.');
    });
  }

  if (e4[0]) {
    return (
      <div role="status">
        <p className="text-sm font-bold text-cobalto">Test del día {props.dia}</p>
        <h1 className="titular uppercase text-5xl mt-1" tabIndex={-1}>Tu punto de partida</h1>
        <p className="mt-5 titular text-8xl text-cobalto">{formatoNumero(e4[0].media)}<span className="text-3xl text-gris"> / 7</span></p>
        <p className="mt-3 leading-relaxed">{props.dia === 0 ? 'Es normal empezar bajo: si ya te saliera solo, no sería un reto. Repetirás el test los días 7 y 21 para ver cuánto sube.' : 'Compáralo con tu día 0 en la pestaña Progreso.'}</p>
        <Boton onClick={function () { navegar('/app'); }} icono="siguiente" className="mt-6 w-full">Ir a Hoy</Boton>
      </div>
    );
  }

  var completas = resp.filter(function (r) { return r !== null; }).length;

  return (
    <form onSubmit={enviar} noValidate>
      {props.dia === 0 && !previo ? <p className="text-sm font-bold text-cobalto">Paso 3 de 3</p> : null}
      <h1 className="titular uppercase text-5xl mt-1" tabIndex={-1}>Test del día {props.dia}</h1>
      <p className="mt-3 leading-relaxed text-gris">Cuatro frases de un test validado de automaticidad (SRBAI). No hay respuestas buenas ni malas: responde cómo es hoy.</p>
      <p className="mt-4 rounded-2xl bg-lila/40 px-4 py-3 font-bold leading-snug">"{habito.nombre}" es algo que…</p>
      <div className="mt-5 grid gap-7">
        {SRBAI_ITEMS.map(function (item, i) {
          return (
            <Escala key={item} nombre={'srbai-' + i} leyenda={(i + 1) + '. …' + item} valor={resp[i]} onCambio={function (v) { poner(i, v); }} opciones={OPCIONES} columnas="grid-cols-7" extremos={['Nada de acuerdo', 'Totalmente']} />
          );
        })}
      </div>
      {e2[0] ? <Aviso tono="error" className="mt-5">{e2[0]}</Aviso> : null}
      <Boton type="submit" cargando={e3[0]} icono="siguiente" className="mt-6 w-full">Guardar test ({completas}/4)</Boton>
      {mediaSrbai(resp) !== null ? null : <p className="mt-2 text-xs text-gris text-center">Gardner, Abraham, Lally y de Bruijn (2012).</p>}
    </form>
  );
}
