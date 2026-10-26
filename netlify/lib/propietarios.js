// Única lista de correos con acceso al panel /app/admin y a las métricas con detalle.
// Vive solo en el servidor (no se publica en dist). El script scripts/dar-admin.mjs
// usa esta misma lista para poner el claim admin que piden las reglas de Firestore.
// Acceso de propietario separado del de participante: Juanma hace el reto con su correo personal
// y entra al panel con el de administración.
export var PROPIETARIOS = [
  'lock21@balancet.org'
];

// Correo al que llegan los avisos de leads y de riesgo (variable AVISO_EMAIL para cambiarlo).
export var AVISO_EMAIL_POR_DEFECTO = 'jmmoreno19@gmail.com';

export function esPropietario(datosToken) {
  if (!datosToken) { return false; }
  if (datosToken.admin === true) { return true; }
  var email = String(datosToken.email || '').toLowerCase();
  return datosToken.email_verified !== false && PROPIETARIOS.indexOf(email) !== -1;
}
