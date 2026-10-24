from lk import *

OUT = Path('/home/claude/lock21-contenido/semana-1')
PAD = 'padding:230px 110px 290px 90px'


def H(tema, cuerpo, pie=''):
    return ('<div class="lienzo %s" style="width:1080px;height:1920px;%s;justify-content:center">'
            '<div style="position:absolute;top:212px;left:90px">%s</div>%s%s</div>') % (tema, PAD, marca(40), cuerpo, pie)


def K(t, mt=0):
    return '<p class="kicker" style="font-size:36px;margin-top:%dpx">%s</p>' % (mt, t)


def T(t, size=140, mt=24):
    return '<p class="tit" style="font-size:%dpx;margin-top:%dpx">%s</p>' % (size, mt, t)


def P(t, size=48, mt=34):
    return '<p class="texto" style="font-size:%dpx;margin-top:%dpx">%s</p>' % (size, mt, t)


def hueco_enlace(texto='Pide tu plaza aquí'):
    # Espacio libre para que el propietario coloque la pegatina de enlace desde el móvil.
    return ('<div style="margin-top:70px;display:flex;flex-direction:column;align-items:center;gap:16px">'
            '<p style="font-size:40px;font-weight:750;font-stretch:104%%">%s</p>'
            '<svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>'
            '<div style="height:150px"></div></div>') % texto


CALENTAMIENTOS = [
    ('Tu porqué', 'Escribe en una nota del móvil por qué quieres tu hábito. Una frase sincera basta.'),
    ('Detente 5 segundos', 'Hoy, cuando llegue tu señal, solo detente 5 segundos y piensa en tu hábito. Nada más.'),
    ('Déjalo preparado', 'Deja listo lo que vas a necesitar: las zapatillas junto a la puerta, la botella a la vista o el cargador fuera del cuarto.'),
    ('Prueba tu versión mínima', 'Haz una vez la versión de 2 minutos de tu hábito. Solo para comprobar que de verdad es fácil.'),
    ('La hora exacta', 'Elige la hora exacta a la que suele llegar tu señal y apúntala. Cuanto más concreta, mejor funciona.'),
    ('Tu obstáculo', 'Piensa en lo que más probablemente te hará fallar y escribe tu plan: “si pasa esto, hago mi versión mínima”.'),
    ('Ensáyalo en la cabeza', 'Cierra los ojos un minuto e imagina la escena entera: llega tu señal y haces tu hábito.'),
    ('El sitio', 'Decide dónde vas a hacerlo exactamente. Mismo momento y mismo sitio cada día.'),
]


def calentamiento(i):
    t, x = CALENTAMIENTOS[i]
    return H('t-noche',
             '<div style="display:flex;align-items:center;gap:22px"><span style="width:96px;height:96px;border-radius:50%%;background:#FFD02E;color:#0B1240;display:flex;align-items:center;justify-content:center">%s</span>'
             '<p class="kicker" style="font-size:36px">Calentamiento de hoy<br><span style="color:#F4F6FF">1 minuto</span></p></div>' % icono('timer', 52, 2.25) +
             T(t, 150, 50) + P(x, 52, 40) +
             '<p style="margin-top:80px;padding-top:34px;border-top:3px solid rgba(244,246,255,.22);font-size:34px;line-height:1.35;color:rgba(244,246,255,.75)">Es la misión diaria que reciben quienes ya se apuntaron mientras esperan a que empiece su grupo.</p>')


def enlace(tema='t-cobalto', titular='Próximo grupo:<br><span class="ac">lunes 16 nov</span>'):
    return H(tema, K('Reto gratis de 21 días') + T(titular, 170) +
             P('30 plazas. Después, un grupo nuevo cada dos semanas.', 50, 40) + hueco_enlace())


def nuevo_post(tipo, titular, linea, extra=''):
    return H('t-pista', K('Nuevo %s en el feed' % tipo) + T(titular, 160) + P(linea, 50, 36) + extra +
             '<p style="margin-top:60px;font-size:40px;font-weight:750;display:flex;align-items:center;gap:14px;color:#2433D9">Lo tienes en @reto.lock21 %s</p>' % icono('arrow-right', 44, 2.5))


