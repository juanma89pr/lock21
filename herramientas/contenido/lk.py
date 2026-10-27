# Motor de render de piezas Lock21: HTML + Playwright -> PNG / MP4.
import json, os, shutil, subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

BUILD = Path(__file__).parent
ICONOS = json.loads((BUILD / 'icons.json').read_text())

C = dict(cobalto='#2433D9', hondo='#1A25A8', noche='#0B1240', dorsal='#FFD02E', pista='#F4F6FF', gris='#4A5175', lila='#C7CDF7')

CSS = """
@font-face { font-family: 'Archivo Variable'; font-weight: 100 900; font-stretch: 62% 125%;
  src: url(archivo-latin-ext-wdth-normal.woff2) format('woff2-variations');
  unicode-range: U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF; }
@font-face { font-family: 'Archivo Variable'; font-weight: 100 900; font-stretch: 62% 125%;
  src: url(archivo-latin-wdth-normal.woff2) format('woff2-variations');
  unicode-range: U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #000; }
body { font-family: 'Archivo Variable', sans-serif; font-stretch: 100%; -webkit-font-smoothing: antialiased; }
.lienzo { position: relative; overflow: hidden; display: flex; flex-direction: column; }
.t-cobalto { background: #2433D9; color: #fff; --acento: #FFD02E; --suave: rgba(255,255,255,.86); --linea: rgba(255,255,255,.28); --caja: rgba(11,18,64,.35); }
.t-pista { background: #F4F6FF; color: #0B1240; --acento: #2433D9; --suave: #4A5175; --linea: #C7CDF7; --caja: #fff; }
.t-noche { background: #0B1240; color: #F4F6FF; --acento: #FFD02E; --suave: rgba(244,246,255,.84); --linea: rgba(244,246,255,.22); --caja: #2433D9; }
.t-dorsal { background: #FFD02E; color: #0B1240; --acento: #2433D9; --suave: #0B1240; --linea: rgba(11,18,64,.3); --caja: #0B1240; }
.tit { font-stretch: 64%; font-weight: 860; text-transform: uppercase; line-height: .92; letter-spacing: -0.01em; text-wrap: balance; }
.medio { font-stretch: 72%; font-weight: 800; line-height: .98; }
.ac { color: var(--acento); }
.kicker { font-stretch: 108%; font-weight: 750; text-transform: uppercase; letter-spacing: .06em; color: var(--acento); }
.texto { font-weight: 500; line-height: 1.32; color: var(--suave); text-wrap: pretty; }
.texto b { color: inherit; font-weight: 750; }
.ico { display: inline-block; vertical-align: middle; }
.marca { display: flex; align-items: center; gap: 10px; font-stretch: 64%; font-weight: 860; font-size: 44px; text-transform: uppercase; letter-spacing: .01em; }
.marca svg { color: var(--acento); }
.t-dorsal .marca svg { color: #0B1240; }
.pastilla { display: inline-flex; align-items: center; gap: 14px; border-radius: 999px; font-weight: 750; font-stretch: 108%; }
/* Tablero */
.tablero { display: grid; grid-template-columns: repeat(7, 1fr); }
.celda { position: relative; aspect-ratio: 1; border-radius: 22%; display: flex; align-items: center; justify-content: center; border: 4px solid #C7CDF7; background: #fff; color: #4A5175; font-stretch: 72%; font-weight: 800; }
.celda.hecho { background: #2433D9; border-color: #2433D9; color: #F4F6FF; }
.celda.fallo { background: #F4F6FF; border: 4px dashed #4A5175; color: #4A5175; }
.celda.candado { background: #0B1240; border-color: #0B1240; color: #FFD02E; }
.celda .punto { position: absolute; top: -9px; right: -9px; width: 26px; height: 26px; border-radius: 50%; background: #FFD02E; box-shadow: 0 0 0 5px #F4F6FF; }
.marco-tablero { background: #F4F6FF; color: #0B1240; border-radius: 40px; }
/* Personal */
.p-mark { background: linear-gradient(transparent 58%, #FFD02E 58%, #FFD02E 92%, transparent 92%); padding: 0 .08em; }
"""


