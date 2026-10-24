"""Reels de la identidad 2 de Lock21: movimiento limpio y deportivo.

Cortes secos de color, textos que suben desde su línea (máscara), cámara casi quieta, el candado del logo
que se cierra (clac) y se abre el día 21, la línea de 21 días que avanza, contador de días e insignia que gira.
Sin rayas, sin números gigantes de fondo, sin sacudidas, sin destellos ni desenfoques.
Rejilla de 150 BPM (pulso 0,4 s). El sonido se compone con audio.componer_eventos a partir de los eventos.

Uso: SALIDA=carpeta python3 dinamico2.py reel_que_es_lock21   (PRUEBA=1.0,2.5 para fotogramas sueltos)
"""
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

from identidad2 import BUILD, CSS, P, PAREJAS, candado, dorsal, insignia, linea

SALIDA = Path(os.environ.get('SALIDA', '/home/claude/lock21-contenido/identidad2/reels'))
W, H = 1080, 1920
PAD = '250px 96px 300px'

CSS_R = """
.esc{position:absolute;inset:0;display:none;flex-direction:column;padding:PAD}
.esc .cont{display:flex;flex-direction:column;flex:1;will-change:transform}
.m{display:block;overflow:hidden;padding-bottom:.08em;margin-bottom:-.08em}
.m > span{display:inline-block;will-change:transform}
.fd{opacity:0}
.cab{display:flex;justify-content:space-between}
""".replace('PAD', PAD)

JS = r"""
function cl(x){return Math.max(0,Math.min(1,x));}
function eo(x){x=cl(x);return 1-Math.pow(1-x,4);}
function eio(x){x=cl(x);return x<.5?8*x*x*x*x:1-Math.pow(-2*x+2,4)/2;}
function spring(x){x=cl(x);return 1-Math.exp(-7*x)*Math.cos(10*x);}
function pinta(t){
  document.querySelectorAll('.esc').forEach(function(e){
    var a=+e.dataset.t0,b=+e.dataset.t1,on=t>=a&&t<b;e.style.display=on?'flex':'none';if(!on)return;
    var p=(t-a)/(b-a); var c=e.querySelector('.cont'); c.style.transform='scale('+(1+0.025*p)+')';
  });
  document.querySelectorAll('.m > span').forEach(function(s){
    var t0=+s.dataset.t0,k=eo((t-t0)/0.55); s.style.transform='translateY('+((1-k)*108)+'%)';
  });
  document.querySelectorAll('.fd').forEach(function(s){
    var t0=+s.dataset.t0,k=eo((t-t0)/0.5); s.style.opacity=k; s.style.transform='translateY('+((1-k)*24)+'px) scale('+(s.dataset.pop?0.94+0.06*spring((t-t0)/0.6):1)+')';
  });
  document.querySelectorAll('svg.candado').forEach(function(c){
    var arco=c.querySelector('.arco'),cu=c.querySelector('.cuerpo');
    var tc=c.dataset.cerrar?+c.dataset.cerrar:null,ta=c.dataset.abrir?+c.dataset.abrir:null,ab=c.dataset.inicio==='abierto';
    var k=ab?1:0, bob=0;
    if(tc!==null){ if(t>=tc-0.22){ k=1-eio((t-(tc-0.22))/0.22); } if(t>=tc){ k=0; bob=Math.sin(cl((t-tc)/0.2)*Math.PI)*3; } }
    if(ta!==null){ if(t<ta){ k=0; var w=t-(ta-0.3); if(w>0){ bob=Math.sin(w*55)*0.9; } } else { k=spring((t-ta)/0.55); } }
    arco.setAttribute('transform','translate(0 '+(-12*k+bob*0.5).toFixed(2)+') rotate('+(-22*k).toFixed(2)+' 26 40)');
    cu.setAttribute('transform','translate(0 '+(bob).toFixed(2)+')');
  });
  document.querySelectorAll('.linea[data-anim]').forEach(function(l){
    var v=l.dataset.anim.split(','),t0=+v[0],t1=+v[1],a=+v[2],b=+v[3];
    var d=a+(b-a)*eio((t-t0)/(t1-t0)), pos=(d-1)/20*100;
    l.querySelector('.lleno').style.width=pos+'%'; l.querySelector('.punto').style.left=pos+'%';
  });
  document.querySelectorAll('[data-cuenta]').forEach(function(e){
    var v=e.dataset.cuenta.split(','),a=+v[0],b=+v[1],t0=+v[2],t1=+v[3];
    var n=Math.round(a+(b-a)*eio((t-t0)/(t1-t0))); e.textContent=(n<10?'0':'')+n;
  });
  document.querySelectorAll('[data-gira]').forEach(function(e){
    var t0=+e.dataset.gira; e.style.transform='rotate('+(Math.max(0,t-t0)*14)+'deg)';
  });
}
"""


