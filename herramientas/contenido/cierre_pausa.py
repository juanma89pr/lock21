"""Piezas de cierre de Lock21 (10 nov 2026, Juanma: se pausa el reto; volverá desde @balancet.fit).

Carrusel de 4 y una historia. Se encolan en estado «borrador»: el publicador solo lanza «programado»,
así que no salen hasta que Juanma las aprueba (cambiar el estado a «programado»).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from identidad2 import Render, slide, historia, candado, PAREJAS  # noqa: E402

DEST = Path(__file__).resolve().parents[2] / 'public' / 'redes' / 'cierre'
TOTAL = 4


def num(n):
    return '%02d/%02d' % (n, TOTAL)


def frase(pareja, n, lab, titulo, texto, size=140):
    return slide(pareja, '<p class="lab" style="font-size:28px;margin-top:auto">%s</p>'
                         '<p class="big" style="font-size:%dpx;margin-top:44px">%s</p>'
                         '<p class="txt" style="font-size:44px;margin-top:50px;max-width:880px">%s</p>' % (lab, size, titulo, texto), der=num(n))


def piezas():
    f, t = PAREJAS['cobalto']
    portada = slide('cobalto', '<div style="margin:auto 0 64px">%s</div>'
                               '<p class="big" style="font-size:190px">Lock21 se pausa.</p>'
                               '<p class="txt" style="font-size:44px;margin-top:44px;max-width:860px">El grupo 01 no sale el lunes 16. Te cuento por qué.</p>' % candado(t, 150, abierto=True), der=num(1))
    return [
        portada,
        frase('hueso', 2, 'La verdad', 'Un reto en grupo necesita grupo.',
              'Todavía somos pocos y prefiero pararlo a hacerlo a medias. Antes que el gancho, la verdad.'),
        frase('rosa', 3, 'Lo que no caduca', 'La idea sigue viva.',
              'Un hábito, una señal fija y nunca dos fallos seguidos. Lock21 volverá más adelante desde @balancet.fit.'),
        frase('cobalto', 4, 'Gracias', 'Gracias por estar.',
              'A quienes nos leyeron y siguieron estas semanas. Si quieren saber cuándo vuelve, déjenlo en lock21.netlify.app.', size=150),
    ]


def pieza_historia():
    f, t = PAREJAS['cobalto']
    return historia('cobalto', '<p class="lab" style="font-size:28px;margin-top:80px">Un aviso</p>'
                               '<div style="margin:auto 0 70px">%s</div>'
                               '<p class="big" style="font-size:170px">Lock21 se pausa.</p>'
                               '<p class="txt" style="font-size:50px;margin-top:50px">Un reto en grupo necesita grupo. Volverá desde @balancet.fit.</p>'
                               '<p class="txt" style="font-size:36px;margin-top:auto;opacity:.8">Si quieres que te avise, el enlace está en la bio.</p>' % candado(t, 170, abierto=True))


if __name__ == '__main__':
    with Render() as r:
        for i, html in enumerate(piezas(), 1):
            r.png(html, 1080, 1350, DEST / 'carrusel' / ('%02d.jpg' % i))
        r.png(pieza_historia(), 1080, 1920, DEST / 'historia.jpg')
    print('Piezas de cierre en', DEST)
