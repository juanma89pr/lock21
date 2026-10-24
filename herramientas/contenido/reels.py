from lk import *

PRUEBA = os.environ.get('PRUEBA')
OUT = Path(os.environ.get('SALIDA', '/home/claude/lock21-contenido/semana-1'))
# Zona segura: nada de texto en los 200 px superiores ni en los 250 inferiores; margen derecho amplio por los botones de Instagram.
PAD = 'padding:230px 140px 290px 90px'


def escena(tema, t0, t1, cuerpo, centro=True):
    return ('<div class="lienzo %s" data-escena data-t0="%.2f" data-t1="%.2f" style="position:absolute;inset:0;width:1080px;height:1920px;%s;justify-content:%s">'
            '<div style="position:absolute;top:212px;left:90px">%s</div>%s</div>') % (tema, t0, t1, PAD, 'center' if centro else 'flex-start', marca(40), cuerpo)


def A(html, t0, fx='up', d=0.45, estilo=''):
    return '<div class="a" data-t0="%.2f" data-d="%.2f" data-fx="%s" style="opacity:0;%s">%s</div>' % (t0, d, fx, estilo, html)


def T(t, size=140, mt=0, color=''):
    return '<p class="tit" style="font-size:%dpx;margin-top:%dpx;%s">%s</p>' % (size, mt, ('color:' + color) if color else '', t)


def P(t, size=50, mt=30):
    return '<p class="texto" style="font-size:%dpx;margin-top:%dpx">%s</p>' % (size, mt, t)


def cierre_lock(t0):
    return A('<div style="margin-top:60px;display:inline-flex;align-items:center;gap:18px;border-radius:999px;background:#FFD02E;color:#0B1240;padding:24px 36px;font-size:38px;white-space:nowrap;font-weight:780;font-stretch:104%%">%sPide tu plaza: enlace en la bio</div>' % icono('link-2', 44, 2.5), t0, 'pop')


def reel_lunes(r):
    dest = OUT / '2026-10-26_reel_antes-lo-dejaba-todo-para-el-lunes'
    tiles = [10.15 + 0.14 * i for i in range(6)] + [11.6]
    celdas = [16.15 + 0.06 * i for i in range(21)]
    html = '<div class="lienzo" style="width:1080px;height:1920px;position:relative">' + ''.join([
        escena('t-noche', 0, 3.4, A(T('Antes lo dejaba todo <span class="ac">para el lunes.</span>', 160), 0.15)),
        escena('t-pista', 3.4, 6.6, A(T('Mis prioridades, <span class="ac">también.</span>', 150), 3.45) +
               A(P('Fumaba, bebía de más cada fin de semana y siempre había otro lunes.', 50, 50), 4.4)),
        escena('t-cobalto', 6.6, 10.0, A(T('Lo que me cambió no fue un lunes.', 140), 6.65) +
               A(T('Fue <span class="ac">un hábito.</span><br>Y luego otro.', 170, 50), 7.7, 'pop')),
        escena('t-pista', 10.0, 13.0, A(T('Eliges <span class="ac">uno</span> de seis.', 140), 10.05) + '<div style="margin-top:60px">%s</div>' % rejilla_habitos(850, destacado=1, anim=tiles, tam=38)),
        escena('t-dorsal', 13.0, 16.0, A(T('Lo atas a algo que ya haces', 120), 13.05) +
               A(T('“Después de X,<br>hago Y.”', 150, 50, '#2433D9'), 13.7, 'pop') +
               A('<div style="margin-top:60px;border-radius:36px;background:#0B1240;color:#F4F6FF;padding:36px 44px;font-size:46px;line-height:1.3;font-weight:500"><b style="font-weight:780">Después de comer,</b> salgo a caminar 20 minutos.</div>', 14.5)),
        escena('t-noche', 16.0, 18.8, A(T('21 días. <span class="ac">Gratis.</span>', 150), 16.05) +
               '<div style="margin-top:50px">%s</div>' % tablero(estados_ejemplo(10), 760, 14, cabecera=False, tiempos=celdas) +
               A(P('Check-in diario con un coach que es <b>una IA</b> (y te lo dice).', 46, 44), 17.2)),
        escena('t-cobalto', 18.8, 22.5, A(T('El método que me hubiera gustado tener.', 120), 18.85) +
               A('<p class="kicker" style="font-size:38px;margin-top:60px">Próximo grupo</p>', 19.6) +
               A(T('Lunes 16 nov<br><span class="ac">30 plazas</span>', 150, 20), 19.7) + cierre_lock(20.5)),
    ]) + '</div>'
    if PRUEBA: return [r.png(html,1080,1920,Path(PRUEBA)/('r1_%05.2f.png'%t),t=t) for t in (2.5,6.0,9.5,12.5,15.5,18.5,22.0)]
    r.video(html, 1080, 1920, 22.5, dest / 'reel.mp4')
    portada = ('<div class="lienzo t-noche" style="width:1080px;height:1920px;%s;justify-content:center">'
               '<div style="position:absolute;top:212px;left:90px">%s</div>'
               '%s<p class="texto" style="font-size:46px;margin-top:60px">Por qué existe Lock21 · Reto gratis de 21 días</p></div>') % (
        PAD, marca(40), T('Antes lo dejaba todo <span class="ac">para el lunes.</span>', 160))
    r.png(portada, 1080, 1920, dest / 'portada.png')