class Reel:
    def __init__(self, nombre, duracion):
        self.nombre, self.duracion = nombre, duracion
        self.escenas, self.eventos = [], []
        self.portada_t = None

    def ev(self, tipo, t, g=1.0):
        self.eventos.append({'tipo': tipo, 't': round(t, 3), 'g': g})

    def escena(self, pareja, t0, t1, cuerpo, der='', corte=True):
        fondo, tinta = PAREJAS[pareja]
        self.escenas.append('<div class="esc" data-t0="%.3f" data-t1="%.3f" style="background:%s;color:%s">'
                            '<div class="cab lab" style="font-size:26px"><span>Lock21</span><span>%s</span></div><div class="cont">%s</div></div>' % (
                                t0, t1, fondo, tinta, der, cuerpo))
        if t0 > 0 and corte:
            self.ev('barrido', t0, 0.55)

    def html(self):
        return '<div style="position:relative;width:%dpx;height:%dpx;overflow:hidden">%s</div>' % (W, H, ''.join(self.escenas))


def T(reel, texto, t0, size=150, clase='big', paso=0.09, estilo='', sonido=True):
    """Texto que sube línea a línea desde su máscara. '|' separa líneas."""
    lineas = texto.split('|')
    out = ''.join('<span class="m"><span data-t0="%.3f">%s</span></span>' % (t0 + i * paso, l) for i, l in enumerate(lineas))
    if sonido:
        reel.ev('tic', t0, 0.6)
    return '<div class="%s" style="font-size:%dpx;%s">%s</div>' % (clase, size, estilo, out)


def F(html, t0, pop=False, estilo=''):
    return '<div class="fd" data-t0="%.3f"%s style="%s">%s</div>' % (t0, ' data-pop="1"' if pop else '', estilo, html)


def candado_anim(color, tam, cerrar=None, abrir=None, inicio='cerrado'):
    svg = candado(color, tam, clase='candado')
    attrs = ' data-inicio="%s"' % inicio
    if cerrar is not None:
        attrs += ' data-cerrar="%.3f"' % cerrar
    if abrir is not None:
        attrs += ' data-abrir="%.3f"' % abrir
    return svg.replace('<svg class="candado"', '<svg class="candado"' + attrs, 1)


def linea_anim(color, t0, t1, a, b, ancho=880):
    return linea(color, a, ancho).replace('class="linea "', 'class="linea" data-anim="%.3f,%.3f,%d,%d"' % (t0, t1, a, b), 1)


def pagina(cuerpo):
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><style>%s %s</style></head><body>%s<script>%s</script></body></html>' % (CSS, CSS_R, cuerpo, JS)


