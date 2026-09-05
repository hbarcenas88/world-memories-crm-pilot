# Registro de decisiones

## DEC-001 — Puerta de aprobación previa a implementación

- **Fecha:** 2026-07-12
- **Estado:** Confirmado
- **Contexto:** el usuario definió el material recibido como contexto de descubrimiento, no como especificación final.
- **Opciones evaluadas:** implementar directamente; prototipar antes de datos; completar descubrimiento y aprobación.
- **Decisión:** no escribir código de producto ni scaffolding hasta completar las fases A–G y recibir aprobación inequívoca.
- **Razón:** el modelo, las reglas, el MVP y la migración dependen de Excel y procesos todavía no analizados.
- **Consecuencias:** el trabajo actual se limita a inventario, análisis, entrevista, especificación y verificación.
- **Reconsiderar:** únicamente después de aprobación explícita registrada y documentos de Fase G completos.

## DEC-002 — Tratamiento no destructivo y privado de fuentes

- **Fecha:** 2026-07-12
- **Estado:** Confirmado
- **Contexto:** los Excel pueden contener datos personales, fórmulas y reglas operativas.
- **Opciones evaluadas:** editar/limpiar originales; trabajar sobre lectura o copia; migrar directamente.
- **Decisión:** preservar originales, perfilar sin escritura y publicar solo estadísticas o muestras anonimizadas.
- **Razón:** proteger integridad, privacidad y trazabilidad.
- **Consecuencias:** cualquier limpieza se propondrá como transformación reproducible, nunca sobre el original.
- **Reconsiderar:** no aplica para los originales; una copia de trabajo puede transformarse con autorización y respaldo.

## Decisiones todavía no tomadas

- Librerías concretas de persistencia, validación, calendario, formularios y componentes dentro del stack aprobado React + TypeScript + Vite.
- Esquema físico, índices y librería concreta de IndexedDB, sin alterar el modelo aprobado.

## Cierre de Fase F

### DEC-177 — Arquitectura aprobada y transición a Fase G

- **Fecha:** 2026-08-25
- **Estado:** Confirmado
- **Decisión:** la usuaria aprobó formalmente `ARCHITECTURE.md`, con lo que se cierra la Fase F y se abre la Fase G de aprobación final.
- **Impacto:** se puede presentar `APPROVAL_PACKAGE.md`; no se autoriza todavía código, instalación de dependencias, despliegue, publicación ni carga de datos reales.
- **Evidencia:** respuesta explícita de la usuaria: “Apruebo”.

### DEC-178 — Autorización de Fase G y modalidad de revisión

- **Fecha:** 2026-08-25
- **Estado:** Confirmado
- **Decisión:** la usuaria autorizó la implementación del MVP conforme al alcance y arquitectura aprobados. El agente principal trabaja en Terra High; los subagentes no se activan automáticamente: al terminar cada oleada se propone de forma separada una revisión Terra High de lógica/datos, visual o QA funcional, con objetivo y alcance explícitos.
- **Límites:** no usar Sol, no publicar, no desplegar y no migrar/cargar datos reales sin autorización específica posterior.
- **Evidencia:** autorización textual de la usuaria registrada el 2026-08-25.

## DEC-003 — Conservar fuente original y transformar por capas

- **Fecha:** 2026-07-12
- **Estado:** Confirmado
- **Contexto:** el usuario entregó una copia del libro y pidió conservar toda la información para adaptarla al formato del dashboard.
- **Opciones evaluadas:** sobrescribir/limpiar el libro; exportar directamente una hoja; conservar fuente inmutable y producir datos derivados.
- **Decisión:** conservar el XLSX sin cambios, identificarlo por hash y crear después una capa de staging transformable y reproducible.
- **Razón:** permite auditar, repetir transformaciones y recuperar campos omitidos sin degradar el original.
- **Consecuencias:** ninguna limpieza se hace manualmente sobre el archivo; cada exclusión o transformación tendrá reporte.
- **Reconsiderar:** no se reconsidera la preservación; sí el formato de staging después de validar fechas de Viaje y reglas de importación.

## DEC-004 — Credenciales fuera del dashboard

- **Fecha:** 2026-07-12
- **Estado:** Propuesto, prioridad crítica
- **Contexto:** las hojas `Usuarios` y `Datos Clientes` contienen credenciales en texto plano.
- **Opciones evaluadas:** migrarlas al CRM; cifrarlas localmente; excluirlas y moverlas a un gestor de contraseñas.
- **Decisión propuesta:** no exportar credenciales a CSV, IndexedDB, logs ni pruebas; rotarlas y gestionarlas fuera del CRM.
- **Razón:** un dashboard local-first sin control de acceso ni gestión de secretos no es un almacén adecuado.
- **Consecuencias:** la fuente histórica se preserva como archivo sensible, pero el pipeline bloquea esos campos.
- **Reconsiderar:** solo con un diseño específico de secretos, control de acceso, cifrado y necesidad de negocio aprobada.

## DEC-005 — Grano de `Ventas`

- **Fecha:** 2026-07-12
- **Estado:** Confirmado
- **Contexto:** 47 IDs aparecen en varias filas de Ventas, con hasta 8 filas y variación de proveedor, fechas, localizador e importe.
- **Opciones evaluadas:** una fila por viaje; una fila por servicio/reserva; mezcla dependiente del caso.
- **Decisión:** cada fila de `Ventas` representa un servicio o reserva diferente dentro del mismo viaje asociado.
- **Razón:** confirmación explícita del usuario y consistencia con la estructura observada.
- **Consecuencias:** `Ventas` alimentará principalmente `services.csv` y `commissions.csv`; `trips.csv` se construirá agrupando servicios bajo una entidad Viaje.
- **Reconsiderar:** si aparecen casos reales donde un mismo ID agrupe viajes independientes, deberán documentarse como excepción y recibir una clave de viaje separada.

## DEC-006 — Fechas efectivas del Viaje

- **Fecha:** 2026-07-12
- **Estado:** Confirmado
- **Contexto:** los servicios de un mismo viaje tienen fechas distintas y puede haber extensiones sin un servicio registrado.
- **Opciones evaluadas:** usar fechas del Lead; calcular intervalo de servicios; capturar fechas independientes.
- **Decisión:** calcular inicio más temprano y fin más tardío de los servicios, permitiendo override manual. Conservar separadamente las fechas solicitadas del Lead.
- **Razón:** minimiza captura y representa las reservas reales, sin impedir corregir extensiones no reflejadas en servicios.
- **Consecuencias:** Viaje conserva fechas calculadas, override opcional y fechas efectivas; todo cambio manual queda en historial.
- **Reconsiderar:** si surgen otras fuentes confiables de itinerario completo.

## DEC-007 — Bitácora automática de eventos

- **Fecha:** 2026-07-12
- **Estado:** Confirmado
- **Contexto:** se necesitan tiempos de respuesta, seguimiento, cotización, conversión y retraso de tareas sin capturar fechas repetidamente.
- **Opciones evaluadas:** campos manuales por hito; timestamps en cada entidad; bitácora append-only con hitos derivados.
- **Decisión:** registrar automáticamente eventos de acciones de negocio y derivar hitos/métricas desde ellos. Permitir fecha pasada solo como opción secundaria.
- **Razón:** aporta trazabilidad y métricas con menor carga de captura.
- **Consecuencias:** acciones y eventos deben ser atómicos; el historial no registra cada tecla ni guarda secretos o snapshots completos.
- **Reconsiderar:** si el volumen exige archivado o agregados, sin perder la fuente histórica.

## DEC-008 — Captura mínima y divulgación progresiva

- **Fecha:** 2026-07-12
- **Estado:** Confirmado
- **Contexto:** el usuario exige eficiencia y evitar formularios extensos.
- **Opciones evaluadas:** formulario completo obligatorio; captura mínima y edición posterior; asistente rígido por pasos.
- **Decisión:** solicitar solo datos no inferibles indispensables, usar defaults y campos derivados, y mostrar detalles opcionales progresivamente.
- **Razón:** favorece adopción diaria, rapidez y calidad de datos.
- **Consecuencias:** cada campo obligatorio debe justificar su necesidad; fechas técnicas y estados iniciales se generan automáticamente.
- **Reconsiderar:** por obligaciones legales o de proveedor debidamente documentadas.

## DEC-009 — Captura inicial balanceada de Lead

- **Fecha:** 2026-07-16
- **Estado:** Confirmado
- **Contexto:** se requiere una captura rápida, pero con suficiente información para iniciar la calificación y preparar una cotización.
- **Opciones evaluadas:** captura express; captura balanceada; captura estructurada completa.
- **Decisión:** al crear un Lead se captura nombre o referencia familiar, origen de adquisición, un dato utilizable de contacto, destino o necesidad principal y fechas tentativas. El sistema completa automáticamente fecha de recepción, estado inicial, responsable, identificador y evento de recepción.
- **Razón:** permite actuar y medir desde el primer contacto sin exigir pasajeros, presupuesto, tipo de viaje ni detalles que pueden conocerse después.
- **Consecuencias:** pasajeros, presupuesto, notas extensas, preferencias y demás detalles permanecen opcionales y progresivos. Falta decidir cómo registrar fechas aún desconocidas.
- **Reconsiderar:** si el análisis del proceso demuestra que otro dato es indispensable para evitar leads no accionables.

## DEC-010 — Fechas tentativas aún desconocidas

- **Fecha:** 2026-07-16
- **Estado:** Confirmado
- **Contexto:** la captura balanceada solicita fechas tentativas, pero algunos leads llegan sin un rango definido.
- **Opciones evaluadas:** obligar a estimar fechas; guardar nulos ambiguos; representar el estado explícitamente.
- **Decisión:** permitir guardar el Lead con el estado explícito `fechas_por_definir`, sin rango inventado.
- **Razón:** evita datos falsos y conserva una señal operativa para seguimiento.
- **Consecuencias:** las fechas permanecen nulas solo con ese estado; el sistema puede mostrar una tarea o alerta de calificación, pero no calcula duración ni calendario hasta contar con un rango válido.
- **Reconsiderar:** si se definen rangos alternativos como mes/temporada con semántica propia.

## DEC-011 — Entrada y estados iniciales del Lead

- **Fecha:** 2026-07-17
- **Estado:** Confirmado
- **Contexto:** la agencia suele registrar WhatsApp e Instagram después de responder, pero también necesita conservar oportunidades aún no atendidas y prepararse para integraciones futuras.
- **Decisión:** `Nuevo` es un estado opcional para leads capturados sin contacto inicial. Un Lead creado manualmente después de responder por WhatsApp, Instagram, llamada o conversación presencial puede nacer directamente en `Contactado` y registra ambos eventos: recepción/conocimiento del Lead y contacto inicial.
- **Razón:** refleja el proceso real sin obligar a pasar artificialmente por `Nuevo`.
- **Consecuencias:** la pantalla de captura ofrecerá una acción predeterminada “Registrar como contactado” y una alternativa breve “Guardar como nuevo”. Futuras integraciones de canales crearán `Nuevo` al recibir el mensaje antes de una respuesta humana.
- **Métrica propuesta pendiente de validación:** si se desconoce la hora real del mensaje entrante, el tiempo de primera respuesta se marcará como no medible, nunca como cero.
- **Reconsiderar:** al integrar canales automáticos o si cambia el hábito de captura manual.

## DEC-012 — Nombres confirmados de estados comerciales

- **Fecha:** 2026-07-17
- **Estado:** Confirmado
- **Contexto:** el nombre del estado debe describir la actividad comercial real y ser entendible en un vistazo.
- **Decisión:** se conservan `Nuevo`, `Contactado`, `Cotización enviada`, `Seguimiento`, `Pausado` y `Cancelado`; `Negociación` se renombra a `Revisión/Ajustes`; `Ganado` se renombra a `Vendido`; el estado entre `Contactado` y `Cotización enviada` se llama `Cotización en preparación`. `Cancelado` reemplaza el término anterior `Perdido` conforme a DEC-089.
- **Razón:** “Revisión/Ajustes” y “Vendido” representan mejor el lenguaje de trabajo de la agencia.
- **Consecuencias:** catálogos, filtros, métricas y migración deberán mapear los nombres antiguos del Excel a estas etiquetas.
- **Reconsiderar:** después de probar el flujo diario con datos reales.

## DEC-013 — Significado de `Costo final` en Ventas

- **Fecha:** 2026-07-18
- **Estado:** Confirmado
- **Contexto:** el campo requiere una semántica inequívoca para no confundir facturación del cliente con costo al proveedor o comisión.
- **Decisión:** `Costo final` representa el importe cobrado al cliente por el Servicio/Reserva, totalizado por moneda cuando sus componentes usan monedas distintas.
- **Razón:** confirmación explícita de la usuaria.
- **Consecuencias:** para datos nuevos se deriva como suma por moneda de los importes finales de Proveedores dentro del Servicio y de conceptos adicionales sin Proveedor. Sus importes originales siempre se conservan; un total de referencia solo se calcula cuando el Viaje tiene una tasa de cambio explícita. Durante la migración se conserva el importe histórico y se concilia contra la suma de su moneda. El costo al proveedor, si se incorpora, será un campo distinto y no se inferirá desde este valor. Las comisiones permanecen como entidades y montos separados.

