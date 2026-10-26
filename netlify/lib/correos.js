// Secuencia de correos a quien pide plaza: bienvenida (al momento), 7 días antes, la víspera
// y el día 1. Salen de lock21@balancet.org por Brevo (BREVO_API_KEY). Sin clave no sale nada
// y queda pendiente: la función programada los manda en cuanto esté. Todos llevan la baja con un clic (enlace y cabecera List-Unsubscribe).
import config from '../../src/config.js';
import { diasEntre, fechaLarga, fechaEnZona } from '../../src/lib/grupos.js';
import { buscarHabito } from '../../src/datos/habitos.js';

export var TIPOS = ['bienvenida', 'd7', 'd1', 'd0'];
var MAX_INTENTOS = 3;

export function sitio() {
  return (process.env.URL || 'https://lock21.netlify.app').replace(/\/+$/, '');
}

function escapar(t) {
  return String(t === undefined || t === null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function dos(n) { return (n < 10 ? '0' : '') + n; }

export function enlaces(id, d) {
  var s = sitio();
  var invitar = s + '/?r=' + d.codigo + '&g=' + d.grupo + '&utm_source=amigo';
  var texto = 'Me he apuntado a Lock21: un reto gratis de 21 días, un solo hábito. Empezamos el ' + fechaLarga(d.grupo) + '. ¿Lo hacemos a la vez? ' + invitar;
  return {
    dentro: s + '/dentro?i=' + id + '&t=' + d.token + '&utm_source=correo',
    invitar: invitar,
    whatsapp: 'https://wa.me/?text=' + encodeURIComponent(texto),
    app: s + '/app?utm_source=correo',
    baja: s + '/.netlify/functions/baja?i=' + id + '&t=' + d.token
  };
}

// Contenido de cada correo: { asunto, bloques } (bloques: p, dato, boton, nota, separador).
export function contenido(tipo, id, d, hoy) {
  var h = buscarHabito(d.habito);
  var e = enlaces(id, d);
  var faltan = diasEntre(hoy, d.grupo);
  var fecha = fechaLarga(d.grupo);
  var nombre = String(d.nombre || '').split(' ')[0] || 'hola';
  var dorsal = d.dorsal ? dos(d.dorsal) : '';
  var ejemplo = '«' + h.senal + ', ' + h.accion.replace(/\.$/, '') + '»';
  var cuando = faltan > 1 ? 'Faltan ' + faltan + ' días.' : (faltan === 1 ? 'Empieza mañana.' : 'Empieza hoy.');

  if (tipo === 'bienvenida') {
    return {
      asunto: dorsal ? 'Dentro, ' + nombre + '. Tu dorsal es el ' + dorsal : 'Dentro, ' + nombre + '. Ya tienes plaza',
      previa: 'Grupo del ' + fecha + '. ' + cuando,
      bloques: [
        { t: 'titulo', v: 'Ya estás dentro.' },
        { t: 'dato', v: [['Grupo', fecha], dorsal ? ['Dorsal', dorsal + ' de ' + config.grupos.plazas] : null, ['Tu hábito', h.nombre]] },
        { t: 'p', v: cuando + ' Hasta entonces, solo una cosa: piensa en tu señal, el momento de tu día al que vas a atar el hábito. La frase es «Después de ___, ___». Por ejemplo: ' + ejemplo + '.' },
        faltan > 7 ? { t: 'p', v: 'Te escribimos 7 días antes y la víspera. El día 1 te llega el enlace para hacer tu primer check-in, que dura un minuto.' } : null,
        faltan > 1 && faltan <= 7 ? { t: 'p', v: 'Te escribimos la víspera. El día 1 te llega el enlace para hacer tu primer check-in, que dura un minuto.' } : null,
        faltan <= 1 ? { t: 'p', v: 'Como empiezas ya, entra hoy y deja escrita tu señal y el test del día 0 (4 preguntas, dos minutos). Entras con tu correo, sin contraseña.' } : null,
        faltan <= 1 ? { t: 'boton', v: 'Entrar en Lock21', url: e.app } : null,
        { t: 'separador' },
        { t: 'sub', v: 'Hazlo con alguien' },
        { t: 'p', v: 'Con compañía cuesta menos seguir. Si alguien se apunta con tu enlace, entra en tu mismo grupo y empiezan el mismo día.' },
        { t: 'boton', v: 'Invitar por WhatsApp', url: e.whatsapp },
        { t: 'nota', v: 'O pásale este enlace: ' + e.invitar },
        { t: 'separador' },
        { t: 'sub', v: 'Cuéntalo' },
        { t: 'p', v: 'Tienes tu imagen con tu dorsal lista para tu historia de Instagram, TikTok o WhatsApp. Etiqueta a @reto.lock21 para que la veamos.' },
        { t: 'boton2', v: 'Ver mi imagen para compartir', url: e.dentro }
      ]
    };
  }
  if (tipo === 'd7') {
    return {
      asunto: 'Una semana, ' + nombre + '. Elige tu señal',
      previa: 'El ' + fecha + ' empieza tu grupo.',
      bloques: [
        { t: 'titulo', v: 'Quedan 7 días.' },
        { t: 'p', v: 'El ' + fecha + ' empieza tu grupo. Esta semana tienes un solo deber: decidir tu señal.' },
        { t: 'p', v: 'Mira tu día normal y busca algo que ya haces sin pensar: el café, salir del trabajo, lavarte los dientes. Ahí atas ' + h.corto.toLowerCase() + '. Por ejemplo: ' + ejemplo + '.' },
        { t: 'p', v: 'La señal pesa más que las ganas. Las ganas van y vienen; el café de la mañana está todos los días.' },
        { t: 'separador' },
        // A quien ya compartió su dorsal no se le vuelve a pedir.
        d.compartidos ? null : { t: 'sub', v: 'Di que empiezas' },
        d.compartidos ? null : { t: 'p', v: 'Quien sabe que lo estás haciendo te lo recuerda sin que se lo pidas. Tu imagen con tu dorsal sigue aquí:' },
        d.compartidos ? null : { t: 'boton', v: 'Compartir mi dorsal', url: e.dentro },
        { t: 'p', v: '¿Alguien que lleve tiempo diciendo «el lunes empiezo»? Pásale tu enlace.' },
        { t: 'boton2', v: 'Invitar por WhatsApp', url: e.whatsapp }
      ]
    };
  }
  if (tipo === 'd1') {
    return {
      asunto: 'Mañana empiezas. Hoy, 2 minutos',
      previa: 'Escribe tu señal y haz el test del día 0.',
      bloques: [
        { t: 'titulo', v: 'Mañana es el día 1.' },
        { t: 'p', v: 'Para empezar con buen pie, entra hoy y deja hechas dos cosas:' },
        { t: 'lista', v: ['Escribe tu señal: «Después de ___, ___».', 'Haz el test del día 0: 4 preguntas para saber de dónde partes. Lo repites el día 7 y el 21.'] },
        { t: 'boton', v: 'Entrar en Lock21', url: e.app },
        { t: 'nota', v: 'Entras con tu correo, sin contraseña: escribe ' + d.email + ' y te llega un enlace. Guárdala en tu pantalla de inicio para tenerla a un toque.' },
        { t: 'p', v: 'Mañana solo hay que hacer el check-in: un minuto. Si un día fallas, la racha lo perdona. Lo que pesa es el segundo seguido.' }
      ]
    };
  }
  // d0
  return {
    asunto: 'Hoy empieza, ' + nombre + '. Día 1 de 21',
    previa: 'Tu primer check-in dura un minuto.',
    bloques: [
      { t: 'titulo', v: 'Día 1 de 21.' },
      { t: 'p', v: 'Hoy empieza tu grupo. Tu hábito: ' + h.nombre.toLowerCase() + '. Cuando lo hagas, marca tu check-in. Un minuto.' },
      { t: 'boton', v: 'Hacer mi check-in de hoy', url: e.app },
      { t: 'nota', v: 'Si todavía no has entrado: escribe ' + d.email + ', te llega un enlace y en dos minutos tienes tu señal y el test del día 0.' },
      { t: 'p', v: 'El coach del día a día es una IA y te lo dice. No da dietas ni consejos médicos: te ayuda a no soltar el hábito.' },
      { t: 'separador' },
      { t: 'p', v: 'Si te apetece contar tu día 1, tu imagen está aquí. Etiqueta a @reto.lock21.' },
      { t: 'boton2', v: 'Compartir mi día 1', url: e.dentro }
    ]
  };
}

var C = { fondo: '#F5F2EA', tinta: '#121212', cobalto: '#2433D9', rosa: '#F6C6BD', gris: '#5B5A55' };

function bloqueHtml(b) {
  if (!b) { return ''; }
  if (b.t === 'titulo') { return '<h1 style="margin:0 0 18px;font-size:34px;line-height:1.05;letter-spacing:-1px;color:' + C.cobalto + ';font-weight:800">' + escapar(b.v) + '</h1>'; }
  if (b.t === 'sub') { return '<p style="margin:0 0 6px;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700;color:' + C.cobalto + '">' + escapar(b.v) + '</p>'; }
  if (b.t === 'p') { return '<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:' + C.tinta + '">' + escapar(b.v) + '</p>'; }
  if (b.t === 'nota') { return '<p style="margin:-4px 0 16px;font-size:13px;line-height:1.45;color:' + C.gris + ';word-break:break-word">' + escapar(b.v) + '</p>'; }
  if (b.t === 'separador') { return '<hr style="border:0;border-top:2px solid ' + C.rosa + ';margin:26px 0 22px">'; }
  if (b.t === 'lista') {
    return '<ol style="margin:0 0 18px;padding-left:22px;font-size:16px;line-height:1.5;color:' + C.tinta + '">' + b.v.map(function (x) { return '<li style="margin-bottom:6px">' + escapar(x) + '</li>'; }).join('') + '</ol>';
  }
  if (b.t === 'dato') {
    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:' + C.cobalto + ';border-radius:16px"><tr><td style="padding:18px 20px">' +
      b.v.filter(Boolean).map(function (f) {
        return '<p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:' + C.rosa + ';font-weight:700">' + escapar(f[0]) +
          '<br><span style="font-size:20px;letter-spacing:-.3px;text-transform:none;color:#FFFFFF;font-weight:700">' + escapar(f[1]) + '</span></p>';
      }).join('') + '</td></tr></table>';
  }
  if (b.t === 'boton' || b.t === 'boton2') {
    var fondo = b.t === 'boton' ? C.cobalto : C.rosa;
    var tinta = b.t === 'boton' ? '#FFFFFF' : C.cobalto;
    return '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 18px"><tr><td style="border-radius:999px;background:' + fondo + '">' +
      '<a href="' + escapar(b.url) + '" style="display:inline-block;padding:14px 24px;font-size:16px;font-weight:700;color:' + tinta + ';text-decoration:none;border-radius:999px">' + escapar(b.v) + '</a></td></tr></table>';
  }
  return '';
}

function bloqueTexto(b) {
  if (!b) { return ''; }
  if (b.t === 'separador') { return '—'; }
  if (b.t === 'dato') { return b.v.filter(Boolean).map(function (f) { return f[0] + ': ' + f[1]; }).join('\n'); }
  if (b.t === 'lista') { return b.v.map(function (x, i) { return (i + 1) + '. ' + x; }).join('\n'); }
  if (b.t === 'boton' || b.t === 'boton2') { return b.v + ': ' + b.url; }
  return b.v;
}

export function componer(tipo, id, d, hoy) {
  var c = contenido(tipo, id, d, hoy);
  var e = enlaces(id, d);
  var pie = 'Lock21 es un proyecto de Balancet. Recibes este correo porque pediste plaza en el reto (' + config.titular + ', ' + config.ciudad + ').';
  var html = '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>' + escapar(c.asunto) + '</title></head>' +
    '<body style="margin:0;padding:0;background:' + C.fondo + ';font-family:Arial,Helvetica,sans-serif">' +
    '<span style="display:none;max-height:0;overflow:hidden">' + escapar(c.previa) + '</span>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + C.fondo + '"><tr><td align="center" style="padding:24px 16px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">' +
    '<tr><td style="padding:0 0 22px"><img src="' + sitio() + '/correo/cabecera.png" width="158" height="44" alt="LOCK21" style="display:block;border:0"></td></tr>' +
    '<tr><td>' + c.bloques.map(bloqueHtml).join('') +
    '<p style="margin:26px 0 0;font-size:16px;line-height:1.5;color:' + C.tinta + '">Juanma<br><span style="color:' + C.gris + ';font-size:14px">Creador de Lock21 · Balancet</span></p></td></tr>' +
    '<tr><td style="padding:30px 0 0;font-size:12px;line-height:1.5;color:' + C.gris + '">' + escapar(pie) + ' <a href="' + escapar(e.baja) + '" style="color:' + C.gris + '">Darme de baja</a></td></tr>' +
    '</table></td></tr></table></body></html>';
  var texto = c.bloques.map(bloqueTexto).filter(Boolean).join('\n\n') + '\n\nJuanma\nCreador de Lock21 · Balancet\n\n' + pie + '\nDarme de baja: ' + e.baja;
  return { asunto: c.asunto, html: html, texto: texto, baja: e.baja };
}

// Remitente: lock21@balancet.org (Lock21 es un proyecto de Balancet). Se puede cambiar con
// CORREO_REMITENTE. Proveedor: Brevo (la misma cuenta y clave que Balancet, BREVO_API_KEY);
// si no está, Resend (RESEND_API_KEY).
export function remitente() {
  return (process.env.CORREO_REMITENTE || 'lock21@balancet.org').trim();
}

export function proveedor() {
  if (process.env.BREVO_API_KEY) { return 'brevo'; }
  if (process.env.RESEND_API_KEY) { return 'resend'; }
  return null;
}

export function correoListo() {
  return Boolean(proveedor());
}

async function motivoDe(res, prefijo) {
  var cuerpo = '';
  try { cuerpo = (await res.text()).slice(0, 160); } catch (e) { cuerpo = ''; }
  return prefijo + '_' + res.status + (cuerpo ? ': ' + cuerpo : '');
}

// Envía un correo de la secuencia. Devuelve { ok, motivo }.
export async function enviar(tipo, id, d, hoy) {
  var via = proveedor();
  if (!via) { return { ok: false, motivo: 'sin_configurar' }; }
  var m = componer(tipo, id, d, hoy || fechaEnZona(new Date()));
  var cabeceras = { 'List-Unsubscribe': '<' + m.baja + '>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' };
  try {
    var res;
    if (via === 'brevo') {
      res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          sender: { name: 'Lock21', email: remitente() },
          to: [{ email: d.email, name: String(d.nombre || '').slice(0, 60) || undefined }],
          replyTo: { email: remitente(), name: 'Lock21' },
          subject: m.asunto,
          htmlContent: m.html,
          textContent: m.texto,
          headers: cabeceras,
          tags: ['lock21', 'lock21-' + tipo]
        }),
        signal: AbortSignal.timeout(8000)
      });
    } else {
      res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + process.env.RESEND_API_KEY },
        body: JSON.stringify({
          from: 'Lock21 <' + remitente() + '>',
          to: [d.email],
          reply_to: remitente(),
          subject: m.asunto,
          html: m.html,
          text: m.texto,
          headers: cabeceras,
          tags: [{ name: 'tipo', value: tipo }]
        }),
        signal: AbortSignal.timeout(8000)
      });
    }
    if (!res.ok) { return { ok: false, motivo: await motivoDe(res, via) }; }
    return { ok: true, motivo: null };
  } catch (e) {
    return { ok: false, motivo: 'red: ' + String(e && e.message).slice(0, 80) };
  }
}

