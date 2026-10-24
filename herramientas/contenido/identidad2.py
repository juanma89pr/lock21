"""Identidad 2 de Lock21 (desde el 24 oct 2026): mismo candado, más limpia y nórdica, con piezas de club deportivo.

Piezas comunes (candado del logo, insignia, dorsal, línea de 21 días), paleta en parejas y renderizador
de carruseles (1080x1350) e historias (1080x1920). Los reels están en dinamico2.py.
"""
from pathlib import Path

from playwright.sync_api import sync_playwright

BUILD = Path(__file__).parent

P = dict(cobalto='#2433D9', rosa='#F6C6BD', tomate='#E5462B', mantequilla='#F2E6A2', lila='#CBC4F4', bosque='#1E4A37', hueso='#F5F2EA', tinta='#121212')
# Parejas (fondo, tinta). Siempre dos colores por pieza.
PAREJAS = {
    'rosa': (P['rosa'], P['cobalto']),
    'cobalto': (P['cobalto'], P['rosa']),
    'lila': (P['lila'], P['tomate']),
    'mantequilla': (P['mantequilla'], P['bosque']),
    'bosque': (P['bosque'], P['mantequilla']),
    'tomate': (P['tomate'], P['mantequilla']),
    'hueso': (P['hueso'], P['cobalto']),
}

DIGITOS = ("M17.26 118.5H47.88V108.08H31.81Q32.36 107.07 33.1 106.07Q33.84 105.08 34.81 104Q35.79 102.91 37.02 101.75Q39.47 99.26 41.41 97.01Q43.35 94.77 44.69 92.47Q46.02 90.16 46.74 87.49Q47.47 84.83 47.47 81.53Q47.47 78.16 46.46 75.54Q45.46 72.91 43.58 71.11Q41.7 69.31 39.07 68.39Q36.45 67.48 33.16 67.48Q27.84 67.48 24.36 69.450Q20.88 71.42 19.15 74.98Q17.41 78.54 17.41 83.43Q17.41 83.96 17.44 84.74Q17.47 85.51 17.54 86.07H28.96V83.23Q28.96 81.2 29.31 79.89Q29.66 78.59 30.36 77.94Q31.07 77.3 32.18 77.3Q33.4 77.3 34 77.92Q34.6 78.54 34.85 79.57Q35.11 80.6 35.11 81.93Q35.11 84.55 34.08 86.7Q33.05 88.85 31.33 90.94Q29.62 93.02 27.39 95.49Q25.59 97.49 23.78 99.63Q21.98 101.76 20.5 104.15Q19.03 106.53 18.14 109.21Q17.26 111.88 17.26 115Z"
           "M54.92 118.5H82.74V108.43H75.1V68.28H70.72Q68.69 70.1 65.92 71.85Q63.15 73.6 60.29 74.77Q57.42 75.93 54.92 76.14V84.55H62.66V108.43H54.92Z")
CUERPO = "M18 52H82C91.94 52 100 60.06 100 70V114C100 123.94 91.94 132 82 132H18C8.06 132 0 123.94 0 114V70C0 60.06 8.06 52 18 52Z"
# Arco del logo con la pata izquierda algo más larga (queda oculta tras el cuerpo) para poder abrirlo.
ARCO = "M20 64V30C20 13.43 33.43 0 50 0C66.57 0 80 13.43 80 30V52H67V30C67 20.61 59.39 13 50 13C40.61 13 33 20.61 33 30V64Z"

ARCHIVO = (BUILD / 'archivo-latin-wdth-normal.woff2').as_uri()
ARCHIVO_EXT = (BUILD / 'archivo-latin-ext-wdth-normal.woff2').as_uri()

CSS = """
@font-face{font-family:A;font-weight:100 900;font-stretch:62% 125%;src:url(ARCH) format('woff2-variations');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:A;font-weight:100 900;font-stretch:62% 125%;src:url(ARCHEXT) format('woff2-variations');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#000}
body{font-family:A;-webkit-font-smoothing:antialiased}
.pieza{position:relative;overflow:hidden;display:flex;flex-direction:column}
.big{font-weight:700;letter-spacing:-.05em;line-height:.9;font-stretch:90%;text-wrap:balance}
.med{font-weight:650;letter-spacing:-.035em;line-height:1;font-stretch:92%;text-wrap:balance}
.txt{font-weight:500;letter-spacing:-.01em;line-height:1.32;text-wrap:pretty}
.lab{font-weight:600;letter-spacing:.16em;text-transform:uppercase}
""".replace('ARCHEXT', ARCHIVO_EXT).replace('ARCH', ARCHIVO)


def candado(color, tam=100, abierto=False, clase=''):
    arco_t = 'translate(0 -12) rotate(-22 26 40)' if abierto else ''
    return ('<svg class="%s" width="%d" height="%d" viewBox="0 -30 100 162" style="overflow:visible;display:block">'
            '<path class="arco" fill="%s" transform="%s" d="%s"/>'
            '<path class="cuerpo" fill="%s" fill-rule="evenodd" d="%s%s"/></svg>') % (
        clase, tam, int(tam * 1.62), color, arco_t, ARCO, color, CUERPO, DIGITOS)


