# PRD vivo — CRM para agencia de viajes

## Estado del documento

- **Madurez:** alcance de Fase E aprobado, versión 0.3.
- **Fuente:** contexto inicial, análisis aprobado del Excel, proceso comercial validado, decisiones de dominio y mapa consolidado de pantallas.
- **Aprobación para implementar:** concedida formalmente el 25 de agosto de 2026. La implementación sigue el plan de oleadas y revisiones independientes en `docs/superpowers/plans/2026-08-25-world-memories-mvp.md`; publicación y migración real requieren autorización específica posterior.
- **Aprobación de alcance:** concedida formalmente el 2026-08-25; Fase E cerrada conforme DEC-167.

## Problema

**Confirmado como contexto inicial:** la operación actual usa un Excel con muchas pestañas y procesos manuales. La información de leads, clientes, viajes, proveedores, comisiones, fechas y seguimientos queda fragmentada; existe recaptura, poca visibilidad transversal y riesgo de olvidar acciones o cobros.

**Pendiente:** cuantificar frecuencia, volumen, tiempo perdido, errores y consecuencias para establecer una línea base.

## Usuarios

- **Confirmado como contexto inicial:** una persona operará la primera versión.
- **Propuesto a futuro:** administrador, asesor de viajes, asistente operativo y finanzas, con permisos diferenciados.
- **Pendiente:** identificar al usuario principal, sus dispositivos, entorno, habilidades y necesidades de accesibilidad.

## Objetivos

- Centralizar el recorrido lead → seguimiento → conversión → viaje → proveedores/comisiones → cobro/cierre.
- Capturar datos una vez y reutilizarlos sin perder el historial.
- Mostrar prioridades, viajes y vencimientos de forma clara.
- Mantener los datos exportables, respaldables y restaurables.
- Validar un flujo end-to-end útil antes de ampliar módulos.
- Minimizar captura manual mediante defaults, datos derivados y eventos automáticos.
- Medir tiempos de respuesta, cotización, conversión y tareas desde un historial trazable.

## Evolución posterior propuesta

Después de estabilizar el CRM operativo, se podrá añadir un módulo de analytics para responder preguntas como cuántas familias han viajado, cuáles son los destinos más frecuentes, qué tipos de viaje se venden y qué tendencias pueden apoyar publicaciones y promoción. Este módulo se alimentará de datos operativos validados y quedará fuera del MVP actual.

## No objetivos preliminares

- **Fuera del MVP, para una evolución con base de datos:** multiusuario, sincronización entre dispositivos, backend remoto, automatizaciones externas, generador completo de documentos, almacenamiento de archivos adjuntos (PDF de cotización, confirmaciones y vouchers) y finanzas avanzadas.
- **Pendiente de validación futura:** historial de conversaciones e integraciones con WhatsApp/Instagram/correo.

## Proceso actual

**Confirmado como contexto inicial:** los leads reciben un código único; al convertir una venta, el código se copia manualmente a otra hoja para recuperar parte de la información. Otros pasos y excepciones todavía no están documentados.

**Confirmado por el Excel y el usuario:** `Leads` contiene 156 filas y 149 IDs distintos; cada consulta genera un Lead independiente desde el primer contacto, aunque no llegue a venta, y un Cliente puede tener múltiples Leads. `Ventas` contiene 223 filas y 108 IDs distintos, todos enlazables a Leads. Cada fila de `Ventas` representa un componente vendido de un Proveedor; varias filas del mismo Cliente o Viaje pueden ser servicios separados. El ID actual identifica el origen comercial, pero todavía requiere una regla para delimitar el Viaje cuando sus componentes tienen fechas distintas.

## Proceso deseado preliminar

1. Capturar o importar un lead.
2. Calificarlo y programar seguimiento.
3. Registrar cotización y cambios.
4. Convertirlo sin recaptura a cliente y viaje, conservando origen.
5. Gestionar pasajeros, servicios y proveedores.
6. Visualizar el viaje en calendario y ejecutar tareas.
7. Registrar comisiones y controlar cobro/cierre.
8. Exportar y restaurar los datos.

Este flujo es **propuesto** y requiere entrevista paso a paso.

## Alcance preliminar del primer MVP

**Propuesto por el contexto, pendiente de aprobación:** importación inicial o inicio vacío; alta/listado/filtros/edición de leads; próxima acción; conversión a cliente y viaje; edición del viaje; calendario básico; identidad visual; exportación completa y restauración.

## Módulos identificados

| Prioridad preliminar | Módulo | Estado |
|---|---|---|
| Alta | Leads y seguimiento | Propuesto |
| Alta | Clientes, viajes y conversión | Propuesto |
| Alta | Importación, exportación, respaldo y restauración | Propuesto |
| Alta | Calendario básico | Propuesto |
| Media | Tareas, alertas y dashboard | Propuesto posterior |
| Media | Proveedores, servicios y comisiones | Propuesto posterior; requiere base de datos desde el inicio |
| Baja | Finanzas avanzadas | Propuesto posterior |
| Baja | Notas rápidas | Propuesto posterior |
| Baja | Cotizaciones y documentos | Propuesto posterior |

## Casos de uso iniciales

- UC-001 Crear, editar, buscar y filtrar un lead.
- UC-002 Programar y completar la próxima acción de un lead.
- UC-003 Convertir un lead en cliente y viaje sin recapturar datos.
- UC-004 Crear un viaje adicional para un cliente existente.
- UC-005 Consultar viajes próximos y activos en calendario.
- UC-006 Importar datos con vista previa y reporte.
- UC-007 Exportar un respaldo completo y restaurarlo.
- UC-008 Registrar proveedores/servicios/comisiones cuando esa fase sea aprobada.

## Requisitos atómicos candidatos

Los siguientes son **propuestos** hasta validar datos y proceso:

