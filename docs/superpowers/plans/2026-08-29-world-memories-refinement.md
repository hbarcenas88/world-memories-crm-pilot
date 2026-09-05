# World Memories CRM Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** implementar una gestión segura de registros, expedientes adaptables, identidad oficial e interfaz ES/EN completa sin comprometer la integridad local-first.

**Architecture:** el ciclo de vida se implementa como casos de uso y contratos transaccionales, con análisis de dependencias dentro de IndexedDB antes de eliminar. Los componentes visuales y el catálogo de idioma se centralizan; las pantallas existentes los consumen sin acceder directamente a datos. Los detalles comparten un contenedor de panel/expediente completo y el manifiesto PWA consume activos oficiales estáticos.

**Tech Stack:** React 19 + TypeScript 6 + Vite 8; Dexie 4/IndexedDB; Lucide; Vitest + Testing Library + fake-indexeddb + axe; Playwright; vite-plugin-pwa.

**Spec:** `docs/superpowers/plans/2026-08-29-world-memories-refinement-spec.md`

## Global Constraints

- Aplicar DEC-179 a DEC-184 y los requisitos REQ-RF-001 a REQ-RF-009 del spec.
- No usar Local Storage para datos operativos: solo `wm.detailPanelWidth` como preferencia numérica de interfaz.
- No hay eliminación en cascada, no se borran eventos de actividad y no se dejan huérfanos.
- No publicar, desplegar, importar ni migrar datos reales; no crear commit mientras el repositorio permanezca sin historial rastreado.
- Los datos capturados nunca pasan por el traductor de interfaz.
- Aplicar TDD: cada tarea inicia con pruebas que fallan y termina con sus pruebas relevantes, typecheck y revisión de diff.

---

## Estructura final de archivos

```text
src/
  application/recordImpact.ts
  application/use-cases/archiveRecord.ts
  application/use-cases/deleteRecord.ts
  design/components/{ActionMenu,DetailWorkspace,IconButton,ToastRegion,Tooltip}.tsx
  design/hooks/usePanelWidth.ts
  app/i18n.ts
  app/App.tsx
  domain/types.ts
  infrastructure/db/{repositories,worldMemoriesDb}.ts
  features/records/{RecordActions,RecordImpactDialog}.tsx
  public/brand/{world-memories-logo,world-memories-monogram}.svg
  public/icons/{world-memories-192,world-memories-512}.svg
tests/{unit,integration,e2e}/...
```

### Task 1: Contrato de ciclo de vida y análisis de dependencias

**Files:**
- Create: `src/application/recordImpact.ts`, `src/application/use-cases/archiveRecord.ts`, `src/application/use-cases/deleteRecord.ts`, `tests/unit/recordImpact.test.ts`, `tests/unit/recordLifecycle.test.ts`
- Modify: `src/domain/types.ts`, `src/application/ports.ts`, `src/application/workspaceSnapshot.ts`

**Interfaces:**

```ts
export type ManagedRecordKind = 'lead'|'client'|'trip'|'provider'|'service'|'payment'|'commission'|'task';
export type ManagedRecordRef = Readonly<{ kind: ManagedRecordKind; id: string }>;
export type RecordImpact = Readonly<{ target: ManagedRecordRef; title: string; dependencies: readonly { label: string; count: number }[]; canDelete: boolean }>;
export const analyzeRecordImpact: (snapshot: WorkspaceSnapshot, target: ManagedRecordRef) => RecordImpact;
export const archiveRecord: (repository: WorkspaceRepository, command: ManagedRecordRef & { occurredAt: string; recordedAt: string }) => Promise<void>;
export const deleteRecord: (repository: WorkspaceRepository, command: ManagedRecordRef) => Promise<void>;
```

- [x] **Step 1: Escribir las pruebas de impacto.** Evidencia: `tests/unit/recordImpact.test.ts`, `tests/unit/recordLifecycle.test.ts`.
- [x] **Step 2: Ejecutar `npm test -- recordImpact recordLifecycle`; debe fallar porque no existen los contratos.** Evidencia: ambos imports fallaron antes de crear los casos de uso el 2026-08-29.
- [x] **Step 3: Añadir `archivedAt?: string` a las ocho entidades principales, `ManagedRecordKind`, el análisis puro de referencias y métodos transaccionales `getRecordImpact`, `archiveRecord` y `deleteRecord`.** Evidencia: pruebas unitarias y de integración verdes el 2026-08-29.
- [ ] **Step 4: Añadir pruebas de archivo/restauración y edición financiera con evento de corrección; ejecutar `npm test -- recordImpact recordLifecycle`.** Deben pasar y demostrar que el archivo no toca dependientes.
- [ ] **Step 5: Ejecutar `npm run typecheck` y `git diff --check`; documentar la migración pendiente de IndexedDB en el siguiente task.**

