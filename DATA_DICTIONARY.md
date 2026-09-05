# Diccionario de datos — borrador de migración 0.2

## Convenciones

- **Fuente:** `Control WM_12_07_2026_Dashboard.xlsx`.
- **Estado:** perfilado técnico confirmado; el grano de `Ventas` quedó validado como una fila por componente de Proveedor. Campos objetivo y obligatoriedad restantes siguen propuestos.
- **Ejemplos:** siempre sintéticos (`<texto>`, `<fecha ISO>`, `<importe>`, `<id legado>`).
- **Duplicados:** indica repeticiones de valor, no necesariamente registros duplicados.
- **Nulos:** conteo sobre las filas tabulares detectadas.
- Los tipos objetivo siguen una convención candidata: `string`, `date`, `integer`, `decimal`, `enum`, `boolean` y referencias `*_id`.
- Cada fila importada de `Leads` y `Ventas` conserva metadatos de trazabilidad `source_sheet`, `source_row` e `import_batch_id`; no dependen de columnas del Excel.

## Hoja `Leads` — tabla `Leads` (156 filas)

| Columna original | Significado inferido / tipo detectado | Ejemplo anon. | Nulos / distintos / fórmula | Destino propuesto | Transformación, problema y validación |
|---|---|---|---|---|---|
| Cliente | Nombre del contacto de la consulta; string | `<nombre>` | 0 / 134 / no | `lead.contact_name:string` | Cada consulta crea un Lead; conservar como dato del Lead y vincular opcionalmente a Cliente sin fusión automática |
| Comunicación | Canal por el que se estableció la comunicación; string | `<canal>` | 66 / 2 / no | `lead.communication_channel:string?` | Independiente de `Contacto con WM`; conservar el valor histórico y los vacíos como desconocidos, sin inferirlos. El catálogo futuro queda pendiente. |
| Agente | Responsable; string | `<agente>` | 0 / 5 / no | `lead.owner_legacy:string` | Incluir solo variantes normalizadas `Ana Lu`/`Analu`; demás filas `agent_out_of_scope` según DEC-087 |
| Status | Estado comercial; string | `<estado>` | 0 / 5 / no | `lead.status:enum` | Lote histórico: `Venta`/`VENTA`→`Vendido`; `Lead`→`Cancelado`; `Cancelado` permanece; `Cotización enviada` queda fuera por DEC-087 |
| Acción | Acción/contexto histórico; string | `<acción>` | 1 / 10 / no | `lead.legacy_action_context:string?` | En el lote histórico actual no crea Tarea pendiente; conservar solo como contexto legado |
| Fecha de solicitud | Ingreso del lead; datetime | `<2026-01-15>` | 16 / 105 / no | `lead.received_on:date` + `lead.received_date_status` | Si falta en histórico: `unknown_historical`, sin inferir otra fecha ni calcular métricas dependientes; nuevos Leads la registran automáticamente |
| Fecha de envío | Envío de cotización; datetime | `<2026-01-17>` | 24 / 96 / no | `quote.sent_on:date?` + `quote_sent_status` | En lote histórico actual: nulo significa `confirmed_unknown_historical`, no cotización ausente; para datos nuevos se registra automáticamente |
| Fecha Acción | Fecha calculada de acción | `<2026-01-22>` | 0 / 97 / 156 fórmulas | Ninguno en el lote histórico actual | Las fechas ficticias de 1900 se descartan; no se crea una Tarea pendiente |
| Tiempo de envío | Días entre solicitud y envío de cotización; integer | `<2>` | 0 / 33 / 156 fórmulas | `lead.quote_response_days:integer?` | Calcular y cargar solo cuando `Fecha de solicitud` y `Fecha de envío` existen; en otro caso queda vacío/no medible. Nunca exportar la fórmula. |
| Celular | Teléfono de contacto; integer/string | `<teléfono>` | 31 / 90 / no | `lead.contact_phone:string` | Normalizar como texto; usar como evidencia de vínculo a Cliente, sin fusionar automáticamente |
| Correo | Email de contacto; string | `<correo>` | 50 / 71 / no | `lead.contact_email:string` | Trim/casefold para matching; conservar original y no fusionar automáticamente |
| País | País de residencia actual del contacto; string | `<país>` | 0 / 12 / no | `lead.contact_country` | No representa nacionalidad ni destino. Normalizar catálogo; conservar como dato del Lead y no sobrescribir un Cliente sin una acción explícita. |
| Tipo de venta | Motivo o necesidad principal inicial de la consulta; string | `<tipo>` | 0 / 29 / no | `lead.travel_type_id` | Clasificación general y rápida del Lead, no itinerario ni composición de Servicios/Reservas. Normalizar variantes contra catálogo. |
| Destino | Resumen libre del destino o intención solicitada inicialmente; string | `<destino>` | 1 / 56 / no | `lead.destination_summary` | Puede contener uno o varios destinos, una región o una intención aún por definir. No forzar enum ni convertirlo en itinerario o reserva. |
| Pax | Total de pasajeros derivado; integer | `<4>` | 0 / 15 / 156 fórmulas | `trip.traveler_count` | Validar contra `Adultos`+`Niños`; el perfil actual no presenta diferencias calculables. Cualquier diferencia futura se reporta antes de migrar, con `source_row`, sin corregir ni inferir. |
| Adultos | Adultos; integer | `<2>` | 2 / 13 / no | `trip.adult_count` | Validar ≥0 y contrastar con la fórmula de `Pax`; una diferencia genera advertencia previa a migración. |
| Niños | Menores; integer | `<2>` | 15 / 5 / no | `trip.child_count` | Validar ≥0 y contrastar con la fórmula de `Pax`; una diferencia genera advertencia previa a migración. |
| Fecha inicio viaje | Inicio solicitado; datetime | `<2026-07-01>` | 12 / 115 / no | `lead.requested_start_on:date` | Conservar como solicitud original; nulo solo con `fechas_por_definir` |
| Fecha fin viaje | Fin solicitado; datetime | `<2026-07-08>` | 13 / 110 / no | `lead.requested_end_on:date` | Conservar como solicitud original; nulo solo con `fechas_por_definir` |
| # Noches | Duración; integer | `<7>` | 0 / 24 / 156 fórmulas | Métrica derivada | Cargar el resultado numérico evaluado cuando proviene de fórmula, o el valor numérico fijo si existe; nunca exportar la expresión de Excel. |
| Moneda | Moneda de los importes comerciales del Lead; string | `<USD>` | 5 / 3 / no | `lead.currency_code` | ISO-4217; normalizar variantes. Cuatro vacíos históricos pertenecen a `Cancelado` y se aceptan sin moneda; el vacío restante debe completarse antes del CSV final. Un Lead `Vendido` siempre exige moneda. |
| Presupuesto | Presupuesto comunicado por el cliente para esa consulta; número/decimal | `<importe>` | 44 / 50 / 3 fórmulas | `lead.budget_amount:decimal?` | Cargar el resultado numérico de una fórmula o el valor fijo, nunca la fórmula; los vacíos históricos permanecen vacíos. Usar la moneda del Lead. Conserva el contexto comercial histórico del proyecto. |
| Cotización | Importe histórico cotizado al cliente; número/texto | `<importe>` | 21 / 130 / 12 fórmulas | `quote.quoted_amount:decimal` | Usa la moneda del Lead. Puede reflejar una cotización ajustada, pero el Excel no demuestra versiones: conservar un único importe histórico sin reconstruir revisiones. Seis valores de texto requieren reporte de conversión. |
| Comisión proyectada | Comisión bruta estimada al 100%; número | `<importe>` | 20 / 131 / 24 fórmulas | `lead.expected_commission_gross_amount` | Es la base de cálculo. Conservar el valor histórico y su moneda. |
| Comisión @ 80% | Participación esperada de la agencia; número | `<importe>` | 0 / 133 / 148 fórmulas | `lead.expected_commission_net_amount` | Las 148 fórmulas se recalculan desde la comisión al 100% y la participación. Las 8 celdas sin fórmula se inspeccionan por `source_row` después del filtro de agente: si son importes fijos, se conservan como excepción histórica con procedencia, sin recálculo. |
| Contacto con WM | Origen de adquisición: cómo conoció a World Memories; string | `<canal-origen>` | 5 / 18 / no | `lead.acquisition_source` | Independiente de `Comunicación`; normalizar contra el catálogo de orígenes. Puede coincidir textualmente con el canal de comunicación. |
| Notas | Contexto operativo libre de la consulta; string/integer | `<nota anonimizada>` | 77 / 58 / no | `note.body` vinculada al Lead | Importar solo las no vacías, convertidas a string y con `source_row`; restringir logs/exportaciones. No interpretar texto para crear Tareas, estados ni campos estructurados. |
| ID | Identificador calculado; string | `<id legado>` | 0 / 149 / 156 fórmulas | `lead.legacy_lead_id` | Conservar intacto; cada fila recibe `lead_id` nuevo y único, con trazabilidad de fila fuente |
| Concepto | Tipo fijo del registro; string | `<Lead>` | 0 / 1 / 156 fórmulas | Metadato de importación | No necesita persistirse si el archivo ya define entidad |