- REQ-001 Cada lead, cliente y viaje usa un identificador único e independiente.
- REQ-002 Un cliente puede relacionarse con múltiples viajes.
- REQ-003 La conversión conserva el lead original y reutiliza los datos aplicables.
- REQ-004 Los campos específicos del viaje permanecen editables después de la conversión.
- REQ-005 Un viaje puede tener múltiples pasajeros, servicios, proveedores y comisiones.
- REQ-006 El estado comercial se modela separado del estado operativo.
- REQ-007 Se distinguen valor potencial, cotizado, vendido y comisión esperada. La importación histórica conserva un único importe cotizado disponible, con su moneda, sin reconstruir versiones o ajustes no demostrados por la fuente.
- REQ-008 USD y MXN son monedas iniciales. La tasa de referencia se configura manualmente y de forma editable por Viaje.
- REQ-009 Una comisión puede marcarse manualmente como pagada con fecha y monto real recibido, preservados separadamente de la fecha y monto esperados.
- REQ-010 La fecha esperada de comisión se calcula desde el fin efectivo del Viaje y el plazo configurable del Proveedor; el plazo máximo universal es +90 días calendario y un Proveedor solo puede definir un plazo igual o anterior. Si no existe fin efectivo, `commission.due_on` permanece vacía. Cada Comisión conserva el plazo configurado al crearla; cambios posteriores del Proveedor solo afectan Comisiones nuevas. Un plazo personalizado sigue siendo relativo y se recalcula al cambiar el Viaje; una fecha fija manual queda bloqueada hasta editarla.
- REQ-011 Importaciones no persisten hasta mostrar vista previa, errores y advertencias.
- REQ-012 La restauración preserva IDs, relaciones y versión del esquema.
- REQ-013 Los estados nunca se comunican solo mediante color.
- REQ-014 Los IDs actuales se preservan intactos como `legacy_*`; cada Lead y Servicio/Reserva usa una clave interna nueva que no depende de nombre, país o destino ni modifica el ID legado con sufijos.
- REQ-015 Ningún CSV, respaldo del dashboard o log contiene usuarios o contraseñas del libro.
- REQ-016 Cada fila importada de Leads y Ventas conserva trazabilidad a libro, hoja, fila y lote mediante `source_sheet`, `source_row` e `import_batch_id`.
- REQ-017 Toda fila fuente queda clasificada como importada, derivada, excluida o rechazada con causa.
- REQ-018 El Viaje calcula su inicio como el servicio más temprano y su fin como el servicio más tardío.
- REQ-019 El usuario puede aplicar overrides de fechas sin perder el intervalo calculado ni las fechas solicitadas del Lead.
- REQ-020 Crear, contactar, cotizar, cambiar estatus, convertir y completar/reprogramar tareas genera eventos automáticos con fecha/hora.
- REQ-021 Los hitos y tiempos comerciales se derivan del historial, no de campos manuales duplicados.
- REQ-022 Una actividad pasada puede registrarse con fecha efectiva distinta, conservando cuándo fue registrada.
- REQ-023 Los formularios usan captura mínima, defaults y divulgación progresiva; todo campo obligatorio debe justificarse.
- REQ-024 Una acción y su evento se persisten atómicamente.
- REQ-025 La captura de Lead muestra origen de adquisición, nombre, país, teléfono, correo, destino libre de la intención inicial, tipo de viaje principal general configurable y fechas o `fechas_por_definir`; `Referido por` aparece solo cuando el origen es `Referido`. Destino y tipo clasifican la solicitud inicial y no exigen detallar el itinerario, Servicios/Reservas ni Proveedores. Ningún campo manual bloquea el guardado inicial.
- REQ-026 Un Lead puede usar el estado explícito `fechas_por_definir`; el sistema no inventa fechas, duración ni eventos de calendario.
- REQ-027 Un Lead puede crearse directamente en `Contactado` cuando ya existió interacción inicial; `Nuevo` solo representa oportunidades sin contacto.
- REQ-028 La creación manual posterior a una interacción registra eventos de recepción y contacto, sin obligar a una transición artificial por `Nuevo`.
- REQ-029 `Negociación` se presenta como `Revisión/Ajustes` y `Ganado` como `Vendido`.
- REQ-030 `Cotización en preparación` se modela separado de `Cotización enviada` para distinguir la elaboración del envío al cliente.
- REQ-031 `Costo final` representa el importe cobrado al cliente por un Servicio/Reserva, totalizado por moneda; para datos nuevos se deriva de los importes de sus Proveedores y conceptos adicionales sin Proveedor. El costo al proveedor y la comisión se almacenan por separado.
- REQ-032 La comisión conserva fecha esperada/límite y fecha real de pago en campos separados; seleccionar la fecha real confirma el pago y registra ambas marcas temporales del evento.
- REQ-033 Al convertir un Lead, el sistema crea o vincula un expediente único de Cliente reutilizable. Un Lead puede vincularse a un Cliente existente cuando se identifica antes de la conversión.
- REQ-034 La administración de Cliente permite ampliar contactos, preferencias, datos operativos y cuentas de servicios sin sobrecargar la captura inicial del Lead. Las contraseñas se manejan fuera del CRM y no forman parte de importaciones, respaldos ni exportaciones.
- REQ-035 Al abrir un Lead vinculado se puede navegar al perfil de Cliente; un Lead no vinculado conserva su detalle y ofrece una acción explícita para crear o vincular el Cliente.
- REQ-036 El perfil de Cliente/Familia incluye una Nota útil enriquecida con negritas, listas y checklist para datos familiares no estructurados. Los checks no crean tareas ni alertas automáticamente.
- REQ-037 Nombre, país de residencia, correo, teléfono, dirección, tipo de viaje, moneda, fechas, adultos, niños, total de personas y presupuesto están disponibles en su entidad correspondiente; el país de residencia del Lead no se interpreta como nacionalidad ni destino, ni actualiza un Cliente automáticamente. Presupuesto, moneda, tipo de viaje y cantidades son datos estructurados de la oportunidad/viaje y pueden alimentar filtros, cotización y funnel. El campo de presupuesto siempre está disponible, pero su valor puede faltar en la captura inicial y permanecer vacío incluso al cotizar o marcar el Lead `Vendido`.
- REQ-038 La misma pantalla de Lead permite captura rápida o completa; el modo completo despliega los detalles disponibles de cotización sin obligar al usuario a registrar el Lead y volver a otra etapa.
- REQ-039 El tipo de viaje usa un catálogo configurable con los valores iniciales aprobados; puede quedar vacío en un Lead con información incompleta.
- REQ-040 Cada Lead usa un único tipo de viaje principal para clasificación comercial; los extras, servicios y adicionales se registran separadamente en la cotización o Viaje.
- REQ-041 El origen de adquisición usa un catálogo configurable con `Friends & Family`, `Facebook`, `Referido`, `WhatsApp`, `Instagram`, `Viaje personal` y `Cliente`; `Referido por` se solicita solo para `Referido`. El canal de comunicación es un dato independiente y no se deduce del origen.
- REQ-042 Un Servicio/Reserva puede incluir uno o varios Proveedores. Cada Proveedor se configura con modo de comisión bruta `porcentaje fijo` o `monto variable por servicio`; la comisión se gestiona individualmente por Proveedor dentro del Servicio y no depende del tipo de viaje ni del canal.
- REQ-043 La configuración de cada Proveedor define la participación de la agencia sobre la comisión bruta, inicialmente 80% o 100%; el sistema calcula automáticamente el monto neto esperado para ese Proveedor.
- REQ-044 Para Proveedores con participación al 100%, el monto neto esperado equivale a la comisión bruta y no requiere una segunda captura manual. El importe final aplicable solo se usa como base cuando el Proveedor está configurado con porcentaje fijo.
- REQ-045 Para un Proveedor configurado con porcentaje fijo, el sistema calcula la comisión bruta desde el porcentaje configurado en el Proveedor y el importe final de ese Proveedor dentro del Servicio, conservando ambos como snapshot. El porcentaje se administra en el Proveedor, no se recaptura por Servicio.
- REQ-046 El sistema conserva el monto neto esperado y el monto real recibido de comisión; al registrar el único pago, la Comisión queda `Pagada` aunque difieran. Para cobros y reportes, el monto real recibido es el valor canónico; cuando comparten moneda, la diferencia se calcula sin recaptura manual.
- REQ-047 El monto real recibido puede usar una moneda distinta de la esperada. El sistema conserva ambas monedas y no muestra una diferencia numérica sin conversión explícita y trazable.
- REQ-048 El registro de pago no solicita una tasa de cambio manual por comisión. El dashboard inicial muestra y totaliza los montos de monedas distintas por separado; una consolidación futura requiere una regla de conversión explícitamente aprobada.
- REQ-049 Cada Comisión admite un único pago real en el alcance inicial; los pagos parciales quedan fuera de alcance.
- REQ-050 Si el monto real difiere del esperado, el sistema muestra una advertencia y ofrece confirmar la diferencia —guardando ambos y marcando `Pagada`— o regresar a corregir antes de cerrar.
- REQ-051 La diferencia puede conservar una nota opcional de texto libre e independiente; omitirla no bloquea el pago y retirarla posteriormente no cambia la lógica central de Comisión.
- REQ-052 Un Proveedor dentro de un Servicio/Reserva sin comisión se marca explícitamente como `Sin comisión`; no se crea una Comisión vacía y los reportes lo distinguen de una comisión pendiente. El motivo no se captura ni monitorea en esta etapa.
- REQ-053 Un Proveedor de servicio marcado como `Sin comisión` puede pasar posteriormente a `Con comisión`; la usuaria confirma la transición y crea la Comisión manualmente.
- REQ-054 Todo Proveedor agregado a un Servicio/Reserva inicia como `Con comisión`; `Sin comisión` solo se aplica por una acción explícita de la usuaria.
- REQ-055 Los totales de un Servicio/Reserva se derivan agrupando por moneda sus importes por Proveedor y conceptos adicionales sin Proveedor. Los conceptos adicionales no generan comisión por sí mismos y, inicialmente, requieren nombre, importe y moneda. Los importes originales se conservan siempre.
- REQ-056 Un Viaje puede tener una tasa de cambio única, editable y explícita para generar totales de referencia en la moneda de cotización al cliente. La tasa muestra siempre su par y dirección, por ejemplo `1 USD = 18.50 MXN`; recalcula automáticamente durante la preparación, queda congelada al marcar `Vendido` y cualquier cambio posterior exige confirmación explícita. El historial conserva valor anterior, valor nuevo, fecha/hora y usuario; el motivo es opcional. La conversión no reemplaza importes originales ni define todavía el ajuste de comisiones al tipo de cambio real.
- REQ-057 Cada Comisión inicializa su tasa de proyección desde el Viaje y sigue sus cambios mientras conserve el origen `trip_reference`. El primer override manual cambia el origen a `commission_override` y fija una tasa independiente para esa Comisión. La acción explícita `Volver a usar la tasa del Viaje` elimina el override, restaura el origen `trip_reference` y registra el cambio. La proyección conserva par, tasa y origen, y no modifica la tasa del Viaje, otras Comisiones, el monto esperado original ni el pago real.
- REQ-058 La importación histórica detecta posibles duplicados de Cliente por nombre, correo y teléfono normalizados, sin fusionarlos automáticamente. Para cada sugerencia, la usuaria puede confirmar una fusión con el Cliente existente o crear un Cliente independiente. Los candidatos no revisados no bloquean la primera importación: se crean como Clientes independientes y quedan marcados para revisión posterior. La decisión y los candidatos no resueltos quedan trazables en el reporte del lote.
- REQ-059 `Pausado` representa una oportunidad temporalmente detenida y `Cancelado` una oportunidad terminada sin venta. Ambos solo se reactivan mediante una acción explícita de la usuaria hacia `Seguimiento` o `Revisión/Ajustes`; fechas, alertas y reglas no cambian el estado automáticamente. Cada cambio conserva el historial del estado y su fecha/hora.
- REQ-060 Al cambiar un Lead a `Pausado`, el sistema sugiere una próxima tarea o recordatorio opcional. Descartar la sugerencia permite guardar el cambio de estado sin tarea; no se crean tareas automáticamente.
- REQ-061 Al cambiar un Lead a `Cancelado`, el sistema permite seleccionar una categoría principal de motivo desde un catálogo configurable y añadir una nota libre opcional, sin bloquear el cierre. Si la categoría no existe, la usuaria puede crearla en el mismo flujo y reutilizarla después.
- REQ-062 Después de `Cotización enviada`, la usuaria puede mover manualmente el Lead a `Seguimiento`; el sistema registra automáticamente la fecha/hora y el evento de actividad, sin exigir una acción separada ni una fecha manual.
- REQ-063 Cada Viaje tiene una sola nota de trabajo enriquecida para avances y pendientes, sin cambiar el estado ni crear una entidad de avance parcial. Puede contener múltiples fechas, asuntos y bloques con títulos, subtítulos, negritas, listas y checklist; `Insertar fecha` abre un calendario para elegir e insertar la fecha exacta. Su contenido no genera métricas o tareas automáticamente.
- REQ-064 El expediente abierto de Cliente/Familia ofrece un único `Guardar cambios` para confirmar las modificaciones realizadas en el Cliente, Viaje, Proveedores, importes y notas del contexto. Si solo cambia una nota, el mismo botón la guarda; la operación confirma todo el conjunto de forma consistente o no confirma cambios parciales.
- REQ-065 Si se intenta cerrar el expediente con cambios sin guardar, el sistema ofrece `Guardar`, `Salir sin guardar` y `Cancelar`.
- REQ-066 Después de un guardado exitoso, el sistema muestra un toast breve de aproximadamente cinco segundos, devuelve el botón a su estado normal y muestra en el Cliente/Viaje `Última vez guardado` en formato corto —por ejemplo, `Hoy, 3:42 p. m.`— con el detalle completo al pasar el cursor.