def historias(r):
    dias = {
        '2026-10-24': [calentamiento(0),
                       nuevo_post('carrusel', 'Qué es <span class="ac">Lock21</span>', 'Un hábito, una señal y 21 días, explicado en siete diapositivas.'),
                       enlace()],
        '2026-10-25': [calentamiento(1),
                       H('t-cobalto', K('Dato') + T('¿21 días para crear un hábito?', 150) +
                         P('En el estudio más citado la mediana fue de <b>66 días</b>, con mucha diferencia entre personas.', 50, 40) +
                         P('Por eso 21 días son el arranque, no la meta.', 50, 30) +
                         '<p style="margin-top:60px;font-size:30px;color:rgba(255,255,255,.75)">Lally et al. (2010), European Journal of Social Psychology.</p>'),
                       enlace('t-dorsal', 'Un hábito.<br>21 días.<br>Gratis.')],
        '2026-10-26': [calentamiento(2),
                       H('t-pista', K('Así es la web') + T('¿Cuál sería el tuyo?', 130) +
                         '<div style="margin-top:40px;display:flex;justify-content:center;zoom:.74">%s</div>' % captura_web(780) +
                         '<p style="margin-top:26px;font-size:28px;color:#4A5175;text-align:center">Recreación de la portada de lock21.netlify.app</p>'),
                       enlace()],
        '2026-10-27': [calentamiento(3),
                       H('t-dorsal', K('Señales que funcionan') + T('Aburridas y concretas', 150) + ''.join(
                           '<div style="margin-top:34px;border-radius:32px;background:#0B1240;color:#F4F6FF;padding:32px 38px;font-size:42px;line-height:1.3"><b style="font-weight:780;color:#FFD02E">%s</b> %s</div>' % s
                           for s in (('Después de comer,', 'salgo a caminar 20 minutos.'), ('Después del café de la mañana,', '10 minutos de movilidad.'), ('Después de lavarme los dientes,', 'el móvil se queda fuera del cuarto.'))))],
        '2026-10-28': [calentamiento(4),
                       nuevo_post('carrusel', '6 hábitos. <span class="ac">Tú eliges uno.</span>', 'Con una señal de ejemplo para cada uno.', '<div style="margin-top:44px">%s</div>' % rejilla_habitos(880, tam=38))],
        '2026-10-29': [calentamiento(5),
                       H('t-noche', K('Respuesta del test de hoy') + T('Mito', 260) +
                         P('21 días no crean un hábito. En el estudio de Lally (2010) la mediana fue de <b>66 días</b>, con casos de 18 días a más de 250.', 50, 30) +
                         '<div style="margin-top:50px">%s</div>' % curva(880, 400, '#F4F6FF', zona=('#FFFFFF', 0.12)) +
                         '<p style="margin-top:20px;font-size:30px;color:rgba(244,246,255,.75)">Curva ilustrativa. Fuente: Lally et al. (2010), European Journal of Social Psychology.</p>')],
        '2026-10-30': [calentamiento(6),
                       H('t-pista', K('Así es un check-in') + T('1 minuto al día', 140) +
                         '<div style="margin-top:40px;display:grid;gap:26px;zoom:.8">%s%s</div>' % (tarjeta_checkin(880), tarjeta_coach('Día 9 sumado. Hoy te costó más y aun así lo hiciste: eso cuenta.', 'Después de comer, sal a caminar. Si el día se tuerce, con 2 minutos vale.', 880)) +
                         '<p style="margin-top:24px;font-size:28px;color:#4A5175">Recreación de la pantalla con un mensaje de ejemplo. El coach es una IA y cada mensaje lo indica.</p>'),
                       enlace('t-cobalto')],
        '2026-10-31': [calentamiento(7),
                       H('t-cobalto', K('La semana en Lock21') + T('Lo que tienes que saber', 140) + ''.join(
                           '<div style="display:flex;align-items:center;gap:26px;margin-top:40px;font-size:46px;font-weight:650"><span style="flex:none;width:86px;height:86px;border-radius:50%%;background:#FFD02E;color:#0B1240;display:flex;align-items:center;justify-content:center">%s</span>%s</div>' % (icono(i, 46, 2.25), t)
                           for i, t in (('check', 'Un hábito, no seis.'), ('link-2', 'Atado a una señal: después de X, hago Y.'), ('bot', 'Check-in diario con un coach que es una IA.'), ('calendar-days', 'Próximo grupo: lunes 16 de noviembre.'))) +
                         '<p style="margin-top:70px;font-size:40px;font-weight:750;color:#FFD02E">El reel de la semana, en el feed.</p>')],
    }
    for dia, lst in dias.items():
        for i, html in enumerate(lst, 1):
            r.png(html, 1080, 1920, OUT / 'historias' / dia / ('%02d.png' % i))


def destacadas(r):
    for nombre, ic, archivo in (('Cómo va', 'link-2', 'destacada-como-va'), ('La ciencia', 'chart-spline', 'destacada-la-ciencia'), ('Preguntas', 'circle-help', 'destacada-preguntas')):
        html = ('<div class="lienzo t-cobalto" style="width:1080px;height:1920px;align-items:center;justify-content:center">'
                '<div style="width:640px;height:640px;border-radius:50%%;background:#FFD02E;color:#0B1240;display:flex;align-items:center;justify-content:center">%s</div>'
                '<p class="tit" style="font-size:120px;margin-top:80px;color:#fff">%s</p></div>') % (icono(ic, 330, 2), nombre)
        r.png(html, 1080, 1920, OUT / 'perfil' / (archivo + '.png'))


if __name__ == '__main__':
    with Render() as r:
        destacadas(r)
        historias(r)
