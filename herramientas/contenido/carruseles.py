from lk import *

OUT = Path('/home/claude/lock21-contenido/semana-1')


def diapo(tema, n, total, cuerpo, ultima=False, cta='Pide tu plaza gratis: enlace en la bio', handle='@reto.lock21'):
    if ultima:
        pie = ('<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;border-radius:999px;padding:30px 44px;background:%s;color:%s">'
               '<span style="font-size:40px;font-weight:780;font-stretch:104%%">%s</span>%s</div>'
               % ('#0B1240' if tema == 't-dorsal' else '#FFD02E', '#FFD02E' if tema == 't-dorsal' else '#0B1240', cta, icono('arrow-right', 46, 2.75)))
    else:
        pie = ('<div style="display:flex;align-items:center;justify-content:space-between;font-size:30px;font-weight:650;color:var(--suave)">'
               '<span>%s</span><span style="display:flex;align-items:center;gap:10px">Desliza %s</span></div>' % (handle, icono('arrow-right', 34, 2.5)))
    return ('<div class="lienzo %s" style="padding:80px 90px 76px">'
            '<div style="display:flex;justify-content:space-between;align-items:center">%s<span style="font-size:30px;font-weight:700;color:var(--suave)">%d/%d</span></div>'
            '<div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:0">%s</div>%s</div>') % (tema, marca(46), n, total, cuerpo, pie)


def K(t, mt=0):
    return '<p class="kicker" style="font-size:32px;margin-top:%dpx">%s</p>' % (mt, t)


def T(t, size=150, mt=24):
    return '<h2 class="tit" style="font-size:%dpx;margin-top:%dpx">%s</h2>' % (size, mt, t)


def P(t, size=44, mt=36, w=860):
    return '<p class="texto" style="font-size:%dpx;margin-top:%dpx;max-width:%dpx">%s</p>' % (size, mt, w, t)


def guardar(render, carpeta, diapos):
    for i, html in enumerate(diapos, 1):
        render.png(html, 1080, 1350, OUT / carpeta / ('%02d.png' % i))


def que_es(r):
    tot = 7
    d = [
        diapo('t-cobalto', 1, tot, K('Esto es Lock21') + T('Un hábito.<br>21 días.<br><span class="ac">Gratis.</span>', 205) + P('Así funciona el reto, en siete diapositivas.', 46, 44)),
        diapo('t-pista', 2, tot, T('Eliges <span class="ac">uno</span> de 6 hábitos', 128, 0) + '<div style="margin-top:50px">%s</div>' % rejilla_habitos(900, tam=40) + P('Uno solo, a propósito.', 42, 40)),
        diapo('t-dorsal', 3, tot, T('Lo atas a<br>una señal', 150, 0) +
              '<p class="tit" style="font-size:118px;margin-top:46px;color:#2433D9">“Después de X,<br>hago Y.”</p>' +
              '<div style="margin-top:56px;border-radius:36px;background:#0B1240;color:#F4F6FF;padding:38px 44px;font-size:42px;line-height:1.3;font-weight:500">'
              '<span style="display:block;font-size:28px;font-weight:800;letter-spacing:.06em;color:#FFD02E;margin-bottom:12px">EJEMPLO</span><b style="font-weight:780">Después de comer,</b> salgo a caminar 20 minutos.</div>'),
        diapo('t-noche', 4, tot, T('Check-in de<br><span class="ac">1 minuto</span><br>cada día', 140, 0) +
              P('Con un coach que es <b>una IA, y te lo dice.</b> No da dietas, calorías ni consejos médicos.', 44, 40) +
              '<div style="margin-top:48px;display:inline-flex;align-items:center;gap:14px;border-radius:999px;background:#C7CDF7;color:#1A25A8;padding:16px 30px;font-size:34px;font-weight:800;letter-spacing:.06em;align-self:flex-start">%sCOACH IA</div>' % icono('bot', 38, 2.5)),
        diapo('t-pista', 5, tot, T('¿Fallas un día?<br><span class="ac">La racha sigue</span>', 128, 0) +
              '<div style="margin-top:44px">%s</div>' % tablero(estados_ejemplo(10), 760, 14, cabecera=False) +
              P('La única regla: <b>nunca dos fallos seguidos.</b>', 44, 36)),
        diapo('t-cobalto', 6, tot, T('21 días son <span class="ac">el arranque</span>', 132, 0) +
              P('Test de 4 preguntas los días 0, 7 y 21. Lo normal es que el hábito se asiente <b>hacia el día 66.</b>', 42, 30) +
              '<div style="margin-top:34px">%s</div>' % curva(900, 400, '#fff', zona=('#FFFFFF', 0.14)) +
              '<p style="margin-top:14px;font-size:24px;color:rgba(255,255,255,.75)">Curva ilustrativa. Lally et al. (2010): mediana de 66 días hasta la automaticidad.</p>'),
        diapo('t-dorsal', 7, tot, K('Próximo grupo', 0) + T('Lunes 16 de noviembre', 190) +
              P('<b>30 plazas.</b> Después, un grupo nuevo cada dos semanas.', 46, 40), ultima=True),
    ]
    guardar(r, '2026-10-24_carrusel_que-es-lock21', d)


