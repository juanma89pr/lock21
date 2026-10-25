"""Reel con vídeo de Juanma + grafismos de la identidad 2 (25 oct 2026, "21 no, 66").

Montaje: relato de Juanma (clips 0089 y 0086) con rótulos y grafismos en el centro, palabras clave con eco,
explicación animada a pantalla completa (el candado) y cierre con el próximo grupo.
Uso: python3 reel_juanma.py <carpeta_salida>
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

UP = Path('/mnt/user-data/uploads')
C89 = UP / 'DJI_20261025182229_0089_D.MP4'
C86 = UP / 'DJI_20261025181827_0086_D.MP4'
W, H, FPS = 1080, 1920, 30
SR = 48000

# Segmentos de vídeo: (clip, desde, hasta, zoom, centro_x relativo, horizontal)
SEG = [
    (C89, 0.00, 3.56, 1.00, .5, False),   # 21 días, esos son los que te han dicho que tardas en hacer un hábito
    (C89, 3.56, 6.16, 1.12, .5, False),   # pero déjame decirte que no son 21
    (C89, 6.16, 7.56, 1.26, .5, False),   # necesitas 66
    (C89, 8.02, 10.44, 1.06, .5, False),  # pero es verdad que en los 21 ocurre algo
    (None, 0, 4.00, 1, .5, False),        # explicación animada
    (C86, 0.22, 2.92, 1.00, .47, True),   # 30 personas, gratis, durante 21 días
    (None, 0, 3.00, 1, .5, False),        # cierre
]
T0 = []
_t = 0.0
for s in SEG:
    T0.append(_t)
    _t += s[2] - s[1]
DUR = round(_t, 3)


def T(seg, t_src):
    """Tiempo en el reel de un instante del clip dentro del segmento seg."""
    return round(T0[seg] + (t_src - SEG[seg][1]), 3)


def cortar_video(dest):
    partes = []
    for i, (clip, a, b, z, cx, horiz) in enumerate(SEG):
        out = dest / ('v%02d.mp4' % i)
        d = b - a
        if clip is None:
            cmd = ['ffmpeg', '-y', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=0x2433D9:s=%dx%d:r=%d:d=%.3f' % (W, H, FPS, d)]
        else:
            if horiz:
                crop = 'crop=ih*9/16/%.3f:ih/%.3f:(iw*%.3f-ih*9/32/%.3f):(ih-ih/%.3f)/2' % (z, z, cx, z, z)
            else:
                crop = 'crop=iw/%.3f:ih/%.3f:(iw-iw/%.3f)*%.3f:(ih-ih/%.3f)*0.42' % (z, z, z, cx, z)
            vf = crop + ',scale=%d:%d:flags=lanczos,fps=%d,eq=contrast=1.04:saturation=1.06,format=yuv420p' % (W, H, FPS)
            cmd = ['ffmpeg', '-y', '-v', 'error', '-ss', '%.3f' % a, '-t', '%.3f' % d, '-i', str(clip), '-map', '0:v:0', '-vf', vf]
        cmd += ['-an', '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-pix_fmt', 'yuv420p', str(out)]
        subprocess.run(cmd, check=True)
        partes.append(out)
    lista = dest / 'lista.txt'
    lista.write_text(''.join("file '%s'\n" % p.name for p in partes))
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', str(lista), '-c', 'copy', str(dest / 'base.mp4')], check=True)


def leer_audio(clip):
    tmp = Path('/tmp/claude-0/-home-claude/298f2e82-10b6-5108-9045-68b2d451c2c3/scratchpad/asr') / (clip.stem + '_48k.wav')
    if not tmp.exists():
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(clip), '-vn', '-ac', '1', '-ar', str(SR),
                        '-af', 'highpass=f=85,lowpass=f=12000,afftdn=nf=-25,acompressor=threshold=-20dB:ratio=3:attack=5:release=120', str(tmp)], check=True)
    sr, x = wavfile.read(str(tmp))
    return x.astype(np.float64) / 32768


def voz(ecos):
    n = int(DUR * SR) + SR
    v = np.zeros(n)
    for i, (clip, a, b, z, cx, horiz) in enumerate(SEG):
        if clip is None:
            continue
        x = leer_audio(clip)[int(a * SR):int(b * SR)]
        f = int(0.012 * SR)
        x[:f] *= np.linspace(0, 1, f)
        x[-f:] *= np.linspace(1, 0, f)
        j = int(T0[i] * SR)
        v[j:j + len(x)] += x
    # Eco en palabras clave: copias retrasadas y más apagadas de la palabra.
    for (t1, t2) in ecos:
        pal = v[int(t1 * SR):int(t2 * SR)].copy()
        for k, (d, g) in enumerate(((0.16, 0.42), (0.32, 0.24), (0.48, 0.12))):
            j = int((t1 + d) * SR)
            seg = audio.lp(pal, 5200 - 1200 * k) * g
            v[j:j + len(seg)] += seg[:max(0, n - j)]
    # Normalizar la voz (pico) — la sonoridad final se ajusta en la mezcla.
    v /= (np.max(np.abs(v)) + 1e-9)
    return v[:int(DUR * SR)] * 0.9


# ------------------------------------------------------------------------------------------
# Rótulos y grafismos (capa transparente)

JS = r"""
function cl(x){return Math.max(0,Math.min(1,x));}
function eo(x){x=cl(x);return 1-Math.pow(1-x,4);}
function eio(x){x=cl(x);return x<.5?8*x*x*x*x:1-Math.pow(-2*x+2,4)/2;}
function sp(x){x=cl(x);return 1-Math.exp(-7*x)*Math.cos(10*x);}
function pinta(t){
  document.querySelectorAll('[data-v]').forEach(function(e){
    var a=+e.dataset.a,b=+e.dataset.b,ent=e.dataset.v,on=t>=a-0.001&&t<b; e.style.display=on?'':'none'; if(!on) return;
    var k=eo((t-a)/0.32), ks=cl((b-t)/0.18);
    if(ent==='pop'){ e.style.opacity=Math.min(cl((t-a)/0.08),ks*1.2); e.style.transform='translate(-50%,-50%) scale('+(0.6+0.4*sp((t-a)/0.5))+')'; }
    else if(ent==='sube'){ e.style.opacity=Math.min(k,ks*1.2); e.style.transform='translate(-50%,'+((1-k)*40)+'px)'; }
    else if(ent==='fijo'){ e.style.opacity=Math.min(cl((t-a)/0.12),ks*1.2); }
  });
  document.querySelectorAll('.pal').forEach(function(w){ var a=+w.dataset.a; var k=eo((t-a)/0.22); w.style.opacity=k; w.style.transform='translateY('+((1-k)*14)+'px)'; });
  document.querySelectorAll('.tachar').forEach(function(e){ var v=e.dataset.t.split(','); e.style.width=(eio((t-v[0])/(v[1]-v[0]))*110)+'%'; });
  document.querySelectorAll('.panel').forEach(function(p){
    var a=+p.dataset.a,b=+p.dataset.b,on=t>=a&&t<b; p.style.display=on?'flex':'none'; if(!on) return;
    var ki=eio((t-a)/0.3), ko=eio((t-(b-0.3))/0.3);
    p.style.transform='translateY('+(((1-ki)*100)-(ko*100))+'%)';
    var c=p.querySelector('.cont'); if(c){ c.style.transform='translateY('+(((1-ki)*-30)+(ko*30))+'%)'; }
  });
  document.querySelectorAll('.m > span').forEach(function(s){ var k=eo((t-(+s.dataset.a))/0.5); s.style.transform='translateY('+((1-k)*108)+'%)'; });
  document.querySelectorAll('.fd').forEach(function(s){ var a=+s.dataset.a; var k=eo((t-a)/0.45); s.style.opacity=k; s.style.transform='scale('+(s.dataset.pop?0.9+0.1*sp((t-a)/0.6):1)+') translateY('+((1-k)*20)+'px)'; });
  document.querySelectorAll('svg.candado').forEach(function(c){
    var arco=c.querySelector('.arco'), tc=c.dataset.cerrar?+c.dataset.cerrar:null, k=c.dataset.inicio==='abierto'?1:0, bob=0;
    if(tc!==null){ if(t>=tc-0.22){ k=1-eio((t-(tc-0.22))/0.22); } if(t>=tc){ k=0; bob=Math.sin(cl((t-tc)/0.2)*Math.PI)*3; } }
    arco.setAttribute('transform','translate(0 '+(-12*k+bob*.5).toFixed(2)+') rotate('+(-22*k).toFixed(2)+' 26 40)');
    c.querySelector('.cuerpo').setAttribute('transform','translate(0 '+bob.toFixed(2)+')');
  });
  document.querySelectorAll('.linea[data-anim]').forEach(function(l){
    var v=l.dataset.anim.split(','), d=+v[2]+(+v[3]-v[2])*eio((t-v[0])/(v[1]-v[0])), pos=(d-1)/20*100;
    l.querySelector('.lleno').style.width=pos+'%'; l.querySelector('.punto').style.left=pos+'%';
  });
}
"""

CSS_O = """
html,body{background:transparent !important}
.capa{position:relative;width:1080px;height:1920px;overflow:hidden}
.abs{position:absolute;left:50%}
.rotulo{position:absolute;left:50%;top:1400px;width:920px;text-align:center;font-weight:700;letter-spacing:-.03em;font-stretch:92%;font-size:64px;line-height:1.05;color:#fff;
  text-shadow:0 2px 18px rgba(0,0,0,.45),0 1px 3px rgba(0,0,0,.4)}
