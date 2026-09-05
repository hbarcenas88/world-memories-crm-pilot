# Mapa de pantallas del CRM World Memories

## Estado del documento

- **Fase:** E — Alcance y diseño del MVP.
- **Estado:** aprobado formalmente por la usuaria el 2026-08-25; Fase E cerrada.
- **Fecha:** 2026-08-25.
- **Fuente de verdad:** este documento define las pantallas y su pertenencia al MVP; `PRD.md` define requisitos, `DECISIONS.md` define reglas aprobadas y `DATA_MODEL.md` define entidades y relaciones.
- **Límite:** no es un diseño visual final ni autoriza implementación. La arquitectura y el plan pertenecen a Fase F; la implementación requiere aprobación de Fase G.

## Principio de experiencia

El MVP es una aplicación operativa completa de escritorio que abre desde un icono local en el navegador. El Dashboard funciona como fotografía vigente del negocio y puerta de entrada a la acción diaria. Los expedientes conservan su contexto; las vistas globales permiten localizar, priorizar y navegar sin duplicar datos.

## Marco persistente

Disponible desde todas las pantallas del MVP:

- Navegación lateral: Dashboard, Leads, Clientes, Viajes, Calendario, Tareas, Comisiones, Proveedores, Datos y respaldos, Configuración.
- Buscador global para entidades, referencias operativas y notas de Leads/Viajes.
- Campana de notificaciones con contador; leer no resuelve el asunto.
- Selector Español/Inglés; español es el idioma inicial.
- Identidad World Memories conforme DEC-146.

No existen módulos separados de Ventas o Finanzas en el MVP.

## Mapa consolidado del MVP

| ID | Pantalla | Propósito | Contenido y acciones principales |
|---|---|---|---|
| SCR-MVP-001 | Dashboard | Mostrar la situación actual y las acciones prioritarias | Saludo; KPIs actuales sin filtros; viajeros en curso; Viajes del mes actual/siguiente; seguimientos de Leads y cotizaciones por enviar; Comisiones vencidas; Tareas ordenadas Vencidas/Hoy/Próximas/Sin fecha; completar o reprogramar; recordatorio de respaldo |
| SCR-MVP-002 | Leads | Gestionar cada consulta desde recepción hasta venta o cancelación | Lista y filtros; alta rápida; estados; origen y canal; intención/destino; fechas y pasajeros; presupuesto; preparación/envío de cotización; seguimiento; tareas, notas y línea de tiempo |
| SCR-MVP-003 | Detalle de Lead | Trabajar una consulta sin mezclarla con Cliente o Viaje | Datos generales; calificación; cotización; Tareas/Notas; historial propio; conversión mediante primer pago con vínculo a Cliente y Viaje |
| SCR-MVP-004 | Clientes | Mantener el directorio maestro y localizar familias/contactos | Lista, búsqueda y filtros; alta/edición; datos de contacto y residencia; nota útil; acceso a Leads y Viajes vinculados |
| SCR-MVP-005 | Detalle de Cliente | Reunir el contexto permanente del Cliente/Familia | Datos generales; miembros/viajeros; Leads; Viajes; nota útil; línea de tiempo agregada sin duplicar eventos |
| SCR-MVP-006 | Viajes | Supervisar la operación vendida y sus intervalos | Lista y filtros por estado/fechas; viajeros en curso y próximos; acceso al expediente completo |
| SCR-MVP-007 | Detalle de Viaje | Concentrar la operación posterior a la venta | Resumen e intervalo efectivo; Servicios/Reservas y componentes de Proveedor; pagos del Cliente y saldos; fechas límite; Tareas y nota de trabajo; resumen/enlace de Comisiones; cancelaciones por componente; línea de tiempo propia más Leads vinculados |
| SCR-MVP-008 | Calendario | Ver compromisos e hitos por fecha | Vistas mensual, semanal y planificación/agenda; Viajes como intervalos continuos; Tareas, pagos y Comisiones como hitos; filtros por tipo; clic abre panel lateral contextual |
| SCR-MVP-009 | Tareas | Administrar toda la carga operativa | Grupos Vencidas/Hoy/Próximas/Sin fecha; filtros por contexto/estado; crear, completar y reprogramar; navegación a Lead, Viaje o Comisión |
| SCR-MVP-010 | Comisiones | Controlar el dinero esperado y recibido por World Memories | Totales por moneda; listas Esperadas/Próximas/Vencidas/Pagadas; importe esperado y real; fechas; Proveedor; Viaje; `Tracking Form #`; marcar pago; seguimiento `Where’s My Commission` |
| SCR-MVP-011 | Proveedores | Administrar el catálogo operativo | Lista, búsqueda, filtros y estado Activo/Inactivo; alta y edición; acceso al detalle |
| SCR-MVP-012 | Detalle de Proveedor | Mantener reglas específicas sin salir de su contexto | Datos generales y etiquetas; monedas permitidas; configuración de Comisión; plantillas de Tareas; referencias y notas; historial preservado al inactivar |
| SCR-MVP-013 | Datos y respaldos | Concentrar operaciones delicadas de datos | Mini manual operativo no técnico; importar paquete CSV con manifiesto, validación, vista previa, advertencias y confirmación; exportar Excel; descargar JSON versionado; restaurar JSON solo tras descargar respaldo actual, validar resumen y confirmar reemplazo completo; ver última descarga; recordatorio de tres días; reportes de lote |
| SCR-MVP-014 | Configuración | Administrar preferencias y catálogos globales | Tipos de viaje, fuentes de adquisición, canales de comunicación, idioma y formatos; no duplica Proveedores ni sus reglas |

