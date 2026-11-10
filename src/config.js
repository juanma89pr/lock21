// Datos de la marca y del calendario de grupos. El correo legal solo aparece en public/privacidad.html.
var config = {
  marca: 'Lock21',
  titular: 'Juan Manuel Peña',
  nombreCorto: 'Juanma',
  ciudad: 'Las Palmas de Gran Canaria',
  // 10 nov 2026 (Juanma): Lock21 en pausa. La portada y la app enseñan la página de pausa,
  // no se aceptan inscripciones y no salen correos de la secuencia. Para volver: activa: false.
  pausa: {
    activa: true,
    desde: '2026-11-10',
    vuelveDesde: '@balancet.fit'
  },
  grupos: {
    // Primer grupo (lunes) y, a partir de ahí, uno nuevo cada 14 días, sin tocar código:
    // 16 nov, 30 nov, 14 dic, 28 dic, 11 ene 2027...
    primero: '2026-11-16',
    cadaDias: 14,
    plazas: 30,
    // Al inscribirse se puede elegir entre los dos próximos grupos con plazas.
    elegibles: 2,
    zona: 'Atlantic/Canary',
    duracion: 21
  }
};

export default config;