## Modelo conceptual candidato

Lead, Cliente, Viaje/Oportunidad, Pasajero, Proveedor, Servicio/Reserva, Proveedor de servicio, Concepto adicional de servicio, Comisión, Tarea, Nota y Evento de actividad son entidades distintas en el MVP. `Documento` queda como entidad de evolución futura: el MVP registra el hito de envío de cotización, pero no guarda el PDF, confirmaciones ni vouchers. **Confirmado:** cada fila de `Ventas` es un componente de Proveedor; varias filas pueden pertenecer al mismo Viaje sin convertirse automáticamente en una sola Reserva. El Viaje usa el intervalo mínimo/máximo de componentes/servicios con override manual y conserva las fechas solicitadas del Lead. Véase `DATA_MODEL.md`.

## Reglas y preguntas críticas pendientes

- Definir las reglas y transiciones reales de calificación de Lead.
- Formato de las nuevas claves internas.
- Detección, revisión y fusión de duplicados.
- Diferencia entre oportunidad, cotización, venta, reserva y viaje.
- Cálculos de potencial, probabilidad, esfuerzo, ventas y comisiones.
- Excepciones por proveedor a la regla de 90 días.
- Fechas sin zona horaria frente a instantes de actividad.
- Moneda base, tasas, redondeos y reportes multimoneda.
- Política de archivo, borrado, auditoría y retención.
- Datos personales/documentales permitidos.

