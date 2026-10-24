# Motor de reels dinámicos de Lock21 (v2, desde el 24 oct 2026).
#
# Tipografía cinética con profundidad: cámara que empuja y se aleja, palabras que entran de golpe
# (escala + desenfoque de movimiento), transiciones de zoom, sacudidas en los impactos, "21" gigante
# de fondo con paralaje, líneas de pista en movimiento y el candado animado como protagonista:
# se cierra (candado a las excusas) y el día 21 se abre (desbloqueado).
#
# Cada reel registra sus eventos (golpes, barridos, candado, desbloqueo...) y audio.py compone
# el sonido deportivo sincronizado con ellos. Rejilla: 150 BPM (pulso 0,4 s); los cortes caen en pulso.
#
# Uso: python3 dinamico.py [reel_que_es_lock21] [reel_21_dias_v2]   (SALIDA=carpeta)
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

from lk import BUILD, CSS, Render, icono

SALIDA = Path(os.environ.get('SALIDA', '/home/claude/lock21-contenido/dinamicos'))
W, H = 1080, 1920
PAD = 'padding:250px 130px 300px 90px'   # zona segura de Instagram

CSS2 = """
#cam { position:absolute; inset:0; will-change:transform; }
.esc { position:absolute; inset:0; display:none; flex-direction:column; justify-content:center; overflow:hidden; will-change:transform,filter; }
.esc > .contenido { position:relative; z-index:2; display:flex; flex-direction:column; }
.pistas { position:absolute; inset:-200px; z-index:0; opacity:.08;
  background: repeating-linear-gradient(115deg, currentColor 0 7px, transparent 7px 120px); }
.gigante { position:absolute; z-index:1; left:50%; top:50%; font-stretch:62%; font-weight:900; line-height:.8; white-space:nowrap;
  -webkit-text-fill-color:transparent; -webkit-text-stroke:6px currentColor; opacity:.14; pointer-events:none; }
.k { display:inline-block; will-change:transform,filter,opacity; opacity:0; }
.fila { display:block; }
#flash { position:absolute; inset:0; background:#fff; opacity:0; z-index:50; pointer-events:none; }
.burst line { stroke:#FFD02E; stroke-width:10; stroke-linecap:round; }
.logo-marca { display:flex; align-items:center; gap:22px; }
"""

