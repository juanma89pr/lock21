// «Ya estás dentro»: lo que ve quien acaba de pedir plaza (y la página /dentro que enlazan los
// correos). Su dorsal en imagen para historias de Instagram, TikTok o WhatsApp, el texto del pie
// listo para copiar y su enlace para invitar a alguien. Nada obligatorio: un empujón, no un muro.
import { useEffect, useRef, useState } from 'react';
import Icono from './Icono.jsx';
import config from '../config.js';
import medir from '../lib/medir.js';
import { fechaLarga } from '../lib/grupos.js';
import { TEMAS, FORMATOS, dibujar, aBlob, fuenteLista } from '../lib/tarjetaDorsal.js';

function dos(n) { return (n < 10 ? '0' : '') + n; }

function grupoCorto(fecha) {
  var t = fecha.split('-');
  return t[2] + '·' + t[1] + '·' + t[0].slice(2);
}

function avisar(datos, canal) {
  medir('comparte');
  if (!datos.id || !datos.token) { return; }
  try {
    fetch('/.netlify/functions/inscripcion', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accion: 'compartido', i: datos.id, t: datos.token, canal: canal }),
      keepalive: true
    });
  } catch (e) { /* contar nunca debe romper nada */ }
}

function copiar(texto) {
  if (navigator.clipboard && navigator.clipboard.writeText) { return navigator.clipboard.writeText(texto); }
  return new Promise(function (resolver, rechazar) {
    try {
      var area = document.createElement('textarea');
      area.value = texto;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
      resolver();
    } catch (e) { rechazar(e); }
  });
}