## Hoja `Ventas` — tabla `Ventas` (224 filas en la entrega actual)

| Columna original | Significado inferido / tipo detectado | Ejemplo anon. | Nulos / distintos / fórmula | Destino propuesto | Transformación, problema y validación |
|---|---|---|---|---|---|
| ID | Vínculo legado al viaje/lead; string | `<id legado>` | 0 / 109 / no | `service.legacy_lead_id` + `service.trip_id` + `trip_lead` | Conservar intacto; cada fila recibe `service_id` y `source_row`; resolver el Viaje con evidencia independiente. Un Viaje puede vincular varios Leads, por lo que no se fuerza un único `service.lead_id` |
| Agente | Copia desde Leads; string | `<agente>` | 0 / 5 / 224 fórmulas | Relación derivada | No duplicar; resolver vía Lead/Viaje |
| Status | Seguimiento de comisión; string | `<estado>` | 0 / 4 / no | `commission.status` + `commission.legacy_status_context` | `Comisión pagada`→`Pagada` con fecha real desconocida; `Tracking form - Ok`→`Pendiente` + `tracking_registered`; `Where is my Commission`→`Pendiente` + `collection_follow_up`; `Clientes por viajar`→Servicio `Vendido`, Comisión `Pendiente` + `trip_not_completed`. Nunca altera un Servicio vendido ni inventa pago. |
| Persona titular | Contacto del Lead o titular de Reserva; string | `<nombre>` | 0 / 94 / 223 fórmulas | Relación derivada / `service.reservation_holder_name` | Las fórmulas son contexto del Lead. La única fila manual es el titular de esa Reserva, puede diferir del contacto del Lead y no altera `client_id`. |
| Tipo de venta | Categoría del Servicio/Reserva; string | `<tipo>` | 0 / 16 / no | `service.type_id` | Catálogo configurable de Servicios; es distinto de `lead.travel_type_id` y puede diferir de la intención inicial |
| Destino | Destino copiado/ajustado; string | `<destino>` | 0 / 53 / 212 fórmulas | `service.destination` | Las 12 filas manuales son destino efectivo del Servicio/Reserva y tienen prioridad; las fórmulas son contexto heredado del Lead |
| Pax | Total; integer | `<4>` | 0 / 11 / 222 fórmulas | `trip.traveler_count` | Copia histórica del total de Viaje; no se exige que coincida con el desglose de una Reserva que cubre solo un subconjunto |
| Adultos | Adultos; integer | `<2>` | 0 / 11 / 220 fórmulas | `service.adult_count?` + alcance | Fórmula: contexto histórico del Viaje. Valor manual: puede ser subconjunto del Servicio/Reserva |
| Niños | Menores; integer | `<2>` | 0 / 5 / 220 fórmulas | `service.child_count?` + alcance | Fórmula: contexto histórico del Viaje. Valor manual: puede ser subconjunto del Servicio/Reserva |
| Fecha inicio viaje | Inicio del servicio/reserva; datetime | `<2026-07-01>` | 0 / 152 / no | `service.start_on` | Cambia dentro de 42 viajes; fuente de fecha general pendiente |
| Fecha fin viaje | Fin del servicio/reserva; datetime | `<2026-07-08>` | 0 / 145 / no | `service.end_on` | Cambia dentro de 41 viajes; fuente de fecha general pendiente |
| # Noches | Duración; integer | `<7>` | 0 / 16 / 223 fórmulas | `service.duration_value` + `service.duration_unit` | Recalcular 223 fórmulas como `nights`; preservar el único valor fijo de renta de auto como `6 service_days`, no como noches |
| Proveedor | Proveedor del componente histórico; string | `<proveedor>` | 0 / 15 / no | `service_provider.provider_id` | Cada fila crea un componente de Proveedor. Durante la carga inicial, crear Proveedores desde valores históricos distintos con procedencia. `DROP DOWNS` es referencia auxiliar; la limpieza y consolidación se hace después de importar. No agrupar filas en una Reserva por coincidencia de Cliente o Viaje. |
| Moneda | Moneda efectiva del componente del Proveedor; string | `<USD>` | 0 / 2 / 200 fórmulas | `service_provider.currency_code` | Las 224 filas tienen código de tres caracteres. En datos nuevos debe elegirse explícitamente entre las monedas permitidas del Proveedor antes de guardar el importe; nunca se asigna automáticamente. |
| Costo final | Importe cobrado al cliente por fila histórica; número/texto | `<importe>` | 4 / 210 / no | `service_provider.sale_amount:decimal` + estado de calidad | Cuatro vacíos se importan como `unknown_historical`; el texto no convertible se reporta para corrección antes del CSV final. Nunca se convierte a cero |
| Comisión 100% | Comisión bruta; número | `<importe>` | 5 / 208 / 7 fórmulas | `commission.gross_amount` + estado de calidad | Conservar el importe histórico o recalcular sus 7 fórmulas; los cinco vacíos se importan como `unknown_historical`, sin asumir `sin comisión` ni cero |
| Comisión 80% | Participación agencia/agente; número | `<importe>` | 0 / 208 / 214 fórmulas | `commission.net_expected_amount` | Recalcular las 214 fórmulas desde bruto × participación; preservar los 10 valores fijos como excepciones históricas con procedencia, bloqueando solo un valor vacío o no numérico |
| Comisión 100% USD | Conversión bruta; número | `<importe USD>` | 0 / 208 / 201 fórmulas | Métrica/reporting | Guardar tasa y fecha; no reemplazar original |
| Comisión 80% USD | Conversión neta; número/texto | `<importe USD>` | 0 / 212 / 136 fórmulas | Métrica/reporting | Tres textos numéricos se normalizan; no se conserva la fórmula |
| # de itinerario | Número de reservación emitido por la plataforma; integer/string | `<localizador>` | 4 / 212 / no | `service_provider.booking_reference:string` | Pertenece a ese componente de Proveedor. Puede estar vacío si todavía no existe una reserva; preservar como texto. |
| Tracking Form # | Identificador oficial de plataforma para seguimiento de Comisión; integer/string | `<tracking>` | 6 / 166 / no | `commission.tracking_reference:string` | Se genera al subir el formulario o *commission report*; puede existir con Comisión pendiente y se preserva como texto. |
| Fecha de pago (tarjeta cliente) | Día efectivo de pago en plataforma con tarjeta del cliente; datetime | `<2026-06-15>` | 4 / 144 / no | `service_provider.customer_card_paid_on` | Pago histórico real de ese componente de Proveedor. No es fecha administrativa ni de Comisión. |
| Pago de Comisión | Fecha esperada/límite; datetime | `<2026-10-06>` | 0 / 141 / 213 fórmulas | `commission.due_on` | No es la fecha real de pago; recalcular las fórmulas según plazo y preservar las 11 fechas fijas como overrides históricos, sin sustituirlas silenciosamente |
| Concepto | Tipo fijo; string | `<Venta>` | 0 / 1 / 223 fórmulas | Metadato de importación | No persistir ni exportar: es redundante porque la hoja ya identifica la entidad como Venta. |
| notas | Contexto operativo histórico del componente; string | `<nota>` | 196 / 19 / no | `note.body` vinculada a `service_provider` | Importar solo las no vacías con `source_row`. No interpretar texto ni modificar automáticamente estados, fechas, importes, Comisiones, Tareas o relaciones. |

