# Modelo de datos vivo — borrador 0.1

## Estado

- **Fase:** descubrimiento y validación del dominio.
- **Confirmado:** una fila de `Ventas` representa un componente de Proveedor; un Viaje agrupa múltiples componentes y servicios.
- **Confirmado:** las fechas efectivas del Viaje se calculan desde sus servicios y permiten override manual.
- **Confirmado:** las acciones de negocio relevantes generan eventos automáticos para métricas e historial.
- **Confirmado:** captura inicial balanceada de Lead.
- **Pendiente:** manejo de fechas tentativas desconocidas, estados/transiciones y reglas de clientes duplicados.

## Entidades y relaciones iniciales

```text
Cliente ──0..*──> Lead ──0..1──> Viaje ──1..*──> Servicio/Reserva ──1..*──> Proveedor de servicio ──0..1──> Comisión
                                 │                    │                       │
                                 ├──0..*──> Pasajero  │                       └──1──> Proveedor
                                 ├──0..*──> Tarea     └──0..*──> Concepto adicional de servicio
                                 └──0..*──> Nota

Lead ──0..*──> Tarea
Lead ──0..*──> Nota

Lead, Cliente, Viaje, Servicio, Proveedor, Comisión y Tarea ──0..*──> Evento de actividad

Cliente ──0..*──> Contacto de cliente
Cliente ──0..*──> Cuenta de servicio
```

Cada consulta crea un Lead independiente desde el primer contacto, aunque no llegue a venta. Un Cliente puede relacionarse con múltiples Leads; una nueva consulta para otro viaje crea otro Lead y no modifica ni reutiliza el anterior. La conversión crea o vincula Cliente y crea Viaje sin borrar ni reutilizar el Lead como otra entidad. Durante importación histórica, los posibles duplicados de Cliente se presentan como sugerencias basadas en nombre, correo y teléfono normalizados; la usuaria decide por cada caso si fusiona o crea un Cliente independiente. Nunca se fusionan automáticamente. Si quedan sin revisar, se crean como independientes y se marcan para revisión posterior.

En importación histórica, `lead.received_on` puede quedar nulo solo con `lead.received_date_status=unknown_historical`; no se deriva de una cotización ni de otra fecha. Los Leads creados dentro del CRM siempre registran automáticamente la fecha/hora de recepción y usan `received_date_status=known`.

Para el lote histórico inicial confirmado, un `quote_sent=confirmed_unknown_historical` expresa que la cotización fue enviada aunque `quote.sent_on` sea nula. No se crea el evento cronológico `quote_sent` ni una Tarea pendiente a partir de esa excepción, por lo que las métricas dependientes permanecen no medibles. Las acciones nuevas sí registran evento y fecha/hora automática.

Cada Lead y componente de Proveedor importado recibe una clave interna nueva y conserva por separado `legacy_lead_id`, `source_sheet`, `source_row` e `import_batch_id`. La evidencia independiente de una fila de `Ventas` se usa para ubicarla en el Viaje correcto; los valores copiados por XLOOKUP no cuentan como confirmación independiente. Un Viaje puede reunir varios Leads mediante una relación trazable `trip_lead`; un componente de Proveedor pertenece al Viaje mediante su Servicio/Reserva y no exige un único `lead_id` propio. No se agrupan filas en la misma Reserva sin evidencia independiente. Los casos sin candidato o grupo de Viaje verificable quedan pendientes de revisión humana, sin crear una relación provisional.

El Viaje conserva `trip.traveler_count` como total de viajeros del conjunto. Un Servicio/Reserva puede tener `service.traveler_count`, `service.adult_count` y `service.child_count` propios cuando cubre un subconjunto —por ejemplo, cabinas o reservas separadas—; esos conteos no tienen que replicar el total del Viaje. La duración de Servicio/Reserva usa `service.duration_value` más `service.duration_unit` (`nights`, `service_days` u otra unidad configurada), con sus fechas efectivas como fuente de contexto. No se aplica una fórmula de noches a una renta de auto ni a otro servicio cuya unidad operacional sea distinta.

## Expediente de Cliente y cuentas de servicio

El Cliente es el repositorio reutilizable posterior al Lead: puede tener varios Viajes, contactos y preferencias o detalles operativos ampliados de forma progresiva. Un Lead puede estar vinculado a un Cliente existente desde su captura o revisión; si no lo está, su detalle ofrece crear o vincular un Cliente de manera explícita.

Una `Cuenta de servicio` registra plataforma, identificador de acceso, propósito, referencias operativas y notas relacionadas; nunca registra contraseñas. El perfil de Cliente además puede reunir preferencias, gustos y notas adicionales. Los atributos de cada viajero individual se modelarán aparte cuando se defina la entidad Pasajero.

## Nota útil de familia y datos estructurados

El Cliente/Familia tiene una `nota_util_de_familia` enriquecida para contexto libre: texto, negritas, listas y checklist. Su contenido no genera filtros, métricas ni tareas automáticamente. En cambio, los campos de oportunidad/viaje que requieren búsqueda o visibilidad comercial se mantienen estructurados: tipo de viaje, moneda de cotización/pago, fechas, adultos, niños, total derivado y presupuesto. El presupuesto se asocia al Lead/Cotización actual, no al Cliente permanente.

Las `Notas` históricas de la hoja `Leads` se conservan como notas vinculadas a su Lead de origen, con la fila fuente para trazabilidad. Su texto se mantiene como contexto y no genera automáticamente Tareas, estados, métricas ni campos estructurados.