## Criterios de aceptación

Se redactarán de forma verificable después de validar cada caso de uso. Ningún criterio de este borrador autoriza implementación. La trazabilidad se mantendrá en `VERIFIER.md`.

## Riesgos y dependencias

- Dependencia inmediata de los Excel actuales y del conocimiento del usuario.
- Pérdida o exposición de datos locales y respaldos.
- Alcance excesivo si se confunde la visión completa con el MVP.
- Reglas ocultas en fórmulas, convenciones y memoria operativa.
- Credenciales en texto plano dentro del libro; deben rotarse y excluirse.
- Colisiones del ID de Lead y ambigüedad del grano de Ventas.
- Complejidad de duplicados, monedas, fechas y relaciones durante migración.
- Evolución futura a multiusuario puede exigir rediseño si los límites de datos no se definen bien.

## Métricas de éxito candidatas

- Menos recaptura y menos herramientas/pestañas para completar el flujo.
- Seguimientos y comisiones vencidas visibles y accionables.
- Tiempo de captura/conversión menor que la línea base.
- Restauración de respaldo exitosa y verificable.
- Uso diario sostenido por el usuario principal.

Las metas numéricas están **pendientes** de línea base.

## Fases

A) orientación e inventario; B) Excel y datos; C) proceso actual; D) dominio y reglas; E) MVP; F) arquitectura; G) aprobación; después, implementación incremental.

## Decisiones confirmadas

- No programar antes de completar descubrimiento y recibir aprobación explícita.
- Preservar los Excel originales y anonimizar la evidencia.
- Transformar por capas, manteniendo el XLSX original inmutable y trazable.

## Glosario preliminar