## Superficies transversales

| ID | Superficie | Comportamiento |
|---|---|---|
| SCR-X-001 | Buscador global | Resultados agrupados por Cliente, Lead, Viaje, Proveedor, Tarea y Comisión; incluye nombres, destinos, reservaciones, `Tracking Form #` y texto de notas; abre el contexto seleccionado |
| SCR-X-002 | Centro de notificaciones | Campana con contador para Tareas, pagos, Comisiones y respaldo; una notificación permanece hasta completar, reprogramar o resolver; el respaldo puede descartarse temporalmente sin reiniciar el plazo |
| SCR-X-003 | Panel lateral de Calendario | Un clic muestra resumen y solo las rutas aplicables: abrir Tarea, Viaje, Cliente o Comisión; no depende de doble clic |
| SCR-X-004 | Confirmación de importación | Presenta conteos, errores, advertencias, duplicados y relaciones antes de persistir; permite cancelar sin cambios |
| SCR-X-005 | Guardado de expediente | Un solo `Guardar cambios`, advertencia al salir con cambios y confirmación visible de última persistencia |

## Flujo primario entre pantallas

```text
Lead recibido
    ↓ cotización, seguimiento y negociación
Primer pago confirmado
    ↓ vincula/crea Cliente y crea Viaje
Viaje + Servicios/Proveedores + pagos del Cliente
    ↓ operación, calendario y tareas
Viaje completado
    ↓ seguimiento de Comisiones
Comisión pagada o seguimiento de vencida
```

El historial no se copia durante este flujo. Lead, Cliente y Viaje proyectan los mismos eventos relacionados conforme DEC-159 y DEC-160.

## Dashboard: fotografía actual

El Dashboard no tiene filtros de periodo ni gráficos históricos.

### KPIs comerciales

- Leads activos.
- Cotizaciones por enviar.
- Cotizaciones en seguimiento.

### KPIs operativos

- Viajeros en curso.
- Próximos Viajes.
- Tareas pendientes y vencidas.

### KPIs de Comisiones y cobro

- Saldos vigentes de Clientes por cobrar.
- Comisiones esperadas pendientes.
- Comisiones vencidas.
- Comisiones cobradas en el mes calendario actual.

Los importes se separan por moneda y cada tarjeta abre su detalle. Conversión no pertenece al Dashboard.

## Comisiones frente a pagos del Cliente

- **Comisiones:** ingreso esperado o recibido por World Memories; se administra globalmente en SCR-MVP-010 y desde el contexto del Viaje.
- **Pagos del Cliente:** movimientos vinculados a un componente de Proveedor para controlar anticipo, saldo y fecha límite; se administran dentro de SCR-MVP-007.
- Un módulo `Finanzas` no forma parte del MVP. Solo se considerará después si aporta capacidades diferentes; de lo contrario, la evolución será Comisiones más avanzada.

## Evoluciones mapeadas fuera del MVP

### Insights

Sección histórica posterior, sin nuevas preguntas de descubrimiento antes del MVP:

- Selector de periodo y moneda.
- KPIs históricos y detalle navegable.
- Barras: comparación mensual de Leads/ventas, distribución del pipeline y comparación por Proveedor.
- Líneas: tendencias de Leads, ventas y Comisiones esperadas/pagadas.
- Tablas: promedio y mediana de pago por Proveedor; salud de Tareas.
- Conversión por cohorte de Leads.
- Sin gráfica de dispersión inicialmente.
- Histórico incompleto marcado como `no medible`.

### Otras evoluciones

- Experiencia móvil ligera y sincronización entre dispositivos, después de una base de datos compartida.
- Correos e integraciones externas disparadas por Tareas/alertas.
- Almacenamiento de PDF de cotizaciones, confirmaciones y vouchers.
- Módulo Finanzas únicamente si agrega gastos, banca, impuestos, flujo de efectivo o rentabilidad; si no, evolución de Comisiones.
- Multiusuario, sincronización y backend remoto; la PWA instalable de escritorio sí pertenece al MVP conforme DEC-168.

## Fuera del MVP de forma explícita

- Importación directa de Excel; el MVP importa paquetes CSV canónicos.
- Gráficos históricos y filtros de periodo en el Dashboard.
- Contabilidad completa o estado de resultados.
- Mensajería automática por WhatsApp, correo o Instagram.
- Documentos adjuntos.
- Operación móvil soportada o sincronizada.
- Plantillas activadas automáticamente por componentes; se sugieren por Proveedor y requieren confirmación.

## Cierre de Fase E

La usuaria confirmó formalmente el 2026-08-25 que:

1. Las pantallas del MVP cubren su operación inicial.
2. No falta un módulo imprescindible para salir en vivo.
3. Los elementos futuros están separados y no condicionan el MVP.
4. Dashboard, Comisiones, calendario, búsqueda, notificaciones, importación/respaldo y configuración tienen límites entendibles.

La Fase E queda cerrada conforme DEC-167. Fase F definirá la arquitectura de la PWA de escritorio publicada en GitHub Pages, persistencia IndexedDB, esquema CSV/JSON, estrategia de actualización/offline, pruebas y plan de implementación. No se escribirá código de producto antes de la aprobación de Fase G.
