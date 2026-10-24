"""Sonido de marca de Lock21 para reels ("Lock21 · Sonido del reto").

Pista original sintetizada (sin muestras de terceros, sin derechos ajenos), siempre con el
mismo motivo de 4 notas y el "clac" del candado como firma: así el audio original del perfil
se vuelve reconocible y reutilizable por otros.

Se adapta a cada reel: entra la batería en el primer corte de escena, cada corte lleva un
golpe de transición, hay subida antes de la última escena y el candado suena cuando aparece
la llamada a la acción.

Uso:
  python3 audio.py salida.wav DURACION --cortes 3.4,6.6,10,13,16,18.8 --cta 20.5
  python3 audio.py --mezclar reel_sin_audio.mp4 pista.wav reel_final.mp4
"""
import argparse
import subprocess
import sys

import numpy as np
from scipy import signal

SR = 48000
BPM = 150.0
BEAT = 60.0 / BPM          # 0,4 s
OCT = BEAT / 2             # corchea 0,2 s
COMPAS = BEAT * 4          # 1,6 s

# Fa mayor / Re menor: Dm - Bb - F - C (i - VI - III - VII), optimista sin ser empalagoso.
ACORDES = [
    [50, 57, 62, 65, 69],  # Dm
    [46, 53, 58, 62, 65],  # Bb
    [41, 53, 57, 60, 65],  # F
    [48, 55, 60, 64, 67],  # C
]
BAJOS = [38, 34, 41, 36]
# Motivo de marca: "lo-ck-vein-tiuno" (La - Do - Re - La, grave al final), cada 2 compases.
MOTIVO = [(0.0, 81, 0.5), (0.5, 84, 0.5), (1.0, 86, 1.0), (2.5, 81, 1.5)]   # (pulso, nota, duración en pulsos)


def hz(n):
    return 440.0 * 2 ** ((n - 69) / 12.0)


def env_adsr(n, a, d, s, r, sr=SR):
    a, d, r = int(a * sr), int(d * sr), int(r * sr)
    a = max(a, 1)
    e = np.full(n, s, dtype=np.float64)
    e[:min(a, n)] = np.linspace(0, 1, a)[:n]
    if a < n:
        k = min(d, n - a)
        e[a:a + k] = np.linspace(1, s, max(d, 1))[:k]
    if r > 0 and n > r:
        e[-r:] *= np.linspace(1, 0, r)
    return e


def saw(f, t, fase=0.0):
    return 2.0 * ((f * t + fase) % 1.0) - 1.0


def lp(x, fc, orden=2):
    b, a = signal.butter(orden, min(fc / (SR / 2), 0.99), 'low')
    return signal.lfilter(b, a, x)


def hp(x, fc, orden=2):
    b, a = signal.butter(orden, min(fc / (SR / 2), 0.99), 'high')
    return signal.lfilter(b, a, x)


def bp(x, f1, f2, orden=2):
    b, a = signal.butter(orden, [f1 / (SR / 2), min(f2 / (SR / 2), 0.99)], 'band')
    return signal.lfilter(b, a, x)


def poner(buf, x, t0, g=1.0):
    i = int(round(t0 * SR))
    if i >= len(buf) or i + len(x) <= 0:
        return
    if i < 0:
        x = x[-i:]
        i = 0
    j = min(len(buf), i + len(x))
    buf[i:j] += g * x[:j - i]


RNG = np.random.default_rng(21)


def reverb_ir(dur=1.6, brillo=6000):
    n = int(dur * SR)
    t = np.arange(n) / SR
    ir = RNG.standard_normal(n) * np.exp(-t * 5.5 / dur)
    ir = lp(ir, brillo)
    ir[:int(0.012 * SR)] = 0
    return ir / np.sqrt(np.sum(ir ** 2))


IR = reverb_ir()


def con_reverb(x, mezcla):
    mojado = signal.fftconvolve(x, IR)[:len(x)]
    return x + mezcla * mojado


# ---------- instrumentos ----------

def bombo(g=1.0):
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t * 28)
    fase = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(fase) * np.exp(-t * 7.5)
    clic = lp(RNG.standard_normal(n), 4000) * np.exp(-t * 180) * 0.25
    return g * np.tanh(1.6 * (x + clic))


