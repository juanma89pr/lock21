// Datos de la marca y del calendario de grupos. El correo legal solo aparece en public/privacidad.html.
var config = {
  marca: 'Lock21',
  titular: 'Juan Manuel Peña',
  nombreCorto: 'Juanma',
  ciudad: 'Las Palmas de Gran Canaria',
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
