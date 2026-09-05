# World Memories CRM MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Do not dispatch a reviewer until the user explicitly approves that individual review gate.

**Goal:** construir un CRM de escritorio instalable, local-first y verificable que permita operar Leads, Clientes, Viajes, Tareas, Proveedores, Comisiones y respaldos sin servidor ni datos reales precargados.

**Architecture:** React renderiza la interfaz y llama casos de uso tipados. Las reglas de negocio residen en TypeScript puro; repositorios, importación, respaldo y PWA se consumen detrás de contratos. IndexedDB contiene la única base operativa local y las operaciones de negocio persisten entidad, relaciones y evento en una transacción.

**Tech Stack:** React + TypeScript + Vite; React Router; Dexie (IndexedDB); Zod (validación); date-fns (fechas); Papa Parse (CSV); write-excel-file (Excel); TipTap (notas enriquecidas); vite-plugin-pwa; Vitest + Testing Library + fake-indexeddb + axe-core; Playwright.

**Spec:** `PRD.md`, `DATA_MODEL.md`, `DATA_DICTIONARY.md`, `IMPORT_EXPORT_SPEC.md`, `SCREEN_MAP.md`, `ARCHITECTURE.md`, `SECURITY_AND_PRIVACY.md` y `VERIFIER.md`.

## Global Constraints

- Interfaz en español por defecto, selector a inglés y datos capturados sin traducción automática.
- PWA instalable solo para escritorio; no diseñar ni prometer sincronización móvil en el MVP.
- GitHub Pages distribuye interfaz; IndexedDB conserva datos operativos y nunca se publican datos reales o hardcodeados.
- CSV es la entrada estructurada; Excel se genera solo como exportación; JSON versionado sirve de respaldo y restauración completa.
- Importaciones posteriores son aditivas: no sobrescriben, fusionan ni eliminan datos existentes.
- Todo importe exige moneda antes de guardarse; los totales se mantienen separados por moneda salvo conversión explícita del Viaje.
- No se registran ni exportan credenciales, contraseñas, tokens, datos de tarjeta ni documentos de identidad.
- Antes de cada restauración se descarga un respaldo JSON actual; restaurar reemplaza la base de forma atómica.
- No publicar, desplegar ni cargar/migrar datos reales sin autorización nueva y específica de la usuaria.
- Aplicar TDD: cada regla de dominio, contrato o caso de uso empieza con una prueba que falla.

---

## Estructura final de archivos

```text
src/
  app/App.tsx                         composición de rutas y proveedores
  app/router.tsx                      rutas y loaders locales
  app/i18n.ts                         textos ES/EN y preferencia local
  design/tokens.css                   colores, tipografía, espacios, radios, sombras y focos
  design/components/                  Button, Field, Dialog, StatusBadge, EmptyState, Toast
  domain/ids.ts                       IDs opacos y generador UUID
  domain/types.ts                     entidades y estados del CRM
  domain/money.ts                     importes por moneda y totales seguros
  domain/dates.ts                     intervalos, vencimientos y alertas
  domain/events.ts                    eventos de actividad de negocio
  domain/lead.ts                      transiciones y validación de Lead
  domain/commission.ts                cálculo y estados de Comisión
  application/ports.ts                contratos Repository, Backup e Import
  application/use-cases/              operaciones de negocio por archivo
  infrastructure/db/                  Dexie, esquema, repositorios y transacciones
  infrastructure/import/              manifiesto, parseo, validación y reporte CSV
  infrastructure/export/              Excel, JSON y checksum
  infrastructure/pwa/                 actualización y caché controladas
  features/                           UI por módulo, sin acceso directo a IndexedDB
  test/                               fixtures sintéticos y helpers
tests/unit/                           reglas puras
tests/integration/                    IndexedDB, import/export y restauración
tests/e2e/                            flujos Playwright
```

## Oleada 1 — Fundaciones y operación comercial mínima

### Task 1: Crear proyecto, calidad y contrato de datos base

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `.github/workflows/ci.yml`
- Create: `src/domain/ids.ts`, `src/domain/types.ts`, `src/domain/money.ts`, `src/domain/dates.ts`, `tests/unit/money.test.ts`, `tests/unit/dates.test.ts`

**Interfaces:**