def palmada(g=1.0):
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    ruido = bp(RNG.standard_normal(n), 900, 5200)
    e = np.zeros(n)
    for k, d in enumerate((0.0, 0.011, 0.022)):
        i = int(d * SR)
        e[i:] += np.exp(-(t[:n - i]) * (95 if k < 2 else 16))
    cuerpo = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 30) * 0.4
    return g * (ruido * e * 0.55 + cuerpo)


def charles(g=1.0, abierto=False):
    n = int((0.28 if abierto else 0.06) * SR)
    t = np.arange(n) / SR
    x = hp(RNG.standard_normal(n), 7500, 4)
    return g * x * np.exp(-t * (14 if abierto else 70))


def pad(notas, dur, brillo=1800):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for m in notas[1:]:
        for det in (-0.09, 0.0, 0.11):
            x += saw(hz(m) * 2 ** (det / 12), t, RNG.random())
    x = lp(x, brillo, 2) / (len(notas) * 3)
    return x * env_adsr(n, 0.25, 0.4, 0.8, 0.35)


def bajo(nota, dur, g=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(nota)
    x = np.sin(2 * np.pi * f * t) + 0.35 * lp(saw(f, t), 700)
    return g * np.tanh(1.3 * x) * env_adsr(n, 0.005, 0.12, 0.7, 0.04)


def pluck(nota, dur, g=1.0, brillo=1.0):
    n = int((dur + 0.6) * SR)
    t = np.arange(n) / SR
    f = hz(nota)
    x = 0.6 * np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 6) \
        + 0.15 * saw(f, t) * np.exp(-t * 9)
    x = lp(x, 2500 + 5000 * brillo)
    return g * x * np.exp(-t * 3.2) * env_adsr(n, 0.004, 0.05, 1.0, 0.05)


def whoosh(dur=0.6, g=1.0):
    # Ruido que sube y se corta justo en el corte de escena.
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = RNG.standard_normal(n)
    out = np.zeros(n)
    trozos = 24
    for k in range(trozos):
        a, b = k * n // trozos, (k + 1) * n // trozos
        fc = 400 * (12 ** (k / trozos))
        out[a:b] = bp(x, fc, fc * 2.2)[a:b]
    return g * out * (t / dur) ** 2.2


def impacto(g=1.0):
    n = int(1.2 * SR)
    t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * (38 + 40 * np.exp(-t * 9)) * t) * np.exp(-t * 3.2)
    aire = lp(RNG.standard_normal(n), 2500) * np.exp(-t * 6) * 0.25
    return g * (sub + aire)


def candado(g=1.0):
    """Firma sonora: el 'clac' de un candado que se cierra (dos golpes metálicos + resorte)."""
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for d, amp, fs in ((0.0, 0.7, (2350, 3900, 6100)), (0.055, 1.0, (1650, 2800, 4700))):
        i = int(d * SR)
        tt = t[:n - i]
        golpe = sum(np.sin(2 * np.pi * f * tt + RNG.random() * 6) * np.exp(-tt * (55 + k * 25)) for k, f in enumerate(fs))
        trans = hp(RNG.standard_normal(n - i), 3000) * np.exp(-tt * 400)
        x[i:] += amp * (0.5 * golpe + 0.6 * trans)
    cuerpo = np.sin(2 * np.pi * 210 * t) * np.exp(-t * 35) * 0.5
    return g * (x + cuerpo)