JS2 = r"""
function cl(x){ return Math.max(0, Math.min(1, x)); }
function eo(x){ x=cl(x); return 1-Math.pow(1-x,3); }
function ei(x){ x=cl(x); return x*x*x; }
function back(x){ x=cl(x); var c=1.9; return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2); }
function eio(x){ x=cl(x); return x<.5 ? 4*x*x*x : 1-Math.pow(-2*x+2,3)/2; }
function pinta(t){
  // Cámara: sacudidas en los impactos.
  var cam=document.getElementById('cam'), sx=0, sy=0, rz=0;
  (cam.dataset.shake||'').split(',').filter(Boolean).forEach(function(s){
    var p=s.split(':'), t0=+p[0], a=+(p[1]||1), d=t-t0;
    if(d>=0 && d<0.35){ var k=Math.pow(1-d/0.35,2)*a; sx+=Math.sin(d*93)*22*k; sy+=Math.cos(d*71)*16*k; rz+=Math.sin(d*57)*0.7*k; }
  });
  cam.style.transform='translate('+sx+'px,'+sy+'px) rotate('+rz+'deg)';
  // Flash blanco.
  var fl=0; (cam.dataset.flash||'').split(',').filter(Boolean).forEach(function(s){ var p=s.split(':'), d=t-(+p[0]); if(d>=0&&d<0.22){ fl=Math.max(fl,(+(p[1]||0.7))*(1-d/0.22)); } });
  document.getElementById('flash').style.opacity=fl;
  // Escenas: entrada, empuje lento de cámara y salida en zoom.
  document.querySelectorAll('.esc').forEach(function(e){
    var a=+e.dataset.t0, b=+e.dataset.t1, on=t>=a&&t<b; e.style.display=on?'flex':'none'; if(!on) return;
    var d=t-a, dur=b-a, s=1, x=0, y=0, bl=0, op=1, rot=0;
    var ent=e.dataset.in||'punch', kin=eo(d/0.32);
    if(ent==='punch'){ s*=1.45-0.45*kin; bl=16*(1-kin); }
    else if(ent==='atras'){ s*=0.72+0.28*eo(d/0.36); bl=10*(1-eo(d/0.36)); }
    else if(ent==='latigo'){ x=(1-kin)*1080; bl=26*(1-kin); rot=(1-kin)*-4; }
    else if(ent==='sube'){ y=(1-kin)*1920; bl=20*(1-kin); }
    var cam2=e.dataset.cam||'in'; var p=d/dur;
    if(cam2==='in') s*=1+0.07*p; else if(cam2==='out') s*=1.08-0.08*p; else if(cam2==='deriva'){ s*=1.03; x+=-30+60*p; }
    var sal=b-t; if(sal<0.14 && e.dataset.out!=='no'){ var k=1-sal/0.14; s*=1+0.35*ei(k); bl=Math.max(bl,12*k); }
    e.style.transform='translate('+x+'px,'+y+'px) scale('+s+') rotate('+rot+'deg)';
    e.style.filter=bl>0.3?'blur('+bl.toFixed(1)+'px)':'none';
    var g=e.querySelector('.gigante'); if(g){ var v=+(g.dataset.vel||-60); g.style.transform='translate(calc(-50% + '+(v*d)+'px),-50%) scale('+(1+0.12*p)+')'; }
    var ps=e.querySelector('.pistas'); if(ps){ ps.style.transform='translateX('+((d*260)%120)+'px)'; }
  });
  // Palabras cinéticas.
  document.querySelectorAll('.k').forEach(function(w){
    var t0=+w.dataset.t0, fx=w.dataset.fx||'slam', d=t-t0, k;
    if(d<0){ w.style.opacity=0; return; }
    if(fx==='slam'){ k=cl(d/0.24); var s=2.5-1.5*back(k); w.style.opacity=cl(d/0.08); w.style.transform='scale('+s+')'; w.style.filter=k<1?'blur('+(12*(1-k)).toFixed(1)+'px)':'none'; }
    else if(fx==='sube'){ k=eo(d/0.34); w.style.opacity=k; w.style.transform='translateY('+((1-k)*110)+'%) rotate('+((1-k)*4)+'deg)'; w.style.filter='none'; }
    else if(fx==='pop'){ k=cl(d/0.3); w.style.opacity=cl(d/0.1); w.style.transform='scale('+(0.4+0.6*back(k))+')'; w.style.filter='none'; }
    else if(fx==='zoom'){ k=eo(d/0.45); w.style.opacity=cl(d/0.15); w.style.transform='scale('+(4-3*k)+')'; w.style.filter=k<1?'blur('+(18*(1-k)).toFixed(1)+'px)':'none'; }
    else if(fx==='izq'){ k=eo(d/0.3); w.style.opacity=k; w.style.transform='translateX('+((1-k)*-140)+'px) skewX('+((1-k)*-12)+'deg)'; w.style.filter=k<1?'blur('+(10*(1-k)).toFixed(1)+'px)':'none'; }
    var lat=w.dataset.late; if(lat){ var q=(t-(+lat)); if(q>=0){ var z=1+0.1*Math.sin(cl(q/0.3)*Math.PI); w.style.transform+=' scale('+z+')'; } }
  });
  // Candado: cierre (cae el arco y rebota) y apertura (tiembla, salta y gira).
  document.querySelectorAll('.candado').forEach(function(c){
    var arco=c.querySelector('.arco'), cuerpo=c.querySelector('.cuerpo'), burst=c.querySelector('.burst'), halo=c.querySelector('.halo');
    var tc=c.dataset.cerrar?+c.dataset.cerrar:null, ta=c.dataset.abrir?+c.dataset.abrir:null, abierto=c.dataset.inicio==='abierto';
    var dy=abierto?-46:0, rot=abierto?-24:0, sq=1, wig=0;
    if(tc!==null && t>=tc-0.2){ var k=ei((t-(tc-0.2))/0.2); dy=-46*(1-k); rot=-24*(1-eo((t-(tc-0.32))/0.2)); if(t>=tc){ var b=t-tc; sq=1+0.09*Math.sin(cl(b/0.18)*Math.PI)*(1-cl(b/0.4)); dy=Math.sin(cl(b/0.16)*Math.PI)*-7; } }
    if(ta!==null && t>=ta-0.45){ var w2=t-(ta-0.45); if(t<ta){ wig=Math.sin(w2*60)*4*(w2/0.45); dy=0; rot=0; } else { var o=t-ta; dy=-52*back(cl(o/0.28)); rot=-30*eo(cl((o-0.05)/0.35)); sq=1+0.07*Math.sin(cl(o/0.2)*Math.PI); } }
    arco.setAttribute('transform','translate(0 '+dy.toFixed(2)+') rotate('+rot.toFixed(2)+' 62 112)');
    cuerpo.setAttribute('transform','translate(100 172) rotate('+wig.toFixed(2)+') scale('+(1/sq).toFixed(3)+' '+sq.toFixed(3)+') translate(-100 -172)');
    var ev=ta!==null?ta:tc, d2=t-ev;
    if(burst){ if(ta!==null && d2>=0 && d2<0.6){ var kb=eo(d2/0.6); burst.style.opacity=1-kb; burst.setAttribute('transform','translate(100 150) scale('+(0.5+1.1*kb)+') translate(-100 -150)'); } else { burst.style.opacity=0; } }
    if(halo){ if(ev!==null && d2>=0 && d2<0.5){ var kh=eo(d2/0.5); halo.style.opacity=0.7*(1-kh); halo.setAttribute('r', 90+110*kh); } else { halo.style.opacity=0; } }
  });
  // Anillo de progreso con contador de días (pulso en cada día).
  document.querySelectorAll('.anillo').forEach(function(a){
    var v=a.dataset.anillo.split(','), t0=+v[0], t1=+v[1], p=eio((t-t0)/(t1-t0));
    var arc=a.querySelector('.prog'), L=+arc.dataset.l; arc.style.strokeDashoffset=L*(1-p);
    var n=Math.max(1, Math.min(21, Math.floor(1+20*p+1e-6))); var num=a.querySelector('.num'); num.textContent=n;
    var fr=(1+20*p)-Math.floor(1+20*p); var z=t<t0?1:1+0.14*(1-cl(fr*3)); if(n===21&&t>=t1){ z=1+0.2*Math.sin(cl((t-t1)/0.3)*Math.PI); }
    num.style.transform='scale('+z+')';
  });
  document.querySelectorAll('[data-count]').forEach(function(e){
    var v=e.dataset.count.split(','), a=+v[0], b=+v[1], t0=+v[2], t1=+v[3];
    e.textContent=Math.round(a+(b-a)*eo((t-t0)/(t1-t0)));
  });
  document.querySelectorAll('[data-tachar]').forEach(function(e){
    var v=e.dataset.tachar.split(','); e.style.width=(eo((t-v[0])/(v[1]-v[0]))*100)+'%';
  });
}
"""