```ts
export type Currency = 'USD' | 'MXN';
export type Money = Readonly<{ amount: number; currency: Currency }>;
export type MoneyTotals = Readonly<Record<Currency, number>>;
export const addMoney: (items: readonly Money[]) => MoneyTotals;
export const assertMoney: (input: unknown) => Money;
export const travelRange: (ranges: readonly DateRange[]) => DateRange | null;
```

- [x] **Step 1: Inicializar Vite con plantilla `react-ts`, fijar dependencias en `package-lock.json` y añadir scripts `dev`, `build`, `test`, `test:coverage`, `test:e2e`, `lint` y `typecheck`.**
- [x] **Step 2: Escribir pruebas fallidas de moneda y fechas.**

```ts
expect(addMoney([{ amount: 20, currency: 'USD' }, { amount: 50, currency: 'MXN' }]))
  .toEqual({ USD: 20, MXN: 50 });
expect(travelRange([{ startOn: '2026-09-05', endOn: '2026-09-08' }]))
  .toEqual({ startOn: '2026-09-05', endOn: '2026-09-08' });
```

- [x] **Step 3: Implementar los tipos, validadores de importe finito/no negativo, acumulación por moneda e intervalo mínimo/máximo.**
- [x] **Step 4: Ejecutar `npm run typecheck && npm test -- money dates`; debe pasar.**
- [x] **Step 5: Configurar CI para ejecutar `npm ci`, typecheck, test y build en cada cambio.**

### Task 2: Modelar eventos, Lead y transiciones comerciales

**Files:**
- Create: `src/domain/events.ts`, `src/domain/lead.ts`, `tests/unit/lead.test.ts`
- Modify: `src/domain/types.ts`

**Interfaces:**

```ts
export type LeadStatus = 'new' | 'contacted' | 'quote_preparing' | 'quote_sent' |
  'follow_up' | 'review_adjustments' | 'paused' | 'sold' | 'cancelled';
export type ActivityEvent = Readonly<{ id: string; aggregateType: 'lead'|'trip'|'client'|'task'|'commission'; aggregateId: string; type: string; occurredAt: string; recordedAt: string; payload: Record<string, unknown> }>;
export const createLead: (draft: LeadDraft, now: string) => { lead: Lead; events: ActivityEvent[] };
export const transitionLead: (lead: Lead, to: LeadStatus, now: string) => { lead: Lead; event: ActivityEvent; suggestedTask?: TaskDraft };
```

- [x] **Step 1: Escribir pruebas que prueben alta directa en `contacted`, envío de cotización, seguimiento, pausa, cancelación y rechazo de una transición no permitida.**
- [x] **Step 2: Ejecutar `npm test -- lead`; debe fallar por módulos inexistentes.**
- [x] **Step 3: Implementar transiciones explícitas, eventos con `occurredAt`/`recordedAt`, fechas por definir y sugerencia opcional al pausar.**
- [x] **Step 4: Ejecutar `npm test -- lead` y comprobar que no existe evento inventado cuando falta una fecha histórica.**

### Task 3: Persistencia IndexedDB atómica y contratos de aplicación

**Files:**
- Create: `src/application/ports.ts`, `src/infrastructure/db/worldMemoriesDb.ts`, `src/infrastructure/db/repositories.ts`, `src/test/memoryRepository.ts`, `tests/integration/persistence.test.ts`

**Interfaces:**

```ts
export interface WorkspaceRepository {
  transact<T>(work: (tx: WorkspaceTransaction) => Promise<T>): Promise<T>;
  getLead(id: string): Promise<Lead | undefined>;
  listLeads(query?: LeadQuery): Promise<readonly Lead[]>;
}
export interface WorkspaceTransaction {
  putLead(lead: Lead): Promise<void>;
  putClient(client: Client): Promise<void>;
  putTrip(trip: Trip): Promise<void>;
  putEvents(events: readonly ActivityEvent[]): Promise<void>;
}
```

- [x] **Step 1: Escribir prueba con `fake-indexeddb` que fuerce un error al guardar un evento y compruebe que el Lead tampoco queda almacenado.**
- [x] **Step 2: Ejecutar `npm test -- persistence`; debe fallar.**
- [x] **Step 3: Crear una única base Dexie con tablas por entidad, claves internas no semánticas, índices de consulta y transacciones `rw` que incluyan entidad, relación y evento.**
- [x] **Step 4: Implementar repositorio en memoria con el mismo contrato para pruebas de casos de uso.**
- [x] **Step 5: Ejecutar `npm test -- persistence` y verificar rollback completo.**

