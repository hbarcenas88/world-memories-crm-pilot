# World Memories — Plan de implementación del cierre visual e interacción

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` para implementar este plan tarea por tarea. Ejecutor acordado: **Terra High / Tierra Alto**, en línea y por oleadas completas. No activar subagentes ni revisores automáticamente. Marcar casillas solo con evidencia.

**Goal:** corregir las inconsistencias visuales del CRM y materializar los patrones acordados, incluida eliminación deliberada con impacto explícito, sin pérdida accidental ni referencias inexplicables.

**Architecture:** conservar React, repositorio local-first y componentes centrales. Separar presentación, borradores, confirmación de acciones y ejecución transaccional. Para eliminar un registro sin destruir los demás, se propone una referencia histórica mínima de eliminación, distinta de archivar; requiere migración aditiva y compatibilidad de respaldo antes de habilitar el botón destructivo nuevo.

**Tech Stack:** React/TypeScript, CSS y tokens existentes, lucide-react, Dexie/IndexedDB, Vitest/Testing Library, Playwright/axe y PWA existentes. No agregar una biblioteca de diseño ni cambiar de framework.

**Spec:** [Auditoría y aclaraciones de la usuaria](../../qa/2026-09-05-visual-audit.md), PRD REQ-116/117/136, DEC-179–184 y aclaración DEC-185. El comportamiento de eliminación solicitado el 2026-09-05 prevalece sobre el bloqueo absoluto de la versión anterior de DEC-179/RF-003.

## Estado y reglas de ejecución

> **Lectura obligatoria al reanudar — últimos dos prompts del 2026-09-10:** [complemento PRE-01–17 y secuencia A–E](2026-09-10-prepublication-addendum.md). Integra Configuración/PWA y nuevas solicitudes de país, lada, correo, importes y ayudas. Forma parte de la continuidad del goal existente; no publicar basándose únicamente en el adjunto o cierre histórico.

> **Rectificación vigente — 2026-09-10:** la afirmación de implementación completa del 2026-09-08 queda sustituida por el dictamen **parcial / NO GO** de [PRE-01–11](../../qa/2026-09-10-prepublication-review.md). No falta únicamente zoom o publicación. Reanudar por el fallo crítico de actualización y después por las casillas no satisfechas de Oleadas1–6; conservar evidencia histórica sin presentarla como cierre universal. Alternativas de sombras/superficies y omisión de respaldo se mantienen separadas de acuerdos ya aprobados.

- **Estado: implementación automatizada de Oleadas 1–6 verificada el 2026-09-08; cierre manual de zoom real pendiente.** No confundir la evidencia automática con aceptación visual final ni con autorización de publicación. `PROGRESS.md` y `VERIFIER.md` conservan los resultados y la excepción.
- Leer primero `AGENTS.md`, `PROGRESS.md`, `DECISIONS.md`, `DATA_MODEL.md`, `ARCHITECTURE.md`, `IMPORT_EXPORT_SPEC.md` y el diagnóstico enlazado. Partir del checkout actual; no asumir que sigue en `95b382b`.
- Las oleadas son unidades verificables con preview, no pausas automáticas para preguntar “¿continúo?”. Tras aprobación del plan, avanzar continuamente mientras no aparezca una decisión nueva o riesgo crítico.
- Trabajar exclusivamente con datos sintéticos y una base/origen aislados. Nunca ejecutar borrado, migración experimental o restauración en el perfil de Edge de la usuaria ni tocar sus Excel.
- No modificar SVG/logo oficial ni inventar otra identidad. Reutilizar el monograma y los tokens oficiales; no generar un nuevo concepto de marca.
- No publicar, hacer push, cambiar Pages ni crear B1 desde este plan. El piloto existente se mantiene hasta una autorización de actualización. No usar un commit como sustituto de pruebas ni de aceptación visual.
- Sin Local Storage operativo. Preferencias pequeñas existentes pueden conservar su adaptador; registros/configuración permanecen detrás del repositorio.
- Todo cambio de dominio debe demostrar requisito, compatibilidad, rollback y pruebas antes de conectar UI. Cambios puramente visuales no justifican migraciones.
- No implementar duplicación general de registros, nuevas alertas externas, móvil, gráficos, backend ni un alta de Viaje paralela al flujo aprobado. “Cuando aplique” no significa aplicar todos los patrones a todas las pantallas.
- Por tarea: escribir primero la prueba de regresión descrita, observar su fallo por el defecto concreto, implementar, ejecutar prueba y revisar diff. Los errores de entorno no cuentan como rojo funcional.
- Al final de **cada oleada**: pruebas dirigidas, `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check`, preview de los flujos cambiados y actualización de PROGRESS/VERIFIER con límites. Suite completa y E2E completos obligatorios en el cierre final.

## 1. Contrato de presentación transversal

Los siguientes valores son reglas de implementación propuestas en este plan, no afirmaciones del manual de marca. Definirlos una sola vez como tokens semánticos en el sistema existente:

| Elemento | Regla verificable |
|---|---|
| Icono + etiqueta | `inline-flex`, alineación centrada, separación 8 px; SVG `flex-shrink:0`; nunca flecha concatenada al texto |
| Botones vecinos | Separación 12 px; `flex-wrap:wrap`; ninguna pareja se toca; textos largos pueden envolver con padding vertical |
| Filtros | Título discreto + controles/chips, sin borde de fieldset nativo; separación interna 8 px y 24 px respecto del siguiente bloque |
| Campo | Etiqueta visible, separación 8 px; altura mínima44, ancho100%, `min-width:0`, `box-sizing:border-box`; textarea equivalente |
| Grupos/secciones | Separación24; padding de fichas24 normal y16 en contenedor estrecho; no alturas iguales forzadas entre catálogos abiertos |
| Foco | Visible y con contraste; estados no comunicados solo con color |
| Cabeceras | Un h1 por vista; h2 para secciones; acciones de lista fuera de expediente completo |
| Panel | Ancho solicitado entre320 y560, predeterminado350 conforme RF-006. Clamp al espacio disponible sin sobrescribir preferencia. Si no caben lista + panel, disposición apilada accesible; nunca cortar campos para respetar un ancho persistido |
| Reset/cerrar/expandir | Espacio propio dentro de toolbar; prohibido margen negativo de superposición; nombres accesibles y tooltip al foco/hover |
| Diálogo | Máximo `min(640px, calc(100vw - 32px))`; máximo alto `calc(100dvh - 32px)` con cuerpo desplazable; footer accesible y acciones envolventes |
| Densidad | No encoger tipografía para ocultar fallos. Control44 mínimo; textos/etiquetas legibles en ES y EN y con zoom200 |

Base CSS orientativa a integrar en clases comunes, no a copiar por expediente:

```css
.action-row { display:flex; flex-wrap:wrap; align-items:center; gap:var(--wm-action-gap); }
.button { display:inline-flex; align-items:center; justify-content:center; gap:var(--wm-icon-gap); min-height:44px; padding:10px 16px; }
.button svg { flex-shrink:0; }
.field-control { box-sizing:border-box; min-width:0; width:100%; }
.field-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr)); gap:16px; }
```

No reemplazar a ciegas todas las clases existentes: consolidar variantes primary/secondary/danger/text sobre la misma geometría y mantener sus tonos semánticos.

## 2. Contrato de cambios, confirmación y cancelación

| Acción | Comportamiento definido |
|---|---|
| Buscar, filtrar, cambiar mes/vista, desplegar sección | Inmediato, sin modal ni evento de negocio |
| Editar campos | Cambia solo borrador. Guardar confirma una vez; Cancelar limpio vuelve sin modal |
| Salir/cerrar/cambiar registro con borrador sucio | Diálogo “Tienes cambios sin guardar”: **Guardar y continuar**, **Descartar cambios**, **Seguir editando**. Si validación o persistencia falla, permanecer en formulario, mantener borrador y mostrar error |
| Cambiar idioma con borrador | Traducir sin desmontar ni perder valores. Si el flujo no permite conservar borrador, ejecutar el mismo guard; nunca perderlo silenciosamente |
| Cerrar pestaña/ventana | `beforeunload` solo con borrador sucio. El navegador controla ese diálogo y su texto/estilo; no prometer personalización de marca de una restricción nativa |
| Archivar | Si hay impacto, mostrar resumen y recomendar; ejecutar solo mediante “Archivar”. Toast con Deshacer después del éxito |
| Completar/reabrir tarea | Acción explícita + toast Deshacer; no añadir modal repetitivo si es reversible y no produce dinero |
| Reprogramar tarea | Campo modifica fecha local; botones **Aplicar fecha** y **Cancelar**. No guardar/eventar por cada fecha válida durante escritura |
| Pausar/cancelar Lead o Viaje | Mantener reglas aprobadas, motivos y decisión por componente; confirmar efecto con botón específico, nunca interruptor |
| Pago/conversión/restauración/borrado | Confirmación explícita del resumen; mientras persiste bloquear doble envío. Sin toast de deshacer |
| Carga/fallo | Estado visible; no cerrar ni mostrar éxito antes del commit. Reintento no duplica transacción |

Todos los diálogos internos usan el mismo `ConfirmDialog`; foco inicial en acción segura, Tab/Shift+Tab contenidos, Escape equivalente a cancelar antes de ejecutar, retorno al disparador. Si el disparador desaparece por eliminación, foco al encabezado de lista. Click fuera no confirma ni descarta; durante commit no cerrar ni aceptar otra operación. Alertas/errores usan live region, no se anuncian repetidamente por cada render.

## Oleada 1 — Base visual, cabeceras y controles

### Tarea 1.1 — Geometría común y jerarquía (UAT-01–05, 25)

**Modificar:** `src/design/global.css`, `src/design/components/ResizableDetailPanel.tsx`, `src/design/components/DetailWorkspace.tsx`, `src/app/App.tsx`, cabeceras en `features/leads/LeadDetail.tsx`, `clients/ClientList.tsx`, `providers/ProviderList.tsx`, `tasks/TaskBoard.tsx`.

**Crear:** `src/design/components/RecordHeader.tsx`, `src/design/components/ActionRow.tsx`; pruebas `tests/unit/recordLayout.test.tsx`, `tests/e2e/visual-layout.spec.ts`.

**Interfaces:** `RecordHeader({title, eyebrow?, actions?, headingLevel:1|2})`; `ActionRow({children, align?:'start'|'end'})`. Son componentes visuales sin acceso a repositorio.

- [ ] Añadir prueba de render del módulo con un único h1 y sin duplicación del nombre en h2. En expediente completo exigir un h1 del registro, breadcrumb del módulo y ausencia de botón “Nuevo…” perteneciente a lista.
- [ ] Escribir E2E sintético del panel con nombre largo y acciones; medir rectángulos visibles y demostrar separación positiva entre reset/expandir/cerrar. Probar320/350/560 y EN antes de corregir.
- [ ] Retirar margen negativo del reset; integrar controls en espacio reservado de cabecera; aplicar contrato de botones/campos y reflujo. No ocultar acciones para hacer pasar el test.
- [ ] Hacer que la cabecera pertenezca al shell en listas y al workspace en completo; retirar h1/h2 duplicados de Proveedor/Tarea y texto duplicado Cliente. No eliminar headings de secciones reales.
- [ ] Aplicar estilos de campo a Proveedor, tracking de Comisión, notas de Cliente, Servicio y Pago, incluidos controles fuera de `.form-grid`.

```ts
expect(screen.getAllByRole('heading', {level:1})).toHaveLength(1);
// En E2E, después de abrir el panel con fixture sintético:
const resetBox = await page.getByRole('button',{name:'Restablecer ancho del panel'}).boundingBox();
const openBox = await page.getByRole('button',{name:'Abrir expediente completo',exact:true}).boundingBox();
expect(resetBox && openBox).toBeTruthy();
// Comprobar no-intersección de rectángulos, no igualdad a una captura vacía.
```

**Aceptación/preview:** listas de Cliente/Proveedor/Tarea + Lead panel/completo a ancho normal y estrecho. Ninguna acción toca otra, flechas separadas, título legible. No certificar Servicio/Pago solo por compartir CSS: quedan escenarios poblados en Oleada6.

### Tarea 1.2 — Fecha, hora y accesibilidad básica (UAT-20–23)

**Modificar:** `OperationalDateField.tsx`, `ActionMenu.tsx`, `IconButton.tsx`, `Tooltip.tsx`, `src/features/tasks/TaskForm.tsx`; crear `src/design/components/OperationalTimeField.tsx`, `ConfirmDialog.tsx`; ampliar `tests/unit/OperationalDateField.test.tsx`, crear `operationalTimeField.test.tsx`, `confirmDialog.test.tsx`.

**Interfaces:** `OperationalTimeField({value?:string,onChange:(isoTime:string)=>void,'aria-label':string})`, almacenamiento HH:mm. El campo de fecha debe exponer validez al formulario, por ejemplo `onValidityChange?:(valid:boolean)=>void`, sin cambiar ISO interno.

- [ ] Pruebas rojas: entrada 31/02/2026, año bisiesto, borrar fecha existente, entrada parcial después de fecha válida, foco no perdido al completar10 caracteres; formulario no debe guardar el valor viejo si el texto visible es inválido.
- [ ] Sustituir glifo por icono de calendario; estabilizar instancia en vez de remontar por cada `value`. Sincronizar cambios externos sin destruir borrador que se está editando; mostrar error localizado/aria-invalid al confirmar fecha inválida.
- [ ] Calendario emergente: Escape cierra y devuelve foco; flechas desplazan día, Home/End semana, PageUp/Down mes y Enter selecciona; filas/celdas semánticas correctas y día completo anunciado. Posicionar dentro de viewport, abrir hacia arriba si no cabe debajo.
- [ ] Hora fija HH:mm con máscara/validación real00:00–23:59; opcional vacío, 24:00/13:60 inválidos. No depender de presentación regional de `type=time`.
- [ ] Menú con flechas arriba/abajo, Home/End, Escape, Tab que abandona/cierra correctamente y retorno de foco. Tooltip con Escape y sin tapar el control; ayudas importantes también visibles al abrir el diálogo o detalle.
- [ ] Implementar `ConfirmDialog` del contrato de sección2, con test de foco, scroll, cancelación y doble envío. No conectar borrado nuevo todavía.

**Pruebas dirigidas:** `npm test -- tests/unit/recordLayout.test.tsx tests/unit/OperationalDateField.test.tsx tests/unit/operationalTimeField.test.tsx tests/unit/confirmDialog.test.tsx`.

## Oleada 2 — Filtros claros y Configuración por fichas

### Tarea 2.1 — Filtros consistentes y contexto conservado (UAT-05/06/15/16/19)

**Crear:** `src/design/components/FilterBar.tsx`, `FilterChip.tsx`, `src/features/records/archiveVisibility.ts`, `src/features/records/recordLabels.ts`.
**Modificar:** `CalendarPage.tsx`, `TaskBoard.tsx`, `ClientList.tsx`, `ProviderList.tsx`, `ArchiveFilterChips.tsx`, estado de lista en `App.tsx`. **Pruebas:** `tests/unit/archiveVisibility.test.ts`, `filterBar.test.tsx`, `tests/e2e/filter-context.spec.ts`.

**Interfaces:** `matchesArchive(record:{archivedAt?:string}, filter:'active'|'archived'|'all'):boolean`; `FilterChip({label,selected,onToggle})` usa botón `aria-pressed`; `FilterBar({label,children,onClear?,hasFilters})` no realiza persistencia. Funciones de `recordLabels.ts` resuelven contexto con entidades actuales, sin sustituir IDs internos.

```ts
export const matchesArchive = (r:{archivedAt?:string}, f:'active'|'archived'|'all') =>
  f === 'all' || (f === 'archived' ? Boolean(r.archivedAt) : !r.archivedAt);
