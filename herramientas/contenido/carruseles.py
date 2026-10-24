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


def firma_creador(color='var(--suave)', fondo='#FFD02E', letra='#0B1240'):
    return ('<div style="display:flex;align-items:center;gap:18px;margin-top:56px">'
            '<span style="flex:none;width:72px;height:72px;border-radius:50%%;background:%s;color:%s;display:flex;align-items:center;justify-content:center;font-stretch:64%%;font-weight:860;font-size:44px">J</span>'
            '<span style="font-size:32px;line-height:1.2;color:%s"><b style="font-weight:780">Juanma</b><br>Creador de Lock21</span></div>') % (fondo, letra, color)


def por_que_existe(r):
    tot = 7
    d = [
        diapo('t-noche', 1, tot, K('Por qué existe Lock21') +
              T('No lo creó un experto.<br><span class="ac">Lo creó alguien que tuvo que cambiar.</span>', 140) +
              P('Te cuento de dónde sale, en siete diapositivas.', 44, 44)),
        diapo('t-pista', 2, tot, K('Así empecé yo', 0) +
              T('Fumaba. Bebía de más cada fin de semana.', 124) +
              T('Y dejaba mis prioridades <span class="ac">para otro día.</span>', 124, 30) +
              P('No lo cuento para dar lecciones a nadie. Lo cuento porque de ahí sale todo esto.', 42, 44)),
        diapo('t-cobalto', 3, tot, T('No lo cambié de golpe.', 150, 0) +
              T('<span class="ac">Lo cambié de uno en uno.</span>', 150, 20) +
              P('Hábito a hábito, aprendiendo en mí mismo qué funcionaba y qué no.', 46, 48)),
        diapo('t-dorsal', 4, tot, T('Lock21 es el método que me hubiera gustado tener', 128, 0) + firma_creador('#0B1240', '#0B1240', '#FFD02E')),
        diapo('t-pista', 5, tot, K('Cómo funciona', 0) +
              '<div style="margin-top:40px;display:grid;gap:30px">' + ''.join(
                  '<div style="display:flex;align-items:center;gap:28px;font-size:46px;font-weight:650;line-height:1.2"><span style="flex:none;width:92px;height:92px;border-radius:50%%;background:#2433D9;color:#FFD02E;display:flex;align-items:center;justify-content:center">%s</span><span>%s</span></div>' % (icono(i, 48, 2.25), t)
                  for i, t in (('check', 'Eliges <b style="font-weight:800">un</b> hábito de seis.'), ('link-2', 'Lo atas a algo que ya haces: después de X, hago Y.'),
                               ('bot', 'Check-in de 1 minuto con un coach que es una IA, y te lo dice.'), ('calendar-days', '21 días para arrancarlo. Un fallo suelto no rompe la racha.'))) + '</div>'),
        diapo('t-noche', 6, tot, K('Para que quede claro', 0) +
              T('No es un programa para dejar de fumar ni de beber.', 118, 24) +
              P('Es para arrancar un hábito pequeño: pasos, sueño, movilidad, agua, entrenar o pantallas. Mi historia es cómo empecé yo, <b>no una promesa.</b>', 44, 44)),
        diapo('t-dorsal', 7, tot, K('Próximo grupo · gratis', 0) + T('Lunes 16 de noviembre', 190) +
              P('<b>30 plazas.</b> Después, un grupo nuevo cada dos semanas.', 46, 40), ultima=True),
    ]
    guardar(r, '2026-10-24_carrusel_por-que-existe-lock21', d)