// datos: { nombre, email, dorsal, plazas, grupo, habitoNombre, habitoCorto, codigo, id, token, correo, cambioGrupo }
export default function Dentro(props) {
  var datos = props.datos;
  var lienzo = useRef(null);
  var eFormato = useState('historia');
  var formato = eFormato[0];
  var eTema = useState('cobalto');
  var tema = eTema[0];
  var eVista = useState('');
  var vista = eVista[0];
  var eAviso = useState('');
  var aviso = eAviso[0];
  var setAviso = eAviso[1];

  var fecha = fechaLarga(datos.grupo);
  var nombre = String(datos.nombre || '').split(' ')[0];
  var enlace = window.location.origin + '/?' + (datos.codigo ? 'r=' + datos.codigo + '&' : '') + 'g=' + datos.grupo + '&utm_source=amigo';
  var invitacion = 'Me he apuntado a Lock21: un reto gratis de 21 días, un solo hábito. Empezamos el ' + fecha + '. ¿Lo hacemos a la vez? ' + enlace;
  var pie = 'Desde el ' + fecha + ' bloqueo un hábito: ' + datos.habitoNombre.toLowerCase() + '. 21 días, uno solo, sin excusas de lunes.' +
    (datos.dorsal ? ' Dorsal ' + dos(datos.dorsal) + '.' : '') + ' Si alguien se anima, empezamos juntos: lock21.netlify.app @reto.lock21 #lock21 #reto21dias';

  useEffect(function () {
    var vivo = true;
    fuenteLista().then(function () {
      if (!vivo || !lienzo.current) { return; }
      dibujar(lienzo.current, formato, tema, {
        dorsal: datos.dorsal, plazas: datos.plazas || config.grupos.plazas, grupoCorto: grupoCorto(datos.grupo),
        fechaTexto: fecha, habitoCorto: datos.habitoCorto
      });
      eVista[1](lienzo.current.toDataURL('image/png'));
    });
    return function () { vivo = false; };
  }, [formato, tema, datos.dorsal, datos.grupo, datos.habitoCorto]);

  function nota(t) {
    setAviso(t);
    window.setTimeout(function () { setAviso(''); }, 2600);
  }

  function nombreArchivo() { return 'lock21-dorsal-' + (datos.dorsal ? dos(datos.dorsal) : 'dentro') + '-' + formato + '.png'; }

  function descargar() {
    var a = document.createElement('a');
    a.href = vista;
    a.download = nombreArchivo();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    avisar(datos, 'descarga');
    nota('Imagen guardada. Súbela a tu historia y etiqueta a @reto.lock21.');
  }

  function compartir() {
    if (!lienzo.current) { return; }
    aBlob(lienzo.current).then(function (blob) {
      var archivo = new File([blob], nombreArchivo(), { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
        // El texto viaja también en el portapapeles: Instagram y TikTok no lo recogen del menú.
        copiar(pie).catch(function () { return null; });
        return navigator.share({ files: [archivo], text: pie }).then(function () {
          avisar(datos, formato === 'historia' ? 'historia' : 'publicacion');
          nota('Hecho. El texto también está copiado para pegarlo en el pie.');
        }).catch(function () { return null; });
      }
      descargar();
      return null;
    });
  }

  function copiarPie() {
    copiar(pie).then(function () { avisar(datos, 'texto'); nota('Texto copiado.'); }).catch(function () { nota('No se pudo copiar. Mantén pulsado el texto para copiarlo.'); });
  }

  function copiarEnlace() {
    copiar(enlace).then(function () { avisar(datos, 'enlace'); nota('Enlace copiado.'); }).catch(function () { nota('No se pudo copiar.'); });
  }

  return (
    <div className="grid gap-5" role="status">
      <div className="rounded-[28px] bg-dorsal text-noche p-6 sm:p-8">
        <p className="titular text-5xl sm:text-6xl">Ya estás dentro{nombre ? ', ' + nombre : ''}.</p>
        <p className="mt-3 text-lg font-semibold">
          Grupo del {fecha}{datos.dorsal ? ' · Dorsal ' + dos(datos.dorsal) + ' de ' + (datos.plazas || config.grupos.plazas) : ''}
        </p>
        {datos.cambioGrupo ? <p className="mt-2 text-sm">El grupo que pediste se llenó: tienes plaza en el siguiente.</p> : null}
        <p className="mt-3 max-w-md leading-relaxed">
          {datos.correo === 'enviado'
            ? 'Te acabamos de escribir a ' + datos.email + '. Revisa también la carpeta de promociones.'
            : (datos.email ? 'Te escribimos a ' + datos.email + ' antes de empezar, ' : 'Te escribimos antes de empezar, ') + 'con tu hábito y el test del día 0.'}
        </p>
      </div>

      <div className="rounded-[28px] bg-white text-noche p-5 sm:p-8 grid gap-5 border-2 border-lila">
        <div>
          <p className="titular text-4xl sm:text-5xl">Cuéntalo.</p>
          <p className="mt-2 leading-relaxed text-gris">Decirlo en voz alta ata un poco más. Tu dorsal está listo para tu historia de Instagram, TikTok o WhatsApp. Etiqueta a <b className="text-noche">@reto.lock21</b> y lo vemos.</p>
        </div>

        <div className="grid sm:grid-cols-[minmax(0,240px)_1fr] gap-5 items-start">
          <div className="mx-auto w-full max-w-[240px]">
            {vista
              ? <img src={vista} alt={'Tu imagen: estoy dentro, dorsal ' + (datos.dorsal || '') + ', ' + datos.habitoNombre} className="w-full rounded-2xl shadow-lg" />
              : <div className="aspect-[9/16] rounded-2xl bg-pista animate-pulse" />}
            <canvas ref={lienzo} className="hidden" />
          </div>
          <div className="grid gap-4 content-start">
            <div className="grid gap-2">
              <p className="text-sm font-semibold">Formato</p>
              <div className="flex gap-2">
                {Object.keys(FORMATOS).map(function (k) {
                  var activo = k === formato;
                  return <button key={k} type="button" onClick={function () { eFormato[1](k); }} aria-pressed={activo} className={'rounded-full px-4 py-2 text-sm font-bold border-2 ' + (activo ? 'bg-noche text-white border-noche' : 'border-lila text-noche')}>{FORMATOS[k].nombre}</button>;
                })}
              </div>
            </div>
            <div className="grid gap-2">
              <p className="text-sm font-semibold">Color</p>
              <div className="flex gap-3">
                {Object.keys(TEMAS).map(function (k) {
                  var activo = k === tema;
                  return <button key={k} type="button" onClick={function () { eTema[1](k); }} aria-pressed={activo} aria-label={TEMAS[k].nombre} title={TEMAS[k].nombre}
                    className={'size-10 rounded-full border-4 ' + (activo ? 'border-noche' : 'border-transparent')} style={{ background: 'linear-gradient(135deg,' + TEMAS[k].fondo + ' 55%,' + TEMAS[k].tinta + ' 55%)' }} />;
                })}
              </div>
            </div>
            <button type="button" onClick={compartir} disabled={!vista} className="boton justify-center bg-cobalto hover:bg-cobalto-hondo text-white text-lg disabled:opacity-60">
              <Icono nombre="compartir" grosor={2.25} />Compartir mi dorsal
            </button>
            <button type="button" onClick={descargar} disabled={!vista} className="boton justify-center bg-pista text-noche border-2 border-lila disabled:opacity-60">
              <Icono nombre="descargar" grosor={2.25} />Guardar la imagen
            </button>
          </div>
        </div>

        <div className="grid gap-2 border-t-2 border-lila pt-5">
          <p className="text-sm font-semibold">Texto para el pie (Instagram o TikTok)</p>
          <p className="rounded-xl bg-pista p-3 text-sm leading-relaxed select-all">{pie}</p>
          <button type="button" onClick={copiarPie} className="justify-self-start text-sm font-bold text-cobalto underline">Copiar texto</button>
        </div>
      </div>

      <div className="rounded-[28px] bg-cobalto text-white p-5 sm:p-8 grid gap-4">
        <p className="titular text-4xl sm:text-5xl">Hazlo con alguien.</p>
        <p className="leading-relaxed text-white/90">Con compañía cuesta menos seguir. Si alguien se apunta con tu enlace, entra en tu mismo grupo, si quedan plazas, y empiezan el mismo día.</p>
        <a href={'https://wa.me/?text=' + encodeURIComponent(invitacion)} target="_blank" rel="noopener noreferrer" onClick={function () { avisar(datos, 'whatsapp'); }} className="boton justify-center bg-dorsal text-noche hover:bg-dorsal-hondo text-lg">
          <Icono nombre="chat" grosor={2.25} />Invitar por WhatsApp
        </a>
        <button type="button" onClick={copiarEnlace} className="boton justify-center bg-white/10 text-white border-2 border-white/40">
          <Icono nombre="senal" grosor={2.25} />Copiar mi enlace
        </button>
      </div>

      {aviso ? <p className="fixed bottom-4 left-4 right-4 mx-auto max-w-md rounded-full bg-noche text-white text-sm font-semibold px-5 py-3 text-center shadow-xl z-50" role="alert">{aviso}</p> : null}
    </div>
  );
}
