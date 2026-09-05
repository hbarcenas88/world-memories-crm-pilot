# Cierre correctivo pre-B1 — World Memories CRM

## Estado operativo

Este plan sustituye el GO técnico local anterior como fuente operativa. No autoriza
commit inicial, etiqueta B1, publicación, despliegue, importación ni migración de
datos reales. La aplicación se valida únicamente con datos sintéticos y mantiene
la arquitectura local-first. La autorización posterior de la usuaria para
versionado y prueba piloto solo aplica después de este cierre comprobado.

## Línea base auditada

- Confirmado: repositorios IndexedDB, conversiones transaccionales, ciclo de
  editar/archivar/eliminar, expedientes, marca, PWA offline y respaldo JSON básico.
- Por completar: Configuración global, persistencia de idioma, fechas operativas
  fijas, tareas manuales completas, rutas hash, protección de actualización de
  esquema y las superficies parciales detalladas en este plan.
- Histórico no pendiente: casillas generales de planes anteriores y verificaciones
  antiguas no sustituyen evidencia funcional de este cierre.
- Fuera de alcance: datos reales, backend, sincronización, móvil, notificaciones
  externas, Insights, gráficos, adjuntos, Finanzas, publicación, despliegue y B1.

## Contratos que se incorporan

- `WorkspaceConfiguration` persistida en IndexedDB con idioma, formatos fijos y
  catálogos globales de tipo de viaje, fuente de adquisición, canal de comunicación,
  motivo de cancelación y relación familiar. Las entradas tienen ID estable,
  etiqueta y estado activo; no se reescriben valores históricos.
- Fechas internas ISO y presentación/captura siempre `DD/MM/YYYY`; hora de 24 h y
  números con coma de miles y punto decimal, también en inglés.
- Tareas con hora y vínculo opcionales, origen/snapshot de plantilla y protección
  de fechas ajustadas manualmente. Las plantillas admiten días o meses y anclas
  de inicio, fin o manual.
- Respaldo JSON de esquema 2, compatible de modo determinista con esquema 1.
- Hash routing con Dashboard inicial y navegación contextual.
- Reconciliación local idempotente al abrir/refrescar: finalizar viajes vencidos y
  generar una sola tarea para comisión esperada vencida. No hay trabajo PWA cerrado.

## Bloques de ejecución

- [x] **1. Línea base, Configuración y fechas:** pantalla operativa, idioma
  persistente, formato fijo, reemplazo de controles nativos y documentación.
- [x] **2. Tareas y plantillas:** alta y edición manual con fecha/hora/vínculo
  opcionales, filtros, proyección en Calendario y Dashboard, plantillas por
  Proveedor con días/meses/anclas y protección de fecha manual, tareas visibles
  en el Viaje y reconciliación local idempotente de Viajes/Comisiones. Cierre
  verificado el 2026-09-04 mediante pruebas unitarias e integración, 10 E2E,
  typecheck, lint, build PWA y preview local ES/EN.
- [x] **3. Expedientes:** campos y flujos aprobados de Leads,
  Clientes/Familias, Viajes/Servicios, Proveedores y Comisiones, incluidos
  contacto principal explícito en conversión, dirección, cancelación no
  destructiva de Viaje/componente y tasa trazable con override por Comisión.
- [x] **4. Operación diaria:** Dashboard con colas accionables, búsqueda en
  notas/localizadores, calendario, alertas y rutas contextuales aprobadas.
- [x] **5. Compatibilidad y calidad:** migración IndexedDB v11→v13 aditiva,
  respaldo v1/v2, CSV/Excel sintéticos, protección de actualización,
  documentación y matriz final.

## Cierre técnico — 2026-09-05

La segunda auditoría y sus hallazgos respaldados quedan corregidos sin ampliar el
MVP. La evidencia fresca es: 78 archivos/282 pruebas unitarias e integración,
typecheck, lint, build PWA, 10 E2E secuenciales, auditoría de dependencias de
producción sin vulnerabilidades, respaldo JSON v1/v2 y migración IndexedDB
v11→v13. La revisión visual en la aplicación servida confirmó el logo oficial,
paleta, Dashboard, rail de escritorio y el comportamiento a 100 % y viewport
equivalente a 200 %; la consola no presentó errores ni advertencias relevantes.

No se usaron datos reales. La normalización Git quedó registrada en los commits
`4c1f511` y `db2a48e`; el Excel original, artefactos y temporales están
explícitamente ignorados. La prueba piloto se publicó en
`https://hbarcenas88.github.io/world-memories-crm-pilot/`: GitHub Actions de
calidad y Pages pasaron para la rama `codex/world-memories-mvp`, y la revisión
Playwright publicada confirmó HTTP 200, logo oficial, navegación y consola
limpia. No equivale a una etiqueta B1, migración de datos ni autorización para
ampliar alcance.

## Criterio de cierre

Cada bloque exige pruebas proporcionales, typecheck, lint, build PWA, revisión de
cambios, documentación afectada y preview visual. El cierre total exige además
E2E, accesibilidad/teclado/zoom 100 % y 200 %, ES/EN, consola limpia, auditoría de
dependencias y pruebas de respaldo/restauración. El piloto publicado exige además
versionado trazable, Actions en verde y comprobación de la URL servida.