class Reel:
    """Construye un reel y registra sus eventos de sonido."""

    def __init__(self, nombre, duracion):
        self.nombre = nombre
        self.duracion = duracion
        self.escenas = []
        self.eventos = []
        self.sacudidas = []
        self.flashes = []

    def ev(self, tipo, t, g=1.0):
        self.eventos.append({'tipo': tipo, 't': round(t, 3), 'g': g})

    def sacude(self, t, a=1.0):
        self.sacudidas.append('%.3f:%.2f' % (t, a))

    def flash(self, t, a=0.6):
        self.flashes.append('%.3f:%.2f' % (t, a))

    def escena(self, tema, t0, t1, contenido, entrada='punch', cam='in', gigante=None, pistas=True, salida=True, centro=True):
        fondo = ''
        if pistas:
            fondo += '<div class="pistas"></div>'
        if gigante:
            fondo += '<div class="gigante" style="font-size:%dpx" data-vel="%d">%s</div>' % (gigante[1], gigante[2] if len(gigante) > 2 else -60, gigante[0])
        self.escenas.append(
            '<div class="esc lienzo %s" data-t0="%.3f" data-t1="%.3f" data-in="%s" data-cam="%s" data-out="%s" style="%s;justify-content:%s">%s'
            '<div class="contenido">%s</div></div>' % (tema, t0, t1, entrada, cam, 'si' if salida else 'no', PAD, 'center' if centro else 'flex-start', fondo, contenido))
        if t0 > 0:
            self.ev('barrido', t0)

    def html(self):
        return ('<div class="lienzo" style="width:%dpx;height:%dpx;position:relative;background:#0B1240">'
                '<div id="cam" data-shake="%s" data-flash="%s">%s</div><div id="flash"></div></div>') % (
            W, H, ','.join(self.sacudidas), ','.join(self.flashes), ''.join(self.escenas))


