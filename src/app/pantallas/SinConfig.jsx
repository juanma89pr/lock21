import Icono from '../../components/Icono.jsx';
import { Boton } from '../componentes/ui.jsx';

// Aviso claro cuando faltan las variables VITE_FIREBASE_* en el despliegue.
export default function SinConfig(props) {
  return (
    <div className="pt-6">
      <span className="size-14 rounded-full bg-dorsal text-noche flex items-center justify-center"><Icono nombre="alerta" size={28} grosor={2} /></span>
      <h1 className="titular uppercase text-5xl mt-5" tabIndex={-1}>La app aún no está conectada</h1>
      <p className="mt-4 leading-relaxed">Falta la configuración de Firebase en este despliegue, así que todavía no se puede entrar con tu correo. Si te has apuntado al grupo, te avisaremos por correo cuando esté lista.</p>
      <details className="mt-5 rounded-2xl bg-white border-2 border-lila p-4">
        <summary className="cursor-pointer font-bold">Para quien administra la app</summary>
        <p className="mt-3 text-sm text-gris">Faltan estas variables en Netlify (ver docs/puesta-en-marcha.md):</p>
        <ul className="mt-2 grid gap-1 text-sm font-mono">
          {props.faltan.map(function (f) { return <li key={f}>{f}</li>; })}
        </ul>
      </details>
      <div className="mt-6 grid gap-3">
        <Boton onClick={props.onDemo} tono="dorsal" icono="siguiente">Ver la app en modo demostración</Boton>
        <a href="/" className="text-center font-semibold underline underline-offset-4 text-cobalto py-2">Volver a la portada</a>
      </div>
    </div>
  );
}