def renderizar(br, reel, destino, fps=30, pruebas=None):
    pg = br.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
    f = BUILD / '_tmp_r2.html'
    f.write_text(pagina(reel.html()), encoding='utf-8')
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
    tmp = BUILD / '_frames_r2'
    shutil.rmtree(tmp, ignore_errors=True)
    tmp.mkdir()
    for i in range(int(round(reel.duracion * fps))):
        pg.evaluate('pinta(%f)' % (i / fps))
        pg.screenshot(path=str(tmp / ('%05d.jpg' % i)), type='jpeg', quality=94, clip={'x': 0, 'y': 0, 'width': W, 'height': H})
    pg.close()
    mudo = destino / 'reel_mudo.mp4'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', str(tmp / '%05d.jpg'), '-c:v', 'libx264', '-profile:v', 'high',
                    '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-r', str(fps), '-movflags', '+faststart', '-an', str(mudo)], check=True)
    shutil.rmtree(tmp, ignore_errors=True)
    (destino / 'eventos.json').write_text(json.dumps({'duracion': reel.duracion, 'eventos': sorted(reel.eventos, key=lambda e: e['t'])}, indent=1))
    import audio
    audio.guardar_wav(str(destino / 'audio.wav'), audio.componer_eventos(reel.duracion, reel.eventos))
    audio.mezclar(str(mudo), str(destino / 'audio.wav'), str(destino / 'reel.mp4'))
    if reel.portada_t is not None:
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(reel.portada_t), '-i', str(destino / 'reel.mp4'), '-frames:v', '1', '-q:v', '2', str(destino / 'portada.jpg')], check=True)


# ------------------------------------------------------------------------------------------
def reel_que_es_lock21():
    R = Reel('que-es-lock21', 15.2)
    R.escena('rosa', 0, 3.2,
             F(candado_anim(P['cobalto'], 230, cerrar=2.4, inicio='abierto'), 0.0, estilo='margin-top:auto;margin-bottom:70px') +
             T(R, '21 días|con candado', 0.15, 170) + T(R, 'a las excusas.', 1.25, 170, sonido=True), der='00')
    R.ev('candado', 2.4)
    R.escena('cobalto', 3.2, 6.4,
             '<p class="lab" style="font-size:30px;margin-top:auto">Día</p>' +
             '<p class="big" style="font-size:420px;line-height:.82"><span data-cuenta="1,21,3.5,5.6">01</span></p>' +
             F(linea_anim(P['rosa'], 3.5, 5.6, 1, 21), 3.35, estilo='margin-top:40px') +
             T(R, 'Un hábito. Cada día.', 3.6, 96, estilo='margin-top:70px') +
             T(R, 'Un check-in de un minuto con tu coach IA.', 4.3, 44, clase='txt', estilo='margin-top:24px', sonido=False), der='01—21')
    for i in range(21):
        R.ev('tic', 3.5 + 2.1 * (i / 20.0), 0.22)
    R.ev('golpe', 5.6, 0.6)
    R.escena('mantequilla', 6.4, 8.0, T(R, '¿Y el|día 21?', 6.5, 260, estilo='margin-top:auto;margin-bottom:auto'), der='21')
    R.escena('tomate', 8.0, 11.2,
             F(candado_anim(P['mantequilla'], 260, abrir=8.8), 8.0, estilo='margin-top:auto;margin-bottom:70px') +
             T(R, 'Desbloqueado.', 9.0, 150) + T(R, 'Ya no empiezas de cero.|Y eliges el siguiente.', 9.7, 70, clase='med', estilo='margin-top:36px', sonido=False), der='21')
    R.ev('desbloqueo', 8.8)
    R.escena('cobalto', 11.2, 15.2,
             F('<div style="width:520px">%s</div>' % insignia(P['rosa'], P['cobalto'], 520, uid='r1'), 11.25, pop=True, estilo='margin:auto 0 60px') +
             T(R, 'Próximo grupo:|lunes 16 nov.', 11.8, 130) +
             F('<p class="txt" style="font-size:46px">Gratis. 30 plazas. Enlace en la bio.</p>', 12.7, estilo='margin-top:34px'), der='Salida')
    R.ev('final', 11.2)
    R.ev('pop', 12.7, 0.6)
    R.portada_t = 10.4
    return R


if __name__ == '__main__':
    from playwright.sync_api import sync_playwright
    nombres = sys.argv[1:] or ['reel_que_es_lock21']
    prueba = os.environ.get('PRUEBA')
    with sync_playwright() as pw:
        br = pw.chromium.launch()
        for n in nombres:
            reel = globals()[n]()
            renderizar(br, reel, SALIDA / reel.nombre, pruebas=[float(x) for x in prueba.split(',')] if prueba else None)
            print('ok', SALIDA / reel.nombre)
        br.close()
