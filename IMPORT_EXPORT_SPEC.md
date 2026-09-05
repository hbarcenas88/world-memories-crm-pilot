# Especificación preliminar de importación, exportación y migración

## Estado

- **Versión:** borrador 0.1.
- **Evidencia:** perfilado de `Control WM_12_07_2026_Dashboard.xlsx`.
- **Decisión confirmada:** una fila de `Ventas` representa un Servicio/Reserva dentro de un Viaje.
- **Decisión confirmada:** el intervalo efectivo del Viaje se deriva de servicios y permite override; las fechas del Lead se conservan.
- **Decisión confirmada:** los posibles duplicados de Cliente se revisan asistidamente; no existe fusión automática.
- **Decisión confirmada:** la migración histórica incluye únicamente Leads de Ana Lu y excluye en cascada sus relaciones fuera de alcance (DEC-087).
- **Decisión confirmada:** los estados del lote histórico se normalizan según DEC-088, sin convertir esa excepción en regla para datos nuevos.
- **Decisión pendiente:** formato exacto aceptado por el dashboard y reglas restantes del proceso.
- **Objetivo:** conservar íntegramente la fuente y producir datos canónicos, validados y restaurables sin depender de fórmulas de Excel.

## Principio de conservación

“Conservar toda la data” se implementará en dos niveles:

1. **Archivo histórico íntegro:** el XLSX original, inmutable y verificado por SHA-256.
2. **Datos de aplicación minimizados:** solo entidades/campos aprobados para el dashboard, con reporte explícito de transformaciones, exclusiones y rechazos.

Las credenciales se conservan únicamente dentro de la copia histórica sensible mientras se retiran; no se consideran datos válidos para importación al CRM.

## Alternativas de formato

### A. Paquete versionado con varios CSV — recomendado

Un ZIP contiene `manifest.json`, CSV por entidad y reportes de calidad.

El `manifest.json` registra como mínimo la versión de esquema, fecha de exportación, archivos incluidos, conteos de filas y checksum SHA-256 de cada archivo.

- Ventajas: preserva relaciones uno-a-muchos, es auditable, permite importaciones parciales y sigue siendo interoperable.
- Desventajas: requiere un importador coordinado y claves estables.

### B. Un CSV plano por fila de servicio

Repite cliente/viaje en cada fila de `Ventas`.

- Ventajas: simple de abrir y cargar.
- Desventajas: duplica datos, dificulta clientes recurrentes, mezcla viaje/servicio/comisión y no preserva toda la estructura.

### C. JSON canónico con CSV de consulta

JSON es el respaldo relacional; CSV se genera por módulo.

- Ventajas: mejor fidelidad para restauración y metadatos.
- Desventajas: menos cómodo para edición manual y no cumple por sí solo un importador que exija CSV.

**Decisión confirmada:** A es el único formato de importación del MVP. Excel se usa únicamente como exportación operativa y JSON versionado como respaldo/restauración. No usar un único CSV como respaldo completo.

La versión actualizada del libro histórico no se cargará directamente en el dashboard. Se transformará una única vez, con las reglas de migración y trazabilidad aprobadas, a este mismo paquete CSV canónico. Por ello no se requiere construir un importador especial de Excel y toda carga futura sigue el mismo contrato.

## Estructura del paquete canónico implementado

```text
world-memories-import-v1.zip
├── manifest.json
├── leads.csv
├── clients.csv
├── trips.csv
├── services.csv
├── commissions.csv
├── providers.csv
├── tasks.csv
├── activity_events.csv
├── notes.csv
└── reports/
    ├── rejected_rows.csv
    ├── warnings.csv
    ├── duplicate_candidates.csv
    ├── unresolved_client_links.csv
    └── source_coverage.json
```

El manifiesto usa el siguiente contrato verificable. Cada entrada en `files` corresponde a un CSV incluido y declara el número de filas de datos, sin contar su encabezado:

```json
{
  "format": "world-memories-import",
  "schemaVersion": 1,
  "exportedAt": "2026-08-27T00:00:00.000Z",
  "files": [
    { "name": "leads.csv", "rowCount": 12, "checksum": "sha256-en-hexadecimal" }
  ]
}
```

El importador verifica formato, versión, fecha, presencia de archivos, checksum SHA-256 y conteo declarado antes de generar la vista previa. Una confirmación vuelve a verificar dentro de la transacción que ningún ID aceptado apareció desde esa vista previa; ante una colisión o error de relación, no se persiste ninguna fila del lote.

Hojas financieras pueden agregarse en un paquete separado (`finance-*`) si entran al alcance; no se mezclarán silenciosamente con el CRM.

## Grano candidato por archivo

| Archivo | Una fila representa | Fuente principal | Bloqueo actual |
|---|---|---|---|
| `leads.csv` | Una oportunidad original | Leads | Regla de IDs y colisiones confirmada en DEC-086 |
| `clients.csv` | Una persona/contacto consolidado | Datos Clientes + Leads | Matching asistido; credenciales excluidas |
| `trips.csv` | Un viaje comercial/operativo | Leads + agrupación de Ventas | Intervalo de servicios + override confirmado; `Hoja1` no participa |
| `services.csv` | Una reserva/componente de viaje | Una fila de Ventas | Grano confirmado |
| `service_additional_items.csv` | Un concepto adicional de un Servicio | Datos operativos del CRM | Requiere un `service_id` existente; conserva importe y moneda |
| `commissions.csv` | Una comisión esperada por servicio | Una fila de Ventas | Separar fecha límite de fecha pagada |
| `providers.csv` | Un proveedor | DROP DOWNS | Normalizar nombres y moneda |
| `activity_events.csv` | Un evento histórico demostrable | Fechas de Leads/Ventas y uso futuro | No inventar eventos ausentes en Excel |
| `notes.csv` | Una nota vinculada | Leads/Ventas | Clasificar relación y privacidad |

## Convenciones CSV

- UTF-8 con BOM para preservar acentos y caracteres especiales en Excel y el dashboard.
- Separador coma y reglas RFC 4180; saltos de línea y comillas escapados.
- Encabezados estables en `snake_case`.
- Fechas `YYYY-MM-DD`; instantes ISO-8601 con zona cuando exista.
- Decimales con punto, sin símbolo monetario ni separadores de miles.
- Moneda obligatoria como código ISO-4217 junto a cada importe original.
- Identificadores, teléfonos, itinerarios y tracking siempre como texto.
- Nulos como campo vacío; nunca fechas 1900 ni textos “N/A” sin catálogo.
- Booleanos `true` / `false`.

## Identificadores y trazabilidad

- Generar claves internas no semánticas; tecnología concreta pendiente de arquitectura.
- Conservar `legacy_lead_id`, `source_sheet`, `source_row` e `import_batch_id` en cada fila de `Leads` y `Ventas` para auditoría.
- No usar el ID calculado de Leads como PK porque presenta colisiones.
- Generar una clave interna nueva para cada Lead y cada fila de Venta/Servicio; nunca añadir sufijos al ID legado.
- Mantener `import_batch_id`, versión de esquema, hash del archivo y fecha de transformación.
- Toda relación debe apuntar a una clave interna válida antes de confirmar la importación.

## Pipeline propuesto

1. Validar nombre, tamaño, hash y formato del libro.
2. Leer sin guardar el XLSX.
3. Extraer tablas fuente y valores calculados almacenados.
4. Clasificar hojas/campos: importar, derivar, poner en cuarentena o excluir.
5. Filtrar el alcance por Agente: incluir solo Ana Lu/Analu y excluir en cascada las relaciones de otros agentes con causa y `source_row`.
6. Normalizar tipos y estados históricos sin perder valores originales de auditoría.
7. Detectar colisiones, duplicados y referencias huérfanas.
8. Resolver vínculos `Ventas`→`Lead` mediante ID legado y evidencia independiente, auditando método y confianza. Aplicar los inequívocos y presentar a la usuaria únicamente los no resueltos o dudosos. Los campos copiados por XLOOKUP no cuentan como evidencia independiente.
9. Proponer vínculos de clientes y viajes con nivel de confianza; para posibles duplicados de Cliente, permitir decidir entre fusionar con el candidato o crear un Cliente independiente. Los no revisados se crean como independientes, quedan marcados y no bloquean la primera importación.
10. Generar vista previa, conteos de cobertura y reportes de errores.
11. Exigir confirmación del usuario.
12. Crear respaldo previo e importar de forma atómica.
13. Verificar conteos, relaciones, importes, fechas y restauración.