### Task 4: Casos de uso de Lead, Cliente y conversión a Viaje

**Files:**
- Create: `src/application/use-cases/createLead.ts`, `transitionLead.ts`, `convertLead.ts`, `linkExistingClient.ts`
- Create: `tests/unit/convertLead.test.ts`

**Interfaces:**

```ts
export const convertLead = (
  repository: WorkspaceRepository,
  command: { leadId: string; clientId?: string; firstPayment: Money; occurredAt: string }
) => Promise<{ client: Client; trip: Trip; events: readonly ActivityEvent[] }>;
```

- [x] **Step 1: Escribir prueba que convierta un Lead con primer anticipo, cree Cliente/Viaje, conserve Lead y produzca eventos relacionados.**
- [x] **Step 2: Escribir prueba que use un `clientId` existente sin crear un duplicado.**
- [x] **Step 3: Implementar ambos flujos dentro de una sola transacción. El estado cambia a `sold` solo después de validar el importe y su moneda.**
- [x] **Step 4: Ejecutar `npm test -- convertLead` y comprobar que un fallo de validación no cambia el Lead.**

### Task 5: Sistema visual, marco de escritorio y navegación

**Files:**
- Create: `src/design/tokens.css`, `src/design/global.css`, `src/design/components/*.tsx`, `src/app/App.tsx`, `src/app/router.tsx`, `src/app/i18n.ts`
- Create: `tests/unit/i18n.test.ts`, `tests/unit/accessibility-shell.test.tsx`

**Interfaces:**

```ts
export type RouteKey = 'dashboard'|'leads'|'clients'|'trips'|'calendar'|'tasks'|'commissions'|'providers'|'data'|'settings';
export const t: (key: string, locale: 'es'|'en') => string;
```

- [x] **Step 1: Implementar tokens del manual de marca, foco visible, contraste, jerarquía de tipografía, estados y layout de escritorio con navegación persistente.**
- [x] **Step 2: Escribir prueba que compruebe idioma español inicial, cambio a inglés y que los valores capturados no se transforman.**
- [x] **Step 3: Implementar rutas de todas las pantallas MVP con estados vacíos honestos y sin datos operativos precargados.**
- [x] **Step 4: Ejecutar `npm test -- i18n accessibility-shell` y `npm run build`.**

### Task 6: Pantallas de Leads y detalle operativo

**Files:**
- Create: `src/features/leads/LeadForm.tsx`, `LeadList.tsx`, `LeadDetail.tsx`, `LeadTimeline.tsx`, `leadQueries.ts`
- Create: `tests/unit/LeadForm.test.tsx`, `tests/e2e/leads.spec.ts`

**Interfaces:**

```ts
export type LeadFormValue = Pick<LeadDraft, 'acquisitionSource'|'name'|'residenceCountry'|'phone'|'email'|'destination'|'travelType'|'requestedDateStatus'>;
export const saveLead: (value: LeadFormValue) => Promise<Lead>;
```

- [x] **Step 1: Escribir prueba de formulario que permita guardar con campos opcionales vacíos, muestre `Referido por` solo para `Referido` y requiera moneda antes de aceptar presupuesto.**
- [x] **Step 2: Implementar lista, búsqueda/filtros, alta rápida/completa, estados, historial y tareas del Lead.**
- [x] **Step 3: Escribir prueba E2E: crear Lead, pasar a cotización enviada, completar/reprogramar seguimiento y convertirlo con anticipo.**
- [x] **Step 4: Ejecutar `npm test -- LeadForm` y `npm run test:e2e -- leads`.**

### Gate de revisión 1 — no activar automáticamente

Cuando Tasks 1–6 estén implementadas y verificadas, detener la oleada y proponer a la usuaria un subagente **Terra High de lógica/datos** para revisar exclusivamente entidades, transiciones, atomicidad, eventos y conversión. No se activa hasta aprobación explícita.

## Oleada 2 — Expediente, proveedores, pagos y comisiones

### Task 7: Expediente de Cliente y Viaje con guardado consistente

