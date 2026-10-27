"""Del domingo 1 al lunes 16 de noviembre de 2026 (salida del grupo 01) con la identidad 2.

Cada día: historia de calentamiento a las 10:00, publicación a las 19:30 (carrusel los días impares,
reel con audio los pares) e historia de cuenta atrás a las 20:00. Los sábados 7 y 14 a las 20:00 se
dejan libres: los ocupa la historia con cifras reales que genera otra tarea.

Uso:
  python3 semana_1_16nov.py                    genera todo en /home/claude/lock21-contenido/identidad2/<fecha>/
  SOLO=2026-11-02 python3 semana_1_16nov.py     solo un día
  SIN_REELS=1 python3 semana_1_16nov.py         solo imágenes (carruseles e historias)
  ENCOLAR=1 python3 semana_1_16nov.py           además copia a public/redes/<fecha>/ y escribe contenido/cola/*.json
  SOLO_ENCOLAR=1 python3 semana_1_16nov.py      solo copia y encola lo ya generado
"""
import json
import os
import shutil
from pathlib import Path

from identidad2 import P, PAREJAS, Render, candado, dorsal, historia, insignia, linea, slide
from dinamico2 import F, T, Reel, candado_anim, cierre_grupo, linea_anim, renderizar

BASE = Path(os.environ.get('BASE', '/home/claude/lock21-contenido/identidad2'))
REPO = Path(__file__).resolve().parents[2]
HASH = '#hábitos #reto21días #constancia #GranCanaria #LasPalmasDeGranCanaria'
CTA = 'Pide tu plaza gratis en lock21.balancet.org (el enlace está en la bio).'


def pie(texto):
    return texto.strip() + '\n\n' + CTA + '\n\n' + HASH


def num(n, total):
    return '%02d/%02d' % (n, total)


def cierre(pareja, n, total, titulo='Salida: lunes 16 nov.', texto='Gratis, sin tarjeta. 30 plazas por grupo. El enlace está en la bio.'):
    f, t = PAREJAS[pareja]
    return slide(pareja, '<div style="margin:auto 0;display:flex;justify-content:center">%s</div>'
                 '<p class="big" style="font-size:110px">%s</p>'
                 '<p class="txt" style="font-size:42px;margin-top:30px;max-width:880px">%s</p>' % (dorsal(t, f, '16', 'Grupo 01', 'Salida', ancho=600, agujeros=f), titulo, texto),
                 der=num(n, total))


def frase(pareja, n, total, titulo, texto='', size=150, lab=''):
    cab = '<p class="lab" style="font-size:28px;margin-top:auto">%s</p>' % lab if lab else ''
    top = 'margin-top:44px' if lab else 'margin-top:auto'
    cuerpo = '<p class="txt" style="font-size:44px;margin-top:50px;max-width:880px">%s</p>' % texto if texto else ''
    return slide(pareja, cab + '<p class="big" style="font-size:%dpx;%s">%s</p>%s' % (size, top, titulo, cuerpo), der=num(n, total))


def portada(pareja, titulo, texto, size=180, total=7, color_candado=None):
    f, t = PAREJAS[pareja]
    return slide(pareja, '<div style="margin:auto 0 64px">%s</div>'
                         '<p class="big" style="font-size:%dpx">%s</p>'
                         '<p class="txt" style="font-size:44px;margin-top:44px;max-width:860px">%s</p>' % (candado(color_candado or t, 150), size, titulo, texto), der=num(1, total))


# ---------------------------------------------------------------- carruseles
def carrusel_no_es():
    n = 7
    return [portada('lila', 'Lo que Lock21 no es.', 'Para que sepas exactamente dónde te metes antes de pedir plaza.', 190, n),
            frase('cobalto', 2, n, 'No es una dieta.', 'No cuenta calorías ni te dice qué comer. Trabajas un solo hábito del menú: moverte, dormir, beber agua o soltar la pantalla.', 170),
            frase('mantequilla', 3, n, 'No da consejos médicos.', 'Si tienes una lesión, una enfermedad o tomas medicación, lo hablas con tu médico. El reto es otra cosa.', 160),
            frase('rosa', 4, n, 'El coach no es una persona disfrazada.', 'Es una IA y te lo dice en cada mensaje. Te acompaña en el check-in de un minuto.', 130),
            frase('bosque', 5, n, 'No es para dejar de fumar ni de beber.', 'Si quieres dejarlo, tu médico o tu centro de salud te pueden orientar. Lock21 es para arrancar un hábito pequeño.', 130),
            frase('tomate', 6, n, 'No cobra ni pide tarjeta.', 'Los 21 días, el coach y el test son gratis. Y no te prometemos resultados: te damos un método y datos para ver cómo vas.', 150),
            cierre('lila', 7, n, 'Y sí es esto:', 'Un hábito. 21 días. Un minuto al día. Lock21 es un proyecto de Balancet, desde Gran Canaria.')]


def paso(pareja, n, total, numero, titulo, texto):
    return slide(pareja, '<p class="lab" style="font-size:28px;margin-top:auto">Paso %s</p>'
                         '<p class="big" style="font-size:150px;margin-top:44px">%s</p>'
                         '<p class="txt" style="font-size:44px;margin-top:50px;max-width:880px">%s</p>' % (numero, titulo, texto), der=num(n, total))


def carrusel_dorsal():
    n = 6
    f, t = PAREJAS['cobalto']
    return [slide('cobalto', '<div style="margin:auto 0 60px;display:flex;justify-content:center">%s</div>'
                             '<p class="big" style="font-size:170px">Cada plaza lleva dorsal.</p>'
                             '<p class="txt" style="font-size:44px;margin-top:40px;max-width:860px">Como en una carrera: tu número, tu grupo y tu fecha de salida.</p>' % dorsal(t, f, '07', 'Grupo 01', 'Tu dorsal', ancho=620, agujeros=f), der=num(1, n)),
            paso('rosa', 2, n, '01', 'Eliges tu hábito.', 'Uno de los seis del menú. El que te veas sosteniendo 21 días, no el que más impresione.'),
            paso('mantequilla', 3, n, '02', 'Pides tu plaza.', 'Nombre y correo. Gratis, sin tarjeta. Al momento sale tu dorsal dentro de tu grupo.'),
            paso('lila', 4, n, '03', 'Lo cuentas, si quieres.', 'Tu dorsal sale en imagen para tu historia de Instagram, TikTok o WhatsApp. Decirlo en voz alta ata un poco más.'),
            paso('bosque', 5, n, '04', 'Lo haces con alguien.', 'Tienes un enlace propio para invitar. Quien entra con él va a tu mismo grupo y salen el mismo día.'),
            cierre('cobalto', 6, n, 'Salida: lunes 16 nov.', 'Pide tu dorsal en el enlace de la bio. Gratis, 30 plazas por grupo.')]


