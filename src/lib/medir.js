// Medición propia sin cookies ni identificadores: solo suma visitas y clics por día y por origen.
// No guarda IP, ni correo, ni nada que identifique a nadie (ver privacidad.html).
var EVENTOS = ['visita', 'visita_app', 'clic_plaza', 'solicitud'];

function origen() {
  var ua = navigator.userAgent || '';
  var q = new URLSearchParams(window.location.search);
  var utm = (q.get('utm_source') || q.get('o') || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 20);
  if (utm === 'ig' || utm === 'instagram_bio' || utm === 'linktree') { utm = 'instagram'; }
  if (utm) { return utm; }
  if (/Instagram/i.test(ua)) { return 'instagram'; }
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) { return 'facebook'; }
  if (/WhatsApp/i.test(ua)) { return 'whatsapp'; }
  var ref = document.referrer || '';
  if (!ref) { return 'directo'; }
  try {
    var h = new URL(ref).hostname;
    if (h === window.location.hostname) { return 'interno'; }
    if (/instagram/.test(h)) { return 'instagram'; }
    if (/whatsapp|wa\.me/.test(h)) { return 'whatsapp'; }
    if (/google\./.test(h)) { return 'google'; }
    if (/facebook|fb\./.test(h)) { return 'facebook'; }
    if (/t\.co|twitter|x\.com/.test(h)) { return 'x'; }
    if (/tiktok/.test(h)) { return 'tiktok'; }
    return 'otros';
  } catch (e) {
    return 'otros';
  }
}

export default function medir(evento) {
  if (EVENTOS.indexOf(evento) === -1) { return; }
  try {
    var cuerpo = JSON.stringify({ e: evento, o: origen() });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/.netlify/functions/visita', new Blob([cuerpo], { type: 'application/json' }));
    } else {
      fetch('/.netlify/functions/visita', { method: 'POST', body: cuerpo, keepalive: true, headers: { 'content-type': 'application/json' } });
    }
  } catch (e) {
    // Medir nunca debe romper la web.
  }
}
