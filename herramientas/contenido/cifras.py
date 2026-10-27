"""Guarda contenido/cifras.json con los agregados públicos del reto (sin datos personales).

Lo usan las tareas de marketing (ideas para grabar, informe semanal) para hablar con números reales.
Solo escribe si las cifras han cambiado, para no desplegar por nada.
"""
import datetime as dt
import json
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

REPO = Path(__file__).resolve().parents[2]
URL = 'https://lock21.balancet.org/.netlify/functions/pulso-metricas'

d = json.load(urllib.request.urlopen(URL, timeout=30))
reto = d.get('reto') or {}
lista = reto.get('lista') or {}
web = (d.get('web') or {}).get('totales') or {}


def total(ev):
    return (web.get(ev) or {}).get('total', 0)


cifras = {
    'plazasPorGrupo': lista.get('porGrupo', {}),
    'plazasTotal': lista.get('total', 0),
    'hanCompartido': lista.get('quienesComparten', 0),
    'compartidos': lista.get('compartidos', 0),
    'lleganInvitados': lista.get('invitados', 0),
    'bajas': lista.get('bajas', 0),
    'origenPlazas': lista.get('porOrigen', {}),
    'web30dias': {'visitas': total('visita'), 'clicsPedirPlaza': total('clic_plaza'), 'solicitudes': total('solicitud'), 'compartir': total('comparte')},
    'origenVisitas30dias': (web.get('visita') or {}).get('origen', {}),
    'enLaApp': {'registrados': reto.get('registrados', 0), 'conHabito': reto.get('inscritos', 0), 'checkins': reto.get('checkins', 0)},
    'correos': {'activos': bool((lista.get('correo') or {}).get('proveedor')), 'porTipo': lista.get('correos', {})},
}
ruta = REPO / 'contenido' / 'cifras.json'
previo = {}
if ruta.exists():
    previo = json.loads(ruta.read_text(encoding='utf-8'))
    previo.pop('actualizado', None)
if previo == cifras:
    print('sin cambios')
else:
    cifras['actualizado'] = dt.datetime.now(ZoneInfo('Atlantic/Canary')).isoformat(timespec='minutes')
    ruta.write_text(json.dumps(cifras, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('cifras guardadas', cifras['plazasPorGrupo'])