def opcion(pareja, n, total, pregunta, respuesta, habito):
    return slide(pareja, '<p class="lab" style="font-size:28px;margin-top:auto">Si te pasa esto</p>'
                         '<p class="big" style="font-size:120px;margin-top:40px">%s</p>'
                         '<p class="lab" style="font-size:28px;margin-top:70px">Empieza por</p>'
                         '<p class="med" style="font-size:96px;margin-top:20px">%s</p>'
                         '<p class="txt" style="font-size:40px;margin-top:30px;max-width:880px;opacity:.85">%s</p>' % (pregunta, habito, respuesta), der=num(n, total))


def carrusel_que_habito():
    n = 7
    return [portada('mantequilla', '¿Qué hábito te toca?', 'Seis situaciones, seis hábitos. Quédate con la que más te suene.', 190, n),
            opcion('cobalto', 2, n, '«Me paso el día sentado.»', 'Caminando al trabajo, después de comer o al hablar por teléfono.', '8.000 pasos'),
            opcion('rosa', 3, n, '«Me acuesto tarde sin querer.»', 'Una hora de acostarte que se repite, también el viernes.', 'Cama antes de las 23:30'),
            opcion('lila', 4, n, '«El móvil me quita el sueño.»', 'El móvil se queda fuera del cuarto o lejos de la mano.', 'Sin pantalla al dormir'),
            opcion('bosque', 5, n, '«Me levanto rígido.»', 'Diez minutos para soltar el cuerpo, sin material.', '10 min de movilidad'),
            opcion('tomate', 6, n, '«Empiezo el gimnasio y lo dejo.»', 'Con días fijos en el calendario, no «cuando pueda». O el agua: 2 litros, una botella a la vista.', 'Entrenar 3 días'),
            cierre('mantequilla', 7, n, '¿Ya lo tienes?', 'Lo eliges al pedir plaza y lo puedes cambiar hasta el día 1. Salida: lunes 16 nov.')]


def carrusel_con_alguien():
    n = 6
    return [portada('rosa', 'Hazlo con alguien.', 'Con compañía cuesta menos seguir. Y no hace falta que elijan el mismo hábito.', 190, n),
            frase('cobalto', 2, n, 'No para vigilarse.', 'Para que alguien te pregunte «¿hoy qué?». Muchas veces con eso basta para no soltarlo.', 170),
            frase('lila', 3, n, 'Cada uno su hábito.', 'Tú caminas después de comer, tu hermana se acuesta antes. La misma salida, la misma línea de 21 días.', 170),
            frase('mantequilla', 4, n, 'Mismo grupo, mismo día.', 'Al pedir plaza tienes tu enlace para invitar. Quien entra con él va a tu grupo mientras queden plazas.', 160),
            frase('bosque', 5, n, '¿A quién se lo mandarías?', 'Piensa en quien lleva tiempo diciendo «el lunes empiezo». Este lunes tiene fecha: 16 de noviembre.', 150),
            cierre('rosa', 6, n)]


def carrusel_quien():
    n = 6
    return [portada('bosque', 'Detrás de Lock21 no hay un experto.', 'Hay alguien que cambió sus hábitos de uno en uno.', 160, n),
            frase('rosa', 2, n, 'Soy Juanma, de Las Palmas.', 'Me estoy formando en entrenamiento y, por el camino, he juntado lo que me funcionó a mí con lo que estoy aprendiendo sobre cómo se forman los hábitos.', 150),
            frase('cobalto', 3, n, 'Antes lo dejaba todo para el lunes.', 'Lo que me cambió no fue un lunes. Fue un hábito, y luego otro.', 150),
            frase('mantequilla', 4, n, 'El coach del día a día es una IA.', 'Y lo dice en cada mensaje. Yo creé el reto y lo hago con el grupo 01.', 150),
            frase('lila', 5, n, 'Un proyecto de Balancet.', 'Lock21 nace dentro de Balancet, el proyecto de hábitos con el que trabajo. El reto es gratis y lo seguirá siendo.', 160),
            cierre('bosque', 6, n, '¿Me preguntas algo?', 'Te leo en comentarios. Salida del grupo 01: lunes 16 de noviembre.')]


def carrusel_test():
    n = 7
    return [portada('cobalto', '4 preguntas. Días 0, 7 y 21.', 'Cómo vas a saber si tu hábito ya te sale solo, con números y no con sensaciones.', 170, n),
            frase('rosa', 2, n, 'Un test de automaticidad.', 'Cuatro frases sobre tu hábito que puntúas del 1 al 7. Es un test validado en la investigación sobre hábitos.', 150),
            frase('mantequilla', 3, n, '«Lo hago sin tener que pensarlo.»', 'Así suena una de las cuatro. Las otras van por la misma línea: si te sale solo, si lo empiezas antes de darte cuenta.', 130),
            slide('lila', '<p class="lab" style="font-size:28px;margin-top:auto">Tu curva</p>'
                          '<p class="big" style="font-size:150px;margin-top:44px">Día 0, día 7, día 21.</p>'
                          '<div style="margin-top:70px">%s</div>'
                          '<p class="txt" style="font-size:44px;margin-top:70px;max-width:880px">Tres puntos para ver si sube. La primera vez lo haces antes de empezar.</p>' % linea(P['tomate'], 21, 912), der=num(4, n)),
            frase('bosque', 5, n, 'Si no sube, también es un dato.', 'Te dice que la señal no encaja o que el hábito era grande. Se ajusta y se sigue.', 150),
            frase('tomate', 6, n, '21 días es el arranque.', 'En el estudio de Lally (2010) la mediana para que un hábito saliera solo fue de 66 días. El 21 es cuando ya no empiezas de cero.', 150),
            cierre('cobalto', 7, n)]


