// Imagen «Estoy dentro» para compartir (historia 1080x1920 o publicación 1080x1350), dibujada en
// el navegador con la identidad 2: dos colores por pieza, el candado del logo y el dorsal de club.
import { ARCO, CUERPO, DIGITOS } from './candadoTrazos.js';

export var TEMAS = {
  cobalto: { fondo: '#2433D9', tinta: '#F6C6BD', nombre: 'Cobalto' },
  rosa: { fondo: '#F6C6BD', tinta: '#2433D9', nombre: 'Rosa' },
  mantequilla: { fondo: '#F2E6A2', tinta: '#1E4A37', nombre: 'Mantequilla' }
};

export var FORMATOS = {
  historia: { ancho: 1080, alto: 1920, nombre: 'Historia' },
  publicacion: { ancho: 1080, alto: 1350, nombre: 'Publicación' }
};

var FUENTE = '"Archivo Variable", "Archivo", system-ui, sans-serif';

export function fuenteLista() {
  if (!document.fonts || !document.fonts.load) { return Promise.resolve(); }
  return Promise.all([
    document.fonts.load('700 100px "Archivo Variable"'),
    document.fonts.load('600 40px "Archivo Variable"')
  ]).catch(function () { return null; });
}

function letra(ctx, peso, tam, estrecha) {
  ctx.font = peso + ' ' + tam + 'px ' + FUENTE;
  try { ctx.fontStretch = estrecha ? 'semi-condensed' : 'normal'; } catch (e) { /* navegadores sin fontStretch */ }
}

function espaciado(ctx, px) {
  try { ctx.letterSpacing = px + 'px'; } catch (e) { /* sin letterSpacing, se dibuja sin él */ }
}

function candado(ctx, x, y, escala, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(escala, escala);
  ctx.fillStyle = color;
  ctx.fill(new Path2D(ARCO));
  ctx.fill(new Path2D(CUERPO + DIGITOS), 'evenodd');
  ctx.restore();
}

function rectRedondo(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Ajusta el tamaño para que el texto quepa en el ancho dado.
function ajustar(ctx, texto, peso, tam, ancho, estrecha) {
  var t = tam;
  letra(ctx, peso, t, estrecha);
  while (ctx.measureText(texto).width > ancho && t > 20) {
    t = t - 4;
    letra(ctx, peso, t, estrecha);
  }
  return t;
}

function lineaDias(ctx, x, y, ancho, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, ancho, 4);
  for (var i = 1; i <= 21; i++) {
    var hito = i === 1 || i === 7 || i === 14 || i === 21;
    var px = x + (i - 1) / 20 * ancho;
    ctx.fillRect(px - 2, hito ? y - 16 : y - 8, 4, hito ? 36 : 20);
  }
  letra(ctx, 600, 26, false);
  espaciado(ctx, 2);
  ctx.textAlign = 'center';
  [1, 7, 14, 21].forEach(function (i) {
    ctx.fillText((i < 10 ? '0' : '') + i, x + (i - 1) / 20 * ancho, y + 62);
  });
  espaciado(ctx, 0);
}

