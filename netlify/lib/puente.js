// Puente con el servicio de acompañamiento (Balancet). Solo se usa en el servidor y
// solo tras el consentimiento explícito de la persona (ver lead.js). Sin la variable
// LOCK21_PUENTE_TOKEN (la misma en los dos proyectos de Netlify) no se manda nada.
// El destino se puede cambiar con PUENTE_URL; nunca aparece en la web pública.
var URL_POR_DEFECTO = 'https://balancetfit.netlify.app/.netlify/functions/app';

function base() {
  return (process.env.PUENTE_URL || URL_POR_DEFECTO).replace(/\?.*$/, '');
}

export function puenteActivo() {
  return Boolean(process.env.LOCK21_PUENTE_TOKEN);
}

async function llamar(accion, metodo, cuerpo) {
  var res = await fetch(base() + '?accion=' + accion, {
    method: metodo,
    headers: { 'content-type': 'application/json', 'x-lock21-token': process.env.LOCK21_PUENTE_TOKEN },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    signal: AbortSignal.timeout(8000)
  });
  var datos = null;
  try { datos = await res.json(); } catch (e) { datos = null; }
  if (!res.ok) { throw new Error((datos && datos.error) || ('HTTP ' + res.status)); }
  return datos;
}

// Manda el lead con su relato. → { ok, id } o { ok: false, motivo }
export async function enviarLead(lead) {
  if (!puenteActivo()) { return { ok: false, motivo: 'sin_token' }; }
  try {
    var r = await llamar('lock21Lead', 'POST', {
      uid: lead.uid,
      email: lead.email,
      nombre: lead.nombre || '',
      fecha: lead.fecha,
      resumen: lead.resumen,
      consentimiento: lead.consentimiento,
      reto: Object.assign({ grupo: lead.grupo, diaReto: lead.diaReto }, lead.datos)
    });
    return { ok: true, id: r.id };
  } catch (e) {
    return { ok: false, motivo: String((e && e.message) || e).slice(0, 160) };
  }
}

// Cómo acabó cada persona derivada (sin datos personales). → { total, conReunion, contratan } o null
export async function estadosPuente() {
  if (!puenteActivo()) { return null; }
  try {
    var r = await llamar('lock21Estados', 'GET');
    return { total: r.total || 0, conReunion: r.conReunion || 0, contratan: r.contratan || 0 };
  } catch (e) {
    return { error: String((e && e.message) || e).slice(0, 120) };
  }
}