def check(pareja, n, total, titulo, texto):
    return slide(pareja, '<div style="margin-top:auto;display:flex;gap:30px;align-items:flex-start">'
                         '<span style="flex:none;width:80px;height:80px;border:6px solid currentColor;border-radius:18px;margin-top:22px"></span>'
                         '<div><p class="big" style="font-size:130px">%s</p>'
                         '<p class="txt" style="font-size:44px;margin-top:40px;max-width:780px">%s</p></div></div>' % (titulo, texto), der=num(n, total))


def carrusel_preparado():
    n = 7
    return [portada('tomate', 'El fin de semana antes.', 'Cinco cosas para llegar al lunes 16 con todo listo. Guárdalo.', 190, n, color_candado=P['mantequilla']),
            check('rosa', 2, n, 'Tu señal, escrita.', '«Después de ___, hago ___.» Algo que ya haces todos los días.'),
            check('mantequilla', 3, n, 'Tu versión mínima.', 'Lo que harás el día malo: dos minutos también cuentan.'),
            check('cobalto', 4, n, 'Tu hora de check-in.', 'Un minuto fijo. Después de cenar o al meterte en la cama funciona bien.'),
            check('lila', 5, n, 'Se lo has dicho a alguien.', 'A una persona. O le has mandado tu enlace para que salga contigo.'),
            check('bosque', 6, n, 'La app a un toque.', 'Entra el domingo, haz el test del día 0 y guárdala en tu pantalla de inicio.'),
            cierre('tomate', 7, n, 'Lunes 16: salida.', 'Si aún no tienes dorsal, el enlace está en la bio. Gratis.')]


def carrusel_vispera():
    n = 6
    return [portada('rosa', 'Mañana es el lunes.', 'El que llevabas tiempo aplazando. Esta vez tiene fecha y grupo.', 200, n),
            frase('cobalto', 2, n, 'Hoy, dos minutos.', 'Entra en la app, escribe tu señal y haz el test del día 0. Mañana solo toca el check-in.', 170),
            frase('mantequilla', 3, n, 'Mañana, un minuto.', 'Haces tu hábito y lo marcas. El coach te contesta. Nada más.', 170),
            frase('lila', 4, n, 'Si un día fallas, la racha sigue.', 'Lo que pesa es el segundo seguido. Al día siguiente vuelves y ya está.', 140),
            frase('bosque', 5, n, 'El día 21 lo bloqueas.', 'No es la meta: es el arranque. Ya no empiezas de cero.', 160),
            cierre('rosa', 6, n, 'Nos vemos en la salida.', 'Si aún no tienes plaza, el siguiente grupo sale el lunes 30 de noviembre. Enlace en la bio.')]


# ---------------------------------------------------------------- reels (con audio de marca)
def reel_lunes_que_si():
    R = Reel('reel-lunes-que-si', 16.0)
    R.escena('mantequilla', 0, 2.8, T(R, '«El lunes|empiezo.»', 0.15, 200, estilo='margin-top:auto;margin-bottom:auto'), der='Lunes')
    R.escena('lila', 2.8, 5.2,
             T(R, '¿Qué lunes?', 2.9, 200, estilo='margin-top:auto') +
             F('<p class="txt" style="font-size:50px;max-width:860px">El de después de las fiestas, el del mes que viene, el de cuando tengas tiempo.</p>', 3.7, estilo='margin-top:50px;margin-bottom:auto'), der='¿?')
    R.escena('cobalto', 5.2, 8.4,
             '<p class="lab" style="font-size:30px;margin-top:auto">Este tiene fecha</p>' +
             T(R, 'Lunes|16 nov.', 5.3, 240, estilo='margin-top:20px') +
             F(linea_anim(P['rosa'], 5.6, 7.6, 1, 21), 5.4, estilo='margin-top:60px;margin-bottom:auto'), der='16·11')
    for i in range(21):
        R.ev('tic', 5.6 + 2.0 * (i / 20.0), 0.2)
    R.escena('tomate', 8.4, 11.6,
             F(candado_anim(P['mantequilla'], 220, cerrar=9.2, inicio='abierto'), 8.4, estilo='margin-top:auto;margin-bottom:70px') +
             T(R, 'Un hábito.|21 días.', 8.5, 160) +
             F('<p class="txt" style="font-size:46px;max-width:880px">Un check-in de un minuto. Gratis.</p>', 9.6, estilo='margin-top:40px'), der='01')
    R.ev('candado', 9.2)
    R.escena('rosa', 11.6, 13.2, T(R, 'Que no sea|otro lunes.', 11.7, 200, estilo='margin-top:auto;margin-bottom:auto'))
    cierre_grupo(R, 'cobalto', 13.2, 16.0, 'rlq')
    R.portada_t = 1.8
    return R


def reel_un_minuto():
    R = Reel('reel-un-minuto', 16.4)
    R.escena('cobalto', 0, 2.6, T(R, 'Un minuto|al día.', 0.15, 230, estilo='margin-top:auto;margin-bottom:auto'), der='00:60')
    R.escena('rosa', 2.6, 5.4,
             '<p class="lab" style="font-size:30px;margin-top:auto">Paso 01</p>' +
             T(R, 'Haces|tu hábito.', 2.7, 180, estilo='margin-top:20px') +
             F('<p class="med" style="font-size:66px;max-width:880px">«Después de comer, salgo a caminar.»</p>', 3.6, estilo='margin-top:50px;margin-bottom:auto'), der='01')
    R.escena('mantequilla', 5.4, 8.2,
             '<p class="lab" style="font-size:30px;margin-top:auto">Paso 02</p>' +
             T(R, 'Lo marcas.', 5.5, 200, estilo='margin-top:20px') +
             F(candado_anim(P['bosque'], 180, cerrar=6.6, inicio='abierto'), 5.6, estilo='margin-top:60px;margin-bottom:auto'), der='02')
    R.ev('candado', 6.6)
    R.escena('lila', 8.2, 11.4,
             '<p class="lab" style="font-size:30px;margin-top:auto">Paso 03</p>' +
             T(R, 'El coach|te contesta.', 8.3, 170, estilo='margin-top:20px') +
             F('<p class="txt" style="font-size:46px;max-width:880px">Es una IA y te lo dice. No da dietas ni consejos médicos: te ayuda a no soltarlo.</p>', 9.3, estilo='margin-top:50px;margin-bottom:auto'), der='03')
    R.escena('bosque', 11.4, 13.4,
             T(R, 'Y mañana,|otra vez.', 11.5, 190, estilo='margin-top:auto') +
             F(linea_anim(P['mantequilla'], 11.6, 13.0, 1, 2), 11.5, estilo='margin-top:60px;margin-bottom:auto'), der='02')
    cierre_grupo(R, 'cobalto', 13.4, 16.4, 'rum')
    R.portada_t = 1.6
    return R