El libro fuente conserva montos históricos de comisión bruta y participación. Para datos nuevos, `commission.gross_amount` es el valor canónico por Proveedor dentro de Servicio/Reserva. El Proveedor define si el importe se captura como monto variable en el Servicio o se calcula desde un porcentaje fijo configurado en el Proveedor y su propio `service_provider.sale_amount`. La participación de agencia se deriva desde una configuración individual e independiente del modo de comisión.

El libro no aporta una columna confirmada de monto neto real recibido. Para datos nuevos, se conserva separado de `commission.net_expected_amount` y cada uno conserva su propia moneda. Al registrar el pago, el monto recibido es el valor canónico para reportes de cobros, incluso si difiere del esperado. Si las monedas coinciden, la diferencia se deriva automáticamente; si difieren, el CRM no solicita una tasa por pago y conserva los importes separados en esta etapa. La tasa editable de referencia del Viaje aplica a cotización y planeación de Servicios. Cada Comisión la sigue como tasa de proyección mientras conserve el origen `trip_reference`; un override manual cambia el origen a `commission_override` y fija una tasa propia sin modificar el Viaje. La acción explícita `Volver a usar la tasa del Viaje` elimina el override y restaura el seguimiento. Esta proyección no sustituye el monto real.

## Hoja `Datos Clientes` — tabla `Table3` (47 filas)