## Reglas iniciales de transformación

- `Fecha Acción` de 1900 causada por fecha de envío vacía → `null` + advertencia.
- Fórmulas de lookup → relaciones; no exportar duplicados como autoridad.
- Fórmulas de duración/comisión → recalcular y comparar con valor almacenado.
- `# Noches` de Leads → cargar el resultado numérico evaluado cuando la fuente sea fórmula, o el valor numérico fijo cuando no lo sea; nunca exportar la fórmula.
- `Tiempo de envío` de Leads → calcular y cargar `lead.quote_response_days` solo si existen fecha de solicitud y fecha de envío; si falta una, dejar vacío/no medible. Nunca exportar la fórmula.
- `Notas` de Leads → crear una nota vinculada al Lead solo cuando el texto no esté vacío; conservar `source_row` y no interpretar el contenido para crear Tareas, estados o campos estructurados.
- `Comisión proyectada` de Leads → conservar como comisión bruta histórica al 100%. `Comisión @ 80%` con fórmula se recalcula; una celda sin fórmula se inspecciona por `source_row` después del filtro de agente y, si es importe fijo, se conserva como excepción histórica con procedencia, sin recálculo.
- `Pax` frente a `Adultos`+`Niños` → validar antes de migrar; cualquier diferencia genera la advertencia `passenger_count_mismatch` con `source_row`, sin corrección, inferencia ni persistencia hasta revisión de la usuaria.
- ID de Lead → campo legado; nueva clave separada.
- Agente distinto de Ana Lu/Analu → excluir Lead y relaciones dependientes con causa `agent_out_of_scope`; no eliminar el Cliente si conserva otro Lead incluido.
- Status histórico después del filtro → `Venta`/`VENTA` a `Vendido`; `Lead` a `Cancelado`; `Cancelado` permanece.
- Moneda vacía en un Lead `Cancelado` → aceptable como excepción histórica si no hay operación monetaria; cualquier vacío restante, y especialmente uno `Vendido`, bloquea la confirmación del CSV final hasta que se complete con código ISO-4217.
- Campos numéricos de texto → parsear solo si son inequívocos; de lo contrario rechazar con valor anonimizado en el reporte.
- `Cotización` de Leads → importar como un único `quote.quoted_amount` histórico en la moneda del Lead; no crear versiones, revisiones ni eventos de ajuste cuando el Excel no los demuestra.
- `Presupuesto` de Leads → importar el resultado numérico evaluado cuando la fuente sea fórmula, o el valor fijo normalizado cuando no lo sea; nunca exportar la expresión de fórmula. Un vacío histórico permanece vacío y no se infiere.
- Credenciales/contraseñas → bloqueadas por política.
- Fechas de solicitud/envío demostrables → eventos importados con `source=import`.
- No generar eventos históricos de conversión o seguimiento si el Excel no demuestra su fecha.
- Fechas tentativas nulas → importar `requested_date_status=fechas_por_definir` cuando la fuente no aporte rango; nunca completar con fechas ficticias.
- Hoja derivada/tabla dinámica → no importar; reconstruir como vista.
- Datos sin módulo aprobado → preservar en XLSX y registrar como cobertura pendiente.

## Vista previa y reporte

Antes de persistir, mostrar por entidad:

- filas fuente, aceptadas, advertidas, rechazadas y excluidas;
- campos mapeados/no mapeados;
- colisiones de IDs, vínculo aplicado, evidencia y método de resolución;
- vínculos de cliente/viaje propuestos y su confianza;
- decisión de cada candidato de Cliente: fusionado, independiente o pendiente;
- diferencias entre valor calculado y almacenado;
- referencias externas conciliadas/no conciliadas;
- exclusiones de seguridad sin revelar secretos.

## Respaldo, rollback y restauración

- Crear un respaldo completo antes de cada importación confirmada.
- Aplicar el lote de forma atómica o revertirlo por completo.
- No eliminar datos existentes durante una importación sin estrategia explícita de merge/reemplazo.
- Restaurar en una base vacía durante la prueba y comparar conteos, IDs y relaciones.
- El formato de respaldo debe incluir esquema, versión y checksum; CSV por sí solo no basta.

## Política de importación posterior

Una carga CSV posterior es aditiva: crea únicamente los registros que no existen aún. No actualiza, fusiona, deduplica ni elimina datos que ya estén en el CRM.

- La vista previa clasifica cada fila como `lista para importar`, `duplicada` o `rechazada`, con causa legible.
- Una fila cuyo ID interno ya existe se marca `duplicada`, no altera el registro existente y no bloquea las filas nuevas e independientes del mismo lote.
- Tras confirmación, el subconjunto de filas aceptadas se persiste en una operación atómica junto con su lote y trazabilidad; si falla, no se guarda ninguna de esas filas.
- Las correcciones de datos existentes se realizan dentro del CRM. Para recuperar íntegramente otro estado se usa restauración JSON, que reemplaza la base según DEC-171.

## Formatos de fecha de salida

- Los CSV operativos y de integración usan fechas ISO `YYYY-MM-DD` para evitar ambigüedad entre día y mes en el dashboard u otros sistemas.
- Esta convención de intercambio no afecta la interfaz del CRM: allí las fechas se capturan y muestran como `DD/MM/YYYY`.

## Cobertura operativa vigente de CSV y Excel

El paquete CSV sintético aditivo y la exportación Excel operativa conservan los campos aprobados que permiten reconstruir relaciones y decisiones sin alterar la semántica de los importes originales. Además de las columnas base, incluyen dirección y contacto de Lead/Cliente, intervalo solicitado, canal, pasajeros estructurados y nota comercial; bloqueo de tasa del Viaje; localizador y resultado/fecha de cancelación del componente; conceptos adicionales; tasa base, cotizada, valor, origen e importe de referencia de Comisión; y fecha, hora, vínculo a Comisión, origen y revisión manual de Tarea.

Los nombres de columna siguen el contrato canónico en inglés `snake_case`; los valores monetarios son números puros junto con su código ISO-4217, las fechas intercambiables son ISO y las marcas temporales son ISO 8601. Excel es una salida de consulta operativa con las mismas relaciones, no un respaldo restaurable ni una fuente de migración directa.

## Criterios de aceptación candidatos

- 100 % de las filas fuente queda clasificado como importado, derivado, excluido o rechazado con causa.
- 0 credenciales exportadas.
- 0 relaciones huérfanas después de importar.
- Fechas ficticias de 1900 no entran como fechas reales.
- Los 223 registros de Ventas quedan trazables a su fila fuente.
- Los 108 IDs usados en Ventas quedan enlazados a Leads.
- Una restauración reproduce conteos, relaciones y montos originales aprobados.
- Las fechas exportadas en CSV cumplen `YYYY-MM-DD` y pueden interpretarse sin depender del idioma de la interfaz.

## Decisiones pendientes

- Inclusión de hojas financieras.
- Formato de clave interna para el paquete histórico de migración.
- **Backlog confirmado de respaldo local:** ofrecer dos salidas manuales: (1) paquete JSON completo y versionado, con configuración y datos para restauración; (2) paquete Excel de datos operativos para consulta/interoperabilidad. Registrar la descarga y avisar a los tres días sin respaldo. El diseño detallado debe preservar relaciones, excluir contraseñas y validar restauración antes de pasar a implementación.
