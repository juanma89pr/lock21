# Generador de contenido de Lock21

Scripts que fabrican las piezas de Instagram (carruseles PNG 1080x1350, historias 1080x1920 y reels MP4 de texto animado) con la identidad de la web.
Requisitos: Python 3 con Pillow y Playwright (Chromium) y ffmpeg. Las fuentes Archivo están en esta carpeta.
La salida de cada semana se guarda fuera del repositorio (no se suben imágenes ni vídeos aquí).

Publicación automática: `encolar_semana.py <carpeta-semana>` convierte las piezas (PNG a JPEG, reels con audio AAC) y las deja en `public/redes/` y `contenido/cola/` para el publicador de Instagram (ver docs/publicador-instagram.md). Es la única excepción a la regla anterior: solo se suben los archivos ya encolados.
Las historias para la API se generan con `ENLACE_BIO=1 DESDE=AAAA-MM-DD python3 historias.py` (la API no admite pegatinas de enlace).
