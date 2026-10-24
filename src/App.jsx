import { useState } from 'react';
import Tablero from './components/Tablero.jsx';
import Curva from './components/Curva.jsx';
import Inscripcion from './components/Inscripcion.jsx';
import Icono from './components/Icono.jsx';
import HABITOS, { buscarHabito } from './datos/habitos.js';
import config from './config.js';
import { proximoGrupo, fechaLarga, fechaCorta, fechaEnZona } from './lib/grupos.js';

// Próximo grupo calculado con la fecha de hoy en Canarias: no hay que tocar código.
var HOY = fechaEnZona(new Date());
var PROXIMO = proximoGrupo(HOY);
var PROXIMO_TEXTO = fechaLarga(PROXIMO, HOY);

// Momentos reales del reto: son una secuencia en el tiempo, por eso van con su día.
var MOMENTOS = [
  { cuando: 'Día 0', titulo: 'Eliges un hábito y su señal', texto: 'Uno solo, del menú. Lo atas a algo que ya haces cada día: "después de comer, salgo a caminar". La señal hace el trabajo que la fuerza de voluntad no aguanta.' },
  { cuando: 'Cada día', titulo: 'Marcas y el coach te responde', texto: 'Un toque para decir si lo has hecho. El coach de IA te contesta, te recuerda tu señal y, si el día se torció, te propone una versión mínima para no perder el hilo.' },
  { cuando: 'Si fallas', titulo: 'Nunca dos fallos seguidos', texto: 'Un fallo suelto no rompe la racha; la investigación muestra que no frena el hábito. La única regla es que al día siguiente vuelves.' },
  { cuando: 'Días 0, 7 y 21', titulo: 'Mides cuánto te sale solo', texto: 'Cuatro preguntas de un test validado de automaticidad. Ves tu curva subir con números, no con sensaciones.' }
];

var PREGUNTAS = [
  { p: '¿De verdad es gratis?', r: 'Sí. El reto de 21 días, el coach y el test no cuestan nada y no te pedimos tarjeta.' },
  { p: '¿Quién está detrás?', r: config.nombreCorto + ', desde Gran Canaria. Se está formando como entrenador personal y, en el camino, creó este reto juntando su experiencia cambiando hábitos uno a uno con lo que está aprendiendo en su formación sobre cómo se forman. No es un programa médico: es una forma sencilla de aplicar buenos hábitos. El coach del día a día es una IA, y te lo decimos en cada mensaje.' },
  { p: '¿Me van a intentar vender algo?', r: 'El reto es gratis, entero. Al terminar puedes apuntarte, si quieres, a una lista para saber cómo seguir con acompañamiento personalizado. Es opcional y, cuando exista, será de pago. Si no te apuntas, no te escribimos de eso.' },
  { p: '¿Sirve para dejar de fumar o de beber?', r: 'No. Lock21 trabaja un hábito del menú: moverte, dormir, beber agua o soltar la pantalla. No es un programa para dejar el tabaco, el alcohol ni otras sustancias. Si quieres dejarlo, habla con tu médico de cabecera: te puede orientar sobre la ayuda que hay.' },
  { p: '¿Por qué solo un hábito?', r: 'Porque intentar cambiar cinco cosas a la vez es la forma más rápida de no cambiar ninguna. Uno bien atado arrastra a los demás.' },
  { p: '¿En 21 días queda el hábito hecho?', r: 'No te lo vamos a prometer. En los estudios, la mayoría de la gente tarda de media unos 66 días en que un hábito le salga solo, y hay mucha variación entre personas. Los 21 días son el arranque: la parte en la que más gente abandona.' },
  { p: '¿Cuándo empiezo?', r: 'Cada dos semanas arranca un grupo nuevo, siempre en lunes. El próximo es el ' + PROXIMO_TEXTO + '. Al entrar en la app puedes elegir ese o el siguiente.' },
  { p: '¿Qué pasa si se cubren las ' + config.grupos.plazas + ' plazas?', r: 'Pasas al grupo siguiente, que empieza dos semanas después. Mientras esperas, la app te propone una misión de calentamiento de un minuto al día.' }
];

function Contenedor(props) {
  return <div className={'mx-auto w-full max-w-6xl px-4 sm:px-8 ' + (props.className || '')}>{props.children}</div>;
}