### Task 2: Persistencia, migración y rollback de ciclo de vida

**Files:**
- Modify: `src/infrastructure/db/worldMemoriesDb.ts`, `src/infrastructure/db/repositories.ts`, `src/test/memoryRepository.ts`, `src/application/ports.ts`
- Create: `tests/integration/recordLifecyclePersistence.test.ts`

**Interfaces:**

```ts
interface WorkspaceTransaction {
  getRecordImpact(target: ManagedRecordRef): Promise<RecordImpact>;
  archiveRecord(target: ManagedRecordRef, archivedAt: string): Promise<void>;
  deleteRecord(target: ManagedRecordRef): Promise<void>;
}
```

- [x] **Step 1: Escribir integración con fake-indexeddb para abrir datos versión 10, actualizar a versión 11 y verificar que registros existentes no ganan `archivedAt`.** Evidencia: `tests/integration/recordLifecyclePersistence.test.ts`.
- [x] **Step 2: Escribir integración que falle el evento de archivo y compruebe rollback; y otra que intente borrar un registro relacionado y compruebe que no se elimina nada.** Evidencia: `tests/integration/recordLifecyclePersistence.test.ts` cubre ambos casos con fake-indexeddb el 2026-08-29.
- [x] **Step 3: Crear Dexie versión 11 con índices `archivedAt` para las entidades aplicables; implementar impacto y eliminación en la misma transacción que incluye todas las tablas involucradas.** Evidencia: v11 y archivo transaccional verificados con fake-indexeddb el 2026-08-29.
- [x] **Step 4: Igualar contrato y rollback de `MemoryWorkspaceRepository`; ejecutar `npm test -- recordLifecyclePersistence persistence`.** Evidencia: 2 archivos / 9 pruebas verdes el 2026-08-29.
- [x] **Step 5: Ejecutar `npm run typecheck && git diff --check`; añadir resultado y estrategia de compatibilidad a `VERIFIER.md`.** Evidencia: pruebas dirigidas 4 archivos / 10 pruebas, typecheck, lint, build y `git diff --check` verdes el 2026-08-29; v11 es migración aditiva y no completa `archivedAt` en registros históricos.

### Task 3: Fundaciones de interacción y activos oficiales

**Files:**
- Create: `src/design/components/ActionMenu.tsx`, `IconButton.tsx`, `Tooltip.tsx`, `ToastRegion.tsx`, `src/design/hooks/usePanelWidth.ts`, `public/brand/world-memories-logo.svg`, `public/brand/world-memories-monogram.svg`
- Modify: `src/design/tokens.css`, `src/design/global.css`, `public/icons/world-memories-192.svg`, `public/icons/world-memories-512.svg`, `public/manifest.webmanifest`
- Create: `tests/unit/ActionMenu.test.tsx`, `tests/unit/DetailWorkspace.test.tsx`, `tests/e2e/brand-assets.spec.ts`

- [x] **Step 1: Escribir pruebas fallidas para menú con foco/escape, tooltip asociado por `aria-describedby`, toast con acción de deshacer y separador de panel operable con flechas.** Evidencia: `ActionMenu.test.tsx`, `Tooltip.test.tsx`, `ToastRegion.test.tsx`, `ResizableDetailPanel.test.tsx` y sus ciclos rojo/verde del 2026-08-29.
- [x] **Step 2: Copiar el SVG oficial recibido a `public/brand/world-memories-logo.svg` sin redibujarlo y generar `world-memories-monogram.svg` recortando únicamente el monograma oficial.** Verificado visualmente sobre fondo blanco en una instancia local fresca el 2026-08-29.
- [x] **Step 3: Implementar tokens semánticos Ruta World Memories y los componentes; `usePanelWidth` limita 320–560, persiste `wm.detailPanelWidth` y ofrece `reset()`.** Evidencia: `ActionMenu`, `IconButton`, `Tooltip`, `ToastRegion` y `ResizableDetailPanel`, con pruebas dirigidas y typecheck en verde el 2026-08-29.
- [x] **Step 4: Reemplazar ambos iconos de manifest por el monograma oficial y escribir E2E que confirme referencias de manifiesto, ausencia de la W provisional y carga de los activos.** Evidencia: `tests/e2e/pwa.spec.ts` pasó en instancia local fresca el 2026-08-29.
- [ ] **Step 5: Ejecutar `npm test -- ActionMenu DetailWorkspace && npm run test:e2e -- brand-assets`; revisar con axe y `git diff --check`.**