def reel_dia_21_bloqueo():
    R = Reel('reel-dia-21-lo-bloqueo', 16.8)
    R.escena('rosa', 0, 3.0,
             F(candado_anim(P['cobalto'], 230, inicio='abierto'), 0.0, estilo='margin-top:auto;margin-bottom:70px') +
             T(R, 'El día 21|lo bloqueo.', 0.15, 190), der='21')
    R.escena('cobalto', 3.0, 6.6,
             '<p class="lab" style="font-size:30px;margin-top:auto">Día</p>' +
             '<p class="big" style="font-size:420px;line-height:.82"><span data-cuenta="1,21,3.3,5.8">01</span></p>' +
             F(linea_anim(P['rosa'], 3.3, 5.8, 1, 21), 3.15, estilo='margin-top:40px') +
             T(R, 'Un día detrás de otro.', 3.4, 90, estilo='margin-top:60px;margin-bottom:auto'), der='01—21')
    for i in range(21):
        R.ev('tic', 3.3 + 2.5 * (i / 20.0), 0.22)
    R.escena('tomate', 6.6, 10.0,
             F(candado_anim(P['mantequilla'], 260, cerrar=7.4, inicio='abierto'), 6.6, estilo='margin-top:auto;margin-bottom:70px') +
             T(R, 'Clac.', 7.45, 260, sonido=False) +
             F('<p class="med" style="font-size:66px;max-width:880px">Bloqueado: ya no empiezas de cero.</p>', 8.2, estilo='margin-top:40px;margin-bottom:auto'), der='21')
    R.ev('candado', 7.4)
    R.ev('golpe', 7.45, 0.7)
    R.escena('mantequilla', 10.0, 13.2,
             T(R, 'No es la meta.|Es el arranque.', 10.1, 150, estilo='margin-top:auto') +
             F('<p class="txt" style="font-size:44px;max-width:880px">La mediana fue de 66 días (Lally, 2010). Lo difícil es no soltarlo las primeras semanas.</p>', 11.1, estilo='margin-top:50px;margin-bottom:auto'), der='66')
    cierre_grupo(R, 'cobalto', 13.2, 16.8, 'rdb')
    R.portada_t = 7.9
    return R


def reel_segundo_seguido():
    R = Reel('reel-el-segundo-seguido', 16.0)
    R.escena('lila', 0, 2.8, T(R, '¿Fallaste|un día?', 0.15, 230, estilo='margin-top:auto;margin-bottom:auto'), der='08')
    R.escena('mantequilla', 2.8, 5.6,
             T(R, 'No pasa nada.', 2.9, 180, estilo='margin-top:auto') +
             F(linea_anim(P['bosque'], 3.2, 4.8, 1, 9), 3.0, estilo='margin-top:60px') +
             F('<p class="txt" style="font-size:48px;max-width:860px">La racha sigue. Un día malo le pasa a cualquiera.</p>', 3.9, estilo='margin-top:60px;margin-bottom:auto'), der='09')
    R.escena('tomate', 5.6, 8.4,
             T(R, 'Lo que pesa|es el segundo|seguido.', 5.7, 170, estilo='margin-top:auto;margin-bottom:auto'), der='10')
    R.ev('golpe', 6.3, 0.6)
    R.escena('cobalto', 8.4, 11.4,
             T(R, 'Al día siguiente,|la versión mínima.', 8.5, 130, estilo='margin-top:auto') +
             F('<p class="med" style="font-size:66px;max-width:880px">Dos minutos también cuentan.</p>', 9.5, estilo='margin-top:50px') +
             F(candado_anim(P['rosa'], 170, cerrar=10.6, inicio='abierto'), 9.6, estilo='margin-top:60px;margin-bottom:auto'), der='11')
    R.ev('candado', 10.6)
    R.escena('bosque', 11.4, 13.0, T(R, 'Nunca dos|seguidos.', 11.5, 220, estilo='margin-top:auto;margin-bottom:auto'))
    cierre_grupo(R, 'rosa', 13.0, 16.0, 'rss')
    R.portada_t = 6.9
    return R


def reel_tu_dorsal():
    R = Reel('reel-tu-dorsal', 16.4)
    f, t = PAREJAS['rosa']
    R.escena('cobalto', 0, 2.6, T(R, 'Esto va|de dorsales.', 0.15, 220, estilo='margin-top:auto;margin-bottom:auto'), der='Salida')
    R.escena('rosa', 2.6, 6.0,
             F(dorsal(t, f, '07', 'Grupo 01', 'Tu dorsal', ancho=760, agujeros=f), 2.7, pop=True, estilo='margin-top:auto;display:flex;justify-content:center') +
             T(R, 'Pides plaza,|sale tu número.', 3.4, 130, estilo='margin-top:70px;margin-bottom:auto'), der='07')
    R.ev('pop', 2.7, 0.7)
    R.escena('mantequilla', 6.0, 8.8,
             T(R, 'Lo cuentas.', 6.1, 200, estilo='margin-top:auto') +
             F('<p class="txt" style="font-size:48px;max-width:860px">Tu dorsal sale en imagen para tu historia. Decirlo en voz alta ata un poco más.</p>', 7.0, estilo='margin-top:50px;margin-bottom:auto'), der='Cuéntalo')
    R.escena('lila', 8.8, 11.6,
             T(R, 'Y lo haces|con alguien.', 8.9, 170, estilo='margin-top:auto') +
             F('<p class="txt" style="font-size:48px;max-width:860px">Con tu enlace, entra en tu mismo grupo y salen el mismo día.</p>', 9.9, estilo='margin-top:50px;margin-bottom:auto'), der='Con alguien')
    R.escena('tomate', 11.6, 13.4,
             T(R, 'Una carrera|contra el lunes.', 11.7, 160, estilo='margin-top:auto;margin-bottom:auto'))
    cierre_grupo(R, 'cobalto', 13.4, 16.4, 'rtd')
    R.portada_t = 4.6
    return R


