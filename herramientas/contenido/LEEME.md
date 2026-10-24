# Generador de contenido de Lock21

Scripts que fabrican las piezas de Instagram (carruseles PNG 1080x1350, historias 1080x1920 y reels MP4 de texto animado) con la identidad de la web.
Requisitos: Python 3 con Pillow y Playwright (Chromium) y ffmpeg. Las fuentes Archivo están en esta carpeta.
La salida de cada semana se guarda fuera del repositorio (no se suben imágenes ni vídeos aquí).

Publicación automática: `encolar_semana.py <carpeta-semana>` convierte las piezas (PNG a JPEG, reels con audio AAC) y las deja en `public/redes/` y `contenido/cola/` para el publicador de Instagram (ver docs/publicador-instagram.md). Es la única excepción a la regla anterior: solo se suben los archivos ya encolados.
Las historias para la API se generan con `ENLACE_BIO=1 DESDE=AAAA-MM-DD python3 historias.py` (la API no admite pegatinas de enlace).

Reels dinámicos (desde el 24 oct 2026): `SALIDA=<carpeta> python3 dinamico.py reel_x` genera `reel.mp4` con sonido deportivo sincronizado, `portada.jpg` y `eventos.json`. Con `PRUEBA=1.0,2.5` saca fotogramas sueltos para revisar. Sonido: `audio.py` (sonido de marca y versión deportiva por eventos). Reglas en docs/marca/libro-de-marca.md.

## Identidad 2 (desde el 24 oct 2026): generadores vigentes
- `identidad2.py`: paleta en parejas, candado del logo, insignia, dorsal, línea de 21 días y plantillas `slide()` (1080x1350) e `historia()` (1080x1920). Ejemplos de uso: `hoy_24oct.py` y `semana_25_31.py` (este además encola con `ENCOLAR=1`).
- `dinamico2.py`: reels limpios (rejilla de 150 BPM, cortes en múltiplos de 0,4 s). `SALIDA=<carpeta> python3 dinamico2.py reel_x`; con `PRUEBA=1.0,2.5` saca fotogramas sueltos.
- `lk.py`, `carruseles.py`, `historias.py`, `reels.py` y `dinamico.py` quedan obsoletos para contenido nuevo (solo referencia de guiones). Reglas visuales en docs/marca/libro-de-marca.md, sección "Identidad 2".
- Copias de lo generado: `/home/claude/lock21-contenido/identidad2/<fecha>/`.
