import { useEffect, useState } from 'react';
import Icono from '../../components/Icono.jsx';
import { Aviso, Cargando } from '../componentes/ui.jsx';
import { formatoNumero } from '../../lib/reto.js';

// Panel del propietario: el acceso lo decide el servidor (función metricas)
// con la lista de netlify/lib/propietarios.js o el claim admin.
function Cifra(props) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_2px_0_var(--color-lila)]">
      <p className="text-xs font-bold uppercase tracking-wide text-gris">{props.nombre}</p>
      <p className="titular text-5xl text-cobalto mt-1">{props.valor}</p>
    </div>
  );
}

export default function Admin(props) {
  var e1 = useState(null);
  var datos = e1[0];
  var e2 = useState('');
  var error = e2[0];

  useEffect(function () {
    props.servicio.metricas().then(function (r) { e1[1](r); }).catch(function (err) {
      var c = err.codigo;
      e2[1](c === 'sin_permiso' ? 'Esta cuenta no tiene acceso al panel.' : c === 'sin_firestore' ? 'Falta FIREBASE_SERVICE_ACCOUNT en Netlify: sin ella no hay datos que mostrar.' : 'No se han podido cargar las métricas.');
    });
  }, [props.servicio]);

  if (error) {
    return (
      <div className="grid gap-4">
        <h1 className="titular uppercase text-5xl" tabIndex={-1}>Panel</h1>
        <Aviso tono="error">{error}</Aviso>
      </div>
    );
  }
  if (!datos) { return <Cargando texto="Cargando métricas…" />; }

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-sm font-bold text-cobalto flex items-center gap-1.5"><Icono nombre="admin" size={16} grosor={2.5} />Panel del propietario{props.demo ? ' · datos de ejemplo' : ''}</p>
        <h1 className="titular uppercase text-5xl mt-0.5" tabIndex={-1}>Panel</h1>
        <p className="text-sm text-gris mt-1">Día del reto: {datos.estado.fase === 'antes' ? 'faltan ' + datos.estado.diasHastaInicio + ' días' : datos.estado.dia}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Cifra nombre="Inscritos" valor={datos.inscritos} />
        <Cifra nombre="Check-ins" valor={datos.checkins} />
        <Cifra nombre="Adherencia media" valor={datos.adherenciaMedia === null ? '—' : formatoNumero(datos.adherenciaMedia) + '%'} />
        <Cifra nombre="Leads" valor={datos.leads} />
      </div>
      <section aria-labelledby="t-srbai" className="rounded-[24px] bg-noche text-pista p-5">
        <h2 id="t-srbai" className="titular-medio text-2xl text-dorsal">SRBAI medio</h2>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          {['0', '7', '21'].map(function (k) {
            return <div key={k}><dt className="text-xs font-bold uppercase text-pista/70">Día {k}</dt><dd className="titular text-4xl">{formatoNumero(datos.srbaiMedio[k])}</dd><dd className="text-xs text-pista/70">{datos.srbaiRespuestas[k]} resp.</dd></div>;
          })}
        </dl>
      </section>

      <section aria-labelledby="t-leads">
        <h2 id="t-leads" className="titular-medio text-3xl">Leads</h2>
        {(datos.detalleLeads || []).length === 0 ? <p className="text-gris mt-2">Todavía no hay leads.</p> : null}
        <ul className="mt-3 grid gap-3">
          {(datos.detalleLeads || []).map(function (l) {
            return (
              <li key={l.email + l.fecha} className="rounded-2xl bg-white p-4 shadow-[0_2px_0_var(--color-lila)]">
                <p className="font-bold break-all">{l.email}</p>
                <p className="text-sm text-gris">{l.habito} · adherencia {l.adherencia}% · {String(l.fecha).slice(0, 10)}</p>
                <p className="mt-2 text-sm leading-relaxed">{l.resumen}</p>
                <p className="mt-2 text-xs text-gris">Consentimiento: {l.consentimiento}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="t-inscritos">
        <h2 id="t-inscritos" className="titular-medio text-3xl">Inscritos</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl bg-white shadow-[0_2px_0_var(--color-lila)]">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-gris">
              <tr><th scope="col" className="p-3">Correo</th><th scope="col" className="p-3">Hábito</th><th scope="col" className="p-3 text-right">Adh.</th><th scope="col" className="p-3 text-right">SRBAI</th></tr>
            </thead>
            <tbody>
              {(datos.detalleInscritos || []).map(function (u) {
                return (
                  <tr key={u.uid} className="border-t border-lila">
                    <td className="p-3 break-all">{u.email || u.uid}</td>
                    <td className="p-3">{u.habito}</td>
                    <td className="p-3 text-right font-bold">{u.adherencia}%</td>
                    <td className="p-3 text-right whitespace-nowrap">{formatoNumero(u.srbai['0'])} → {formatoNumero(u.srbai['21'] || u.srbai['7'])}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
