# Revisión previa a publicación — 2026-09-10

## Dictamen y alcance

**Complemento del segundo grupo de comentarios:** [plan de reanudación PRE-12–17](../superpowers/plans/2026-09-10-prepublication-addendum.md), con países, lada independiente, correo, captura monetaria, tooltip y textarea. Leerlo junto con este diagnóstico; no reemplaza PRE-01–11.

**NO GO de publicación.** No es cierto que solo falte publicar o comprobar zoom. Esta revisión sustituye la afirmación de cierre universal de VER-I-055 y del resultado del 2026-09-08; no invalida los resultados concretos de aquellas pruebas.

Fuentes: cuatro comentarios/capturas de la usuaria en Configuración; código actual del checkout; plan `../superpowers/plans/2026-09-05-world-memories-visual-interaction-closure.md`; pruebas existentes. Revisión de código transversal, no certificación visual de todas las pantallas. Edge detectó la pestaña local `http://127.0.0.1:4175/#/dashboard`, pero la adquisición de la pestaña agotó el tiempo y reinició el conector. No se obtuvo una inspección renderizada nueva. No se cambió código, base, datos reales ni publicación; no se ejecutaron suites en esta revisión documental.

## Hallazgos confirmados

| ID | Evidencia actual | Consecuencia / pendiente |
|---|---|---|
| PRE-01 | `SettingsPage.tsx` usa inputs sin clase común; `global.css` 623–650 solo aplica anchura/flex/bordes superiores, mientras el estilo de campos depende de `.form-grid` | Las cinco listas de catálogos comparten los defectos capturados: cajas nativas, alta más baja que botón y separadores rígidos. No es un defecto aislado de Tipos de viaje. |
| PRE-02 | Fila flex con input width100% y `.toggle-field` de ancho intrínseco | Activo/Inactivo compiten por anchura; reservar columna de estado estable en ES/EN y evitar que el switch se comprima. |
| PRE-03 | El editor muestra todos los nombres como inputs; etiqueta de alta `sr-only`; `update` no valida; `save` escribe directamente | Falta acción Editar y etiqueta visible exigidas por Tarea2.2. Duplicados se comprueban al agregar, no al renombrar/guardar; tampoco se rechaza nombre vacío en esa ruta. |
| PRE-04 | `SettingsPageState` keyed por `configuration.updatedAt`; selector del shell guarda configuración; guard local solo al botón Cancelar | Un cambio de idioma puede remontar y perder borrador. Navegación a otro módulo no está protegida desde este editor. Falta contrato de salida con borrador, no basta el diálogo Cancelar. |
| PRE-05 | `LeadList.tsx` 87: `(all || archived) ? archivedAt : !archivedAt` | Todos filtra solo archivados. Query/origen/estado siguen locales; elevar solo archivo no satisface conservación completa del contexto al desmontar lista. |
| PRE-06 | `TaskBoard.tsx` 239–245: select de estado, rango separado, limpiar solo `setFilters` | Falta estado por chips, rango unido y restablecimiento también de archivo según Tarea2.1. |
| PRE-07 | `ActionMenu.tsx` gestiona flechas/Home/End/Escape, no Tab; `RecordActions.tsx` combina Archivar o eliminar en activos | Pendientes de contratos de teclado y acciones explícitas. No significa que la posibilidad de eliminar esté ausente: existen revisión y segunda confirmación. |
| PRE-08 | `DetailWorkspace.tsx` todos los ancestros llaman `onClose` | No representa navegación exacta a cada ancestro; no tiene guard propio de borrador. Revisar integración de los ocho expedientes. |
| PRE-09 | `DataBackupsPage.tsx` `downloadJson`/`downloadExcel` y botones sin estado de exportación pendiente ni captura local de error | Falta ocupado/error y bloqueo de doble exportación de Tarea5.2. Restauración tiene otros estados: no confundirlos con cobertura de exportación. |
| PRE-10 | `visual-uat.spec.ts` recorre diez módulos en ES; cambia a EN solo al final en Tareas. `visual-layout.spec.ts` modifica `aria-valuenow` directamente | No prueba diez módulos EN ni el ancho real320/350/560. Un atributo ARIA no redimensiona el panel. Tampoco captura todas las variantes requeridas. |

### Inventario transversal de superficies

- **Configuración:** defectos confirmados en los cinco catálogos; preferencias sí usan `.form-grid`, pero el mínimo definido allí es41px frente a44px del plan.
- **Leads:** además de filtros/contexto, cancelación en `LeadDetail.tsx` contiene select/input/textarea fuera de `.form-grid`; candidato concreto a apariencia nativa residual.
- **Clientes, Viajes/Servicios/Pagos, Proveedores y Comisiones:** revisar sus formularios y secciones expandibles contra el componente de campo común. `CustomerPaymentPanel.tsx` tiene selects en `.payment-entry`, mientras la regla específica observada estiliza inputs; `CommissionPaymentDialog.tsx` contiene textarea cuya cobertura no debe asumirse por estar en `.form-grid` (esa regla solo incluye input/select). Son riesgos de estilo identificados en código, aún no capturas confirmadas.
- **Tareas:** corregir PRE-06; comprobar formularios y edición inline, fechas/horas, archivo y nombres largos al cambiar idioma.
- **Dashboard, Calendario, búsqueda y notificaciones:** volver a inspeccionar colas/paneles poblados, filtros y menús a partir de primitivas compartidas; esta revisión no los declara aprobados ni inventa solapamientos no observados.
- **Datos y respaldo:** PRE-09 y controles de archivo/progreso; no restaurar la base de la usuaria para comprobar estética.
- **Todos los expedientes:** PRE-07/08, alturas, anchos de estado, foco, retorno a lista, panel estrecho y texto largo.