## DEC-014 — Fechas esperada y real de pago de comisión

- **Fecha:** 2026-07-18
- **Estado:** Confirmado
- **Decisión:** `Pago de Comisión` representa la fecha esperada o límite (`commission.due_on`). La fecha real se registra por separado en `commission.paid_on` cuando la usuaria selecciona el día efectivo de pago en un calendario nativo.
- **Regla:** seleccionar una fecha confirma el pago y genera `commission_marked_paid`; `occurred_at` conserva la fecha efectiva elegida y `recorded_at` la fecha de captura.
- **Razón:** permite registrar pagos atrasados durante catch-up sin convertir la fecha de registro en una fecha financiera falsa.

## DEC-027 — Regla configurable de fecha esperada de comisión

- **Fecha:** 2026-07-18
- **Estado:** Confirmado
- **Decisión:** el plazo para `commission.due_on` se configura en Administración de Proveedores. El límite máximo universal es 90 días calendario después del fin efectivo del Viaje. Cada Proveedor puede tener un plazo distinto únicamente si es igual o anterior a ese límite.
- **Sin fecha efectiva:** si el Viaje todavía no tiene fecha efectiva, `commission.due_on` permanece vacía hasta que exista una base para calcularla.
- **Snapshot:** una Comisión conserva el plazo que tenía el Proveedor al crearla. Cambios posteriores en la configuración del Proveedor solo aplican a Comisiones nuevas y no alteran las existentes.
- **Regla de plazo:** un plazo personalizado del Proveedor —por ejemplo, 30 días— sigue siendo una regla relativa al fin efectivo del Viaje y se recalcula si esa fecha cambia.
- **Regla de fecha fija:** una fecha específica capturada manualmente para una Comisión se considera override absoluto y no se recalcula hasta que la usuaria la edite.
- **Trazabilidad:** la fecha calculada conserva el Proveedor, el plazo y el modo de override que la originaron.

## DEC-028 — Proveedores de servicio sin comisión

- **Fecha:** 2026-07-18
- **Estado:** Confirmado
- **Decisión:** cada Proveedor participante dentro de un Servicio/Reserva determina su propia comisión. Un proveedor que no genere comisión se marca explícitamente como `Sin comisión`.
- **Estado inicial:** al agregar un Proveedor a un Servicio/Reserva, se considera `Con comisión` por defecto. `Sin comisión` es una excepción que la usuaria marca explícitamente.
- **Consecuencia:** el estado vive en la relación Proveedor de servicio, no en el Servicio completo, y no se crea una Comisión vacía. Así los reportes distinguen `Sin comisión` de una comisión pendiente de captura o pago para ese proveedor concreto.
- **Motivo:** puede deberse a que el proveedor no paga comisión o a que descuentos y otras condiciones la absorben. El CRM no monitorea ni exige capturar el motivo en esta etapa.
- **Flexibilidad:** si posteriormente aplica una comisión, la usuaria puede cambiar ese Proveedor de servicio a `Con comisión` y crear la Comisión manualmente.

## DEC-026 — Monto esperado y monto real recibido de comisión

- **Fecha:** 2026-07-18
- **Estado:** Confirmado
- **Decisión:** cada comisión conserva el monto neto esperado y, al registrarse como pagada, el monto real efectivamente recibido. Ambos valores se conservan aunque difieran por tipo de cambio, cargos bancarios intermediarios u otra variación.
- **Monedas:** el depósito real puede estar en una moneda distinta de la comisión esperada; cada monto conserva su propia moneda. No se resta ni compara numéricamente un par de montos de distinta moneda sin una conversión explícita y trazable.
- **Regla:** cuando esperado y recibido están en la misma moneda, la diferencia se calcula automáticamente; no se exige que la usuaria la capture de nuevo.
- **No captura por pago:** no se solicita ni registra una tasa de cambio manual en cada pago. En la etapa inicial, los montos de distintas monedas permanecen separados.
- **Dashboard inicial:** los totales se presentan agrupados por moneda, sin conversión central. Una consolidación futura requerirá definir fuente, fecha y criterio de tipo de cambio antes de activarse.
- **Pago único:** cada Comisión se cierra con un único pago real en esta etapa; no se modelan depósitos parciales. Si en el futuro aparecen, requerirán una entidad de pagos separada.
- **Cierre y reportes:** registrar ese pago marca la Comisión como `Pagada` aunque el monto recibido difiera del esperado. El monto real recibido es la fuente de verdad para reportes de cobros; el esperado se conserva para referencia y variación.
- **Advertencia de diferencia:** si el monto real difiere del esperado, el sistema muestra `El monto real pagado difiere del esperado`. La usuaria puede confirmar y guardar ambos montos, o regresar a corregir; hasta confirmar no se cierra el pago.
- **Nota opcional y desacoplada:** se podrá guardar un motivo breve de la diferencia como texto libre, sin hacerlo obligatorio ni usarlo para cálculos, estados o reportes. Debe poder ocultarse o retirarse posteriormente sin alterar el cierre central de la Comisión.

## DEC-015 — Exclusión de la hoja histórica `Hoja1`

- **Fecha:** 2026-07-18
- **Estado:** Confirmado
- **Decisión:** la pestaña `Hoja1` (la que puede aparecer como “Sheet 1”) se considera un reporte histórico de estadísticas de clientes y familias que viajaron. No se migra como fuente operativa del CRM.
- **Razón:** la usuaria confirmó que ya no representa el proceso vigente.
- **Consecuencias:** se conserva únicamente como referencia histórica del XLSX; no alimenta entidades, CSV operativos ni métricas actuales.

## DEC-016 — Analytics históricos como evolución posterior

- **Fecha:** 2026-07-18
- **Estado:** Propuesto
- **Decisión:** después de cerrar el CRM operativo se podrá construir un módulo de analytics para familias viajadas, destinos, volumen y otros indicadores útiles para promoción y contenido de la agencia.
- **Regla:** estos indicadores se calcularán desde datos operativos validados, no desde `Hoja1` ni desde reportes derivados sin trazabilidad.

## DEC-017 — Exclusión inicial de hojas financieras, administrativas y personales

- **Fecha:** 2026-07-18
- **Estado:** Confirmado
- **Decisión:** `Inversiones`, `PnL`, `Cuentas Banco`, `REGINA RRSS`, `GASTOS WM ANALU` y `Wish list` quedan fuera del CRM inicial. Se preservan en el XLSX original y solo se reevalúan en una fase posterior con alcance específico.
- **Razón:** mantener el MVP enfocado en la operación comercial y evitar mezclar finanzas personales/administrativas con datos operativos del CRM.
- **Consecuencias:** no generan entidades ni CSV del paquete operativo actual; `PnL` se podrá reconstruir más adelante desde datos canónicos si se aprueba un módulo financiero.

## DEC-018 — Exclusión de `PTC Evolution` por desactualización

- **Fecha:** 2026-07-18
- **Estado:** Confirmado
- **Decisión:** `PTC Evolution` no se considera en la migración ni en la conciliación de comisiones del CRM inicial, porque la usuaria confirmó que está desactualizada.
- **Consecuencias:** no se crea `external_commissions.csv` desde esa hoja; las comisiones operativas parten de `Ventas` y de los registros futuros dentro del CRM.

## DEC-019 — Expediente único de Cliente y datos operativos adicionales

- **Fecha:** 2026-07-18
- **Estado:** Confirmado
- **Decisión:** el CRM tendrá un repositorio único de Clientes alimentado desde Leads al convertir una venta o vinculado a un Cliente existente cuando se reconoce desde el Lead. La administración de Cliente reúne contactos, preferencias, detalles operativos y cuentas de servicio que no pertenecen a la captura de Lead.
- **Regla de navegación:** un Lead enlazado abre el perfil de su Cliente; un Lead aún no vinculado abre su propio detalle y ofrece crear o vincular un Cliente, sin fabricar un perfil de Cliente antes de confirmarlo.
- **Alcance actualizado:** DEC-124 sustituye la interpretación inicial: `Datos Clientes` es el directorio maestro histórico y se migra sin enriquecimiento. Los datos de cuentas se separan del Lead. Las contraseñas se manejan fuera del CRM, en el Excel separado de la usuaria.
- **Consecuencias:** el perfil de Cliente podrá contener plataformas, identificadores, referencias de tickets, gustos/preferencias y notas adicionales. Las contraseñas no se importan, almacenan, respaldan ni exportan desde el CRM.

## DEC-020 — Nota útil de familia y campos comerciales básicos

- **Fecha:** 2026-07-18
- **Estado:** Confirmado
- **Decisión:** el perfil de Cliente/Familia inicia con una Nota útil de familia enriquecida para contexto libre, con negritas, listas y checklist. No se crean campos personalizados dinámicos en esta etapa; un dato recurrente se eleva a campo estructurado solo cuando su uso lo justifique.
- **Campos básicos disponibles:** nombre, país, correo, teléfono y dirección pertenecen al Cliente/Lead según disponibilidad; tipo de viaje, moneda de cotización o pago, fechas de viaje, adultos, niños, total de personas y presupuesto pertenecen a la oportunidad/viaje actual.
- **Regla:** presupuesto, moneda, tipo de viaje y cantidades se mantienen estructurados para filtros, cotización y funnel; la Nota útil no se interpreta automáticamente como métrica.

## DEC-021 — Captura adaptable de Lead sin bloqueo por campos incompletos

- **Fecha:** 2026-07-18
- **Estado:** Confirmado
- **Decisión:** la creación de Lead usa una sola pantalla adaptable con modo rápido y modo completo. Ningún campo manual bloquea el guardado inicial; el sistema conserva campos faltantes como desconocidos y permite completarlos posteriormente.
- **Campos visibles iniciales:** origen de adquisición, nombre, país de residencia, teléfono y correo en campos separados, destino, tipo de viaje configurable y fechas o `fechas_por_definir`. Si el origen es `Referido`, aparece el campo condicional `Referido por`.
- **Modo completo:** despliega en la misma pantalla los detalles disponibles para cotización, como adultos, niños, presupuesto y moneda, sin forzar que todos existan.
- **Consecuencias:** no hay dos procesos ni una etapa obligatoria posterior; un Lead puede registrarse con datos parciales desde cualquier canal y entrar como `Nuevo` o `Contactado` según la interacción real.

## DEC-022 — Catálogo inicial configurable de tipo de viaje

- **Fecha:** 2026-07-18
- **Estado:** Confirmado
- **Decisión:** el catálogo inicial contiene: `Tour`, `Hotel`, `Paquete Disney`, `Paquete Universal`, `Palace Group`, `Viaje personalizado`, `Crucero`, `Renta auto`, `Boletos experiencias`, `Paquete Expedia`, `Operador fuera de Archer`, `Vuelo + hotel`, `Tickets parque`, `Seguro viaje` y `Emisión boletos vuelos`.
- **Regla:** un Lead tiene un solo tipo principal configurable y puede quedar vacío al registrarlo. Los servicios, extras y adicionales se registran después en la cotización o el Viaje.
- **Razón:** conserva una clasificación comercial clara para el funnel sin perder los componentes reales de la planificación.

## DEC-023 — Catálogo inicial configurable de orígenes de adquisición

- **Fecha:** 2026-07-18
- **Estado:** Confirmado
- **Decisión:** el catálogo inicial contiene `Friends & Family`, `Facebook`, `Referido`, `WhatsApp`, `Instagram`, `Viaje personal` y `Cliente`.
- **Semántica especial:** `Viaje personal` identifica viajes de la familia de la agencia que también generan comisión; `Cliente` identifica un viaje nuevo para un Cliente ya existente.
- **Regla:** los valores son configurables. Si el origen es `Referido`, se muestra el campo condicional `Referido por`.

## DEC-024 — Comisiones por Proveedor dentro de Servicio/Reserva

- **Fecha:** 2026-07-18
- **Estado:** Confirmado
- **Decisión:** un Servicio/Reserva puede incluir uno o varios Proveedores. La comisión se determina individualmente por cada Proveedor dentro de ese Servicio, no por el tipo de viaje ni por el origen de adquisición.
- **Aplicación:** `Viaje personal` usa la misma lógica de proveedor y porcentaje; no tiene una regla especial por origen.

## DEC-025 — Configuración de comisión bruta y participación por Proveedor