def reel_senal_ganas():
    R = Reel('reel-senal-ganas', 16.0)
    R.escena('tomate', 0, 2.8, T(R, 'Las ganas|van y vienen.', 0.15, 210, estilo='margin-top:auto;margin-bottom:auto'), der='?')
    R.escena('mantequilla', 2.8, 5.6,
             T(R, 'El café de|la mañana, no.', 2.9, 170, estilo='margin-top:auto') +
             F('<p class="txt" style="font-size:48px;max-width:860px">Está ahí todos los días. Por eso es la mejor señal.</p>', 3.9, estilo='margin-top:50px;margin-bottom:auto'), der='Señal')
    R.escena('cobalto', 5.6, 9.0,
             '<p class="lab" style="font-size:30px;margin-top:auto">La frase</p>' +
             T(R, 'Después de X,|hago Y.', 5.7, 180, estilo='margin-top:20px') +
             F(candado_anim(P['rosa'], 170, cerrar=7.6, inicio='abierto'), 6.6, estilo='margin-top:60px;margin-bottom:auto'), der='X → Y')
    R.ev('candado', 7.6)
    R.escena('rosa', 9.0, 11.6,
             T(R, '«Después del café,|10 minutos|de movilidad.»', 9.1, 120, clase='med', estilo='margin-top:auto;margin-bottom:auto'), der='Ejemplo')
    R.escena('bosque', 11.6, 13.2, T(R, 'La señal pesa|más que las ganas.', 11.7, 150, estilo='margin-top:auto;margin-bottom:auto'))
    cierre_grupo(R, 'cobalto', 13.2, 16.0, 'rsg')
    R.portada_t = 7.9
    return R


def reel_seis_habitos():
    R = Reel('reel-seis-habitos', 16.8)
    R.escena('lila', 0, 2.6, T(R, '6 hábitos.|Eliges uno.', 0.15, 220, estilo='margin-top:auto;margin-bottom:auto'), der='01—06')
    items = [('cobalto', 2.6, '01', 'Entrenar|3 días'), ('rosa', 4.0, '02', '8.000|pasos'), ('mantequilla', 5.4, '03', 'Cama antes|de las 23:30'),
             ('bosque', 6.8, '04', 'Sin pantalla|al dormir'), ('tomate', 8.2, '05', '10 min de|movilidad'), ('lila', 9.6, '06', '2 litros|de agua')]
    for pareja, t0, n, texto in items:
        R.escena(pareja, t0, t0 + 1.4, '<p class="lab" style="font-size:30px;margin-top:auto">Hábito %s</p>' % n + T(R, texto, t0 + 0.05, 190, estilo='margin-top:20px;margin-bottom:auto'), der=n)
    R.escena('mantequilla', 11.0, 13.8,
             F(candado_anim(P['bosque'], 200, cerrar=11.8, inicio='abierto'), 11.0, estilo='margin-top:auto;margin-bottom:60px') +
             T(R, 'No los seis.|El que te veas|sosteniendo.', 11.1, 140, estilo='margin-bottom:auto'), der='1')
    R.ev('candado', 11.8)
    cierre_grupo(R, 'cobalto', 13.8, 16.8, 'r6h')
    R.portada_t = 1.6
    return R


def reel_dia_1():
    R = Reel('reel-dia-1', 15.6)
    R.escena('cobalto', 0, 2.8,
             '<p class="lab" style="font-size:30px;margin-top:auto">Lunes 16 nov</p>' +
             T(R, 'Hoy es|el día 1.', 0.15, 240, estilo='margin-top:20px;margin-bottom:auto'), der='01')
    R.escena('rosa', 2.8, 5.8,
             F(candado_anim(P['cobalto'], 230, cerrar=3.8, inicio='abierto'), 2.8, estilo='margin-top:auto;margin-bottom:70px') +
             T(R, 'Sale el|grupo 01.', 2.9, 190, estilo='margin-bottom:auto'), der='Salida')
    R.ev('candado', 3.8)
    R.escena('mantequilla', 5.8, 8.8,
             T(R, 'Hoy, un minuto.', 5.9, 160, estilo='margin-top:auto') +
             F('<p class="txt" style="font-size:48px;max-width:860px">Haces tu hábito y lo marcas en la app. Nada más.</p>', 6.8, estilo='margin-top:50px') +
             F(linea_anim(P['bosque'], 6.2, 7.4, 1, 1), 6.0, estilo='margin-top:60px;margin-bottom:auto'), der='01/21')
    R.escena('lila', 8.8, 11.6,
             T(R, 'Faltan 20.|Uno detrás|de otro.', 8.9, 170, estilo='margin-top:auto;margin-bottom:auto'), der='20')
    R.escena('tomate', 11.6, 15.6,
             F('<div style="width:460px">%s</div>' % insignia(P['mantequilla'], P['tomate'], 460, uid='rd1'), 11.65, pop=True, estilo='margin:auto 0 60px') +
             T(R, '¿Te lo perdiste?|Grupo 02: lunes 30.', 12.2, 120) +
             F('<p class="txt" style="font-size:46px">Gratis. Enlace en la bio.</p>', 13.1, estilo='margin-top:34px;margin-bottom:auto'), der='02')
    R.ev('final', 11.6)
    R.ev('pop', 13.1, 0.6)
    R.portada_t = 1.6
    return R


