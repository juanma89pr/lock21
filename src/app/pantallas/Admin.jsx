import { useEffect, useState } from 'react';
import Icono from '../../components/Icono.jsx';
import { Aviso, Cargando } from '../componentes/ui.jsx';
import { formatoNumero } from '../../lib/reto.js';
import { fechaCorta } from '../../lib/grupos.js';
import Marketing from './Marketing.jsx';

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


// Trae las plazas que se pidieron cuando solo existía Netlify Forms: se pega el CSV
// (Netlify → Forms → lista-espera → Download CSV) o líneas «Nombre, correo».
function ImportarPlazas(props) {
  var eT = useState('');
  var texto = eT[0];
  var eR = useState(null);
  var res = eR[0];
  var eF = useState('');
  var fase = eF[0];

  function leerArchivo(e) {
    var f = e.target.files && e.target.files[0];
    if (!f) { return; }
    var lector = new FileReader();
    lector.onload = function () { eT[1](String(lector.result || '')); };
    lector.readAsText(f);
  }

  function traer() {
    eF[1]('enviando');
    props.servicio.importarPlazas(texto).then(function (r) {
      eR[1](r.resultado || []);
      eF[1]('hecho');
      if (props.onHecho) { props.onHecho(); }
    }).catch(function (err) {
      eR[1](null);
      eF[1](err.codigo === 'sin_plazas_en_el_texto' ? 'No encuentro ningún correo en lo que has pegado.' : 'No se ha podido importar (' + err.codigo + ').');
    });
  }

  return (
    <details className="rounded-2xl bg-white p-4 shadow-[0_2px_0_var(--color-lila)] text-sm">
      <summary className="font-bold cursor-pointer">Traer plazas pedidas antes del 26 oct</summary>
      <p className="mt-2 text-gris leading-relaxed">Netlify → Forms → lista-espera → Download CSV, y súbelo aquí (o pega líneas «Nombre, correo»). Cada persona recibe su dorsal en el orden en que la pidió y su correo de bienvenida.</p>
      <input type="file" accept=".csv,text/csv,text/plain" onChange={leerArchivo} className="mt-3 block text-sm" />
      <textarea value={texto} onChange={function (e) { eT[1](e.target.value); }} rows={4} placeholder="Ana López, ana@ejemplo.com" className="mt-2 w-full rounded-xl border-2 border-lila p-2 text-sm" />
      <button type="button" onClick={traer} disabled={!texto.trim() || fase === 'enviando'} className="boton mt-2 bg-cobalto text-white text-sm disabled:opacity-60">{fase === 'enviando' ? 'Trayendo…' : 'Traer plazas'}</button>
      {fase && fase !== 'enviando' && fase !== 'hecho' ? <p className="mt-2 font-bold text-cobalto-hondo">{fase}</p> : null}
      {res ? (
        <ul className="mt-3 grid gap-1">
          {res.length === 0 ? <li className="text-gris">Nada que traer.</li> : null}
          {res.map(function (x) {
            return <li key={x.email}>{x.nombre || x.email}: {x.ya ? 'ya estaba' : x.error ? 'error, ' + x.error : 'dorsal ' + x.dorsal + ' · ' + nombreGrupo(x.grupo) + ' · correo ' + x.correo}</li>;
          })}
        </ul>
      ) : null}
    </details>
  );
}

// Vuelve a mandar al momento los correos que fallaron (y la bienvenida a quien no la tenga).
function Reintentar(props) {
  var e = useState(null);
  var res = e[0];
  var eF = useState('');
  var fase = eF[0];
  function lanzar() {
    eF[1]('enviando');
    props.servicio.reintentarCorreos().then(function (r) {
      e[1](r.resultado || []);
      eF[1]('');
      if (props.onHecho) { props.onHecho(); }
    }).catch(function (err) {
      eF[1](err.codigo === 'correo_sin_configurar' ? 'Falta BREVO_API_KEY en Netlify.' : 'No se ha podido (' + err.codigo + ').');
    });
  }
  return (
    <div className="grid gap-2">
      <button type="button" onClick={lanzar} disabled={fase === 'enviando'} className="boton justify-self-start bg-cobalto text-white text-sm disabled:opacity-60">{fase === 'enviando' ? 'Enviando…' : 'Reintentar los correos pendientes'}</button>
      {fase && fase !== 'enviando' ? <p className="font-bold text-cobalto-hondo">{fase}</p> : null}
      {res ? (
        <ul className="grid gap-1">
          {res.length === 0 ? <li className="text-gris">No había nada pendiente.</li> : null}
          {res.map(function (x, i) {
            return <li key={i}>{x.nombre} · {NOMBRES_CORREO[x.tipo]}: {x.ok ? 'enviado' : 'falla: ' + x.motivo}</li>;
          })}
        </ul>
      ) : null}
    </div>
  );
}

