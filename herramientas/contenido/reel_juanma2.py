"""Reel "21 no, 66" v2: mezcla de los 3 clips de Juanma con guion, cortes limpios y grafismos de la identidad 2.

Cambios respecto a v1 (feedback de Juanma): usa los 3 vídeos, sin eco, sin zooms a saltos ni recortes de pausas
que aceleren el habla, cortes exactos por fotograma (vídeo y audio con la misma duración), ~28 s.
Uso: python3 reel_juanma2.py <carpeta_salida>
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
C55 = UP / 'DJI_20261025180707_0055_D.MP4'   # caminando: "Hay estudios... ¿por qué esos 21? Déjame contarte."
C89 = UP / 'DJI_20261025182229_0089_D.MP4'   # bajo el árbol: "21 días... no son 21, necesitas 66... en los 21 ocurre algo"
C86 = UP / 'DJI_20261025181827_0086_D.MP4'   # plano corto horizontal: "30 personas gratis durante 21 días"
W, H, FPS, SR = 1080, 1920, 30, 48000

# Guion: (clip, desde, hasta, centro_x, horizontal)
GUION = [
    (C89, 0.00, 3.55, .5, False),   # 1. 21 días, esos son los que te han dicho que tardas en hacer un hábito,
    (C89, 3.58, 6.05, .5, False),   # 2. pero déjame decirte que no son 21.
    (C55, 0.50, 5.47, .5, False),   # 3. Hay estudios que hablan de que hasta el día 66 el hábito no es creado.
    (C55, 5.52, 9.45, .5, False),   # 4. Pero entonces, ¿por qué se nombra tanto esos 21? Déjame contarte.
    (C89, 8.27, 10.47, .5, False),  # 5. Es verdad que en los 21 ocurre algo.
    (None, 0, 4.30, .5, False),     # 6. Explicación: le echas el candado.
    (C86, 0.40, 2.93, .47, True),   # 7. 30 personas, gratis, durante 21 días.
    (None, 0, 3.20, .5, False),     # 8. Cierre.
]
NF = [int(round((b - a) * FPS)) for (_, a, b, _, _) in GUION]   # fotogramas exactos por plano
T0 = [sum(NF[:i]) / FPS for i in range(len(GUION))]
DUR = sum(NF) / FPS


def T(i, t_src):
    return round(T0[i] + (t_src - GUION[i][1]), 3)


def cortar_video(dest):
    partes = []
    for i, (clip, a, b, cx, horiz) in enumerate(GUION):
        out = dest / ('v%02d.mp4' % i)
        if clip is None:
            cmd = ['ffmpeg', '-y', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=0x2433D9:s=%dx%d:r=%d' % (W, H, FPS)]
        else:
            if horiz:
                crop = 'crop=ih*9/16:ih:(iw*%.3f-ih*9/32):0' % cx
            else:
                crop = 'crop=iw:ih:0:0'
            vf = 'fps=%d,%s,scale=%d:%d:flags=lanczos,eq=contrast=1.04:saturation=1.05,format=yuv420p' % (FPS, crop, W, H)
            cmd = ['ffmpeg', '-y', '-v', 'error', '-ss', '%.3f' % a, '-i', str(clip), '-map', '0:v:0', '-vf', vf]
        cmd += ['-frames:v', str(NF[i]), '-an', '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-r', str(FPS), '-pix_fmt', 'yuv420p', str(out)]
        subprocess.run(cmd, check=True)
        partes.append(out)
    (dest / 'lista.txt').write_text(''.join("file '%s'\n" % p.name for p in partes))
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', str(dest / 'lista.txt'), '-c', 'copy', str(dest / 'base.mp4')], check=True)


def audio_clip(clip, dest):
    tmp = dest / (clip.stem + '_voz.wav')
    if not tmp.exists():
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(clip), '-vn', '-ac', '1', '-ar', str(SR),
                        '-af', 'highpass=f=80,afftdn=nf=-28,acompressor=threshold=-22dB:ratio=2.5:attack=8:release=150', str(tmp)], check=True)
    sr, x = wavfile.read(str(tmp))
    return x.astype(np.float64) / 32768


def voz(dest):
    n = int(round(DUR * SR))
    v = np.zeros(n + SR)
    for i, (clip, a, b, cx, horiz) in enumerate(GUION):
        if clip is None:
            continue
        x = audio_clip(clip, dest)
        largo = int(round(NF[i] / FPS * SR))
        seg = x[int(round(a * SR)):int(round(a * SR)) + largo].copy()
        # Mismo nivel para todos los planos (RMS de las partes con voz).
        voz_ = seg[np.abs(seg) > 0.02]
        rms = np.sqrt(np.mean(voz_ ** 2)) if len(voz_) else 0.1
        seg *= 0.12 / (rms + 1e-9)
        f = int(0.015 * SR)
        seg[:f] *= np.linspace(0, 1, f)
        seg[-f:] *= np.linspace(1, 0, f)
        j = int(round(T0[i] * SR))
        v[j:j + len(seg)] += seg
    return np.clip(v[:n], -1, 1)


def capa():
    out, ev = [], []
    marca = '<div class="marca-sup lab" data-v="fijo" data-a="%.3f" data-b="%.3f" style="font-size:24px">%s<span>Lock21 · Reto de 21 días</span></div>'
    out.append(marca % (0, T0[5], candado('#fff', 30)))
    out.append(marca % (T0[6], T0[7], candado('#fff', 30)))

    # 1. Gancho.
    out.append(centro('<span class="bloque big" style="background:%s;color:%s;font-size:190px;white-space:nowrap">21 días</span>' % (P['rosa'], P['cobalto']), 0.0, 1.0, 1110))
    ev.append(('golpe', 0.02, 0.5))
    out.append(rotulo('es lo que te han dicho que tardas en hacer un *hábito*', 0.98, T0[1], [0.98, 1.12, 1.28, 1.48, 1.60, 1.66, 1.96, 2.16, 2.60, 2.74, 2.96, 3.10]))
    # 2. No son 21 (21 tachado).
    out.append(rotulo('pero déjame decirte que *no* son 21', T(1, 3.66), T0[2], [T(1, x) for x in (3.66, 3.76, 4.04, 4.54, 4.86, 5.04, 5.34)]))
    tach = ('<span class="bloque big" style="position:relative;background:%s;color:%s;font-size:250px;line-height:.85">21'
            '<span class="tachar" data-t="%.3f,%.3f" style="position:absolute;left:-5%%;top:46%%;height:22px;width:0;background:%s;border-radius:11px"></span></span>') % (
        P['hueso'], P['cobalto'], T(1, 5.45), T(1, 5.8), P['tomate'])
    out.append(centro(tach, T(1, 5.30), T0[2], 1120))
    ev.append(('tic', T(1, 5.45), 0.7))
    # 3. Hay estudios... día 66.
    out.append(rotulo('hay estudios que hablan de que hasta el día *66* el hábito no es creado', T(2, 0.60), T0[3],
                      [T(2, x) for x in (0.60, 0.80, 1.14, 1.28, 1.52, 1.72, 1.82, 2.00, 2.16, 2.40, 3.85, 4.40, 4.66, 4.80, 4.90)]))
    out.append(centro('<div style="text-align:center"><span class="bloque big" style="background:%s;color:%s;font-size:250px;line-height:.85">66</span>'
                      '<p class="lab" style="margin-top:20px;font-size:28px;white-space:nowrap;color:#fff;text-shadow:0 1px 10px rgba(0,0,0,.5)">días, de media · Lally et al. 2010</p></div>' % (P['cobalto'], P['rosa']),
                      T(2, 2.40), T0[3] - 0.05, 1060))
    ev.append(('golpe', T(2, 2.40), 0.6))
    # 4. ¿Por qué esos 21? Déjame contarte.
    out.append(rotulo('pero entonces, ¿por qué se nombra tanto esos *21?*', T(3, 5.62), T(3, 8.35),
                      [T(3, x) for x in (5.62, 5.88, 6.24, 6.52, 6.72, 6.82, 7.16, 7.48, 7.70)]))
    out.append(centro('<span class="bloque big" style="background:%s;color:%s;font-size:230px;line-height:.85">¿21?</span>' % (P['mantequilla'], P['bosque']),
                      T(3, 7.70), T(3, 8.40), 1060))
    ev.append(('pop', T(3, 7.70), 0.6))
    out.append(rotulo('Déjame *contarte*.', T(3, 8.48), T0[4], [T(3, 8.48), T(3, 8.82)]))
    # 5. En los 21 ocurre algo.
    out.append(rotulo('es verdad que en los *21* ocurre *algo*', T(4, 8.30), T0[5], [T(4, x) for x in (8.30, 8.38, 8.58, 8.66, 8.72, 8.82, 9.26, 10.14)]))
    out.append(centro('<span class="bloque" style="background:%s;padding:30px 40px;display:inline-block">%s</span>' % (P['mantequilla'], candado(P['bosque'], 120)),
                      T(4, 9.40), T0[5], 1110))
    ev.append(('pop', T(4, 9.40), 0.6))

    # 6. Explicación a pantalla completa.
    a6, b6 = T0[5] - 0.25, T0[6] + 0.25
    cierre = T0[5] + 1.0
    p6 = ('<div class="panel" data-a="%.3f" data-b="%.3f" style="background:%s;color:%s"><div class="lab" style="display:flex;justify-content:space-between;font-size:26px"><span>Lock21</span><span>Día 21</span></div><div class="cont">'
          '<div class="fd" data-a="%.3f" style="margin-top:auto;margin-bottom:56px">%s</div>%s%s'
          '<div class="fd" data-a="%.3f" style="margin-top:46px">%s</div>%s</div></div>') % (
        a6, b6, P['rosa'], P['cobalto'], T0[5] - 0.05,
        candado(P['cobalto'], 210, clase='candado').replace('<svg class="candado"', '<svg class="candado" data-inicio="abierto" data-cerrar="%.3f"' % cierre, 1),
        M('En 21 días', T0[5] + 0.1, 150), M('le echas el candado|a tu hábito.', T0[5] + 0.45, 110),
        T0[5] + 1.6, linea(P['cobalto'], 1, 888).replace('class="linea "', 'class="linea" data-anim="%.3f,%.3f,1,21"' % (T0[5] + 1.7, T0[5] + 3.3), 1),
        M('Lo difícil es no soltarlo al principio.|Ahí es donde casi todos lo dejamos.', T0[5] + 2.0, 50, paso=0.14, clase='txt', estilo='margin-top:30px'))
    out.append(p6)
    ev += [('barrido', a6 + 0.2, 0.55), ('candado', cierre, 1.0), ('barrido', b6 - 0.05, 0.45)]
    for k in range(21):
        ev.append(('tic', T0[5] + 1.7 + 1.6 * k / 20.0, 0.16))

    # 7. 30 personas, gratis, durante 21 días.
    out.append(centro(dorsal(P['tomate'], P['hueso'], '30', 'Grupo 01', 'Plazas', ancho=480), T(6, 0.50), T0[7], 450))
    ev.append(('pop', T(6, 0.50), 0.6))
    out.append(rotulo('30 personas · *gratis* · 21 días', T(6, 0.45), T0[7], [T(6, x) for x in (0.50, 0.75, 1.0, 1.40, 1.75, 2.05, 2.45)]).replace(
        'class="rotulo"', 'class="rotulo" style="top:1470px;width:1000px;font-size:58px"', 1))

    # 8. Cierre.
    a8 = T0[7] - 0.25
    p8 = ('<div class="panel" data-a="%.3f" data-b="%.3f" style="background:%s;color:%s"><div class="lab" style="display:flex;justify-content:space-between;font-size:26px"><span>Lock21</span><span>Salida</span></div><div class="cont">'
          '<div class="fd" data-pop="1" data-a="%.3f" style="margin:auto 0 56px">%s</div>%s'
          '<div class="fd" data-a="%.3f" style="margin-top:30px"><p class="txt" style="font-size:46px">Gratis. 30 plazas. Enlace en la bio.</p></div></div></div>') % (
        a8, DUR + 1, P['cobalto'], P['rosa'], T0[7] + 0.05, insignia(P['rosa'], P['cobalto'], 470, uid='rj'),
        M('Próximo grupo:|lunes 16 nov.', T0[7] + 0.45, 128), T0[7] + 1.2)
    out.append(p8)
    ev += [('barrido', a8 + 0.2, 0.55), ('candado', T0[7] + 0.1, 0.8), ('final', T0[7], 0.5), ('pop', T0[7] + 1.2, 0.45)]
    return '<div class="capa">%s</div>' % ''.join(out), ev


def renderizar_capa(html, dest):
    fr = dest / 'capa'
    fr.mkdir(parents=True, exist_ok=True)
    f = dest / 'capa.html'
    f.write_text('<!doctype html><html lang="es"><head><meta charset="utf-8"><style>%s %s</style></head><body>%s<script>%s</script></body></html>' % (CSS, CSS_O, html, JS), encoding='utf-8')
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
    cortar_video(dest)
    html, ev = capa()
    renderizar_capa(html, dest)
    v = voz(dest)
    eventos = [{'tipo': t, 't': max(0.0, round(x, 3)), 'g': g} for (t, x, g) in ev] + [{'tipo': 'candado', 't': -10, 'g': 0}]
    mus = audio.componer_eventos(DUR, eventos)[:len(v)]
    env = np.full(len(mus), 0.14)
    for i, s in enumerate(GUION):
        if s[0] is None:
            env[int(T0[i] * SR):int((T0[i] + NF[i] / FPS) * SR)] = 0.7
    env = audio.lp(env, 5)
    mezcla = v[:len(mus)] + mus * env
    mezcla *= 0.92 / (np.max(np.abs(mezcla)) + 1e-9)
    audio.guardar_wav(str(dest / 'mezcla.wav'), mezcla)
    (dest / 'guion.json').write_text(json.dumps({'T0': T0, 'NF': NF, 'DUR': DUR, 'eventos': eventos}, indent=1))
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(dest / 'base.mp4'), '-framerate', str(FPS), '-i', str(dest / 'capa' / '%05d.png'), '-i', str(dest / 'mezcla.wav'),
                    '-filter_complex', '[0:v][1:v]overlay=0:0:format=auto,format=yuv420p[v];[2:a]loudnorm=I=-14:TP=-1.0:LRA=9[a]', '-map', '[v]', '-map', '[a]',
                    '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-r', str(FPS), '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart',
                    '-t', '%.3f' % DUR, str(dest / 'reel.mp4')], check=True)
    print('ok', dest / 'reel.mp4', DUR)


if __name__ == '__main__':
    main(sys.argv[1])