Cada fila de `Datos Clientes` crea un `Client` maestro histórico con `source_sheet`, `source_row` e `import_batch_id`. Sus valores se preservan en campos de Cliente o de cuenta de servicio sin deduplicar, fusionar, completar ni vincular automáticamente desde Leads o Ventas. La hoja es independiente de los Clientes que el CRM pueda crear o vincular desde Leads en operaciones futuras.

Las `notas` históricas de `Ventas` se conservan como notas vinculadas al `service_provider` de la misma fila, con la fila fuente para trazabilidad. Su texto es contexto operativo y no altera automáticamente datos estructurados, estados, fechas, importes, Comisiones, Tareas ni relaciones.

Cada Viaje tiene una única `nota_de_trabajo` enriquecida para avances y pendientes de esa oportunidad. Puede contener múltiples fechas, asuntos y bloques con títulos, subtítulos, negritas, listas y checklist; es distinta de la nota permanente del Cliente/Familia y no cambia estados ni crea tareas o métricas por interpretación automática.

El expediente abierto del Cliente/Familia es el límite de edición de la pantalla: `Guardar cambios` persiste en una sola operación los cambios pendientes del Cliente y de sus entidades editables visibles —incluidos Viajes, Proveedores, importes y notas—. Un fallo de validación no debe dejar solo una parte confirmada.

El guardado conserva una marca visible de última persistencia para el Cliente y el Viaje (`last_saved_at`), actualizada solo después de confirmar correctamente el conjunto de cambios.

## Semántica de fechas del Viaje

| Campo conceptual | Fuente | Regla |
|---|---|---|
| `lead.requested_start_on` | Lead | Fecha originalmente solicitada; nunca se sobrescribe al confirmar servicios |
| `lead.requested_end_on` | Lead | Fin originalmente solicitado |
| `lead.requested_date_status` | Lead | `known` o `fechas_por_definir`; impide interpretar nulos como fechas válidas |
| `service.start_on` | Servicio/Reserva | Inicio específico del componente |
| `service.end_on` | Servicio/Reserva | Fin específico del componente |
| `trip.computed_start_on` | Derivado | Mínimo `service.start_on` no nulo |
| `trip.computed_end_on` | Derivado | Máximo `service.end_on` no nulo |
| `trip.override_start_on` | Usuario, opcional | Corrección manual si el viaje comienza antes que los servicios registrados |
| `trip.override_end_on` | Usuario, opcional | Corrección manual si termina después que los servicios registrados |
| `trip.effective_start_on` | Derivado | Override si existe; en caso contrario fecha calculada |
| `trip.effective_end_on` | Derivado | Override si existe; en caso contrario fecha calculada |
| `trip.completed_at` | Sistema | Se registra automáticamente al iniciar el día calendario siguiente a `trip.effective_end_on`; no requiere captura manual |

Reglas:

- Al comenzar el día posterior a `trip.effective_end_on`, el Viaje pasa automáticamente a `Completado` y se registra un evento. Esta transición habilita el seguimiento de Comisiones, pero no cambia la fórmula de `commission.due_on`, que usa el fin efectivo como ancla.

- Un override no destruye el valor calculado; ambos quedan visibles para auditoría.
- Crear, cambiar o eliminar un servicio recalcula el intervalo si no existe override.
- Aplicar o retirar override genera un evento con fecha/hora y razón breve opcional.
- Si no hay servicios fechados, el Viaje puede quedar sin intervalo efectivo o usar una captura manual explícita; no copiar silenciosamente las fechas tentativas del Lead.
- Si el Lead está en `fechas_por_definir`, ambas fechas solicitadas son nulas y no se calculan noches ni se crea un evento de calendario.

## Evento de actividad

Entidad append-only para registrar acciones de negocio confirmadas. No registra cada tecla, navegación ni edición sin guardar.

| Campo | Tipo | Propósito |
|---|---|---|
| `event_id` | string | Identificador interno único |
| `entity_type` | enum | Lead, Cliente, Viaje, Servicio, Comisión o Tarea |
| `entity_id` | string | Entidad principal relacionada |
| `event_type` | enum | Tipo centralizado de evento |
| `occurred_at` | datetime | Momento de la actividad; automático por defecto |
| `recorded_at` | datetime | Momento en que el sistema registró el evento |
| `source` | enum | `system`, `manual`, `import` o `migration` |
| `actor_id` | string/null | Usuario local inicial; preparado para futuro multiusuario |
| `related_entity_type/id` | opcional | Relación secundaria, por ejemplo tarea o cotización |
| `summary` | string opcional | Nota breve solo cuando agrega contexto |
| `change_set` | objeto limitado | Campos relevantes antes/después, sin secretos ni snapshots completos |

Eventos mínimos propuestos:

- `lead_received`
- `lead_contact_logged`
- `lead_follow_up_logged`
- `quote_sent`
- `quote_preparation_started`
- `lead_status_changed`
- `lead_converted`
- `task_created`
- `task_rescheduled`
- `task_completed`
- `service_created`
- `service_status_changed`
- `trip_dates_overridden`
- `commission_registered`
- `commission_marked_paid`

## Reglas de generación de eventos

- La acción de negocio y su evento se guardan en la misma transacción.
- La fecha/hora actual se asigna automáticamente.
- “Registrar otra fecha” aparece como opción secundaria; `occurred_at` cambia, pero `recorded_at` conserva cuándo se capturó.
- Las importaciones conservan fechas históricas conocidas y marcan `source=import`; no inventan eventos que el Excel no demuestra.