**Files:**
- Create: `src/features/clients/ClientList.tsx`, `ClientDetail.tsx`, `src/features/trips/TripList.tsx`, `TripDetail.tsx`, `UnsavedChangesDialog.tsx`
- Create: `tests/unit/TripDetail.test.tsx`, `tests/e2e/trips.spec.ts`

**Interfaces:**

```ts
export const saveTripWorkspace = (command: {
  client: Client; trip: Trip; services: readonly Service; notes: readonly RichNote;
}) => Promise<void>;
```

- [x] **Step 1: Escribir prueba que edite Cliente, Viaje y nota, falle una validación y confirme que no se guarda ninguna parte.**
- [x] **Step 2: Implementar expediente agregado, viajeros, intervalo calculado/override, nota TipTap, aviso de cambios sin guardar y un único botón `Guardar cambios`.**
- [x] **Step 3: Implementar servicios, pagos del Cliente y fecha límite de saldo con alertas de 30, 7, 1 y 0 días.**
- [x] **Step 4: Ejecutar pruebas unitarias y E2E de guardado/cierre sin datos parciales.**

### Task 8: Catálogo de Proveedores, Servicios y plantillas de Tareas

**Files:**
- Create: `src/features/providers/ProviderList.tsx`, `ProviderDetail.tsx`, `ProviderTaskTemplates.tsx`, `src/application/use-cases/addProviderToService.ts`
- Create: `tests/unit/providerTemplates.test.ts`, `tests/unit/serviceProvider.test.ts`

**Interfaces:**

```ts
export type ProviderCurrencyPolicy = Readonly<{ allowedCurrencies: readonly Currency[] }>;
export const addProviderToService: (command: {
  serviceId: string; providerId: string; currency: Currency; amount?: number;
}) => Promise<{ serviceProvider: ServiceProvider; suggestedTasks: readonly TaskDraft[] }>;
```

- [x] **Step 1: Escribir pruebas de proveedor monomoneda/multimoneda, rechazo de importe sin moneda y reactivación explícita de proveedor inactivo.**
- [x] **Step 2: Implementar datos generales, monedas permitidas, regla 80/100, comisión fija/variable, referencias, etiquetas y estado Activo/Inactivo.**
- [x] **Step 3: Implementar sugerencia editable de todas las tareas de plantilla al confirmar Proveedor; permitir seleccionar, editar o descartar sin activación por componentes.**
- [x] **Step 4: Ejecutar `npm test -- providerTemplates serviceProvider`.**

### Task 9: Cálculo, seguimiento y pago de Comisiones

**Files:**
- Create: `src/domain/commission.ts`, `src/application/use-cases/markCommissionPaid.ts`, `src/features/commissions/CommissionBoard.tsx`, `CommissionPaymentDialog.tsx`
- Create: `tests/unit/commission.test.ts`, `tests/e2e/commissions.spec.ts`

**Interfaces:**

```ts
export const expectedCommissionDueOn: (tripEndOn: string, providerDays: number) => string;
export const markCommissionPaid: (command: {
  commissionId: string; paidOn: string; received: Money; note?: string;
}) => Promise<Commission>;
```

- [x] **Step 1: Escribir pruebas para límite máximo de 90 días, monto 80/100, proveedor sin comisión, moneda diferente y diferencia entre esperado/recibido.**
- [x] **Step 2: Implementar cálculo snapshot, listas Esperadas/Próximas/Vencidas/Pagadas, `Tracking Form #` y `Where’s My Commission`.**
- [x] **Step 3: Implementar diálogo que advierta al diferir monto/moneda y exija confirmación antes de cambiar a `Pagada`.**
- [x] **Step 4: Ejecutar pruebas unitarias y E2E; revisar que no se solicite tasa manual de comisión.**

### Gate de revisión 2 — no activar automáticamente

Cuando Tasks 7–9 estén implementadas y verificadas, proponer un subagente **Terra High de lógica/datos** para revisar de forma independiente Viajes, pagos, plantillas, multimoneda y comisiones. No se activa hasta aprobación explícita.

## Oleada 3 — Operación diaria, búsqueda y calendario

### Task 10: Tareas, alertas internas, Dashboard y buscador

**Files:**
- Create: `src/features/tasks/TaskBoard.tsx`, `src/features/dashboard/Dashboard.tsx`, `src/features/search/GlobalSearch.tsx`, `src/application/use-cases/completeTask.ts`
- Create: `tests/unit/taskBoard.test.tsx`, `tests/e2e/dashboard.spec.ts`