- **Fecha:** 2026-07-18
- **Estado:** Confirmado
- **Contexto:** precisión posterior de la usuaria que reemplaza la interpretación anterior de una base fija de costo neto para la comisión.
- **Decisión:** cada Proveedor se configura al crearse con dos reglas independientes: participación de agencia (inicialmente 80% o 100%) y modo de comisión bruta (`porcentaje_fijo` o `monto_variable_por_servicio`).
- **Porcentaje fijo:** si el Proveedor trabaja por porcentaje, su porcentaje bruto se configura una vez en el Proveedor y puede editarse allí. Al usarlo en un Servicio, el CRM aplica ese porcentaje y conserva el valor aplicado para trazabilidad; no se vuelve a pedir el porcentaje en cada Servicio.
- **Monto variable por servicio:** si el Proveedor trabaja por monto, la comisión bruta se captura para el caso concreto dentro del Servicio, pues puede variar con el hotel, producto, temporada, descuentos u otras condiciones.
- **Configuración por Proveedor:** la participación de agencia determina si el CRM calcula una participación menor o conserva íntegra la comisión bruta; es independiente del modo porcentaje/monto.
- **Cálculo:** `comisión_neta_agencia = comisión_bruta_100% × participación_del_proveedor`. Por ejemplo, una comisión bruta capturada de USD 100 para un Proveedor configurado al 80% produce USD 80; para uno al 100%, conserva USD 100.
- **Captura mínima:** cuando la participación es 100%, no se exige ni duplica una captura manual de un segundo monto; la participación neta se deriva y equivale a la comisión bruta. El sistema conserva la configuración aplicada para trazabilidad y reportes.
- **Separación comercial:** `Costo final` representa los totales cobrados al cliente por el Servicio, separados por moneda. En modo porcentaje, la base es el importe final del Proveedor dentro del Servicio; en modo monto no dispara cálculo alguno.
- **Importe base confirmado:** cada Proveedor dentro de un Servicio conserva su propio importe final para el cliente. El porcentaje fijo de ese Proveedor se calcula sobre dicho importe, no sobre el total del Servicio.
- **Regla de captura:** en modo monto variable la usuaria ingresa directamente la comisión bruta al 100% dentro del Servicio. En modo porcentaje fijo, el sistema usa el porcentaje configurado en el Proveedor y calcula el monto bruto; la tasa y el importe base usado deben quedar trazables.

## DEC-029 — Composición del importe final del Servicio

- **Fecha:** 2026-07-19
- **Estado:** Confirmado
- **Decisión:** los importes finales cobrados al cliente por un Servicio/Reserva se calculan sumando por moneda los importes de cada Proveedor dentro del Servicio y de cero o más conceptos adicionales sin Proveedor.
- **Conceptos adicionales:** cubren importes puntuales que no se ligan a un Proveedor, como IVA, seguros u otros cargos. Se modelan separados para no inventar un Proveedor ni alterar comisiones.
- **Captura inicial:** cada concepto adicional solo requiere nombre, importe y moneda. No se exigen categorías en esta etapa; podrán configurarse si su uso recurrente lo justifica.
- **Cálculo de porcentaje:** cada Proveedor con porcentaje fijo usa exclusivamente su propio importe final dentro del Servicio como base de cálculo.
- **Multimoneda:** un mismo Servicio puede contener importes de Proveedores y conceptos adicionales en monedas distintas. Los totales se agrupan por moneda y, si el Viaje tiene tasa de referencia, se pueden convertir a su moneda de referencia sin sustituir los importes originales.

## DEC-030 — Tasa de cambio de referencia por Viaje

- **Fecha:** 2026-07-26
- **Estado:** Confirmado
- **Decisión:** cada Viaje puede tener una única tasa de cambio de referencia, editable, para convertir los importes de sus Servicios. La moneda de referencia es la moneda en que se cotiza al cliente.
- **Regla:** la tasa se aplica de forma consistente a los componentes del Viaje mientras no se edite. Los importes y monedas originales se preservan siempre junto al resultado convertido de referencia.
- **Ciclo de vida:** mientras la cotización está en preparación, editar la tasa recalcula automáticamente los importes de referencia. Al marcar el Viaje `Vendido`, la tasa queda congelada.
- **Ajuste posterior:** después de `Vendido`, cambiar la tasa requiere una acción explícita de ajuste. El sistema conserva la tasa anterior, la nueva, cuándo se cambió y recalcula los importes de referencia solo al confirmar.
- **Trazabilidad mínima:** el historial registra automáticamente tasa anterior, tasa nueva, fecha/hora y usuario. El motivo es texto libre opcional y no bloquea el ajuste.
- **Alcance:** esta tasa sirve para cotización, planeación y totales de referencia del Viaje. La proyección y el ajuste de comisiones frente al tipo de cambio real se definen por separado.
- **Expresión inequívoca:** la interfaz muestra siempre el par y la dirección completa, por ejemplo `1 USD = 18.50 MXN`, y conserva ambas monedas junto con la tasa aplicada.

## DEC-031 — Tasa propia de proyección por Comisión

- **Fecha:** 2026-07-26
- **Estado:** Confirmado
- **Decisión:** al crear una Comisión, su tasa de proyección se inicializa desde la tasa vigente del Viaje y continúa siguiéndola mientras no exista una edición propia. El primer override manual separa esa Comisión: desde entonces conserva su tasa independiente sin modificar la del Viaje ni las demás Comisiones.
- **Separación:** la tasa de proyección solo calcula un importe esperado de referencia. No reemplaza el monto esperado en su moneda original ni el monto y moneda realmente recibidos.
- **Trazabilidad:** se conserva la tasa, el par de monedas y si la Comisión sigue la referencia del Viaje o usa un override propio.
- **Reversión:** una Comisión con override puede usar la acción explícita `Volver a usar la tasa del Viaje`. La acción elimina el override, cambia el origen a `trip_reference` y reactiva el seguimiento automático; su ejecución queda en el historial junto con el valor sustituido y el usuario.

## DEC-032 — Detección asistida y decisión humana de duplicados de Cliente

- **Fecha:** 2026-07-26
- **Estado:** Confirmado
- **Decisión:** durante la importación histórica, el sistema detecta y presenta posibles coincidencias de Cliente basadas en nombre, correo y teléfono normalizados. No fusiona Clientes automáticamente.
- **Decisión por candidato:** la usuaria puede fusionar el registro entrante con el Cliente sugerido o tratarlo como un Cliente independiente y crear un registro nuevo.
- **Candidatos no revisados:** no bloquean la confirmación de la primera importación. Se crean como Clientes independientes y permanecen marcados para revisión posterior.
- **Trazabilidad:** cada decisión conserva el lote de importación, los registros implicados, la alternativa elegida y el usuario. Los candidatos no resueltos permanecen visibles en el reporte de importación.
- **Consecuencia:** una coincidencia es solo una sugerencia, nunca evidencia suficiente para alterar relaciones o historial sin confirmación humana.

## DEC-033 — Estados Pausado y Cancelado con reactivación manual

- **Fecha:** 2026-07-26
- **Estado:** Confirmado
- **Pausado:** representa una oportunidad detenida temporalmente, con interés potencial para retomar en el futuro.
- **Cancelado:** representa una oportunidad concreta que terminó sin venta, sin atribuir la causa a la agencia.
- **Reactivación:** ningún estado se reactiva por una fecha, alerta o regla automática. La usuaria decide explícitamente reabrirlo y lo mueve a `Seguimiento` o `Revisión/Ajustes` según la acción comercial que corresponda.
- **Al pausar:** el sistema sugiere crear una próxima tarea o recordatorio, pero la usuaria puede descartarlo; pausar no obliga a crear una tarea.
- **Al marcar como cancelado:** se ofrece un motivo opcional para analytics, compuesto por una categoría principal de un catálogo configurable y una nota libre opcional. Ninguno bloquea el cierre.
- **Captura rápida:** si la categoría necesaria no existe, la usuaria puede crearla desde ese mismo flujo; queda disponible como opción futura del catálogo.
- **Catálogo inicial:** `Canceló viaje`, `Costo/presupuesto`, `Eligió otra agencia` y `No respondió`.
- **Trazabilidad:** pausar, marcar como cancelado y reactivar generan un evento de actividad con estado anterior, estado nuevo y fecha/hora; no se requiere recapturar los datos del Lead.

## DEC-034 — Seguimiento manual después de Cotización enviada

- **Fecha:** 2026-07-26
- **Estado:** Confirmado
- **Decisión:** cuando una cotización enviada recibe respuesta o una nueva interacción, basta con que la usuaria cambie manualmente el estado a `Seguimiento`.
- **Automatización:** el cambio de estado genera automáticamente la fecha/hora y el evento de actividad; no se añade una acción separada de “Registrar seguimiento” ni se pide una fecha adicional.

## DEC-035 — Notas enriquecidas de trabajo por Viaje

- **Fecha:** 2026-07-26
- **Estado:** Confirmado
- **Decisión:** los avances, pendientes y contexto de preparación se registran en una sección de notas enriquecidas dentro de cada Viaje; no se crea un mecanismo separado de avances parciales.
- **Formato:** la nota admite texto, títulos, negritas, listas y checklist, con formato suficiente para funcionar como una post-it operativa. Su contenido no cambia estados ni genera métricas automáticamente.
- **Estructura:** habrá una sola nota de trabajo por Viaje, que puede contener múltiples fechas, asuntos y bloques escritos por la usuaria.
- **Captura rápida:** una barra pequeña puede ofrecer `Título`, `Subtítulo`, `Negrita`, `Lista`, `Checklist` e `Insertar fecha`, sin convertir cada bloque en un campo separado. `Insertar fecha` abre un calendario para elegir la fecha exacta.
- **Separación:** la Nota útil de Cliente/Familia conserva contexto permanente de la familia; la nota del Viaje conserva trabajo y pendientes de esa oportunidad concreta.

## DEC-036 — Guardado agregado del expediente de Cliente