## Persistencia local e integridad

El MVP usa una única base IndexedDB. Sus colecciones separan entidades y relaciones de dominio: Clientes, miembros/viajeros, Leads, Viajes, vínculos Lead–Viaje, Servicios/Reservas, Proveedores de servicio, conceptos adicionales, Proveedores, Comisiones, Tareas, Notas, Eventos, plantillas, catálogos/configuración, lotes de importación y estado de notificaciones/respaldo.

La interfaz no escribe directamente en estas colecciones. Cada acción de negocio se ejecuta mediante el contrato de persistencia aprobado en DEC-169 y confirma en una sola transacción todas las entidades afectadas y el Evento de actividad correspondiente. Ejemplo: al confirmar el primer pago exitoso, se guardan juntos el pago/componente, la transición del Lead a `Vendido`, los vínculos necesarios y el evento; si una validación o escritura falla, no queda una parte de la operación aplicada.

Los índices y consultas se diseñan a partir de las relaciones, estados y fechas requeridas por las pantallas aprobadas; no son una segunda fuente de verdad ni alteran los datos originales. La versión de esquema se conserva dentro de la base y se migra según DEC-170.
- Cambiar estatus registra el estado anterior y nuevo, sin duplicar datos personales.
- El historial no se edita destructivamente; una corrección crea un evento trazable.

## Hitos y métricas derivadas

| Métrica/hito | Derivación candidata |
|---|---|
| Lead recibido | Primer `lead_received.occurred_at` |
| Primera respuesta | Primer contacto efectivo |
| Cotización enviada | Primer `quote_sent`; conservar eventos posteriores |
| Conversión | `lead_converted.occurred_at` |
| Último seguimiento | Último contacto/seguimiento relevante |
| Tiempo de primera respuesta | Primera respuesta − recepción |
| Tiempo a cotización | Primera cotización − recepción |
| Tiempo de conversión | Conversión − recepción |
| Tarea atrasada | `due_at < now` y estado no completado/cancelado |
| Retraso de tarea | Finalización − vencimiento, cuando sea positivo |

Estas métricas se calculan desde eventos; no requieren campos manuales adicionales. Para la importación histórica, `lead.quote_response_days` puede cargarse como resultado numérico derivado únicamente cuando `lead.received_on` y `quote.sent_on` son conocidos; si falta una fecha queda nulo/no medible y no se persiste la fórmula de Excel.

## Principio de captura mínima

- Fechas de creación, recepción, modificación y acciones se generan automáticamente.
- Estado inicial, propietario y defaults se asignan por configuración.
- Campos derivados se muestran como lectura, no como inputs repetidos.
- Formularios usan divulgación progresiva: captura rápida primero y detalles después.

## Semántica de comisiones y fechas de pago

Cada Comisión conserva por separado:

| Campo conceptual | Significado | Captura |
|---|---|---|
| `commission.due_on` | Fecha esperada o límite para recibir la comisión | Importada, calculada desde la regla del Proveedor o definida por override manual; para registros nuevos permanece vacía sin fin efectivo del Viaje |
| `commission.due_rule_source` | Origen de la fecha esperada | Regla del Proveedor, importación, plazo personalizado o fecha fija manual |
| `commission.due_days_after_trip_end` | Plazo usado para calcular la fecha | Snapshot del plazo del Proveedor al crear la Comisión; debe ser igual o menor a 90 días calendario y no cambia por ediciones posteriores del Proveedor |
| `commission.due_override_mode` | Tipo de ajuste de fecha | `relative_days` recalculable o `fixed_date` bloqueado |
| `commission.paid_on` | Fecha real en que la comisión fue pagada | Vacía hasta que la usuaria seleccione una fecha en el calendario; en una importación histórica puede permanecer vacía aun con estado `Pagada` si la fuente confirma el pago pero no su fecha |
| `commission.paid_date_status` | Calidad de la fecha real de pago | `known` para pagos nuevos o históricos con fecha comprobable; `unknown_historical` para una Comisión histórica confirmada como pagada sin fecha real |
| `commission.status` | Estado operativo, por ejemplo pendiente o pagada | Se deriva al registrar `paid_on` y el único monto real, salvo la excepción histórica `paid_date_status=unknown_historical` aprobada en DEC-103 |
| `commission.legacy_status_context` | Contexto de seguimiento importado desde `Ventas.Status` | Conserva el texto legado y su interpretación aprobada, por ejemplo `tracking_registered`, `collection_follow_up` o `trip_not_completed`; no altera el Servicio ni inventa eventos fechados |
| `commission.tracking_reference` | Identificador oficial de plataforma para rastrear una Comisión | Se genera al subir el formulario o *commission report* y puede estar presente mientras la Comisión permanece pendiente; no equivale al pago con tarjeta del cliente ni al pago de Comisión |
| `service_provider.commission_status` | Situación de comisión de un Proveedor dentro del Servicio/Reserva | `con_comision` por defecto o `sin_comision` por acción explícita; este último no crea una Comisión y puede cambiarse manualmente a `con_comision` |
| `service_provider.sale_amount` | Importe final cobrado al cliente correspondiente a un Proveedor dentro del Servicio | Base de cálculo de su porcentaje fijo; contribuye al total derivado del Servicio |
| `service_provider.customer_card_paid_on` | Fecha efectiva de pago con tarjeta del cliente en la plataforma | Pertenece al componente de Proveedor; no se confunde con el vencimiento ni el pago de Comisión |
| `customer_payment` | Cobro confirmado al cliente por un componente de Proveedor | Registra al menos importe, moneda, fecha efectiva, tipo (`anticipo`, adicional o `saldo`) y componente relacionado; el primer cobro exitoso dispara la conversión del Lead |
| `customer_payment` sin componente temporal | Primer cobro que convierte el Lead antes de que se capturen Servicios/Proveedores | En la transacción de conversión se conserva el importe, moneda, fecha efectiva y fecha de registro vinculado al Viaje. En la Oleada 2 se exigirá y asignará su componente de Proveedor; nunca se descarta ni se duplica ese movimiento. |
| `service_provider.customer_paid_total` | Total cobrado al cliente para el componente | Derivado de los `customer_payment` confirmados en la misma moneda |
| `service_provider.customer_balance_due` | Saldo pendiente del cliente para el componente | Derivado de `sale_amount − customer_paid_total`; no se captura manualmente |
| `service_provider.customer_balance_due_on` | Fecha límite de saldo del cliente | Opcional y capturada manualmente por componente de Proveedor; no se deriva porque depende de cada política de reserva |
| `payment_due_reminder` | Alerta interna de saldo pendiente | Se deriva de `customer_balance_due_on` con offsets de 30, 7, 1 y 0 días; vinculada al componente y editable |
| `service_provider.booking_reference` | Número de reservación emitido por la plataforma del Proveedor | Pertenece al componente de Proveedor; puede quedar vacío mientras no exista reserva y no se infiere |
| `provider.allowed_currency_codes` | Monedas que acepta el Proveedor | Uno o varios códigos ISO-4217; la carga inicial los detecta desde el histórico y la limpieza posterior puede ajustarlos |
| `service_provider.currency_code` | Moneda efectiva del importe del Proveedor dentro del Servicio | ISO-4217; debe pertenecer a `provider.allowed_currency_codes` y seleccionarse explícitamente antes de guardar `sale_amount`; acompaña siempre a ese importe y puede diferir de otros componentes |
| `service.reservation_holder_name` | Titular de una Reserva concreta | Puede diferir del contacto del Lead. Se conserva como dato histórico de la Reserva y no crea ni sustituye automáticamente un Cliente. |
| `service_additional_item.label` | Nombre del concepto adicional sin Proveedor | Obligatorio; texto breve, por ejemplo IVA, seguro u otro cargo puntual |
| `service_additional_item.amount` | Importe del concepto adicional sin Proveedor | Obligatorio; contribuye al total derivado del Servicio y no genera comisión por sí mismo |
| `service_additional_item.currency_code` | Moneda del concepto adicional | ISO-4217; obligatoria porque un Servicio puede ser multimoneda |
| `service.sale_totals_by_currency` | Importes finales cobrados al cliente por el Servicio | Proyección derivada por moneda de Proveedores y conceptos adicionales; no es un total escalar cuando hay varias monedas |
| `trip.reference_currency_code` | Moneda de referencia del Viaje | Es la moneda de cotización al cliente; no reemplaza monedas originales de componentes |
| `trip.exchange_rate_base_currency_code` | Moneda base de la tasa | Primera moneda de la expresión, por ejemplo USD en `1 USD = 18.50 MXN` |
| `trip.exchange_rate_quote_currency_code` | Moneda cotizada por la tasa | Segunda moneda de la expresión, por ejemplo MXN en `1 USD = 18.50 MXN` |
| `trip.reference_exchange_rate` | Única tasa de cambio editable del Viaje | Unidades de la moneda cotizada por una unidad de moneda base; se muestra siempre con el par completo |
| `trip.exchange_rate_locked_at` | Momento en que la tasa quedó congelada | Se registra automáticamente al marcar el Viaje `Vendido`; vacío durante preparación |
| `event.exchange_rate_change_reason` | Motivo de un ajuste de tasa posterior a `Vendido` | Texto libre opcional; el evento conserva automáticamente tasa anterior/nueva, usuario y marcas temporales |
| `trip.reference_totals_by_currency` | Totales originales y de referencia del Viaje | Conserva los totales originales por moneda y, cuando aplica, el total convertido a la moneda de referencia |
| `commission.service_provider_id` | Proveedor de servicio al que corresponde la Comisión | Relación obligatoria; una Comisión pertenece a un Proveedor concreto dentro de un Servicio concreto |
| `provider.gross_commission_mode` | Forma en que el Proveedor define la comisión bruta | `fixed_percentage` o `variable_amount_per_service`; se configura al crear o editar el Proveedor |
| `provider.default_gross_rate` | Porcentaje bruto estándar del Proveedor | Requerido solo para `fixed_percentage`; editable en la configuración del Proveedor |
| `commission.gross_input_mode` | Modo aplicado a la Comisión | Snapshot del modo configurado en el Proveedor |
| `commission.gross_rate` | Porcentaje de comisión bruta aplicado | Snapshot del porcentaje configurado en el Proveedor, solo en modo `fixed_percentage` |
| `commission.gross_rate_base_amount` | Importe usado para calcular la comisión por porcentaje | Snapshot de `service_provider.sale_amount` del mismo Proveedor dentro del Servicio |
| `commission.gross_amount` | Comisión al 100% | Capturada dentro del Servicio en modo `variable_amount_per_service` o calculada en modo `fixed_percentage`; es el valor financiero canónico para reportes |
| `financial_amount_status` | Calidad de un importe histórico de Servicio o Comisión | `known` cuando existe valor numérico comprobable; `unknown_historical` cuando la fuente conserva el registro pero no permite conocer el importe sin inferirlo |
| `commission.agency_share_rate` | Participación de la agencia | Proviene de la configuración individual del Proveedor; valores iniciales 80% o 100% |
| `commission.agency_share_rate_source` | Origen de la participación aplicada | Referencia a la configuración del Proveedor vigente al registrar la comisión |
| `commission.net_expected_amount` | Participación esperada de la agencia | `gross_amount × agency_share_rate` |
| `commission.net_expected_currency_code` | Moneda del monto neto esperado | Snapshot de la moneda de la comisión esperada |
| `commission.projection_exchange_rate` | Tasa usada para proyectar la Comisión | Sigue la tasa del Viaje hasta el primer override; después queda independiente |
| `commission.projection_exchange_rate_source` | Origen de la tasa proyectada | `trip_reference` implica seguimiento del Viaje; `commission_override` implica valor propio; la acción explícita de reversión restaura `trip_reference` |
| `commission.projected_reference_amount` | Importe esperado convertido para planeación | Derivado desde el monto esperado original y la tasa propia de la Comisión; no reemplaza el original |
| `commission.net_received_amount` | Monto real recibido | Se registra al confirmar o corregir el pago; no reemplaza el esperado |
| `commission.net_received_currency_code` | Moneda del monto real recibido | Puede diferir de la moneda esperada según proveedor y canal de pago |
| `commission.receipt_variance_amount` | Diferencia entre recibido y esperado | Derivada únicamente si ambos montos comparten moneda; queda vacía para monedas distintas en el alcance inicial |
| `commission.receipt_variance_note` | Motivo breve de la diferencia | Texto libre opcional, sin efecto en cálculo, estado o reportes; campo desacoplado y retirable |

