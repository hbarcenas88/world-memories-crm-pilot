# Auditoría visual y de interacción del piloto — 2026-09-05

## Dictamen y alcance

**Aceptación visual reabierta.** El piloto funciona, pero no cumple uniformemente los acuerdos de interacción. Los resultados técnicos anteriores no demuestran ausencia de empalmes, buena composición ni cobertura de todas las variantes de expediente.

Auditoría de solo lectura de aplicación y código, solicitada para preparar un plan ejecutable por **Terra High / Tierra Alto**. Base local: commit `95b382b`; se inspeccionó el piloto `https://hbarcenas88.github.io/world-memories-crm-pilot/` en Edge mediante su complemento. No se verificó la identidad del bundle remoto contra ese commit: código local y pantalla remota constituyen evidencias complementarias, no una equivalencia asumida.

No se crearon, editaron, archivaron ni eliminaron registros; no se importaron/exportaron datos ni se hizo publicación. Las altas abiertas se cancelaron. Las capturas de la usuaria y las capturas de navegador de esta conversación son evidencia visual; no se copiaron datos de su perfil al repositorio. Solo se escriben diagnóstico, plan y actualizaciones documentales.

## Resultado posterior a la implementación — 2026-09-08

> **Sustituido en alcance por la revisión del 2026-09-10:** la declaración siguiente de que todos los UAT fueron atendidos fue excesiva. Véase [revisión previa a publicación, PRE-01–11](2026-09-10-prepublication-review.md). Se conservan las pruebas históricas, pero no acreditan cierre integral ni ausencia de pendientes de implementación.

El diagnóstico original se conserva como histórico. Sus UAT-01–27 fueron atendidos por la implementación del plan de seis oleadas y por la evidencia de `VER-I-055`: 93 archivos/370 pruebas unitarias e integración, 17 E2E y build PWA reciente. La UAT sintética cubre diez módulos a 1440×900, 1280×800 y 900×700, en ES/EN, con un único encabezado principal y sin overflow global. Edge local revisó Dashboard y Configuración por fichas/preferencias con logo oficial y consola limpia. El flujo JSON completo de restauración también pasó con datos sintéticos.

La única excepción de cierre es zoom real de Edge al 100 % y 200 %: el conector solo puede cambiar viewport, y los atajos no cambiaron la escala. Esta evidencia debe ser manual y visible antes de sustituir la aceptación visual reabierta por un dictamen final. No se publicó ni se tocaron datos de la usuaria.

Fuentes contrastadas: `AGENTS.md`, `PRD.md`, `DECISIONS.md`, `SCREEN_MAP.md`, `ARCHITECTURE.md`, `IMPORT_EXPORT_SPEC.md`, `PROGRESS.md`, `VERIFIER.md`, planes de refinamiento del 2026-08-29 y cierre pre-B1 del 2026-09-01; componentes, CSS, repositorio, contratos de respaldo y pruebas dirigidas. No se repitió una auditoría exhaustiva de todo el dominio financiero ni del archivo Excel original.

## Aclaraciones nuevas de la usuaria durante la inspección

1. **Eliminar debe ser una posibilidad real incluso con relaciones.** Archivar se recomienda ante impacto, pero no sustituye silenciosamente a eliminar. Antes del borrado se deben identificar los registros/eventos concretos afectados, no únicamente sus conteos. Se exige nueva confirmación y se ofrece eliminar también el historial propio como opción explícita, no obligatoria. Los registros relacionados no desaparecen automáticamente. Esta instrucción corrige la restricción anterior de DEC-179 y REQ-RF-003.
2. **Confirmar/cancelar donde evite errores:** diálogos coherentes con la marca para acciones de riesgo y salida con cambios pendientes; no añadir confirmaciones a cada filtro, búsqueda o navegación inocua.
3. **Configuración por fichas:** agrupar por tipo y abrir el catálogo al seleccionar su ficha, en lugar de desplegar todos los formularios simultáneamente.
4. La entrega de esta sesión es diagnóstico y plan detallado. No constituye implementación ni aprobación visual de una pantalla corregida.

## Cobertura real

