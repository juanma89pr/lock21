import { useState } from 'react';
import Icono from '../../components/Icono.jsx';
import { Boton, Aviso } from '../componentes/ui.jsx';
import CurvaReal from '../componentes/CurvaReal.jsx';
import { calcularRacha, formatoNumero } from '../../lib/reto.js';
import { buscarHabito } from '../../datos/habitos.js';
import { COMPARTIR } from '../../lib/consentimientos.js';

function lectura(inicio, final) {
  if (inicio === null || final === null) { return 'Haz el test del día 21 para cerrar tu curva.'; }
  var dif = Math.round((final - inicio) * 100) / 100;
  if (dif >= 1.5) { return 'Tu automaticidad ha subido ' + formatoNumero(dif) + ' puntos: el hábito ya empieza a salir solo.'; }
  if (dif > 0) { return 'Ha subido ' + formatoNumero(dif) + ' puntos. Va cogiendo forma, pero aún cuesta: es lo normal a estas alturas.'; }
  return 'La curva no ha subido todavía. No es un fracaso: hay hábitos que necesitan más tiempo o una señal más clara.';
}

// Día 21: informe y lista de interesados en el acompañamiento personalizado, con
// consentimiento explícito y separado (casilla sin marcar, texto versionado).
export default function Informe(props) {
  var estado = props.estado;
  var d = estado.datos;
  var perfil = d.perfil;
  var habito = buscarHabito(perfil.habito);
  var reto = estado.reto;
  var racha = calcularRacha(perfil.habito, d.checkins, Math.min(reto.dia, reto.duracion), reto.grupo);
  var ini = d.srbai['0'] ? d.srbai['0'].media : null;
  var fin = d.srbai['21'] ? d.srbai['21'].media : null;
  var e1 = useState(false);
  var e2 = useState(false);
  var e3 = useState('');
  var e4 = useState(null);
  var compartido = perfil.compartir && perfil.compartir.version;
  var disponible = reto.dia >= reto.duracion;

  function compartir(e) {
    e.preventDefault();
    if (!e1[0]) { e3[1]('Marca la casilla si quieres apuntarte. Si no, no pasa nada: el reto es tuyo.'); return; }
    e3[1]('');
    e2[1](true);
    props.servicio.crearLead().then(function (r) {
      e2[1](false);
      e4[1](r);
    }).catch(function () {
      e2[1](false);
      e3[1]('No se ha podido enviar. Inténtalo otra vez.');
    });
  }

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-sm font-bold text-cobalto">Informe final</p>
        <h1 className="titular uppercase text-5xl mt-0.5" tabIndex={-1}>Tus 21 días</h1>
      </div>
      {!disponible ? <Aviso>El informe completo se abre el día 21. Esto es lo que llevas hasta hoy.</Aviso> : null}

      <section aria-labelledby="titulo-resumen" className="rounded-[24px] bg-white p-5 shadow-[0_2px_0_var(--color-lila)]">
        <h2 id="titulo-resumen" className="titular-medio text-2xl flex items-center gap-2"><Icono nombre={habito.icono} size={22} grosor={2.25} className="text-cobalto" />{habito.nombre}</h2>
        <dl className="mt-4 grid grid-cols-2 gap-3">
          <div><dt className="text-xs font-bold uppercase text-gris">Días cumplidos</dt><dd className="titular text-4xl text-cobalto">{racha.hechos}<span className="text-xl text-gris">/{racha.programados}</span></dd></div>
          <div><dt className="text-xs font-bold uppercase text-gris">Adherencia</dt><dd className="titular text-4xl text-cobalto">{racha.adherencia}%</dd></div>
          <div><dt className="text-xs font-bold uppercase text-gris">Mejor racha</dt><dd className="titular text-4xl text-cobalto">{racha.mejor}</dd></div>
          <div><dt className="text-xs font-bold uppercase text-gris">Fallos perdonados</dt><dd className="titular text-4xl text-cobalto">{racha.perdonados}</dd></div>
        </dl>
      </section>

      <section aria-labelledby="titulo-auto" className="rounded-[24px] bg-noche text-pista p-5">
        <h2 id="titulo-auto" className="titular-medio text-2xl text-dorsal">Automaticidad: {formatoNumero(ini)} → {formatoNumero(fin)}</h2>
        <CurvaReal srbai={d.srbai} className="mt-3" />
        <p className="mt-2 leading-relaxed">{lectura(ini, fin)}</p>
        <p className="mt-2 text-sm text-pista/75">De media, hacen falta unos 66 días para que un hábito salga solo. Llevas un tercio del camino.</p>
      </section>

      <section aria-labelledby="titulo-oferta" className="rounded-[24px] bg-dorsal text-noche p-5">
        <h2 id="titulo-oferta" className="titular uppercase text-4xl">¿Quieres seguir acompañado después del día 21?</h2>
        <p className="mt-3 leading-relaxed">Apúntate y te contaremos cómo funciona el acompañamiento personalizado cuando haya plazas. Es opcional y será de pago.</p>
        <p className="mt-2 leading-relaxed">Y si prefieres seguir por tu cuenta, perfecto: ya tienes la señal y el método.</p>

        {compartido || e4[0] ? (
          <div className="mt-4 rounded-2xl bg-noche text-pista p-4" role="status">
            <p className="flex items-center gap-2 font-bold text-dorsal"><Icono nombre="check" size={20} grosor={3} />Hecho. Te escribiremos cuando haya plazas.</p>
            <p className="mt-1 text-sm text-pista/85">Puedes retirar este permiso cuando quieras escribiendo al correo de la política de privacidad.</p>
            {e4[0] && e4[0].servicioUrl ? <a href={e4[0].servicioUrl} className="mt-3 inline-block underline font-semibold text-dorsal">Conoce {e4[0].servicio || 'el servicio'}</a> : null}
          </div>
        ) : (
          <form onSubmit={compartir} noValidate className="mt-4 grid gap-3">
            <label className="flex gap-3 items-start rounded-2xl bg-white p-4 cursor-pointer">
              <input type="checkbox" checked={e1[0]} onChange={function (ev) { e1[1](ev.target.checked); }} className="mt-0.5 size-5 shrink-0 accent-cobalto" />
              <span className="text-sm leading-relaxed">{COMPARTIR.texto}</span>
            </label>
            <p className="text-xs">Versión del texto: {COMPARTIR.version}. Esta casilla es independiente de la que aceptaste al entrar.</p>
            {e3[0] ? <Aviso tono="error">{e3[0]}</Aviso> : null}
            <Boton type="submit" tono="noche" cargando={e2[0]} disabled={!disponible} icono="lista">Apuntarme a la lista</Boton>
            {!disponible ? <p className="text-xs text-center">Disponible a partir del día 21.</p> : null}
          </form>
        )}
      </section>
    </div>
  );
}