# ---------------------------------------------------------------- historias
CALENTAMIENTOS = {
    '2026-11-01': ('rosa', 'Mira tu domingo.', '¿Qué haces todos los días sin pensar? Café, ducha, salir del trabajo. Ahí va a ir tu hábito.'),
    '2026-11-02': ('bosque', 'Hazlo 2 minutos hoy.', 'Solo dos. Empezar pequeño también es empezar.'),
    '2026-11-03': ('lila', 'Elige tu versión mínima.', 'Lo que harás el día malo. Dos minutos de lo mismo, sin excusas.'),
    '2026-11-04': ('cobalto', 'Dile a alguien tu hábito.', 'A una persona, por mensaje. Decirlo en voz alta ya lo hace más real.'),
    '2026-11-05': ('mantequilla', 'Prepáralo la noche antes.', 'Zapatillas en la puerta, botella llena, móvil cargando fuera del cuarto.'),
    '2026-11-06': ('tomate', '¿A qué hora harás el check-in?', 'Un minuto fijo. Después de cenar o al meterte en la cama funciona bien.'),
    '2026-11-07': ('rosa', 'Escribe tu porqué.', 'Una frase sincera. No para nadie más: para el día que no te apetezca.'),
    '2026-11-08': ('bosque', 'Ensaya tu señal.', 'Hoy, cuando llegue tu momento, haz la versión de dos minutos. Solo para ver cómo encaja.'),
    '2026-11-09': ('lila', 'Quita un obstáculo.', 'Lo que más te frena: el móvil en la mesita, las zapatillas en el armario. Muévelo hoy.'),
    '2026-11-10': ('cobalto', 'Piensa en tu plan B.', '«Si no lo hago a mi hora, lo hago en versión corta antes de dormir.»'),
    '2026-11-11': ('mantequilla', 'Comparte tu dorsal.', 'Si ya tienes plaza, tu imagen está en el correo de bienvenida. Etiqueta a @reto.lock21.'),
    '2026-11-12': ('tomate', 'Invita a alguien.', 'Con tu enlace entra en tu mismo grupo y salen el mismo día.'),
    '2026-11-13': ('rosa', 'Revisa tu señal.', '¿Es algo que haces de verdad todos los días? Si no, cámbiala ahora, no el día 3.'),
    '2026-11-14': ('bosque', 'Deja la app a un toque.', 'Ábrela, entra con tu correo y guárdala en tu pantalla de inicio.'),
    '2026-11-15': ('lila', 'Haz el test del día 0.', 'Cuatro preguntas, dos minutos. Así mañana solo toca el check-in.'),
    '2026-11-16': ('cobalto', 'Hoy empieza.', 'Día 1 de 21. Haz tu hábito, márcalo en la app y listo. Un minuto.'),
}

# Faltan N días para el lunes 16. Los sábados 7 y 14 se dejan libres (historia con cifras reales).
CUENTA = {
    '2026-11-01': ('cobalto', 'Y el lunes 16 sale el grupo 01. Gratis, sin tarjeta.'),
    '2026-11-02': ('mantequilla', 'Dos semanas para elegir tu hábito sin prisa.'),
    '2026-11-03': ('rosa', 'Cada plaza lleva dorsal. ¿Ya tienes el tuyo?'),
    '2026-11-04': ('bosque', 'Un hábito, un minuto al día, 21 días.'),
    '2026-11-05': ('lila', 'El lunes que llevas tiempo aplazando ya tiene fecha.'),
    '2026-11-06': ('tomate', 'Si fallas un día, la racha sigue. El día 21 lo bloqueas.'),
    '2026-11-08': ('cobalto', 'Una semana y un día. Esta semana, elige tu señal.'),
    '2026-11-09': ('mantequilla', 'Una semana. Hazlo con alguien: comparte tu enlace.'),
    '2026-11-10': ('rosa', 'El coach es una IA y te lo dice. El reto lo haces tú.'),
    '2026-11-11': ('bosque', 'Gratis, sin tarjeta y sin promesas: un método y tus datos.'),
    '2026-11-12': ('lila', 'Pide plaza con tu correo. Tu dorsal sale al momento.'),
    '2026-11-13': ('tomate', 'Este fin de semana, prepara la salida.'),
    '2026-11-15': ('cobalto', 'Hoy, el test del día 0: cuatro preguntas, dos minutos.'),
    '2026-11-16': ('rosa', 'Día 1 en marcha. ¿Has hecho tu check-in?'),
}

SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']


def etiqueta(fecha):
    import datetime
    d = datetime.date.fromisoformat(fecha)
    return '%s %d' % (SEMANA[d.weekday()], d.day)


def faltan(fecha):
    import datetime
    return (datetime.date(2026, 11, 16) - datetime.date.fromisoformat(fecha)).days


def historia_calentamiento(fecha):
    pareja, titulo, texto = CALENTAMIENTOS[fecha]
    pie_h = 'Es la misión diaria de quienes ya tienen plaza, mientras empieza su grupo.' if fecha < '2026-11-16' else 'Grupo 01 · día 1 de 21.'
    lab = 'Calentamiento · 1 minuto' if fecha < '2026-11-16' else 'Salida · grupo 01'
    return historia(pareja, '<p class="lab" style="font-size:28px;margin-top:80px">%s</p>'
                            '<p class="big" style="font-size:160px;margin-top:auto">%s</p>'
                            '<p class="txt" style="font-size:50px;margin-top:50px">%s</p>'
                            '<p class="txt" style="font-size:34px;margin-top:auto;opacity:.75">%s</p>' % (lab, titulo, texto, pie_h), der=etiqueta(fecha))


def historia_cuenta(fecha):
    pareja, texto = CUENTA[fecha]
    f, t = PAREJAS[pareja]
    n = faltan(fecha)
    if n == 0:
        numero, titulo, arriba, abajo = '01', 'Día 1 de 21.', 'Grupo 01', 'en marcha'
    elif n == 1:
        numero, titulo, arriba, abajo = '1', 'Mañana empezamos.', 'Cuenta atrás', 'día para la salida'
    else:
        numero, titulo, arriba, abajo = str(n), 'Faltan %d días.' % n, 'Cuenta atrás', 'días para la salida'
    return historia(pareja, '<p class="lab" style="font-size:28px;margin-top:80px">%s · grupo 01</p>'
                            '<div style="margin:auto 0;display:flex;justify-content:center">%s</div>'
                            '<p class="big" style="font-size:150px">%s</p>'
                            '<p class="txt" style="font-size:48px;margin-top:36px">%s</p>'
                            '<p class="txt" style="font-size:36px;margin-top:30px;opacity:.75">El enlace está en la bio.</p>' % (
                                'Salida' if n == 0 else 'Cuenta atrás', dorsal(t, f, numero, arriba, abajo, ancho=760, agujeros=f), titulo, texto), der=etiqueta(fecha))