| Superficie | Inspección en Edge | Contraste adicional / límite |
|---|---|---|
| Inicio | KPIs y colas sin datos, marca y shell | Código de Dashboard; no se ejercieron pagos ni colas pobladas |
| Leads | Lista, archivados, panel y expediente completo de registro de prueba existente | Transiciones, historial y formulario de conversión leídos; no se ejecutó conversión |
| Clientes y familias | Vacío y alta sin guardar; calendario de nacimiento abierto | `ClientList`, `ClientDetail`; no expediente poblado |
| Viajes | Estado vacío | `TripDetail`, `ServiceDetail`, `PaymentDetail`; variantes pobladas solo código/pruebas |
| Calendario | Vista mensual y filtros | Proyección, semana, agenda y panel revisados en código; no eventos creados |
| Tareas | Vacío, filtros y alta sin guardar | Acciones de filas y expediente revisadas en código/pruebas |
| Comisiones | Estado vacío | Expediente, tracking, tasa y pago revisados en código |
| Proveedores | Vacío y alta lateral sin guardar | Pestañas, listas y plantillas revisadas en código |
| Datos y respaldo | Pantalla cargada, selectores y acciones | No se restauró ni importó en el perfil de la usuaria |
| Configuración | Catálogos desplegados; ancho normal y 900 × 700 | Persistencia, borrador, controles e idioma revisados en código |
| Transversales | Shell, marca, campana vacía, panel y retorno | Búsqueda poblada, errores de escritura y diálogos destructivos no ejercidos en ese perfil |

Pantalla normal observada: 1656 × 978 CSS px. Configuración a 900 × 700 no mostró desbordamiento global en la medición DOM, pero sí composición desproporcionada y controles sin estilo. El ajuste temporal se restableció. **Esto no equivale a una prueba de zoom real al 200 %.** Los atajos enviados no produjeron un cambio medible de viewport; no se certifica zoom. Tampoco se certifica una pasada visual completa EN: las traducciones se contrastaron en código, sin cambiar preferencias persistidas. El complemento permite inspección visible, capturas, accesibilidad y medición DOM; no se afirma haber activado F11.

## Hallazgos trazables

Prioridades: **P1** integridad o acción que puede producir un resultado distinto del mostrado; **P2** usabilidad, accesibilidad o incumplimiento visual; **P3** claridad localizada. C = confirmado; I = riesgo inferido que requiere reproducción sintética antes de modificar lógica.

