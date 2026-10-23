// Textos legales versionados. Si cambias un texto, sube su versión: el servidor
// guarda la versión y un hash del texto exacto que aceptó cada persona.
import config from '../config.js';

export var PRIVACIDAD = {
  version: 'privacidad-2026-10-23',
  texto: 'Acepto que ' + config.titular + ' trate mis datos para gestionar mi participación en el reto ' + config.marca + ', según la política de privacidad.'
};

export var MAYOR_EDAD = {
  version: 'edad-2026-10-23',
  texto: 'Tengo 18 años o más.'
};

export var AVISO_IA = {
  version: 'aviso-ia-2026-10-23',
  texto: 'Entiendo que el coach del reto es una inteligencia artificial, que no da dietas, cantidades ni consejos médicos, y que mis registros se le envían con un seudónimo, sin mi nombre ni mi correo.'
};

// Consentimiento separado para compartir el resumen con el entrenador.
export var COMPARTIR = {
  version: 'compartir-2026-10-23',
  texto: 'Quiero que ' + config.titular + ', entrenador personal, reciba el resumen de mis 21 días (hábito, adherencia, racha, curva del test y notas) y mi correo para contactarme sobre su servicio de entrenamiento personal, que es de pago. Puedo retirar este consentimiento cuando quiera escribiendo al correo de contacto de la política de privacidad.'
};