def seis_habitos(r):
    tot = 7
    d = [diapo('t-cobalto', 1, tot, T('6 hábitos.<br><span class="ac">Tú eliges uno.</span>', 210, 0) + P('Cuál es el tuyo, y con qué señal atarlo.', 46, 48))]
    temas = ['t-pista', 't-noche', 't-dorsal', 't-pista']
    for i in range(4):
        h = HABITOS[i]
        d.append(diapo(temas[i], i + 2, tot,
                       '<span style="width:150px;height:150px;border-radius:50%%;background:%s;color:%s;display:flex;align-items:center;justify-content:center">%s</span>'
                       % ('#0B1240' if temas[i] == 't-dorsal' else '#FFD02E', '#FFD02E' if temas[i] == 't-dorsal' else '#0B1240', icono(h[0], 80, 2.25)) +
                       T(h[2], 150, 40) +
                       '<div style="margin-top:50px;border-top:4px solid var(--linea);padding-top:34px">' + K('Señal de ejemplo') +
                       P('<b>%s</b> %s' % (h[3], h[4]), 44, 16) + '</div>'))
    # 6: agua y pantalla juntas
    dos = ''
    for h in [(HABITOS[4][0], HABITOS[4][2], 'Después de cada comida,', 'relleno la botella.'), (HABITOS[5][0], HABITOS[5][2], 'Después de lavarme los dientes,', 'el móvil, fuera del cuarto.')]:
        dos += ('<div style="display:flex;gap:30px;align-items:flex-start;margin-top:46px">'
                '<span style="flex:none;width:110px;height:110px;border-radius:50%%;background:#FFD02E;color:#0B1240;display:flex;align-items:center;justify-content:center">%s</span>'
                '<div><p class="tit" style="font-size:88px">%s</p><p class="texto" style="font-size:38px;margin-top:14px"><b>%s</b> %s</p></div></div>'
                % (icono(h[0], 58, 2.25), h[1], h[2], h[3]))
    d.append(diapo('t-cobalto', 6, tot, K('Y dos más', 0) + dos))
    d.append(diapo('t-dorsal', 7, tot, T('¿Cuál es<br>el tuyo?', 200, 0) +
                   P('Dímelo en comentarios. Y si dudas, <b>haz el test en historias.</b>', 46, 40) +
                   P('Próximo grupo: lunes 16 de noviembre · 30 plazas.', 38, 30), ultima=True))
    guardar(r, '2026-10-28_carrusel_6-habitos', d)


# ---------- Perfil personal @juanma89pr: variante más cálida y en primera persona ----------

def diapo_p(n, total, cuerpo, tema='t-pista', ultima=False):
    firma = ('<div style="display:flex;align-items:center;gap:20px">'
             '<span style="width:76px;height:76px;border-radius:50%;background:#2433D9;color:#FFD02E;display:flex;align-items:center;justify-content:center;font-stretch:64%;font-weight:860;font-size:46px">J</span>'
             '<span style="font-size:30px;line-height:1.2"><b style="font-weight:780">Juanma</b><br><span style="color:var(--suave)">Creador de Lock21 · Las Palmas de GC</span></span></div>')
    if ultima:
        pie = ('<div style="display:flex;align-items:center;justify-content:space-between;border-radius:999px;padding:30px 44px;background:#2433D9;color:#fff">'
               '<span style="font-size:40px;font-weight:780;font-stretch:104%%">Pide tu plaza gratis: enlace en mi bio</span>%s</div>' % icono('arrow-right', 46, 2.75))
    else:
        pie = '<div style="display:flex;justify-content:flex-end;font-size:30px;font-weight:650;color:var(--suave);gap:10px;align-items:center">%d/%d %s</div>' % (n, total, icono('arrow-right', 32, 2.5))
    return ('<div class="lienzo %s" style="padding:84px 90px 76px">%s'
            '<div style="flex:1;display:flex;flex-direction:column;justify-content:center">%s</div>%s</div>') % (tema, firma, cuerpo, pie)


