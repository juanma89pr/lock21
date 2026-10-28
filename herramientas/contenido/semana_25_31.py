"""Semana del 25 al 31 oct 2026 con la identidad 2: carruseles e historias (los reels están en dinamico2.py).

Uso:
  python3 semana_25_31.py                 genera todo en /home/claude/lock21-contenido/identidad2/<fecha>/
  SOLO=2026-10-25 python3 semana_25_31.py  solo un día
  ENCOLAR=1 python3 semana_25_31.py        además copia a public/redes/<fecha>/ y escribe contenido/cola/*.json
                                           (los reels se encolan si ya existe su reel.mp4 en la carpeta de salida)
"""
import json
import os
import shutil
from pathlib import Path

from identidad2 import P, PAREJAS, Render, candado, dorsal, historia, insignia, linea, slide

BASE = Path(os.environ.get('BASE', '/home/claude/lock21-contenido/identidad2'))
REPO = Path(__file__).resolve().parents[2]
HASH = '#hábitos #reto21días #constancia #GranCanaria #LasPalmasDeGranCanaria'


def tinta(pareja):
    return PAREJAS[pareja][1]


def fondo(pareja):
    return PAREJAS[pareja][0]


def cierre(pareja, n, total, titulo='Próximo grupo: lunes 16 nov.', texto='Gratis. 30 plazas. El enlace para pedir la tuya está en la bio.'):
    f, t = PAREJAS[pareja]
    return slide(pareja, '<div style="margin:auto 0;display:flex;justify-content:center">%s</div>'
                 '<p class="big" style="font-size:110px">%s</p>'
                 '<p class="txt" style="font-size:42px;margin-top:30px;max-width:880px">%s</p>' % (dorsal(t, f, '16', 'Grupo 01', 'Salida', ancho=600, agujeros=f), titulo, texto),
                 der='%02d/%02d' % (n, total))


def habito(num, nombre, nota):
    return ('<div style="display:flex;gap:40px;align-items:baseline;margin-top:64px">'
            '<span class="lab" style="font-size:28px;min-width:56px">%s</span>'
            '<div><p class="med" style="font-size:92px">%s</p><p class="txt" style="font-size:38px;margin-top:18px;max-width:760px;opacity:.85">%s</p></div></div>') % (num, nombre, nota)


# ---------------------------------------------------------------- carruseles
def carrusel_6_habitos():
    s = [slide('rosa', '<div style="margin:auto 0 64px">%s</div>'
                       '<p class="big" style="font-size:190px">6 hábitos para empezar.</p>'
                       '<p class="txt" style="font-size:44px;margin-top:44px;max-width:840px">Elige uno. No los seis: el que te veas sosteniendo 21 días.</p>' % candado(P['cobalto'], 150), der='01/07'),
         slide('cobalto', '<p class="lab" style="font-size:28px;margin-top:auto">Moverte</p>' +
               habito('01', 'Entrenar 3 días por semana', 'Con días fijos en el calendario, no «cuando pueda».') +
               habito('02', '8.000 pasos', 'Caminando al trabajo, después de comer o al hablar por teléfono.'), der='02/07'),
         slide('mantequilla', '<p class="lab" style="font-size:28px;margin-top:auto">Descansar</p>' +
               habito('03', 'Cama antes de las 23:30', 'Una hora de acostarte que se repite, también el viernes.') +
               habito('04', 'Sin pantalla al dormir', 'El móvil se queda fuera del cuarto o lejos de la mano.'), der='03/07'),
         slide('lila', '<p class="lab" style="font-size:28px;margin-top:auto">Cuidarte</p>' +
               habito('05', '10 min de movilidad', 'Diez minutos para soltar el cuerpo, sin material.') +
               habito('06', '2 litros de agua', 'Una botella a la vista hace casi todo el trabajo.'), der='04/07'),
         slide('bosque', '<p class="big" style="font-size:150px;margin-top:auto">¿Por qué solo uno?</p>'
                         '<p class="txt" style="font-size:44px;margin-top:50px;max-width:880px">Cuando lo cambias todo a la vez, el primer día malo se lo lleva todo por delante. Con uno, toda tu energía va al mismo sitio.</p>', der='05/07'),
         slide('tomate', '<p class="big" style="font-size:150px;margin-top:auto">Elige el que menos pereza te dé.</p>'
                         '<p class="txt" style="font-size:44px;margin-top:50px;max-width:880px">No el que más impresione. Si dudas entre dos, quédate con el más pequeño. El otro puede venir después.</p>', der='06/07'),
         cierre('rosa', 7, 7)]
    return s