## Renombrar no significa recodificar todo el histórico

`repositories.ts.saveConfiguration` solo escribe la configuración. No recorre ni reescribe Leads/Viajes anteriores. En particular, `App.tsx` entrega etiquetas de tipos/fuentes/canales a `LeadForm`, cuyos valores son strings; el formulario conserva valores históricos entre las opciones. Renombrar esas entradas no renombra automáticamente esos datos capturados.

No prometer lo mismo para cualquier catálogo: hay referencias por ID, como `cancellationReasonId`. Cambiar su etiqueta puede cambiar una presentación resuelta por ID aunque no se reescriba el registro. Antes de implementar resumen de impacto, mapear consumidores de los cinco catálogos y probar cada caso. Mantener ID estable, no ejecutar una migración implícita de valores históricos.

**Acuerdo previo a cumplir:** etiqueta visible, acción Editar, borrador Guardar/Cancelar, validación y protección de salida (plan Tarea2.2). **Recomendación de presentación pendiente de elección:** filas en lectura; Editar habilita solo esa fila. Al guardar configuración, resumen de altas/renombres/activaciones con antes→después y explicación específica de alcance. No popup al escribir ni al usar filtros. Crear nuevo debe ser una acción distinta de renombrar, no una conversión silenciosa.

## PWA: no confirmar todavía actualización segura

**PRE-11 — Crítico, confirmado por código:** `AppRoot.tsx` pasa `setApplyUpdate` directamente a `registerPwa`. `pwa.ts` entrega una función async que llama `update(true)`. React trata una función pasada al setter como actualizador y la ejecuta; no la almacena como valor. Se comprobó también en el runtime instalado (`basicStateReducer` en react-dom). Esto puede activar la actualización al recibir `onNeedRefresh`, antes de la decisión y del respaldo, y dejar una Promise donde se espera un callback. No se reprodujo un despliegue real en esta revisión.

La configuración Vite sí solicita modo `prompt`, pero no corrige el error del enlace React. `updatePrompt.test.tsx` monta `App` con callback inyectado: omite `AppRoot` y no cubre el fallo real. El controlador probado por separado tampoco acredita la integración.

Otros límites confirmados:

- `AppRoot` pasa `requiresBackupForUpdate` siempre: bloqueo de toda actualización sin respaldo elegible, no distinción por versión entrante. No existe botón Omitir respaldo y actualizar.
- El aviso ofrece Más tarde y Actualizar ahora; no acceso directo a respaldar. Posponer borra el callback del estado; falta demostrar cómo se vuelve a ofrecer durante la misma sesión.
- `pwa.ts` no programa comprobación periódica ni al recuperar foco/conexión. No escucha pushes GitHub. Para detectar una versión debe existir un despliegue publicado de nuevos archivos y comprobación del service worker con conexión; no prometer aviso inmediato al hacer push.
- El wrapper no espera `update(true)`: debe devolver/esperar su promesa y tratar fallos, además de proteger borradores antes de recargar.
- El respaldo se determina por registro de descarga/esquema/fecha; no prueba por sí solo que la usuaria conserve un archivo recuperable fuera del navegador.
- La persistencia es local por origen/perfil/dispositivo. La actualización de código no sincroniza datos entre equipos. Móvil sigue fuera del soporte MVP acordado.

**Recomendación:** corrección prioritaria del enlace con wrapper que almacene la función sin ejecutarla; prueba de integración AppRoot→registerPwa→aviso; dos builds sintéticos consecutivos bajo el mismo origen aislado. Verificar ninguna recarga antes de confirmar, posponer/reofrecer, fallo, borrador y respaldo. Para actualización normal, proponer Respaldar y actualizar / Actualizar sin respaldo (confirmación explícita) / Posponer. Para cambio de esquema conservar respaldo obligatorio según REQ-173. La excepción de saltar respaldo en cambio de esquema sería decisión nueva y de riesgo: no implementarla por inferencia.

## Opciones visuales y reglas

1. **Recomendada: filas suaves.** Superficie blanca/neutra, espacio interior16px, radios del sistema, separadores de bajo contraste; realce tenue al hover/foco. Sombra ligera solo en el contenedor, no en cada fila. Campos y botón de alta con altura común mínima44px, etiqueta visible; estado con ancho estable para ambos idiomas. Mantener borde perceptible de campos y anillo de foco: no eliminar toda señal de interacción.
2. **Alternativa: fichas elevadas individuales.** Más separación y sombra por registro; mayor consumo vertical y ruido en catálogos de20 entradas. No recomendada para todas las filas.

Alturas, alineación, controles centrales, foco y acción Editar ya son alcance aprobado. Elección de superficie/sombra y resumen previo adicional se registran como propuesta, no como aprobación supuesta. Usar logo/paleta/tokens existentes, sin nueva identidad.

## Reanudación verificable (sin publicar)

1. Prioridad crítica: PRE-11 y pruebas de integración de actualización, sin activar actualización en perfil real.
2. Retomar Oleadas1–2: campo común, altura44, estado estable, editores de cinco catálogos, validación/guardas; PRE-05/06 y contexto completo.
3. Retomar Oleadas3–5: acciones separadas y teclado, navegación exacta/guardas, estados de exportación; contrastar cada casilla pendiente contra código y prueba, no solo conteos.
4. Completar Oleada6: fixture exigido, capturas diez módulos/ocho expedientes ES/EN, anchos reales y zoom real100/200, fallos y dos versiones PWA. Ejecutar suites y registrar evidencia fresca.
5. Solo después emitir matriz completa de cumplimiento y evaluar publicación autorizada. No marcar oleadas cerradas por esta auditoría.

Ejecutor recomendado: Tierra Alto. Conserva alcance; ninguna purga, migración real, push, etiqueta ni despliegue durante esta revisión.
