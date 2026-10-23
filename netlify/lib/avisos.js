// Avisos al propietario: correo con Resend si hay RESEND_API_KEY y, siempre que
// haya Firestore, un documento en la colección avisos (solo la lee el admin).
import { AVISO_EMAIL_POR_DEFECTO } from './propietarios.js';

function escapar(texto) {
  return String(texto || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function enviarCorreo(asunto, lineas) {
  var clave = process.env.RESEND_API_KEY;
  if (!clave) { return false; }
  var html = lineas.map(function (l) { return '<p>' + escapar(l) + '</p>'; }).join('');
  try {
    var res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + clave },
      body: JSON.stringify({
        from: process.env.AVISO_REMITENTE || 'Lock21 <onboarding@resend.dev>',
        to: [process.env.AVISO_EMAIL || AVISO_EMAIL_POR_DEFECTO],
        subject: asunto,
        html: html,
        text: lineas.join('\n\n')
      })
    });
    if (!res.ok) { console.error('resend: estado', res.status); }
    return res.ok;
  } catch (e) {
    console.error('resend: error', e && e.message);
    return false;
  }
}

// Señal de riesgo detectada: se avisa con el seudónimo, sin el texto de la persona.
export async function avisarRiesgo(fire, uid, origen) {
  var fecha = new Date().toISOString();
  if (fire) {
    try {
      await fire.db.collection('avisos').doc().set({ tipo: 'riesgo', uid: uid, origen: origen, fecha: fecha, revisado: false }, { merge: true });
    } catch (e) { console.error('avisos: no se pudo guardar', e && e.message); }
  }
  await enviarCorreo('Lock21: señal de riesgo en un participante', [
    'El filtro del coach ha detectado una posible señal de riesgo (' + origen + ').',
    'Participante (seudónimo): ' + uid.slice(0, 8),
    'Se le ha mostrado el texto fijo con el 024 y el 112. Revisa el panel de administración.'
  ]);
}