# ---------------------------------------------------------------- pies
PIES = {
    'carrusel-no-es': pie("Lo que Lock21 no es, para que sepas exactamente dónde te metes.\n\nNo es una dieta, no cuenta calorías, no da consejos médicos y no es un programa para dejar de fumar ni de beber. El coach del día a día es una IA y lo dice en cada mensaje. Y no cuesta nada.\n\nLo que sí es: un hábito del menú, 21 días y un check-in de un minuto. Un proyecto de Balancet, desde Gran Canaria.\n\n¿Te queda alguna duda? Pregúntame en comentarios."),
    'reel-lunes-que-si': pie("«El lunes empiezo.» ¿Qué lunes?\n\nEl de después de las fiestas, el del mes que viene, el de cuando tengas tiempo. Este tiene fecha: lunes 16 de noviembre, salida del grupo 01.\n\nUn hábito, 21 días, un minuto al día.\n\n¿Qué es lo que tú dejas siempre para el lunes?"),
    'carrusel-dorsal': pie("Cada plaza de Lock21 lleva dorsal, como en una carrera.\n\nEliges tu hábito, pides plaza y al momento sale tu número dentro de tu grupo. Si quieres, lo cuentas con tu imagen en una historia. Y si alguien se anima, con tu enlace entra en tu mismo grupo y salen el mismo día.\n\nLa carrera no es contra nadie: es contra el «ya empezaré»."),
    'reel-un-minuto': pie("Así es un día en Lock21: un minuto.\n\nHaces tu hábito, lo marcas y el coach te contesta. El coach es una IA y te lo dice; no da dietas ni consejos médicos, te ayuda a no soltarlo. Y mañana, otra vez.\n\nSalida del grupo 01: lunes 16 de noviembre. Gratis."),
    'carrusel-que-habito': pie("¿Qué hábito te toca? Seis situaciones y el hábito con el que empezaría en cada una.\n\nNo hace falta elegir el más difícil. Elige el que te veas sosteniendo 21 días: el resto puede venir después.\n\nCuéntame en comentarios cuál es el tuyo."),
    'reel-dia-21-lo-bloqueo': pie("El día 21 lo bloqueo.\n\nNo porque el hábito quede hecho para siempre: en el estudio más citado (Lally, 2010) la mediana fue de 66 días. El día 21 es el arranque, el momento en que ya no empiezas de cero.\n\nUn día detrás de otro hasta el clac."),
    'carrusel-con-alguien': pie("Hazlo con alguien.\n\nNo para vigilarse, sino para que alguien te pregunte «¿hoy qué?». Cada uno con su hábito, la misma salida y la misma línea de 21 días.\n\nAl pedir plaza tienes tu enlace para invitar: quien entra con él va a tu mismo grupo mientras queden plazas.\n\n¿A quién se lo mandarías? Etiquétalo."),
    'reel-el-segundo-seguido': pie("¿Fallaste un día? No pasa nada, la racha sigue.\n\nUn día malo le pasa a cualquiera. Lo que de verdad pesa es el segundo seguido. Por eso al día siguiente toca la versión mínima: dos minutos también cuentan.\n\nGuárdalo para el día que lo necesites."),
    'carrusel-quien': pie("Detrás de Lock21 no hay un experto. Hay alguien que cambió sus hábitos de uno en uno.\n\nSoy Juanma, de Las Palmas de Gran Canaria. Me estoy formando en entrenamiento y he juntado lo que me funcionó a mí con lo que estoy aprendiendo sobre cómo se forman los hábitos. Lock21 es un proyecto de Balancet y el reto es gratis.\n\nYo también salgo con el grupo 01. Pregúntame lo que quieras."),
    'reel-tu-dorsal': pie("Esto va de dorsales.\n\nPides plaza y sale tu número. Lo cuentas, si quieres, con tu imagen. Y lo haces con alguien: con tu enlace entra en tu mismo grupo.\n\nUna carrera contra el lunes que nunca llega. Salida: lunes 16 de noviembre."),
    'carrusel-test': pie("¿Cómo sabrás si tu hábito ya te sale solo? Con números.\n\nEn Lock21 haces un test de 4 preguntas los días 0, 7 y 21: un test de automaticidad validado en la investigación sobre hábitos. Tres puntos para ver si tu curva sube. Y si no sube, también es un dato para ajustar.\n\nLa primera vez lo haces antes de empezar."),
    'reel-senal-ganas': pie("Las ganas van y vienen. El café de la mañana, no.\n\nPor eso en Lock21 atas tu hábito a algo que ya haces todos los días: después de X, hago Y. La señal pesa más que las ganas.\n\n¿Cuál sería tu frase? Escríbela en comentarios."),
    'carrusel-preparado': pie("El fin de semana antes de la salida. Cinco cosas para llegar al lunes 16 con todo listo: tu señal escrita, tu versión mínima, tu hora de check-in, alguien que lo sepa y la app a un toque con el test del día 0 hecho.\n\nGuárdalo y repásalo el domingo."),
    'reel-seis-habitos': pie("6 hábitos en el menú de Lock21 y eliges uno.\n\nEntrenar 3 días, 8.000 pasos, cama antes de las 23:30, sin pantalla al dormir, 10 minutos de movilidad o 2 litros de agua. No los seis: el que te veas sosteniendo 21 días.\n\nEl lunes salimos."),
    'carrusel-vispera': pie("Mañana es el lunes. El que llevabas tiempo aplazando, esta vez con fecha y grupo.\n\nHoy, dos minutos: entra en la app, escribe tu señal y haz el test del día 0. Mañana solo toca el check-in.\n\nSi aún no tienes plaza, el grupo 02 sale el lunes 30 de noviembre.\n\nNos vemos en la salida."),
    'reel-dia-1': pie("Hoy es el día 1. Sale el grupo 01 de Lock21.\n\nUn minuto: haces tu hábito y lo marcas en la app. Faltan 20, uno detrás de otro. Te iré contando cómo va el grupo, también lo que no salga bien.\n\n¿Te lo has perdido? El grupo 02 sale el lunes 30 de noviembre."),
}