expect([{}, {archivedAt:'2026-09-05T00:00:00Z'}].filter(r=>matchesArchive(r,'all'))).toHaveLength(2);
```

- [ ] Aplicar predicado compartido a todas las listas; tests activo/archivado/todos, no solo vacíos.
- [ ] Calendario: título “Mostrar”/“Show”; chips Viajes, Tareas, Vencimientos de cliente, Comisiones; combinables, todos inicialmente seleccionados; sin selección muestra vacío explicativo, no reactivar todos silenciosamente. “Restablecer” vuelve a cuatro. Margen24 antes del mes.
- [ ] Tareas: chips Abiertas/Completadas/Todas, grupo archivo separado; Viaje/Proveedor con select accesible y resumen en chip de selección activa; Desde/Hasta como rango unido visualmente. Limpiar devuelve estado abierto, archivo activo y sin límites. Rechazar Desde>Hasta con error no destructivo.
- [ ] Etiquetas de Viaje: destino si existe + Cliente + fecha conocida; Comisión: Proveedor + Viaje + moneda; fallback legible “Viaje sin destino”, no UUID como texto primario. Desambiguar iguales con sufijo corto solo si hace falta.
- [ ] Conservar filtros/scroll/selección al abrir panel, completo y volver, elevando estado fuera de ramas desmontadas; no persistir filtros como datos operativos ni añadir historial de navegación.

**Preview:** Calendar/Tareas con filtros combinados y resultado vacío, Lead archivado→panel→completo→volver sin cambiar filtro; Proveedores “Todos” muestra ambos estados.

### Tarea 2.2 — Índice de Configuración y guardado seguro (UAT-08–10)

**Modificar:** `src/features/settings/SettingsPage.tsx`, `src/app/App.tsx`, i18n; crear `SettingsCatalogEditor.tsx`, `src/design/components/ToggleSwitch.tsx`, `src/app/useUnsavedChangesGuard.ts`. **Pruebas:** `settingsNavigation.test.tsx`, `unsavedChangesGuard.test.tsx`, integración `configurationPersistence.test.ts`, E2E `settings-cards.spec.ts`.

- [ ] Índice inicial con fichas de Tipos de viaje, Fuentes, Canales, Motivos, Relaciones y Preferencias/formato. Cada ficha: icono existente, título, explicación breve, cantidad activa/total si catálogo y “Abrir”; no formularios desplegados debajo.
- [ ] Click abre un editor de ese catálogo dentro del área principal; botón “Volver a Configuración”, no otro panel superpuesto. Solo un catálogo editándose. Mantener catálogo vacío y valores históricos sin resembrar.
- [ ] Editor: lista de filas/fichas compactas con etiqueta, estado, acción editar; alta con etiqueta visible; Guardar/Cancelar del borrador. Validar nombre no vacío, duplicado normalizado por catálogo y ID estable. No modificar IDs al renombrar.
- [ ] Switch “Disponible para nuevas selecciones” para `entry.active`, con texto Activo/Inactivo y explicación de conservación histórica; cambia borrador y se persiste al Guardar, no por click. No usar switch para estado de Lead/Viaje/Pago/Comisión/Proveedor.
- [ ] Preferencias: selector ES/EN sincronizado con shell y repositorio; formatos fijos solo lectura. No crear un switch de idioma ni inventar preferencias inexistentes.
- [ ] `useUnsavedChangesGuard` centraliza `requestNavigation(action):Promise<boolean>` con tres decisiones del contrato; manejar referencias a borrador actual para evitar closures obsoletos. Cancelar limpio no pregunta. Cambiar idioma conserva borrador y sucio.
- [ ] Guardar espera `Promise`, muestra pendiente/error, no desmonta al fallar. Bloquear segunda pulsación y no crear eventos por editar sin guardar. Confirmación de pérdida al cambiar ficha, módulo, registro o cerrar panel.

```ts
// Prueba con repositorio que rechaza una sola escritura:
saveConfiguration.mockRejectedValueOnce(new Error('synthetic write failure'));
await user.click(screen.getByRole('button',{name:'Guardar configuración'}));
expect(await screen.findByRole('alert')).toBeVisible();
expect(screen.getByLabelText('Nombre de la entrada')).toHaveValue('Catálogo sintético');
expect(screen.getByRole('button',{name:'Guardar configuración'})).toBeEnabled();
```

**Nota sobre alertas:** PRD136/139 prevé alertas editables; la forma global de editarlas no está definida por la tabla de patrones. No agregar switches decorativos o nuevos calendarios de avisos en esta oleada. Registrar esa parametrización como decisión separada si se desea ampliarla, manteniendo las alertas aprobadas existentes.

## Oleada 3 — Eliminación real, impacto detallado y compatibilidad

Esta oleada es de **integridad de datos**, no un simple modal. La propuesta técnica siguiente debe quedar incluida en la aprobación del plan. No habilitar eliminación con dependencias hasta completar las tareas3.1–3.3 y el round-trip de respaldo.

### Contrato de eliminación propuesto

1. `Editar`, `Archivar` y `Eliminar` son acciones distintas en el menú. Los archivados ofrecen Editar, Restaurar y Eliminar. Archivar nunca se ejecuta al elegir Eliminar.
2. Elegir Eliminar abre el impacto: nombre/tipo del objetivo; resumen de registros que **se conservan**; historial propio; consecuencias financieras si corresponde. Grupos expandibles enumeran nombres, tipo de vínculo y resultado. Eventos muestran fecha/hora, acción traducida y resumen de cambio seguro, nunca payload JSON crudo.
3. Si hay impacto, recomendación visible “Archivar conserva el registro y sus relaciones”. Opciones: Cancelar, Mejor archivar y Continuar con eliminación.
4. Historial propio: control **“Eliminar también estos eventos”**, sin seleccionar inicialmente. Ofrecerlo y explicar que retenerlo conserva trazabilidad; no afirmar que conservarlo obliga a dejar huérfanos. Solo alcanza eventos cuyo aggregateType/aggregateId sea el objetivo, no eventos de otros registros que lo mencionen.
5. Segunda confirmación en el mismo diálogo, no mil pantallas: resumen final exacto, opción de historial elegida, consecuencias y botón **Eliminar definitivamente**. Cancelar/Vuelve a revisar siguen disponibles. No requiere escribir nombre ni otra fricción nueva.
6. Registros relacionados no se borran ni archivan en cascada. Se elimina físicamente la fila objetivo de su tabla; queda una **referencia histórica mínima de eliminación** cuando se necesita para resolver vínculos/historial o evitar recreación automática. Se comunica explícitamente: “Los registros relacionados conservarán una referencia a [tipo] eliminado”. No es un registro archivado ni puede restaurarse con Deshacer.
7. La referencia no guarda copia completa del registro: tipo, ID original, etiqueta de identificación mínima, fecha de eliminación, política de historial y clave de automatización si aplica. Sin notas, contactos, importes ni payload completo del objetivo. La etiqueta aún es información local, no anonimización; el diálogo lo explica.
8. Relaciones obligatorias existentes pueden seguir resolviendo a esa referencia, con etiqueta **Registro eliminado**. No se asignan a un sustituto inventado. Selectores nuevos solo admiten entidades vivas; los registros supervivientes permiten editar campos no relacionados y cambiar una relación eliminada por una válida con las reglas actuales.
9. Notas/componentes/plantillas/pagos relacionados no desaparecen como consecuencia oculta. Se conservan, identifican en impacto y sus vistas soportan padre eliminado. Plantillas cuyo proveedor fue eliminado no generan nuevas tareas hasta reasignación válida; tareas/obligaciones supervivientes no desaparecen de las colas solo porque el padre fue borrado.
10. Borrar un Pago recalcula el saldo y puede volver a generar vencimientos; borrar una Comisión cambia su total; borrar Cliente/Lead/Viaje/Proveedor no borra pagos/comisiones supervivientes ni cambia sus importes. Mostrar antes/después por moneda cuando el cálculo ya es verificable; nunca inventar un monto.
11. Si una tarea de seguimiento automático fue eliminada, su clave de automatización evita que la reconciliación la recree al refrescar. No bloquear otras tareas ni nuevos ciclos distintos legítimos.
12. Previsualización y ejecución usan el mismo grafo; si cambian el objetivo, sus dependencias o el historial entre ambas, abortar y refrescar impacto. No ejecutar una decisión obsoleta.
13. Borrado, política de eventos y referencia histórica se confirman en una transacción. Fallo en cualquier paso: rollback total, mantener diálogo y no anunciar éxito. Sin undo; recuperar solo con respaldo anterior y flujo de restauración aprobado.

### Tarea 3.1 — Grafo completo y plan transaccional (UAT-11–14)

**Modificar:** `src/application/recordImpact.ts`, `src/application/ports.ts`, `src/application/use-cases/deleteRecord.ts`, `src/domain/types.ts`, `src/application/workspaceSnapshot.ts`.
**Crear:** `src/application/deletionPlan.ts`, `src/domain/recordReference.ts`. **Pruebas:** `recordImpact.test.ts`, `tests/unit/deletionPlan.test.ts`.

**Interfaces a producir:**

```ts
type EventDisposition = 'keep' | 'delete_owned';
type DeletedRecordReference = Readonly<{
  kind: ManagedRecordRef['kind']; id: string; displayLabel: string;
  deletedAt: string; eventDisposition: EventDisposition;
  automationKey?: string;
}>;
type ImpactItem = Readonly<{
  collection: string; id: string; label: string; relation: string;
  outcome: 'delete_target' | 'keep_related' | 'keep_event' | 'delete_event';
  occurredAt?: string; summary?: string;
}>;
type DeletionPreview = Readonly<{
  target: ManagedRecordRef; displayLabel: string;
  items: readonly ImpactItem[]; eventDisposition: EventDisposition;
  fingerprint: string; // token privado, jamás mostrar ni registrar
}>;
// Funciones puras, sin fechas actuales implícitas ni IO:
buildDeletionPreview(snapshot: WorkspaceSnapshot, target: ManagedRecordRef,
  eventDisposition: EventDisposition): DeletionPreview;
