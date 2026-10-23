// Curva ilustrativa de automaticidad (escala 1 a 7 del test de 4 preguntas).
var ANCHO = 560;
var ALTO = 240;
var M = { izq: 36, der: 20, arr: 18, aba: 34 };

var PUNTOS = [
  { dia: 0, valor: 2.1, nombre: 'Día 0' },
  { dia: 7, valor: 3.4, nombre: 'Día 7' },
  { dia: 21, valor: 4.6, nombre: 'Día 21' }
];
var PROYECCION = [
  { dia: 21, valor: 4.6 },
  { dia: 40, valor: 5.5 },
  { dia: 66, valor: 5.95 }
];

function x(dia) { return M.izq + (dia / 66) * (ANCHO - M.izq - M.der); }
function y(valor) { return ALTO - M.aba - ((valor - 1) / 6) * (ALTO - M.arr - M.aba); }

function trazo(lista) {
  return lista.map(function (p, i) { return (i === 0 ? 'M' : 'L') + x(p.dia).toFixed(1) + ' ' + y(p.valor).toFixed(1); }).join(' ');
}

export default function Curva() {
  return (
    <figure className="w-full">
      <svg viewBox={'0 0 ' + ANCHO + ' ' + ALTO} className="w-full h-auto" role="img" aria-labelledby="curva-titulo curva-desc">
        <title id="curva-titulo">Curva de automaticidad de ejemplo</title>
        <desc id="curva-desc">Ejemplo ilustrativo: la puntuación sube de 2,1 el día 0 a 3,4 el día 7 y 4,6 el día 21, y sigue subiendo más despacio hasta cerca del día 66.</desc>
        {[1, 4, 7].map(function (v) {
          return (
            <g key={v}>
              <line x1={M.izq} x2={ANCHO - M.der} y1={y(v)} y2={y(v)} stroke="currentColor" strokeOpacity="0.14" />
              <text x={M.izq - 10} y={y(v) + 4} textAnchor="end" fontSize="12" fill="currentColor" fillOpacity="0.7">{v}</text>
            </g>
          );
        })}
        <rect x={x(0)} y={M.arr} width={x(21) - x(0)} height={ALTO - M.arr - M.aba} fill="var(--color-dorsal)" fillOpacity="0.22" rx="6" />
        <path d={trazo(PROYECCION)} fill="none" stroke="currentColor" strokeOpacity="0.55" strokeWidth="2" strokeDasharray="5 6" />
        <path d={trazo(PUNTOS)} fill="none" stroke="var(--color-dorsal)" strokeWidth="3" strokeLinejoin="round" />
        {PUNTOS.map(function (p) {
          return (
            <g key={p.dia}>
              <circle cx={x(p.dia)} cy={y(p.valor)} r="7" fill="var(--color-dorsal)" stroke="var(--color-noche)" strokeWidth="2.5">
                <title>{p.nombre}: {String(p.valor).replace('.', ',')} de 7</title>
              </circle>
              <text x={x(p.dia) + 10} y={y(p.valor) - 12} fontSize="13" fontWeight="700" fill="currentColor">{String(p.valor).replace('.', ',')}</text>
            </g>
          );
        })}
        <text x={x(66) - 4} y={y(5.95) - 14} fontSize="12" textAnchor="end" fill="currentColor" fillOpacity="0.8">hacia el día 66</text>
        {[0, 7, 21, 66].map(function (d) {
          return <text key={d} x={x(d)} y={ALTO - 10} fontSize="12" textAnchor="middle" fill="currentColor" fillOpacity="0.75">{'día ' + d}</text>;
        })}
      </svg>
      <figcaption className="mt-2 text-sm opacity-75">Ejemplo ilustrativo, no un resultado garantizado. La zona sombreada son los 21 días del reto; la línea discontinua, lo que suele quedar por delante.</figcaption>
    </figure>
  );
}
