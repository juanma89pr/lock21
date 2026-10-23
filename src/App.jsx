import { useState } from 'react';
import Tablero from './components/Tablero.jsx';
import Curva from './components/Curva.jsx';
import Inscripcion from './components/Inscripcion.jsx';
import Icono from './components/Icono.jsx';
import HABITOS, { buscarHabito } from './datos/habitos.js';
import config from './config.js';

// Momentos reales del reto: son una secuencia en el tiempo, por eso van con su día.
var MOMENTOS = [
  { cuando: 'Día 0', titulo: 'Eliges un hábito y su señal', texto: 'Uno solo, del menú. Lo atas a algo que ya haces cada día: "después de comer, salgo a caminar". La señal hace el trabajo que la fuerza de voluntad no aguanta.' },
  { cuando: 'Cada día', titulo: 'Marcas y el coach te responde', texto: 'Un toque para decir si lo has hecho. El coach de IA te contesta, te recuerda tu señal y, si el día se torció, te propone una versión mínima para no perder el hilo.' },
  { cuando: 'Si fallas', titulo: 'Nunca dos fallos seguidos', texto: 'Un fallo suelto no rompe la racha; la investigación muestra que no frena el hábito. La única regla es que al día siguiente vuelves.' },
  { cuando: 'Días 0, 7 y 21', titulo: 'Mides cuánto te sale solo', texto: 'Cuatro preguntas de un test validado de automaticidad. Ves tu curva subir con números, no con sensaciones.' }
];

var PREGUNTAS = [
  { p: '¿De verdad es gratis?', r: 'Sí. El reto de 21 días, el coach y el test no cuestan nada y no te pedimos tarjeta.' },
  { p: '¿Me van a intentar vender algo?', r: 'Te lo decimos desde ya: al terminar, quien quiera seguir con un entrenador personal de carne y hueso puede pedirlo, y ese servicio sí es de pago. Solo te contamos cómo funciona si marcas la casilla opcional del formulario o lo pides tú.' },
  { p: '¿Por qué solo un hábito?', r: 'Porque intentar cambiar cinco cosas a la vez es la forma más rápida de no cambiar ninguna. Uno bien atado arrastra a los demás.' },
  { p: '¿En 21 días queda el hábito hecho?', r: 'No te lo vamos a prometer. En los estudios, la mayoría de la gente tarda de media unos 66 días en que un hábito le salga solo, y hay mucha variación entre personas. Los 21 días son el arranque: la parte en la que más gente abandona.' },
  { p: '¿Qué pasa si se cubren las 30 plazas?', r: 'Te avisamos por correo y te guardamos sitio en el siguiente grupo, si quieres.' }
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
      <li className="flex items-center gap-2"><Icono nombre="calendario" size={18} grosor={2} />Primer grupo: {config.grupo.fechaTexto}</li>
      <li className="flex items-center gap-2"><Icono nombre="plazas" size={18} grosor={2} />{config.grupo.plazas} plazas</li>
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
                Un solo hábito, atado a una señal fija, con un coach de IA cada día y un test que mide cuánto te sale solo. Y si al terminar quieres consolidarlo con un entrenador personal de verdad, puedes pedirlo.
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
                <a href="#despues" className="font-semibold underline underline-offset-4 decoration-2 decoration-white/50 hover:decoration-dorsal">Qué pasa después del día 21</a>
              </div>
              <DatosGrupo className="mt-8 text-white/90" />
            </div>
            <div>
              <Tablero habito={habito} />
            </div>
          </Contenedor>
        </section>

        <section className="py-20 sm:py-28" aria-labelledby="metodo">
          <Contenedor>
            <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16">
              <div className="lg:sticky lg:top-24 self-start">
                <h2 id="metodo" className="titular text-6xl sm:text-8xl uppercase text-cobalto">Cuatro reglas. Ninguna es motivación.</h2>
                <p className="mt-6 text-lg leading-relaxed text-gris max-w-md">El método sale de lo que la investigación sabe sobre cómo se forman los hábitos: repetir lo mismo, en el mismo contexto, hasta que deja de costar pensarlo.</p>
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
                <p>No da dietas, calorías, cantidades ni consejos médicos. Si le preguntas algo así, te lo dice y te orienta hacia un profesional en persona.</p>
              </div>
            </div>
          </Contenedor>
        </section>

        <section id="despues" className="bg-dorsal text-noche py-20 sm:py-28" aria-labelledby="entrenador">
          <Contenedor className="grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16 items-end">
            <div>
              <h2 id="entrenador" className="titular text-6xl sm:text-8xl uppercase">Después del día 21, un entrenador de carne y hueso.</h2>
              <p className="mt-6 text-lg sm:text-xl leading-relaxed max-w-xl">
                El reto es gratis y lo puedes hacer entero por tu cuenta. Pero si al terminar quieres llegar al día 66 y más allá con alguien que te conozca, puedes pedir el acompañamiento personalizado de {config.nombreCorto}, entrenador personal en {config.ciudad}: plan a tu medida, seguimiento cercano y una persona real al otro lado.
              </p>
              <div className="mt-8"><BotonPlaza tono="oscuro">Empezar por el reto gratis</BotonPlaza></div>
            </div>
            <ul className="grid gap-3">
              {[
                { icono: 'entrenador', texto: 'Un entrenador personal real, no un chat.' },
                { icono: 'plazas', texto: 'Plazas limitadas cada mes, porque se atiende a cada persona en serio.' },
                { icono: 'curva', texto: 'Parte de tu curva de los 21 días: no se empieza de cero.' },
                { icono: 'escudo', texto: 'Solo si tú lo pides. Sin llamadas sorpresa.' }
              ].map(function (item) {
                return (
                  <li key={item.texto} className="flex items-start gap-3 rounded-2xl bg-noche text-pista px-5 py-4">
                    <Icono nombre={item.icono} size={22} grosor={2} className="shrink-0 mt-0.5 text-dorsal" />
                    <span className="font-semibold leading-snug">{item.texto}</span>
                  </li>
                );
              })}
            </ul>
          </Contenedor>
        </section>

        <section id="plaza" className="bg-cobalto text-white py-20 sm:py-28" aria-labelledby="apuntarse">
          <Contenedor className="grid lg:grid-cols-[1fr_1.15fr] gap-10 lg:gap-16 items-start">
            <div>
              <h2 id="apuntarse" className="titular text-6xl sm:text-8xl uppercase">Primer grupo: {config.grupo.fechaCorta}. {config.grupo.plazas} plazas.</h2>
              <p className="mt-6 text-lg leading-relaxed text-white/90 max-w-md">
                Empiezan todos juntos el {config.grupo.fechaTexto}. Son {config.grupo.plazas} plazas porque es el primer grupo y queremos revisar cada curva. Cuando se cubran, se cierra y abrimos lista para el siguiente.
              </p>
              <DatosGrupo className="mt-8 text-white/90 flex-col" />
            </div>
            <Inscripcion habito={habitoId} onHabito={setHabitoId} />
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
          <span>{config.marca}, un reto de {config.titular}, desde {config.ciudad}.</span>
          <span className="flex gap-5">
            <a href="/privacidad.html" className="underline">Privacidad</a>
          </span>
        </Contenedor>
      </footer>
    </div>
  );
}