def insignia(color, fondo, tam=300, texto='LOCK21 · RETO DE 21 DÍAS · GRAN CANARIA · EST. 2026 · ', uid='i'):
    r = 116
    return ('<svg width="%d" height="%d" viewBox="0 0 300 300" style="display:block"><defs><path id="c%s" d="M150 150 m-%d 0 a%d %d 0 1 1 %d 0 a%d %d 0 1 1 -%d 0"/></defs>'
            '<circle cx="150" cy="150" r="148" fill="%s"/><circle cx="150" cy="150" r="94" fill="none" stroke="%s" stroke-width="2.2"/>'
            '<text font-family="A" font-weight="600" font-size="18.6" letter-spacing="2.9" fill="%s"><textPath href="#c%s">%s</textPath></text>'
            '<g transform="translate(118 99) scale(.64)"><path fill="%s" d="%s"/><path fill="%s" fill-rule="evenodd" d="%s%s"/></g></svg>') % (
        tam, tam, uid, r, r, r, 2 * r, r, r, 2 * r, fondo, color, color, uid, texto, color, ARCO, color, CUERPO, DIGITOS)


def dorsal(fondo, tinta, num='21', arriba='LOCK21', abajo='RETO DE 21 DÍAS', fecha='16·11·26', ancho=520, agujeros='#F5F2EA'):
    pins = ''.join('<span style="position:absolute;%s;width:%dpx;height:%dpx;border-radius:50%%;background:%s"></span>' % (
        pos, int(ancho * .028), int(ancho * .028), agujeros) for pos in ('top:12px;left:12px', 'top:12px;right:12px', 'bottom:12px;left:12px', 'bottom:12px;right:12px'))
    f = ancho / 520.0
    return ('<div style="width:%dpx;aspect-ratio:1.35;background:%s;color:%s;border-radius:%dpx;position:relative;display:flex;flex-direction:column;justify-content:space-between;padding:%dpx %dpx">'
            '%s<div class="lab" style="display:flex;justify-content:space-between;font-size:%dpx"><span>%s</span><span>Gran Canaria</span></div>'
            '<div class="big" style="font-size:%dpx;text-align:center;line-height:.8">%s</div>'
            '<div class="lab" style="border-top:%dpx solid currentColor;padding-top:%dpx;font-size:%dpx;display:flex;justify-content:space-between"><span>%s</span><span>%s</span></div></div>') % (
        ancho, fondo, tinta, int(22 * f), int(32 * f), int(38 * f), pins, int(21 * f), arriba, int(ancho * .42), num, max(2, int(3 * f)), int(12 * f), int(18 * f), abajo, fecha)


def linea(color, dia=7, ancho=760, nums=True, clase='', alto=60):
    marcas = ''.join('<span style="position:absolute;left:%.2f%%;top:%dpx;width:3px;height:%dpx;background:%s;transform:translateX(-50%%)"></span>' % (
        (i - 1) / 20 * 100, 2 if i in (1, 7, 14, 21) else 10, 30 if i in (1, 7, 14, 21) else 12, color) for i in range(1, 22))
    etiquetas = ''.join('<span class="lab" style="position:absolute;left:%.2f%%;top:42px;transform:translateX(-50%%);font-size:20px;letter-spacing:.08em">%02d</span>' % ((i - 1) / 20 * 100, i) for i in (1, 7, 14, 21)) if nums else ''
    pos = (dia - 1) / 20 * 100
    return ('<div class="linea %s" data-dia="%d" style="position:relative;width:%dpx;height:%dpx;color:%s">'
            '<span style="position:absolute;left:0;right:0;top:15px;height:3px;background:%s;opacity:.3"></span>'
            '<span class="lleno" style="position:absolute;left:0;width:%.2f%%;top:14px;height:5px;background:%s"></span>%s%s'
            '<span class="punto" style="position:absolute;left:%.2f%%;top:5px;width:24px;height:24px;border-radius:50%%;background:%s;transform:translateX(-50%%)"></span></div>') % (
        clase, dia, ancho, alto, color, color, pos, color, marcas, etiquetas, pos, color)


def cabecera(izq='Lock21', der='', tam=24):
    return '<div class="lab" style="display:flex;justify-content:space-between;font-size:%dpx"><span>%s</span><span>%s</span></div>' % (tam, izq, der)


def pieza(pareja, w, h, cuerpo, pad='80px 84px 84px'):
    fondo, tinta = PAREJAS[pareja]
    return '<div class="pieza" style="width:%dpx;height:%dpx;background:%s;color:%s;padding:%s">%s</div>' % (w, h, fondo, tinta, pad, cuerpo)


def pagina(cuerpo, extra_css=''):
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><style>%s %s</style></head><body>%s</body></html>' % (CSS, extra_css, cuerpo)


class Render:
    def __enter__(self):
        self.pw = sync_playwright().start()
        self.br = self.pw.chromium.launch()
        return self

    def __exit__(self, *a):
        self.br.close()
        self.pw.stop()

    def png(self, html, w, h, destino):
        pg = self.br.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1)
        f = BUILD / '_tmp_id2.html'
        f.write_text(pagina(html), encoding='utf-8')
        pg.goto(f.as_uri())
        pg.evaluate('document.fonts.ready')
        pg.wait_for_timeout(120)
        Path(destino).parent.mkdir(parents=True, exist_ok=True)
        pg.screenshot(path=str(destino), clip={'x': 0, 'y': 0, 'width': w, 'height': h}, type='jpeg' if str(destino).endswith('.jpg') else 'png', **({'quality': 93} if str(destino).endswith('.jpg') else {}))
        pg.close()


# ---------- plantillas de carrusel (1080x1350) e historia (1080x1920) ----------

def slide(pareja, cuerpo, der='', izq='Lock21'):
    return pieza(pareja, 1080, 1350, cabecera(izq, der) + cuerpo)


def historia(pareja, cuerpo, der='', izq='Lock21'):
    # Zona segura de historias: 250 px arriba y abajo.
    return pieza(pareja, 1080, 1920, cabecera(izq, der, 26) + cuerpo, pad='250px 90px 280px')
