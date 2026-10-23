# Capa de IA de Lock21 (API de Anthropic)

Verificado el 23/10/2026 en platform.claude.com.

## Cuenta (lo hace Juanma)
- La suscripción de claude.ai NO sirve para la app: hace falta la API (Claude Console), con facturación aparte.
- Workspace propio "lock21" con límite de gasto (40 $/mes al empezar) y clave propia.
- La clave va en Netlify como `ANTHROPIC_API_KEY` (nunca con prefijo `VITE_`).

## Modelos
| Tarea | Modelo |
| --- | --- |
| Moderación previa | claude-haiku-5-5 |
| Check-in diario (JSON estructurado) | claude-haiku-5-5 |
| Chat del coach | claude-sonnet-5-5 (cambiable a Haiku por configuración) |
| Resumen semanal | claude-haiku-5-5 con Batch |
| Resumen de derivación | claude-sonnet-5-5 |

Coste estimado: ~0,15 $/usuario activo/mes; ~15 $/mes con 100 usuarios.

## Ahorro
Prompt de sistema cacheado (mínimo 512 tokens), Batch para resúmenes, max_tokens bajos, perfil compacto + últimos 6 turnos.

## Guardarraíles
1. Moderación con Haiku antes del coach; riesgo → texto fijo desde el código.
2. Prompt de sistema con prohibiciones (dietas, cifras, suplementos, consejo médico) y derivación a "un profesional en persona".
3. Filtro de salida con expresiones regulares (cifras con unidades, macros, ayuno, "vosotros").
4. Banner fijo "Estás hablando con una IA".
5. CI con las 30 frases trampa de `tests/frases-trampa.json`.

## Texto fijo de riesgo
"Lo que me cuentas es importante y mereces apoyo de una persona ahora mismo. Soy una IA y no puedo ayudarte con esto. Llama al 024 (atención a la conducta suicida, gratuito, 24 h) o, si estás en peligro, al 112. También puedes hablarlo con alguien de confianza o con tu médico de cabecera."

## Operación semanal
Tarea programada los lunes: lee un endpoint de métricas de solo lectura, deja informe y abre un PR con mejoras. Juanma solo aprueba el PR.

## RGPD
Retención de la API ≤30 días, sin entrenamiento con los datos. Enviar pseudónimos, nunca nombre ni email. Consentimiento explícito si hay datos de salud. Mayores de 18. Chat borrado a los 90 días.