| ID | Prioridad / certeza | Hallazgo y evidencia | Acuerdo / tratamiento |
|---|---|---|---|
| UAT-01 | P2 / C | Reset de ancho invade la cabecera. `src/design/global.css:1061`, `.detail-panel-controls` tiene margen inferior `-42px`; reproducido en panel Lead. Imagen 1. | DEC-181; reservar su espacio dentro de la cabecera, no superponerlo |
| UAT-02 | P2 / C | `.secondary-button` carece de alineación flex/gap; flecha pegada a texto. `.form-actions` no envuelve y `.detail-actions` no recibe una composición equivalente. CSS:960–976; `LeadDetail.tsx:37–40`. Imágenes 2–3. | Componentes centrales; separar botones y permitir reflujo |
| UAT-03 | P2 / C | Cabecera lateral comprime incluso nombres breves; el expediente completo repite título del módulo y del registro, conserva acciones de lista. `App.tsx`, `DetailWorkspace.tsx`, `LeadDetail.tsx`. | DEC-180; una jerarquía enfocada y navegación global intacta |
| UAT-04 | P2 / C | Proveedores muestra dos h1 iguales; Tareas duplica título y Clientes repite nombre del módulo como texto. `App.tsx:2232`, `ProviderList.tsx`, `TaskBoard.tsx:176`, `ClientList.tsx:8`; Edge e imágenes 5–7. | No es intencional; un propietario de la cabecera por pantalla |
| UAT-05 | P2 / C | Calendario y Tareas usan fieldset/legend visual nativo sin estilos de filtro propios. Separación insuficiente al mes; filtros de fechas dispares. `CalendarPage.tsx:52–53`, `TaskBoard.tsx:178–185`, CSS. Imágenes 4–7. | DEC-182 y petición actual; barra con título discreto y chips |
| UAT-06 | P3 / C | “Saldo de cliente” significa vencimiento `customerBalanceDueOn` de un componente, no un saldo agregado ni la fecha de un pago ya registrado. `calendarProjection.ts:35–44`. | Etiqueta “Vencimientos de cliente”, ayuda breve explicando el origen |
| UAT-07 | P1 / C lógica; efecto poblado pendiente | La proyección no recibe pagos, ni calcula saldo pendiente; tampoco filtra `archivedAt` y estados de componente. `calendarProjection.ts`, props de `CalendarPage`, `App.tsx:1766`. | Reconciliar fechas/estados con reglas de pagos; no representar compromisos resueltos como pendientes |
| UAT-08 | P2 / C | Configuración despliega cinco catálogos; la cuadrícula estira fichas vecinas de alturas distintas. Inputs fuera de `.form-grid` conservan aspecto nativo. `SettingsPage.tsx:149–244`, CSS:482–545; Edge normal/900 px. | Petición actual; índice por fichas y un editor visible |
| UAT-09 | P2 / C | No hay selector de idioma en Configuración, aunque existe en shell. `SettingsPage.tsx`; PRD REQ-117. | Misma preferencia persistente, dos accesos sincronizados |
| UAT-10 | P1 / I | Settings se remonta por `configuration.updatedAt`; cambiar idioma desde shell puede descartar su borrador. Guardado no espera resultado ni presenta fallo propio. `SettingsPage.tsx:228–247`. | Probar pérdida con fallo/idioma; guardar/cancelar y proteger borradores |
| UAT-11 | P2 / C | Eliminación de Tarea existe indirectamente en `… > Archivar o eliminar`, no como acción fácilmente distinguible. En archivados solo se ofrece restaurar. `RecordActions.tsx:36–40`, `TaskBoard.tsx:146`. | Aclaración de usuaria: editar/archivar/eliminar distinguibles también en archivados |
| UAT-12 | P1 / C | Toda Tarea manual tiene evento de creación; `recordImpact.ts:29,109` bloquea con cualquier evento, por lo que el borrado queda prácticamente inaccesible. `manualTask.ts` y `deleteRecord.ts`. | Conflicto resuelto por instrucción actual; diseñar borrado con historial opcional y referencias válidas |
| UAT-13 | P1 / C | Impacto de Comisión cuenta solo eventos y omite `Task.commissionId`. Un registro sintético sin eventos puede considerarse eliminable pese a una tarea dependiente; validación JSON sí rechaza esa referencia después. `recordImpact.ts:108`, `workspaceSnapshot.ts:67`. | Inventario completo de relaciones y validador común, no solo ajustar el modal |
| UAT-14 | P2 / C | Impacto solo muestra conteos; faltan identidad, fecha/acción de eventos y resultado por relación. `RecordImpactDialog.tsx:29–34`. | Aclaración actual: resumen breve con detalle expandible de todos los afectados |
| UAT-15 | P1 / C | “Todos” en Proveedores y Clientes aplica el ternario con precedencia incorrecta y termina mostrando solo archivados. `ProviderList.tsx:18`, `ClientList.tsx:8`. | Corregir predicado compartido; prueba activo + archivado + todos |
| UAT-16 | P2 / C | Abrir un Lead archivado vuelve la lista a “Activos”; observado en Edge. El contexto de lista se pierde al cambiar disposición. | Mantener filtros y selección fuera de ramas desmontadas |
| UAT-17 | P2 / C | Fila de tarea completada/archivada reutiliza acciones de completar y reprogramar; reapertura no aparece allí como acción principal. `TaskBoard.tsx:97–160`. | Acciones derivadas de estado; no repetir acciones inválidas |
| UAT-18 | P1 / I | Formulario Tarea cierra inmediatamente tras invocar callback de guardado, sin esperar persistencia. `TaskBoard.tsx:169`; `TaskForm.tsx:25–29`. | Simular rechazo; conservar borrador y permitir reintento sin duplicar |
| UAT-19 | P2 / C | Selectores de vínculo/filtro Tarea muestran IDs de Viaje/Comisión. `TaskForm.tsx:36`, `TaskBoard.tsx:181`. | Mostrar contexto humano; ID se conserva solo como clave interna |
| UAT-20 | P2 / C | Selector de fecha usa glifo `▦`; no hay tratamiento completo Escape/foco/error inválido. Se remonta por valor. `OperationalDateField.tsx:83–193`. En alta Cliente el botón Añadir toca el campo anterior. | Fecha accesible uniforme; comprobar foco al escribir y error de fecha real |
| UAT-21 | P2 / C | Tarea usa input nativo `type=time`; Edge presenta controles de hora dependientes del navegador/idioma, incompatibles con garantía de captura fija24. `TaskForm.tsx:35`. | Control HH:mm, no prometer invariante con un widget regional |
| UAT-22 | P2 / C | Historial Lead presenta claves como `lead_quote_preparing` y `record_archived`; carga de archivos en Datos expone “Choose File”. `LeadDetail.tsx`, catálogo i18n, `DataBackupsPage.tsx`; Edge. | REQ-116/RF-009: interfaz estática traducida, sin tocar datos capturados |
| UAT-23 | P2 / C | Menú tiene foco inicial y Escape pero no manejo completo de flechas/salida; modal impacto solo declara aria-modal sin aislar foco ni Escape. CSS de confirmación sin límite vertical propio. `ActionMenu.tsx`, `RecordImpactDialog.tsx`. | Teclado, retorno de foco, scroll del diálogo y no activación accidental |
| UAT-24 | P2 / C | Toast de tareas es un aside sin caducidad, distinto del sistema global; tooltip existe pero no se encontró uso del prop `tooltip=` en consumidores. No existen acordeones, stepper, barra de progreso ni switch semántico. | DEC-182: implementar aplicaciones útiles, no solo archivos de componentes |
| UAT-25 | P2 / C | Formulario Proveedor en panel muestra campos contiguos y textos comprimidos; Comisión tiene tracking fuera de estilos generales y muchas acciones en una fila; Servicio/Pago comparten riesgos de cabecera/formulario. | Corrección transversal, con pruebas pobladas de los ocho expedientes |
| UAT-26 | P3 / C | Vacío Cliente solo habla de conversión pese a alta independiente; Proveedor promete carga histórica pese a alta manual disponible. | Corregir textos para describir opciones actuales, sin nuevas funcionalidades |
| UAT-27 | P2 / C | REQ-RF-009 del refinamiento aún dice formatos regionales; encabezado de spec conserva “propuesta” histórica. PROGRESS cierra visual con evidencia de viewport equivalente, no zoom real. | No usar casillas antiguas como aceptación visual; marcar contradicciones con precedencia |

