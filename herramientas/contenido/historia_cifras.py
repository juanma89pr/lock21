"""Historia de los sábados con cifras REALES de plazas pedidas (la lanza GitHub Actions, .github/workflows/historia-cifras.yml).

Lee /.netlify/functions/pulso-metricas (solo agregados), cuenta las plazas pedidas del próximo grupo y genera
la historia de las 20:00 del día: «Ya somos N» (con 3 o más) o «El lunes empieza» sin cifra (con menos).
Escribe public/redes/<fecha>/historias/2000_cifras.jpg y contenido/cola/<fecha>_2000_historia-cifras.json.
No hace nada si ese día ya hay una historia a las 20:00. Nunca inventa ni redondea la cifra.

Uso: python3 historia_cifras.py [AAAA-MM-DD]   (por defecto, hoy en Canarias)
"""
import datetime as dt
import json
import sys
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

from identidad2 import PAREJAS, Render, dorsal, historia

REPO = Path(__file__).resolve().parents[2]
URL = 'https://lock21.balancet.org/.netlify/functions/pulso-metricas'
MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
PLAZAS = 30


def fecha_larga(f):
    d = dt.date.fromisoformat(f)
    return '%s %d de %s' % (DIAS[d.weekday()], d.day, MESES[d.month - 1])


def corta(f):
    y, m, d = f.split('-')
    return '%s·%s·%s' % (d, m, y[2:])


def proximo_grupo(hoy):
    primero = dt.date(2026, 11, 16)
    d = dt.date.fromisoformat(hoy)
    if d < primero:
        return primero.isoformat()
    n = (d - primero).days // 14 + 1
    return (primero + dt.timedelta(days=14 * n)).isoformat()


def pieza(n, grupo, faltan):
    pareja = 'cobalto' if n >= 3 else 'rosa'
    f, t = PAREJAS[pareja]
    if n >= 3:
        titulo = 'Ya somos %d.' % n
        texto = 'Con dorsal para el %s. Quedan %d de %d plazas.' % (fecha_larga(grupo), PLAZAS - n, PLAZAS) if n >= 20 else 'Con dorsal para el %s. Cada uno con su hábito y su señal.' % fecha_larga(grupo)
        num = '%02d' % n
        arriba, abajo = 'Grupo · %s' % corta(grupo), 'dorsales pedidos'
    else:
        titulo = 'El %s empieza.' % fecha_larga(grupo).split(' ')[0]
        texto = 'Faltan %d días para el %s. Un hábito, 21 días, gratis.' % (faltan, fecha_larga(grupo))
        num = str(faltan)
        arriba, abajo = 'Cuenta atrás', 'días para la salida'
    return historia(pareja, '<p class="lab" style="font-size:28px;margin-top:80px">Plazas · %s</p>'
                            '<div style="margin:auto 0;display:flex;justify-content:center">%s</div>'
                            '<p class="big" style="font-size:150px">%s</p>'
                            '<p class="txt" style="font-size:48px;margin-top:36px">%s</p>'
                            '<p class="txt" style="font-size:36px;margin-top:30px;opacity:.75">¿Te apuntas con alguien? El enlace está en la bio.</p>' % (
                                corta(grupo), dorsal(t, f, num, arriba, abajo, fecha=corta(grupo), ancho=760, agujeros=f), titulo, texto), der='Sábado')


def main():
    hoy = sys.argv[1] if len(sys.argv) > 1 else dt.datetime.now(ZoneInfo('Atlantic/Canary')).date().isoformat()
    cola = REPO / 'contenido' / 'cola'
    if list(cola.glob('%s_2000_*.json' % hoy)):
        print('ya hay historia a las 20:00 el', hoy)
        return
    datos = json.load(urllib.request.urlopen(URL + '?x=' + hoy, timeout=30))
    lista = (datos.get('reto') or {}).get('lista')
    if not isinstance(lista, dict):
        print('sin datos de plazas: no se publica nada')
        return
    grupo = proximo_grupo(hoy)
    n = int((lista.get('porGrupo') or {}).get(grupo, 0))
    faltan = (dt.date.fromisoformat(grupo) - dt.date.fromisoformat(hoy)).days
    destino = REPO / 'public' / 'redes' / hoy / 'historias' / '2000_cifras.jpg'
    with Render() as r:
        r.png(pieza(n, grupo, faltan), 1080, 1920, destino)
    (cola / ('%s_2000_historia-cifras.json' % hoy)).write_text(json.dumps({
        'tipo': 'historia', 'pie': '', 'estado': 'programado', 'origen': 'historia_cifras.py (%d plazas del grupo %s)' % (n, grupo),
        'archivos': ['redes/%s/historias/2000_cifras.jpg' % hoy], 'fecha': '%sT20:00:00+00:00' % hoy
    }, ensure_ascii=False, indent=2), encoding='utf-8')
    print('historia de cifras:', n, 'plazas del grupo', grupo)


if __name__ == '__main__':
    main()