// Reenviar un correo de la secuencia a una persona (o a todas) para probar cómo llega.
function Reenviar(props) {
  var eT = useState('bienvenida');
  var tipo = eT[0];
  var eE = useState('');
  var estado = eE[0];
  var eC = useState(false);
  var confirmar = eC[0];
  function lanzar() {
    if (props.todos && !confirmar) { eC[1](true); return; }
    eC[1](false);
    eE[1]('Enviando…');
    var datos = props.todos ? { todos: true, tipo: tipo } : { id: props.id, tipo: tipo };
    props.servicio.reenviarCorreo(datos).then(function (r) {
      var lista = r.resultado || [];
      var bien = lista.filter(function (x) { return x.ok; }).length;
      eE[1](lista.length === 0 ? 'No había a quién enviarlo.' : (bien === lista.length ? 'Enviado' + (lista.length > 1 ? ' a ' + bien : '') + '.' : 'Enviados ' + bien + ' de ' + lista.length + '. ' + lista.filter(function (x) { return !x.ok; }).map(function (x) { return x.nombre + ': ' + x.motivo; }).join(' · ')));
      if (props.onHecho) { props.onHecho(); }
    }).catch(function (err) { eE[1]('No se ha podido (' + err.codigo + ').'); });
  }
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <select value={tipo} onChange={function (e) { eT[1](e.target.value); eC[1](false); }} className="rounded-lg border-2 border-lila px-2 py-1 text-xs">
        {Object.keys(NOMBRES_CORREO).map(function (t) { return <option key={t} value={t}>{NOMBRES_CORREO[t]}</option>; })}
      </select>
      <button type="button" onClick={lanzar} className="rounded-full bg-cobalto text-white text-xs font-bold px-3 py-1.5">
        {props.todos ? (confirmar ? 'Sí, a todos' : 'Reenviar a todos') : 'Reenviar'}
      </button>
      {confirmar ? <button type="button" onClick={function () { eC[1](false); }} className="text-xs underline">Cancelar</button> : null}
      {estado ? <span className="text-xs font-semibold">{estado}</span> : null}
    </div>
  );
}

var NOMBRES_CORREO = { bienvenida: 'Bienvenida', d7: '7 días antes', d1: 'Víspera', d0: 'Día 1' };