def seis_habitos(r):
    tot = 7
    d = [diapo('t-cobalto', 1, tot, T('6 hábitos.<br><span class="ac">Tú eliges uno.</span>', 210, 0) + P('Yo cambié los míos de uno en uno. Aquí se empieza igual: por uno.', 46, 48))]
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
                   P('Dímelo en comentarios. Y si dudas entre dos, <b>hoy hay test en historias.</b>', 46, 40) +
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
        diapo_p(1, tot, PT('Hubo una época en la que dejaba mis prioridades <span class="p-mark">para otro día.</span>', 124) +
                P('Hoy te cuento por qué he creado un reto.', 46, 44)),
        diapo_p(2, tot, PT('Fumaba. Bebía de más todos los fines de semana.') +
                P('No lo cambié de golpe ni con un plan perfecto. Lo fui cambiando <b>de uno en uno</b>, aprendiendo en mí mismo.', 46, 44)),
        diapo_p(3, tot, PT('Así que he montado lo que me hubiera gustado <span class="p-mark">tener.</span>') +
                '<div style="margin-top:50px;display:grid;gap:22px">' + ''.join(
                    '<div style="display:flex;align-items:center;gap:24px;font-size:46px;font-weight:650"><span style="flex:none;width:70px;height:70px;border-radius:50%%;background:#FFD02E;color:#0B1240;display:flex;align-items:center;justify-content:center">%s</span>%s</div>' % (icono(i, 38, 2.5), t)
                    for i, t in (('check', 'Un hábito cada vez.'), ('link-2', 'Atado a algo que ya haces.'), ('calendar-days', '21 días para arrancarlo.'))) + '</div>'),
        diapo_p(4, tot, PT('Se llama <span class="p-mark">Lock21.</span>', 140) +
                P('Es gratis. Eliges un hábito de seis y cada día haces un check-in de un minuto con un coach que es <b>una IA, y lo dice</b> en cada mensaje.', 46, 44)),
        diapo_p(5, tot, '<p class="kicker" style="font-size:32px">Una cosa clara</p>' +
                PT('No es un programa para dejar de fumar ni de beber.', 112, 20) +
                P('Es para arrancar un hábito pequeño. Mi historia es cómo empecé yo, no una promesa de nada.', 46, 44)),
        diapo_p(6, tot, '<p class="kicker" style="font-size:32px">Próximo grupo</p>' + PT('Lunes 16 de noviembre. <span class="p-mark">30 plazas.</span>', 124, 20) +
                P('Y después, uno cada dos semanas. Lo tienes en <b>@reto.lock21</b>.', 44, 40), ultima=True),
    ]
    guardar(r, 'juanma-personal/2026-10-26_carrusel_asi-empece-yo', d)

    tot = 7
    preg = [
        ('¿Tú eres experto en esto?', 'No. Soy alguien que cambió sus hábitos de uno en uno. Lock21 es el método que me hubiera gustado tener.'),
        ('¿Cuesta algo?', 'No. El reto, el coach y el test son gratis, y no te pido tarjeta.'),
        ('¿El coach es una persona?', 'No. Es una IA y lo dice. No da dietas, calorías ni consejos médicos.'),
        ('¿Y si fallo un día?', 'La racha lo perdona. La única regla es no fallar dos días seguidos.'),
        ('¿Y cuando acabe?', 'Sigues por tu cuenta con tu señal. Si quieres seguir acompañado, puedes apuntarte a la lista. Es opcional.'),
    ]
    d = [diapo_p(1, tot, PT('Lo que seguramente te estás preguntando <span class="p-mark">de mi reto.</span>', 124) + P('Cinco respuestas cortas.', 46, 44))]
    for i, (q, a) in enumerate(preg):
        d.append(diapo_p(i + 2, tot, '<p class="kicker" style="font-size:32px">Pregunta %d</p>' % (i + 1) + PT(q, 124, 20) + P(a, 48, 44)))
    d.append(diapo_p(7, tot, PT('¿Te animas a elegir <span class="p-mark">uno?</span>', 140) +
                     P('Próximo grupo: lunes 16 de noviembre, 30&nbsp;plazas. Si tienes otra duda, pregúntamela en comentarios.', 44, 40), ultima=True))
    guardar(r, 'juanma-personal/2026-10-29_carrusel_preguntas-del-reto', d)


if __name__ == '__main__':
    import sys
    with Render() as r:
        for f in sys.argv[1:] or ['por_que_existe', 'seis_habitos', 'personal']:
            globals()[f](r)
