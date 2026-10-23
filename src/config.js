// Datos del titular y del primer grupo. El correo legal solo aparece en public/privacidad.html.
var config = {
  marca: 'Lock21',
  titular: 'Juan Manuel Peña',
  nombreCorto: 'Juanma',
  ciudad: 'Las Palmas de Gran Canaria',
  grupo: {
    fechaTexto: '1 de diciembre de 2026',
    fechaCorta: '1 dic',
    // Fecha de inicio común (día 1 del reto) y zona horaria de referencia.
    inicio: '2026-12-01',
    zona: 'Atlantic/Canary',
    duracion: 21,
    // El 1 de diciembre de 2026 es martes.
    diaSemanaInicio: 2,
    plazas: 30
  }
};

export default config;