def reel_21_dias(r):
    dest = OUT / '2026-10-30_reel_21-dias-no-es-magia'
    tachado = ('<span style="position:relative;display:inline-block">21 días<span data-tachar="4.1,4.6" style="position:absolute;left:0;top:46%;height:16px;width:0;background:#2433D9;border-radius:8px"></span></span>')
    html = '<div class="lienzo" style="width:1080px;height:1920px;position:relative">' + ''.join([
        escena('t-noche', 0, 2.6, A(T('Por qué 21 días', 170), 0.1) + A(T('no es magia', 170, 0, '#FFD02E'), 0.7, 'pop')),
        escena('t-pista', 2.6, 5.6, A(P('Seguro que oíste lo de', 56, 0), 2.65) + A(T(tachado + ' para crear un hábito.', 150, 20), 2.9)),
        escena('t-cobalto', 5.6, 9.6, A(T('En el estudio más citado, la mediana fue de', 110), 5.65) +
               A('<p class="tit" style="font-size:420px;line-height:.85;margin-top:30px;color:#FFD02E"><span data-count="21,66,6.3,7.6">21</span></p><p class="tit" style="font-size:150px">días</p>', 6.2, 'pop') +
               A(P('Lally et al. (2010). Con mucha diferencia entre personas.', 38, 34), 7.8)),
        escena('t-dorsal', 9.6, 11.4, A(T('Entonces, ¿por qué 21?', 190), 9.65, 'pop')),
        escena('t-noche', 11.4, 14.8, A(T('Porque es <span class="ac">el arranque.</span>', 140), 11.45) +
               '<div style="margin-top:50px">%s</div>' % curva(850, 400, '#F4F6FF', zona=('#FFFFFF', 0.12), anim=((11.9, 12.9), (12.9, 13.6))) +
               A(P('Lo difícil es empezar y no soltarlo en las primeras semanas.', 44, 30), 13.3)),
        escena('t-pista', 14.8, 17.0, A(T('Por eso medimos', 130), 14.85) +
               A('<div style="display:flex;gap:24px;margin-top:50px">' + ''.join(
                   '<span style="flex:1;border-radius:36px;background:#2433D9;color:#fff;padding:34px 0;text-align:center"><span class="tit" style="font-size:120px;display:block;color:#FFD02E">%s</span><span style="font-size:34px;font-weight:650">día</span></span>' % d
                   for d in ('0', '7', '21')) + '</div>', 15.2, 'pop') +
               A(P('Un test de 4 preguntas para ver cuánto te sale solo.', 46, 40), 15.6)),
        escena('t-cobalto', 17.0, 19.8, A('<p class="kicker" style="font-size:38px">Reto gratis de 21 días</p>', 17.05) +
               A(T('Próximo grupo:<br><span class="ac">lunes 16 nov</span>', 160, 20), 17.15) +
               A(P('30 plazas. Prefiero decírtelo antes de que empieces.', 46, 34), 17.6) + cierre_lock(18.1)),
    ]) + '</div>'
    if PRUEBA: return [r.png(html,1080,1920,Path(PRUEBA)/('r2_%05.2f.png'%t),t=t) for t in (2.0,5.0,7.0,9.4,11.0,14.5,16.5,19.5)]
    r.video(html, 1080, 1920, 19.8, dest / 'reel.mp4')
    portada = ('<div class="lienzo t-noche" style="width:1080px;height:1920px;%s;justify-content:center">'
               '<div style="position:absolute;top:212px;left:90px">%s</div>%s%s'
               '<p class="tit" style="font-size:300px;line-height:.85;margin-top:70px;color:#FFD02E">66</p><p class="texto" style="font-size:48px;margin-top:20px">días de mediana. Y aun así, 21 tienen sentido.</p></div>') % (
        PAD, marca(40), T('Por qué 21 días', 170), T('no es magia', 170, 0, '#FFD02E'))
    r.png(portada, 1080, 1920, dest / 'portada.png')


if __name__ == '__main__':
    import sys
    with Render() as r:
        for f in sys.argv[1:] or ['reel_lunes', 'reel_21_dias']:
            globals()[f](r)
