"""Reel "21 no, 66" v4 (con 0062 "bloquear" y 0084 "hoy presento Lock21", explicación y llamada final; máx. 45 s).
Basado en v3 (25 oct 2026): empieza con el clip 0090, mezcla los 4 vídeos de Juanma con guion,
el plano horizontal (0086) triplicado en pantalla tipo videowall para respetar su formato, el candado como gancho
y el logo de Lock21. Sin eco, cortes exactos por fotograma. ~29 s.
Uso: python3 reel_juanma3.py <carpeta_salida>
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from playwright.sync_api import sync_playwright

import audio
from identidad2 import CSS, P, candado, dorsal, insignia, linea
from reel_juanma import JS, CSS_O, rotulo, centro, M

UP = Path('/mnt/user-data/uploads')
C90 = UP / 'DJI_20261025182401_0090_D.MP4'
C55 = UP / 'DJI_20261025180707_0055_D.MP4'
C89 = UP / 'DJI_20261025182229_0089_D.MP4'
C86 = UP / 'DJI_20261025181827_0086_D.MP4'
C62 = UP / 'DJI_20261025181037_0062_D.MP4'
C84 = UP / 'DJI_20261025181807_0084_D.MP4'
W, H, FPS, SR = 1080, 1920, 30, 48000

# (clip, desde, hasta, modo) modo: 'vertical' | 'triple' | None (grafismo a pantalla completa)
GUION = [
    (C90, 0.80, 5.62, 'vertical'),   # 0. ¿Verdad que alguna vez te han dicho que para conseguir un hábito necesitas 21 días?
    (C90, 5.95, 8.45, 'vertical'),   # 1. Pues déjame decirte que no son suficientes.
    (C55, 0.50, 5.47, 'vertical'),   # 2. Hay estudios que hablan de que hasta el día 66 el hábito no es creado,
    (C55, 5.52, 9.45, 'vertical'),   # 3. pero entonces, ¿por qué se nombra tanto esos 21? Pues déjame contarte.
    (C89, 8.27, 10.47, 'vertical'),  # 4. Es verdad que en los 21 ocurre algo.
    (C62, 0.00, 6.45, 'vertical'),   # 5. Los primeros 21 días son para bloquear ese hábito y no dejarlo ir en los días que más lo hacemos.
    (C84, 2.00, 7.55, 'triple'),     # 6. Y como es tan difícil llegar a esos 21 días, hoy presento Lock21.
    (None, 0, 5.40, None),           # 7. Cómo funciona (grafismo).
    (C86, 0.00, 2.93, 'triple'),     # 8. (Bloquear) un hábito. 30 personas, gratis, durante 21 días.
    (None, 0, 4.60, None),           # 9. Cierre: la necesidad y la llamada.
]
NF = [int(round((b - a) * FPS)) for (_, a, b, _) in GUION]
T0 = [sum(NF[:i]) / FPS for i in range(len(GUION))]
DUR = sum(NF) / FPS
# Videowall del plano horizontal: tres copias de 16:9 apiladas sobre cobalto.
TW, TH, TG = 960, 540, 34
TY0 = (H - (3 * TH + 2 * TG)) // 2


def T(i, t_src):
    return round(T0[i] + (t_src - GUION[i][1]), 3)


def cortar_video(dest):
    partes = []
    for i, (clip, a, b, modo) in enumerate(GUION):
        out = dest / ('v%02d.mp4' % i)
        if clip is None:
            cmd = ['ffmpeg', '-y', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=0x2433D9:s=%dx%d:r=%d' % (W, H, FPS)]
        elif modo == 'triple':
            x0 = (W - TW) // 2
            fc = ('color=c=0x2433D9:s=%dx%d:r=%d[bg];[0:v]fps=%d,scale=%d:%d:flags=lanczos,eq=contrast=1.04:saturation=1.05,format=yuv420p,split=3[a][b][c];'
                  '[a]format=yuv420p[a1];[c]format=yuv420p[c1];'
                  '[bg][a1]overlay=%d:%d:shortest=1[t1];[t1][b]overlay=%d:%d[t2];[t2][c1]overlay=%d:%d,format=yuv420p[v]') % (
                W, H, FPS, FPS, TW, TH, x0, TY0, x0, TY0 + TH + TG, x0, TY0 + 2 * (TH + TG))
            cmd = ['ffmpeg', '-y', '-v', 'error', '-ss', '%.3f' % a, '-i', str(clip), '-filter_complex', fc, '-map', '[v]']
        else:
            vf = 'fps=%d,scale=%d:%d:flags=lanczos,eq=contrast=1.04:saturation=1.05,format=yuv420p' % (FPS, W, H)
            cmd = ['ffmpeg', '-y', '-v', 'error', '-ss', '%.3f' % a, '-i', str(clip), '-map', '0:v:0', '-vf', vf]
        cmd += ['-frames:v', str(NF[i]), '-an', '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-r', str(FPS), '-pix_fmt', 'yuv420p', str(out)]
        subprocess.run(cmd, check=True)
        partes.append(out)
    (dest / 'lista.txt').write_text(''.join("file '%s'\n" % p.name for p in partes))
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', str(dest / 'lista.txt'), '-c', 'copy', str(dest / 'base.mp4')], check=True)


def audio_clip(clip, dest):
    tmp = dest / (clip.stem + '_voz_natural.wav')
    if not tmp.exists():
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(clip), '-vn', '-ac', '1', '-ar', str(SR),
                        '-af', 'highpass=f=70,acompressor=threshold=-16dB:ratio=1.6:attack=20:release=250:makeup=1', str(tmp)], check=True)
    sr, x = wavfile.read(str(tmp))
    return x.astype(np.float64) / 32768


# Palabras clave (plano, desde, hasta en el clip) que se realzan.
CLAVES = [(0, 4.12, 5.52), (1, 7.72, 8.32), (2, 2.30, 2.95), (5, 1.68, 2.48), (6, 6.45, 7.45), (8, 1.00, 1.85)]


def voz(dest):
    n = int(round(DUR * SR))
    v = np.zeros(n + SR)
    for i, (clip, a, b, modo) in enumerate(GUION):
        if clip is None:
            continue
        x = audio_clip(clip, dest)
        largo = int(round(NF[i] / FPS * SR))
        seg = x[int(round(a * SR)):int(round(a * SR)) + largo].copy()
        con_voz = seg[np.abs(seg) > 0.02]
        rms = np.sqrt(np.mean(con_voz ** 2)) if len(con_voz) else 0.1
        seg *= 0.12 / (rms + 1e-9)
        f = int(0.015 * SR)
        seg[:f] *= np.linspace(0, 1, f)
        seg[-f:] *= np.linspace(1, 0, f)
        j = int(round(T0[i] * SR))
        v[j:j + len(seg)] += seg
    # Realce solo en las palabras clave: un poco más de presencia y una cola corta de sala (sin eco ni robotizar).
    sala = audio.reverb_ir(0.9, 5000)
    for (i, a, b) in CLAVES:
        t1, t2 = T(i, a), T(i, b)
        j1, j2 = int(t1 * SR), int(t2 * SR)
        pal = v[j1:j2].copy()
        f = int(0.02 * SR)
        rampa = np.ones(len(pal)); rampa[:f] = np.linspace(0, 1, f); rampa[-f:] = np.linspace(1, 0, f)
        v[j1:j2] += pal * 0.33 * rampa
        cola = __import__('scipy.signal', fromlist=['fftconvolve']).fftconvolve(pal * rampa, sala)
        v[j1:j1 + len(cola)] += 0.22 * cola[:max(0, len(v) - j1)]
    return np.clip(v[:n], -1, 1)


def logo_marca(color, tam=150):
    return ('<div style="display:flex;align-items:center;gap:%dpx;color:%s">%s<span class="big" style="font-size:%dpx;line-height:.9">Lock21</span></div>') % (
        int(tam * .14), color, candado(color, int(tam * .62)), tam)


def capa():
    out, ev = [], []
    marca = '<div class="marca-sup lab" data-v="fijo" data-a="%.3f" data-b="%.3f" style="font-size:24px">%s<span>Lock21 · Reto de 21 días</span></div>'
    out.append(marca % (0, T0[6], candado('#fff', 30)))
    Y = 1250

    def candado_cierra(t_cierre, tam=140, fondo=None, tinta=None):
        return ('<span class="bloque" style="background:%s;padding:34px 44px;display:inline-block">%s</span>') % (
            fondo or P['mantequilla'], candado(tinta or P['bosque'], tam, clase='candado').replace('<svg class="candado"', '<svg class="candado" data-inicio="abierto" data-cerrar="%.3f"' % t_cierre, 1))

    # 0. Gancho.
    out.append(rotulo('¿Verdad que alguna vez te han dicho que para conseguir un *hábito* necesitas', T(0, 0.90), T(0, 4.10),
                      [T(0, x) for x in (0.90, 1.30, 1.36, 1.60, 1.80, 1.92, 2.00, 2.24, 2.50, 2.66, 2.98, 3.16, 3.44)]))
    out.append(centro('<span class="bloque big" style="background:%s;color:%s;font-size:200px;white-space:nowrap">21 días</span>' % (P['rosa'], P['cobalto']), T(0, 4.12), T0[1], Y))
    ev.append(('golpe', T(0, 4.12), 0.55))
    # 1. No son suficientes.
    out.append(rotulo('pues déjame decirte que *no* son *suficientes*', T(1, 6.04), T0[2], [T(1, x) for x in (6.04, 6.14, 6.48, 7.00, 7.44, 7.56, 7.72)]))
    tach = ('<span class="bloque big" style="position:relative;background:%s;color:%s;font-size:250px;line-height:.85">21'
            '<span class="tachar" data-t="%.3f,%.3f" style="position:absolute;left:-5%%;top:46%%;height:22px;width:0;background:%s;border-radius:11px"></span></span>') % (
        P['hueso'], P['cobalto'], T(1, 7.50), T(1, 7.85), P['tomate'])
    out.append(centro(tach, T(1, 7.40), T0[2], Y))
    ev.append(('tic', T(1, 7.50), 0.7))
    # 2. 66.
    out.append(rotulo('hay estudios que hablan de que hasta el día *66* el hábito no es creado', T(2, 0.60), T0[3],
                      [T(2, x) for x in (0.60, 0.80, 1.14, 1.28, 1.52, 1.72, 1.82, 2.00, 2.16, 2.40, 3.85, 4.40, 4.66, 4.80, 4.90)]))
    out.append(centro('<div style="text-align:center"><span class="bloque big" style="background:%s;color:%s;font-size:250px;line-height:.85">66</span>'
                      '<p class="lab" style="margin-top:20px;font-size:28px;white-space:nowrap;color:#fff;text-shadow:0 1px 10px rgba(0,0,0,.5)">días, de media · Lally et al. 2010</p></div>' % (P['cobalto'], P['rosa']),
                      T(2, 2.40), T0[3] - 0.05, 1060))
    ev.append(('golpe', T(2, 2.40), 0.55))
    # 3. ¿21? Déjame contarte.
    out.append(rotulo('pero entonces, ¿por qué se nombra tanto esos *21?*', T(3, 5.62), T(3, 8.35), [T(3, x) for x in (5.62, 5.88, 6.24, 6.52, 6.72, 6.82, 7.16, 7.48, 7.70)]))
    out.append(centro('<span class="bloque big" style="background:%s;color:%s;font-size:230px;line-height:.85">¿21?</span>' % (P['mantequilla'], P['bosque']), T(3, 7.70), T(3, 8.40), 1060))
    ev.append(('pop', T(3, 7.70), 0.55))
    out.append(rotulo('pues déjame *contarte*', T(3, 8.45), T0[4], [T(3, 8.45), T(3, 8.62), T(3, 8.86)]))
    # 4. Ocurre algo.
    out.append(rotulo('es verdad que en los *21* ocurre *algo*', T(4, 8.30), T0[5], [T(4, x) for x in (8.30, 8.38, 8.58, 8.66, 8.72, 8.82, 9.26, 10.14)]))
    # 5. Bloquear ese hábito: el candado se cierra justo en "bloquear".
    out.append(rotulo('los primeros *21 días* son para *bloquear* ese hábito', T(5, 0.0), T(5, 3.10), [T(5, x) for x in (0.0, 0.18, 0.60, 0.84, 1.08, 1.36, 1.68, 2.48, 2.66)]))
    out.append(centro(candado_cierra(T(5, 2.05), 150), T(5, 1.62), T(5, 3.10), 1230))
    ev.append(('candado', T(5, 2.05), 1.0))
    out.append(rotulo('y *no* dejarlo ir', T(5, 3.06), T0[6], [T(5, x) for x in (3.06, 3.38, 3.76, 4.24)]))
    # 6. Videowall: "...llegar a esos 21 días, hoy presento Lock21" -> logo.
    mid = TY0 + TH + TG + TH // 2
    base_rot = TY0 + 2 * (TH + TG) + TH - 120
    out.append(rotulo('llegar a esos *21 días*', T(6, 3.24), T(6, 5.6), [T(6, x) for x in (3.24, 3.56, 3.70, 3.80, 4.34)]).replace(
        'class="rotulo"', 'class="rotulo" style="top:%dpx;width:1000px;font-size:56px"' % base_rot, 1))
    out.append(rotulo('hoy presento', T(6, 5.75), T0[7], [T(6, 5.75), T(6, 5.92)]).replace(
        'class="rotulo"', 'class="rotulo" style="top:%dpx;width:1000px;font-size:56px"' % base_rot, 1))
    out.append(centro('<span class="bloque" style="background:%s;padding:28px 44px 34px;display:inline-block">%s</span>' % (P['rosa'], logo_marca(P['cobalto'], 150)),
                      T(6, 6.45), T0[7], mid))
    ev += [('golpe', T(6, 6.45), 0.7), ('candado', T(6, 6.45), 0.7)]

    # 7. Cómo funciona (mantequilla/bosque).
    a7, b7 = T0[7] - 0.25, T0[8] + 0.25
    t7 = T0[7]

    def paso(n, texto, t):
        return ('<div class="fd" data-a="%.3f" style="display:flex;gap:30px;align-items:baseline;margin-top:44px;border-top:3px solid currentColor;padding-top:26px">'
                '<span class="big" style="font-size:96px;min-width:150px">%s</span><span class="med" style="font-size:56px">%s</span></div>') % (t, n, texto)
    p7 = ('<div class="panel" data-a="%.3f" data-b="%.3f" style="background:%s;color:%s"><div class="lab" style="display:flex;justify-content:space-between;font-size:26px"><span>Lock21</span><span>Cómo funciona</span></div><div class="cont">'
          '<div style="margin-top:auto">%s</div>%s%s%s'
          '<div class="fd" data-a="%.3f" style="margin-top:50px;display:flex;align-items:center;gap:26px">%s<span class="txt" style="font-size:44px">Gratis. Sin apps que descargar.</span></div></div></div>') % (
        a7, b7, P['mantequilla'], P['bosque'],
        M('Así va|Lock21.', t7 + 0.05, 150),
        paso('01', 'Eliges un hábito y lo atas a algo que ya haces.', t7 + 0.9),
        paso('02', 'Cada día, un check-in de 1 minuto con tu coach IA.', t7 + 2.0),
        paso('03', 'Día 21: desbloqueado. Y eliges el siguiente.', t7 + 3.1),
        t7 + 4.1, candado(P['bosque'], 70, abierto=True))
    out.append(p7)
    ev += [('barrido', a7 + 0.2, 0.55), ('pop', t7 + 0.9, 0.5), ('pop', t7 + 2.0, 0.5), ('pop', t7 + 3.1, 0.5), ('desbloqueo', t7 + 3.1, 0.7), ('barrido', b7 - 0.05, 0.45)]

    # 8. Videowall: un hábito · 30 personas · gratis · 21 días.
    out.append(centro(candado_cierra(T(8, 0.35), 150), T(8, 0.0), T(8, 0.95), mid))
    ev.append(('candado', T(8, 0.35), 0.8))
    out.append(centro(dorsal(P['tomate'], P['hueso'], '30', 'Grupo 01', 'Plazas', ancho=440), T(8, 1.0), T0[9], TY0 + TH // 2 + 10))
    ev.append(('pop', T(8, 1.0), 0.6))
    out.append(rotulo('un *hábito* · 30 personas · *gratis* · 21 días', T(8, 0.05), T0[9], [T(8, x) for x in (0.05, 0.20, 0.50, 0.60, 0.80, 1.06, 1.40, 1.86, 2.18)]).replace(
        'class="rotulo"', 'class="rotulo" style="top:%dpx;width:1000px;font-size:56px"' % base_rot, 1))

    # 9. Cierre: la necesidad y la llamada.
    a9 = T0[9] - 0.25
    t9 = T0[9]
    p9 = ('<div class="panel" data-a="%.3f" data-b="%.3f" style="background:%s;color:%s"><div class="lab" style="display:flex;justify-content:space-between;font-size:26px"><span>Lock21</span><span>Salida 16·11</span></div><div class="cont">'
          '<div class="fd" data-pop="1" data-a="%.3f" style="margin-top:auto;margin-bottom:50px">%s</div>%s%s'
          '<div class="fd" data-a="%.3f" style="margin-top:44px"><span style="display:inline-flex;align-items:center;gap:16px;border-radius:999px;background:%s;color:%s;padding:24px 38px;font-size:42px;font-weight:750">Pide tu plaza: enlace en la bio</span></div></div></div>') % (
        a9, DUR + 1, P['cobalto'], P['rosa'], t9 + 0.05, logo_marca(P['rosa'], 120),
        M('¿Cuántos lunes|más vas a esperar?', t9 + 0.35, 120),
        M('Próximo grupo: lunes 16 nov.|Solo 30 plazas. Gratis.', t9 + 1.4, 54, paso=0.14, clase='med', estilo='margin-top:40px'),
        t9 + 2.3, P['rosa'], P['cobalto'])
    out.append(p9)
    ev += [('barrido', a9 + 0.2, 0.55), ('final', t9, 0.5), ('golpe', t9 + 0.35, 0.4), ('pop', t9 + 2.3, 0.55)]
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
    if not ((dest / 'base.mp4').exists() and (dest / 'capa').exists() and len(list((dest / 'capa').glob('*.png'))) == sum(NF)):
        cortar_video(dest)
        renderizar_capa(html, dest)
    v = voz(dest)
    ev = ev + [('golpe', T(i, a), 0.3) for (i, a, b) in CLAVES]
    eventos = [{'tipo': t, 't': max(0.0, round(x, 3)), 'g': g} for (t, x, g) in ev] + [{'tipo': 'candado', 't': -10, 'g': 0}]
    mus = audio.componer_eventos(DUR, eventos)[:len(v)]
    env = np.full(len(mus), 0.14)
    for i, s in enumerate(GUION):
        if s[0] is None:
            env[int(T0[i] * SR):int((T0[i] + NF[i] / FPS) * SR)] = 0.7
    env = audio.lp(env, 5)
    mezcla = v[:len(mus)] + mus * env
    mezcla *= 0.92 / (np.max(np.abs(mezcla)) + 1e-9)
    # Sonoridad final ~ -14 LUFS con ganancia lineal (sin compresión que bombee la voz).
    audio.guardar_wav(str(dest / 'mezcla.wav'), mezcla)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(dest / 'mezcla.wav'), '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    lufs = float([l for l in r.splitlines() if l.strip().startswith('I:')][-1].split()[1])
    ganancia_db = -14.0 - lufs
    (dest / 'guion.json').write_text(json.dumps({'T0': T0, 'NF': NF, 'DUR': DUR, 'eventos': eventos}, indent=1))
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(dest / 'base.mp4'), '-framerate', str(FPS), '-i', str(dest / 'capa' / '%05d.png'), '-i', str(dest / 'mezcla.wav'),
                    '-filter_complex', '[0:v][1:v]overlay=0:0:format=auto,format=yuv420p[v];[2:a]volume=%.2fdB,alimiter=limit=0.89:attack=4:release=60:level=false[a]' % ganancia_db + '', '-map', '[v]', '-map', '[a]',
                    '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-r', str(FPS), '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart',
                    '-t', '%.3f' % DUR, str(dest / 'reel.mp4')], check=True)
    print('ok', dest / 'reel.mp4', DUR)


if __name__ == '__main__':
    main(sys.argv[1])