def K(reel, texto, t0, fx='slam', size=150, color=None, paso=0.08, sonido=True, late=None, clase='tit', estilo=''):
    """Texto cinético palabra a palabra. Los saltos de línea se marcan con '|'."""
    filas = []
    i = 0
    acento = [False]
    for fila in texto.split('|'):
        ws = []
        for w in fila.strip().split(' '):
            if not w:
                continue
            col = ''
            if w.startswith('*'):
                acento[0] = True
                w = w[1:]
            if acento[0]:
                col = 'color:var(--acento);'
            if w.endswith('*'):
                acento[0] = False
                w = w[:-1]
            ws.append('<span class="k" data-t0="%.3f" data-fx="%s"%s style="%s">%s</span>' % (
                t0 + i * paso, fx, (' data-late="%.3f"' % late) if late else '', col, w))
            i += 1
        filas.append('<span class="fila">%s</span>' % ' '.join(ws))
    if sonido:
        reel.ev({'slam': 'golpe', 'zoom': 'golpe', 'pop': 'pop', 'sube': 'tic', 'izq': 'tic'}.get(fx, 'tic'), t0)
    return '<p class="%s" style="font-size:%dpx;%s%s">%s</p>' % (clase, size, ('color:' + color + ';') if color else '', estilo, ''.join(filas))


def candado_svg(tam=420, cerrar=None, abrir=None, inicio='cerrado', color_cuerpo='#FFD02E', color_num='#0B1240', color_arco=None):
    # Candado del logo "21 cerrado": cuerpo con el 21 recortado y arco que se anima.
    arco_col = color_arco or color_cuerpo
    rayos = ''.join('<line x1="100" y1="%d" x2="100" y2="%d" transform="rotate(%d 100 150)"/>' % (150 - 120, 150 - 160, a) for a in range(0, 360, 30))
    attrs = ''
    if cerrar is not None:
        attrs += ' data-cerrar="%.3f"' % cerrar
    if abrir is not None:
        attrs += ' data-abrir="%.3f"' % abrir
    return ('<svg class="candado" data-inicio="%s"%s width="%d" height="%d" viewBox="-40 -40 280 300" style="overflow:visible;margin:-%dpx 0 -%dpx -%dpx">'
            '<circle class="halo" cx="100" cy="150" r="90" fill="none" stroke="#FFD02E" stroke-width="8" style="opacity:0"/>'
            '<g class="burst" style="opacity:0">%s</g>'
            '<g class="arco"><path d="M62 150 V78 a38 38 0 0 1 76 0 V118" fill="none" stroke="%s" stroke-width="26" stroke-linecap="round"/></g>'
            '<g class="cuerpo"><rect x="22" y="104" width="156" height="136" rx="30" fill="%s"/>'
            '<text x="100" y="207" text-anchor="middle" font-family="Archivo Variable" font-weight="900" font-stretch="62%%" font-size="104" fill="%s">21</text></g>'
            '</svg>') % (inicio, attrs, tam, int(tam * 300 / 280), int(tam * 40 / 280), int(tam * 20 / 280), int(tam * 40 / 280), rayos, arco_col, color_cuerpo, color_num)


def anillo(t0, t1, tam=520, color='#FFD02E', fondo='rgba(255,255,255,.18)'):
    r = 120
    L = 2 * 3.14159265 * r
    return ('<div class="anillo" data-anillo="%.3f,%.3f" style="position:relative;width:%dpx;height:%dpx">'
            '<svg width="%d" height="%d" viewBox="0 0 300 300" style="transform:rotate(-90deg)">'
            '<circle cx="150" cy="150" r="%d" fill="none" stroke="%s" stroke-width="26"/>'
            '<circle class="prog" data-l="%.2f" cx="150" cy="150" r="%d" fill="none" stroke="%s" stroke-width="26" stroke-linecap="round" stroke-dasharray="%.2f" stroke-dashoffset="%.2f"/></svg>'
            '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">'
            '<span class="kicker" style="font-size:%dpx;color:inherit;opacity:.8">DÍA</span>'
            '<span class="num tit" style="font-size:%dpx;display:inline-block;line-height:.85">1</span></div></div>') % (
        t0, t1, tam, tam, tam, tam, r, fondo, L, r, color, L, L, int(tam * 0.07), int(tam * 0.42))


