# Generador de contenido de Lock21

Scripts que fabrican las piezas de Instagram (carruseles PNG 1080x1350, historias 1080x1920 y reels MP4 de texto animado) con la identidad de la web.
Requisitos: Python 3 con Pillow y Playwright (Chromium) y ffmpeg. Las fuentes Archivo están en esta carpeta.
La salida de cada semana se guarda fuera del repositorio (no se suben imágenes ni vídeos aquí).

Publicación automática: `encolar_semana.py <carpeta-semana>` convierte las piezas (PNG a JPEG, reels con audio AAC) y las deja en `public/redes/` y `contenido/cola/` para el publicador de Instagram (ver docs/publicador-instagram.md). Es la única excepción a la regla anterior: solo se suben los archivos ya encolados.
Las historias para la API se generan con `ENLACE_BIO=1 DESDE=AAAA-MM-DD python3 historias.py` (la API no admite pegatinas de enlace).

Reels dinámicos (desde el 24 oct 2026): `SALIDA=<carpeta> python3 dinamico.py reel_x` genera `reel.mp4` con sonido deportivo sincronizado, `portada.jpg` y `eventos.json`. Con `PRUEBA=1.0,2.5` saca fotogramas sueltos para revisar. Sonido: `audio.py` (sonido de marca y versión deportiva por eventos). Reglas en docs/marca/libro-de-marca.md.