Los números de línea corresponden al corte local; los nombres de componente/regla son los anclajes estables. Riesgos inferidos no equivalen a reproducción de pérdida real. No se borró nada para demostrar UAT-13.

## Patrones: lo que existe y lo que falta

| Patrón acordado | Estado actual | Aplicación concreta del plan |
|---|---|---|
| Toggle switch | No hay switch semántico; hay checkboxes | Disponibilidad de entradas de catálogo con guardado explícito; no estados financieros/comerciales. No inventar alertas nuevas para llenar una ficha |
| Menú … | Parcial | Acciones distinguibles, estados correctos, edición visible o accesible, borrado también de archivados |
| Icon buttons | Parcial | Reset, cerrar, expandir, búsqueda/campana/calendario; nombre accesible y ayuda al foco |
| Fecha | Parcial | DD/MM/YYYY existente; mejorar calendario, errores y foco; HH:mm invariante |
| Chips | Parcial | Archivo ya usa chips; generalizar a calendario/estado y selecciones activas de filtros |
| Toast + undo | Parcial | Unificar acciones reversibles; éxito solo después de transacción; no undo para dinero/conversión/borrado |
| Acordeón | Ausente | Historial/notas y secciones largas; conservar resumen y borradores montados |
| Stepper | Ausente | Conversión e importación/restauración existentes; no crear alta paralela de Viaje ni forzar estados comerciales a una secuencia |
| Progreso | Ausente | Etapas reales de procesamiento; porcentaje solo con total verificable, nunca simulado |
| Swipe | Correctamente ausente | Sigue fuera del MVP de escritorio |
| Breadcrumbs | Parcial | Existen en completo, pero enlaces no navegables y títulos repetidos; conservar foco de expediente |
| Tooltip / ayuda i | Infraestructura parcial | Impactos, vencimientos, multimoneda/comisión, privacidad de respaldo; no repetir todas las etiquetas |
| Confirmación/cancelación | Parcial | Guardado fallido y salida con borrador; diálogos de riesgo, sin interrumpir filtros inocuos |

## Evidencia automatizada reciente y límites

Se ejecutó:

```text
npm test -- tests/unit/recordImpact.test.ts tests/unit/recordActions.test.tsx tests/unit/taskBoard.test.tsx tests/unit/calendarProjection.test.ts tests/integration/recordLifecyclePersistence.test.ts
```

Resultado: **5 archivos / 22 pruebas pasan**, duración reportada 3.14 s. Primer intento impedido por `spawn EPERM`; ejecución autorizada fuera de esa restricción completada correctamente. Consola de la pestaña inspeccionada: consulta de errores/advertencias devolvió lista vacía en el momento comprobado.

Las pruebas actuales no certifican composición visual y tienen cobertura reducida de referencias/dependencias. No se volvieron a ejecutar la suite completa, E2E, typecheck, lint, build ni axe durante esta auditoría documental; la evidencia anterior conserva su fecha y alcance. No hay certificación nueva de PWA instalada/offline, UAT financiera poblada, zoom200 o restauración.

## Handoff

Plan operativo propuesto: [Corrección visual e interacción por oleadas](../superpowers/plans/2026-09-05-world-memories-visual-interaction-closure.md). Registra los cambios de comportamiento solicitados y una arquitectura propuesta para hacerlos seguros; la implementación comienza después de aprobar ese plan. No continuar con publicación ni B1 como consecuencia de este diagnóstico.