def pastilla(texto, t0, reel, ico='link-2'):
    reel.ev('pop', t0)
    return ('<div style="margin-top:56px"><span class="k" data-t0="%.3f" data-fx="pop" style="display:inline-flex;align-items:center;gap:18px;border-radius:999px;background:#FFD02E;color:#0B1240;'
            'padding:26px 40px;font-size:42px;white-space:nowrap;font-weight:780;font-stretch:104%%">%s%s</span></div>') % (t0, icono(ico, 46, 2.5), texto)


def logo(t0, reel, tam=150):
    reel.ev('golpe', t0)
    return ('<div class="logo-marca"><span class="k" data-t0="%.3f" data-fx="zoom">%s</span>'
            '<span class="k tit" data-t0="%.3f" data-fx="zoom" style="font-size:%dpx">Lock21</span></div>') % (
        t0, candado_svg(int(tam * 0.95)), t0 + 0.06, tam)


def pagina2(cuerpo):
    return ('<!doctype html><html lang="es"><head><meta charset="utf-8"><style>%s %s .lienzo{width:%dpx;height:%dpx}</style></head>'
            '<body>%s<script>%s</script></body></html>') % (CSS, CSS2, W, H, cuerpo, JS2)


def renderizar(r, reel, destino, fps=30, pruebas=None):
    pg = r.br.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
    f = BUILD / '_tmp_din.html'
    f.write_text(pagina2(reel.html()), encoding='utf-8')
    pg.goto(f.as_uri())
    pg.evaluate('document.fonts.ready')
    pg.wait_for_timeout(200)
    destino = Path(destino)
    destino.mkdir(parents=True, exist_ok=True)
    if pruebas:
        for t in pruebas:
            pg.evaluate('pinta(%f)' % t)
            pg.screenshot(path=str(destino / ('prueba_%05.2f.png' % t)), clip={'x': 0, 'y': 0, 'width': W, 'height': H})
        pg.close()
        return
    tmp = BUILD / '_frames_din'
    shutil.rmtree(tmp, ignore_errors=True)
    tmp.mkdir()
    n = int(round(reel.duracion * fps))
    for i in range(n):
        pg.evaluate('pinta(%f)' % (i / fps))
        pg.screenshot(path=str(tmp / ('%05d.jpg' % i)), type='jpeg', quality=94, clip={'x': 0, 'y': 0, 'width': W, 'height': H})
    pg.close()
    mudo = destino / 'reel_mudo.mp4'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', str(tmp / '%05d.jpg'),
                    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium',
                    '-r', str(fps), '-movflags', '+faststart', '-an', str(mudo)], check=True)
    shutil.rmtree(tmp, ignore_errors=True)
    (destino / 'eventos.json').write_text(json.dumps({'duracion': reel.duracion, 'eventos': sorted(reel.eventos, key=lambda e: e['t'])}, indent=1))
    # Sonido deportivo sincronizado y mezcla final.
    import audio
    pista = destino / 'audio.wav'
    audio.guardar_wav(str(pista), audio.componer_eventos(reel.duracion, reel.eventos))
    audio.mezclar(str(mudo), str(pista), str(destino / 'reel.mp4'))
    # Portada: el fotograma más fuerte que indique el reel.
    if getattr(reel, 'portada_t', None) is not None:
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(reel.portada_t), '-i', str(destino / 'reel.mp4'),
                        '-frames:v', '1', '-q:v', '2', str(destino / 'portada.jpg')], check=True)


# ---------------------------------------------------------------------------------------------
# Reels
# ---------------------------------------------------------------------------------------------

