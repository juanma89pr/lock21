import { Lock, Check, Footprints, Moon, Brain, Salad, Smartphone, Sparkles, CalendarCheck, Mail } from 'lucide-react';

var iconos = {
  candado: Lock,
  check: Check,
  movimiento: Footprints,
  descanso: Moon,
  cabeza: Brain,
  comida: Salad,
  movil: Smartphone,
  ia: Sparkles,
  calendario: CalendarCheck,
  correo: Mail
};

export default function Icono(props) {
  var Componente = iconos[props.nombre] || Check;
  return <Componente size={props.size || 20} strokeWidth={props.grosor || 1.75} aria-hidden="true" className={props.className} />;
}
