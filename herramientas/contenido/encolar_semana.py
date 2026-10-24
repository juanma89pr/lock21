"""Encola una semana de contenido para el publicador automático de Instagram.

Uso (desde la raíz del repositorio):
    python3 herramientas/contenido/encolar_semana.py /home/claude/lock21-contenido/semana-1 [--desde AAAA-MM-DD] [--excluir texto] [--simular]

Lee la carpeta de la semana:
    AAAA-MM-DD_tipo_tema/   (tipo: carrusel, imagen o reel) con PNG/MP4, pie.txt y hora.txt
    historias/AAAA-MM-DD/NN.png  (a las 20:00 salvo historias/AAAA-MM-DD/hora.txt)
    juanma-personal/ y perfil/ se ignoran.
y genera:
    public/redes/AAAA-MM-DD/<tipo>-<tema>/NN.jpg | reel.mp4 | portada.jpg
    contenido/cola/AAAA-MM-DD_HHMM_slug.json

Conversiones: PNG -> JPEG calidad 92 (la API solo acepta JPEG) y reels con pista AAC
(si no traen audio se añade una silenciosa) y moov al principio (+faststart).
Los pies con "Comenta LOCK ..." pasan a "El enlace para pedir tu plaza está en la bio".
Por defecto no encola nada anterior al momento actual (hora de Canarias).
"""
import argparse
import json
import re
import shutil
import subprocess
import sys
import unicodedata
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

from PIL import Image

ZONA = ZoneInfo('Atlantic/Canary')
RAIZ = Path(__file__).resolve().parents[2]
REDES = RAIZ / 'public' / 'redes'
COLA = RAIZ / 'contenido' / 'cola'
IGNORAR = {'juanma-personal', 'perfil', 'historias'}
TIPOS = {'carrusel', 'imagen', 'reel'}
HORA_HISTORIAS = (20, 0)
FRASE_BIO = 'el enlace para pedir tu plaza está en la bio'
DIAS = {'lunes': 0, 'martes': 1, 'miércoles': 2, 'miercoles': 2, 'jueves': 3, 'viernes': 4, 'sábado': 5, 'sabado': 5, 'domingo': 6}


def slug(texto):
    t = unicodedata.normalize('NFKD', texto).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')


def leer_hora(ruta, defecto=None):
    if not ruta.exists():
        return defecto
    m = re.search(r'\b(\d{1,2}):(\d{2})\b', ruta.read_text(encoding='utf-8'))
    return (int(m.group(1)), int(m.group(2))) if m else defecto


def trial_reel(ruta, fecha_base):
    """Detecta 'Reutilizar como Trial Reel el martes 27 a las 19:30' en hora.txt."""
    if not ruta.exists():
        return None
    m = re.search(r'Trial Reel el (\w+) (\d{1,2})(?: de \w+)? a las (\d{1,2}):(\d{2})', ruta.read_text(encoding='utf-8'), re.I)
    if not m:
        return None
    dia = int(m.group(2))
    for delta in range(1, 15):
        f = fecha_base + timedelta(days=delta)
        if f.day == dia:
            return f.replace(hour=int(m.group(3)), minute=int(m.group(4)))
    return None


def adaptar_pie(pie):
    def cambio(m):
        return FRASE_BIO[0].upper() + FRASE_BIO[1:] if m.group(1) == 'C' else FRASE_BIO
    nuevo = re.sub(r'([Cc])omenta LOCK y te paso el enlace', cambio, pie)
    if re.search(r'comenta\s+lock', nuevo, re.I):
        raise SystemExit('Pie con "Comenta LOCK" en un formato no previsto:\n' + pie)
    return nuevo.strip()


def a_jpeg(origen, destino):
    destino.parent.mkdir(parents=True, exist_ok=True)
    im = Image.open(origen)
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA')
        fondo = Image.new('RGB', im.size, (255, 255, 255))
        fondo.paste(im, mask=im.split()[-1])
        im = fondo
    else:
        im = im.convert('RGB')
    im.save(destino, 'JPEG', quality=92, optimize=True)


def tiene_audio(video):
    r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=codec_name', '-of', 'csv=p=0', str(video)], capture_output=True, text=True, check=True)
    return r.stdout.strip()


def preparar_video(origen, destino):
    destino.parent.mkdir(parents=True, exist_ok=True)
    audio = tiene_audio(origen)
    if not audio:
        cmd = ['ffmpeg', '-y', '-v', 'error', '-i', str(origen), '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
               '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', str(destino)]
    elif audio != 'aac':
        cmd = ['ffmpeg', '-y', '-v', 'error', '-i', str(origen), '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-movflags', '+faststart', str(destino)]
    else:
        cmd = ['ffmpeg', '-y', '-v', 'error', '-i', str(origen), '-c', 'copy', '-movflags', '+faststart', str(destino)]
    subprocess.run(cmd, check=True)


