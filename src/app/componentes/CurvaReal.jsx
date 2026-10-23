import { formatoNumero } from '../../lib/reto.js';

// Curva de automaticidad con los tests reales de la persona (días 0, 7 y 21).
var ANCHO = 340;
var ALTO = 200;
var M = { izq: 28, der: 16, arr: 22, aba: 28 };

function x(dia) { return M.izq + (dia / 21) * (ANCHO - M.izq - M.der); }
function y(v) { return ALTO - M.aba - ((v - 1) / 6) * (ALTO - M.arr - M.aba); }

export default function CurvaReal(props) {
  var puntos = [0, 7, 21].filter(function (d) { return props.srbai[String(d)] && typeof props.srbai[String(d)].media === 'number'; })
    .map(function (d) { return { dia: d, valor: props.srbai[String(d)].media }; });
  var trazo = puntos.map(function (p, i) { return (i === 0 ? 'M' : 'L') + x(p.dia).toFixed(1) + ' ' + y(p.valor).toFixed(1); }).join(' ');
  var descripcion = puntos.length ? puntos.map(function (p) { return 'día ' + p.dia + ': ' + formatoNumero(p.valor); }).join(', ') : 'sin tests todavía';
  return (
    <figure className={props.className}>
      <svg viewBox={'0 0 ' + ANCHO + ' ' + ALTO} className="w-full h-auto" role="img" aria-label={'Tu curva de automaticidad, de 1 a 7: ' + descripcion}>
        {[1, 4, 7].map(function (v) {
          return (
            <g key={v}>
              <line x1={M.izq} x2={ANCHO - M.der} y1={y(v)} y2={y(v)} stroke="currentColor" strokeOpacity="0.15" />
              <text x={M.izq - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="currentColor" fillOpacity="0.7">{v}</text>
            </g>
          );
        })}
        {[0, 7, 21].map(function (d) {
          return <text key={d} x={x(d)} y={ALTO - 8} fontSize="11" textAnchor="middle" fill="currentColor" fillOpacity="0.75">{'día ' + d}</text>;
        })}
        {puntos.length > 1 ? <path d={trazo} fill="none" stroke="var(--color-dorsal)" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" /> : null}
        {puntos.map(function (p) {
          return (
            <g key={p.dia}>
              <circle cx={x(p.dia)} cy={y(p.valor)} r="7" fill="var(--color-dorsal)" stroke="var(--color-noche)" strokeWidth="2.5" />
              <text x={x(p.dia)} y={y(p.valor) - 13} fontSize="13" fontWeight="800" textAnchor="middle" fill="currentColor">{formatoNumero(p.valor)}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
