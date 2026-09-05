# Especificación — refinamiento de expedientes, marca e idioma

**Estado:** propuesta consolidada para aprobación de implementación.

## Propósito

Convertir el MVP técnico en una herramienta diaria más clara y segura: cada expediente podrá concentrarse en pantalla completa, los paneles conservarán el ancho elegido, las acciones de ciclo de vida serán explícitas y seguras, y la interfaz reflejará íntegramente la marca e idioma elegido.

## Alcance confirmado

- **REQ-RF-001 — Editar, archivar y eliminar:** Lead, Cliente/Familia, Viaje, Proveedor, Servicio, Pago, Comisión y Tarea mostrarán acciones visibles cuando la operación aplique. Editar conserva validaciones, relaciones y eventos de negocio. En importes, pagos y comisiones, la edición muestra una confirmación de corrección y registra el cambio; no cambia una cifra silenciosamente.
- **REQ-RF-002 — Archivo reversible y explícito:** archivar no ocurre al elegir eliminar, no borra ni modifica registros relacionados y conserva las relaciones existentes. El registro recibe `archivedAt`; las listas operativas lo ocultan por defecto, permiten incluir archivados y muestran restaurar. Un toast de corta duración permite deshacer el archivo inmediato.
- **REQ-RF-003 — Eliminación segura:** el diálogo de eliminar presenta el registro y un resumen de dependencias por tipo. Si existe cualquier relación dependiente —incluidos eventos de actividad— la eliminación definitiva no se ofrece; se muestra `Archivar` como recomendación y una indicación para resolver las dependencias. Solo un registro sin dependencias puede llegar a una segunda confirmación `Eliminar definitivamente`. No hay cascada, borrado de eventos ni huérfanos.
- **REQ-RF-004 — Revisión de consecuencias:** la pantalla de impacto usa conteos y tipos comprensibles, no listas interminables. Ejemplo: “1 viaje, 3 tareas y 4 eventos”. Antes de eliminar, las acciones disponibles explican que archivar conserva el historial.
- **REQ-RF-005 — Panel de expediente:** los detalles de Lead, Cliente/Familia, Viaje, Proveedor, Servicio, Pago, Comisión y Tarea pueden abrirse en panel contextual o en expediente completo. En la vista completa siguen visibles la navegación global, la ruta de migas y el acceso para volver a la lista; se ocultan lista y panel paralelo.
- **REQ-RF-006 — Tamaño del panel:** el panel contextual puede redimensionarse por arrastre con mínimo de 320 px, máximo de 560 px y valor inicial de 350 px. El separador es operable con teclado y anuncia el ancho. La preferencia solo se guarda en Local Storage de ese equipo, con restauración explícita; no almacena datos del CRM.
- **REQ-RF-007 — Kit de interacción:** menú `Más acciones`, botones de icono, chips de filtros, selectores de fecha, toasts, acordeones, steppers, barras de progreso, breadcrumbs y ayudas emergentes se construyen como componentes reutilizables. Se aplican exclusivamente según DEC-182; no se usan swipe actions en escritorio ni interruptores para estados comerciales/financieros.
- **REQ-RF-008 — Marca:** el SVG oficial se copia como activo de aplicación sin modificar su geometría. El logo horizontal se usa en la barra lateral; el monograma oficial extraído de ese mismo SVG reemplaza el icono provisional de PWA, Inicio y accesos instalados. La paleta Ruta World Memories se expresa mediante tokens semánticos y mantiene contraste AA.
- **REQ-RF-009 — Internacionalización completa:** todo texto de interfaz se resuelve desde un catálogo ES/EN tipado: títulos, navegación, etiquetas, placeholders, mensajes de validación, diálogos, toasts, ayudas, estados vacíos, acciones, textos de actualización PWA y atributos ARIA. Los valores capturados, nombres propios, notas, destinos, importes e identificadores no se traducen. Formatos de fecha usan la configuración regional de la interfaz.

## Reglas de diseño y límites

- `archivedAt` es independiente de los estados de negocio actuales (`cancelled`, `inactive`, `completed`, etc.); no se inventa una transición de negocio al archivar.
- Archivar un registro no archiva sus dependientes de manera automática. Las referencias permanecen válidas y el historial se puede restaurar.
- Como los eventos de actividad son dependencias, un registro con historia no es borrable. Es una protección deliberada; el flujo recomendado es archivarlo.
- Los miembros de familia, notas y asignaciones de proveedor continúan gestionándose dentro de su expediente padre; no reciben un expediente completo independiente.
- El panel de Calendario no entra en el alcance de la vista completa de expediente, pero conserva los componentes de acción, accesibilidad e idioma compartidos.
- No se publicará, desplegará ni migrará/importará información real. El cambio de icono PWA se verifica en build y una nueva instalación manual posterior, no se anuncia como actualización automática de instalaciones existentes.

## Modelo y contratos propuestos

```ts
export type ManagedRecordKind =
  | 'lead' | 'client' | 'trip' | 'provider'
  | 'service' | 'payment' | 'commission' | 'task';

export type ManagedRecordRef = Readonly<{ kind: ManagedRecordKind; id: string }>;
export type DependencySummary = Readonly<{ label: string; count: number }>;
export type RecordImpact = Readonly<{
  target: ManagedRecordRef;
  title: string;
  dependencies: readonly DependencySummary[];
  canDelete: boolean;
}>;

export type Archivable = Readonly<{ archivedAt?: string }>;
```

Cada entidad principal incorpora `archivedAt?: string`. `WorkspaceTransaction` expone análisis de impacto y eliminación atómica; el caso de uso nunca elimina directamente desde una pantalla. Las consultas de listas excluyen archivados salvo petición explícita.

## Criterios de aceptación

1. Un intento de eliminar un Cliente con Viaje, Lead o eventos explica los conteos, no elimina nada y ofrece archivar/cancelar.
2. Un registro sin dependencias requiere segunda confirmación y se elimina en una sola transacción; un fallo revierte por completo.
3. Archivar, deshacer y restaurar persisten tras recargar, no borran relaciones y no dejan referencias rotas.
4. El separador de panel funciona con puntero, teclado y restablecimiento; su ancho persiste solo como preferencia local.
5. Cada expediente indicado abre en vista completa, muestra ruta y permite regresar conservando el contexto previo.
6. El selector EN traduce todo el contenido estático de cada pantalla; datos introducidos en español permanecen sin cambios.
7. El logo oficial horizontal aparece nítido en la aplicación y el icono de PWA usa el monograma oficial, no la W provisional.
8. No hay violaciones axe serias/críticas en las nuevas superficies; foco, diálogo, tooltip, menú, resizer y toast son operables por teclado.

## Verificación requerida

- Unitarias: impacto por tipo de entidad, bloqueo de eliminación, archivo/restauración, catálogo de textos y preferencia de panel.
- Integración IndexedDB: migración de `archivedAt`, persistencia de archivo, análisis y eliminación atómica/rollback.
- Componentes: diálogo de impacto, menú, tooltip, toast/deshacer, filtro de archivados, panel redimensionable y expediente completo.
- E2E: ciclo editar/archivar/restaurar, bloqueo de eliminación relacionada, expediente completo, cambio EN en todas las rutas y activos de marca en manifiesto/build.
- Manual: escritorio a 100 % y 200 % zoom, instalación PWA fresca con el icono oficial y contraste visual de la dirección Ruta World Memories.