executeDeletion(repository: WorkspaceRepository,
  input: {preview: DeletionPreview; confirmedAt: string}): Promise<void>;
```

- [ ] Inventariar **todos** los vínculos de `assertWorkspaceSnapshot`, incluyendo Task→Commission, Task→component/template, Commission→component, referencias de Lead/Trip, notas, conceptos adicionales y eventos. Distinguir referencias de payload históricas de claves foráneas; no borrar eventos ajenos por encontrar una cadena similar.
- [ ] Crear fixtures del grafo para cada uno de los ocho tipos gestionables, con cero/una/muchas relaciones y archivados. Probar que Comisión con Task dependiente aparece con identidad y resultado, no `canDelete:true` sin explicación.
- [ ] Sustituir la autorización binaria de `canDelete` por plan ejecutable. En UI antigua, mantener bloqueo hasta nueva transacción lista; no relajar primero el guard existente.
- [ ] Construir fingerprint determinista a partir de los valores relevantes ordenados del grafo. Comparar en transacción mediante cálculo síncrono; no usar red ni operaciones crypto externas que puedan cerrar transacción IndexedDB. No loguear contenido sensible del fingerprint.
- [ ] Resolver referencias como unión `{state:'live',record}` / `{state:'deleted',reference}` / `{state:'missing'}`. `missing` sigue siendo error de integridad; `deleted` es estado explicado. Nuevas altas no pueden elegir `deleted`.

```ts
const preview = buildDeletionPreview(fixture, {kind:'commission',id:'commission-1'}, 'keep');
expect(preview.items).toContainEqual(expect.objectContaining({
  collection:'tasks', id:'task-1', outcome:'keep_related'
}));
expect(preview.items.some(i=>i.outcome==='delete_event')).toBe(false);
```

### Tarea 3.2 — IndexedDB, respaldo y referencias eliminadas

**Modificar:** `src/infrastructure/db/worldMemoriesDb.ts`, `repositories.ts`, `src/test/memoryRepository.ts`, `src/application/workspaceSnapshot.ts`, `src/infrastructure/export/jsonBackup.ts`, `excelExport.ts`, `src/infrastructure/import/csvImport.ts`, guard de actualización PWA y reconciliación local. **Crear pruebas:** `tests/integration/deletionPersistence.test.ts`, `deletedReferenceBackup.test.ts`, `tests/unit/deletedReferenceResolution.test.ts`.

- [ ] Migración aditiva **v13→v14**: tabla `deletedRecordReferences` con clave compuesta `[kind+id]`, índice `deletedAt`, `automationKey`; conservar todos los stores/índices actuales y ningún borrado durante upgrade. Si al ejecutar existe versión superior, reservar siguiente versión y registrar motivo, nunca redefinir una versión usada.
- [ ] Snapshot **v3** incluye `deletedRecordReferences`; separar tipos explícitos V1/V2/V3 para no hacer que un `Omit` dinámico convierta campos nuevos en obligatorios de backups antiguos. V1→V2→V3 añade configuración/conceptos según actualización vigente y `deletedRecordReferences:[]` sin reescribir filas.
- [ ] Validador exige exclusión live/deleted del mismo `(kind,id)`, referencias existentes vivas o históricas, eventos propios válidos y cero `missing`. Tablas operativas no incluyen las referencias como registros vivos. Un archivo con referencia de tipo incorrecto, duplicada o desaparecida se rechaza completo.
- [ ] JSON verifica checksum original antes de convertir versión; preservar opciones de historial e IDs; actualizar conteos, descarga actual y protección de cambio de esquema. Respaldo anterior obligatorio antes de actualizar esquema en un entorno con datos; no ejecutar esa actualización en el perfil UAT durante desarrollo.
- [ ] Restaurar snapshot sustituye también referencias históricas: restauración explícita de backup anterior puede recuperar el registro. No mezclar referencias de una base anterior con la restaurada.
- [ ] CSV sintético: añadir archivo versionado opcional `deleted_record_references.csv`, manifiesto/conteos/checksum, columnas kind/id/display_label/deleted_at/event_disposition/automation_key; paquetes antiguos siguen válidos. Importación aditiva rechaza reutilizar ID eliminado o vivo, no resucita registros por accidente. Excel: hoja de referencias eliminadas y etiquetas legibles de vínculos conservados; no constituye respaldo restaurable.
- [ ] Actualizar lecturas de los ocho expedientes, listas, búsqueda, calendario, KPIs, importación/exportación y guardas de edición para resolver referencias históricas. No sustituir validación real por `?.` que silencie datos faltantes.
- [ ] Reconciliación respeta automationKey de una tarea eliminada; no vuelve a crearla al abrir/refrescar. Historia conservada accesible desde el aviso del vínculo eliminado, sin fingir que existe expediente editable.
- [ ] Fallos inyectados después de referencia histórica, después de borrar objetivo y antes/después de eventos: comparar snapshot pre/post idéntico al fallar. Ensayar eliminación seguida de respaldo, base limpia, restauración y conteos/relaciones exactos.

**Documentos afectados al implementar:** `DATA_MODEL.md`, `ARCHITECTURE.md`, `IMPORT_EXPORT_SPEC.md`, DEC-185; no afirmar compatibilidad hasta tener pruebas.

### Tarea 3.3 — Diálogo de impacto y acciones (UAT-11–14/23)

**Modificar:** `RecordActions.tsx`, `RecordImpactDialog.tsx`; crear `ImpactDetails.tsx`; integrar `ConfirmDialog`. **Pruebas:** `recordActions.test.tsx`, `tests/e2e/delete-records.spec.ts`.

- [ ] Dos estados internos `review` y `confirm`, conservando foco, elección de eventos y referencia al preview. Resumen fijo visible; grupos expandibles muestran **todos** los elementos con paginado local si son numerosos, no un recorte oculto a tres eventos.
- [ ] Acciones explícitas para activo/archivado. Error al cargar impacto mantiene el menú/diálogo con Reintentar; durante carga no habilitar confirmación destructiva.
- [ ] Conservar la posibilidad de Mejor archivar sin seleccionar borrado de eventos. Elegirlo llama al caso de uso de archivo existente, jamás a executeDeletion.
- [ ] Confirmación espera transacción; si fingerprint cambia vuelve a review con aviso “Cambió información relacionada; revisa el impacto actualizado”. Si falla almacenamiento, conserva opciones y muestra error; no cierra por adelantado.
- [ ] Probar los ocho tipos con relaciones e historial keep/delete_owned; objetivo desaparece, relacionados siguen presentes con explicación y sin huérfanos, conteos de eventos según elección. Cancelar en cualquier fase no modifica nada.

**Gate especial de oleada:** no seguir a una publicación ni llamar “seguro” al borrado con solo pruebas del modal. Requiere integración IndexedDB + JSON v1/v2/v3 + revisión de estados supervivientes poblados. Ante impacto no resuelto por este contrato, detener esa tarea y registrar decisión, nunca elegir cascada.

## Oleada 4 — Tareas, expedientes y ayudas pragmáticas

### Tarea 4.1 — Tareas con acciones y borradores correctos (UAT-17–21)

**Modificar:** `TaskBoard.tsx`, `TaskForm.tsx`, `TaskDetail.tsx`, handlers de tareas de `App.tsx`; usar guard y diálogos ya definidos. **Pruebas:** `taskBoard.test.tsx`, `tests/e2e/manual-tasks.spec.ts`.

- [ ] Estado open/activo: Completar visible; Editar/Reprogramar/Abrir completo en ubicación consistente; lifecycle en menú. completed/activo: Reabrir, no Completar. archived: Editar/Restaurar/Eliminar; no completar ni reprogramar inadvertidamente antes de restaurar.
- [ ] Formulario h2 “Nueva tarea”/“Editar tarea”, errores localizados, callbacks `Promise<void>` esperados. Cerrar solo tras éxito. Guard sucio en cancelar/navegar; vínculos y fecha/hora conservados al fallo.
- [ ] Reprogramación con borrador y Aplicar/Cancelar, también en Dashboard, Lead y Viaje. Comprobar un único evento tras aplicar y ninguno tras cancelar o escribir.
- [ ] Reutilizar el toast global con Deshacer para completar/reabrir/archivo. Duración6000 ms, pausa en hover/foco, texto anunciado; acción inversa disponible permanentemente en registro aunque caduque toast. Si undo falla mostrar error, no fingir reapertura.

### Tarea 4.2 — Expedientes, acordeones y traducción (UAT-03/22/24–26)

**Crear:** `src/design/components/AccordionSection.tsx`, `src/design/components/ContextHelp.tsx`; modificar los ocho `*Detail.tsx`, `ProviderTaskTemplates.tsx`, `LeadConversionForm.tsx`, i18n, `DetailWorkspace.tsx` y `DataBackupsPage.tsx`. **Pruebas:** `accordionSection.test.tsx`, `activityLabels.test.ts`, `tests/e2e/record-workspaces.spec.ts`.

- [ ] Cabecera común y breadcrumbs con ancestros navegables solo en workspace completo; actual `aria-current=page`. Reutilizar guard al navegar; volver mantiene filtros. Evitar título doble del mismo registro.
- [ ] Acordeones para historial/notas y secciones largas; en Viaje resumen financiero/fechas/contacto siempre visibles, Servicios/Pagos/Tareas con resumen de conteo y estado visible aun cerrados. Mantener borradores montados; sección con error se abre y lleva foco al campo inválido.
- [ ] Proveedor conserva sus pestañas Datos/Comisiones/Plantillas; no reemplazarlas por tres acordeones simultáneos. Acordeones solo dentro de plantillas largas si aporta reducción real de contenido.
- [ ] Catálogo tipado de etiquetas/resúmenes de eventos conocidos. No exponer `record_archived`, `lead_quote_preparing` ni payload crudo. Evento histórico desconocido: “Actividad registrada” + fecha, sin inventar semántica. No modificar tipo/payload almacenado.
- [ ] Ayuda i focalizada: vencimiento de cliente, impacto/eliminación, participación bruta/neta de Comisión, tasa propia frente a tasa del Viaje y diferencia Excel/JSON. Texto de riesgo importante visible en el diálogo, no exclusivamente tooltip.
- [ ] Selectores de archivo con botón propio “Seleccionar archivo”/“Choose file” y nombre seleccionado; input nativo accesible activado por label. No abrir selector automáticamente ni leer archivos fuera de elección de usuaria.
- [ ] Corregir vacíos de Cliente/Proveedor para mencionar creación manual disponible; no prometer importación histórica pendiente ni introducir llamadas a importar datos reales.

**Preview:** los ocho expedientes sintéticos, todos con nombre largo, relaciones, historial y errores de validación; lista de campos con estilos nativos residuales debe quedar vacía o justificada por controles externos al DOM (diálogo del navegador).

## Oleada 5 — Calendario coherente y procesos secuenciales

### Tarea 5.1 — Vencimientos y estados visibles (UAT-06/07)

**Modificar:** `calendarProjection.ts`, `CalendarPage.tsx`, `CalendarSidePanel.tsx`, `src/domain/paymentDue.ts`, fuentes de datos en `App.tsx`; contrastar selector de notificaciones/Dashboard para reutilizar cálculo existente. **Pruebas:** `calendarProjection.test.ts`, `tests/e2e/calendar.spec.ts`.

- [ ] Añadir fixture componente activo con importe verificable100USD, pagos100USD: no mostrar como pendiente. Parcial40USD: mostrar vencimiento con saldo60USD. Monedas no compatibles: error de dominio explícito, nunca suma cruzada.
- [ ] Reutilizar regla central `customerBalance`; incorporar pagos a contrato de proyección. Fechas sin importe total verificable: mostrar **fecha límite registrada / saldo no calculable**, no afirmar deuda0 ni deuda positiva. La aclaración del filtro debe cubrir esa distinción.
- [ ] Excluir del calendario operativo registros archivados, tareas completadas y comisiones pagadas/canceladas; componentes cancelados no producen nuevo vencimiento. Para padre eliminado, mantener obligaciones supervivientes con etiqueta/contexto histórico según Oleada3, sin inventar intervalo de Viaje.
- [ ] Pago eliminado o corregido: reproyectar saldo/vencimientos a partir de fuentes actuales, no solo al desmontar módulo. Filtros no alteran proyecciones ni crean eventos.
- [ ] Fechas DD/MM en mensual/semanal/agenda/panel; tarea muestra HH:mm si existe sin crear agenda por horas. Tarea/Comisión abre ID exacto y su contexto, incluidos avisos de relación eliminada.

### Tarea 5.2 — Steppers y progreso real (UAT-24)

**Crear:** `src/design/components/ProcessStepper.tsx`, `OperationProgress.tsx`; modificar `LeadConversionForm.tsx`, `DataBackupsPage.tsx`. **Pruebas:** `processStepper.test.tsx`, `tests/e2e/backup-restore-flow.spec.ts`.

**Interfaces:** `ProcessStepper({steps:readonly {id:string;label:string}[],currentId:string})` muestra estado actual con `aria-current=step`; no navega a pasos futuros saltando validación. `OperationProgress({label,completed?:number,total?:number})`: porcentaje solo si total>0 y ambos conteos reales; si faltan, indicador indeterminado con descripción de etapa, no porcentaje animado ficticio.

- [ ] Conversión: Contacto/Cliente → Primer pago → Revisar y confirmar. Mantener selección previa al volver; no guardar Cliente ni Pago en pasos intermedios; usar la transacción de conversión existente exactamente una vez al confirmar.
- [ ] Restauración: Seleccionar → Validar/impacto → Respaldo actual → Confirmar/restaurar. Estado de validación no equivale a permiso de sobrescribir; fallo/cancelación no cambia base.
- [ ] CSV: Archivo → Validación/vista previa → Confirmación → Resultado. Progreso por filas solo si el proceso emite conteos reales; si es una promesa monolítica, mostrar etapa indeterminada. No ralentizar artificialmente el proceso para ver una barra.
- [ ] Exportación: aviso ocupado + resultado/error; no prometer porcentaje durante compresión si no se mide. Evitar conversión/restauración/importación doble con `pending` y validación transaccional.
- [ ] Barra de cobros solo donde ya hay total comprobable de una moneda; importe pagado/total en texto, sin mezclarUSD/MXN. Si no existe total, no mostrar barra.

## Oleada 6 — Regresión visual/funcional y cierre documental

### Tarea 6.1 — Matriz reproducible de QA

**Crear:** `tests/e2e/fixtures/visualWorkspace.ts`, `tests/e2e/visual-uat.spec.ts`; ampliar tests existentes de accesibilidad, actualización y respaldos. Fixture exclusivo de base aislada: nunca cargarlo en Pages/perfil real.

**Fixture mínimo:** 2 Leads activos y1 archivado, 2 Clientes/familias con nombres largos, 2 Viajes de estados distintos, Proveedores activo/inactivo/archivado, Servicios con2 componentes yUSD/MXN, pagos parciales/completos, Comisiones esperada/pagada/vencida, Tareas abierta/completada/archivada/manual/plantilla/automática, historial largo, catálogo vacío y catálogo de20 entradas, referencia histórica eliminada con eventos conservados y otra sin eventos. Fechas fijas sintéticas; no fechas/nombres de la usuaria.

- [ ] Capturas identificadas por módulo/variante/idioma/ancho: diez módulos; ocho expedientes panel/completo donde exista panel; estados vacío/poblado/error; filtros activos; modal sucio; impacto antes/segunda confirmación; Settings índice/editor; fecha emergente cerca de borde inferior.
- [ ] Escritorio1440×900 y1280×800, panel320/350/560; prueba adicional900×700 para reflujo. Realizar además **zoom real100% y200% en Edge** con evidencia del indicador de zoom; viewport reducido no sustituye esta prueba. Si el conector no cambia zoom, solicitar comprobación manual específica y no marcarla aprobada.
- [ ] En ES y EN: un h1, controles/acciones no superpuestos, sin scroll horizontal global; el contenido principal no invade rail. Se permiten tablas con scroll horizontal local identificado cuando necesario, no recorte de celdas.
- [ ] Teclado: alcanzar rail/buscador/filtros/menu/panel/diálogo; mover divisor; abrir/cerrar tooltip/calendario; cancelar cambios; Escape nunca guarda. Axe en estados significativos, no solo shell vacío.
- [ ] Texto: nombres/notas de fixture idénticos al cambiar idioma; fechas DD/MM/YYYY, horaHH:mm y números1,234.56; sin claves técnicas ni mensajes de archivo nativos dentro del diseño propio.
- [ ] Flujos: crear→editar→completar→deshacer→reprogramar Tarea; ver en Dashboard/Calendario; Lead→Cliente/Viaje→Servicio→Pago→Comisión; archivar/restaurar; eliminar con keep/delete_owned y revisar supervivientes; respaldar/restaurar fixture con referencias históricas.
- [ ] Concurrencia/fallo: datos cambian después del preview, doble click confirmar, fallo de transacción, navegación con borrador, PWA con actualización pendiente y borrador. Ningún éxito prematuro ni pérdida parcial.

**Comandos finales:**

```text
npm test
npm run test:e2e
npm run typecheck
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
git diff --check
```

Registrar conteos/salida/fecha reales, consola del navegador y capturas de cada flujo. Si un comando no puede arrancar por permisos, registrar bloqueo y resolverlo por vía autorizada; no llamarlo fallo de aplicación ni prueba aprobada.

### Tarea 6.2 — Fuentes de verdad y dictamen

- [ ] Actualizar `PROGRESS.md` y `VERIFIER.md` por hallazgo UAT-01–27 con evidencia y excepciones. Mantener histórico el cierre técnico anterior; no borrar evidencia ni llamarla prueba de calidad visual universal.
- [ ] Actualizar `SCREEN_MAP.md` con Settings fichas y presentación de referencias eliminadas; `DATA_MODEL.md`/`ARCHITECTURE.md`/`IMPORT_EXPORT_SPEC.md` solo por contratos realmente implementados y probados.
- [ ] Corregir contradicción regional de RF-009 enlazando formato fijo vigente; RF-003 enlaza DEC-185/contrato implementado. No reabrir todos los antiguos “Pendiente” indiscriminadamente.
- [ ] Matriz final: acuerdo → archivo/prueba → estado. Separar implementado, comprobación manual pendiente y decisiones nuevas. Un preview no aprobado no cuenta como aceptación de la usuaria.
- [ ] Entregar preview local y dictamen de cierre; **no desplegar**. Modelo recomendado para ejecución: **Tierra Alto**, porque layout y reglas quedan definidos, pero persistencia/eliminación exigen esfuerzo alto. Si aparece un conflicto de integridad fuera del contrato, detener ese cambio y explicar evidencia; no cambiar modelo automáticamente.

## Secuencia y punto exacto de reanudación

1. Aprobar este plan, incluida la referencia histórica mínima de eliminación y conservación independiente de registros relacionados.
2. Iniciar Oleada1/Tarea1.1 sobre árbol revisado; las casillas de implementación siguen todas vacías.
3. Orden obligatorio: Oleada1 →2 →3 →4 →5 →6. No conectar borrado con dependencias antes de compatibilidad/rollback de3.2.
4. Al pausar, escribir última tarea terminada con comando/resultado, archivos modificados, prueba roja que sigue pendiente, servidor/origen sintético y siguiente casilla exacta. No dejar solo “continúa revisión”.

### Pausa registrada — 2026-09-07

- **Últimas correcciones verificadas:** confirmación explícita y bloqueo durante persistencia para pagos/correcciones, cancelación de Viaje, CSV y restauración; retorno de foco del diálogo; selector de archivo propio; etapa de proceso real; fecha inválida no guarda una Tarea con su fecha anterior; y rechazo explicativo de rango Desde/Hasta invertido en Tareas.
- **Archivos tocados en el tramo:** `ConfirmDialog.tsx`, `TripDetail.tsx`, `ProviderDetail.tsx`, `CommissionPaymentDialog.tsx`, `CustomerPaymentPanel.tsx`, `PaymentDetail.tsx`, `DataBackupsPage.tsx`, `OperationProgress.tsx`, `CalendarPage.tsx`, `csvImport.ts`, `ProviderList.test.tsx`, `PaymentDetail.test.tsx`, `CustomerPaymentPanel.test.tsx`, `confirmDialog.test.tsx`, `DataBackupsPage.test.tsx`, `CalendarPage.test.tsx`, `csvImport.test.ts`, `TaskForm.tsx`, `TaskBoard.tsx`, `taskBoard.test.tsx` e `i18n.ts`.
- **Evidencia inmediata:** 11/11 pruebas de diálogos/pagos y 17/17 de Tareas; typecheck y lint verdes. La regresión completa previa no arrojó una salida final legible, por lo que debe repetirse solo al final y no se marca ninguna oleada.
- **Preview:** Edge local `http://127.0.0.1:4173`; Proveedores y Tareas inspeccionados sin crear datos. Verificar el origen al reanudar.
- **Tramo adicional cerrado antes de esta pausa:** la prueba roja de Viaje superviviente con Cliente eliminado se creó y se volvió verde. `App.tsx`/`TripDetail.tsx` muestran la referencia histórica sin inventar Cliente; `saveTripWorkspace.ts` y los repositorios Memory/Dexie permiten guardar el Viaje superviviente solo cuando existe la referencia eliminada y no permiten resucitarla. `recordLifecyclePersistence`, `tripWorkspace` y `accessibility-shell` sumaron 46 pruebas en verde; typecheck y lint también pasaron.
- **Siguiente casilla exacta:** Tarea 3.2, línea 238, misma matriz de referencias históricas. La próxima prueba ya está añadida a `tests/unit/taskBoard.test.tsx`: un Viaje enlazado a Cliente eliminado debe aparecer como `Registro eliminado: Familia histórica` en el filtro de Tareas. Primero ejecutar esa prueba y registrar su estado; después dar a `TaskBoard` y `TaskForm` el contrato `deletedReferences`, resolver con `resolveRecordReference` y pasar las referencias desde `App.tsx`. A continuación aplicar esa semántica a Comisiones, Calendario, Dashboard, búsqueda y guardas de edición. No ejecutar regresión completa ni marcar oleada hasta que esta cobertura transversal y su QA visual estén cerradas.