def carrusel_fallar():
    s = [slide('lila', '<p class="big" style="font-size:200px;margin-top:auto">Si fallas un día, la racha sigue.</p>'
                       '<div style="margin-top:70px">%s</div>' % linea(P['tomate'], 9, 912), der='01/07'),
         slide('bosque', '<p class="big" style="font-size:150px;margin-top:auto">Un día malo no es un hábito roto.</p>'
                         '<p class="txt" style="font-size:44px;margin-top:50px;max-width:880px">En el estudio de Lally (2010), saltarse un día suelto apenas cambió el proceso. Lo que pesa es dejarlo estar.</p>', der='02/07'),
         slide('mantequilla', '<p class="big" style="font-size:190px;margin-top:auto">Lo que cuenta es volver.</p>'
                              '<p class="txt" style="font-size:44px;margin-top:50px;max-width:880px">Al día siguiente haces el check-in como siempre. Sin compensar, sin hacer el doble, sin castigarte.</p>', der='03/07'),
         slide('cobalto', '<p class="big" style="font-size:190px;margin-top:auto">Nunca dos seguidos.</p>'
                          '<p class="txt" style="font-size:44px;margin-top:50px;max-width:880px">Si ayer fallaste, hoy toca la versión más pequeña. Dos minutos también cuentan.</p>', der='04/07'),
         slide('rosa', '<p class="lab" style="font-size:28px;margin-top:auto">Tu plan B</p>'
                       '<p class="big" style="font-size:120px;margin-top:40px">Decide hoy qué harás si fallas.</p>'
                       '<p class="med" style="font-size:64px;margin-top:60px;max-width:880px">«Si no salgo a caminar después de comer, doy una vuelta después de cenar.»</p>', der='05/07'),
         slide('tomate', '<div style="margin:auto 0 60px">%s</div><p class="big" style="font-size:140px">El coach no te riñe.</p>'
                         '<p class="txt" style="font-size:44px;margin-top:44px;max-width:880px">En el check-in le cuentas qué pasó y te ayuda a volver mañana. Es una IA, y te lo dice.</p>' % candado(P['mantequilla'], 170), der='06/07'),
         cierre('cobalto', 7, 7)]
    return s


def ejemplo(pareja, n, habito_txt, frase):
    return slide(pareja, '<p class="lab" style="font-size:28px;margin-top:auto">Ejemplo · %s</p>'
                         '<p class="big" style="font-size:150px;margin-top:44px">%s</p>' % (habito_txt, frase), der='%02d/07' % n)


def carrusel_senal():
    s = [slide('mantequilla', '<p class="big" style="font-size:230px;margin-top:auto">Después de X, hago Y.</p>'
                              '<p class="txt" style="font-size:44px;margin-top:50px;max-width:860px">Cómo atar un hábito a algo que ya haces, para no depender de acordarte.</p>', der='01/07'),
         slide('cobalto', '<p class="big" style="font-size:140px;margin-top:auto">La señal es algo que ya haces sin pensar.</p>'
                          '<p class="txt" style="font-size:44px;margin-top:50px;max-width:880px">El café de la mañana, lavarte los dientes, llegar a casa, cerrar el portátil. Ya están en tu día: solo hay que engancharles algo.</p>', der='02/07'),
         ejemplo('rosa', 3, '8.000 pasos', '«Después de comer, salgo a caminar.»'),
         ejemplo('bosque', 4, 'movilidad', '«Después del café, 10 minutos de movilidad.»'),
         ejemplo('lila', 5, 'sin pantalla al dormir', '«Después de cenar, el móvil se queda en la cocina.»'),
         ejemplo('tomate', 6, 'cama antes de las 23:30', '«Después de lavarme los dientes, a la cama.»'),
         slide('rosa', '<p class="lab" style="font-size:28px;margin-top:auto">Tu turno</p>'
                       '<p class="big" style="font-size:150px;margin-top:44px">Después de ___, hago ___.</p>'
                       '<p class="txt" style="font-size:44px;margin-top:50px;max-width:880px">Concreta y pequeña. Es lo primero que eliges en Lock21. Próximo grupo: lunes 16 nov, enlace en la bio.</p>'
                       '<div style="margin-top:60px">%s</div>' % linea(P['cobalto'], 1, 912), der='07/07')]
    return s