- **Fecha:** 2026-07-26
- **Estado:** Confirmado
- **Decisión:** la pantalla del Cliente/Familia funciona como expediente agregado. Un único botón `Guardar cambios` confirma en conjunto las modificaciones realizadas en el Cliente, Viaje, Proveedores, importes y notas del contexto abierto.
- **Regla:** si solo se modifica la nota, el mismo botón guarda la nota; no se requiere un guardado separado. La operación debe ser consistente: no confirmar una parte dejando otra modificación pendiente por un fallo de validación.
- **Salida:** si existen cambios sin guardar y se intenta cerrar el expediente, se muestra una advertencia con `Guardar`, `Salir sin guardar` y `Cancelar`.
- **Confirmación:** después de guardar, aparece un toast breve durante aproximadamente cinco segundos y el botón vuelve a su estado normal. El Cliente y el Viaje muestran `Última vez guardado` en formato corto —por ejemplo, `Hoy, 3:42 p. m.`— y el detalle completo de fecha/hora aparece al pasar el cursor.
- **Backlog operativo:** validar navegación Clientes/Familias → Viaje y Viajes activos → mismo expediente enfocado; validar fecha de nacimiento y edad dinámica para todos los viajeros.
- **Navegación confirmada:** `Clientes/Familias` conserva el historial resumido; seleccionar un Viaje abre su expediente enfocado. `Viajes activos` abre exactamente ese mismo expediente.
- **Viajeros confirmados:** el contacto principal y los demás viajeros registran fecha de nacimiento; la edad se deriva dinámicamente en años y meses al consultar la ficha. Otros atributos estructurados de Pasajero quedan en backlog.
- **DEC-037 — Navegación híbrida Cliente/Familia y Viajes:** confirmado el historial resumido en Clientes/Familias y el acceso al mismo expediente enfocado desde Clientes/Familias o Viajes activos.
- **DEC-038 — Fecha de nacimiento y edad dinámica de viajeros:** confirmado para contacto principal y demás viajeros; otros atributos estructurados quedan en backlog.
- **DEC-039 — Miembros de Cliente/Familia y viajeros por Viaje:** el Cliente/Familia conserva una lista básica de miembros, con nombre, fecha de nacimiento y edad dinámica. El contacto principal es obligatorio para cada Viaje; los viajeros de cada Viaje se seleccionan explícitamente desde los miembros registrados de esa familia. Un miembro no tiene expediente individual en esta etapa y puede no participar en todos los Viajes. Si en el futuro viaja por cuenta propia como contacto principal, se crea un Cliente/Familia nuevo.
- **DEC-040 — Respaldo local y recordatorio:** se planifica un respaldo manual completo en paquete JSON versionado, que incluya configuración y datos, y una exportación operativa en paquete Excel. El sistema registra la fecha/hora de cada respaldo descargado y, tras tres días sin uno, muestra una alerta descartable. La definición de cifrado, ubicación, estructura exacta de archivos y restauración queda para la fase de arquitectura.
- **DEC-040 (precisión de recordatorio):** tras tres días sin respaldo descargado, la alerta puede descartarse; si sigue sin una descarga nueva, reaparece 24 horas después y continúa diariamente hasta registrar un respaldo.
- **DEC-041 — Edad actual y edad al inicio del Viaje:** Cliente/Familia muestra la edad vigente de cada miembro al día de consulta. El expediente de Viaje muestra además la edad proyectada de cada viajero para el inicio efectivo del Viaje, para detectar cambios de categoría por edad. Si no existe fecha efectiva de inicio, esa proyección permanece vacía.
- **DEC-042 — Calendario como acceso al expediente de Viaje:** seleccionar un Viaje desde el calendario abre el mismo expediente enfocado de Viaje que `Clientes/Familias` y `Viajes activos`; el calendario no crea una tercera pantalla de edición.
- **DEC-043 — Relación del miembro con contacto principal:** cada miembro del Cliente/Familia puede registrar una relación sencilla y opcional desde el catálogo configurable `Pareja`, `Madre`, `Padre`, `Hijo`, `Hija` u `Otro`. No se añaden campos adicionales ni expediente individual en esta etapa.
- **DEC-044 — Alta rápida de miembro desde Viaje:** al crear o editar un Viaje, la usuaria puede añadir un miembro nuevo de la familia sin salir del expediente. Al guardar, el miembro queda asociado al Cliente/Familia y puede seleccionarse para el Viaje actual y futuros Viajes.
- **DEC-045 — Archivo de miembros con historial:** un miembro que haya participado en algún Viaje no se elimina de forma destructiva. Puede marcarse como `Archivado` para ocultarlo de nuevas selecciones, sin modificar el historial ni los Viajes existentes.
- **DEC-046 — Contacto principal fijo por Viaje:** al crear el Viaje, el contacto principal se selecciona desde Cliente/Familia y queda establecido para ese Viaje. No se ofrece cambio rutinario durante la operación; una excepción podrá editarse manualmente. Si aún no existe Cliente/Familia, el flujo permite crearlo y continuar con el Viaje.
- **DEC-047 — Reactivación de miembro archivado:** un miembro `Archivado` puede volver a `Activo` mediante una acción explícita de la usuaria, conservando sus datos y participaciones históricas.
- **DEC-048 — Visibilidad de archivados:** los miembros archivados permanecen visibles en la lista de Cliente/Familia con la etiqueta `Archivado`, pero se excluyen de las selecciones nuevas hasta su reactivación.
- **DEC-049 — Tareas manuales, globales y por Proveedor:** una tarea manual requiere título y fecha límite; hora es opcional. Las tareas viven junto a las notas dentro del Viaje y también en un módulo global que reúne tareas de Leads y Viajes. Un Proveedor puede definir plantillas de tareas en Administración; al confirmar su selección dentro de un Servicio/Reserva, el sistema presenta sus tareas sugeridas para que la usuaria elija, ajuste o descarte antes de crearlas, vinculadas al Proveedor de servicio y editables por la usuaria.
- **DEC-050 — Fechas de plantillas de tareas por Proveedor:** una plantilla puede definir fecha relativa al inicio efectivo del Viaje: una cantidad configurable de días o meses antes, el mismo día de inicio o una cantidad configurable de días o meses después del inicio. También puede quedar sin fecha calculada para que la usuaria la asigne según el caso. Al confirmar un Proveedor, las fechas calculadas se muestran como propuesta y la usuaria puede modificarlas, quitar tareas o no crear ninguna.
- **DEC-051 — Tareas relativas al fin del Viaje:** las plantillas de Proveedor también pueden usar como ancla el fin efectivo del Viaje y calcular una cantidad de días o meses antes/después de ese fin. La opción principal para seguimiento posterior será días/meses después del fin; sin fecha efectiva, queda vacía para captura manual.
- **DEC-052 — Protección y revisión de fechas manuales de tareas:** al cambiar una fecha efectiva del Viaje, las tareas de plantilla que aún siguen su regla se recalculan automáticamente. Si la fecha límite de una tarea fue editada manualmente, queda protegida y no se mueve sola. La interfaz muestra una alerta no bloqueante `Revisar fecha: ajustada manualmente` y ofrece `Recalcular con plantilla` o `Editar fecha manualmente`. Recalcular restaura la regla de plantilla; editar/confirma la fecha conserva el ajuste y la marca discreta de fecha manual.
- **DEC-053 — Alertas internas primero, notificaciones externas en roadmap:** el MVP muestra tareas próximas, vencidas y revisiones necesarias dentro del CRM mediante listas, calendario y badges. No solicita permisos ni usa notificaciones nativas del navegador. Se conserva como evolución futura el deseo de notificaciones nativas, WhatsApp e integraciones con otros sistemas de la usuaria.
- **DEC-054 — Lista global y filtros de Tareas:** el módulo global abre agrupado en `Vencidas`, `Hoy`, `Próximas` y `Sin fecha`, mostrando el origen Lead o Viaje. Incluye filtros iniciales por Viaje, intervalo de fechas y Proveedor cuando la tarea se relacione con uno. Los filtros adicionales se incorporarán conforme se validen necesidades reales.
- **DEC-055 — Deshacer al completar una Tarea:** completar una tarea registra su estado y fecha/hora, y muestra un toast temporal —aproximadamente cinco segundos— con la acción `Deshacer`. Mientras el toast esté visible, `Deshacer` revierte el clic y registra la reversión; después, la tarea permanece completada en el historial y puede reabrirse mediante su acción normal.
- **DEC-056 — Versionado de plantillas de tareas:** editar una plantilla de Proveedor solo afecta tareas creadas después del cambio. Las tareas ya generadas conservan un snapshot de la plantilla y su regla original; cualquier ajuste posterior se hace explícitamente en cada tarea.
- **DEC-057 — Calendario operativo unificado:** el Calendario muestra intervalos efectivos de Viajes, vencimientos de Tareas, fechas límite de pago del Cliente y fechas esperadas de Comisión. Cada tipo se puede activar o desactivar mediante filtros independientes; la vista no inventa eventos cuando sus fechas base están vacías.
- **DEC-058 — Apertura contextual desde Calendario:** seleccionar una vez cualquier evento abre el panel lateral aprobado en DEC-149. Desde él se puede abrir explícitamente el Viaje, Tarea, Cliente o Comisión aplicable; el Calendario no crea espacios de edición paralelos ni depende del doble clic.
- **DEC-059 — Vistas del Calendario, sustituida y ampliada por DEC-148:** la vista mensual es la predeterminada. El MVP también ofrece vista semanal y planificación/agenda de intervalos; no incluye vista diaria por horas.
- **DEC-060 — Expediente enfocado de Proveedor:** el módulo mantiene un listado de Proveedores y, al seleccionar uno, abre un panel de detalle con pestañas enfocadas `Datos generales`, `Comisiones` y `Plantillas de tareas`. Solo el contenido de la pestaña activa se muestra a la vez; no se apilan las tres áreas. La lista y navegación global permanecen visibles, pero el detalle evita competencia visual. Los campos concretos de Datos generales se definirán por separado.
- **DEC-061 — Datos generales y resumen de Proveedor:** `Nombre de proveedor` y estado `Activo/Inactivo` son obligatorios. Son opcionales: nombre de contacto, teléfono, correo, notas internas y una o más referencias útiles (una visible por defecto, con alta adicional). Los tipos de servicio son etiquetas múltiples configurables, con valores iniciales `Hoteles`, `Cruceros`, `Renta de coches`, `Actividades o tours`; un Proveedor puede tener una o varias y aparece bajo cada filtro asociado. Datos generales también muestra un resumen de solo lectura de comisión —porcentaje fijo y tasa, o `monto variable por servicio`, participación de agencia y plazo esperado— y el conteo de plantillas de tareas. No usa un monto fijo de comisión a nivel Proveedor.
- **DEC-062 — Inactivación de Proveedor:** un Proveedor inactivo permanece visible en su historial, Viajes existentes y nuevas búsquedas/selecciones, identificado claramente con la etiqueta `Inactivo`. Si la usuaria intenta seleccionarlo para un nuevo servicio, el sistema solicita activarlo explícitamente antes de permitir su uso.
- **DEC-063 — Activación al seleccionar Proveedor inactivo:** el aviso de selección de un Proveedor inactivo ofrece únicamente `Activar y usar` y `Cancelar`. La activación es explícita, queda registrada y permite continuar con el nuevo servicio; cancelar conserva el Proveedor inactivo y no lo agrega.
- **DEC-064 — Estado global tras activar:** `Activar y usar` cambia el estado global del Proveedor a `Activo`, por lo que queda disponible para nuevas selecciones. La usuaria puede volver a marcarlo como `Inactivo` desde Administración sin alterar su historial.
- **DEC-065 — Uso de Proveedor inactivo en servicios existentes:** inactivar un Proveedor no bloquea su consulta ni edición dentro de Servicios o Viajes ya existentes. La restricción de activación previa aplica solo cuando se intenta agregarlo a un Servicio nuevo.
- **DEC-066 — Seguimiento existente al inactivar Proveedor:** inactivar un Proveedor no cancela, pausa ni modifica las Comisiones pendientes ni las Tareas ya generadas en Viajes existentes. Su seguimiento conserva las reglas y fechas que ya tenía.
- **DEC-067 — Buscador global:** el CRM contará con un buscador global, discreto y accesible de forma persistente, para encontrar información por palabra o texto libre. El alcance exacto de entidades, campos, resultados y tratamiento de información sensible queda pendiente de validación.
- **DEC-068 — Alcance y contexto de resultados del buscador global:** el buscador incluye Clientes/Familias, Leads, Viajes, Proveedores, títulos de Tareas y contenido de notas de Cliente/Familia y Viaje. Cada resultado muestra su tipo y contexto de origen —por ejemplo, `Tarea · Viaje a Orlando` o `Nota de viaje · Familia Gómez`— junto con un detalle breve que ayude a identificarlo antes de abrirlo.
- **DEC-069 — Navegación desde buscador global:** seleccionar un resultado abre directamente su contexto de trabajo: una Tarea dentro de su Lead o Viaje, una nota en la sección correspondiente de Cliente/Familia o Viaje, y las demás entidades en su expediente enfocado. No se abre una pantalla de resultado intermedia.
- **DEC-070 — Agrupación de resultados del buscador:** los resultados se muestran inicialmente agrupados por tipo (`Clientes/Familias`, `Viajes`, `Tareas`, `Notas`, `Leads` y `Proveedores`), con coincidencias de todos los grupos visibles y sin exigir filtros manuales en el MVP.
- **DEC-071 — Estado sin coincidencias del buscador:** cuando no hay resultados, el CRM conserva la consulta y muestra un mensaje sencillo como `No encontramos resultados para “septiembre”`, junto con la acción `Limpiar búsqueda`. No inventa sugerencias ni crea registros desde ese estado.
- **DEC-072 — Normalización de búsquedas:** el buscador admite coincidencias parciales y no distingue mayúsculas/minúsculas, acentos/tildes, espacios repetidos ni separadores o signos comunes. En el MVP no corrige automáticamente errores tipográficos ni intenta adivinar términos, para evitar resultados falsos o confusos.
- **DEC-073 — Bilingüismo integral del sistema:** desde el MVP, todo texto controlado por el sistema está disponible en español e inglés: navegación, campos, acciones, estados, mensajes de validación, alertas, diálogos, toasts y etiquetas. Los datos introducidos por la usuaria —incluidas notas— se conservan en el idioma original y no se traducen automáticamente. La elección del idioma predeterminado queda pendiente de validación.
- **DEC-074 — Idioma inicial:** el sistema inicia en español. La usuaria puede cambiar a inglés desde un selector de idioma en Configuración y la preferencia se conserva para futuras sesiones locales.
- **DEC-075 — Idioma separado de formatos operativos:** cambiar entre español e inglés traduce exclusivamente los textos del sistema. Los números conservan coma para miles y punto para decimales; las fechas conservan el orden día-mes-año; y los importes mantienen su moneda y valor registrados. El idioma no adopta formatos regionales automáticos.
- **DEC-076 — Convención numérica de fechas:** las fechas operativas se muestran y capturan en formato fijo `DD/MM/YYYY`, con dos dígitos para día y mes cuando corresponda; cambiar el idioma no lo transforma a `MM/DD/YYYY`.
- **DEC-077 — Formato de fechas para interoperabilidad:** los CSV operativos y de integración exportan fechas con formato ISO `YYYY-MM-DD`, independiente de la interfaz y del idioma. Esta representación es solo de intercambio; no cambia la presentación ni captura `DD/MM/YYYY` del CRM.
- **DEC-078 — Formato de importes para interoperabilidad:** los CSV exportan montos como números puros, sin símbolo monetario ni separador de miles y con punto decimal —por ejemplo, `1234.56`—. Cada importe conserva una columna independiente de moneda con su código ISO-4217.
- **DEC-079 — Codificación de CSV:** los CSV operativos y de integración se generan en UTF-8 con BOM para conservar acentos y caracteres especiales al abrirlos en Excel, manteniendo compatibilidad con el dashboard.
- **DEC-080 — Manifiesto de exportación:** cada paquete de CSV incluye un `manifest.json` con versión de esquema, fecha de exportación, archivos incluidos, conteos de filas y checksum. El manifiesto acompaña al paquete y permite validar integridad antes de cargarlo.
- **DEC-081 — Algoritmo de checksum:** el checksum de cada archivo del paquete se calcula con SHA-256 y se registra en `manifest.json`.
- **DEC-082 — Exclusión total de `TEMPLATE`:** la hoja `TEMPLATE` es únicamente una plantilla histórica y se ignora al 100 % para el análisis del modelo operativo, la migración y cualquier fuente de datos. Su estructura no se usa para completar, corregir ni inferir registros de `Leads`.
- **DEC-083 — Grano de `Leads`:** cada consulta de un cliente potencial o existente crea un Lead independiente desde el primer contacto, aunque no llegue a venta. Un mismo Cliente puede generar múltiples Leads en distintos momentos o para solicitudes distintas; el Lead no se reutiliza ni se transforma en Cliente. Cuando hay venta, el Lead conserva su historial y se vincula al Cliente y al Viaje correspondientes.
- **DEC-084 — Fecha de solicitud histórica desconocida:** si un Lead histórico no conserva `Fecha de solicitud`, se importa con fecha desconocida explícita. No se sustituye por la fecha de envío de cotización, otra fecha disponible ni una estimación; el Lead se conserva y las métricas que requieran su recepción se marcan como no medibles. Los Leads creados en el CRM registran su recepción automáticamente.
- **DEC-085 — Cotizaciones históricas enviadas sin fecha:** para el lote histórico inicial confirmado por la usuaria, cada Lead con `Fecha de envío` vacía representa una cotización que sí fue enviada, pero cuya fecha exacta se desconoce. Se conserva `quote_sent=confirmed_unknown_historical` y la fecha permanece nula; no se crea un evento cronológico `quote_sent`, no se calcula tiempo a cotización y no se genera una Tarea pendiente. La fórmula histórica `Fecha Acción` de 1900 se descarta y el texto de `Acción` se conserva solo como contexto legado. Esta excepción no aplica a Leads nuevos, cuyas acciones registran fecha/hora automáticamente.
- **DEC-086 — IDs internos y vinculación trazable de `Leads` y `Ventas`:** cada fila de `Leads` y cada fila de `Ventas` recibe una clave interna nueva, única y no semántica. El ID calculado del Excel se conserva intacto como `legacy_lead_id`; no se modifica con sufijos. Cada fila conserva `source_sheet`, `source_row` e `import_batch_id`. Las relaciones `Ventas`→`Lead` se resuelven con evidencia independiente —principalmente fechas y campos capturados directamente—; los valores derivados por XLOOKUP no se consideran prueba independiente. Los vínculos inequívocos se aplican y quedan auditados; solo los no resueltos o genuinamente dudosos se presentan a la usuaria para decisión.
- **DEC-087 — Alcance histórico exclusivo de Ana Lu:** para la migración inicial solo se incluyen Leads cuyo `Agente`, normalizado sin distinguir mayúsculas ni espacios, corresponde a `Ana Lu` o `Analu`. Kari, Fabi y cualquier otro agente quedan excluidos con causa `agent_out_of_scope`, conservando `source_row` en el reporte. La exclusión se propaga a las Ventas, Servicios y Comisiones vinculadas a esos Leads para evitar relaciones huérfanas; un Cliente sí puede permanecer si también tiene al menos un Lead incluido de Ana Lu.
- **DEC-088 — Mapeo de `Status` del lote histórico:** después de aplicar DEC-087, `Venta` y `VENTA` se normalizan a `Vendido`; `Cancelado` se conserva como `Cancelado`; y `Lead` se interpreta como `Cancelado` únicamente para esta migración histórica. El único registro `Cotización enviada` queda fuera por pertenecer a un agente excluido. La regla global para Leads nuevos se define en DEC-089.
- **DEC-089 — Estado único `Cancelado` para cierre sin venta:** `Cancelado` reemplaza `Perdido` en todo el CRM como único estado de cierre de una oportunidad sin venta. Conserva motivo y nota opcionales para distinguir si el cliente canceló, eligió otra agencia, no respondió o tuvo una restricción de presupuesto, sin obligar a seleccionar uno. Este cambio aplica a datos nuevos y armoniza DEC-012 y DEC-033.
- **DEC-090 — Origen de adquisición y canal de comunicación son independientes:** `Contacto con WM` del Excel representa `lead.acquisition_source`: cómo la persona conoció a World Memories. `Comunicación` representa `lead.communication_channel`: por qué canal se estableció la conversación. Ambos campos pueden tener el mismo valor sin ser duplicados. Los vacíos históricos de comunicación permanecen desconocidos, sin inferencia. DEC-023 regula solo el catálogo de orígenes; el catálogo futuro de comunicación queda pendiente de validación.
- **DEC-091 — País del Lead como residencia actual:** la columna `País` de `Leads` representa el país donde actualmente vive el contacto. No representa su nacionalidad ni el destino solicitado. Se conserva como `lead.contact_country` y no sobrescribe un atributo de Cliente sin una acción explícita de vinculación o actualización.
- **DEC-092 — Tipo de venta como necesidad principal del Lead:** `Tipo de venta` del Excel representa la clasificación general de la necesidad expresada durante el contacto inicial —por ejemplo, un crucero, Disney o renta de auto— y se mapea a `lead.travel_type_id`. No representa un itinerario ni obliga a capturar los componentes, Proveedores o Servicios/Reservas del Viaje. Esos detalles se incorporan al cotizar y, si hay venta, al registrar la operación correspondiente. Esta decisión concreta el mapeo histórico y refuerza DEC-022.
- **DEC-093 — Destino como intención inicial del Lead:** `Destino` de `Leads` se conserva como `lead.destination_summary`, texto libre de la intención expresada durante el primer contacto. Puede incluir una región, varios destinos o estar todavía por definir. No se normaliza forzosamente ni se trata como el itinerario, una Reserva o el destino definitivo del Viaje; esos detalles se incorporan después, si corresponde.
- **DEC-094 — Validación de pasajeros antes de migración:** en el perfil actual no existen inconsistencias calculables entre la fórmula `Pax` y `Adultos`+`Niños`. Si una futura ejecución del lote detecta una diferencia, debe generar la advertencia `passenger_count_mismatch` con `source_sheet` y `source_row` antes de importar. No se corrige, infiere ni convierte silenciosamente el conteo; la usuaria revisa la advertencia antes de confirmar la migración.
- **DEC-095 — Moneda obligatoria para carga final salvo cancelación histórica:** de los cinco vacíos históricos de `Moneda` en `Leads`, cuatro pertenecen a registros `Cancelado` y se aceptan como excepción sin operación monetaria. El vacío restante debe completarse antes de generar el CSV final. Un Lead `Vendido` siempre requiere código de moneda ISO-4217; cualquier moneda vacía que no corresponda a la excepción histórica bloquea la confirmación de la carga hasta corregirse.
- **DEC-096 — Cotización histórica única sin reconstrucción de revisiones:** la columna `Cotización` conserva el importe cotizado al cliente, en la moneda del Lead. Puede corresponder a una cotización ajustada, pero el Excel no identifica versiones ni fechas de cada cambio. La migración importa un único `quote.quoted_amount` histórico y no inventa revisiones, versiones o eventos de ajuste. El importe vendido final se conserva desde sus datos de Venta/Servicio y permanece conceptualmente separado.
- **DEC-097 — Comisión proyectada al 100% y excepción fija de 80%:** `Comisión proyectada` representa la comisión bruta estimada al 100%. `Comisión @ 80%` se recalcula desde esa base y la participación configurada cuando su fuente es fórmula. El perfil muestra 148 fórmulas y 8 celdas sin fórmula; antes de la carga final se clasifican estas últimas por `source_row`, después del filtro de agente. Si son importes fijos, se conservan como excepciones históricas con procedencia y no se recalculan. No se presupone que pertenezcan al alcance hasta verificarlo.
- **DEC-098 — Presupuesto histórico y campo disponible sin valor obligatorio:** `Presupuesto` representa el monto comunicado por el cliente para una consulta concreta. La migración carga su resultado numérico si proviene de fórmula, su valor fijo si existe, o un vacío histórico si no existe; nunca carga expresiones de Excel. Para Leads nuevos, el campo está siempre disponible y puede completarse después de la captura inicial, pero su valor no es obligatorio: puede permanecer vacío incluso al cotizar o marcar el Lead `Vendido`.
- **DEC-099 — Duración histórica sin fórmulas:** `# Noches` se importa como el resultado numérico evaluado cuando proviene de una fórmula, o como valor numérico fijo cuando la fuente lo contiene. La migración no exporta ni persiste fórmulas de Excel.
- **DEC-100 — Tiempo de envío calculable solo con ambas fechas:** `Tiempo de envío` se calcula y se carga como métrica numérica histórica únicamente si existen `Fecha de solicitud` y `Fecha de envío`. Si falta cualquiera de las dos, queda vacío/no medible y no se inventa pasado. La migración no exporta ni persiste la fórmula de Excel.
- **DEC-101 — Notas históricas vinculadas al Lead sin automatización de texto:** cada valor no vacío de `Notas` en la hoja `Leads` se importa como una nota vinculada al Lead de esa fila, conservando `source_row`. El texto permanece como contexto histórico y no se interpreta para crear Tareas, estados, métricas ni campos estructurados.
- **DEC-102 — Comisión 80% fija de `Ventas` se conserva:** en `Ventas`, las celdas de `Comisión 80%` cuya fuente es fórmula se recalculan desde la comisión bruta y la participación aplicable; las no formuladas se conservan como importes históricos fijos, con `source_row` y procedencia, y no se sustituyen por un cálculo nuevo. La entrega anterior tenía 9 casos; la fuente actual tiene 10, incluido el registro añadido. La validación técnica solo bloquea valores vacíos o no numéricos y reporta contradicciones; no altera silenciosamente un importe fijo válido. El filtro de agente se aplica antes de producir el lote final.
- **DEC-103 — Estados históricos de comisión de `Ventas`:** `Status` de `Ventas` no cambia el estado del Servicio/Reserva. `Comisión pagada` se importa como Comisión `Pagada` con `paid_on` vacío y `paid_date_status=unknown_historical` cuando no existe una fecha real comprobable; no se inventa evento de pago. `Tracking form - Ok` se importa como Comisión `Pendiente` con contexto histórico `tracking_registered`. `Where is my Commission` se importa como Comisión `Pendiente` con contexto histórico `collection_follow_up`. Se conserva además el texto original y `source_row` para trazabilidad. El valor nuevo `Clientes por viajar` queda pendiente de decisión separada.
- **DEC-104 — `Clientes por viajar` en `Ventas.Status`:** representa un Servicio/Reserva ya `Vendido` cuyo viaje aún no finaliza. La Comisión se importa como `Pendiente` con contexto histórico `trip_not_completed`; todavía no es exigible, no genera seguimiento/reclamo ni pago, y no se marca como vencida. Se conserva el texto original y `source_row` sin crear fechas o eventos inexistentes.
- **DEC-105 — Importes financieros históricos desconocidos en `Ventas`:** seis filas con `Costo final` y/o `Comisión 100%` faltantes o no convertibles se conservan como Servicios/Reservas históricos. Los importes ausentes se marcan `unknown_historical`; no se reemplazan por cero, no se asumen como `sin comisión` y no generan un cálculo financiero inventado. La fila cuyo `Costo final` es texto no convertible permanece en el reporte de corrección antes de cerrar el CSV final. Cada excepción conserva `source_row` y procedencia.
- **DEC-106 — Vínculo histórico resuelto por coincidencia de tipo y fecha:** `Ventas.source_row=5` se vincula al Lead `source_row=7`. Comparten tipo y fecha de fin; la fecha de inicio difiere solo dos días. El otro candidato con el mismo ID legado queda descartado porque sus fechas difieren alrededor de 300 días y pertenece al agente fuera de alcance. Esta resolución conserva ambos `source_row` como evidencia y no altera el ID legado.
- **DEC-107 — Vínculos históricos confirmados por revisión visual:** se vinculan `Ventas.source_row=37,38,39,40` al Lead `source_row=70`; `Ventas.source_row=136` al Lead `source_row=122`; `Ventas.source_row=137` al Lead `source_row=119`; y `Ventas.source_row=154` al Lead `source_row=129`. Cada vínculo conserva el ID legado y los dos `source_row` como trazabilidad. Las filas 44 y 46 permanecen pendientes porque sus dos Leads candidatos pertenecen al mismo Viaje y se debe confirmar la cardinalidad correcta antes de asignar un Lead principal por Servicio.
- **DEC-108 — Varios Leads pueden pertenecer al mismo Viaje:** un Viaje puede vincular varios Leads que terminaron coordinándose para el mismo viaje. Los Leads conservan sus historiales independientes; el Viaje reúne sus Servicios/Reservas y no obliga a asignar cada Servicio a un único Lead principal. En el caso histórico, `Ventas.source_row=44,46` pertenece a un único Viaje que vincula los Leads `source_row=72,78`. La relación se conserva con trazabilidad por fila y sin modificar IDs legados.
- **DEC-109 — Pasajeros y duración tienen alcance explícito:** `trip.traveler_count` representa el total del Viaje. Cada Servicio/Reserva puede conservar su propio desglose de adultos, niños y total de pasajeros cuando agrupa solo una parte de los viajeros; no se exige que el desglose de una Reserva sume al total del Viaje. En las filas históricas 190 y 191, los subconjuntos 4 y 3 suman el total 7 del Viaje. La duración conserva valor y unidad: una renta de auto puede ser 6 `días de servicio` aunque las fechas difieran por 5 noches. No se fuerza el término ni el cálculo de `# Noches` a servicios que no son de alojamiento.
- **DEC-110 — Tipo de venta de `Ventas` es tipo de Servicio/Reserva:** `Leads.Tipo de venta` conserva la necesidad principal inicial de la consulta; `Ventas.Tipo de venta` clasifica cada Servicio/Reserva vendido y puede diferir del Lead. Se mapea a un catálogo configurable `service.type_id`, que incluye categorías históricas como Hotel, Crucero, Renta auto, Boletos/experiencias, Paquetes y equipo de movilidad cuando corresponda. No sustituye ni recalcula el tipo principal del Lead.
- **DEC-111 — Destino manual de `Ventas` tiene prioridad en el Servicio/Reserva:** `Leads.Destino` conserva la intención inicial de la consulta. Cuando `Ventas.Destino` proviene de XLOOKUP, se considera contexto heredado; cuando es un valor manual, representa el destino efectivo del Servicio/Reserva y se conserva en `service.destination` sin modificar el destino histórico del Lead.
- **DEC-112 — Titular manual de `Ventas` pertenece a la Reserva:** una `Persona titular` traída por XLOOKUP es contexto del contacto del Lead. La única fila con valor manual representa el titular de esa Reserva concreta y se conserva en `service.reservation_holder_name`; puede ser una persona distinta del contacto del Lead. No crea ni sustituye automáticamente un Cliente, ni modifica el Lead de origen.
- **DEC-113 — Catálogo inicial de Proveedores nace del histórico:** la carga masiva inicial crea los Proveedores a partir de los valores históricos de `Ventas.Proveedor`, con trazabilidad de procedencia. El catálogo auxiliar `DROP DOWNS` sirve como evidencia auxiliar, no como prerequisito de existencia. Después de la carga se realizará una limpieza controlada de nombres, datos predeterminados y duplicados potenciales; no se inventan consolidaciones durante la migración inicial.
- **DEC-114 — Proveedores monomoneda o multimoneda:** un Proveedor puede aceptar una o varias monedas. La carga inicial detecta las monedas observadas por Proveedor en el histórico y configura el conjunto permitido correspondiente; por ejemplo, `International Cruises` queda multimoneda si sus ventas históricas usan USD y MXN. En cada Servicio/Reserva se selecciona la moneda efectiva entre las permitidas para ese Proveedor. Una moneda elegida en un Servicio no modifica el catálogo permitido del Proveedor.
- **DEC-115 — Moneda obligatoria antes de guardar un importe:** al asignar o editar un importe de un Proveedor dentro de un Servicio/Reserva, la usuaria debe seleccionar primero una moneda permitida por ese Proveedor. No se asigna una moneda automática ni se puede guardar el importe sin moneda. Si el Proveedor admite una sola moneda, esta se presenta como única opción a confirmar; si admite varias, por ejemplo USD y MXN, se debe elegir explícitamente una para ese importe.
- **DEC-116 — Grano histórico de `Ventas`: una fila por componente de Proveedor:** para la migración, cada fila de `Ventas` representa un componente vendido de un Proveedor, con su tipo, fechas, destino, importe final, moneda y comisión. Varias filas del mismo Cliente o Viaje representan servicios/proveedores separados; no son evidencia de un único Servicio/Reserva con varios Proveedores. La relación `service_provider` se crea por fila y solo se agrupa bajo un mismo Servicio/Reserva cuando exista evidencia independiente de que corresponde a la misma reserva. Esta decisión precisa y sustituye el grano de importación de DEC-005.
- **DEC-117 — Fecha de pago con tarjeta del cliente:** `Ventas.Fecha de pago (tarjeta cliente)` es el día efectivo en que se realizó el pago en la plataforma con la tarjeta del cliente para ese componente de Proveedor. Se importa como `service_provider.customer_card_paid_on`, una fecha histórica real de cobro; no es una estimación, fecha administrativa ni fecha de pago de Comisión.
- **DEC-118 — Tracking Form como referencia oficial de Comisión:** `Ventas.Tracking Form #` es el número oficial que genera la plataforma al subir el formulario o *commission report*. Identifica el registro con el que se da seguimiento a la Comisión futura de ese componente de Proveedor. Se importa como `commission.tracking_reference`; puede existir mientras la Comisión sigue pendiente y no equivale al pago con tarjeta del cliente ni al pago real de Comisión.
- **DEC-119 — Número de itinerario como localizador de Reserva por Proveedor:** `Ventas.# de itinerario` es el número de reservación que arroja la plataforma del Proveedor para ese componente. Se importa como `service_provider.booking_reference`; puede permanecer vacío legítimamente cuando todavía no existe una reserva y no se inventa ni se deduce.
- **DEC-120 — Notas históricas por componente de Proveedor:** cada valor no vacío de `Ventas.notas` se conserva como una nota vinculada al componente de Proveedor de su fila, con `source_row`. El texto es solo contexto operativo histórico: no crea ni modifica automáticamente estados, fechas, importes, Comisiones, Tareas o relaciones.
- **DEC-121 — `Concepto` de Ventas no se migra:** `Ventas.Concepto` es un valor fijo calculado como `Venta` que solo repite la entidad ya determinada por la hoja. No se persiste ni se exporta al paquete CSV inicial.
- **DEC-122 — `DROP DOWNS` se clasifica por función, no se importa como una sola fuente:** `Tipo de Venta` es semilla del catálogo configurable de tipos de Servicio/Reserva y de clasificación general de Lead; `USD`, `MXN` y `EUR` son candidatos del catálogo global de monedas. La tabla de Proveedores aporta nombres, moneda y porcentajes solo como referencia auxiliar: el catálogo inicial se crea desde `Ventas` conforme DEC-113 y sus monedas permitidas se obtienen del histórico conforme DEC-114. Las listas de acciones, estados de venta, origen de contacto y `Concepto`, así como la secuencia 0–10 y `TODAY()`, son ayudas heredadas; no controlan estados o automatizaciones del CRM ni se migran como datos transaccionales. Las diferencias de nombres de Proveedor se reportan para revisión, sin consolidación automática.
- **DEC-123 — `InterCruises` e `International Cruises` son Proveedores distintos:** aunque sus nombres son similares, representan dos Proveedores diferentes. Se crean y se mantienen como registros independientes durante la carga inicial y en el CRM; no se registra alias ni regla de consolidación entre ellos.
- **DEC-124 — `Datos Clientes` es el directorio maestro histórico y se migra sin enriquecimiento:** cada fila de `Datos Clientes` crea un Cliente maestro independiente, conservando sus valores y `source_row` de origen. La carga inicial no busca coincidencias, no deduplica, no fusiona registros ni completa/sobrescribe campos usando Leads, Ventas u otra fuente. País, ciudad, celular, correo, dirección, cuenta Disney, personaje favorito y fecha de nacimiento se conservan como valores históricos de ese directorio; los datos de cuenta permanecen separados de los datos del Lead.
- **DEC-125 — Cierre de fuentes restantes del libro:** después de `Leads`, `Ventas`, `Datos Clientes` y `DROP DOWNS`, ninguna hoja restante aporta una nueva entidad operativa al CRM inicial. `Hoja1`, `Detail1`, `PnL` y `TEMPLATE` son vistas, duplicados o plantillas; `PTC Evolution` está desactualizada; `REFERIDOS PALACE` y `Certificaciones` no contienen registros operativos; e `Inversiones`, `Cuentas Banco`, `REGINA RRSS`, `GASTOS WM ANALU`, `Wish list` y `Usuarios` quedan fuera del alcance operativo inicial. No se crean CSV para estas hojas.
- **DEC-126 — Flujo de consulta hasta primera cotización:** el Lead nace en el canal de adquisición original, pero la conversación operativa puede trasladarse a WhatsApp sin perder ese origen. Antes de iniciar `Cotización en preparación`, la agencia recaba por WhatsApp las fechas y su flexibilidad, si ya existen vuelos, el tipo/contexto del viaje y las edades de menores cuando corresponda. Las llamadas no forman parte del proceso previo a la venta: dudas y ajustes se atienden por mensajes o notas de voz de WhatsApp. La cotización se prepara en PDF; el hito y estado `Cotización enviada` se registran únicamente al enviar ese PDF al cliente por WhatsApp. Las edades de menores deben poder capturarse antes de cotizar; la forma exacta de conservarlas queda pendiente de la siguiente validación de dominio.
- **DEC-127 — Primer seguimiento automático de cotización:** al confirmar el envío de la primera cotización en PDF, el CRM crea una Tarea interna de seguimiento con fecha límite a los 4 días calendario. La tarea puede editarse, reprogramarse o completarse por Lead; es una ayuda operativa y no envía mensajes ni notificaciones externas automáticamente.
- **DEC-128 — Conversión al primer cobro exitoso:** una aceptación verbal de cotización no convierte el Lead. El Lead pasa a `Vendido` cuando la agencia confirma el primer cobro exitoso con tarjeta del cliente para una reserva, aunque sea un anticipo parcial. La conversión crea o vincula el Cliente y crea el Viaje, conservando el Lead y registrando el hito de cobro; después se pueden agregar más componentes de Proveedor y pagos pendientes. Si posteriormente el viaje se cancela, se registra como cancelación del Viaje conforme a sus políticas, sin revertir ni borrar la venta histórica.
- **DEC-129 — Control de pagos parciales del cliente:** cada cobro confirmado del cliente se registra como un movimiento separado, con importe, moneda, fecha efectiva y componente de Proveedor correspondiente. El primer movimiento puede ser `anticipo` y los posteriores cubren pagos adicionales o saldo. El total pagado y el saldo pendiente se derivan desde los movimientos y el importe final del componente; no se capturan de nuevo manualmente. Solo el primer cobro exitoso dispara la conversión del Lead.
- **DEC-130 — Fecha límite de saldo manual por componente:** cuando existe saldo pendiente, su fecha límite se captura manualmente en el componente de Proveedor correspondiente porque depende de la política de cada reserva. Puede quedar vacía mientras se desconozca; el CRM no calcula, presupone ni sugiere una fecha predeterminada.
- **DEC-131 — Alertas escalonadas para saldo pendiente:** al guardar una fecha límite de saldo, el CRM deriva alertas internas vinculadas al componente de Proveedor a 30, 7 y 1 días antes, y el mismo día límite. Estas alertas son editables y aparecen en las listas internas, calendario y badges del CRM; no envían mensajes externos automáticamente.
- **DEC-132 — Conciliación manual de Comisiones de Archer:** el pago de una Comisión no se infiere de la reserva ni del pago del cliente. Cuando Archer realiza un depósito quincenal, la usuaria consulta su sistema, identifica manualmente las Comisiones correspondientes mediante `commission.tracking_reference` y confirma cada una como `Pagada` con su fecha e importe real. La fecha esperada de toda Comisión no puede ser posterior a 90 días calendario después del fin efectivo del Viaje; un Proveedor puede definir un plazo anterior. Si la Comisión sigue pendiente al superar su fecha esperada, el CRM debe mostrar y permitir gestionar un seguimiento interno `Where’s My Commission`. El CRM no inicia sesión en Archer, no concilia depósitos automáticamente y no envía ni presenta el formulario externo por sí solo.
- **DEC-133 — Alerta y Tarea de Comisión vencida:** cuando una Comisión pendiente llega a su fecha esperada, el CRM crea una `Task` interna `Subir Where’s My Commission Form`, vinculada a la Comisión y al Viaje, con vencimiento ese mismo día. La Tarea genera las alertas internas habituales —listas, calendario y badges—, es editable y la usuaria puede completarla. No transmite datos ni envía el formulario a Archer.
- **DEC-134 — Cancelación posterior a una venta y reembolso según política:** una cancelación posterior a `Vendido` conserva los pagos y la venta históricos; no revierte ni borra registros. La agencia gestiona la cancelación, pero el Proveedor procesa el reembolso directamente al Cliente. La elegibilidad, importe reembolsable y penalización se determinan manualmente según la política vigente del Proveedor o Reserva y la anticipación respecto a la salida o fecha aplicable; no existe una fórmula global. Ejemplos operativos actuales: un crucero puede ser reembolsable al 100 % antes de 90 días de salida; Agent Car puede aplicar una penalización del 10 %; algunas tarifas de Expedia son no reembolsables y otras dependen de una fecha límite. El CRM debe conservar la cancelación y su resultado confirmado sin convertir esos ejemplos en reglas universales.
- **DEC-135 — Cancelación por componente y efecto en Comisión:** una cancelación puede afectar solo uno o varios componentes de Proveedor sin cancelar por ello los demás componentes del Viaje. Si el Proveedor reembolsa un componente cancelado, su Comisión se marca `Cancelada` y no se espera ni se persigue su cobro. Si el componente ya no es reembolsable, su Comisión conserva seguimiento cobrable. En Agent Car, una cancelación con reembolso parcial del 90 % y penalización retenida del 10 % también deja la Comisión `Cancelada`: la penalización pertenece íntegramente al Proveedor y no es base comisionable para World Memories. Otros reembolsos parciales requieren confirmar manualmente el resultado de Comisión antes de cerrarla.
- **DEC-136 — Administración de plantillas de Proveedor en el MVP:** el MVP incluye una administración para que la usuaria cree, edite, active o desactive sus propias plantillas de tareas por Proveedor. Las plantillas definen tareas y fechas relativas; no requieren modificación de código ni un inventario completo de procesos antes de empezar. Las tareas ya creadas conservan su snapshot y no cambian retroactivamente al editar la plantilla.
- **DEC-137 — Sugerencia controlada al seleccionar Proveedor:** el MVP no implementa un motor que detecte componentes o condiciones complejas del Viaje. Al confirmar la selección de un Proveedor dentro de un Servicio/Reserva, muestra sus tareas de plantilla como sugerencias. La usuaria puede seleccionar solo las aplicables, eliminar las demás y editar títulos o fechas antes de confirmar. Solo entonces se crean las Tareas; se preservan como snapshot y siguen siendo editables. El modelado de componentes y activación automática por condiciones queda fuera del MVP.
- **DEC-138 — Finalización automática de Viaje:** al iniciar el día calendario siguiente a `trip.effective_end_on`, el CRM marca automáticamente el Viaje como `Completado` y registra el evento correspondiente, sin pedir confirmación ni fecha manual. Esta transición habilita el seguimiento de sus Comisiones pendientes. La fecha esperada de Comisión conserva su cálculo ya definido desde el fin efectivo del Viaje, no agrega un día adicional.
- **DEC-139 — Prioridades del dashboard operativo del MVP:** la pantalla inicial prioriza cuatro colas de trabajo: (1) Viajeros en curso, identificados por el intervalo efectivo actual del Viaje; (2) Viajes próximos con inicio en el mes calendario actual o siguiente, mostrando estatus y acciones pendientes; (3) trabajo comercial, reuniendo seguimientos de Leads y cotizaciones iniciadas aún no enviadas; y (4) Comisiones vencidas. Esta última muestra un contador y detalle mínimo de Cliente/Viaje, Proveedor, fecha esperada y días de atraso. Cada registro abre su contexto de trabajo; el dashboard no sustituye los expedientes ni agrega métricas financieras no solicitadas como prioridad inicial.
- **DEC-140 — Acciones y prioridad de Tareas en dashboard:** las Tareas pendientes se ordenan y agrupan con `Vencidas` antes de `Hoy`, `Próximas` y `Sin fecha`; la misma prioridad se refleja en las listas del dashboard cuando muestren acciones pendientes. Desde el dashboard, la usuaria puede completar o reprogramar una Tarea sin abrir un expediente separado. Ambas acciones conservan su evento y trazabilidad; el resto del registro permanece accesible al abrir su Lead o Viaje.
- **DEC-141 — Sin almacenamiento documental en el MVP:** el MVP es un dashboard local de datos estructurados, con carga y descarga de datos tabulares y respaldo JSON versionado. No guarda adjuntos ni contenido de PDF de cotizaciones, confirmaciones o vouchers; puede registrar el hito operativo de que una cotización fue enviada, sin conservar su archivo. El almacenamiento documental queda explícitamente para una evolución posterior con una base de datos adecuada.
- **DEC-142 — Paquete CSV canónico para carga y migración inicial:** el MVP recibe únicamente paquetes CSV estructurados y versionados con `manifest.json`; Excel se genera solo como exportación operativa y JSON se reserva para respaldo/restauración. Cuando la usuaria entregue la versión más reciente del libro histórico, se realizará una conversión única y trazable hacia ese mismo paquete CSV canónico, aplicando las reglas históricas ya validadas y generando su reporte de calidad. No habrá un flujo especial de importación directa de Excel en el dashboard: así la carga inicial y las futuras comparten el mismo contrato de datos y validaciones.
- **DEC-143 — Recordatorio de respaldo descargado:** el dashboard conserva la fecha y hora de la última descarga exitosa del paquete JSON de respaldo. Si transcurren tres días calendario sin una nueva descarga, muestra un recordatorio visible y descartable en el dashboard. Una exportación operativa a Excel no reinicia ese contador: el recordatorio busca asegurar una copia restaurable de los datos.
- **DEC-144 — Experiencia local sin infraestructura operativa:** el MVP debe abrirse desde un icono local y usarse en el navegador sin cuenta, backend, servidor remoto ni administración técnica cotidiana. Los datos estructurados tendrán como candidata principal a IndexedDB, no Local Storage. La forma exacta de empaquetar y abrir la aplicación se valida en Fase F: debe preservar esa experiencia de doble clic y resolver de manera fiable el origen del navegador, la persistencia y los respaldos, sin exigir que la usuaria levante o gestione un servidor.
- **DEC-145 — Calendario operativo del MVP:** el MVP incluye una vista de calendario visualmente cuidada para consultar los hitos y acciones operativas por fecha. Su diseño, fuentes de eventos, filtros y acciones se definirán dentro del alcance de pantallas; no reemplaza las colas priorizadas del dashboard ni crea automatizaciones adicionales por sí solo.
- **DEC-146 — Manual de marca como fuente visual:** el diseño del CRM debe seguir el manual `WORLD MEMORIES PROPUESTAS COLOR USOS.pdf`, entregado por la usuaria. Sus colores primarios son azul `#00AEEF` y amarillo `#FDB913`; los secundarios son amarillo suave `#F9D565`, naranja `#FFA33B`, azul oscuro `#276BBA` y turquesa `#00B3D6`. El manual también define variantes de logotipo positivo, negativo y a color. La composición de pantallas, tipografía, contraste accesible y roles semánticos de color se concretarán en la fase de diseño sin alterar esta paleta ni su uso de marca.
- **DEC-147 — Fuentes y representación del calendario:** el calendario del MVP muestra Tareas, fechas límite de pago y vencimientos de Comisión como hitos puntuales. Cada Viaje se muestra como un bloque continuo desde su inicio efectivo hasta su fin efectivo, ocupando todos los días de su intervalo, como un compromiso de varios días; no se representa solo con dos marcas aisladas de inicio y fin.
- **DEC-148 — Vistas del calendario:** el calendario del MVP ofrece vista mensual, vista semanal y una vista de planificación/agenda. La agenda presenta los eventos continuos como una secuencia legible de intervalos —por ejemplo, un Viaje del 10 al 16— sin cuadrícula de horas ni vista diaria independiente. Las tres vistas consultan las mismas fuentes y mantienen el enlace al contexto del Viaje, Tarea, pago o Comisión.
- **DEC-149 — Interacción de eventos del calendario:** un clic en cualquier evento abre un panel lateral de resumen, no navega de inmediato ni depende de doble clic. El panel muestra el contexto relacionado y ofrece acciones explícitas para abrir la Tarea, Viaje, Cliente o Comisión correspondiente, según aplique. Se evita asignar un doble significado al doble clic y se mantiene una ruta clara y accesible hacia cada expediente.
- **DEC-150 — Idioma inicial:** el idioma predeterminado del CRM es español. La interfaz ofrece un selector para cambiar a inglés; el cambio afecta únicamente los textos controlados por el sistema y no traduce automáticamente los datos capturados por la usuaria.
- **DEC-151 — Buscador global del MVP:** el CRM incluye un buscador global persistente y accesible para localizar Clientes, Leads, Viajes, Proveedores, Tareas y Comisiones desde una sola caja. Debe encontrar texto y referencias operativas relevantes —por ejemplo, nombre, destino, proveedor, número de reservación y `Tracking Form #`— y mostrar resultados agrupados por entidad con acceso directo a su contexto. No sustituye los filtros especializados de cada módulo.
- **DEC-152 — Búsqueda dentro de notas:** el buscador global también encuentra coincidencias dentro del contenido de las notas de Leads y de la nota de trabajo del Viaje. Los resultados identifican la entidad vinculada y muestran el contexto mínimo de la coincidencia antes de abrirla; las notas no se traducen ni se convierten en datos estructurados por buscarse.
- **DEC-153 — Módulo Datos y respaldos del MVP:** el MVP concentra las operaciones de datos en un único módulo accesible: importar paquetes CSV estructurados, exportar datos operativos a Excel, descargar y restaurar respaldos JSON versionados, y consultar fecha/hora del último respaldo descargado. Las operaciones conservan sus validaciones, vista previa, confirmación y trazabilidad; el módulo hace visible el recordatorio de respaldo cuando corresponda.
- **DEC-154 — Navegación principal del MVP:** la navegación principal contiene Dashboard, Leads, Clientes, Viajes, Calendario, Tareas, Comisiones, Proveedores, Datos y respaldos, y Configuración. Esta estructura es el mapa base de pantallas: los registros relacionados se abren desde sus módulos y enlaces contextuales, sin crear una sección de Ventas separada de los Viajes/Servicios. La sustitución de Comisiones por Finanzas fue reabierta y no modifica esta navegación hasta una nueva aprobación.
- **DEC-155 — Centro de notificaciones interno:** el MVP incluye una campana de notificaciones con contador y lista interna para alertas operativas: Tareas vencidas, pagos próximos o vencidos, Comisiones vencidas y recordatorio de respaldo. Cada notificación abre su contexto de trabajo y no sustituye las colas del dashboard. En el MVP son avisos internos; no envían correos ni mensajes externos.
- **DEC-156 — Automatizaciones externas como evolución viable:** en una evolución con infraestructura conectada, los eventos internos de Tareas y alertas podrán ser fuente de flujos externos configurables, como correo electrónico o integraciones con servicios de automatización. Es técnicamente viable, pero requiere una capa de integración persistente y configuración de la cuenta/proveedor; por ello queda fuera del MVP local. El modelo conservará eventos y relaciones claras para no cerrar esa posibilidad, sin que los avisos internos dependan de ella.
- **DEC-157 — Persistencia de notificaciones hasta resolución:** abrir o leer una notificación no la elimina del contador ni la considera resuelta. Permanece activa hasta que la acción asociada se complete, se reprograme o el asunto se resuelva explícitamente; entonces el sistema la cierra y actualiza el contador. Esto aplica a alertas de Tareas, pagos y Comisiones. Para el recordatorio de respaldo, descargar el JSON lo resuelve; conserva la opción ya aprobada de descartarlo temporalmente, sin que ese descarte cuente como respaldo ni reinicie su plazo.
- **DEC-158 — Límite entre Proveedores y Configuración:** el módulo Proveedores es dueño de toda configuración que varía por Proveedor: datos generales, monedas permitidas, reglas de Comisión y plantillas de Tareas. Al abrir un Proveedor, la usuaria puede ver y modificar esas reglas en sus propias secciones/pestañas, sin navegar a Configuración ni seguir enlaces intermedios. Configuración conserva solo catálogos y preferencias globales compartidas —por ejemplo, tipos de viaje, fuentes de adquisición, canales de comunicación, idioma y formatos—; no contiene una segunda gestión de Proveedores.
- **DEC-159 — Línea de tiempo conectada de Lead y Viaje:** cada evento conserva una única entidad de origen y no se copia al convertir un Lead. La línea de tiempo del Lead muestra sus eventos propios. La del Viaje compone, en orden cronológico, sus eventos propios y los eventos de todos sus Leads vinculados, identificando su origen. Los cambios de estado actualizan solo la entidad correspondiente y registran el evento en la misma operación; la línea de tiempo es historial de hechos confirmados, no un motor que altere estados. Esto permite que varios Leads vinculados al mismo Viaje conserven su historia sin duplicación ni conflicto.
- **DEC-160 — Línea de tiempo agregada de Cliente:** el expediente de Cliente muestra una línea de tiempo agregada de los eventos pertenecientes a sus Leads y Viajes vinculados, ordenados cronológicamente y etiquetados con su origen. Es una proyección de lectura sobre los mismos eventos existentes: no crea copias ni modifica entidades, estados o relaciones.
- **DEC-161 — Escritorio completo primero; móvil posterior:** el MVP se diseña y valida exclusivamente como experiencia completa de escritorio. No se promete operación móvil, PWA ni sincronización entre dispositivos en esta etapa. Con almacenamiento local IndexedDB, cada navegador/dispositivo mantendría datos separados; una experiencia móvil que actualice el escritorio requiere una evolución posterior con sincronización/base de datos. La futura interfaz móvil ligera queda mapeada, pero no se implementa ni condiciona el MVP actual.
- **DEC-162 — Dashboard como fotografía operativa actual:** el Dashboard es la página de inicio y presenta un saludo junto con la situación vigente al día de hoy: colas de acción, prioridades e indicadores clave comerciales, operativos y financieros. No incluye filtros de periodo, rangos personalizados, tendencias ni gráficos históricos. Las tarjetas se calculan solo desde datos estructurados confirmados, abren hacia su detalle y muestran los importes separados por moneda, sin sumar ni convertir monedas distintas.
- **DEC-163 — KPIs actuales del Dashboard:** el MVP muestra únicamente este conjunto inicial: (1) Comercial: Leads activos, cotizaciones por enviar y cotizaciones en seguimiento; (2) Operación: Viajeros en curso, próximos Viajes y Tareas pendientes/vencidas; (3) Finanzas: saldos vigentes de Clientes por cobrar, Comisiones esperadas pendientes, Comisiones vencidas y Comisiones cobradas en el mes calendario actual. Todos reflejan el estado vigente y los financieros se separan por moneda. Conversión sale del Dashboard porque requiere un periodo/cohorte y pasa a Insights futuro; no se añaden otros KPIs por ahora.
- **DEC-164 — Módulo Insights como evolución posterior:** una sección futura `Insights` concentrará análisis históricos con selector de periodo y moneda, tarjetas KPI, detalle navegable y un conjunto inicial definido sin entrevista adicional: tendencia mensual de Leads y ventas; conversión por cohorte de Leads; evolución de Comisiones esperadas frente a pagadas por moneda; distribución del pipeline; tiempos promedio y mediana de pago por Proveedor; y salud de seguimiento mediante Tareas vencidas/completadas. Usará barras para comparaciones, líneas para tendencias y tablas ordenadas para Proveedores; no incluye dispersión inicialmente. Cuando falten fechas históricas, mostrará `no medible` en vez de inferir. Es viable con los eventos y movimientos fechados del modelo, pero queda fuera del MVP y no condiciona la página inicial.
- **DEC-165 — Descartada para el MVP: sustitución de Comisiones por Finanzas:** la propuesta de sustituir `Comisiones` por `Finanzas` se reabrió y quedó descartada para el MVP el 2026-08-25. Un nombre más amplio no aporta valor si solo renombra datos que ya pertenecen a Comisiones o Viajes.
- **DEC-166 — Comisiones en el MVP; Finanzas condicional posterior:** el MVP conserva un módulo `Comisiones` dedicado al dinero que World Memories espera recibir o ya recibió de Proveedores/Archer: esperadas, próximas, vencidas y pagadas; importe esperado y real, moneda, fechas, Proveedor, Viaje y `Tracking Form #`, con totales por moneda. Los pagos del Cliente y saldos de viaje permanecen en Viajes/Servicios y sus vistas operativas, porque no son ingreso de World Memories. No se compromete un módulo futuro Finanzas: solo se creará si aporta un límite realmente distinto —por ejemplo, gastos, movimientos bancarios, impuestos, flujo de efectivo o rentabilidad—; de lo contrario, la evolución será un módulo Comisiones más avanzado.
- **DEC-167 — Aprobación formal y cierre de Fase E:** el 2026-08-25 la usuaria aprobó formalmente el alcance consolidado del MVP descrito en `PRD.md` y `SCREEN_MAP.md`. La Fase E queda cerrada y el proyecto pasa a Fase F — Arquitectura y plan. Esta aprobación no autoriza implementación: todavía se requiere completar Fase F y obtener la aprobación inequívoca de Fase G.
- **DEC-168 — PWA de escritorio publicada en GitHub Pages:** el MVP se publica como frontend estático en GitHub Pages y puede instalarse como PWA para abrirse desde un icono propio en Windows. GitHub Pages entrega exclusivamente la interfaz, sus recursos y actualizaciones; no contiene datos operativos hardcodeados ni funciona como base de datos. IndexedDB conserva localmente los datos estructurados bajo el origen estable de la aplicación. Esta decisión sustituye el empaquetado local pendiente de DEC-144 y la exclusión general de PWA en DEC-161; la exclusión de móvil y sincronización permanece vigente. El funcionamiento offline y la actualización controlada del caché quedan definidos en DEC-170 y deben verificarse antes de publicar.
- **DEC-169 — Límite de persistencia y evolución a backend:** la interfaz y las reglas del dominio no acceden directamente a IndexedDB. Usan un contrato de repositorios/adaptador de persistencia cuya implementación inicial es local. Una evolución podrá añadir Supabase o Cloudflare para sincronización, usuarios, procesamiento persistente, correos, notificaciones remotas e integraciones sin dejar de servir el frontend desde GitHub Pages. Ese cambio exigirá migración versionada, autenticación y pruebas de integridad; no se simula ni se implementa en el MVP.
- **DEC-170 — Operación offline y actualización segura de la PWA:** después de una primera carga con conexión, la PWA guarda en caché la interfaz para abrir y operar sin internet. Los datos permanecen en IndexedDB y las operaciones locales —captura, consulta, importación CSV, exportación Excel y respaldo/restauración JSON— no dependen de conexión. Al abrir con conexión, la aplicación comprueba GitHub Pages en segundo plano y puede descargar una versión nueva, pero no la activa ni recarga una sesión en curso automáticamente: muestra `Actualizar ahora` o `Más tarde`. Las actualizaciones de esquema de IndexedDB se versionan y exigen respaldo JSON descargado antes de aplicarse. No se depende de tareas periódicas del navegador ni de service workers para alertas cuando la app está cerrada.
- **DEC-171 — Restauración completa, guiada y sin merge:** restaurar un paquete JSON reemplaza por completo la base local; no mezcla registros, no deduplica y no intenta resolver conflictos. Antes de restaurar, la aplicación exige descargar un respaldo del estado actual y valida que el archivo seleccionado sea íntegro y compatible. Luego muestra un resumen comprensible —fecha, versión y conteos— y pide confirmación explícita. La operación es atómica: ante cualquier error se conserva el estado anterior. El módulo Datos y respaldos muestra junto a sus acciones un mini manual no técnico con los pasos `Descargar respaldo`, `Guardar el archivo en un lugar conocido`, `Elegir el respaldo que deseas recuperar` y `Confirmar restauración`, además de advertir que sustituirá los datos actuales.
- **DEC-172 — Una base local con transacciones de negocio atómicas:** el MVP utiliza una única base IndexedDB y separa sus colecciones por entidad, relación y estado operativo; el detalle se mantiene en `DATA_MODEL.md`. La interfaz accede únicamente mediante el contrato de persistencia de DEC-169. Toda acción de negocio guarda en una sola transacción las entidades que modifica, sus relaciones y el Evento de actividad. Una falla de validación o escritura deja el estado anterior completo, sin cambios parciales. Esta regla aplica también a importación, restauración y migraciones de esquema.
- **DEC-173 — Importación CSV aditiva sin sobrescritura:** toda importación posterior al MVP agrega registros nuevos únicamente. Una fila con un ID interno ya existente se clasifica como duplicada, no altera el registro existente y se reporta en la vista previa; no bloquea las filas nuevas e independientes del lote. Al confirmar, solo las filas aceptadas se persisten atómicamente con su lote y trazabilidad. El CRM es el único lugar para corregir datos existentes; restaurar JSON es la única ruta para reemplazar por completo el estado local. No hay merge ni deduplicación automáticos.
- **DEC-174 — Stack frontend y arquitectura modular:** el MVP usa React + TypeScript + Vite y genera una aplicación estática publicable en GitHub Pages. Se descarta HTML/JavaScript puro porque el alcance aprobado contiene suficientes pantallas, formularios, relaciones, estados y operaciones delicadas para justificar tipado y composición modular. La estructura separa: (1) presentación y componentes React; (2) casos de uso de la aplicación; (3) reglas y tipos del dominio en TypeScript sin dependencia de React; (4) contratos de repositorios y servicios; y (5) adaptadores de IndexedDB, CSV/Excel, JSON y PWA. Ninguna pantalla escribe directamente en IndexedDB. Esta separación preserva la evolución prevista hacia un adaptador Supabase o Cloudflare sin reescribir el dominio ni la interfaz. Las versiones estables concretas se fijarán en el plan/implementación y quedarán bloqueadas en el archivo de dependencias; esta decisión no autoriza código antes de Fase G.
- **DEC-175 — Estrategia de pruebas y puertas de publicación:** la verificación combina TypeScript estricto/build, pruebas unitarias de dominio, contratos de adaptadores, integración de IndexedDB y formatos de datos, componentes accesibles, flujos end-to-end y pruebas manuales reales de instalación PWA, offline, actualización, restauración, visuales y accesibilidad en escritorio. Una entrega no puede publicarse sin round-trip JSON verificado, cero relaciones huérfanas, importación sin sobrescritura/cambios parciales, flujo comercial principal completo y evidencia registrada en `VERIFIER.md`. Los datos automatizados son sintéticos; la migración final se valida separadamente con trazabilidad.
- **DEC-176 — Respaldo JSON local sin contraseña adicional:** el MVP descarga el respaldo JSON versionado sin cifrado ni contraseña adicional. La decisión privilegia recuperación simple para una única propietaria: una contraseña perdida no debe inutilizar el único mecanismo de recuperación. La interfaz advierte que el archivo contiene datos del CRM y el mini manual recomienda guardarlo con nombre fechado en una carpeta privada y dedicada de OneDrive, por ejemplo `OneDrive/World Memories/Respaldos CRM`. El cifrado administrado se reconsidera junto con la evolución a backend; no se presenta este respaldo como protección multiusuario.
- **DEC-179 — Gestión explícita de editar, archivar y eliminar:** cada registro operativo incorporará acciones visibles para editar, archivar y, cuando sea seguro, eliminar. Editar no se oculta ni exige una decisión de ciclo de vida adicional, pero conserva las validaciones y eventos aplicables. Archivar nunca ocurre como efecto silencioso de seleccionar `Eliminar`: si el registro tiene relaciones, el diálogo explica que archivar es la opción recomendada para preservar el historial. La eliminación definitiva no estará disponible mientras existan dependencias; la vista de impacto identificará el registro y el resumen de relaciones que deben archivarse, reasignarse o resolverse primero. Solo al no existir dependencias se permitirá la confirmación destructiva explícita. No habrá eliminación automática en cascada ni relaciones huérfanas.
- **DEC-180 — Expediente completo de registros:** los detalles de Lead, Cliente/Familia, Viaje, Proveedor, Servicio, Pago, Comisión y Tarea tendrán una opción visible para abrir su expediente en espacio completo. Esa vista conserva la navegación global, pero oculta la lista y el panel contextual para concentrar el trabajo en un solo registro. No aplica a pantallas operativas sin expediente individual: Inicio, Calendario, Datos y respaldos, Configuración ni las listas agregadas.
- **DEC-181 — Paneles de expediente redimensionables:** el ancho del panel contextual de un expediente podrá ajustarse con un control de arrastre accesible, dentro de límites que preserven la lista y el contenido. La preferencia se conservará localmente en ese equipo y existirá una acción visible para restablecer el tamaño predeterminado. La vista completa de DEC-180 no depende del ancho elegido.
- **DEC-182 — Kit de interacción pragmático:** el CRM centralizará componentes accesibles de menú de acciones, botón de icono, selector de fecha, chips de filtro, notificación breve con deshacer, acordeón, stepper, barra de progreso, migas de navegación y ayuda emergente. Cada patrón tendrá una responsabilidad delimitada: los estados comerciales/financieros no usarán interruptores; los toasts con deshacer solo cubrirán acciones reversibles; los steppers solo procesos secuenciales; la barra indicará progreso real; y no habrá acciones por deslizamiento en el MVP de escritorio. La ayuda emergente se reserva para acciones de riesgo, reglas complejas y terminología no obvia.
- **DEC-183 — Dirección visual Ruta World Memories:** la interfaz conserva una base clara de trabajo y hace visible la identidad de marca con azul World Memories en navegación y acciones principales, azul profundo para lectura/jerarquía y acentos limitados de turquesa, amarillo y naranja solo cuando comunican progreso, atención o hitos con texto y contraste suficiente. Los expedientes completos tendrán una cabecera sobria inspirada en una ruta de viaje. La identidad se aplicará mediante tokens y componentes, no mediante color añadido de forma aislada. El SVG oficial `LOGO WORLD MEMORIES FINAL EDITABLES-01.svg`, recibido y validado el 2026-08-29, sustituirá el texto y el icono provisional en las superficies de aplicación e instalación.
- **DEC-184 — Adaptación cuadrada del logo oficial:** el logotipo horizontal oficial se empleará en superficies amplias de la interfaz. El icono de la PWA, Inicio y accesos instalados usará exclusivamente el monograma oficial azul y amarillo extraído del mismo SVG; se descarta conservar la “W” genérica provisional o recrear una marca alternativa.