// Qué correo le toca ahora (o null). hoy 'AAAA-MM-DD' y hora 0-23 en Canarias; ahoraMs en ms.
export function correoQueToca(d, hoy, hora, ahoraMs) {
  if (!d || d.baja || !d.email || !d.grupo) { return null; }
  var c = d.correos || {};
  var faltan = diasEntre(hoy, d.grupo);
  function pendiente(t) { return !(c[t] && c[t].ok) && !((c[t] && c[t].intentos) >= MAX_INTENTOS); }
  // Horas desde la bienvenida que sí salió (si no salió, no frena a los demás).
  var desdeBienvenida = c.bienvenida && c.bienvenida.ok && c.bienvenida.en ? (ahoraMs - Date.parse(c.bienvenida.en)) / 3600000 : Infinity;
  if (faltan <= 0 && faltan >= -2 && pendiente('d0') && (faltan < 0 || hora >= 7)) { return 'd0'; }
  if (faltan === 1 && pendiente('d1') && hora >= 10 && desdeBienvenida >= 12) { return 'd1'; }
  if (faltan >= 2 && pendiente('bienvenida')) { return 'bienvenida'; }
  // El de 7 días solo si la bienvenida salió hace más de 3 días (si no, sería repetirse).
  if (faltan >= 2 && faltan <= 7 && pendiente('d7') && hora >= 10 && desdeBienvenida >= 72 && desdeBienvenida !== Infinity) { return 'd7'; }
  return null;
}

// Anota el resultado de un envío en la inscripción.
export function anotar(d, tipo, r, ahoraIso) {
  var previo = (d.correos && d.correos[tipo]) || {};
  // Sin configurar no cuenta como intento: se mandará cuando esté.
  var intentos = (previo.intentos || 0) + (r.ok || r.motivo === 'sin_configurar' ? 0 : 1);
  return { en: ahoraIso, ok: Boolean(r.ok), motivo: r.motivo || null, intentos: intentos };
}