Seleccionar `paid_on` confirma el único pago de la Comisión y genera `commission_marked_paid`, aunque el monto real difiera del esperado. Si existe diferencia, se muestra una advertencia; confirmar guarda ambos montos y cierra el pago, mientras regresar permite corregir sin marcarlo como pagado. El pago conserva `net_received_amount` y su moneda separados de `net_expected_amount` y su moneda: el monto real es el valor canónico para reportes de cobros y la diferencia puede deberse a tipo de cambio o cargos bancarios intermediarios. Si las monedas son distintas, el sistema no fabrica una diferencia ni solicita una tasa manual por pago; el dashboard inicial agrupa y totaliza cada moneda por separado. `occurred_at` representa la fecha real seleccionada, mientras `recorded_at` conserva cuándo se registró, incluso si se captura durante una puesta al día de pendientes. No se sustituye la fecha real por la fecha de captura ni se usa un checkbox como única evidencia. Los pagos parciales están fuera de alcance inicial.

En el flujo de Archer, la conciliación ocurre cuando llega un depósito quincenal: la usuaria revisa la plataforma externa, ubica cada Comisión por `commission.tracking_reference` y confirma individualmente los pagos que correspondan. Una Comisión pendiente que rebase su fecha esperada se muestra como vencida y requiere seguimiento interno `Where’s My Commission`; esta señal nunca inicia sesión, presenta ni envía el formulario externo. Toda fecha esperada usa un plazo de hasta 90 días calendario desde `trip.effective_end_on`; un Proveedor solo puede configurar un plazo anterior.

Un Servicio/Reserva puede tener uno o varios Proveedores participantes y cero o más conceptos adicionales sin Proveedor. Cada componente conserva importe y moneda. Los totales del Servicio se derivan agrupando por moneda los importes de Proveedores y conceptos adicionales. El Viaje puede aplicar una única tasa de cambio editable para producir un total de referencia en su moneda elegida, preservando siempre los valores originales. La tasa recalcula durante preparación, se congela al marcar `Vendido` y un ajuste posterior genera un evento con valores anterior/nuevo y marcas temporales. Cada concepto adicional inicia como nombre, importe y moneda, sin categorías obligatorias. Cada Proveedor define si su comisión bruta se calcula con un porcentaje fijo configurado a nivel Proveedor —aplicado a su propio importe final— o mediante un monto variable que la usuaria captura dentro del Servicio. La participación de agencia (80% o 100% inicialmente) es una configuración distinta y solo determina cuánto recibe la agencia del monto bruto. Si un Proveedor de servicio no genera comisión, se marca `sin_comision`; no se crea una Comisión ni se exige el motivo. El origen del Lead y el tipo principal de viaje no cambian por sí mismos la comisión.
- Acciones frecuentes actualizan estado, fecha y evento en una sola operación.
- Solo pedir un dato cuando el sistema no puede inferirlo con seguridad o existe una decisión real.
- Campos opcionales o avanzados no bloquean guardar un lead inicial.

## Captura inicial balanceada de Lead