def subida(dur, g=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 200 * (8 ** (t / dur))
    tono = saw(1, np.cumsum(f) / SR) * 0.15
    ruido = hp(RNG.standard_normal(n), 2500) * 0.5
    return g * (lp(tono, 3000) + ruido) * (t / dur) ** 2


# ---------- composición ----------

def componer(duracion, cortes, cta):
    n = int((duracion + 0.05) * SR)
    mus = np.zeros(n)     # instrumentos con reverb
    seco = np.zeros(n)    # batería y bajo
    fx = np.zeros(n)
    cortes = sorted(cortes)
    entra = cortes[0] if cortes else 0.0
    final = cortes[-1] if cortes else duracion
    # La rejilla se alinea para que el primer corte caiga en un tiempo fuerte.
    origen = entra % COMPAS - COMPAS
    tc = origen
    k = 0
    while tc < duracion:
        acorde = ACORDES[k % 4]
        brillo = 900 if tc < entra - 0.01 else (2600 if tc >= final - 0.01 else 1800)
        poner(mus, pad(acorde, COMPAS + 0.35, brillo), tc, 0.55)
        en_ritmo = tc >= entra - 0.01
        construyendo = final - COMPAS - 0.01 <= tc < final - 0.01
        if en_ritmo:
            # Bajo sincopado en corcheas.
            for paso in (0, 3, 4, 6):
                poner(seco, bajo(BAJOS[k % 4], OCT * (1.6 if paso in (0, 4) else 0.9), 0.36), tc + paso * OCT)
            # Batería a medio tiempo: bombo en 1 y "y del 2", palmada en 3.
            for paso in ([0, 3, 5] if k % 2 == 0 else [0, 3, 7]):
                if not construyendo or paso == 0:
                    poner(seco, bombo(0.75), tc + paso * OCT)
            poner(seco, palmada(0.55), tc + 4 * OCT)
            pasos = range(16) if construyendo else range(8)
            dur_paso = OCT / 2 if construyendo else OCT
            for p in pasos:
                acento = 1.0 if p % 2 == 0 else 0.6
                if construyendo:
                    poner(seco, palmada(0.12 + 0.35 * p / 16), tc + p * dur_paso)
                else:
                    poner(seco, charles(0.18 * acento, abierto=(p == 7 and k % 2 == 1)), tc + p * dur_paso)
        # Motivo de marca cada 2 compases (más apagado en la intro).
        if (k % 2 == 0 or not en_ritmo) and tc > -0.05:
            for pulso, nota, d in MOTIVO:
                poner(mus, pluck(nota, d * BEAT, 0.42, 0.3 if not en_ritmo else 1.0), tc + pulso * BEAT)
        tc += COMPAS
        k += 1
    # Transiciones: cada corte lleva un barrido y un golpe; el primero y el último, impacto grave.
    for i, c in enumerate(cortes):
        poner(fx, whoosh(0.5, 0.22), c - 0.5)
        if i == 0 or c == final:
            poner(fx, impacto(0.55), c)
    if cortes:
        poner(fx, subida(COMPAS, 0.35), final - COMPAS)
    # Firma: candado al aparecer la llamada a la acción, y el motivo completo después.
    if cta is not None:
        poner(fx, candado(0.75), cta)
        poner(mus, pluck(86, BEAT * 2, 0.5, 1.0), cta + 0.12)
    mezcla = con_reverb(mus, 0.35) + seco + con_reverb(fx, 0.25)
    mezcla = hp(mezcla, 28)
    # Normalización y limitador suave (objetivo aprox. -14 LUFS para redes).
    mezcla /= np.max(np.abs(mezcla)) + 1e-9
    rms = np.sqrt(np.mean(mezcla ** 2))
    mezcla *= 0.2 / (rms + 1e-9)
    mezcla = np.tanh(mezcla * 1.1) / np.tanh(1.1)
    mezcla *= 0.89 / (np.max(np.abs(mezcla)) + 1e-9)
    # Entrada y salida.
    fi, fo = int(0.02 * SR), int(0.7 * SR)
    mezcla[:fi] *= np.linspace(0, 1, fi)
    mezcla[-fo:] *= np.linspace(1, 0, fo) ** 1.5
    return mezcla[:int(duracion * SR)]


def guardar_wav(ruta, x):
    from scipy.io import wavfile
    estereo = np.stack([x, x], axis=1)
    # Un poco de anchura: el pad/reverb ya da movimiento; retraso mínimo en un canal.
    d = int(0.007 * SR)
    estereo[d:, 1] = 0.85 * x[:-d] + 0.15 * x[d:]
    wavfile.write(ruta, SR, (np.clip(estereo, -1, 1) * 32767).astype(np.int16))


def mezclar(video, pista, salida):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', video, '-i', pista, '-map', '0:v:0', '-map', '1:a:0',
                    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest',
                    '-movflags', '+faststart', salida], check=True)


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--mezclar':
        mezclar(sys.argv[2], sys.argv[3], sys.argv[4])
        sys.exit(0)
    ap = argparse.ArgumentParser()
    ap.add_argument('salida')
    ap.add_argument('duracion', type=float)
    ap.add_argument('--cortes', default='')
    ap.add_argument('--cta', type=float, default=None)
    a = ap.parse_args()
    cortes = [float(c) for c in a.cortes.split(',') if c]
    guardar_wav(a.salida, componer(a.duracion, cortes, a.cta))