def reel_que_es_lock21():
    """Qué significa Lock21: candado a las excusas 21 días; el día 21, desbloqueado."""
    R = Reel('que-es-lock21', 15.2)
    # 1. Candado a las excusas (se cierra con golpe).
    c1 = ('<div style="margin-bottom:40px">%s</div>' % candado_svg(520, cerrar=2.4, inicio='abierto') +
          K(R, '21 días', 0.12, 'slam', 230) +
          K(R, 'poniendo candado', 0.85, 'sube', 120, paso=0.06) +
          K(R, 'a tus *excusas.*', 1.6, 'slam', 150, paso=0.09))
    R.escena('t-noche', 0, 3.2, c1, entrada='atras', cam='in', gigante=('21', 1500, -40))
    R.ev('candado', 2.4)
    R.sacude(2.4, 1.2)
    R.flash(2.4, 0.35)
    # 2. Un hábito cada día: anillo 1 -> 21.
    c2 = ('<div style="display:flex;justify-content:center;margin-bottom:46px;color:#fff">%s</div>' % anillo(3.6, 5.6, 480) +
          K(R, 'Un hábito.', 3.3, 'slam', 150) +
          K(R, 'Cada día.', 4.0, 'sube', 150, color='#FFD02E') +
          K(R, 'Check-in de 1 minuto con tu coach IA.', 4.6, 'sube', 46, paso=0.03, clase='texto', estilo='margin-top:30px;text-transform:none;'))
    R.escena('t-cobalto', 3.2, 6.4, c2, entrada='punch', cam='in')
    for i in range(21):
        R.ev('tic', 3.6 + 2.0 * i / 20.0, 0.35)
    R.ev('golpe', 5.6)
    R.sacude(5.6, 0.6)
    # 3. ¿Y el día 21?
    c3 = K(R, '¿Y el|*día 21?*', 6.5, 'zoom', 270, paso=0.1)
    R.escena('t-dorsal', 6.4, 8.0, c3, entrada='latigo', cam='in', gigante=('21', 1700, 60))
    R.sacude(6.6, 0.8)
    # 4. Desbloqueado.
    c4 = ('<div style="margin-bottom:40px">%s</div>' % candado_svg(620, abrir=8.8) +
          K(R, '*Desbloqueado.*', 9.0, 'slam', 136) +
          K(R, 'Ya no empiezas|de cero.', 9.7, 'sube', 110, paso=0.06) +
          K(R, 'Y eliges tu siguiente hábito.', 10.4, 'sube', 46, paso=0.03, clase='texto', estilo='margin-top:30px;'))
    R.escena('t-noche', 8.0, 11.2, c4, entrada='punch', cam='in', gigante=('21', 1500, -50))
    R.ev('desbloqueo', 8.8)
    R.sacude(8.8, 1.3)
    R.flash(8.8, 0.55)
    # 5. Marca y llamada.
    c5 = (logo(11.35, R, 160) +
          K(R, 'Reto gratis de 21 días', 12.0, 'izq', 40, paso=0.03, clase='kicker', estilo='margin-top:50px;') +
          K(R, 'Próximo grupo:|*lunes 16 nov*', 12.4, 'sube', 130, paso=0.06, estilo='margin-top:14px;') +
          pastilla('Pide tu plaza: enlace en la bio', 13.3, R))
    R.escena('t-cobalto', 11.2, 15.2, c5, entrada='atras', cam='in', salida=False, gigante=('LOCK21', 900, -70))
    R.sacude(11.35, 0.7)
    R.ev('final', 11.2)
    R.portada_t = 9.6
    return R


