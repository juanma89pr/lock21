import RachaGrid from './components/RachaGrid.jsx';
import ListaEspera from './components/ListaEspera.jsx';
import Icono from './components/Icono.jsx';
import config from './config.js';

var PASOS = [
  { titulo: 'Check-in de un minuto', texto: 'Cada día marcas cómo has dormido, si te has movido y cómo va la cabeza. Cuatro toques y listo.' },
  { titulo: 'Tu coach ajusta el día siguiente', texto: 'Si vas sobrado, sube el listón. Si el día fue un caos, te propone algo asumible para no romper la racha.' },
  { titulo: 'La racha hace el resto', texto: 'Ves cada casilla cumplida. A los 21 días ya no dependes de la motivación: es lo que haces.' }
];

var PILARES = [
  { icono: 'movimiento', nombre: 'Movimiento', texto: 'Pasos, movilidad y entrenos cortos que caben en un día normal.' },
  { icono: 'descanso', nombre: 'Descanso', texto: 'Horarios de sueño y menos pantalla antes de dormir.' },
  { icono: 'cabeza', nombre: 'Cabeza', texto: 'Constancia, recaídas sin drama y cinco minutos para ti.' },
  { icono: 'comida', nombre: 'Comida', texto: 'Hábitos, no dietas: agua, comer con calma, planificar la compra.' }
];

function Seccion(props) {
  return (
    <section className={'px-4 sm:px-8 py-16 sm:py-24 ' + (props.className || '')} aria-labelledby={props.id}>
      <div className="mx-auto max-w-5xl">
        <h2 id={props.id} className="font-display font-extrabold text-4xl sm:text-6xl leading-none tracking-tight max-w-2xl">{props.titulo}</h2>
        {props.children}
      </div>
    </section>
  );
}

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="px-4 sm:px-8 pt-6">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <span className="font-display font-black text-3xl tracking-tight flex items-center gap-1.5">
            <Icono nombre="candado" size={22} grosor={2.5} className="text-sol" />Lock21
          </span>
          <a href="#lista" className="rounded-full border-2 border-tinta px-4 py-1.5 text-sm font-bold hover:bg-tinta hover:text-papel">Apuntarme</a>
        </div>
      </header>

      <main>
        <section className="px-4 sm:px-8 pt-12 sm:pt-20 pb-16" aria-labelledby="titulo">
          <div className="mx-auto max-w-5xl grid lg:grid-cols-[1.1fr_1fr] gap-12 items-end">
            <div>
              <h1 id="titulo" className="font-display font-black text-[4.25rem] leading-[0.86] sm:text-[7.5rem] tracking-tight">
                Ponte en modo lock in antes de enero.
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-tinta-2 max-w-lg leading-relaxed">
                21 días para engancharte a moverte, descansar y ser constante, con un coach de inteligencia artificial que ajusta cada día contigo. Sin dietas y sin extremos.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a href="#lista" className="rounded-full bg-sol hover:bg-sol-hondo text-papel font-bold px-6 py-3">Apuntarme a la lista de espera</a>
                <span className="text-sm text-tinta-2">Gratis y sin compromiso.</span>
              </div>
            </div>
            <RachaGrid />
          </div>
        </section>

        <Seccion id="como" titulo="Cómo funciona" className="bg-papel">
          <ol className="mt-10 grid md:grid-cols-3 gap-8">
            {PASOS.map(function (paso, i) {
              return (
                <li key={paso.titulo} className="border-t-4 border-tinta pt-4">
                  <span className="font-display font-black text-5xl text-sol leading-none">{i + 1}</span>
                  <h3 className="mt-3 font-bold text-lg">{paso.titulo}</h3>
                  <p className="mt-2 text-tinta-2 leading-relaxed">{paso.texto}</p>
                </li>
              );
            })}
          </ol>
        </Seccion>

        <Seccion id="pilares" titulo="Cuatro frentes, un hábito cada día">
          <ul className="mt-10 grid sm:grid-cols-2 gap-x-10 gap-y-8">
            {PILARES.map(function (p) {
              return (
                <li key={p.nombre} className="flex gap-4">
                  <span className="shrink-0 size-12 rounded-full bg-tinta text-papel flex items-center justify-center"><Icono nombre={p.icono} size={22} /></span>
                  <div>
                    <h3 className="font-bold text-lg">{p.nombre}</h3>
                    <p className="mt-1 text-tinta-2 leading-relaxed max-w-sm">{p.texto}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Seccion>

        <Seccion id="retos" titulo="Dos formas de empezar" className="bg-tinta text-papel">
          <div className="mt-10 grid md:grid-cols-2 gap-6">
            <article className="rounded-2xl border-2 border-papel/25 p-6 sm:p-8">
              <h3 className="font-display font-black text-5xl">Lock7</h3>
              <p className="mt-2 text-papel/75">Una semana para probar cómo te sienta el método.</p>
              <p className="mt-6 font-display font-extrabold text-4xl">5,99 €</p>
              <p className="text-sm text-papel/60">Pago único. Precio previsto de lanzamiento.</p>
            </article>
            <article className="rounded-2xl bg-sol text-papel p-6 sm:p-8">
              <h3 className="font-display font-black text-5xl">Lock21</h3>
              <p className="mt-2 text-papel/90">El reto completo: tres semanas hasta cerrar el hábito.</p>
              <p className="mt-6 font-display font-extrabold text-4xl">29 €</p>
              <p className="text-sm text-papel/80">Pago único. Precio previsto de lanzamiento.</p>
            </article>
          </div>
          <p className="mt-6 text-sm text-papel/70 max-w-2xl">Quien termine puede seguir con el coach por meses o, si busca algo más, pedir un entrenador personal de carne y hueso.</p>
        </Seccion>

        <Seccion id="coach" titulo="Un coach de IA, y te lo decimos claro">
          <div className="mt-8 grid md:grid-cols-2 gap-8 text-tinta-2 leading-relaxed">
            <p>El coach de {config.marca} es una inteligencia artificial. Te escribe cada día, recuerda cómo vas y adapta la tarea siguiente. Está pensado para acompañar hábitos, no para sustituir a un profesional.</p>
            <p>No da dietas, menús, calorías ni consejos médicos. Si necesitas algo así, te lo dice y te orienta hacia un profesional en persona.</p>
          </div>
        </Seccion>

        <Seccion id="lista" titulo="Apúntate a la lista" className="bg-papel">
          <p className="mt-4 text-tinta-2 max-w-xl">Los que se apunten ahora reciben el aviso del primer reto antes que nadie y con el precio de lanzamiento reservado.</p>
          <div className="mt-8 max-w-2xl">
            <ListaEspera />
          </div>
        </Seccion>
      </main>

      <footer className="px-4 sm:px-8 py-10 text-sm text-tinta-2">
        <div className="mx-auto max-w-5xl flex flex-wrap gap-x-6 gap-y-2 justify-between">
          <span>{config.marca}, desde {config.ciudad}</span>
          <span className="flex gap-4">
            <a href="/privacidad.html" className="underline">Privacidad</a>
            <a href={'mailto:' + config.correoContacto} className="underline">Contacto</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
