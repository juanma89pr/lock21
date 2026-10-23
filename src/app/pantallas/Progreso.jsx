import Icono from '../../components/Icono.jsx';
import Calendario from '../componentes/Calendario.jsx';
import CurvaReal from '../componentes/CurvaReal.jsx';
import { calcularRacha } from '../../lib/reto.js';
import { Boton } from '../componentes/ui.jsx';
import { navegar } from '../AppReto.jsx';

function Dato(props) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_2px_0_var(--color-lila)]">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gris"><Icono nombre={props.icono} size={14} grosor={2.5} />{props.nombre}</p>
      <p className="titular text-5xl mt-1 text-cobalto">{props.valor}</p>
    </div>
  );
}

export default function Progreso(props) {
  var estado = props.estado;
  var d = estado.datos;
  var reto = estado.reto;
  var dia = reto.fase === 'antes' ? 0 : reto.dia;
  var racha = calcularRacha(d.perfil.habito, d.checkins, dia);

  return (
    <div className="grid gap-4">
      <h1 className="titular uppercase text-5xl" tabIndex={-1}>Tu progreso</h1>
      <div className="grid grid-cols-3 gap-2">
        <Dato icono="racha" nombre="Racha" valor={racha.racha} />
        <Dato icono="check" nombre="Hechos" valor={racha.hechos} />
        <Dato icono="progreso" nombre="Adher." valor={racha.adherencia + '%'} />
      </div>
      <section aria-labelledby="titulo-cal" className="rounded-[24px] bg-white p-5 shadow-[0_2px_0_var(--color-lila)]">
        <h2 id="titulo-cal" className="titular-medio text-2xl mb-1">Tus 21 días</h2>
        <p className="text-sm text-gris mb-4">Regla: nunca dos fallos seguidos. Un fallo suelto se perdona y la racha sigue.</p>
        <Calendario estados={racha.estados} diaActual={reto.dia} />
      </section>
      <section aria-labelledby="titulo-curva" className="rounded-[24px] bg-noche text-pista p-5">
        <h2 id="titulo-curva" className="titular-medio text-2xl text-dorsal">Tu automaticidad</h2>
        <p className="text-sm text-pista/80 mt-1">Test SRBAI, de 1 a 7. Días 0, 7 y 21.</p>
        <CurvaReal srbai={d.srbai} className="mt-3" />
        <p className="mt-2 text-xs text-pista/70">De media, un hábito tarda unos 66 días en salir solo (Lally, 2010). Los 21 días son el arranque.</p>
      </section>
      {reto.fase === 'fin' || reto.dia >= reto.duracion ? <Boton icono="informe" onClick={function () { navegar('/app/informe'); }}>Ver mi informe final</Boton> : null}
    </div>
  );
}