| Grupo | Campo mínimo | Tratamiento |
|---|---|---|
| Identificación | Nombre o referencia familiar | Visible, no bloquea el guardado si falta |
| Origen de adquisición | Cómo conoció a World Memories | Catálogo configurable; si es `Referido`, muestra `referido_por` |
| Comunicación | Canal por el que se estableció la conversación | Campo independiente del origen; puede coincidir con él y no se infiere si falta en el histórico |
| Contacto | Teléfono y correo en campos separados | Ambos visibles e independientes; ninguno bloquea el guardado inicial |
| Perfil | País de residencia actual | Visible, opcional y completo después si falta; pertenece al Lead y no actualiza un Cliente automáticamente |
| Solicitud | Destino y tipo de viaje | Destino libre como resumen de la intención inicial; tipo configurable; ambos opcionales al guardar. El destino de Lead no es el itinerario definitivo. |
| Fechas | Fechas tentativas | Rango tentativo o estado explícito `fechas_por_definir` |

El sistema asigna automáticamente `lead_received`, fecha/hora de recepción, estado inicial, propietario, ID interno y datos de auditoría. La misma pantalla mantiene disponible el campo de presupuesto junto con adultos, niños y moneda, sin convertirlos en requisitos de la captura inicial. `lead.budget_amount` puede completarse después de crear el Lead y su valor puede permanecer vacío incluso al cotizar o marcar `Vendido`; el campo conserva el presupuesto comunicado cuando existe. La captura rápida y completa guardan el mismo Lead.

Para iniciar una cotización, el Lead puede reunir información de calificación adicional: fechas y flexibilidad, situación de vuelos, contexto del viaje y edades de menores cuando aplique. Esta información se recaba normalmente por WhatsApp; el origen de adquisición permanece separado del canal operativo. La cotización pasa a `Cotización enviada` solo al confirmar el envío del PDF al cliente. El MVP conserva ese evento y sus datos estructurados, no el archivo PDF ni otros adjuntos (confirmaciones o vouchers); el almacenamiento documental es evolución futura. La estructura exacta para edades de menores y contexto del viaje se valida antes de fijar el esquema final.

Durante la importación histórica, `quote.quoted_amount` conserva el único importe disponible de la columna `Cotización`, en la moneda del Lead. Ese valor no prueba cuántas revisiones hubo ni cuál fue la primera, por lo que no se crean versiones ni eventos de ajuste retroactivos.

## Catálogo inicial de tipo de viaje

`lead.travel_type_id` es un único valor configurable y su valor inicial puede ser: Tour; Hotel; Paquete Disney; Paquete Universal; Palace Group; Viaje personalizado; Crucero; Renta auto; Boletos experiencias; Paquete Expedia; Operador fuera de Archer; Vuelo + hotel; Tickets parque; Seguro viaje; Emisión boletos vuelos. Clasifica la necesidad principal expresada en el contacto inicial; no representa un itinerario ni los componentes que se cotizan o reservan después. Puede quedar vacío. Los extras y componentes pertenecen a Servicios/Reservas de la cotización o Viaje, no a tipos adicionales del Lead.

Al registrar el primer evento `quote_sent`, el sistema crea una `Task` interna de seguimiento ligada al Lead, con `due_on = quote_sent_on + 4 días calendario`. La tarea conserva su fecha calculada inicial, pero la usuaria puede modificarla o completarla sin alterar el evento de envío ni el estado del Lead.

El catálogo `lead.acquisition_source` inicia con: Friends & Family; Facebook; Referido; WhatsApp; Instagram; Viaje personal; Cliente. `Viaje personal` conserva el tratamiento comercial de un viaje de la familia de la agencia que también comisiona. `Cliente` indica un viaje nuevo para un Cliente ya existente. `referido_por` solo se muestra cuando el origen es `Referido`. `lead.communication_channel` es un campo distinto para el canal por el que se estableció la comunicación; su catálogo futuro se validará aparte y no se deduce de los valores históricos.

## Ciclo comercial inicial del Lead

Al marcar `Cancelado`, el Lead puede conservar `cancellation_reason_id` (categoría principal configurable) y `cancellation_reason_note` (texto libre opcional). La categoría puede añadirse durante el mismo flujo de marcado como cancelado y queda disponible para usos futuros; ninguna de las dos es obligatoria.

La cancelación de un Viaje ya vendido no elimina el Viaje ni sus cobros históricos. Puede afectar solo uno o varios componentes de Proveedor. Su resultado —incluidos los importes que el Proveedor reembolsa directamente al Cliente y cualquier penalización aplicable— se confirma manualmente a partir de la política vigente de cada Proveedor o Reserva y de la fecha de cancelación. No se deduce desde una tasa global ni se presupone que todas las tarifas sean reembolsables. Si un componente es reembolsado, su Comisión queda `Cancelada` y no participa en pendientes ni en reclamos; si no es reembolsable, la Comisión conserva seguimiento cobrable. En Agent Car, la penalización retenida del 10 % tras reembolsar 90 % pertenece al Proveedor y no genera Comisión para World Memories; la Comisión queda `Cancelada`. Otros reembolsos parciales requieren confirmación manual del resultado de la Comisión.

| Estado | Entrada / significado | Salida principal |
|---|---|---|
| Nuevo | Oportunidad registrada sin contacto inicial; opcional en captura manual | Contactado al registrar interacción real |
| Contactado | Ya se respondió o se sostuvo el primer contacto con datos suficientes para cotizar | Cotización en preparación |
| Cotización en preparación | Se investiga y construye la primera cotización | Cotización enviada |
| Cotización enviada | Se registró el envío al cliente | Seguimiento o Revisión/Ajustes |
| Seguimiento | Hay acciones posteriores al envío | Revisión/Ajustes, Vendido, Pausado o Cancelado |
| Revisión/Ajustes | Cliente solicita cambios, revisa opciones o se ajusta la cotización | Cotización enviada, Vendido, Pausado o Cancelado |
| Vendido | Primer cobro exitoso confirmado; conversión a Cliente y Viaje | Gestión operativa del Viaje |
| Pausado | Oportunidad detenida temporalmente | `Seguimiento` o `Revisión/Ajustes` mediante reactivación manual; `Cancelado` |
| Cancelado | Oportunidad cerrada sin venta | `Seguimiento` o `Revisión/Ajustes` mediante reactivación manual |