### Task 4: Catálogo completo ES/EN y shell de marca

**Files:**
- Modify: `src/app/i18n.ts`, `src/app/App.tsx`, `src/design/global.css`, `src/features/leads/{LeadList,LeadForm,LeadDetail,LeadConversionForm}.tsx`, `src/features/clients/{ClientList,ClientDetail}.tsx`, `src/features/trips/{TripList,TripDetail,ServiceProviderAssignment,CustomerPaymentPanel,UnsavedChangesDialog}.tsx`, `src/features/providers/{ProviderList,ProviderDetail,ProviderTaskTemplates}.tsx`, `src/features/{tasks/TaskBoard,commissions/CommissionBoard,commissions/CommissionPaymentDialog,dashboard/Dashboard,calendar/CalendarPage,calendar/CalendarMonth,calendar/CalendarWeek,calendar/CalendarSidePanel,calendar/PlanningAgenda,search/GlobalSearch,notifications/NotificationCenter,data/DataBackupsPage}.tsx`
- Create: `tests/unit/i18nCoverage.test.ts`, `tests/e2e/localization.spec.ts`

**Interfaces:**

```ts
export type TranslationKey = keyof typeof dictionary.es;
export function t(key: TranslationKey, locale: Locale, values?: Readonly<Record<string, string | number>>): string;
export const localeFor: (locale: Locale) => 'es-PA' | 'en-US';
```

- [ ] **Step 1: Escribir prueba que cambie a EN y compruebe navegación, formularios, diálogos, toasts, ayuda, aria-labels, actualización PWA y estados vacíos; mantener una cadena capturada idéntica.**
- [ ] **Step 2: Ejecutar `npm test -- i18n i18nCoverage accessibility-shell`; debe fallar con los literales actuales.**
- [ ] **Step 3: Expandir el catálogo tipado por secciones, reemplazar todos los literales estáticos y usar `localeFor` en formateadores de fecha/número.** No traducir `lead.name`, notas, destinos, referencias ni valores de base.
- [ ] **Step 4: Sustituir el wordmark textual por la imagen SVG oficial con texto alternativo; aplicar los tokens de marca a navegación, cabeceras, estados y foco sin depender solo de color.**
- [ ] **Step 5: Ejecutar `npm test -- i18n i18nCoverage accessibility-shell && npm run test:e2e -- localization`; ejecutar `npm run typecheck && npm run lint`.**

### Task 5: Contenedor de expediente, detalles completos y acciones seguras

**Files:**
- Create: `src/design/components/DetailWorkspace.tsx`, `src/features/records/RecordActions.tsx`, `src/features/records/RecordImpactDialog.tsx`
- Modify: `src/app/App.tsx`, `src/design/global.css`, `src/features/leads/{LeadList,LeadDetail}.tsx`, `src/features/clients/{ClientList,ClientDetail}.tsx`, `src/features/trips/{TripList,TripDetail,ServiceProviderAssignment,CustomerPaymentPanel}.tsx`, `src/features/providers/{ProviderList,ProviderDetail,ProviderTaskTemplates}.tsx`, `src/features/tasks/TaskBoard.tsx`, `src/features/commissions/{CommissionBoard,CommissionPaymentDialog}.tsx`
- Create: `tests/unit/RecordImpactDialog.test.tsx`, `tests/unit/recordWorkspace.test.tsx`, `tests/e2e/record-workspace.spec.ts`

**Avance trazable (2026-08-29):** `DetailWorkspace` está integrado y verificado para Lead, Cliente/Familia y Viaje: breadcrumb, retorno, navegación global persistente, lista oculta y ancho completo. Lead y Cliente/Familia comparten panel redimensionable persistente y restablecimiento visible; Viaje conserva su borrador único y aviso de cambios sin guardar. En Lead y Cliente/Familia, `RecordActions` y `RecordImpactDialog` ya están conectados: edición con formulario precargado/evento de corrección y decisión visible con segunda confirmación de borrado. El archivo confirma con toast de cinco segundos y **Deshacer** restaura de forma explícita el snapshot de Lead o Cliente/Familia; la prueba de shell cubre el recorrido de Lead. Las dos listas ahora exponen chips Activos, Archivados y Todos sin ocultar el estado del registro. No se marcan los pasos de esta tarea hasta cubrir todos los tipos y las acciones seguras conectadas en cada entidad.