**Interfaces:**

```ts
export type TaskGroup = 'overdue' | 'today' | 'upcoming' | 'undated';
export const groupTasks: (tasks: readonly Task, today: string) => Record<TaskGroup, readonly Task[]>;
export const resolveNotification: (id: string, action: 'complete'|'reschedule'|'dismiss_backup') => Promise<void>;
```

- [x] **Step 1: Escribir pruebas de orden Vencidas/Hoy/Próximas/Sin fecha, completar/deshacer/reprogramar y persistencia de alertas hasta resolución.**
- [x] **Step 2: Implementar Dashboard como fotografía actual con KPIs por moneda, colas de atención, viajes en curso/próximos y tareas visibles.**
- [x] **Step 3: Implementar buscador normalizado que agrupe resultados por tipo y abra el contexto exacto.**
- [x] **Step 4: Ejecutar pruebas unitarias y E2E de tareas, dashboard y búsqueda.**

### Task 11: Calendario operativo con panel contextual

**Files:**
- Create: `src/features/calendar/CalendarPage.tsx`, `CalendarMonth.tsx`, `CalendarWeek.tsx`, `PlanningAgenda.tsx`, `CalendarSidePanel.tsx`
- Create: `tests/unit/calendarProjection.test.ts`, `tests/e2e/calendar.spec.ts`

**Interfaces:**

```ts
export type CalendarProjection = Readonly<{ id: string; kind: 'trip'|'task'|'customer_payment'|'commission'; startOn: string; endOn?: string; target: { type: string; id: string } }>;
export const projectCalendar: (workspace: CalendarWorkspace) => readonly CalendarProjection[];
```

- [x] **Step 1: Escribir pruebas que proyecten Viajes como intervalos y Tareas/pagos/Comisiones como hitos, excluyendo campos sin fecha fuente.**
- [x] **Step 2: Implementar vistas mensual, semanal y planificación/agenda sin vista diaria por horas.**
- [x] **Step 3: Implementar un clic que abre panel lateral con rutas aplicables a Tarea, Viaje, Cliente o Comisión.**
- [x] **Step 4: Ejecutar `npm test -- calendarProjection` y E2E de navegación desde calendario.**

### Gate de revisión 3 — no activar automáticamente

Cuando Tasks 10–11 estén implementadas y verificadas, proponer un subagente **Terra High de revisión visual e interacción**. Su alcance es interfaz servida en escritorio: layout, foco, scroll, contraste, textos, estados vacíos, botones, calendario y marca. No edita; no se activa sin aprobación explícita.

## Oleada 4 — Datos, PWA y endurecimiento

### Task 12: Paquete CSV, exportación Excel, JSON y restauración segura

**Files:**
- Create: `src/infrastructure/import/manifest.ts`, `csvImport.ts`, `importReport.ts`, `src/infrastructure/export/jsonBackup.ts`, `excelExport.ts`, `src/features/data/DataBackupsPage.tsx`
- Create: `tests/integration/csvImport.test.ts`, `backupRestore.test.ts`, `tests/e2e/data-backups.spec.ts`

**Interfaces:**

```ts
export type ImportPreview = Readonly<{ accepted: number; duplicates: number; rejected: number; warnings: readonly ImportIssue[] }>;
export const previewCsvPackage: (file: File, existing: WorkspaceRepository) => Promise<ImportPreview>;
export const exportBackup: (workspace: WorkspaceSnapshot) => Promise<Blob>;
export const restoreBackup: (file: File, current: WorkspaceSnapshot) => Promise<void>;
```

- [x] **Step 1: Escribir prueba de paquete CSV con manifiesto válido, fila duplicada, fila nueva, fila rechazada y relación huérfana.**
- [x] **Step 2: Implementar vista previa sin persistencia, reporte legible por fila, confirmación y alta atómica solo del subconjunto aceptado.**
- [x] **Step 3: Escribir prueba de JSON con checksum/versión/conteos y restauración fallida que no altere la base actual.**
- [x] **Step 4: Implementar descarga JSON con advertencia, nombre con fecha/hora, manual no técnico, recordatorio a los tres días y restauración que exige respaldo actual + confirmación de reemplazo.**
- [x] **Step 5: Implementar exportación de consulta Excel, sin fórmulas ni secretos.**
- [x] **Step 6: Ejecutar integración y E2E, incluyendo round-trip JSON y no sobrescritura CSV.**