def icono(nombre, size=48, grosor=2, color='currentColor'):
    return ('<svg class="ico" width="%d" height="%d" viewBox="0 0 24 24" fill="none" stroke="%s" stroke-width="%s" '
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%s</svg>') % (size, size, color, grosor, ICONOS[nombre])


def marca(size=44):
    return '<span class="marca" style="font-size:%dpx">%sLock21</span>' % (size, icono('lock', int(size * 0.72), 2.75))


HABITOS = [
    ('dumbbell', 'Entrenar 3 días', 'Entrenar 3 días por semana', 'Después de salir del trabajo el lunes, el miércoles y el viernes,', 'me cambio y entreno antes de sentarme en el sofá.'),
    ('footprints', '8.000 pasos', '8.000 pasos al día', 'Después de comer,', 'salgo a caminar 20 minutos.'),
    ('moon', 'Cama antes de 23:30', 'Acostarme antes de las 23:30', 'Cuando suena la alarma de las 23:00,', 'apago la tele, me lavo los dientes y me voy a la cama.'),
    ('person-standing', '10 min de movilidad', '10 minutos de movilidad al día', 'Después del café de la mañana,', 'hago 10 minutos de movilidad en el salón.'),
    ('glass-water', '2 litros de agua', 'Beber 2 litros de agua al día', 'Después de cada comida,', 'relleno la botella de un litro y la dejo a la vista.'),
    ('monitor-off', 'Sin pantalla al dormir', 'Sin pantalla 30 minutos antes de dormir', 'Después de lavarme los dientes,', 'dejo el móvil cargando fuera del cuarto.'),
]


def rejilla_habitos(ancho=880, destacado=None, anim=None, tam=40):
    # anim: lista de tiempos de aparición por baldosa (para reels)
    out = ['<div style="display:grid;grid-template-columns:1fr 1fr;gap:22px;width:%dpx">' % ancho]
    for i, h in enumerate(HABITOS):
        on = destacado == i
        bg = '#FFD02E' if on else 'var(--caja)'
        fg = '#0B1240' if on else 'inherit'
        extra = ''
        if anim:
            extra = ' class="a" data-t0="%.2f" data-fx="pop"' % anim[i]
        hl = ''
        if destacado is not None and anim and on:
            hl = ' data-hl="%.2f"' % anim[-1]
        out.append('<div%s%s style="display:flex;align-items:center;gap:20px;border-radius:30px;padding:24px 26px;background:%s;color:%s;border:3px solid var(--linea)">'
                   '<span style="flex:none;width:84px;height:84px;border-radius:50%%;background:#FFD02E;color:#0B1240;display:flex;align-items:center;justify-content:center">%s</span>'
                   '<span class="medio" style="font-size:%dpx;line-height:1">%s</span></div>' % (extra, hl, bg, fg, icono(h[0], 44, 2.25), tam, h[1]))
    out.append('</div>')
    return ''.join(out)


def estados_ejemplo(fallo=10):
    return ['fallo' if n == fallo else ('candado' if n == 21 else 'hecho') for n in range(1, 22)]


def tablero(estados, ancho=840, gap=16, cabecera=True, tiempos=None, marco=True, leyenda=False):
    dias = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
    ic = int(ancho / 7 * 0.36)
    out = []
    if marco:
        out.append('<div class="marco-tablero" style="padding:40px;width:%dpx">' % (ancho + 80))
    out.append('<div class="tablero" style="gap:%dpx;width:%dpx">' % (gap, ancho))
    if cabecera:
        for d in dias:
            out.append('<span style="text-align:center;font-weight:650;font-size:%dpx;color:#4A5175">%s</span>' % (int(ancho / 7 * 0.28), d))
    for n in range(1, 22):
        e = estados[n - 1]
        punto = '<span class="punto"></span>' if n in (7, 21) else ''
        num = '<span style="font-size:%dpx">%d</span>' % (int(ancho / 7 * 0.42), n)
        cont = {'hecho': icono('check', ic, 3.2), 'fallo': icono('x', ic, 2.8), 'candado': icono('lock', ic, 2.6)}.get(e, num)
        if tiempos:
            # Pendiente hasta su tiempo; luego pasa a su estado.
            out.append('<div class="celda" data-cell="%s" data-t0="%.2f" data-num="%d">%s<span class="cont" style="display:none">%s</span>%s</div>'
                       % (e, tiempos[n - 1], n, num, cont, punto))
        else:
            out.append('<div class="celda %s">%s%s</div>' % (e if e != 'pend' else '', cont, punto))
    out.append('</div>')
    if leyenda:
        out.append('<div style="display:flex;flex-wrap:wrap;gap:14px 30px;margin-top:28px;font-size:28px;color:#4A5175;font-weight:550">'
                   '<span style="display:flex;align-items:center;gap:10px"><span style="width:28px;height:28px;border-radius:7px;background:#2433D9"></span>Cumplido</span>'
                   '<span style="display:flex;align-items:center;gap:10px"><span style="width:28px;height:28px;border-radius:7px;border:4px dashed #4A5175"></span>Fallo suelto, la racha sigue</span>'
                   '<span style="display:flex;align-items:center;gap:10px"><span style="width:26px;height:26px;border-radius:50%;background:#FFD02E"></span>Test</span></div>')
    if marco:
        out.append('</div>')
    return ''.join(out)


def curva(ancho=860, alto=420, color='currentColor', anim=None, etiquetas=True, zona=('#FFD02E', 0.26)):
    W, H = 560, 260
    M = dict(izq=24, der=24, arr=30, aba=40)
    x = lambda d: M['izq'] + d / 66 * (W - M['izq'] - M['der'])
    y = lambda v: H - M['aba'] - (v - 1) / 6 * (H - M['arr'] - M['aba'])
    P = [(0, 2.1), (7, 3.4), (21, 4.6)]
    Q = [(21, 4.6), (40, 5.5), (66, 5.95)]
    tr = lambda L: ' '.join(('M' if i == 0 else 'L') + '%.1f %.1f' % (x(d), y(v)) for i, (d, v) in enumerate(L))
    da = ''
    db = ''
    if anim:
        da = ' class="draw" data-t0="%.2f" data-t1="%.2f"' % anim[0]
        db = ' class="draw" data-t0="%.2f" data-t1="%.2f"' % anim[1]
    s = ['<svg width="%d" height="%d" viewBox="0 0 %d %d" style="color:%s;overflow:visible">' % (ancho, alto, W, H, color)]
    s.append('<rect fill="%s" fill-opacity="%s" x="%.1f" y="%d" width="%.1f" height="%d" rx="8"/>' % (zona[0], zona[1], x(0), M['arr'], x(21) - x(0), H - M['arr'] - M['aba']))
    s.append('<line x1="%d" x2="%d" y1="%.1f" y2="%.1f" stroke="currentColor" stroke-opacity=".3" stroke-width="2"/>' % (M['izq'], W - M['der'], H - M['aba'], H - M['aba']))
    s.append('<path%s d="%s" fill="none" stroke="#FFD02E" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>' % (da, tr(P)))
    s.append('<path%s d="%s" fill="none" stroke="currentColor" stroke-opacity=".7" stroke-width="3.5" stroke-dasharray="7 9"/>' % (db, tr(Q)))
    for d, v in P:
        s.append('<circle cx="%.1f" cy="%.1f" r="9" fill="#FFD02E" stroke="#0B1240" stroke-width="3"/>' % (x(d), y(v)))
    if etiquetas:
        for d in (0, 7, 21, 66):
            s.append('<text x="%.1f" y="%d" font-size="19" font-weight="700" text-anchor="middle" fill="currentColor" font-family="Archivo Variable">día %d</text>' % (x(d), H - 10, d))
    s.append('</svg>')
    return ''.join(s)


def tarjeta_coach(msg, manana, ancho=860, dia=9):
    return ('<div style="width:%dpx;border-radius:44px;background:#0B1240;color:#F4F6FF;padding:44px">'
            '<div style="display:flex;justify-content:space-between;align-items:center"><span class="medio" style="font-size:52px">Tu coach</span>'
            '<span style="display:inline-flex;align-items:center;gap:8px;border-radius:999px;background:#C7CDF7;color:#1A25A8;padding:8px 18px;font-size:24px;font-weight:800;letter-spacing:.06em">%sCOACH IA</span></div>'
            '<p style="margin-top:22px;font-size:34px;line-height:1.38;font-weight:500">%s</p>'
            '<div style="margin-top:26px;border-radius:28px;background:rgba(255,255,255,.1);padding:26px 30px">'
            '<p style="font-size:23px;font-weight:800;letter-spacing:.06em;color:#FFD02E">PARA MAÑANA</p>'
            '<p style="margin-top:8px;font-size:32px;font-weight:650;line-height:1.3">%s</p></div></div>') % (ancho, icono('bot', 26, 2.5), msg, manana)


def tarjeta_checkin(ancho=860, dia=9):
    btn = lambda t, on: ('<span style="flex:1;text-align:center;border-radius:24px;padding:26px 0;font-size:36px;font-weight:750;font-stretch:108%%;%s">%s</span>'
                         % ('background:#2433D9;color:#fff' if on else 'background:#F4F6FF;color:#0B1240;border:3px solid #C7CDF7', t))
    return ('<div style="width:%dpx;border-radius:44px;background:#fff;color:#0B1240;padding:44px;box-shadow:0 6px 0 #C7CDF7">'
            '<p class="medio" style="font-size:60px">Check-in del día %d</p>'
            '<p style="margin-top:30px;font-size:34px;font-weight:750">¿Lo hiciste hoy?</p>'
            '<div style="display:flex;gap:18px;margin-top:18px">%s%s</div>'
            '<p style="margin-top:28px;font-size:34px;font-weight:750">¿Hoy lo hiciste sin pensarlo?</p>'
            '<div style="display:flex;gap:18px;margin-top:18px">%s%s</div></div>') % (ancho, dia, btn('Sí', True), btn('No', False), btn('Sí', False), btn('No', False))


def captura_web(ancho=820):
    # Recreación local de la portada de lock21.balancet.org (sin red para capturarla).
    chips = ''.join('<span style="display:inline-flex;align-items:center;gap:8px;border-radius:999px;border:2.5px solid %s;padding:9px 16px;font-size:22px;font-weight:650;%s">%s%s</span>'
                    % ('#fff' if i == 1 else 'rgba(255,255,255,.45)', 'background:#fff;color:#0B1240' if i == 1 else '', icono(h[0], 22, 2.25), h[1])
                    for i, h in enumerate(HABITOS))
    return ('<div style="width:%dpx;border-radius:64px;background:#0B1240;padding:22px;box-shadow:0 30px 60px rgba(0,0,0,.35)">'
            '<div style="border-radius:46px;overflow:hidden;background:#2433D9;color:#fff;--acento:#FFD02E">'
            '<div style="display:flex;justify-content:space-between;align-items:center;padding:30px 34px;border-bottom:2px solid rgba(255,255,255,.15)">%s'
            '<span style="border-radius:999px;background:#FFD02E;color:#0B1240;padding:12px 22px;font-size:22px;font-weight:800;font-stretch:112%%">Pedir plaza</span></div>'
            '<div style="padding:36px 34px 44px">'
            '<span style="display:inline-flex;align-items:center;gap:10px;border-radius:999px;background:rgba(11,18,64,.35);padding:10px 18px;font-size:22px;font-weight:650"><span style="width:12px;height:12px;border-radius:50%%;background:#FFD02E"></span>Reto gratuito de 21 días</span>'
            '<p class="tit" style="margin-top:26px;font-size:96px">Elige un hábito. Los próximos 21 días son para él.</p>'
            '<p style="margin-top:22px;font-size:25px;line-height:1.4;color:rgba(255,255,255,.9)">Un solo hábito, atado a una señal fija, con un coach de IA cada día y un test que mide cuánto te sale solo.</p>'
            '<p style="margin-top:26px;font-size:21px;font-weight:650;color:rgba(255,255,255,.85)">Prueba: ¿cuál sería el tuyo?</p>'
            '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:12px">%s</div>'
            '<span style="display:inline-flex;align-items:center;gap:12px;margin-top:30px;border-radius:999px;background:#FFD02E;color:#0B1240;padding:20px 30px;font-size:28px;font-weight:750;font-stretch:108%%">Pedir mi plaza gratis</span>'
            '</div></div></div>') % (ancho, marca(40), chips)


ANIM_JS = """
function ease(x){ x=Math.max(0,Math.min(1,x)); return 1-Math.pow(1-x,3); }
function pinta(t){
  document.querySelectorAll('[data-escena]').forEach(function(e){
    var a=parseFloat(e.dataset.t0), b=parseFloat(e.dataset.t1);
    e.style.display = (t>=a && t<b) ? 'flex' : 'none';
  });
  document.querySelectorAll('.a').forEach(function(e){
    var t0=parseFloat(e.dataset.t0), d=parseFloat(e.dataset.d||'0.45');
    var k=ease((t-t0)/d), fx=e.dataset.fx||'up';
    e.style.opacity=k;
    if(fx==='up') e.style.transform='translateY('+((1-k)*60)+'px)';
    else if(fx==='pop') e.style.transform='scale('+(0.7+0.3*k)+')';
    else if(fx==='izq') e.style.transform='translateX('+((1-k)*-80)+'px)';
    if(e.dataset.hl){ var h=ease((t-parseFloat(e.dataset.hl))/0.3); if(h>0){ e.style.background='#FFD02E'; e.style.color='#0B1240'; e.style.transform='scale('+(1+0.05*Math.sin(Math.min(1,h)*Math.PI))+')'; } else { e.style.background=''; e.style.color=''; } }
  });
  document.querySelectorAll('[data-cell]').forEach(function(c){
    var t0=parseFloat(c.dataset.t0), on=t>=t0, est=c.dataset.cell;
    c.className='celda'+(on?' '+est:'');
    c.firstChild.style.display=on?'none':'';
    c.querySelector('.cont').style.display=on?'':'none';
    var k=ease((t-t0)/0.25); c.style.transform= on ? 'scale('+(0.8+0.2*k)+')' : '';
  });
  document.querySelectorAll('.draw').forEach(function(p){
    var L=p.getTotalLength(); var k=ease((t-parseFloat(p.dataset.t0))/(parseFloat(p.dataset.t1)-parseFloat(p.dataset.t0)));
    if(!p.dataset.dash){ p.dataset.dash=p.getAttribute('stroke-dasharray')||''; }
    if(p.dataset.dash){ p.style.opacity=k; }
    else { p.style.strokeDasharray=L; p.style.strokeDashoffset=L*(1-k); }
  });
  document.querySelectorAll('[data-count]').forEach(function(e){
    var v=e.dataset.count.split(','), a=+v[0], b=+v[1], t0=+v[2], t1=+v[3];
    e.textContent=Math.round(a+(b-a)*ease((t-t0)/(t1-t0)));
  });
  document.querySelectorAll('[data-tachar]').forEach(function(e){
    var v=e.dataset.tachar.split(','); e.style.width=(ease((t-v[0])/(v[1]-v[0]))*100)+'%';
  });
}
"""


def pagina(cuerpo, w, h, extra_css=''):
    return ('<!doctype html><html lang="es"><head><meta charset="utf-8"><style>%s .lienzo{width:%dpx;height:%dpx} %s</style></head>'
            '<body>%s<script>%s</script></body></html>') % (CSS, w, h, extra_css, cuerpo, ANIM_JS)


class Render:
    def __enter__(self):
        self.pw = sync_playwright().start()
        self.br = self.pw.chromium.launch()
        return self

    def __exit__(self, *a):
        self.br.close()
        self.pw.stop()

    def _abrir(self, html, w, h):
        f = BUILD / '_tmp.html'
        f.write_text(html, encoding='utf-8')
        pg = self.br.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1)
        pg.goto(f.as_uri())
        pg.evaluate('document.fonts.ready')
        pg.wait_for_timeout(150)
        return pg

    def png(self, cuerpo, w, h, destino, t=None):
        pg = self._abrir(pagina(cuerpo, w, h), w, h)
        if t is not None:
            pg.evaluate('pinta(%f)' % t)
        Path(destino).parent.mkdir(parents=True, exist_ok=True)
        pg.screenshot(path=str(destino), clip={'x': 0, 'y': 0, 'width': w, 'height': h})
        pg.close()

    def video(self, cuerpo, w, h, duracion, destino, fps=30):
        pg = self._abrir(pagina(cuerpo, w, h), w, h)
        tmp = BUILD / '_frames'
        shutil.rmtree(tmp, ignore_errors=True)
        tmp.mkdir()
        n = int(round(duracion * fps))
        for i in range(n):
            pg.evaluate('pinta(%f)' % (i / fps))
            pg.screenshot(path=str(tmp / ('%05d.jpg' % i)), type='jpeg', quality=95, clip={'x': 0, 'y': 0, 'width': w, 'height': h})
        pg.close()
        Path(destino).parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', str(tmp / '%05d.jpg'),
                        '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium',
                        '-r', str(fps), '-movflags', '+faststart', '-an', str(destino)], check=True)
        shutil.rmtree(tmp, ignore_errors=True)