def frase(pareja, n, texto, size=150, extra=''):
    return slide(pareja, '<p class="big" style="font-size:%dpx;margin:auto 0">%s</p>%s' % (size, texto, extra), der='%02d/07' % n)


def carrusel_constancia():
    s = [slide('bosque', '<div style="margin:auto 0 64px">%s</div><p class="big" style="font-size:180px">Constancia no es motivación.</p>' % candado(P['mantequilla'], 150), der='01/07'),
         frase('rosa', 2, 'La motivación viene y va. La constancia se queda.'),
         frase('lila', 3, 'Hacerlo en pequeño también es hacerlo.'),
         frase('mantequilla', 4, 'No esperes a tener ganas. Ponlo fácil.'),
         frase('cobalto', 5, 'Un día flojo también cuenta.', extra='<div style="margin-bottom:20px">%s</div>' % linea(P['rosa'], 12, 912)),
         frase('tomate', 6, 'Tranquilo y todos los días gana a intenso y a ratos.', size=130),
         cierre('rosa', 7, 7, 'Un hábito.<br>21 días. Sin prisa.', 'Próximo grupo: lunes 16 nov. Gratis, 30 plazas. El enlace está en la bio.')]
    return s


# ---------------------------------------------------------------- historias
CALENTAMIENTOS = {
    '2026-10-25': ('rosa', 'Hazlo 2 minutos hoy.', 'Solo dos. Sal a la calle, estira o deja la botella llena. Empezar pequeño también es empezar.'),
    '2026-10-26': ('bosque', 'Prepáralo la noche antes.', 'Las zapatillas en la puerta, la botella llena, el móvil cargando fuera del cuarto. Que mañana cueste menos.'),
    '2026-10-27': ('lila', '¿Qué harás si fallas un día?', 'Escríbelo ya: «si no lo hago a mi hora, lo hago en versión corta antes de dormir».'),
    '2026-10-28': ('cobalto', 'Dile a alguien tu hábito.', 'A una persona, por mensaje. No para que te vigile: decirlo en voz alta ya lo hace más real.'),
    '2026-10-29': ('mantequilla', 'Elige la señal de tu hábito.', 'Completa la frase: «después de ___, hago ___». Algo que ya hagas todos los días.'),
    '2026-10-30': ('tomate', '¿A qué hora harás el check-in?', 'Elige un momento fijo. Es un minuto: después de cenar o al meterte en la cama funciona bien.'),
    '2026-10-31': ('rosa', 'Escribe tu porqué otra vez.', 'Una semana después, ¿sigue siendo el mismo? Una frase sincera basta.'),
}

CUENTA = {
    '2026-10-25': ('cobalto', 22, 'Para que empiece el próximo grupo: lunes 16 de noviembre. Gratis, 30 plazas.'),
    '2026-10-26': ('mantequilla', 21, 'Lo mismo que dura el reto. Para elegir tu hábito sin prisa.'),
    '2026-10-27': ('rosa', 20, 'Esta vez el lunes tiene fecha: 16 de noviembre.'),
    '2026-10-28': ('bosque', 19, 'Si ya tienes plaza, mañana te llega otra misión de calentamiento.'),
    '2026-10-29': ('lila', 18, 'Un hábito, un minuto al día, 21 días. Gratis.'),
    '2026-10-30': ('cobalto', 17, 'Grupos cada dos semanas. El próximo sale el lunes 16 de noviembre.'),
    # Sábado 31: las 20:00 quedan libres para historia_cifras.py (cifras reales).
}

DIAS = {'2026-10-25': 'Dom 25', '2026-10-26': 'Lun 26', '2026-10-27': 'Mar 27', '2026-10-28': 'Mié 28', '2026-10-29': 'Jue 29', '2026-10-30': 'Vie 30', '2026-10-31': 'Sáb 31'}