### Task 13: PWA, actualización controlada y pruebas de accesibilidad

**Files:**
- Create: `src/infrastructure/pwa/updatePrompt.ts`, `src/pwa.ts`, `public/manifest.webmanifest`, `public/icons/*`
- Modify: `vite.config.ts`, `src/app/App.tsx`
- Create: `tests/e2e/pwa.spec.ts`, `tests/e2e/accessibility.spec.ts`

**Interfaces:**

```ts
export type UpdateState = 'idle' | 'available' | 'deferred';
export const requestUpdate: () => Promise<void>;
export const deferUpdate: () => void;
```

- [x] **Step 1: Configurar `vite-plugin-pwa` para precachear solo recursos de interfaz y no incluir datos operativos en el bundle.**
- [x] **Step 2: Escribir E2E que instale la PWA, abra offline tras la primera carga y mantenga la sesión ante una actualización disponible.** Evidencia: E2E de manifiesto/offline, prueba del aviso de actualización y validación manual de instalación en Windows del 2026-08-29.
- [x] **Step 3: Implementar aviso `Actualizar ahora`/`Más tarde`; actualizar solo cuando la usuaria lo confirma.**
- [x] **Step 4: Añadir pruebas axe-core y teclado para rutas principales, diálogos, foco y mensajes no dependientes solo de color.**
- [x] **Step 5: Ejecutar `npm run typecheck`, pruebas unitarias, integración, E2E, build y validación manual de instalación/offline.** Evidencia: 47 archivos / 120 pruebas, 9 E2E, build, auditoría de producción y validación manual Windows del 2026-08-29.

### Gate de revisión 4 — no activar automáticamente

Cuando Tasks 12–13 estén implementadas y verificadas, proponer un subagente **Terra High de QA funcional**. Validará el flujo Lead → Venta → Viaje → Comisión, importación aditiva, JSON round-trip, PWA/offline/actualización y recuperación de errores. No edita; no se activa sin aprobación explícita.

## Cierre de implementación

- [x] Ejecutar la matriz de `VERIFIER.md` con datos sintéticos y registrar evidencias reproducibles. **Evidencia 2026-08-31:** 66 archivos / 206 pruebas, 9 E2E, matrices `VER-I-001` a `VER-I-046` y validación PWA/offline manual aprobada el 2026-08-29.
- [x] Corregir los hallazgos aceptados de cada revisión aprobada por la usuaria. **Evidencia 2026-08-31:** ciclo de vida explícito, expedientes completos, marca oficial, localización ES/EN de estados y de vista previa CSV; no hay gate independiente activado automáticamente.
- [x] Repetir build, typecheck, pruebas automatizadas, chequeo visual de escritorio y accesibilidad. **Evidencia 2026-08-31:** build PWA, typecheck, lint, 66 archivos / 207 pruebas y 9 E2E (incluye axe/foco) pasaron. La verificación interactiva equivalente al 200 % (640 × 360 desde 1280 × 720) no tuvo desbordamiento horizontal, conservó foco/navegación ni presentó errores de consola; `VER-I-045` registra la evidencia.
- [x] Presentar a la usuaria un informe de go/no-go. **Dictamen 2026-08-31:** GO técnico para uso local controlado, registrado en `VER-I-048`. No publica, despliega, importa ni migra datos reales; el gate R4 permanece voluntario y requiere autorización explícita.

## Autorrevisión del plan

- **Cobertura de especificación:** Tasks 1–4 cubren identidad, captura, eventos y conversión; 5–6 navegación/idioma/Leads; 7–9 Viajes, Proveedores, pagos y Comisiones; 10–11 operación diaria; 12–13 importación, respaldo, PWA y calidad.
- **Riesgos críticos:** atomicidad se prueba antes de pantallas; importación y restauración tienen pruebas de rollback; UI no accede directamente a IndexedDB; no hay despliegue ni datos reales.
- **Revisiones independientes:** tres lentes no redundantes y secuenciales: lógica/datos al cerrar Oleadas 1–2, visual al cerrar Oleada 3 y QA funcional al cerrar Oleada 4. Todos requieren aprobación individual de la usuaria.