def reel_21_dias_v2():
    """'Por qué 21 días no es magia' con el estilo dinámico (sustituye al del 30 oct)."""
    R = Reel('21-dias-no-es-magia', 19.6)
    tachado = ('<span style="position:relative;display:inline-block">21 días<span data-tachar="4.1,4.5" style="position:absolute;left:-2%;top:44%;height:18px;width:0;background:#2433D9;border-radius:9px"></span></span>')
    R.escena('t-noche', 0, 2.4, K(R, 'Por qué|21 días', 0.1, 'slam', 190, paso=0.1) + K(R, '*no es magia.*', 0.9, 'zoom', 190, paso=0.1),
             entrada='atras', gigante=('21', 1500, -40))
    R.sacude(0.9, 0.8)
    R.escena('t-pista', 2.4, 5.6, K(R, 'Seguro que oíste lo de', 2.5, 'sube', 56, paso=0.04, clase='texto') +
             '<p class="tit" style="font-size:160px;margin-top:20px"><span class="k" data-t0="2.9" data-fx="slam">%s</span> <span class="k" data-t0="3.1" data-fx="slam">para crear un hábito.</span></p>' % tachado,
             entrada='latigo')
    R.ev('golpe', 2.9)
    R.ev('tic', 4.1)
    R.escena('t-cobalto', 5.6, 9.6, K(R, 'En el estudio más citado, la mediana fue de', 5.7, 'sube', 100, paso=0.04) +
             '<p class="tit" style="font-size:440px;line-height:.85;margin-top:30px;color:#FFD02E"><span class="k" data-t0="6.2" data-fx="zoom" data-late="7.2"><span data-count="21,66,6.3,7.2">21</span></span></p>'
             '<p class="tit" style="font-size:150px"><span class="k" data-t0="6.4" data-fx="slam">días</span></p>' +
             K(R, 'Lally et al. (2010). Con mucha diferencia entre personas.', 7.8, 'sube', 38, paso=0.02, clase='texto', estilo='margin-top:34px;', sonido=False),
             entrada='punch', gigante=('66', 1500, -50))
    R.ev('golpe', 6.2)
    R.ev('golpe', 7.2, 1.2)
    R.sacude(7.2, 1.0)
    R.escena('t-dorsal', 9.6, 11.2, K(R, 'Entonces,|¿por qué *21?*', 9.7, 'zoom', 200, paso=0.1), entrada='latigo', gigante=('?', 1800, 50))
    R.sacude(9.8, 0.8)
    R.escena('t-noche', 11.2, 14.8, '<div style="margin-bottom:40px">%s</div>' % candado_svg(520, abrir=12.0) +
             K(R, 'Porque el día 21', 12.2, 'sube', 120, paso=0.06) + K(R, 'se desbloquea *el arranque.*', 12.7, 'slam', 130, paso=0.08) +
             K(R, 'Lo difícil es empezar y no soltarlo en las primeras semanas.', 13.5, 'sube', 44, paso=0.02, clase='texto', estilo='margin-top:30px;', sonido=False),
             entrada='punch', gigante=('21', 1500, -50))
    R.ev('desbloqueo', 12.0)
    R.sacude(12.0, 1.2)
    R.flash(12.0, 0.5)
    dias = ''.join('<span class="k" data-t0="%.2f" data-fx="pop" style="flex:1;border-radius:36px;background:#2433D9;color:#fff;padding:34px 0;text-align:center">'
                   '<span class="tit" style="font-size:120px;display:block;color:#FFD02E">%s</span><span style="font-size:34px;font-weight:650">día</span></span>' % (15.2 + 0.16 * i, d)
                   for i, d in enumerate(('0', '7', '21')))
    R.escena('t-pista', 14.8, 17.2, K(R, 'Por eso medimos', 14.9, 'slam', 130) + '<div style="display:flex;gap:24px;margin-top:50px">%s</div>' % dias +
             K(R, 'Un test de 4 preguntas para ver cuánto te sale solo.', 15.9, 'sube', 46, paso=0.02, clase='texto', estilo='margin-top:40px;', sonido=False),
             entrada='atras')
    for i in range(3):
        R.ev('pop', 15.2 + 0.16 * i, 0.7)
    R.escena('t-cobalto', 17.2, 19.6, logo(17.3, R, 130) +
             K(R, 'Próximo grupo:|*lunes 16 nov*', 17.8, 'sube', 120, paso=0.06, estilo='margin-top:40px;') +
             pastilla('Pide tu plaza: enlace en la bio', 18.4, R), entrada='punch', salida=False, gigante=('LOCK21', 900, -70))
    R.sacude(17.3, 0.6)
    R.ev('final', 17.2)
    R.portada_t = 7.5
    return R


if __name__ == '__main__':
    nombres = [a for a in sys.argv[1:] if not a.startswith('-')] or ['reel_que_es_lock21', 'reel_21_dias_v2']
    prueba = os.environ.get('PRUEBA')
    with Render() as r:
        for nombre in nombres:
            reel = globals()[nombre]()
            dest = SALIDA / reel.nombre
            if prueba:
                renderizar(r, reel, dest, pruebas=[float(x) for x in prueba.split(',')])
            else:
                renderizar(r, reel, dest)
            print('ok', dest)