def historia_calentamiento(fecha):
    pareja, titulo, texto = CALENTAMIENTOS[fecha]
    return historia(pareja, '<p class="lab" style="font-size:28px;margin-top:80px">Calentamiento · 1 minuto</p>'
                            '<p class="big" style="font-size:160px;margin-top:auto">%s</p>'
                            '<p class="txt" style="font-size:50px;margin-top:50px">%s</p>'
                            '<p class="txt" style="font-size:34px;margin-top:auto;opacity:.75">Es la misión diaria de quienes ya tienen plaza, mientras empieza su grupo.</p>' % (titulo, texto), der=DIAS[fecha])


def historia_cuenta(fecha):
    pareja, n, texto = CUENTA[fecha]
    f, t = PAREJAS[pareja]
    return historia(pareja, '<p class="lab" style="font-size:28px;margin-top:80px">Cuenta atrás · grupo 01</p>'
                            '<div style="margin:auto 0;display:flex;justify-content:center">%s</div>'
                            '<p class="big" style="font-size:150px">Faltan %d días.</p>'
                            '<p class="txt" style="font-size:48px;margin-top:36px">%s</p>'
                            '<p class="txt" style="font-size:36px;margin-top:30px;opacity:.75">El enlace está en la bio.</p>' % (
                                dorsal(t, f, str(n), 'Cuenta atrás', 'días para la salida', ancho=760, agujeros=f), n, texto), der=DIAS[fecha])


# ---------------------------------------------------------------- pies
PIES = {
    'carrusel-6-habitos': "6 hábitos para empezar, y la idea es que elijas solo uno.\n\nYo intenté cambiarlo todo de golpe muchas veces y siempre acababa en «el lunes empiezo». Lo que funcionó fue ir de uno en uno.\n\nEn Lock21 eliges uno de estos seis y lo sostienes 21 días, con un check-in de un minuto al día. Próximo grupo: lunes 16 de noviembre, gratis. El enlace está en la bio.\n\n¿Cuál elegirías tú?\n\n" + HASH,
    'reel-lunes': "Antes lo dejaba todo para el lunes. Dejar de fumar, beber menos los fines de semana, moverme más… siempre había otro lunes.\n\nNo me cambió un lunes. Me cambió un hábito, y luego otro.\n\nLock21 es eso: un hábito, 21 días y un check-in de un minuto. Próximo grupo: lunes 16 de noviembre, gratis. El enlace está en la bio.\n\n¿Qué es lo que tú dejas siempre para el lunes?\n\n" + HASH,
    'carrusel-fallar': "Si fallas un día, la racha sigue.\n\nUn día malo le pasa a todo el mundo. Lo que desmonta un hábito no es ese día, es dejarlo estar después. Por eso en Lock21 un fallo suelto no rompe nada: al día siguiente vuelves y ya está.\n\nGuárdalo para el día que lo necesites.\n\n¿Qué te suele pasar a ti después de fallar un día?\n\n" + HASH,
    'reel-21-dias': "21 días no crean un hábito para siempre. Te lo digo antes de que empieces.\n\nEn el estudio más citado (Lally et al., 2010) la mediana fue de 66 días, con muchísima diferencia entre personas, y trabajos más recientes van en la misma línea.\n\nEntonces, ¿por qué 21? Porque lo difícil es arrancar y no soltarlo las primeras semanas. El día 21 es el arranque: ya no empiezas de cero.\n\n¿Habías oído lo de los 21 días?\n\n" + HASH,
    'carrusel-senal': "Después de X, hago Y.\n\nEs la forma más sencilla que conozco de no depender de acordarte: atas el hábito nuevo a algo que ya haces todos los días. Es lo primero que eliges cuando entras en Lock21.\n\nTe dejo cuatro ejemplos con los hábitos del reto.\n\n¿Cuál sería tu frase? Escríbela en comentarios.\n\n" + HASH,
    'reel-dia-1-vs-21': "Día 1 vs día 21.\n\nEl día 1 te lo piensas todo: si hoy sí, a qué hora, si mejor mañana. Hacia el día 21 ya sabes cuándo toca y cuesta bastante menos. No es para siempre, es el arranque.\n\nPróximo grupo: lunes 16 de noviembre, gratis. El enlace está en la bio.\n\n¿En qué día sueles soltarlo tú?\n\n" + HASH,
    'carrusel-constancia': "Constancia no es motivación.\n\nLas ganas vienen y van, también a mí. Lo que me ha funcionado es hacerlo pequeño, ponérmelo fácil y volver al día siguiente cuando fallo.\n\nUnas frases para el fin de semana, con calma.\n\n¿Con cuál te quedas?\n\n" + HASH,
}