// Plazas pedidas (web y app): dorsales por grupo, quién comparte, quién trae a quién y los correos.
function Plazas(props) {
  var l = props.lista;
  if (!l) { return null; }
  var personas = props.personas || [];
  return (
    <section aria-labelledby="t-plazas" className="grid gap-3">
      <h2 id="t-plazas" className="titular-medio text-3xl">Plazas pedidas</h2>
      <div className="grid grid-cols-2 gap-2">
        <Cifra nombre="Plazas pedidas" valor={l.total} />
        <Cifra nombre="Han compartido" valor={l.quienesComparten} />
        <Cifra nombre="Llegan invitados" valor={l.invitados} />
        <Cifra nombre="Bajas" valor={l.bajas} />
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-[0_2px_0_var(--color-lila)] grid gap-2 text-sm">
        {Object.keys(l.porGrupo).sort().map(function (g) {
          return <p key={g} className="flex justify-between"><span className="font-bold">{nombreGrupo(g)}</span><span>{l.porGrupo[g]} de {props.plazas} dorsales</span></p>;
        })}
        {Object.keys(l.porGrupo).length === 0 ? <p className="text-gris">Todavía no hay plazas pedidas.</p> : null}
        <p className="text-xs text-gris">Web {l.web} · app {l.app} · compartido {l.compartidos} {l.compartidos === 1 ? 'vez' : 'veces'}{Object.keys(l.canales).length ? ' (' + Object.keys(l.canales).map(function (c) { return c + ' ' + l.canales[c]; }).join(', ') + ')' : ''}</p>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-[0_2px_0_var(--color-lila)] grid gap-2 text-sm">
        <p className="font-bold flex items-center gap-1.5"><Icono nombre="correo" size={16} grosor={2.25} />Correos {l.correo.proveedor ? '· salen de ' + l.correo.remitente : '· apagados'}</p>
        {!l.correo.proveedor ? <p className="text-xs font-bold text-cobalto-hondo">Falta BREVO_API_KEY en Netlify (la misma clave que Balancet). Mientras, quedan pendientes y salen solos cuando esté.</p> : null}
        {l.correo.clave && l.correo.clave.hay ? <p className="text-xs text-gris">Clave en Netlify: tipo {l.correo.clave.tipo}, {l.correo.clave.longitud} caracteres{l.correo.clave.limpiada ? ' (traía espacios o comillas: se limpian solos)' : ''}.</p> : null}
        {Object.keys(l.erroresCorreo || {}).map(function (m) { return <p key={m} className="text-xs font-bold text-cobalto-hondo break-words">Error ({l.erroresCorreo[m]}): {m}</p>; })}
        {l.correo.proveedor && props.servicio ? <Reintentar servicio={props.servicio} onHecho={props.onRecargar} /> : null}
        {l.correo.proveedor && props.servicio && personas.length ? <div><p className="text-xs text-gris mt-1">Reenviar un correo a todos los inscritos de los próximos grupos:</p><Reenviar servicio={props.servicio} todos={true} onHecho={props.onRecargar} /></div> : null}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {Object.keys(NOMBRES_CORREO).map(function (t) {
            var c = l.correos[t] || {};
            return <p key={t} className="flex justify-between"><span>{NOMBRES_CORREO[t]}</span><span className="font-bold">{c.enviados || 0}{c.pendientes ? ' · ' + c.pendientes + ' pend.' : ''}{c.fallidos ? ' · ' + c.fallidos + ' fallo' : ''}</span></p>;
          })}
        </div>
      </div>
      {props.servicio ? <ImportarPlazas servicio={props.servicio} onHecho={props.onRecargar} /> : null}
      {personas.length ? (
        <ul className="grid gap-2">
          {personas.map(function (x) {
            return (
              <li key={x.email} className="rounded-2xl bg-white p-4 shadow-[0_2px_0_var(--color-lila)] text-sm">
                <p className="flex justify-between gap-3"><span className="font-bold">{x.nombre}</span><span className="titular text-2xl text-cobalto">{x.dorsal ? '#' + (x.dorsal < 10 ? '0' : '') + x.dorsal : ''}</span></p>
                <p className="text-gris break-all">{x.email}</p>
                <p className="mt-1">{nombreGrupo(x.grupo)} · {x.habito} · {x.via === 'app' ? 'app' : 'web'} · {NOMBRES_ORIGEN[x.origen] || x.origen}{x.acompanamiento ? ' · quiere saber del acompañamiento' : ''}</p>
                <p className="text-xs text-gris mt-1">
                  {x.invitadoPor ? 'Invitada por ' + x.invitadoPor + ' · ' : ''}{x.trajo ? 'Ha traído a ' + x.trajo + ' · ' : ''}{x.compartidos ? 'Compartió ' + x.compartidos + ' · ' : ''}Correos: {x.correos.length ? x.correos.map(function (t) { return NOMBRES_CORREO[t]; }).join(', ') : 'ninguno todavía'}
                </p>
                {x.errorCorreo ? <p className="text-xs font-bold text-cobalto-hondo mt-1">{x.errorCorreo}</p> : null}
                {props.servicio && l.correo.proveedor ? <Reenviar servicio={props.servicio} id={x.id} onHecho={props.onRecargar} /> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

var NOMBRES_ORIGEN = { amigo: 'Invitación de un amigo', correo: 'Correo', app: 'App', ig: 'Instagram', instagram: 'Instagram', whatsapp: 'WhatsApp', google: 'Google', facebook: 'Facebook', directo: 'Directo', interno: 'Desde la propia web', x: 'X', tiktok: 'TikTok', otros: 'Otros' };

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

  function recargar() {
    props.servicio.metricas().then(function (r) { e1[1](r); }).catch(function () { return null; });
  }

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
      <Plazas servicio={props.servicio} onRecargar={recargar} lista={datos.lista} personas={datos.detalleLista} plazas={datos.porGrupo && datos.porGrupo[0] ? datos.porGrupo[0].plazas : 30} />
      <Marketing servicio={props.servicio} />
      <Web />
      <section aria-labelledby="t-embudo" className="grid gap-3">
        <h2 id="t-embudo" className="titular-medio text-3xl">Del reto al acompañamiento</h2>
        <div className="grid grid-cols-2 gap-2">
          <Cifra nombre="Empiezan el reto" valor={datos.inscritos} />
          <Cifra nombre="Piden acompañamiento" valor={datos.leads} />
          <Cifra nombre="Llegan a reunión" valor={datos.derivados && !datos.derivados.error ? datos.derivados.conReunion : '—'} />
          <Cifra nombre="Contratan" valor={datos.derivados && !datos.derivados.error ? datos.derivados.contratan : '—'} />
        </div>
        <p className="text-xs text-gris">
          {!datos.derivados ? 'El puente con el acompañamiento está apagado: falta LOCK21_PUENTE_TOKEN en Netlify.' : datos.derivados.error ? 'No se ha podido leer el acompañamiento: ' + datos.derivados.error : 'Conversión del reto a cliente: ' + (datos.inscritos ? formatoNumero(Math.round(datos.derivados.contratan / datos.inscritos * 1000) / 10) + '%' : '—') + '. Cada persona solo pasa si lo pide con su casilla.'}
        </p>
      </section>
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
