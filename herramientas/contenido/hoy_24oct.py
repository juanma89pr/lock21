"""Relanzamiento 24 oct 2026 con la identidad 2: carrusel de presentación + historias."""
import os
import sys
from pathlib import Path

from identidad2 import P, Render, candado, dorsal, historia, insignia, linea, slide

SALIDA = Path(os.environ.get('SALIDA', '/home/claude/lock21-contenido/identidad2/2026-10-24'))


def carrusel_presentacion():
    s = []
    s.append(slide('rosa', '<div style="margin-top:auto"><p class="big" style="font-size:250px">Un hábito.</p><p class="big" style="font-size:250px">21 días.</p></div>'
                   '<p class="txt" style="font-size:44px;margin-top:44px;max-width:820px">Un reto gratis para arrancar con uno solo y no soltarlo. Te cuento cómo va.</p>'
                   '<div style="margin-top:56px">%s</div>' % linea(P['cobalto'], 1, 912), der='01/07'))
    s.append(slide('cobalto', '<p class="big" style="font-size:150px;margin-top:auto">Yo también lo dejaba todo para el lunes.</p>'
                   '<p class="txt" style="font-size:44px;margin-top:50px;max-width:860px">Fumaba, bebía de más los fines de semana y siempre había otro lunes. No lo cambié de golpe: un hábito, y luego otro.</p>'
                   '<p class="lab" style="font-size:26px;margin-top:50px">Juanma · creador de Lock21</p>', der='02/07'))
    s.append(slide('bosque', '<div style="margin:auto 0 60px">%s</div><p class="big" style="font-size:150px">Día 1: candado a las excusas.</p>'
                   '<p class="txt" style="font-size:42px;margin-top:40px;max-width:880px">Eliges un hábito y lo atas a algo que ya haces. «Después de comer, salgo a caminar.»</p>' % candado(P['mantequilla'], 190), der='03/07'))
    s.append(slide('lila', '<p class="big" style="font-size:300px;margin-top:auto;line-height:.8">1 min</p><p class="big" style="font-size:110px;margin-top:20px">al día.</p>'
                   '<p class="txt" style="font-size:42px;margin-top:44px;max-width:880px">Un check-in con un coach que es una IA, y te lo dice. Sin juicios: un fallo suelto no rompe la racha.</p>', der='04/07'))
    s.append(slide('mantequilla', '<p class="big" style="font-size:200px;margin-top:auto">0 · 7 · 21</p>'
                   '<div style="margin-top:60px">%s</div>'
                   '<p class="txt" style="font-size:42px;margin-top:50px;max-width:880px">Esos días haces un test de 4 preguntas para ver cuánto te sale ya en automático.</p>' % linea(P['bosque'], 7, 912), der='05/07'))
    s.append(slide('tomate', '<div style="margin:auto 0 60px">%s</div><p class="big" style="font-size:150px">Día 21: desbloqueado.</p>'
                   '<p class="txt" style="font-size:42px;margin-top:40px;max-width:880px">No es magia ni un hábito para siempre. Es el arranque: ya no empiezas de cero, y eliges el siguiente.</p>' % candado(P['mantequilla'], 190, abierto=True), der='06/07'))
    s.append(slide('cobalto', '<div style="margin:auto 0;display:flex;justify-content:center">%s</div>'
                   '<p class="big" style="font-size:110px">Próximo grupo: lunes 16 nov.</p>'
                   '<p class="txt" style="font-size:42px;margin-top:30px">Gratis. 30 plazas. El enlace para pedir la tuya está en la bio.</p>' % dorsal(P['rosa'], P['cobalto'], '16', 'Grupo 01', 'Salida', ancho=640), der='07/07'))
    return s


def historias():
    h = {}
    h['1915_calentamiento'] = historia('mantequilla', '<p class="lab" style="font-size:28px;margin-top:80px">Calentamiento · 1 minuto</p>'
                                       '<p class="big" style="font-size:170px;margin-top:auto">¿Por qué quieres tu hábito?</p>'
                                       '<p class="txt" style="font-size:50px;margin-top:50px">Escríbelo en una nota del móvil. Una frase sincera basta.</p>'
                                       '<p class="txt" style="font-size:34px;margin-top:auto;opacity:.75">Es la misión diaria de quienes ya tienen plaza, mientras empieza su grupo.</p>')
    h['2115_grupo'] = historia('cobalto', '<div style="margin:auto 0;display:flex;justify-content:center">%s</div>'
                                '<p class="big" style="font-size:130px">Próximo grupo: lunes 16 nov.</p>'
                                '<p class="txt" style="font-size:48px;margin-top:36px">Gratis. 30 plazas. El enlace está en la bio.</p>' % dorsal(P['rosa'], P['cobalto'], '16', 'Grupo 01', 'Salida', ancho=760))
    return h


def portada_perfil(r, destino):
    # Foto de perfil: el candado del logo sobre rosa (se recorta en círculo).
    html = ('<div class="pieza" style="width:1080px;height:1080px;background:%s;align-items:center;justify-content:center">%s</div>') % (P['rosa'], candado(P['cobalto'], 420))
    r.png(html, 1080, 1080, destino)
    html2 = '<div class="pieza" style="width:1080px;height:1080px;background:#000">%s</div>' % insignia(P['rosa'], P['cobalto'], 1080, uid='p')
    r.png(html2, 1080, 1080, destino.parent / 'perfil-insignia.png')


if __name__ == '__main__':
    with Render() as r:
        for i, html in enumerate(carrusel_presentacion()):
            r.png(html, 1080, 1350, SALIDA / 'carrusel-presentacion' / ('%02d.jpg' % (i + 1)))
        for k, html in historias().items():
            r.png(html, 1080, 1920, SALIDA / 'historias' / (k + '.jpg'))
        portada_perfil(r, SALIDA / 'perfil' / 'perfil-candado.png')
    print('ok', SALIDA)