Reglas de entrada:

- La captura manual ofrece “Registrar como contactado” por defecto, pues normalmente ocurre después de responder o conversar.
- “Guardar como nuevo” queda disponible para una oportunidad conocida que aún no ha recibido contacto.
- Integraciones futuras de WhatsApp/Instagram crearán `Nuevo` al detectar una entrada; la respuesta humana genera `Contactado`.
- Si la hora de la consulta original no se conoce al registrar manualmente un Lead contactado, se conserva la actividad conocida, pero la métrica de tiempo de primera respuesta queda no medible.

## Pendientes de reglas comerciales

Al pausar, la interfaz sugiere una próxima acción opcional, sin crearla ni exigirla.
- Navegación: `Clientes/Familias` y `Viajes activos` son dos entradas a la misma entidad `Viaje`; ambas abren el mismo expediente enfocado y no crean copias.
- Pasajeros: cada contacto principal y viajero asociado conserva fecha de nacimiento. `age_years` y `age_months` son valores derivados al consultar, no campos persistidos. Otros atributos estructurados quedan pendientes.
- `Cliente/Familia` —0..*→ `Pasajero` representa sus miembros registrados. `Viaje` —1..*→ `Pasajero` representa solo los participantes seleccionados para esa oportunidad; además, cada Viaje conserva un contacto principal obligatorio del Cliente/Familia. El registro de Pasajero inicial se limita a nombre, fecha de nacimiento y edad derivada.
- El historial de respaldos conserva como mínimo `backup_downloaded_at`, tipo de salida (`full_json` u `operational_excel`) y versión de esquema; el contenido exacto y la restauración se validan en arquitectura.
- Edad: `passenger.current_age_years/months` se deriva de fecha de nacimiento y fecha de consulta. `trip_passenger.age_at_trip_start_years/months` se deriva de fecha de nacimiento y `trip.effective_start_on`; no se persiste como edad fija y permanece vacío si el Viaje no tiene inicio efectivo.
- Calendario: todo evento de calendario que representa un Viaje referencia su `trip_id`; su acción de apertura resuelve el mismo expediente enfocado de Viaje.
- Recordatorio de respaldo: después de `last_backup_downloaded_at + 3 días`, una alerta descartada fija su próxima elegibilidad 24 horas después. Una descarga nueva reinicia el ciclo.
- `passenger.relationship_to_primary_contact` es opcional y usa el catálogo configurable inicial `Pareja`, `Madre`, `Padre`, `Hijo`, `Hija`, `Otro`.
- Alta rápida: el contexto de edición de `Viaje` puede crear un `Pasajero` asociado al mismo `Cliente/Familia`; el guardado agregado conserva la creación y la asociación de participación del Viaje en una operación consistente.
- `passenger.status` permite al menos `active` y `archived`. Archivar conserva relaciones históricas y excluye al miembro de nuevas selecciones por defecto.
- `trip.primary_contact_id` se establece al crear el Viaje desde un Cliente/Familia y no cambia por reglas automáticas; una edición manual explícita puede sustituirlo. La creación puede iniciar el Cliente/Familia cuando todavía no existe.
- La vista de Cliente/Familia incluye miembros con `status=archived` como lectura histórica; los selectores de nuevos Viajes filtran ese estado salvo acción explícita de reactivación.
- `Task` puede vincularse a un `Lead`, `Viaje` o `Comisión`; una Tarea de Comisión conserva también el Viaje de su Comisión. Sus mínimos manuales son `title`, `due_on` y `due_time` opcional. Al llegar `commission.due_on` con Comisión pendiente, se crea una Tarea `Subir Where’s My Commission Form` con vencimiento el mismo día; es interna, editable y no envía formularios externos. El módulo global conserva el origen y el expediente de Viaje muestra sus tareas junto a la nota de trabajo.
- `ProviderTaskTemplate` pertenece a un `Proveedor` y define tareas predeterminadas. Al confirmar una relación `Proveedor de servicio`, se muestran instancias `Task` sugeridas en el Viaje, con referencia a su plantilla y proveedor de origen; la usuaria puede elegir, editar o descartar cada una antes de crearlas.
- `ProviderTaskTemplate` se administra dentro del MVP por la usuaria: puede crearse, editarse, activarse o desactivarse sin modificar código. La configuración posterior no altera las instancias de `Task` ya generadas.
- `provider_task_template.due_rule` admite inicialmente `manual`, `before_trip_start`, `on_trip_start` y `after_trip_start`; las reglas relativas conservan `offset_value` y `offset_unit` (`days` o `months`). La fecha propuesta de una instancia se deriva de `trip.effective_start_on` y permanece vacía sin esa fecha.
- `provider_task_template.due_rule` puede usar `trip.effective_end_on` como ancla (`before_trip_end` o `after_trip_end`) además del inicio; conserva unidad y valor del desplazamiento y deja la propuesta sin fecha si el ancla no existe.
- Cada `Task` de plantilla conserva `due_date_origin` (`template_dynamic` o `manual_override`) y, cuando cambia su ancla de Viaje, puede entrar en `due_date_review_required`. Las tareas dinámicas se recalculan; las protegidas no cambian hasta usar `Recalcular con plantilla` o confirmar/editar manualmente la fecha. Ambas acciones generan evento trazable.
- Las alertas del MVP se derivan en la interfaz desde tareas próximas/vencidas, tareas con revisión requerida y cada `service_provider.customer_balance_due_on` (30, 7 y 1 días antes, y el día límite); no se persisten ni se envían fuera del CRM. Las notificaciones de navegador, WhatsApp y otras integraciones quedan fuera del modelo inicial.
- La proyección global de `Task` permite agrupación derivada por vencimiento (`overdue`, `today`, `upcoming`, `unscheduled`) y filtros por `trip_id`, intervalo de fecha y `service_provider_id` cuando corresponda. Nuevos filtros no se asumen hasta ser validados.
- Las proyecciones de `Task` en el módulo global y dashboard conservan el orden operativo `overdue`, `today`, `upcoming`, `unscheduled`. El dashboard permite disparar `task_completed` o `task_rescheduled` desde la fila visible, sin crear un contexto de edición paralelo.
- Completar una `Task` conserva `completed_at` y genera evento. La acción temporal `undo_completion` revierte el estado solo durante la ventana del toast y genera su propio evento; reabrir después de esa ventana es una acción explícita separada.
- Cada `Task` generada desde plantilla conserva `template_id` y un snapshot versionado de sus campos y regla aplicados al crearla. Las ediciones posteriores de `ProviderTaskTemplate` solo se usan en nuevas instancias.
- La proyección de Calendario incorpora: rango `trip.effective_start_on`–`trip.effective_end_on`, `task.due_on`/hora opcional y `commission.due_on` mientras la Comisión esté pendiente. Los filtros de tipo son `trips`, `tasks` y `commission_due`; no se crean entradas cuando el campo fuente es nulo.
- El dashboard operativo proyecta cuatro colas sin crear datos nuevos: `travelers_in_progress` cuando la fecha actual está dentro del intervalo efectivo del Viaje; `upcoming_trips` cuando `trip.effective_start_on` pertenece al mes calendario actual o siguiente, con sus tareas pendientes; `commercial_work_queue` para Tareas de Lead pendientes y Leads con preparación de cotización iniciada sin primer `quote_sent`; y `overdue_commissions` para Comisiones pendientes cuya `due_on` ya pasó, mostrando Cliente/Viaje, Proveedor, fecha esperada y días de atraso.
- El Dashboard no aplica un periodo seleccionable: proyecta el estado vigente. Los KPIs de stock usan entidades actualmente activas/pendientes; `commissions_received_current_month` es la única tarjeta con una ventana temporal fija y explícita, desde el primer hasta el último día del mes calendario actual según `commission.paid_on`. Conversión y cualquier tendencia se excluyen de esta proyección.
- El módulo Comisiones proyecta `commission_ledger` sobre Comisiones esperadas, próximas, vencidas y pagadas, sin duplicar movimientos; agrupa totales por código de moneda y conserva navegación a Viaje, Proveedor y componente. Los pagos del Cliente y saldos pendientes permanecen en el contexto de Viajes/Servicios. Una evolución puede ampliar Comisiones; un módulo Finanzas separado solo se justificaría por capacidades financieras distintas conforme DEC-166.
- La proyección de línea de tiempo no duplica eventos: un Lead muestra sus eventos de origen; un Viaje combina sus eventos propios con los eventos de todos sus Leads vinculados mediante `trip_lead`, ordenados por `occurred_at` y etiquetados con la entidad de origen; y un Cliente agrega eventos de sus Leads y Viajes vinculados. El evento conserva su relación original y nunca cambia estados al visualizarse; cada cambio de estado se confirma junto con su evento en la misma operación.
- Cada evento proyectado de Calendario conserva un destino de navegación: `trip_workspace`, `task_context` o `commission_section`; la proyección solo enruta a entidades existentes y no crea datos nuevos.
- La preferencia de presentación del Calendario admite `month` (predeterminada), `week` y `planning_agenda`; esta última presenta intervalos continuos sin cuadrícula horaria. Las tres vistas proyectan los mismos eventos y no cambian el modelo.
- `Provider` exige `name` y `status` (`active` o `inactive`). Sus opcionales iniciales son `contact_name`, `phone`, `email`, `internal_notes` y `references[]`; `provider.service_tags[]` usa etiquetas múltiples configurables con valores iniciales Hoteles, Cruceros, Renta de coches, Actividades o tours. Un Proveedor inactivo conserva relaciones históricas y continúa visible en búsquedas con etiqueta; seleccionarlo para un nuevo servicio exige reactivación explícita. La pestaña general deriva un resumen de reglas de comisión y `task_template_count`, sin duplicar sus fuentes de verdad.
- La configuración de sistema conserva una preferencia de idioma para textos de interfaz, con valores compatibles `es` y `en`; el valor inicial es `es`. Los valores de dominio y el contenido capturado por la usuaria no se traducen ni sustituyen al cambiar esa preferencia.
- La preferencia de idioma no cambia formatos operativos: los números usan coma de miles y punto decimal, las fechas conservan orden día-mes-año y las cantidades mantienen su moneda registrada.
- La presentación operativa de fechas usa la convención fija `DD/MM/YYYY`, independiente del idioma seleccionado.
