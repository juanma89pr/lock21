import { Lock, Check, X, Dumbbell, Footprints, Moon, PersonStanding, GlassWater, MonitorOff, Bot, UserRound, CalendarDays, Users, ChartSpline, Link2, Mail, ShieldCheck, ArrowDown, Minus, Plus, Flame, MessageCircle, House, ChartColumn, LogOut, TriangleAlert, Send, Hourglass, Info, LoaderCircle, ArrowLeft, ArrowRight, Brain, Smile, BedDouble, ClipboardList, LayoutDashboard, Download, Sparkles, Timer, Share, SquarePlus, Smartphone, CalendarClock } from 'lucide-react';

var iconos = {
  candado: Lock,
  check: Check,
  fallo: X,
  entrenar: Dumbbell,
  pasos: Footprints,
  dormir: Moon,
  movilidad: PersonStanding,
  agua: GlassWater,
  pantalla: MonitorOff,
  ia: Bot,
  entrenador: UserRound,
  calendario: CalendarDays,
  plazas: Users,
  curva: ChartSpline,
  senal: Link2,
  correo: Mail,
  escudo: ShieldCheck,
  abajo: ArrowDown,
  menos: Minus,
  mas: Plus,
  racha: Flame,
  chat: MessageCircle,
  hoy: House,
  progreso: ChartColumn,
  salir: LogOut,
  alerta: TriangleAlert,
  enviar: Send,
  espera: Hourglass,
  info: Info,
  cargando: LoaderCircle,
  atras: ArrowLeft,
  siguiente: ArrowRight,
  cerebro: Brain,
  animo: Smile,
  sueno: BedDouble,
  informe: ClipboardList,
  admin: LayoutDashboard,
  descargar: Download,
  minima: Sparkles,
  calentamiento: Timer,
  compartir: Share,
  anadir: SquarePlus,
  movil: Smartphone,
  grupo: CalendarClock
};

export default function Icono(props) {
  var Componente = iconos[props.nombre] || Check;
  return <Componente size={props.size || 20} strokeWidth={props.grosor || 1.75} aria-hidden="true" className={props.className} />;
}
