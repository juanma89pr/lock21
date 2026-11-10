#!/bin/sh
# Regla «ignore» de Netlify (10 nov 2026, Juanma: los créditos de Netlify).
# Cada deploy cuesta 15 créditos. Sale 0 (= NO compilar, «Skipped») cuando
# TODO lo cambiado es de lo que la web no usa:
#   docs/, .github/, herramientas/, contenido/cifras.json y los .md de la raíz.
# La cola de Instagram (contenido/cola/), public/, netlify/, src/ y el resto
# siguen desplegando. Si falla algo (sin commit anterior), se compila.
base="${CACHED_COMMIT_REF:-}"
[ -n "$base" ] || exit 1
cambios=$(git diff --name-only "$base" "${COMMIT_REF:-HEAD}" 2>/dev/null) || exit 1
[ -n "$cambios" ] || exit 0
if printf '%s\n' "$cambios" | grep -vqE '^(docs/|\.github/|herramientas/|contenido/cifras\.json$|[^/]+\.md$)'; then
  exit 1
fi
exit 0