function BotonPlaza(props) {
  var oscuro = props.tono === 'oscuro';
  return (
    <a href="#plaza" className={'boton text-lg ' + (oscuro ? 'bg-noche text-dorsal hover:bg-cobalto-hondo' : 'bg-dorsal text-noche hover:bg-dorsal-hondo')}>
      {props.children || 'Pedir mi plaza gratis'}
      <Icono nombre="abajo" size={20} grosor={2.5} />
    </a>
  );
}

function DatosGrupo(props) {
  return (
    <ul className={'flex flex-wrap gap-x-6 gap-y-2 text-sm sm:text-base font-semibold ' + (props.className || '')}>
      <li className="flex items-center gap-2"><Icono nombre="calendario" size={18} grosor={2} />Próximo grupo: {PROXIMO_TEXTO}</li>
      <li className="flex items-center gap-2"><Icono nombre="plazas" size={18} grosor={2} />{config.grupos.plazas} plazas por grupo</li>
      <li className="flex items-center gap-2"><Icono nombre="escudo" size={18} grosor={2} />Gratis, sin tarjeta</li>
    </ul>
  );
}

export default function App() {
  var est = useState('pasos');
  var habitoId = est[0];
  var setHabitoId = est[1];
  var habito = buscarHabito(habitoId);

  return (
    <div className="min-h-screen overflow-x-clip">
      <header className="sticky top-0 z-20 bg-cobalto text-white">
        <Contenedor className="flex items-center justify-between py-3">
          <a href="#inicio" className="titular text-3xl flex items-center gap-1.5" aria-label="Lock21, inicio">
            <Icono nombre="candado" size={22} grosor={2.75} className="text-dorsal" />Lock21
          </a>
          <a href="#plaza" className="rounded-full bg-dorsal text-noche px-4 py-2 text-sm font-bold ancho hover:bg-dorsal-hondo">Pedir plaza</a>
        </Contenedor>
      </header>

      <main id="inicio">
        <section className="bg-cobalto text-white pb-20 sm:pb-28" aria-labelledby="titulo">
          <Contenedor className="pt-10 sm:pt-16 grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-14 items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-noche/35 px-3.5 py-1.5 text-sm font-semibold">
                <span className="size-2 rounded-full bg-dorsal" />Reto gratuito de 21 días
              </p>
              <h1 id="titulo" className="titular mt-5 text-[4.1rem] sm:text-[7rem] lg:text-[7.6rem] uppercase">
                Elige un hábito. Los próximos 21 días son para él.
              </h1>
              <p className="mt-6 text-lg sm:text-xl leading-relaxed text-white/90 max-w-xl">
                Un solo hábito, atado a una señal fija, con un coach de IA cada día y un test que mide cuánto te sale solo. Sin cambiarlo todo de golpe: un hábito, después otro.
              </p>

              <fieldset className="mt-8">
                <legend className="text-sm font-semibold text-white/85 mb-3">Prueba: ¿cuál sería el tuyo?</legend>
                <div className="flex flex-wrap gap-2">
                  {HABITOS.map(function (h) {
                    var activo = h.id === habitoId;
                    return (
                      <label key={h.id} className={'cursor-pointer inline-flex items-center gap-2 rounded-full border-2 px-3.5 py-2 text-sm font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-dorsal has-[:focus-visible]:outline-offset-2 ' + (activo ? 'bg-white text-noche border-white' : 'border-white/40 hover:border-white')}>
                        <input type="radio" name="habito-demo" value={h.id} checked={activo} onChange={function (e) { setHabitoId(e.target.value); }} className="sr-only" />
                        <Icono nombre={h.icono} size={16} grosor={2.25} />{h.corto}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
                <BotonPlaza />
                <a href="#historia" className="font-semibold underline underline-offset-4 decoration-2 decoration-white/50 hover:decoration-dorsal">Por qué existe Lock21</a>
              </div>
              <DatosGrupo className="mt-8 text-white/90" />
            </div>
            <div>
              <Tablero habito={habito} inicio={PROXIMO} />
            </div>
          </Contenedor>
        </section>

        <section className="py-20 sm:py-28" aria-labelledby="metodo">
          <Contenedor>
            <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16">
              <div className="lg:sticky lg:top-24 self-start">
                <h2 id="metodo" className="titular text-6xl sm:text-8xl uppercase text-cobalto">Cuatro reglas. Ninguna es motivación.</h2>
                <p className="mt-6 text-lg leading-relaxed text-gris max-w-md">El método junta mi experiencia con lo que estoy aprendiendo en mi formación sobre cómo se forman los hábitos: elegir uno, atarlo a algo que ya haces y repetirlo en el mismo momento hasta que deja de costar pensarlo.</p>
              </div>
              <ol className="grid gap-4">
                {MOMENTOS.map(function (m) {
                  return (
                    <li key={m.cuando} className="grid sm:grid-cols-[10.5rem_1fr] gap-2 sm:gap-6 border-t-[3px] border-noche pt-5 pb-3">
                      <span className="titular-medio text-3xl text-cobalto">{m.cuando}</span>
                      <div>
                        <h3 className="text-xl font-bold ancho">{m.titulo}</h3>
                        <p className="mt-2 leading-relaxed text-gris max-w-prose">{m.texto}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </Contenedor>
        </section>

        <section className="bg-noche text-pista py-20 sm:py-28" aria-labelledby="medir">
          <Contenedor className="grid lg:grid-cols-[1fr_1.1fr] gap-12 items-center">
            <div>
              <h2 id="medir" className="titular text-6xl sm:text-8xl uppercase text-dorsal">21 días para arrancar. No para terminar.</h2>
              <p className="mt-6 text-lg leading-relaxed text-pista/85 max-w-lg">
                Aquí no vas a leer "hábito asegurado en 21 días". En el estudio de Lally y su equipo (University College London, 2010), la gente tardó de media unos 66 días en que un hábito le saliera solo, con casos de 18 a más de 250. Una revisión de 2024 (Singh y colegas) llega a lo mismo: suele hacer falta más de dos meses.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-pista/85 max-w-lg">
                Por eso medimos. Los días 0, 7 y 21 respondes las cuatro preguntas del índice de automaticidad (SRBAI) y ves tu curva. Sabrás dónde estás de verdad, y si te conviene seguir solo o acompañado.
              </p>
            </div>
            <div className="rounded-[28px] bg-cobalto p-5 sm:p-7 text-white">
              <p className="titular-medio text-2xl sm:text-3xl">Así se ve tu curva</p>
              <p className="mt-1 text-sm text-white/80 mb-4">Puntuación de 1 a 7 en el test de automaticidad</p>
              <Curva />
            </div>
          </Contenedor>
        </section>

        <section className="py-20 sm:py-28" aria-labelledby="coach">
          <Contenedor className="grid md:grid-cols-[auto_1fr] gap-6 md:gap-12 items-start">
            <span className="size-20 sm:size-24 rounded-full bg-lila text-cobalto flex items-center justify-center"><Icono nombre="ia" size={44} grosor={1.75} /></span>
            <div>
              <h2 id="coach" className="titular text-5xl sm:text-7xl uppercase">Tu coach diario es una IA. Te lo decimos claro.</h2>
              <div className="mt-6 grid md:grid-cols-2 gap-6 text-lg leading-relaxed text-gris">
                <p>Te escribe cada día, recuerda tu señal y cómo vas, y te ayuda a no encadenar dos fallos. Cada mensaje va marcado como respuesta de inteligencia artificial, como pide el Reglamento europeo de IA.</p>
                <p>No da dietas, calorías, cantidades ni consejos médicos. Si le preguntas algo así, te lo dice y te orienta hacia tu médico u otro profesional sanitario.</p>
              </div>
            </div>
          </Contenedor>
        </section>

        <section id="historia" className="bg-dorsal text-noche py-20 sm:py-28" aria-labelledby="por-que">
          <Contenedor className="grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16 items-start">
            <div>
              <h2 id="por-que" className="titular text-6xl sm:text-8xl uppercase">Por qué existe Lock21</h2>
              <figure className="mt-8 max-w-xl">
                <blockquote className="grid gap-4 text-xl sm:text-2xl leading-relaxed font-semibold">
                  <p>Me estoy formando como entrenador personal, pero Lock21 no nace de ahí. Nace de cuando fumaba, bebía de más cada fin de semana y dejaba lo importante para luego.</p>
                  <p>No lo cambié todo de golpe: fue un hábito, después otro. Ahora, en mi formación, estoy aprendiendo qué dice la investigación sobre por qué funcionó. Lock21 junta las dos cosas. No tiene nada de mágico: es la forma de aplicar buenos hábitos que me hubiera gustado tener.</p>
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 font-bold">
                  <span className="size-11 rounded-full bg-noche text-dorsal flex items-center justify-center"><Icono nombre="persona" size={22} grosor={2} /></span>
                  {config.nombreCorto}, creador de {config.marca}
                </figcaption>
              </figure>
            </div>
            <div id="despues">
              <h3 className="titular-medio text-3xl sm:text-4xl">Y después del día 21</h3>
              <ul className="mt-5 grid gap-3">
                {[
                  { icono: 'escudo', texto: 'El reto es gratis y lo puedes hacer entero por tu cuenta.' },
                  { icono: 'curva', texto: 'Terminas con tu señal, tu método y tu curva medida.' },
                  { icono: 'lista', texto: 'Si quieres seguir acompañado, te apuntas a una lista y te contamos cómo funciona cuando haya plazas.' },
                  { icono: 'persona', texto: 'Ese acompañamiento es opcional y será de pago. Solo te escribimos si tú lo pides.' }
                ].map(function (item) {
                  return (
                    <li key={item.texto} className="flex items-start gap-3 rounded-2xl bg-noche text-pista px-5 py-4">
                      <Icono nombre={item.icono} size={22} grosor={2} className="shrink-0 mt-0.5 text-dorsal" />
                      <span className="font-semibold leading-snug">{item.texto}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-8"><BotonPlaza tono="oscuro">Empezar por el reto gratis</BotonPlaza></div>
            </div>
          </Contenedor>
        </section>

        <section id="plaza" className="bg-cobalto text-white py-20 sm:py-28" aria-labelledby="apuntarse">
          <Contenedor className="grid lg:grid-cols-[1fr_1.15fr] gap-10 lg:gap-16 items-start">
            <div>
              <h2 id="apuntarse" className="titular text-6xl sm:text-8xl uppercase">Próximo grupo: {fechaCorta(PROXIMO)}. {config.grupos.plazas} plazas.</h2>
              <p className="mt-6 text-lg leading-relaxed text-white/90 max-w-md">
                Próximo grupo: {PROXIMO_TEXTO}. {config.grupos.plazas} plazas. Después, uno cada dos semanas. Son grupos pequeños porque queremos revisar cada curva; si uno se llena, pasas al siguiente.
              </p>
              <DatosGrupo className="mt-8 text-white/90 flex-col" />
            </div>
            <Inscripcion habito={habitoId} onHabito={setHabitoId} grupo={PROXIMO} grupoTexto={PROXIMO_TEXTO} />
          </Contenedor>
        </section>

        <section className="py-20 sm:py-24" aria-labelledby="dudas">
          <Contenedor className="max-w-3xl">
            <h2 id="dudas" className="titular text-5xl sm:text-7xl uppercase text-cobalto">Lo que suelen preguntar</h2>
            <div className="mt-8 grid gap-3">
              {PREGUNTAS.map(function (q) {
                return (
                  <details key={q.p} className="group rounded-2xl bg-white border-2 border-lila open:border-cobalto">
                    <summary className="cursor-pointer list-none flex items-center justify-between gap-4 px-5 py-4 text-lg font-bold ancho [&::-webkit-details-marker]:hidden">
                      {q.p}
                      <Icono nombre="mas" size={20} grosor={2.5} className="shrink-0 text-cobalto transition-transform group-open:rotate-45 motion-reduce:transition-none" />
                    </summary>
                    <p className="px-5 pb-5 leading-relaxed text-gris">{q.r}</p>
                  </details>
                );
              })}
            </div>
            <div className="mt-10"><BotonPlaza tono="oscuro" /></div>
          </Contenedor>
        </section>
      </main>

      <footer className="bg-noche text-pista/80 py-10 text-sm">
        <Contenedor className="flex flex-wrap gap-x-6 gap-y-3 justify-between">
          <span>{config.marca}. Reto de hábitos de 21 días, desde Gran Canaria.</span>
          <span className="flex gap-5">
            <a href="/privacidad.html" className="underline">Privacidad</a>
          </span>
        </Contenedor>
      </footer>
    </div>
  );
}