function dorsal(ctx, x, y, w, h, t, datos) {
  rectRedondo(ctx, x, y, w, h, 34);
  ctx.fillStyle = t.tinta;
  ctx.fill();
  // Imperdibles
  ctx.fillStyle = t.fondo;
  [[x + 26, y + 26], [x + w - 26, y + 26], [x + 26, y + h - 26], [x + w - 26, y + h - 26]].forEach(function (p) {
    ctx.beginPath();
    ctx.arc(p[0], p[1], 10, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = t.fondo;
  letra(ctx, 600, 30, false);
  espaciado(ctx, 5);
  ctx.textAlign = 'left';
  ctx.fillText('DORSAL', x + 60, y + 78);
  ctx.textAlign = 'right';
  ctx.fillText('DE ' + datos.plazas, x + w - 60, y + 78);
  espaciado(ctx, -12);
  ctx.textAlign = 'center';
  var num = datos.dorsal ? (datos.dorsal < 10 ? '0' : '') + datos.dorsal : '21';
  letra(ctx, 700, h * 0.55, true);
  ctx.fillText(num, x + w / 2, y + h - 132);
  espaciado(ctx, 5);
  ctx.fillRect(x + 60, y + h - 104, w - 120, 4);
  letra(ctx, 600, 28, false);
  ctx.textAlign = 'left';
  ctx.fillText('RETO DE 21 DÍAS', x + 60, y + h - 54);
  ctx.textAlign = 'right';
  ctx.fillText(datos.grupoCorto, x + w - 60, y + h - 54);
  espaciado(ctx, 0);
}

// datos: { dorsal, plazas, grupoCorto ('16·11·26'), fechaTexto ('lunes 16 de noviembre'), habitoCorto }
export function dibujar(canvas, formato, tema, datos) {
  var f = FORMATOS[formato] || FORMATOS.historia;
  var t = TEMAS[tema] || TEMAS.cobalto;
  canvas.width = f.ancho;
  canvas.height = f.alto;
  var ctx = canvas.getContext('2d');
  var W = f.ancho;
  var M = 84;
  var historia = formato !== 'publicacion';
  ctx.fillStyle = t.fondo;
  ctx.fillRect(0, 0, W, f.alto);
  ctx.fillStyle = t.tinta;
  ctx.textBaseline = 'alphabetic';

  // Cabecera de club
  letra(ctx, 600, 30, false);
  espaciado(ctx, 6);
  ctx.textAlign = 'left';
  ctx.fillText('LOCK21', M, 120);
  ctx.textAlign = 'right';
  ctx.fillText('GRAN CANARIA', W - M, 120);
  ctx.fillRect(M, 148, W - 2 * M, 4);
  espaciado(ctx, 0);

  var y;
  if (historia) {
    candado(ctx, W / 2 - 115, 230, 2.3, t.tinta);
    y = 230 + 132 * 2.3 + 175;
  } else {
    candado(ctx, W - M - 180, 210, 1.8, t.tinta);
    y = 330;
  }

  // Titular
  ctx.textAlign = historia ? 'center' : 'left';
  var xt = historia ? W / 2 : M;
  var anchoT = historia ? W - 2 * M : W - 2 * M - 220;
  espaciado(ctx, -6);
  var tam = ajustar(ctx, 'DENTRO.', 700, historia ? 210 : 190, anchoT, true);
  ctx.fillText('ESTOY', xt, y);
  ctx.fillText('DENTRO.', xt, y + tam * 0.86);
  espaciado(ctx, 0);
  y = y + tam * 0.86 + (historia ? 90 : 76);

  // Hábito y fecha
  ctx.textAlign = 'left';
  letra(ctx, 600, 26, false);
  espaciado(ctx, 5);
  ctx.fillText('DESDE EL ' + datos.fechaTexto.toUpperCase(), M, y);
  espaciado(ctx, 0);
  var frase = 'Bloqueo: ' + datos.habitoCorto.toLowerCase();
  var tamH = ajustar(ctx, frase, 650, historia ? 66 : 60, W - 2 * M, true);
  ctx.fillText(frase, M, y + tamH + 12);
  y = y + tamH + 60;

  // Dorsal
  var hd = historia ? 470 : 400;
  dorsal(ctx, M, y, W - 2 * M, hd, t, datos);
  y = y + hd;

  // Línea de 21 días y pie
  ctx.fillStyle = t.tinta;
  lineaDias(ctx, M + 10, y + (historia ? 110 : 80), W - 2 * M - 20, t.tinta);
  letra(ctx, 600, 30, false);
  espaciado(ctx, 3);
  ctx.textAlign = 'left';
  ctx.fillText('lock21.netlify.app', M, f.alto - 80);
  ctx.textAlign = 'right';
  ctx.fillText('@reto.lock21', W - M, f.alto - 80);
  espaciado(ctx, 0);
  return canvas;
}

export function aBlob(canvas) {
  return new Promise(function (resolver) {
    canvas.toBlob(function (b) { resolver(b); }, 'image/png');
  });
}