| Columna original | Tipo / nulos | Ejemplo anon. | Destino propuesto | Tratamiento |
|---|---|---|---|---|
| Nombre Completo | string / 0 | `<nombre>` | `client.display_name` | Crear un Cliente por fila; conservar valor y `source_row` sin deduplicar. |
| Pais | string / 4 | `<país>` | `client.country_raw` | Conservar literal histórico; no normalizar ni completar desde Leads. |
| Ciudad | string / 4 | `<ciudad>` | `client.city` | Conservar literal histórico; no normalizar ni completar desde Leads. |
| Celular | string/integer / 18 | `<teléfono>` | `client.phone_raw` | Convertir a texto para conservar el valor fuente; no deduplicar ni validar contra Leads durante la carga. |
| Email | string / 8 | `<correo>` | `client.email_raw` | Conservar literal histórico; no validar, corregir ni vincular durante la carga. |
| Dirección | string / 17 | `<dirección>` | `client.address` | Conservar el valor histórico sin enriquecerlo. |
| Cuenta Disney | string / 2 | `<dato de cuenta>` | `client.service_account.identifier` | Conservar como identificador de cuenta de servicio del Cliente, separado del Lead. |
| Contraseña app disney | string / 5 | `<secreto>` | Ninguno | Excluida del modelo y CSV operativo; no se copia a la documentación ni al CRM. |
| Personaje fav | string / 40 | `<preferencia>` | `client.preferences.favorite_character` | Conservar valor histórico literal. |
| Fecha de nacimiento | datetime/string / 40 | `<fecha ISO>` | `client.birth_date_raw` | Conservar valor fuente sin inferir ni completar; la normalización se decide después de migrar. |

