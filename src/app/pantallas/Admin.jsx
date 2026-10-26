import { useEffect, useState } from 'react';
import Icono from '../../components/Icono.jsx';
import { Aviso, Cargando } from '../componentes/ui.jsx';
import { formatoNumero } from '../../lib/reto.js';
import { fechaCorta } from '../../lib/grupos.js';

function nombreGrupo(g) {
  return g === 'pendiente' ? 'Sin grupo' : fechaCorta(g);
}

function faseGrupo(g) {
  if (g.fase === 'pendiente') { return 'Se asigna al entrar en la app'; }
  if (g.fase === 'antes') { return 'Empieza en ' + g.diasHastaInicio + (g.diasHastaInicio === 1 ? ' día' : ' días'); }
  if (g.fase === 'fin') { return 'Terminado'; }
  return 'Día ' + g.dia + ' de 21';
}

// Desglose por grupo: plazas, hábito elegido, calentamiento, check-ins, adherencia y SRBAI.
function Grupos(props) {
  var lista = props.grupos || [];
  if (!lista.length) { return null; }
  return (
    <section aria-labelledby="t-grupos">
      <h2 id="t-grupos" className="titular-medio text-3xl">Por grupo</h2>
      <ul className="mt-3 grid gap-3">
        {lista.map(function (g) {
          return (
            <li key={g.grupo} className="rounded-2xl bg-white p-4 shadow-[0_2px_0_var(--color-lila)]">
              <div className="flex items-baseline justify-between gap-3">
                <p className="titular text-3xl text-cobalto">{nombreGrupo(g.grupo)}</p>
                <p className="text-xs font-bold text-gris">{faseGrupo(g)}</p>
              </div>
              <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
                <div><dt className="text-xs text-gris">Plazas</dt><dd className="font-bold">{g.grupo === 'pendiente' ? g.registrados : g.registrados + ' / ' + g.plazas}</dd></div>
                <div><dt className="text-xs text-gris">Con hábito</dt><dd className="font-bold">{g.inscritos}</dd></div>
                <div><dt className="text-xs text-gris">Calentamiento</dt><dd className="font-bold">{g.calentamiento}</dd></div>
                <div><dt className="text-xs text-gris">Check-ins</dt><dd className="font-bold">{g.checkins}</dd></div>
                <div><dt className="text-xs text-gris">Adherencia</dt><dd className="font-bold">{g.adherenciaMedia === null ? '—' : formatoNumero(g.adherenciaMedia) + '%'}</dd></div>
                <div><dt className="text-xs text-gris">SRBAI 0 → 21</dt><dd className="font-bold whitespace-nowrap">{formatoNumero(g.srbaiMedio['0'])} → {formatoNumero(g.srbaiMedio['21'] === null ? g.srbaiMedio['7'] : g.srbaiMedio['21'])}</dd></div>
              </dl>
              {g.leads ? <p className="mt-2 text-xs font-bold text-cobalto">{g.leads} {g.leads === 1 ? 'lead' : 'leads'}</p> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

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


var NOMBRES_ORIGEN = { ig: 'Instagram', instagram: 'Instagram', whatsapp: 'WhatsApp', google: 'Google', facebook: 'Facebook', directo: 'Directo', interno: 'Desde la propia web', x: 'X', tiktok: 'TikTok', otros: 'Otros' };

// Web: visitas, clics en "Pedir plaza" y solicitudes de los últimos 30 días, por origen (medición propia sin cookies).
function Web() {
  var e = useState(null);
  var web = e[0];
  useEffect(function () {
    fetch('/.netlify/functions/pulso-metricas').then(function (r) { return r.json(); }).then(function (d) { e[1](d.web || null); }).catch(function () { e[1]({ error: true }); });
  }, []);
  if (!web) { return null; }
  var t = web.totales || {};
  function total(ev) { return t[ev] ? t[ev].total : 0; }
  var visitas = total('visita');
  var solicitudes = total('solicitud');
  // Se agrupan los orígenes con el mismo nombre (p. ej. "ig" e "instagram").
  var porNombre = {};
  if (t.visita) {
    Object.keys(t.visita.origen).forEach(function (o) {
      var n = NOMBRES_ORIGEN[o] || o;
      porNombre[n] = (porNombre[n] || 0) + t.visita.origen[o];
    });
  }
  var origenes = Object.keys(porNombre).sort(function (a, b) { return porNombre[b] - porNombre[a]; });
  var hoy = (web.dias || []).length ? web.dias[web.dias.length - 1] : null;
  return (
    <section aria-labelledby="t-web" className="grid gap-3">
      <h2 id="t-web" className="titular-medio text-3xl">Web · últimos 30 días</h2>
      <div className="grid grid-cols-2 gap-2">
        <Cifra nombre="Visitas" valor={visitas} />
        <Cifra nombre="Clics en Pedir plaza" valor={total('clic_plaza')} />
        <Cifra nombre="Solicitudes de plaza" valor={solicitudes} />
        <Cifra nombre="Conversión" valor={visitas ? formatoNumero(Math.round(solicitudes / visitas * 1000) / 10) + '%' : '—'} />
      </div>
      {hoy ? <p className="text-sm text-gris">Último día con datos ({hoy.dia}): {hoy.datos.visita ? hoy.datos.visita.total : 0} visitas, {hoy.datos.solicitud ? hoy.datos.solicitud.total : 0} solicitudes.</p> : null}
      {origenes.length ? (
        <ul className="rounded-2xl bg-white p-4 shadow-[0_2px_0_var(--color-lila)] grid gap-1.5 text-sm">
          {origenes.map(function (o) {
            return <li key={o} className="flex justify-between gap-3"><span>{o}</span><span className="font-bold">{porNombre[o]}</span></li>;
          })}
        </ul>
      ) : <p className="text-sm text-gris">Aún no hay visitas registradas.</p>}
      <p className="text-xs text-gris">La lista completa de solicitudes (nombre, correo, hábito y grupo) está en Netlify → Forms → lista-espera.</p>
    </section>
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
      e2[1](c === 'sin_permiso' ? 'Esta cuenta es de participante y no tiene acceso al panel. Sal (arriba a la derecha) y entra con el correo de administración.' : c === 'sin_firestore' ? 'Falta FIREBASE_SERVICE_ACCOUNT en Netlify: sin ella no hay datos que mostrar.' : 'No se han podido cargar las métricas.');
    });
  }, [props.servicio]);

  if (error) {
    return (
      <div className="grid gap-4">
        <h1 className="titular uppercase text-5xl" tabIndex={-1}>Panel</h1>
        <Aviso tono="error">{error}</Aviso>
        <Web />
      </div>
    );
  }
  if (!datos) { return <Cargando texto="Cargando métricas…" />; }

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-sm font-bold text-cobalto flex items-center gap-1.5"><Icono nombre="admin" size={16} grosor={2.5} />Panel del propietario{props.demo ? ' · datos de ejemplo' : ''}</p>
        <h1 className="titular uppercase text-5xl mt-0.5" tabIndex={-1}>Panel</h1>
        <p className="text-sm text-gris mt-1">Próximo grupo: {fechaCorta(datos.estado.grupo)} (faltan {datos.estado.diasHastaInicio} días). Un grupo cada dos semanas.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Cifra nombre="Inscritos" valor={datos.inscritos} />
        <Cifra nombre="Check-ins" valor={datos.checkins} />
        <Cifra nombre="Adherencia media" valor={datos.adherenciaMedia === null ? '—' : formatoNumero(datos.adherenciaMedia) + '%'} />
        <Cifra nombre="Leads" valor={datos.leads} />
      </div>
      <Web />
      <Grupos grupos={datos.porGrupo} />
      <section aria-labelledby="t-srbai" className="rounded-[24px] bg-noche text-pista p-5">
        <h2 id="t-srbai" className="titular-medio text-2xl text-dorsal">SRBAI medio (todos los grupos)</h2>
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
                <p className="text-sm text-gris">{l.grupo ? nombreGrupo(l.grupo) + ' · ' : ''}{l.habito} · adherencia {l.adherencia}% · {String(l.fecha).slice(0, 10)}</p>
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
              <tr><th scope="col" className="p-3">Correo</th><th scope="col" className="p-3">Grupo</th><th scope="col" className="p-3">Hábito</th><th scope="col" className="p-3 text-right">Adh.</th><th scope="col" className="p-3 text-right">SRBAI</th></tr>
            </thead>
            <tbody>
              {(datos.detalleInscritos || []).map(function (u) {
                return (
                  <tr key={u.uid} className="border-t border-lila">
                    <td className="p-3 break-all">{u.email || u.uid}</td>
                    <td className="p-3 whitespace-nowrap">{u.grupo ? nombreGrupo(u.grupo) : '—'}</td>
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
