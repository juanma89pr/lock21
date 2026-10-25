"""Reel "21 no, 66" v6 (versión final pedida por Juanma, 25 oct 2026).

- Voz sin procesar (ni reducción de ruido, ni compresión, ni limitador): solo igualar volumen entre tomas y eco suave
  en las palabras clave.
- Fuera "es verdad que en los 21 ocurre algo" (repetía la idea).
- Corte en J: cuando se toca la nariz ("no son suficientes") el vídeo cambia antes y su voz sigue; en "bloquear",
  el final que no se entiende se tapa con un grafismo mientras sigue la voz.
- Camiseta oscurecida en los planos caminando (disimula el sudor).
- Videowall del plano horizontal sin marco: tres franjas a todo el ancho con una línea fina.
Uso: python3 reel_juanma5.py <carpeta_salida>
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from scipy import ndimage, signal
from scipy.io import wavfile
from playwright.sync_api import sync_playwright

import audio
from identidad2 import CSS, P, candado, dorsal, linea
from reel_juanma import JS, CSS_O, rotulo, centro, M

UP = Path('/mnt/user-data/uploads')
C90 = UP / 'DJI_20261025182401_0090_D.MP4'
C55 = UP / 'DJI_20261025180707_0055_D.MP4'
C62 = UP / 'DJI_20261025181037_0062_D.MP4'
C84 = UP / 'DJI_20261025181807_0084_D.MP4'
C86 = UP / 'DJI_20261025181827_0086_D.MP4'
W, H, FPS, SR = 1080, 1920, 30, 48000

# vídeo (va-vb) y audio (aa-ab) de cada plano; el audio se coloca en T0 + (aa - va) y puede seguir sobre el plano siguiente.
P_ = [
    dict(c=C90, va=0.80, vb=5.62, aa=0.80, ab=5.62, modo='v'),              # 0 ¿Verdad que... necesitas 21 días?
    dict(c=C90, va=5.95, vb=8.02, aa=5.95, ab=8.45, modo='v'),              # 1 Pues déjame decirte que no son suficientes (sin tocarse la nariz)
    dict(c=C55, va=0.07, vb=5.47, aa=0.50, ab=5.47, modo='v', oscuro=1),    # 2 Hay estudios... día 66... no es creado
    dict(c=C55, va=5.52, vb=9.45, aa=5.52, ab=9.45, modo='v', oscuro=1),    # 3 ¿por qué esos 21? Pues déjame contarte.
    dict(c=C62, va=0.00, vb=4.45, aa=0.00, ab=6.45, modo='v'),              # 4 Los primeros 21 días son para bloquear ese hábito y no dejarlo ir...
    dict(c=None, d=2.00),                                                   # 5 grafismo mientras sigue la voz ("...en los días que más lo hacemos")
    dict(c=C84, va=2.00, vb=7.55, aa=2.00, ab=7.55, modo='t'),              # 6 Y como sé lo difícil que es llegar a esos 21 días, hoy presento Lock21
    dict(c=None, d=5.40),                                                   # 7 Así va Lock21
    dict(c=C86, va=0.00, vb=2.93, aa=0.00, ab=2.93, modo='t'),              # 8 un hábito · 30 personas · gratis · 21 días
    dict(c=None, d=4.60),                                                   # 9 ¿Cuántos lunes más? + llamada
]
NF = [int(round(((p['vb'] - p['va']) if p['c'] else p['d']) * FPS)) for p in P_]
T0 = [sum(NF[:i]) / FPS for i in range(len(P_))]
DUR = sum(NF) / FPS
TH, TL = 638, 3   # videowall: 3 franjas de 1080x638 y 2 líneas de 3 px = 1920
CENTROS_T = [TH // 2, TH + TL + TH // 2, 2 * (TH + TL) + TH // 2]


def T(i, src):
    return round(T0[i] + (src - P_[i]['va']), 3)


def codificar(cmd_entrada, salida, n, filtro_py=None):
    """Lee fotogramas rgb24 de ffmpeg, opcionalmente los procesa en numpy y los codifica."""
    enc = ['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '%dx%d' % (W, H), '-r', str(FPS), '-i', '-',
           '-frames:v', str(n), '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-pix_fmt', 'yuv420p', str(salida)]
    dec = subprocess.Popen(cmd_entrada + ['-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    e = subprocess.Popen(enc, stdin=subprocess.PIPE)
    tam = W * H * 3
    for _ in range(n):
        buf = dec.stdout.read(tam)
        if len(buf) < tam:
            break
        f = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
        if filtro_py:
            f = filtro_py(f)
        e.stdin.write(f.astype(np.uint8).tobytes())
    e.stdin.close()
    e.wait()
    dec.kill()


def camiseta_negra(f):
    # Zonas oscuras y poco saturadas de la mitad inferior (la camiseta): se comprimen hacia el negro,
    # así las manchas de sudor dejan de contrastar.
    x = f.astype(np.float32)
    y = 0.299 * x[..., 0] + 0.587 * x[..., 1] + 0.114 * x[..., 2]
    sat = x.max(axis=2) - x.min(axis=2)
    m = np.clip((105 - y) / 45, 0, 1) * np.clip((48 - sat) / 28, 0, 1)
    filas = np.clip((np.arange(H) - 560) / 160.0, 0, 1)[:, None]
    m = m * filas
    m = ndimage.uniform_filter(m[::4, ::4], 5)
    m = np.kron(m, np.ones((4, 4), np.float32))[:H, :W]
    oscuro = x * 0.42 + 6
    return x * (1 - m[..., None]) + oscuro * m[..., None]


def cortar_video(dest):
    partes = []
    for i, p in enumerate(P_):
        out = dest / ('v%02d.mp4' % i)
        if p['c'] is None:
            subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=0x2433D9:s=%dx%d:r=%d' % (W, H, FPS),
                            '-frames:v', str(NF[i]), '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p', str(out)], check=True)
        elif p['modo'] == 't':
            sw = int(round(TH * 16 / 9))
            fc = ('[0:v]fps=%d,scale=%d:%d:flags=lanczos,crop=%d:%d:(iw-%d)*0.47/0.5/2,eq=contrast=1.04:saturation=1.05,split=3[a][b][c];'
                  'color=c=0xF5F2EA:s=%dx%d:r=%d[bg];[bg][a]overlay=0:0:shortest=1[t1];[t1][b]overlay=0:%d[t2];[t2][c]overlay=0:%d,format=rgb24[v]') % (
                FPS, sw, TH, W, TH, W, W, H, FPS, TH + TL, 2 * (TH + TL))
            codificar(['ffmpeg', '-v', 'error', '-ss', '%.3f' % p['va'], '-i', str(p['c']), '-filter_complex', fc, '-map', '[v]'], out, NF[i])
        else:
            vf = 'fps=%d,scale=%d:%d:flags=lanczos,eq=contrast=1.04:saturation=1.05' % (FPS, W, H)
            codificar(['ffmpeg', '-v', 'error', '-ss', '%.3f' % p['va'], '-i', str(p['c']), '-map', '0:v:0', '-vf', vf], out, NF[i],
                      camiseta_negra if p.get('oscuro') else None)
        partes.append(out)
    (dest / 'lista.txt').write_text(''.join("file '%s'\n" % q.name for q in partes))
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', str(dest / 'lista.txt'), '-c', 'copy', str(dest / 'base.mp4')], check=True)


_cache = {}


def audio_bruto(clip):
    # Audio tal cual sale de la cámara (un canal; los dos son idénticos). Sin filtros.
    if clip not in _cache:
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(clip), '-vn', '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
        _cache[clip] = np.frombuffer(raw, np.int16).astype(np.float64) / 32768
    return _cache[clip]


# Palabras clave con eco: (plano, desde, hasta) en tiempo del clip.
CLAVES = [(0, 4.12, 5.40), (2, 2.30, 2.95), (4, 1.68, 2.48), (6, 6.45, 7.40), (8, 1.00, 1.80)]


def voz():
    n = int(round(DUR * SR))
    v = np.zeros(n + SR)
    for i, p in enumerate(P_):
        if p['c'] is None:
            continue
        x = audio_bruto(p['c'])
        seg = x[int(round(p['aa'] * SR)):int(round(p['ab'] * SR))].copy()
        habla = seg[np.abs(seg) > 0.03]
        rms = np.sqrt(np.mean(habla ** 2)) if len(habla) else 0.1
        seg *= 0.11 / (rms + 1e-9)       # solo igualar volumen entre tomas
        f = int(0.01 * SR)
        seg[:f] *= np.linspace(0, 1, f)
        seg[-f:] *= np.linspace(1, 0, f)
        j = int(round((T0[i] + p['aa'] - p['va']) * SR))
        v[j:j + len(seg)] += seg
    # Eco suave solo en las palabras clave: dos repeticiones apagadas.
    seco = v.copy()
    for (i, a, b) in CLAVES:
        t1, t2 = T(i, a), T(i, b)
        pal = seco[int(t1 * SR):int(t2 * SR)].copy()
        f = int(0.02 * SR)
        pal[:f] *= np.linspace(0, 1, f)
        pal[-f:] *= np.linspace(1, 0, f)
        for d, g in ((0.17, 0.30), (0.34, 0.14)):
            j = int((t1 + d) * SR)
            eco = audio.lp(pal, 4500) * g
            v[j:j + len(eco)] += eco[:max(0, len(v) - j)]
    return v[:n]


def logo_marca(color, tam=150):
    return ('<div style="display:flex;align-items:center;gap:%dpx;color:%s">%s<span class="big" style="font-size:%dpx;line-height:.9">Lock21</span></div>') % (
        int(tam * .14), color, candado(color, int(tam * .62)), tam)


def candado_cierra(t_cierre, tam=140, fondo=None, tinta=None):
    return ('<span class="bloque" style="background:%s;padding:34px 44px;display:inline-block">%s</span>') % (
        fondo or P['mantequilla'], candado(tinta or P['bosque'], tam, clase='candado').replace('<svg class="candado"', '<svg class="candado" data-inicio="abierto" data-cerrar="%.3f"' % t_cierre, 1))


def rot_t(html_rot, top=1420, size=56):
    return html_rot.replace('class="rotulo"', 'class="rotulo" style="top:%dpx;width:1000px;font-size:%dpx"' % (top, size), 1)


def capa():
    out, ev = [], []
    marca = '<div class="marca-sup lab" data-v="fijo" data-a="%.3f" data-b="%.3f" style="font-size:24px">%s<span>Lock21 · Reto de 21 días</span></div>'
    out.append(marca % (0, T0[5], candado('#fff', 30)))
    Y = 1250

    # 0. Gancho.
    out.append(rotulo('¿Verdad que alguna vez te han dicho que para conseguir un *hábito* necesitas', T(0, 0.90), T(0, 4.10),
                      [T(0, x) for x in (0.90, 1.30, 1.36, 1.60, 1.80, 1.92, 2.00, 2.24, 2.50, 2.66, 2.98, 3.16, 3.44)]))
    out.append(centro('<span class="bloque big" style="background:%s;color:%s;font-size:200px;white-space:nowrap">21 días</span>' % (P['rosa'], P['cobalto']), T(0, 4.12), T0[1], Y))
    ev.append(('golpe', T(0, 4.12), 0.5))
    # 1. No son suficientes: 21 tachado; el rótulo sigue sobre el plano siguiente mientras acaba la frase.
    out.append(rotulo('pues déjame decirte que *no* son *suficientes*', T(1, 6.04), T(1, 8.45), [T(1, x) for x in (6.04, 6.14, 6.48, 7.00, 7.44, 7.56, 7.72)]))
    tach = ('<span class="bloque big" style="position:relative;background:%s;color:%s;font-size:250px;line-height:.85">21'
            '<span class="tachar" data-t="%.3f,%.3f" style="position:absolute;left:-5%%;top:46%%;height:22px;width:0;background:%s;border-radius:11px"></span></span>') % (
        P['hueso'], P['cobalto'], T(1, 7.45), T(1, 7.80), P['tomate'])
    out.append(centro(tach, T(1, 7.35), T(1, 8.45), Y))
    ev.append(('tic', T(1, 7.45), 0.6))
    # 2. 66.
    out.append(rotulo('hay estudios que hablan de que hasta el día *66* el hábito no es creado', T(2, 0.60), T0[3],
                      [T(2, x) for x in (0.60, 0.80, 1.14, 1.28, 1.52, 1.72, 1.82, 2.00, 2.16, 2.40, 3.85, 4.40, 4.66, 4.80, 4.90)]))
    out.append(centro('<div style="text-align:center"><span class="bloque big" style="background:%s;color:%s;font-size:250px;line-height:.85">66</span>'
                      '<p class="lab" style="margin-top:20px;font-size:28px;white-space:nowrap;color:#fff;text-shadow:0 1px 10px rgba(0,0,0,.5)">días, de media · Lally et al. 2010</p></div>' % (P['cobalto'], P['rosa']),
                      T(2, 2.40), T0[3] - 0.05, 1060))
    ev.append(('golpe', T(2, 2.40), 0.5))
    # 3. ¿21? Déjame contarte.
    out.append(rotulo('pero entonces, ¿por qué se nombra tanto esos *21?*', T(3, 5.62), T(3, 8.35), [T(3, x) for x in (5.62, 5.88, 6.24, 6.52, 6.72, 6.82, 7.16, 7.48, 7.70)]))
    out.append(centro('<span class="bloque big" style="background:%s;color:%s;font-size:230px;line-height:.85">¿21?</span>' % (P['mantequilla'], P['bosque']), T(3, 7.70), T(3, 8.40), 1060))
    ev.append(('pop', T(3, 7.70), 0.5))
    out.append(rotulo('pues déjame *contarte*', T(3, 8.45), T0[4], [T(3, 8.45), T(3, 8.62), T(3, 8.86)]))
    # 4. Bloquear: el candado se cierra justo en la palabra.
    out.append(rotulo('los primeros *21 días* son para *bloquear* ese hábito', T(4, 0.0), T(4, 3.10), [T(4, x) for x in (0.0, 0.18, 0.60, 0.84, 1.08, 1.36, 1.68, 2.48, 2.66)]))
    out.append(centro(candado_cierra(T(4, 2.05), 150), T(4, 1.62), T(4, 3.10), 1230))
    ev.append(('candado', T(4, 2.05), 1.0))
    out.append(rotulo('y *no* dejarlo ir', T(4, 3.06), T0[5], [T(4, x) for x in (3.06, 3.38, 3.76, 4.24)]))
    # 5. Grafismo mientras termina la frase: la línea de 21 días y "ahí lo dejamos casi todos".
    a5, b5 = T0[5] - 0.2, T0[6] + 0.25
    p5 = ('<div class="panel" data-a="%.3f" data-b="%.3f" style="background:%s;color:%s"><div class="lab" style="display:flex;justify-content:space-between;font-size:26px"><span>Lock21</span><span>Primeras semanas</span></div><div class="cont">'
          '<div class="fd" data-a="%.3f" style="margin-top:auto;margin-bottom:50px">%s</div>%s<div class="fd" data-a="%.3f" style="margin-top:44px">%s</div></div></div>') % (
        a5, b5, P['rosa'], P['cobalto'], T0[5] - 0.1, candado(P['cobalto'], 190),
        M('Ahí es donde|casi todos lo dejamos.', T0[5] + 0.1, 110), T0[5] + 0.3,
        linea(P['cobalto'], 1, 888).replace('class="linea "', 'class="linea" data-anim="%.3f,%.3f,1,10"' % (T0[5] + 0.4, T0[5] + 1.8), 1))
    out.append(p5)
    ev += [('barrido', a5 + 0.2, 0.5), ('barrido', b5 - 0.05, 0.45)]
    # 6. Videowall: "Y como sé lo difícil que es llegar a esos 21 días, hoy presento Lock21" -> logo.
    out.append(rot_t(rotulo('y como sé lo difícil que es llegar a esos *21 días*', T(6, 2.10), T(6, 5.60),
                            [T(6, x) for x in (2.10, 2.25, 2.42, 2.58, 2.66, 2.92, 3.10, 3.24, 3.56, 3.70, 3.80, 4.34)])))
    out.append(rot_t(rotulo('hoy presento', T(6, 5.75), T0[7], [T(6, 5.75), T(6, 5.92)])))
    out.append(centro('<span class="bloque" style="background:%s;padding:28px 44px 34px;display:inline-block">%s</span>' % (P['rosa'], logo_marca(P['cobalto'], 150)),
                      T(6, 6.45), T0[7], CENTROS_T[1]))
    ev += [('golpe', T(6, 6.45), 0.6), ('candado', T(6, 6.45), 0.6)]
    # 7. Así va Lock21.
    a7, b7 = T0[7] - 0.25, T0[8] + 0.25
    t7 = T0[7]

    def paso(n, texto, t):
        return ('<div class="fd" data-a="%.3f" style="display:flex;gap:30px;align-items:baseline;margin-top:44px;border-top:3px solid currentColor;padding-top:26px">'
                '<span class="big" style="font-size:96px;min-width:150px">%s</span><span class="med" style="font-size:56px">%s</span></div>') % (t, n, texto)
    p7 = ('<div class="panel" data-a="%.3f" data-b="%.3f" style="background:%s;color:%s"><div class="lab" style="display:flex;justify-content:space-between;font-size:26px"><span>Lock21</span><span>Cómo funciona</span></div><div class="cont">'
          '<div style="margin-top:auto">%s</div>%s%s%s'
          '<div class="fd" data-a="%.3f" style="margin-top:50px;display:flex;align-items:center;gap:26px">%s<span class="txt" style="font-size:44px">Gratis. Sin apps que descargar.</span></div></div></div>') % (
        a7, b7, P['mantequilla'], P['bosque'], M('Así va|Lock21.', t7 + 0.05, 150),
        paso('01', 'Eliges un hábito y lo atas a algo que ya haces.', t7 + 0.9),
        paso('02', 'Cada día, un check-in de 1 minuto con tu coach IA.', t7 + 2.0),
        paso('03', 'Día 21: desbloqueado. Y eliges el siguiente.', t7 + 3.1),
        t7 + 4.1, candado(P['bosque'], 70, abierto=True))
    out.append(p7)
    ev += [('barrido', a7 + 0.2, 0.5), ('pop', t7 + 0.9, 0.45), ('pop', t7 + 2.0, 0.45), ('pop', t7 + 3.1, 0.45), ('desbloqueo', t7 + 3.1, 0.6), ('barrido', b7 - 0.05, 0.45)]
    # 8. Videowall: un hábito · 30 personas · gratis · 21 días.
    out.append(centro(candado_cierra(T(8, 0.35), 150), T(8, 0.0), T(8, 0.95), CENTROS_T[1]))
    ev.append(('candado', T(8, 0.35), 0.8))
    out.append(centro(dorsal(P['tomate'], P['hueso'], '30', 'Grupo 01', 'Plazas', ancho=440), T(8, 1.0), T0[9], CENTROS_T[0] + 20))
    ev.append(('pop', T(8, 1.0), 0.5))
    out.append(rot_t(rotulo('un *hábito* · 30 personas · *gratis* · 21 días', T(8, 0.05), T0[9], [T(8, x) for x in (0.05, 0.20, 0.50, 0.60, 0.80, 1.06, 1.40, 1.86, 2.18)])))
    # 9. Cierre: la necesidad y la llamada.
    a9, t9 = T0[9] - 0.25, T0[9]
    p9 = ('<div class="panel" data-a="%.3f" data-b="%.3f" style="background:%s;color:%s"><div class="lab" style="display:flex;justify-content:space-between;font-size:26px"><span>Lock21</span><span>Salida 16·11</span></div><div class="cont">'
          '<div class="fd" data-pop="1" data-a="%.3f" style="margin-top:auto;margin-bottom:50px">%s</div>%s%s'
          '<div class="fd" data-a="%.3f" style="margin-top:44px"><span style="display:inline-flex;align-items:center;gap:16px;border-radius:999px;background:%s;color:%s;padding:24px 38px;font-size:42px;font-weight:750">Pide tu plaza: enlace en la bio</span></div></div></div>') % (
        a9, DUR + 1, P['cobalto'], P['rosa'], t9 + 0.05, logo_marca(P['rosa'], 120),
        M('¿Cuántos lunes|más vas a esperar?', t9 + 0.35, 120),
        M('Próximo grupo: lunes 16 nov.|Solo 30 plazas. Gratis.', t9 + 1.4, 54, paso=0.14, clase='med', estilo='margin-top:40px'),
        t9 + 2.3, P['rosa'], P['cobalto'])
    out.append(p9)
    ev += [('barrido', a9 + 0.2, 0.5), ('final', t9, 0.45), ('golpe', t9 + 0.35, 0.35), ('pop', t9 + 2.3, 0.5)]
    return '<div class="capa">%s</div>' % ''.join(out), ev


def renderizar_capa(html, dest):
    fr = dest / 'capa'
    fr.mkdir(parents=True, exist_ok=True)
    f = dest / 'capa.html'
    f.write_text('<!doctype html><html lang="es"><head><meta charset="utf-8"><style>%s %s .bloque .candado{display:block}</style></head><body>%s<script>%s</script></body></html>' % (CSS, CSS_O, html, JS), encoding='utf-8')
    with sync_playwright() as pw:
        br = pw.chromium.launch()
        pg = br.new_page(viewport={'width': W, 'height': H})
        pg.goto(f.as_uri())
        pg.evaluate('document.fonts.ready')
        pg.wait_for_timeout(200)
        for i in range(sum(NF)):
            pg.evaluate('pinta(%f)' % (i / FPS))
            pg.screenshot(path=str(fr / ('%05d.png' % i)), omit_background=True, clip={'x': 0, 'y': 0, 'width': W, 'height': H})
        br.close()


def main(dest):
    dest = Path(dest)
    dest.mkdir(parents=True, exist_ok=True)
    html, ev = capa()
    if not (dest / 'base.mp4').exists():
        cortar_video(dest)
    if not ((dest / 'capa').exists() and len(list((dest / 'capa').glob('*.png'))) == sum(NF)):
        renderizar_capa(html, dest)
    v = voz()
    ev = ev + [('golpe', T(i, a), 0.25) for (i, a, b) in CLAVES]
    eventos = [{'tipo': t, 't': max(0.0, round(x, 3)), 'g': g} for (t, x, g) in ev] + [{'tipo': 'candado', 't': -10, 'g': 0}]
    mus = audio.componer_eventos(DUR, eventos)[:len(v)]
    env = np.full(len(mus), 0.12)
    for i, p in enumerate(P_):
        if p['c'] is None and i != 5:
            env[int(T0[i] * SR):int((T0[i] + NF[i] / FPS) * SR)] = 0.65
    env = audio.lp(env, 5)
    mezcla = v[:len(mus)] + mus * env
    # Solo ganancia: pico a -1 dBFS (sin limitador ni compresor).
    mezcla *= 0.89 / (np.max(np.abs(mezcla)) + 1e-9)
    audio.guardar_wav(str(dest / 'mezcla.wav'), mezcla)
    (dest / 'guion.json').write_text(json.dumps({'T0': T0, 'NF': NF, 'DUR': DUR, 'eventos': eventos}, indent=1))
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(dest / 'base.mp4'), '-framerate', str(FPS), '-i', str(dest / 'capa' / '%05d.png'), '-i', str(dest / 'mezcla.wav'),
                    '-filter_complex', '[0:v][1:v]overlay=0:0:format=auto,format=yuv420p[v]', '-map', '[v]', '-map', '2:a',
                    '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-r', str(FPS), '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-movflags', '+faststart',
                    '-t', '%.3f' % DUR, str(dest / 'reel.mp4')], check=True)
    print('ok', dest / 'reel.mp4', DUR)


if __name__ == '__main__':
    main(sys.argv[1])