## Catálogo de proveedores — `DROP DOWNS.Table6` (14 filas)

| Columna | Tipo / nulos | Destino | Tratamiento |
|---|---|---|---|
| Proveedor | string / 0 | `provider.name` | Crear `provider_id`; 14 valores únicos |
| Moneda | string / 1 | `provider.allowed_currency_codes` | ISO-4217; uno o varios valores permitidos por Proveedor, detectados inicialmente desde el histórico. La moneda efectiva se elige por componente de Servicio/Reserva. |
| % Comisión | número / 7 | `provider.default_commission_rate` | Convertir a decimal; permitir excepción por servicio |

La tabla es referencia auxiliar. El lote inicial crea Proveedores desde `Ventas.Proveedor`; usa moneda y porcentaje de `DROP DOWNS` solo cuando el nombre corresponde exactamente y el valor existe. Los valores históricos por fila mantienen prioridad; no se consolidan nombres similares de forma automática. En particular, `InterCruises` e `International Cruises` son Proveedores distintos (DEC-123).

## Otras listas de `DROP DOWNS`

| Rango/origen | Contenido observado | Destino/tratamiento |
|---|---|---|
| `Tipo de Venta` | 16 tipos, incluidos Hotel, Crucero, Renta auto y Renta Carriola/Silla de ruedas | Semilla del catálogo configurable de `lead.travel_type_id` y `service.type_id`; no sustituye el valor histórico por fila. |
| Monedas globales | USD, MXN, EUR | Candidatos del catálogo global de monedas. El histórico de Ventas usa USD/MXN; EUR queda disponible para habilitación configurada, sin asignarlo a Proveedores por inferencia. |
| Lista de acciones | Seguimiento, cotización, llamada, viaje, pagos, cancelación y fechas | Referencia histórica de acciones; no se migra como estado ni plantilla automática sin una decisión de flujo específica. |
| `Status venta` | Estados de Comisión, tracking, viaje y cancelación mezclados | Referencia de normalización histórica; el CRM usa los estados y contextos aprobados en DEC-103 y DEC-104. |
| `Contacto con WM` | Lista incompleta de origen | Referencia auxiliar; no restringe el catálogo de adquisición aprobado. |
| Secuencia 0–10, `TODAY()`, `Conceptos` | Ayudas de Excel y metadatos `Venta`/`Inversión`/`Lead` | No se importan como datos transaccionales ni automatizaciones. |