- [ ] **Step 1: Escribir componentes fallidos para abrir/cerrar expediente completo, breadcrumb, retorno al contexto previo, restaurar ancho y abrir menú de acciones de un Lead.**
- [ ] **Step 2: Escribir prueba del diálogo: con dependencias solo expone Archivar/Cancelar; sin dependencias solicita segunda confirmación `Eliminar definitivamente`.**
- [ ] **Step 3: Implementar `DetailWorkspace` y estado de presentación en `App`; adaptar los detalles existentes y añadir vistas enfocadas de Servicio, Pago, Comisión y Tarea.** La navegación y topbar quedan visibles; la lista no.
- [ ] **Step 4: Integrar `RecordActions` en filas, paneles y expedientes; conectar editar, archivar, restaurar y eliminar a los casos de uso.** El toast deshace exclusivamente archivo/restauración y vuelve a cargar el snapshot visible.
- [ ] **Step 5: Ejecutar `npm test -- RecordImpactDialog recordWorkspace LeadDetail ClientDetail TripDetail ProviderDetail taskBoard CommissionBoard && npm run test:e2e -- record-workspace`.**

### Task 6: Filtros, edición completa y endurecimiento de experiencia

**Files:**
- Modify: `src/app/App.tsx`, `src/design/global.css`, `src/features/leads/{LeadList,LeadForm,LeadDetail,LeadConversionForm}.tsx`, `src/features/clients/{ClientList,ClientDetail}.tsx`, `src/features/trips/{TripList,TripDetail,ServiceProviderAssignment,CustomerPaymentPanel}.tsx`, `src/features/providers/{ProviderList,ProviderDetail,ProviderTaskTemplates}.tsx`, `src/features/tasks/TaskBoard.tsx`, `src/features/commissions/{CommissionBoard,CommissionPaymentDialog}.tsx`, `src/features/calendar/{CalendarPage,CalendarMonth,CalendarWeek,CalendarSidePanel,PlanningAgenda}.tsx`
- Create: `tests/unit/recordActions.test.tsx`, `tests/e2e/refinement-flow.spec.ts`, `tests/e2e/accessibility-refinement.spec.ts`

- [ ] **Step 1: Escribir pruebas para chips de filtros de archivo, edición desde menú/fila, acordeones de expediente, steppers de conversión y barra de progreso solo en procesos/montos verificables.**
- [ ] **Step 2: Implementar filtros de activos/archivados, edición para cada entidad principal y corrección confirmada para Pago/Comisión.** Todo guardado valida relaciones y registra el evento correspondiente.
- [ ] **Step 3: Aplicar acordeones, chips, selectores de fecha, ayudas y barras de progreso solo en las ubicaciones enumeradas por DEC-182; no añadir swipe ni toggle de estado.**
- [ ] **Step 4: Ejecutar E2E Lead → editar → archivar → deshacer → restaurar; eliminación bloqueada con relaciones; expediente completo EN; y corrección de pago confirmada.**
- [ ] **Step 5: Ejecutar `npm test`, `npm run test:e2e`, `npm run typecheck`, `npm run lint`, `npm run build`, auditoría de dependencias de producción y `git diff --check`. Registrar resultados en `VERIFIER.md` y `PROGRESS.md`.**

## Autorrevisión del plan

- **Cobertura:** Tasks 1–2 cubren REQ-RF-001 a REQ-RF-004; Task 3 cubre REQ-RF-006 a REQ-RF-008; Task 4 cubre REQ-RF-008 a REQ-RF-009; Tasks 5–6 cubren la integración de REQ-RF-001 a REQ-RF-007 en todos los módulos.
- **Riesgos:** la eliminación se bloquea ante eventos y relaciones; el archivo no propaga cambios; la migración es aditiva; la internacionalización incluye accesibilidad; los iconos se validan antes de una instalación manual fresca.
- **No hay revisión independiente automática:** al terminar las pruebas se actualizarán los documentos y se propondrá, no activará, el gate correspondiente que la usuaria autorice.