def escribir(pieza, simular):
    fecha = datetime.fromisoformat(pieza['fecha'])
    nombre = '%s_%s_%s.json' % (fecha.strftime('%Y-%m-%d'), fecha.strftime('%H%M'), pieza.pop('slug'))
    if simular:
        print('  [simulación] ' + nombre)
        return nombre
    COLA.mkdir(parents=True, exist_ok=True)
    (COLA / nombre).write_text(json.dumps(pieza, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('  ' + nombre)
    return nombre


def main():
    ap = argparse.ArgumentParser(description='Encola una semana de contenido para Instagram.')
    ap.add_argument('carpeta', type=Path)
    ap.add_argument('--desde', help='no encola nada anterior a este día (AAAA-MM-DD); por defecto, ahora')
    ap.add_argument('--excluir', action='append', default=[], help='omite las piezas cuyo nombre de carpeta contenga este texto')
    ap.add_argument('--simular', action='store_true', help='muestra lo que haría sin escribir nada')
    a = ap.parse_args()

    ahora = datetime.now(ZONA)
    corte = datetime.fromisoformat(a.desde).replace(tzinfo=ZONA) if a.desde else ahora
    if corte < ahora:
        corte = ahora
    sem = a.carpeta.resolve()
    if not sem.is_dir():
        raise SystemExit('No existe la carpeta ' + str(sem))

    def excluida(texto):
        return any(x in texto for x in a.excluir)

    piezas = []
    # 1. Publicaciones del feed.
    for d in sorted(p for p in sem.iterdir() if p.is_dir() and p.name not in IGNORAR):
        m = re.match(r'^(\d{4}-\d{2}-\d{2})_([a-z]+)_(.+)$', d.name)
        if not m or m.group(2) not in TIPOS:
            print('Se ignora ' + d.name)
            continue
        dia, tipo, tema = m.group(1), m.group(2), slug(m.group(3))
        hora = leer_hora(d / 'hora.txt')
        if not hora:
            raise SystemExit(d.name + ': falta la hora en hora.txt')
        fecha = datetime.fromisoformat(dia).replace(hour=hora[0], minute=hora[1], tzinfo=ZONA)
        pie = adaptar_pie((d / 'pie.txt').read_text(encoding='utf-8')) if (d / 'pie.txt').exists() else ''
        destino_rel = 'redes/%s/%s-%s' % (dia, tipo, tema)
        base = {'tipo': tipo, 'pie': pie, 'estado': 'programado', 'origen': d.name}
        if tipo == 'reel':
            base.update(archivos=[destino_rel + '/reel.mp4'], portada=destino_rel + '/portada.jpg')
            medios = [(d / 'reel.mp4', destino_rel + '/reel.mp4'), (d / 'portada.png', destino_rel + '/portada.jpg')]
        else:
            pngs = sorted(p for p in d.iterdir() if p.suffix.lower() in ('.png', '.jpg', '.jpeg'))
            base['archivos'] = [destino_rel + '/%02d.jpg' % (i + 1) for i in range(len(pngs))]
            medios = [(p, destino_rel + '/%02d.jpg' % (i + 1)) for i, p in enumerate(pngs)]
            if tipo == 'carrusel' and len(pngs) == 1:
                base['tipo'] = 'imagen'
        piezas.append(dict(base, fecha=fecha, slug='%s-%s' % (base['tipo'], tema), medios=medios))
        tr = trial_reel(d / 'hora.txt', fecha) if tipo == 'reel' else None
        if tr:
            piezas.append(dict(base, fecha=tr, slug='reel-prueba-' + tema, prueba=True, medios=medios))
    # 2. Historias.
    hist = sem / 'historias'
    if hist.is_dir():
        for d in sorted(p for p in hist.iterdir() if p.is_dir() and re.match(r'^\d{4}-\d{2}-\d{2}$', p.name)):
            hora = leer_hora(d / 'hora.txt', HORA_HISTORIAS)
            fecha = datetime.fromisoformat(d.name).replace(hour=hora[0], minute=hora[1], tzinfo=ZONA)
            for f in sorted(p for p in d.iterdir() if p.suffix.lower() in ('.png', '.jpg', '.jpeg', '.mp4')):
                ext = '.mp4' if f.suffix.lower() == '.mp4' else '.jpg'
                rel = 'redes/%s/historias/%s%s' % (d.name, f.stem, ext)
                piezas.append({'tipo': 'historia', 'pie': '', 'estado': 'programado', 'origen': 'historias/%s/%s' % (d.name, f.name),
                               'archivos': [rel], 'fecha': fecha, 'slug': 'historia-%s' % slug(f.stem), 'medios': [(f, rel)]})

    encoladas, omitidas = [], []
    for p in sorted(piezas, key=lambda x: (x['fecha'], x['slug'])):
        if p['fecha'] < corte or excluida(p['origen']):
            omitidas.append('%s %s' % (p['fecha'].strftime('%Y-%m-%d %H:%M'), p['origen'] + (' (prueba)' if p.get('prueba') else '')))
            continue
        for origen, rel in p.pop('medios'):
            if not origen.exists():
                raise SystemExit('Falta ' + str(origen))
            destino = RAIZ / 'public' / rel
            if a.simular or destino.exists():
                continue
            if rel.endswith('.mp4'):
                preparar_video(origen, destino)
            elif origen.suffix.lower() == '.png':
                a_jpeg(origen, destino)
            else:
                destino.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(origen, destino)
        p['fecha'] = p['fecha'].isoformat(timespec='seconds')
        if not p.get('portada'):
            p.pop('portada', None)
        encoladas.append(escribir(p, a.simular))
    print('\nEncoladas: %d' % len(encoladas))
    if omitidas:
        print('Omitidas (anteriores al corte o excluidas):\n  ' + '\n  '.join(omitidas))


if __name__ == '__main__':
    sys.exit(main())