- **Lead:** oportunidad/contacto antes de una conversión validada.
- **Cliente:** persona o contacto consolidado que puede tener varios viajes.
- **Viaje:** experiencia concreta asociada a un cliente; frontera exacta pendiente.
- **Servicio:** componente adquirido o reservado dentro de un viaje.
- **Comisión:** ingreso esperado/recibido asociado a proveedor o servicio.
- REQ-067 `Clientes/Familias` muestra el historial resumido de Viajes; seleccionar un Viaje abre su expediente enfocado.
- REQ-068 `Viajes activos` muestra una lista operativa transversal y abre el mismo expediente enfocado, sin duplicar Viaje ni lógica.
- REQ-069 Cliente/Familia permite registrar contacto principal y demás viajeros, todos con fecha de nacimiento y edad vigente derivada en años y meses.
- REQ-070 La edad no se captura manualmente ni se persiste como dato fijo; se deriva de fecha de nacimiento y fecha de consulta. Otros campos estructurados de Pasajero quedan en backlog.
- REQ-071 Cliente/Familia muestra un resumen simple de miembros: nombre, fecha de nacimiento y edad dinámica. No existe expediente individual de viajero en el MVP.
- REQ-072 Cada Viaje exige un contacto principal y permite seleccionar explícitamente, desde la lista de miembros del Cliente/Familia, cuáles viajeros participan. Un miembro puede estar registrado sin participar en todos los Viajes.
- REQ-073 El respaldo manual completo se descarga como paquete JSON versionado con configuración y datos; la exportación operativa se descarga como paquete Excel. Ninguno incluye contraseñas.
- REQ-074 El sistema registra la fecha/hora de un respaldo descargado y muestra una alerta descartable cuando han transcurrido tres días sin un nuevo respaldo. Cifrado, ubicación, estructura y restauración verificable se definen antes de implementar.
- REQ-075 Después de tres días sin respaldo descargado, la alerta puede descartarse; si no se registra una descarga nueva, reaparece cada 24 horas hasta que se complete un respaldo.
- REQ-076 Cliente/Familia muestra la edad vigente de cada miembro; el expediente de Viaje muestra adicionalmente la edad proyectada de cada viajero a la fecha efectiva de inicio. Si esa fecha no existe, no se muestra una edad proyectada.
- REQ-077 El calendario abre el mismo expediente enfocado de Viaje al seleccionar un viaje; es una entrada adicional, no una pantalla alternativa de edición.
- REQ-078 Cada miembro de Cliente/Familia puede tener una relación opcional con el contacto principal, seleccionada desde `Pareja`, `Madre`, `Padre`, `Hijo`, `Hija` u `Otro`; el catálogo queda centralizado y configurable.
- REQ-079 Desde el expediente de Viaje se puede crear un miembro nuevo de Cliente/Familia sin abandonar el flujo; al guardar queda disponible para el Viaje actual y futuros Viajes de esa familia.
- REQ-080 Un miembro con participación histórica no se elimina de forma destructiva; puede archivarse para dejar de aparecer en nuevas selecciones sin alterar viajes previos.
- REQ-081 Al crear un Viaje se selecciona un contacto principal desde Cliente/Familia y queda establecido para ese Viaje. El cambio posterior solo está disponible como edición manual excepcional. Si no existe Cliente/Familia, el flujo permite crearla y continuar sin recaptura innecesaria.
- REQ-082 Un miembro archivado puede reactivarse con una acción explícita y volver a estar disponible para nuevas selecciones, sin alterar su historial.
- REQ-083 La lista familiar muestra miembros archivados con la etiqueta `Archivado`; el selector de participantes de un nuevo Viaje los excluye por defecto.
- REQ-084 Una tarea manual requiere título y fecha límite; su hora es opcional. Al completarse o reprogramarse, el sistema registra automáticamente fecha/hora y evento de actividad.
- REQ-085 Las tareas de un Viaje se consultan junto a sus notas; el módulo global `Tareas` reúne las tareas pendientes y cerradas de Leads y Viajes, conservando su vínculo de origen.
- REQ-086 La configuración de un Proveedor incluye plantillas de tareas. Al confirmar ese Proveedor dentro de un Servicio/Reserva, el sistema muestra sus tareas como sugerencias y solo crea las seleccionadas por la usuaria en el Viaje, vinculadas a ese Proveedor de servicio y editables.
- REQ-087 Cada plantilla de tarea de Proveedor permite fecha sin cálculo o una regla relativa al inicio efectivo del Viaje: días/meses antes, mismo día, o días/meses después. Si no hay inicio efectivo, la fecha calculada permanece vacía para asignación manual. Antes de crearla, la usuaria puede ajustar la propuesta de fecha.
- REQ-088 El MVP no modela componentes ni activa tareas por condiciones complejas del Viaje. La selección confirmada del Proveedor es el único disparador de sugerencia de su plantilla; se podrán añadir reglas posteriores sin modificar tareas existentes.
- REQ-089 Las plantillas de tareas de Proveedor pueden usar como ancla el fin efectivo del Viaje y calcular una fecha relativa en días o meses, especialmente para seguimientos posteriores al regreso. Sin fin efectivo, la fecha queda vacía.
- REQ-090 Cuando cambia el inicio o fin efectivo del Viaje, las tareas de plantilla que conservan origen automático recalculan su fecha. Una fecha límite editada manualmente queda protegida y no se modifica automáticamente.
- REQ-091 Tras un cambio de fecha del Viaje, cada tarea protegida muestra una alerta no bloqueante de revisión y permite recalcular con la plantilla o conservar/editar manualmente la fecha. La elección queda trazable.
- REQ-092 El MVP muestra alertas de tareas y revisiones únicamente dentro del CRM, mediante módulos, calendario y badges; no solicita permisos ni emite notificaciones nativas del navegador.
- ROADMAP-004 Evaluar notificaciones nativas del navegador, WhatsApp e integraciones con otros sistemas de la usuaria después de definir permisos, privacidad, entrega confiable y la arquitectura de sincronización.
- REQ-093 El módulo global `Tareas` agrupa por defecto `Vencidas`, `Hoy`, `Próximas` y `Sin fecha`, con el origen Lead o Viaje visible en cada registro.
- REQ-094 El módulo global permite filtrar inicialmente por Viaje, intervalo de fechas y Proveedor cuando la tarea tenga ese vínculo; filtros adicionales se agregan solo tras validación de uso.
- REQ-095 Al completar una Tarea, el sistema registra estado y fecha/hora y muestra un toast temporal con `Deshacer`; mientras esté visible, la acción revierte el clic y deja trazabilidad. Después, la Tarea permanece completada y puede reabrirse mediante una acción explícita.
- REQ-096 Editar una plantilla de tarea de Proveedor solo afecta instancias futuras. Las tareas existentes conservan el título y regla de plantilla aplicados al crearse, sin cambios retroactivos automáticos.
- REQ-097 El Calendario integra intervalos efectivos de Viajes, vencimientos de Tareas, fechas límite de pago del Cliente y fechas esperadas de Comisión, con filtros independientes por tipo. Los eventos sin fecha base no se muestran.
- REQ-098 Un clic en un evento del Calendario abre un panel lateral contextual; desde él se puede abrir explícitamente el Viaje, Tarea, Cliente o Comisión aplicable. No se requiere doble clic.
- REQ-099 El Calendario abre por defecto en vista mensual y ofrece vistas semanal y planificación/agenda de intervalos; no incluye vista diaria por horas.
- REQ-100 Administración de Proveedores usa una lista de selección y un expediente con pestañas `Datos generales`, `Comisiones` y `Plantillas de tareas`; solo la pestaña activa muestra su contenido. Los campos de Datos generales se definen en una validación posterior.
- REQ-101 Datos generales de Proveedor exige solo nombre y estado Activo/Inactivo. Puede incluir nombre de contacto, teléfono, correo, notas internas y una o más referencias útiles, con una referencia visible por defecto y posibilidad de agregar más.
- REQ-102 Los tipos de servicio de un Proveedor son etiquetas múltiples configurables, con valores iniciales `Hoteles`, `Cruceros`, `Renta de coches`, `Actividades o tours` y alta rápida de nuevas etiquetas. Un Proveedor puede tener una o varias y aparece en cada filtro de etiqueta correspondiente.
- REQ-103 Datos generales muestra un resumen de solo lectura de configuración de comisión —modo, porcentaje si aplica, participación de agencia y plazo esperado— y el conteo de plantillas de tareas. Para `monto variable por servicio` no muestra un monto fijo inexistente.
- REQ-104 Un Proveedor inactivo se conserva visible en historial, Viajes existentes y nuevas selecciones con la etiqueta `Inactivo`. Al elegirlo para un nuevo servicio, el sistema solicita activarlo explícitamente antes de permitir su uso.
- REQ-105 Al intentar usar un Proveedor inactivo en un servicio nuevo, el sistema ofrece `Activar y usar` o `Cancelar`; solo la primera opción cambia su estado y permite agregarlo al servicio.
- REQ-106 `Activar y usar` establece globalmente el estado `Activo`; Administración puede volver a establecer `Inactivo` sin modificar relaciones históricas.
- REQ-107 Un Proveedor inactivo sigue disponible para consultar y editar sus vínculos en Servicios o Viajes existentes. Solo agregarlo a un Servicio nuevo exige activación previa.
- REQ-108 Inactivar un Proveedor no cancela, pausa ni modifica Comisiones pendientes o Tareas ya generadas en Viajes existentes.
- REQ-109 El CRM ofrece un buscador global discreto y persistentemente accesible que permite búsquedas por palabra o texto libre. Las entidades y campos incluidos se definirán antes de implementación, aplicando los límites de privacidad del MVP.
- REQ-110 El buscador global consulta Clientes/Familias, Leads, Viajes, Proveedores, títulos de Tareas y el contenido de notas de Cliente/Familia y Viaje.
- REQ-111 Cada resultado del buscador identifica con claridad su tipo y origen contextual —por ejemplo, `Tarea · Viaje a Orlando` o `Nota de viaje · Familia Gómez`— y muestra un detalle breve para reconocerlo antes de abrirlo.
- REQ-112 Seleccionar un resultado del buscador abre el contexto exacto de trabajo —Tarea en su Lead/Viaje, nota en su sección correspondiente o expediente enfocado de la entidad— sin una pantalla intermedia.
- REQ-113 Los resultados del buscador se agrupan por tipo (`Clientes/Familias`, `Viajes`, `Tareas`, `Notas`, `Leads` y `Proveedores`); el MVP muestra coincidencias de todos los grupos sin requerir filtros manuales.
- REQ-114 Cuando no existen coincidencias, el buscador conserva el texto consultado, informa que no encontró resultados y ofrece `Limpiar búsqueda`; no presenta sugerencias inventadas ni crea registros automáticamente.
- REQ-115 El buscador admite coincidencias parciales sin distinguir mayúsculas/minúsculas, acentos/tildes, espacios repetidos ni signos o separadores comunes. El MVP no ofrece corrección automática de errores tipográficos ni resultados adivinados.
- REQ-116 Todo texto controlado por el sistema está disponible en español e inglés, incluyendo navegación, campos, acciones, estados, validaciones, alertas, diálogos, toasts y etiquetas. Los datos capturados por la usuaria no se traducen automáticamente.
- REQ-117 El idioma inicial del sistema es español. La usuaria puede cambiar a inglés desde Configuración y el sistema conserva esa preferencia localmente.
- REQ-118 Cambiar el idioma solo traduce texto del sistema. Los formatos de número permanecen con coma para miles y punto para decimales; las fechas conservan el orden día-mes-año; y las monedas/valores registrados no cambian por idioma.
- REQ-119 Las fechas se muestran y capturan en formato fijo `DD/MM/YYYY`; el cambio de idioma no adopta el formato `MM/DD/YYYY`.
- REQ-120 Los CSV operativos y de integración exportan fechas en formato ISO `YYYY-MM-DD`. Esta regla no cambia el formato `DD/MM/YYYY` de captura o visualización del CRM.
- REQ-121 Los CSV operativos y de integración exportan importes como números puros, sin símbolo ni separador de miles y con punto decimal; cada importe incluye su código de moneda ISO-4217 en una columna independiente.
- REQ-122 Los CSV operativos y de integración se generan en UTF-8 con BOM para preservar acentos y caracteres especiales en Excel y el dashboard.
- REQ-123 Cada paquete de CSV incluye un `manifest.json` con versión de esquema, fecha de exportación, archivos incluidos, conteos de filas y checksum para validar integridad.
- REQ-124 El checksum de cada archivo exportado se calcula con SHA-256 y se registra en `manifest.json`.
- REQ-125 Un Proveedor puede aceptar una o varias monedas. Antes de guardar un importe de ese Proveedor dentro de un Servicio/Reserva, se debe seleccionar explícitamente una moneda permitida; no existe una moneda automática y no se guarda un importe sin moneda.
- REQ-126 El pago con tarjeta del cliente se registra por componente de Proveedor con su fecha efectiva en la plataforma. Esta fecha no sustituye ni se confunde con la fecha esperada o efectiva de pago de Comisión.
- REQ-127 El identificador oficial generado por la plataforma al subir el formulario o *commission report* se conserva como referencia de seguimiento de la Comisión del componente de Proveedor. Puede existir antes del pago real de la Comisión y no cambia su estado por sí solo.
- REQ-128 El número de reservación emitido por la plataforma se conserva por componente de Proveedor. Puede permanecer vacío mientras no exista reserva y no se genera ni infiere automáticamente.
- REQ-129 Los catálogos iniciales se siembran por función: tipos de Venta y monedas candidatas desde `DROP DOWNS`; Proveedores desde el histórico de Ventas con el catálogo auxiliar como referencia. Las listas heredadas de acciones, estados y ayudas no definen por sí solas el flujo nuevo del CRM.
- REQ-130 La migración inicial de `Datos Clientes` crea un Cliente por fila, preserva los valores históricos disponibles y su procedencia, y no deduplica, fusiona, completa ni sobrescribe datos con Leads, Ventas u otras fuentes.
- REQ-131 El flujo de cotización conserva el canal de adquisición original y permite continuar la conversación operativa por WhatsApp. Antes de iniciar la cotización se registran, cuando apliquen, fechas y flexibilidad, situación de vuelos, contexto del viaje y edades de menores. `Cotización enviada` se confirma al enviar el PDF al cliente por WhatsApp; antes de una venta, las dudas y ajustes se atienden por mensajes o notas de voz, sin llamada obligatoria.
- REQ-132 Al enviar la primera cotización, el CRM crea una tarea interna de seguimiento para 4 días calendario después. La tarea es editable por Lead y no desencadena mensajes ni notificaciones externas automáticas.
- REQ-133 Un Lead pasa a `Vendido` únicamente al confirmar el primer cobro exitoso con tarjeta del cliente para una reserva, incluso si es un anticipo parcial. La conversión conserva el Lead, crea o vincula el Cliente y crea el Viaje; una cancelación posterior se registra en el Viaje y no borra la venta histórica.
- REQ-134 Cada pago confirmado del cliente se registra separadamente por componente de Proveedor, con importe, moneda y fecha efectiva. El total pagado y el saldo pendiente se derivan automáticamente; solo el primer pago dispara la conversión del Lead.
- REQ-135 La fecha límite de un saldo pendiente se captura manualmente por componente de Proveedor y puede quedar vacía. El CRM no la deriva de la fecha del viaje ni de una regla global.
- REQ-136 Al guardar una fecha límite de saldo, el CRM deriva alertas internas a 30, 7 y 1 días antes, y el mismo día. Son editables y no producen mensajes externos automáticos.
- REQ-137 La usuaria puede conciliar manualmente los depósitos quincenales de Archer: localiza cada Comisión por su `Tracking Form #` y confirma su pago con fecha e importe realmente recibidos. El CRM no asume ni registra pagos sin esa confirmación.
- REQ-138 Una Comisión pendiente que supera la referencia de control aplicable se identifica como vencida y habilita seguimiento interno `Where’s My Commission`; el CRM no envía ni presenta formularios externos automáticamente.
- REQ-139 Al llegar a su fecha esperada, una Comisión pendiente crea una Tarea interna `Subir Where’s My Commission Form`, vinculada a la Comisión y al Viaje, con vencimiento el mismo día y alertas internas editables. No se comunica con Archer ni se envía el formulario automáticamente.
- REQ-140 Una cancelación posterior a `Vendido` conserva la venta y los pagos históricos. La agencia registra y gestiona el resultado de cancelación; el Proveedor reembolsa directamente al Cliente. La política, elegibilidad, importe reembolsable y penalización se validan manualmente por Proveedor o Reserva y por fecha aplicable, sin cálculo global automático.
- REQ-141 La cancelación puede registrarse por componente de Proveedor. Una Comisión de componente reembolsado se marca `Cancelada` y deja de ser cobrable; una de componente no reembolsable conserva seguimiento cobrable. En Agent Car, una penalización retenida tras un reembolso parcial no genera Comisión para World Memories y la Comisión queda `Cancelada`. Otros reembolsos parciales exigen confirmación manual del resultado de Comisión, sin inferencia desde el porcentaje devuelto.
- REQ-142 El MVP permite a la usuaria crear, editar, activar o desactivar plantillas de tareas por Proveedor, con fechas relativas, sin requerir cambios de código. Al confirmar un Proveedor, sus tareas se sugieren para selección y edición antes de crearse. Las tareas existentes conservan el snapshot de su plantilla al crearse.
- REQ-143 Al iniciar el día calendario siguiente a `trip.effective_end_on`, el CRM marca automáticamente el Viaje como `Completado`, registra el evento y habilita el seguimiento de Comisiones pendientes. No solicita confirmación ni fecha manual; `commission.due_on` conserva su cálculo desde el fin efectivo.
- REQ-144 El dashboard inicial muestra: viajeros en curso; viajes con inicio en el mes calendario actual o siguiente, junto con su estatus y acciones pendientes; la cola comercial de seguimientos de Leads y cotizaciones iniciadas aún no enviadas; y Comisiones vencidas. Este último bloque presenta contador y detalle mínimo de Cliente/Viaje, Proveedor, fecha esperada y días de atraso. Cada elemento abre su contexto correspondiente.
- REQ-145 Las Tareas pendientes se muestran con `Vencidas` antes de `Hoy`, `Próximas` y `Sin fecha`, tanto en el módulo de Tareas como en las listas de acciones del dashboard. El dashboard permite completar o reprogramar una Tarea directamente, registrando el evento correspondiente.
- REQ-146 El MVP no almacena archivos adjuntos ni sus contenidos: PDF de cotización, confirmaciones y vouchers quedan fuera. Conserva exclusivamente los datos estructurados y eventos operativos necesarios, con importación/exportación de datos tabulares y respaldo JSON versionado; el almacenamiento documental se difiere a una evolución con base de datos.
- REQ-147 El MVP importa únicamente paquetes CSV estructurados, versionados y validados mediante su `manifest.json`. Excel es una salida operativa de exportación; JSON es respaldo/restauración versionado y no sustituye el paquete CSV de importación.
- REQ-148 La carga inicial del histórico se prepara fuera del MVP a partir de la versión actualizada del Excel fuente y se transforma al mismo paquete CSV canónico que importa el sistema. Las reglas históricas aprobadas, la trazabilidad de filas y el reporte de advertencias se aplican durante esa conversión única; no se implementa un importador especial de Excel dentro del dashboard.
- REQ-149 El dashboard muestra un recordatorio visible y descartable si pasan tres días calendario sin descargar un respaldo JSON exitoso. Conserva la fecha/hora de esa última descarga; las exportaciones a Excel no reinician el contador de respaldo.
- REQ-150 El MVP se publica como aplicación web estática en GitHub Pages y puede instalarse como PWA de escritorio para abrirse desde un icono propio, sin cuenta, backend de datos ni operación técnica diaria. GitHub Pages entrega únicamente la interfaz y sus actualizaciones; los datos operativos permanecen en IndexedDB del navegador y no se incorporan ni se hardcodean en los archivos publicados.
- REQ-151 El MVP incluye una vista de calendario visualmente cuidada para consultar hitos y acciones operativas por fecha. El detalle de sus fuentes, filtros y acciones se define como parte del diseño de pantallas; no sustituye las colas operativas del dashboard.
- REQ-152 La interfaz del CRM sigue el manual de marca World Memories entregado por la usuaria: usa los colores primarios `#00AEEF` y `#FDB913`, los secundarios `#F9D565`, `#FFA33B`, `#276BBA` y `#00B3D6`, y las variantes autorizadas de logotipo. La especificación visual deberá asignar sus roles conservando contraste y accesibilidad.
- REQ-153 El calendario muestra Tareas, fechas límite de pago y vencimientos de Comisión como hitos puntuales. Cada Viaje se representa como un bloque continuo que cubre íntegramente su intervalo efectivo desde inicio hasta fin, no como dos eventos separados.
- REQ-154 El calendario ofrece tres vistas del mismo conjunto de datos: mensual, semanal y planificación/agenda. La vista de planificación muestra eventos continuos como intervalos legibles, sin cuadrícula de horas ni vista diaria independiente; cada elemento enlaza con su contexto operativo.
- REQ-155 Un clic en un evento abre un panel lateral contextual. El panel permite abrir explícitamente el registro relacionado —Tarea, Viaje, Cliente o Comisión— cuando corresponda; el calendario no depende del doble clic para navegar.
- REQ-156 El CRM abre en español y permite cambiar a inglés mediante un selector. Solo se traducen textos controlados por el sistema; los datos introducidos por la usuaria conservan su idioma original.
- REQ-157 El MVP ofrece un buscador global persistente para Clientes, Leads, Viajes, Proveedores, Tareas y Comisiones. Permite buscar por texto y referencias operativas relevantes, agrupa los resultados por entidad y abre el contexto seleccionado sin reemplazar los filtros propios de cada módulo.
- REQ-158 El buscador global incluye el contenido de las notas de Leads y las notas de trabajo de Viajes. Cada coincidencia identifica su entidad vinculada y ofrece contexto mínimo antes de abrir el registro; buscar notas no las traduce ni las estructura automáticamente.
- REQ-159 El MVP incluye un módulo único de Datos y respaldos para importar paquetes CSV, exportar datos operativos a Excel, descargar/restaurar JSON versionado y consultar la fecha/hora del último respaldo. Cada operación preserva sus validaciones, vista previa, confirmación y trazabilidad.
- REQ-160 La navegación principal del MVP presenta Dashboard, Leads, Clientes, Viajes, Calendario, Tareas, Comisiones, Proveedores, Datos y respaldos, y Configuración. Los enlaces contextuales abren el registro relacionado desde esta estructura sin exigir módulos separados de Ventas o Finanzas.
- REQ-161 El MVP incluye una campana de notificaciones con contador y lista interna para Tareas vencidas, pagos próximos/vencidos, Comisiones vencidas y recordatorio de respaldo. Cada aviso abre su contexto y no envía comunicaciones externas.
- REQ-162 Fuera del MVP, los eventos internos de Tareas y alertas deben poder convertirse en disparadores de correo electrónico, notificaciones remotas o integraciones externas configurables cuando exista infraestructura conectada. La interfaz puede continuar publicada en GitHub Pages; el procesamiento persistente se añadirá mediante un backend o funciones administradas, por ejemplo Supabase o Cloudflare. El MVP no depende de esas integraciones para alertar ni operar.
- REQ-163 Una notificación de Tarea, pago o Comisión permanece activa y cuenta como pendiente hasta completar, reprogramar o resolver explícitamente la acción/asunto asociado. Abrirla o leerla no la elimina ni reduce el contador. El recordatorio de respaldo se resuelve al descargar JSON y puede descartarse temporalmente sin reiniciar el plazo de respaldo.
- REQ-164 El módulo Proveedores permite administrar, por cada Proveedor, sus datos generales, monedas permitidas, reglas de Comisión y plantillas de Tareas. Configuración contiene solo catálogos y preferencias globales compartidas; no duplica ni intermedia la gestión específica de Proveedores.
- REQ-165 Cada Lead presenta sus propios eventos en una línea de tiempo. La línea de tiempo del Viaje reúne cronológicamente sus eventos y los de todos sus Leads vinculados, con etiqueta de origen y sin copiar registros. Los cambios de estado actualizan su entidad y generan el evento en una misma operación; la línea de tiempo no modifica estados.
- REQ-166 El expediente de Cliente muestra una línea de tiempo agregada de eventos de sus Leads y Viajes vinculados, con origen identificable y orden cronológico. Es una proyección de lectura sin copias ni modificaciones de entidades, estados o relaciones.
- REQ-167 El MVP prioriza una experiencia completa de escritorio y usa PWA únicamente como mecanismo de instalación, caché de la interfaz y apertura desde un icono. No incluye una experiencia móvil soportada ni sincronización entre dispositivos; ambas se difieren a una evolución con backend de datos y no condicionan la salida inicial.
- REQ-168 El Dashboard funciona como fotografía operativa al día de hoy: combina saludo, colas de prioridad y tarjetas KPI actuales, sin filtros de periodo, rangos personalizados, tendencias ni gráficos históricos. Cada KPI abre su detalle y los importes se presentan separados por moneda.
- REQ-169 El paquete inicial de KPIs incluye: Leads activos, cotizaciones por enviar, cotizaciones en seguimiento, Viajeros en curso, próximos Viajes, Tareas pendientes/vencidas, saldos vigentes de Clientes por cobrar, Comisiones esperadas pendientes, Comisiones vencidas y Comisiones cobradas en el mes calendario actual. Conversión queda fuera del Dashboard y pasa a Insights futuro.
- REQ-170 En una evolución posterior, el módulo Insights ofrece selector de periodo/moneda, KPIs, detalle y vistas iniciales de tendencias mensuales de Leads/ventas, conversión por cohorte, Comisiones esperadas frente a pagadas, distribución del pipeline, tiempos promedio/mediana de pago por Proveedor y salud de Tareas. Usa barras, líneas y tablas; no incluye dispersión inicialmente y marca como no medible el histórico sin fechas suficientes.
- REQ-171 El módulo Comisiones del MVP controla Comisiones esperadas, próximas, vencidas y pagadas, con importes esperado/real, moneda, fechas, Proveedor, Viaje y `Tracking Form #`, además de totales separados por moneda. Un módulo Finanzas futuro solo se considera si aporta capacidades distintas; de lo contrario, la evolución amplía Comisiones.
- REQ-172 El acceso a datos queda detrás de un contrato independiente de la interfaz. El MVP implementa ese contrato con IndexedDB; una evolución podrá añadir o sustituir el adaptador por Supabase o Cloudflare sin cambiar las reglas del dominio ni exigir abandonar la publicación del frontend en GitHub Pages. La migración futura requerirá una estrategia explícita y verificable; no implica sincronización automática en el MVP.
- REQ-173 Tras una primera carga con conexión, la PWA conserva localmente la interfaz necesaria para abrir y operar sin internet. Al abrirse con conexión, comprueba actualizaciones de GitHub Pages en segundo plano sin bloquear el uso; si hay una, la descarga y solicita a la usuaria aplicarla mediante `Actualizar ahora` o `Más tarde`. Nunca recarga ni sustituye una versión durante una sesión activa sin confirmación. Una actualización que cambie el esquema de datos exige un respaldo JSON descargado antes de aplicarse.
- REQ-174 Restaurar un respaldo JSON reemplaza íntegramente la base local, sin combinarla ni deduplicarla. El módulo Datos y respaldos muestra un mini manual no técnico junto a las acciones: indica cuándo descargar un respaldo, que restaurar sustituye los datos actuales y los pasos para hacerlo. Antes de habilitar la restauración exige descargar un respaldo actual, valida archivo, versión, integridad y resumen de contenido, y solo entonces solicita confirmación explícita. La restauración se aplica completa o no se aplica; al finalizar muestra un resultado verificable y la fecha/hora del respaldo restaurado.
- REQ-175 El MVP usa una sola base IndexedDB con colecciones separadas por entidad, relación y estado operativo. La interfaz no escribe directamente en la base: cada acción de negocio pasa por el contrato de persistencia y guarda atómicamente el cambio, sus relaciones afectadas y el Evento de actividad. Si una parte falla, no se conserva ningún cambio parcial.
- REQ-176 Una importación CSV posterior es aditiva: crea únicamente registros nuevos. Las filas con un ID interno existente se reportan como duplicadas y no sobrescriben, fusionan ni eliminan datos; las filas válidas e independientes permanecen disponibles para importar. Tras confirmación, las filas aceptadas se guardan atómicamente con su lote y trazabilidad. Corregir registros existentes se hace en el CRM; reemplazar el estado completo se hace mediante restauración JSON.
- REQ-177 La interfaz del MVP se construye con React, TypeScript y Vite como aplicación estática instalable. La solución se organiza por módulos de negocio y separa presentación, casos de uso, dominio, contratos de datos y adaptadores de infraestructura. React no accede directamente a IndexedDB ni contiene reglas de negocio; esta separación permite sustituir el adaptador local por Supabase o Cloudflare en una evolución sin rehacer las pantallas ni el dominio.
- REQ-178 La calidad del MVP se verifica mediante análisis estático y build, pruebas unitarias de dominio, contratos de adaptadores, integración de IndexedDB/CSV/Excel/JSON, componentes accesibles, flujos end-to-end y validación manual real de PWA, offline, actualización, restauración, diseño y accesibilidad en escritorio. Ninguna publicación se considera válida sin round-trip JSON, integridad referencial y flujo comercial principal comprobados.
- REQ-179 El respaldo JSON del MVP se descarga sin cifrado o contraseña adicional y muestra una advertencia de manejo privado. El mini manual recomienda guardar cada archivo en una carpeta privada y dedicada de OneDrive, con nombre que incorpora fecha/hora. El cifrado administrado queda para una evolución con backend; el MVP no depende de una contraseña cuya pérdida impida restaurar.

## Mapa de pantallas

`SCREEN_MAP.md` es la fuente de verdad de las pantallas, superficies transversales, navegación y separación MVP/futuro consolidadas para la aprobación final de Fase E.