## Decisiones separadas, no requisitos escondidos

- La **posibilidad de eliminar**, el detalle de impactos, la opción de eventos y las fichas/confirmaciones son instrucciones actuales. La **referencia histórica mínima y su migración** son la solución técnica propuesta aquí y deben aprobarse con el plan; no estaban implementadas ni se presume consentimiento para borrar datos durante la auditoría.
- No incluye eliminación en cascada de Viajes/Familias/Pagos, purga de toda información personal en respaldos anteriores, papelera con restauración instantánea ni borrado remoto. Si se solicitan después, son decisiones diferentes.
- La configuración global de calendarios de avisos necesita definir qué es editable antes de añadir nuevos controles. No ocultar ese límite creando una ficha “próximamente”.
- La aprobación visual y el zoom real/PWA de dispositivo son evidencias separadas de tests automáticos. La actualización del piloto y B1 requieren autorización posterior específica.

## Resultado de ejecución automática — 2026-09-08

- Las seis oleadas quedaron implementadas y cubiertas por pruebas unitarias/integración, E2E y revisión de la vista previa aislada. Se añadieron el fixture `visualWorkspace`, la UAT de diez módulos y flujos explícitos para fichas de Configuración, contexto de filtros, workspace completo y respaldo/restauración.
- Evidencia final: `npm test` 93 archivos/370 pruebas; `npm run test:e2e` 17 flujos; typecheck, lint, build PWA, auditoría de producción y revisión de formato pasan. `VER-I-055` contiene el cruce UAT-01–27 con pruebas y archivos.
- No se marcará el dictamen final, no se hará push ni se declarará una oleada certificada hasta contar con la verificación manual de zoom real de Edge al 100 % y 200 %, que el conector disponible no puede efectuar.