PLAN = {
    '2026-10-25': ('carrusel', 'carrusel-6-habitos', carrusel_6_habitos),
    '2026-10-26': ('reel', 'reel-lunes', None),
    '2026-10-27': ('carrusel', 'carrusel-fallar', carrusel_fallar),
    '2026-10-28': ('reel', 'reel-21-dias', None),
    '2026-10-29': ('carrusel', 'carrusel-senal', carrusel_senal),
    '2026-10-30': ('reel', 'reel-dia-1-vs-21', None),
    '2026-10-31': ('carrusel', 'carrusel-constancia', carrusel_constancia),
}


def generar(fechas):
    with Render() as r:
        for fecha in fechas:
            tipo, slug, fn = PLAN[fecha]
            out = BASE / fecha
            if fn:
                for i, html in enumerate(fn()):
                    r.png(html, 1080, 1350, out / slug / ('%02d.jpg' % (i + 1)))
            r.png(historia_calentamiento(fecha), 1080, 1920, out / 'historias' / '1000_calentamiento.jpg')
            if fecha in CUENTA:
                r.png(historia_cuenta(fecha), 1080, 1920, out / 'historias' / '2000_cuenta-atras.jpg')
            print('ok', out)


def escribir(nombre, datos):
    (REPO / 'contenido' / 'cola' / nombre).write_text(json.dumps(datos, ensure_ascii=False, indent=2), encoding='utf-8')


def encolar(fechas):
    for fecha in fechas:
        assert fecha >= '2026-10-25', 'no se tocan días anteriores'
        tipo, slug, fn = PLAN[fecha]
        src, dst = BASE / fecha, REPO / 'public' / 'redes' / fecha
        dst.mkdir(parents=True, exist_ok=True)
        tz = '+00:00'  # desde el 25 oct, hora de invierno en Canarias
        historias = [('1000', 'historia-calentamiento', '1000_calentamiento.jpg')]
        if fecha in CUENTA:
            historias.append(('2000', 'historia-cuenta-atras', '2000_cuenta-atras.jpg'))
        for hhmm, nombre, origen in historias:
            (dst / 'historias').mkdir(exist_ok=True)
            shutil.copy(src / 'historias' / origen, dst / 'historias' / origen)
            escribir('%s_%s_%s.json' % (fecha, hhmm, nombre), {'tipo': 'historia', 'pie': '', 'estado': 'programado', 'origen': 'semana_25_31.py',
                                                              'archivos': ['redes/%s/historias/%s' % (fecha, origen)], 'fecha': '%sT%s:%s:00%s' % (fecha, hhmm[:2], hhmm[2:], tz)})
        if tipo == 'carrusel':
            fotos = sorted((src / slug).glob('*.jpg'))
            (dst / slug).mkdir(exist_ok=True)
            for f in fotos:
                shutil.copy(f, dst / slug / f.name)
            datos = {'tipo': 'carrusel', 'pie': PIES[slug], 'estado': 'programado', 'origen': 'semana_25_31.py ' + fn.__name__,
                     'archivos': ['redes/%s/%s/%s' % (fecha, slug, f.name) for f in fotos], 'colaboradores': ['juanma89pr']}
        else:
            if not (src / slug / 'reel.mp4').exists():
                print('falta el reel', src / slug)
                continue
            (dst / slug).mkdir(exist_ok=True)
            for f in ('reel.mp4', 'portada.jpg'):
                shutil.copy(src / slug / f, dst / slug / f)
            datos = {'tipo': 'reel', 'pie': PIES[slug], 'estado': 'programado', 'origen': 'dinamico2.py',
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