def PT(t, size=104, mt=0):
    return '<h2 style="font-stretch:78%%;font-weight:820;font-size:%dpx;line-height:1.02;letter-spacing:-0.01em;margin-top:%dpx;text-wrap:balance">%s</h2>' % (size, mt, t)


def personal(r):
    tot = 6
    d = [
        diapo_p(1, tot, PT('He montado <span class="p-mark">un reto.</span>', 150) + P('Es gratis, dura 21 días y va de una sola cosa. Te lo cuento.', 46, 44)),
        diapo_p(2, tot, PT('Llevo años viendo lo mismo con la gente que entreno.') +
                P('El problema casi nunca es la información. Es <b>sostener algo pequeño</b> cuando se acaba la motivación.', 46, 44)),
        diapo_p(3, tot, PT('Así que lo he reducido a <span class="p-mark">lo mínimo.</span>') +
                '<div style="margin-top:50px;display:grid;gap:22px">' + ''.join(
                    '<div style="display:flex;align-items:center;gap:24px;font-size:46px;font-weight:650"><span style="width:70px;height:70px;border-radius:50%%;background:#FFD02E;color:#0B1240;display:flex;align-items:center;justify-content:center">%s</span>%s</div>' % (icono(i, 38, 2.5), t)
                    for i, t in (('check', 'Un hábito, no seis.'), ('link-2', 'Atado a algo que ya haces.'), ('calendar-days', '21 días para arrancarlo.'))) + '</div>'),
        diapo_p(4, tot, PT('Cada día, un <span style="white-space:nowrap">check-in</span> de un minuto.') +
                P('Te responde un coach que es <b>una IA, y lo dice</b> en cada mensaje. Yo estoy detrás del reto y de cómo está montado.', 46, 44), tema='t-pista'),
        diapo_p(5, tot, PT('21 días no son <span class="p-mark">la meta.</span>') +
                P('Son el arranque. Lo normal es que un hábito se asiente hacia el día 66. Prefiero decírtelo antes de que empieces.', 46, 44)),
        diapo_p(6, tot, '<p class="kicker" style="font-size:32px">Primer grupo</p>' + PT('Lunes 16 de noviembre. <span class="p-mark">30 plazas.</span>', 124, 20) +
                P('Y después, uno cada dos semanas. Lo tienes en <b>@reto.lock21</b>.', 44, 40), ultima=True),
    ]
    guardar(r, 'juanma-personal/2026-10-26_carrusel_he-montado-un-reto', d)

    tot = 6
    preg = [
        ('¿Cuesta algo?', 'No. El reto, el coach y el test son gratis, y no te pido tarjeta.'),
        ('¿El coach es una persona?', 'No. Es una IA y lo dice. No da dietas, calorías ni consejos médicos.'),
        ('¿Y si fallo un día?', 'La racha lo perdona. La única regla es no fallar dos días seguidos.'),
        ('¿Y cuando acabe?', 'Sigues por tu cuenta con tu señal. Y si quieres seguir acompañado, te apuntas a una lista. Opcional y de pago.'),
    ]
    d = [diapo_p(1, tot, PT('Lo que seguramente te estás preguntando <span class="p-mark">de mi reto.</span>', 124) + P('Cuatro respuestas cortas.', 46, 44))]
    for i, (q, a) in enumerate(preg):
        d.append(diapo_p(i + 2, tot, '<p class="kicker" style="font-size:32px">Pregunta %d</p>' % (i + 1) + PT(q, 124, 20) + P(a, 48, 44)))
    d.append(diapo_p(6, tot, PT('¿Te animas a elegir <span class="p-mark">uno?</span>', 140) +
                     P('Primer grupo: lunes 16 de noviembre, 30 plazas. Si tienes otra duda, pregúntamela en comentarios.', 44, 40), ultima=True))
    guardar(r, 'juanma-personal/2026-10-29_carrusel_preguntas-del-reto', d)


if __name__ == '__main__':
    import sys
    with Render() as r:
        for f in sys.argv[1:] or ['que_es', 'seis_habitos', 'personal']:
            globals()[f](r)