.pal{display:inline-block}
.clave{color:#F2E6A2}
.bloque{display:inline-block;padding:18px 34px 26px;border-radius:14px}
.panel{position:absolute;inset:0;flex-direction:column;padding:250px 96px 300px}
.panel .cont{display:flex;flex-direction:column;flex:1}
.m{display:block;overflow:hidden;padding-bottom:.08em;margin-bottom:-.08em}.m>span{display:inline-block}
.fd{opacity:0}
.marca-sup{position:absolute;top:150px;left:60px;display:flex;align-items:center;gap:14px;color:#fff;text-shadow:0 1px 10px rgba(0,0,0,.35)}
"""


def rotulo(texto, a, b, palabras):
    """texto con palabras; palabras = lista de tiempos de aparición por palabra. *x* = palabra clave."""
    ws = texto.split(' ')
    spans = []
    for w, t in zip(ws, palabras):
        clave = w.startswith('*')
        w = w.strip('*')
        spans.append('<span class="pal%s" data-a="%.3f">%s</span>' % (' clave' if clave else '', t, w))
    return '<div class="rotulo" data-v="sube" data-a="%.3f" data-b="%.3f">%s</div>' % (a, b, ' '.join(spans))


def centro(html, a, b, top=820, v='pop'):
    return '<div class="abs" data-v="%s" data-a="%.3f" data-b="%.3f" style="top:%dpx">%s</div>' % (v, a, b, top, html)


def M(texto, a, size, paso=0.09, clase='big', estilo=''):
    return '<div class="%s" style="font-size:%dpx;%s">%s</div>' % (clase, size, estilo, ''.join(
        '<span class="m"><span data-a="%.3f">%s</span></span>' % (a + i * paso, l) for i, l in enumerate(texto.split('|'))))


def capa():
    out = []
    ev = []
    # Marca discreta arriba durante el vídeo.
    out.append('<div class="marca-sup lab" data-v="fijo" data-a="0" data-b="%.3f" style="font-size:24px">%s<span>Lock21 · Reto de 21 días</span></div>' % (T0[4], candado('#fff', 30)))
    out.append('<div class="marca-sup lab" data-v="fijo" data-a="%.3f" data-b="%.3f" style="font-size:24px">%s<span>Lock21 · Reto de 21 días</span></div>' % (T0[5], T0[6], candado('#fff', 30)))

    # 1) "21 días" (eco) — gran rótulo central.
    out.append(centro('<span class="bloque big" style="background:%s;color:%s;font-size:190px;white-space:nowrap">21 días</span>' % (P['rosa'], P['cobalto']), 0.0, 0.95, 1110))
    ev.append(('golpe', 0.0, 0.6))
    out.append(rotulo('es lo que te han dicho que tardas en hacer un *hábito*', 0.98, T(0, 3.56),
                      [0.98, 1.12, 1.28, 1.48, 1.60, 1.66, 1.96, 2.16, 2.60, 2.74, 2.96, 3.10]))
    # 2) "pero déjame decirte que no son 21" — 21 tachado en el centro.
    out.append(rotulo('pero déjame decirte que *no* son 21', T(1, 3.66), T(1, 6.16),
                      [T(1, x) for x in (3.66, 3.76, 4.04, 4.54, 4.86, 5.04, 5.34)]))
    tach = ('<span class="bloque big" style="position:relative;background:%s;color:%s;font-size:260px;line-height:.85">21'
            '<span class="tachar" data-t="%.3f,%.3f" style="position:absolute;left:-5%%;top:46%%;height:22px;width:0;background:%s;border-radius:11px"></span></span>') % (
        P['hueso'], P['cobalto'], T(1, 5.40), T(1, 5.75), P['tomate'])
    out.append(centro(tach, T(1, 5.30), T(1, 6.16), 1120))
    ev.append(('tic', T(1, 5.40), 0.8))
    # 3) "necesitas 66" (eco) — 66 en el centro.
    out.append(centro('<div style="text-align:center"><span class="bloque big" style="background:%s;color:%s;font-size:250px;line-height:.85">66</span>'
                      '<p class="lab" style="margin-top:22px;font-size:28px;white-space:nowrap;color:#fff;text-shadow:0 1px 10px rgba(0,0,0,.5)">días, de media · Lally et al. 2010</p></div>' % (P['cobalto'], P['rosa']),
                      T(2, 6.86), T(2, 7.56), 1130))
    ev.append(('golpe', T(2, 6.86), 0.8))
    out.append(rotulo('necesitas *66*', T(2, 6.26), T(2, 7.56), [T(2, 6.26), T(2, 6.88)]))
    # 4) "pero es verdad que en los 21 ocurre algo" — candado pequeño.
    out.append(rotulo('pero es verdad que en los *21* ocurre *algo*', T(3, 8.08), T(3, 10.44),
                      [T(3, x) for x in (8.08, 8.30, 8.38, 8.58, 8.66, 8.72, 8.82, 9.26, 10.14)]))
    out.append(centro('<span class="bloque" style="background:%s;padding:30px 40px;display:inline-block">%s</span>' % (P['mantequilla'], candado(P['bosque'], 120)),
                      T(3, 9.30), T(3, 10.44), 1110))
    ev.append(('pop', T(3, 9.30), 0.7))

    # 5) Explicación a pantalla completa (rosa): el candado se cierra; la línea avanza.
    a5, b5 = T0[4] - 0.25, T0[5] + 0.25
    cierre = T0[4] + 0.95
    p5 = ('<div class="panel" data-a="%.3f" data-b="%.3f" style="background:%s;color:%s"><div class="lab" style="display:flex;justify-content:space-between;font-size:26px"><span>Lock21</span><span>Día 21</span></div><div class="cont">'
          '<div class="fd" data-a="%.3f" style="margin-top:auto;margin-bottom:56px">%s</div>%s%s'
          '<div class="fd" data-a="%.3f" style="margin-top:46px">%s</div>%s</div></div>') % (
        a5, b5, P['rosa'], P['cobalto'], T0[4] - 0.05,
        candado(P['cobalto'], 210, clase='candado').replace('<svg class="candado"', '<svg class="candado" data-inicio="abierto" data-cerrar="%.3f"' % cierre, 1),
        M('En 21 días', T0[4] + 0.1, 150), M('le echas el candado.', T0[4] + 0.45, 120),
        T0[4] + 1.6, linea(P['cobalto'], 1, 888).replace('class="linea "', 'class="linea" data-anim="%.3f,%.3f,1,21"' % (T0[4] + 1.7, T0[4] + 3.3), 1),
        M('Lo difícil es no soltarlo al principio.|Ahí lo dejamos casi todos.', T0[4] + 2.0, 50, paso=0.12, clase='txt', estilo='margin-top:30px'))
    out.append(p5)
    ev += [('barrido', a5 + 0.2, 0.6), ('candado', cierre, 1.0), ('barrido', b5 - 0.05, 0.5)]
    for i in range(21):
        ev.append(('tic', T0[4] + 1.7 + 1.6 * i / 20.0, 0.18))

    # 6) "30 personas, gratis, durante 21 días" (eco en gratis) — dorsal 30.
    out.append(centro(dorsal(P['tomate'], P['hueso'], '30', 'Grupo 01', 'Plazas', ancho=480), T(5, 0.40), T(5, 2.92), 450))
    ev.append(('pop', T(5, 0.40), 0.7))
    out.append(rotulo('30 personas *gratis* durante 21 días', T(5, 0.28), T(5, 2.92), [T(5, x) for x in (0.28, 0.62, 1.06, 1.86, 2.18, 2.60)]).replace('class="rotulo"', 'class="rotulo" style="top:1470px;width:1000px;font-size:58px"', 1))

    # 7) Cierre (cobalto): insignia + próximo grupo + enlace.
    a7 = T0[6] - 0.25
    p7 = ('<div class="panel" data-a="%.3f" data-b="%.3f" style="background:%s;color:%s"><div class="lab" style="display:flex;justify-content:space-between;font-size:26px"><span>Lock21</span><span>Salida</span></div><div class="cont">'
          '<div class="fd" data-pop="1" data-a="%.3f" style="margin:auto 0 56px">%s</div>%s'
          '<div class="fd" data-a="%.3f" style="margin-top:30px"><p class="txt" style="font-size:46px">Gratis. 30 plazas. Enlace en la bio.</p></div></div></div>') % (
        a7, DUR + 1, P['cobalto'], P['rosa'], T0[6] + 0.05, insignia(P['rosa'], P['cobalto'], 470, uid='rj'),
        M('Próximo grupo:|lunes 16 nov.', T0[6] + 0.45, 128), T0[6] + 1.2)
    out.append(p7)
    ev += [('barrido', a7 + 0.2, 0.6), ('candado', T0[6] + 0.1, 0.8), ('final', T0[6], 0.6), ('pop', T0[6] + 1.2, 0.5)]
    return '<div class="capa">%s</div>' % ''.join(out), ev


def renderizar_capa(html, dest):
    fr = dest / 'capa'
    fr.mkdir(parents=True, exist_ok=True)
    pagina = '<!doctype html><html lang="es"><head><meta charset="utf-8"><style>%s %s</style></head><body>%s<script>%s</script></body></html>' % (CSS, CSS_O, html, JS)
    f = dest / 'capa.html'
    f.write_text(pagina, encoding='utf-8')
    with sync_playwright() as pw:
        br = pw.chromium.launch()
        pg = br.new_page(viewport={'width': W, 'height': H})
        pg.goto(f.as_uri())
        pg.evaluate('document.fonts.ready')
        pg.wait_for_timeout(200)
        for i in range(int(round(DUR * FPS))):
            pg.evaluate('pinta(%f)' % (i / FPS))
            pg.screenshot(path=str(fr / ('%05d.png' % i)), omit_background=True, clip={'x': 0, 'y': 0, 'width': W, 'height': H})
        br.close()


def main(dest):
    dest = Path(dest)
    dest.mkdir(parents=True, exist_ok=True)
    cortar_video(dest)
    html, ev = capa()
    renderizar_capa(html, dest)
    # Voz con eco en "21 días", "66" y "gratis".
    ecos = [(0.0, 0.68), (T(2, 6.88), T(2, 7.48)), (T(5, 1.06), T(5, 1.60))]
    v = voz(ecos)
    # Música de marca, baja bajo la voz y más presente en los grafismos.
    eventos = [{'tipo': t, 't': max(0.0, round(x, 3)), 'g': g} for (t, x, g) in ev]
    eventos.append({'tipo': 'candado', 't': -10, 'g': 0})  # sin intro de pisadas: el ritmo entra desde el principio
    mus = audio.componer_eventos(DUR, eventos)
    env = np.full(len(mus), 0.20)
    for i, s in enumerate(SEG):
        if s[0] is None:
            a, b = int(T0[i] * SR), int((T0[i] + s[2] - s[1]) * SR)
            env[a:b] = 0.75
    env = audio.lp(env, 6)
    mezcla = v[:len(mus)] + mus * env
    mezcla *= 0.92 / (np.max(np.abs(mezcla)) + 1e-9)
    audio.guardar_wav(str(dest / 'mezcla.wav'), mezcla)
    (dest / 'eventos.json').write_text(json.dumps(eventos, indent=1))
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(dest / 'base.mp4'), '-framerate', str(FPS), '-i', str(dest / 'capa' / '%05d.png'), '-i', str(dest / 'mezcla.wav'),
                    '-filter_complex', '[0:v][1:v]overlay=0:0:format=auto,format=yuv420p[v];[2:a]loudnorm=I=-14:TP=-1.0:LRA=9[a]', '-map', '[v]', '-map', '[a]',
                    '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-r', str(FPS), '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart',
                    '-t', '%.3f' % DUR, str(dest / 'reel.mp4')], check=True)
    print('ok', dest / 'reel.mp4', DUR)


if __name__ == '__main__':
    main(sys.argv[1])