## Fuente histórica excluida — `PTC Evolution` (24 filas)

| Columna | Tipo detectado | Ejemplo anon. | Destino propuesto | Problema/transformación |
|---|---|---|---|---|
| Todas las columnas | Fechas, pasajero, comisión y referencias | No importar ni conciliar | Fuente confirmada como desactualizada |

## Fuentes secundarias/administrativas

| Hoja | Columnas principales | Tratamiento propuesto | Estado |
|---|---|---|---|
| Hoja1 | ID, Status, titular, tipo, destino, fechas, proveedor, moneda, costo y comisiones | No importar; conservar solo como referencia histórica fuera del CRM operativo | Excluida por decisión del usuario |
| Inversiones | Fecha de pago, descripción, monto, status, agente, ID, concepto | No importar al CRM inicial | Excluida por decisión del usuario |
| Cuentas Banco | Fecha, cobro, depósitos, intereses, gastos, total | No importar al CRM inicial; información financiera sensible | Excluida por decisión del usuario |
| Wish list | Concepto, monto y bloques personales | No importar | Excluir |
| REFERIDOS PALACE | Hotel, titular, ingreso/salida, noches, precio, programa | Fuente futura `referral`/`service`; actualmente sin filas | Pendiente |
| REGINA RRSS | Fecha, USD, MXN, tipo de cambio, detalle, notas | No importar al CRM inicial | Excluida por decisión del usuario |
| Usuarios | Plataforma, descripción, usuario, contraseña, contactos, notas | **No importar; rotar secretos y usar gestor** | Riesgo crítico |
| GASTOS WM ANALU | Fecha, concepto, monto y bloques laterales | No importar al CRM inicial | Excluida por decisión del usuario |
| Certificaciones | Partner, descripción, agente, status, fecha, %, certificación | Módulo futuro; sin registros actuales | Pendiente |

La revisión integral confirma DEC-125: estas hojas no producen archivos CSV en la migración inicial.

## Hojas derivadas que no son fuente de datos

- `TEMPLATE`: descartada al 100 % por DEC-082; no es fuente de datos ni de reglas.
- `Detail1`: extracto de `Ventas`/tabla dinámica.
- `PnL`: reporte y cálculos derivados.

Estas hojas se reconstruirán como vistas o reportes; no se convertirán a entidades CSV.

## Validaciones pendientes con el usuario

1. Reglas y transiciones reales de calificación de Lead.
2. Campos personales realmente necesarios en Clientes.

Durante la importación, las coincidencias posibles de Cliente por nombre, correo o teléfono normalizados se presentan para revisión. La usuaria decide si fusiona con el Cliente sugerido o crea un Cliente independiente; no se realiza ninguna fusión automática.