PLAN = {
    '2026-11-01': ('carrusel', 'carrusel-no-es', carrusel_no_es),
    '2026-11-02': ('reel', 'reel-lunes-que-si', reel_lunes_que_si),
    '2026-11-03': ('carrusel', 'carrusel-dorsal', carrusel_dorsal),
    '2026-11-04': ('reel', 'reel-un-minuto', reel_un_minuto),
    '2026-11-05': ('carrusel', 'carrusel-que-habito', carrusel_que_habito),
    '2026-11-06': ('reel', 'reel-dia-21-lo-bloqueo', reel_dia_21_bloqueo),
    '2026-11-07': ('carrusel', 'carrusel-con-alguien', carrusel_con_alguien),
    '2026-11-08': ('reel', 'reel-el-segundo-seguido', reel_segundo_seguido),
    '2026-11-09': ('carrusel', 'carrusel-quien', carrusel_quien),
    '2026-11-10': ('reel', 'reel-tu-dorsal', reel_tu_dorsal),
    '2026-11-11': ('carrusel', 'carrusel-test', carrusel_test),
    '2026-11-12': ('reel', 'reel-senal-ganas', reel_senal_ganas),
    '2026-11-13': ('carrusel', 'carrusel-preparado', carrusel_preparado),
    '2026-11-14': ('reel', 'reel-seis-habitos', reel_seis_habitos),
    '2026-11-15': ('carrusel', 'carrusel-vispera', carrusel_vispera),
    '2026-11-16': ('reel', 'reel-dia-1', reel_dia_1),
}


def generar(fechas):
    with Render() as r:
        for fecha in fechas:
            tipo, slug, fn = PLAN[fecha]
            out = BASE / fecha
            if tipo == 'carrusel':
                for i, html in enumerate(fn()):
                    r.png(html, 1080, 1350, out / slug / ('%02d.jpg' % (i + 1)))
            r.png(historia_calentamiento(fecha), 1080, 1920, out / 'historias' / '1000_calentamiento.jpg')
            if fecha in CUENTA:
                r.png(historia_cuenta(fecha), 1080, 1920, out / 'historias' / '2000_cuenta-atras.jpg')
            print('ok', out)
        if not os.environ.get('SIN_REELS'):
            for fecha in fechas:
                tipo, slug, fn = PLAN[fecha]
                if tipo == 'reel':
                    renderizar(r.br, fn(), BASE / fecha / slug)
                    print('reel ok', fecha, slug)


def escribir(nombre, datos):
    (REPO / 'contenido' / 'cola' / nombre).write_text(json.dumps(datos, ensure_ascii=False, indent=2), encoding='utf-8')


def encolar(fechas):
    tz = '+00:00'  # hora de invierno en Canarias
    for fecha in fechas:
        assert '2026-11-01' <= fecha <= '2026-11-16'
        tipo, slug, fn = PLAN[fecha]
        src, dst = BASE / fecha, REPO / 'public' / 'redes' / fecha
        (dst / 'historias').mkdir(parents=True, exist_ok=True)
        historias = [('1000', 'historia-calentamiento' if fecha < '2026-11-16' else 'historia-hoy-empieza', '1000_calentamiento.jpg')]
        if fecha in CUENTA:
            historias.append(('2000', 'historia-cuenta-atras' if fecha < '2026-11-16' else 'historia-dia-1', '2000_cuenta-atras.jpg'))
        for hhmm, nombre, origen in historias:
            shutil.copy(src / 'historias' / origen, dst / 'historias' / origen)
            escribir('%s_%s_%s.json' % (fecha, hhmm, nombre), {'tipo': 'historia', 'pie': '', 'estado': 'programado', 'origen': 'semana_1_16nov.py',
                                                              'archivos': ['redes/%s/historias/%s' % (fecha, origen)], 'fecha': '%sT%s:%s:00%s' % (fecha, hhmm[:2], hhmm[2:], tz)})
        if tipo == 'carrusel':
            fotos = sorted((src / slug).glob('*.jpg'))
            (dst / slug).mkdir(exist_ok=True)
            for f in fotos:
                shutil.copy(f, dst / slug / f.name)
            datos = {'tipo': 'carrusel', 'pie': PIES[slug], 'estado': 'programado', 'origen': 'semana_1_16nov.py ' + fn.__name__,
                     'archivos': ['redes/%s/%s/%s' % (fecha, slug, f.name) for f in fotos], 'colaboradores': ['juanma89pr']}
        else:
            if not (src / slug / 'reel.mp4').exists():
                print('falta el reel', src / slug)
                continue
            (dst / slug).mkdir(exist_ok=True)
            for f in ('reel.mp4', 'portada.jpg'):
                shutil.copy(src / slug / f, dst / slug / f)
            datos = {'tipo': 'reel', 'pie': PIES[slug], 'estado': 'programado', 'origen': 'semana_1_16nov.py ' + fn.__name__,
                     'archivos': ['redes/%s/%s/reel.mp4' % (fecha, slug)], 'portada': 'redes/%s/%s/portada.jpg' % (fecha, slug),
                     'audio': 'Lock21 · Sonido del reto', 'colaboradores': ['juanma89pr']}
        datos['fecha'] = '%sT19:30:00%s' % (fecha, tz)
        escribir('%s_1930_%s.json' % (fecha, slug), datos)
        print('encolado', fecha)


if __name__ == '__main__':
    fechas = [os.environ['SOLO']] if os.environ.get('SOLO') else sorted(PLAN)
    if not os.environ.get('SOLO_ENCOLAR'):
        generar(fechas)
    if os.environ.get('ENCOLAR') or os.environ.get('SOLO_ENCOLAR'):
        encolar(fechas)
