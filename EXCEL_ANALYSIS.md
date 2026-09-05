# Análisis de Excel — `Control WM_12_07_2026_Dashboard.xlsx`

## Estado y trazabilidad

- **Fase:** B — perfilado técnico completado; grano de `Ventas` validado por el usuario.
- **Método:** lectura con `openpyxl 3.1.5` y revisión directa del paquete XLSX/ZIP; nunca se guardó el libro desde la biblioteca.
- **Entrega actual (modificada el 2026-07-18):** 1,234,623 bytes; SHA-256 `1c172c06b7417463c0b70b6fd5aaf1c8e1262fc3c9b50b90fa6db56129ec3ba6`.
- **Perfil anonimizado actual:** `artifacts/Control_WM_12_07_2026_profile_2026-08-02_1c172c06.json`.
- **Perfil anterior conservado:** 1,873,366 bytes; SHA-256 `a52a84995795cd10ac9cc60956092991e1d6d7743db8e56bfac082941637097f`; `artifacts/Control_WM_12_07_2026_profile.json`.
- **Comparación:** cambió el archivo físico, pero se conservaron las 17 hojas, dimensiones, tablas, fórmulas y agregados de columnas de `Leads`, `Ventas`, `Datos Clientes` y `DROP DOWNS`. Los hallazgos documentados siguen siendo aplicables; el perfil actual pasa a ser la evidencia vigente.
- **Privacidad:** no se documentan valores personales, credenciales, localizadores ni montos individuales.

## Resumen ejecutivo

El libro combina en un solo archivo cinco clases de información que deben separarse durante la migración:

1. **CRM operativo:** `Leads`, `Ventas`, `Datos Clientes`.
2. **Catálogos y reglas:** `DROP DOWNS`, `TEMPLATE`.
3. **Comisiones externas/históricas:** `PTC Evolution` está desactualizada y se excluye; `REFERIDOS PALACE` no tiene registros.
4. **Finanzas/administración:** `Inversiones`, `PnL`, `Cuentas Banco`, `REGINA RRSS`, `GASTOS WM ANALU` y `Wish list`.
5. **Datos de alto riesgo:** `Usuarios` y las credenciales de plataformas incluidas en `Datos Clientes`.

El vínculo central es `Leads.ID → Ventas.ID`. Las 224 filas de `Ventas` se relacionan con IDs existentes en `Leads`; no se encontraron ventas con un ID inexistente. **DEC-116 confirma que cada fila representa un componente de Proveedor.** Por ello, el ID agrupa componentes y servicios, pero no es una clave segura futura: existen IDs repetidos y colisiones en Leads.

## Estructura del libro

- 17 hojas: 11 visibles y 6 ocultas; ninguna `veryHidden`.
- 11 tablas estructuradas.
- 5 tablas dinámicas y 6 partes de caché dinámica.
- 1 conexión interna del libro; 0 vínculos externos.
- 0 macros, gráficos, imágenes o slicers.
- 4,563 celdas con fórmulas detectadas y 4 celdas con resultado de error almacenado.
- 8 reglas estándar y 14 reglas extendidas de validación de datos.
- 37 bloques estándar y 2 bloques extendidos de formato condicional.

`openpyxl` no interpreta todas las extensiones x14 de validación/formato. Su existencia se contó directamente en XML y el libro original no fue guardado, por lo que no se eliminaron de la fuente.

## Inventario de hojas

| Hoja | Visibilidad | Rango con datos | Registros/uso | Fórmulas | Clasificación y tratamiento inicial |
|---|---|---:|---:|---:|---|
| TEMPLATE | Visible | B2:AD19 | 17 filas de plantilla | 113 | Descartada al 100 % por DEC-082; no participa en el modelo ni la migración |
| Leads | Visible | B2:AD158 | 156 leads | 1,123 | Fuente CRM principal |
| Ventas | Visible | A1:AD225 | 224 filas; tabla A:Y | 2,730 | Fuente confirmada de componentes de Proveedor y Comisiones |
| Hoja1 | Visible | A1:T81 | 80 filas | 517 | Reporte histórico de estadísticas; excluida de la migración operativa por confirmación del usuario |
| Inversiones | Visible | A1:I41 | 40 filas | 42 | Finanzas administrativas, fuera del CRM inicial |
| Detail1 | Visible | A1:Y25 | 22 filas | 0 | Extracto derivado; sus 15 IDs están en `Ventas` |
| PnL | Visible | B1:T99 | Reporte no tabular | 9 | Reporte/pivotes derivados; no importar como fuente |
| Certificaciones | Oculta | B2:H2 | Solo encabezados | 0 | Módulo futuro; sin datos actuales |
| Cuentas Banco | Oculta | A1:K22 | 16 filas de tabla | 19 | Datos financieros sensibles; fuera del CRM inicial |
| Wish list | Oculta | A1:F24 | 10 filas de tabla y bloques laterales | 3 | Personal/no CRM; excluir |
| REFERIDOS PALACE | Oculta | A1:G1 | Solo encabezados | 0 | Posible fuente futura de referidos |
| PTC Evolution | Oculta | A1:F25 | 24 comisiones | 0 | Fuente desactualizada; excluida de migración y conciliación |
| Datos Clientes | Visible | A1:J48 | 47 clientes | 0 | Fuente de clientes; contiene secretos que deben excluirse |
| REGINA RRSS | Visible | A1:F4 | 3 filas | 2 | Gasto/tipo de cambio administrativo |
| Usuarios | Visible | B2:I54 | 52 plataformas | 0 | Credenciales en texto plano; no migrar al dashboard |
| DROP DOWNS | Visible | A1:S16 | Catálogos; 14 proveedores | 1 | Fuente candidata de catálogos/configuración |
| GASTOS WM ANALU | Oculta | A1:Q8 | 7 filas y bloques laterales | 4 | Personal/administrativo; excluir del CRM inicial |

## Hallazgos de `Leads`

- 156 filas y 29 columnas; periodo de solicitudes almacenado: 2024-02-01 a 2026-04-10.
- 149 IDs distintos; 6 grupos duplicados y 7 repeticiones adicionales; un ID aparece 3 veces.
- El ID se calcula a partir de fragmentos de país, destino y nombre. Por diseño puede colisionar y contiene información derivada del cliente; debe conservarse como `legacy_lead_id`, no como clave primaria futura.
- En los seis grupos duplicados existen diferencias reales: 3 cambian cliente, 5 fechas de inicio, 5 fechas de fin y algunos cambian correo, celular, país o destino. No es seguro fusionarlos automáticamente.
- DEC-086 conserva esos IDs intactos como legado, crea claves internas por fila y resuelve los vínculos `Ventas`→`Lead` con evidencia independiente; solo los casos dudosos llegan a revisión humana.
- DEC-087 limita la migración histórica a Ana Lu/Analu y excluye en cascada los registros dependientes de otros agentes con trazabilidad de fila.
- DEC-088 normaliza `Venta`/`VENTA` a `Vendido`, conserva `Cancelado` y trata `Lead` como `Cancelado` solo para este lote; `Cotización enviada` queda fuera por el filtro de agente.
- En el lote histórico inicial confirmado por la usuaria, 24 filas tienen `Fecha de envío` vacía aunque la cotización sí fue enviada. Su fecha queda como desconocida explícita; la fórmula de `Fecha Acción` produce una fecha de 1900 que se descarta, sin crear una tarea pendiente (DEC-085).
- Teléfono mezcla números y texto; debe normalizarse como cadena. Hay 31 teléfonos y 50 correos vacíos.
- `Cotización` mezcla número, texto, fórmulas y nulos; `Presupuesto` y comisiones requieren parseo y moneda explícita.
- `Pax`, `# Noches`, `Tiempo de envío`, `Comisión @ 80%`, `ID` y `Concepto` son campos derivados. Se deben recalcular o validar, no tratar como autoridad independiente. En `Comisión @ 80%`, 148 de 156 celdas son fórmulas; las 8 sin fórmula requieren clasificación por fila antes de la carga final (DEC-097).
- No se detectaron viajes con fin anterior al inicio ni inconsistencias entre Pax y Adultos+Niños en valores calculables. DEC-094 exige que una ejecución futura que encuentre una diferencia la informe con `source_row` antes de migrar, sin corrección ni inferencia automática.

## Hallazgos de `Ventas`

- En la entrega actual: 224 filas, 25 columnas tabulares y 109 IDs distintos.
- Los 108 IDs tienen correspondencia en `Leads`; 41 IDs de Leads no tienen ventas.
- 47 IDs tienen varias filas; máximo de 8 filas por ID.
- Entre grupos repetidos cambian: proveedor en 36 grupos, moneda en 17, itinerario en 46, tracking en 30 y costo en 46.
- También cambian fechas: inicio en 42 grupos y fin en 41. Esto impide crear automáticamente “un viaje por ID” sin una regla adicional.
- Las fórmulas XLOOKUP copian desde Leads agente, titular, destino y pasajeros. Esos campos son derivados; deben resolverse desde relaciones al migrar.
- La columna `Pago de Comisión` se calcula normalmente como fin del servicio/viaje + 90 días. En 11 filas el valor almacenado no cumple exactamente esa diferencia, lo cual puede indicar excepciones o valores manuales.
- Se detectó una discrepancia de noches y 4 costos finales no numéricos/nulos según el parseo objetivo.
- El libro calcula comisiones al 100 %, participación al 80 % y conversión a USD. Las tasas están embebidas en celdas/fórmulas y deben convertirse en configuración versionada.
- `# de itinerario` y `Tracking Form #` mezclan números y texto; deben tratarse como cadenas para conservar ceros y formatos.

### Clasificación completa de las 25 columnas para migración

**Confirmado por evidencia del libro y decisiones aprobadas**

- Campos capturados directamente en la fila: `ID`, `Status`, `Tipo de venta`, fechas de inicio/fin, `Proveedor`, `Costo final`, localizador de itinerario, referencia de tracking, fecha de pago del cliente y `notas`.
- Copias por XLOOKUP desde `Leads`: `Agente` (224 fórmulas), `Persona titular` (223), `Destino` (212), `Pax` (222), `Adultos` (220) y `Niños` (220). No son evidencia independiente para resolver colisiones de ID.
- Derivados o fórmulas de cálculo: `# Noches` (223 fórmulas), `Comisión 100%` (7), `Comisión 80%` (214), `Comisión 100% USD` (201), `Comisión 80% USD` (136), `Pago de Comisión` (213) y `Concepto` (223).
- `Moneda` contiene 200 fórmulas de búsqueda al catálogo y 24 valores no formulados. Las 224 filas tienen moneda y solo aparecen códigos de tres caracteres; por tanto, la hoja `Ventas` no presenta el faltante de moneda detectado en `Leads`.
- Existen valores no formulados que pueden representar excepciones históricas legítimas: una titular, 12 destinos, 2 cantidades `Pax`, 4 cantidades de adultos, 4 de niños, una duración, 10 comisiones al 80 %, 23 conversiones brutas a USD, 88 conversiones netas a USD y 11 fechas esperadas de comisión.
- `Comisión 100%` tiene cinco vacíos; `Costo final` tiene cinco vacíos/no convertibles en la prevalidación. `Comisión 80% USD` conserva tres textos numéricos que se normalizan a número, sin exportar la fórmula. Estos casos se reportan por `source_row` antes de cerrar la carga.
- Los cuatro valores observados en `Status` describen el seguimiento de la comisión, no el estado de la venta o del Servicio/Reserva. DEC-103 mapea los tres estados históricos originales y DEC-104 confirma `Clientes por viajar` como Comisión pendiente por viaje aún no finalizado.

**Regla aplicada desde decisiones existentes**

- Una fórmula nunca se exporta. Se conserva su resultado validado o se recalcula desde campos canónicos cuando la regla está confirmada.
- Un valor fijo no se reemplaza solo por diferir de una fórmula. Se conserva con procedencia cuando representa una excepción histórica válida; si contradice otra fuente canónica, se reporta antes de migrar.
- Las 11 fechas no formuladas de `Pago de Comisión` son candidatas a fecha fija histórica, coherentes con el override manual ya definido para comisiones; no deben recalcularse silenciosamente a fin + 90 días.
- El filtro de agente se aplica desde el Lead ya vinculado, no desde `Ventas.Agente`, porque esa columna es una fórmula XLOOKUP y puede heredar la primera coincidencia de un ID legado duplicado.

**Pendiente de confirmación o lectura por fila**

- DEC-105 confirma el tratamiento de seis filas con costo y/o comisión bruta problemáticos: cuatro tienen ambos importes vacíos, una solo la comisión bruta vacía y una `Costo final` de texto no convertible. Se conservan como `unknown_historical`; la fila no convertible se reporta para corrección antes del CSV final.
- DEC-109 resuelve la discrepancia de duración como días de renta de auto y confirma que los overrides de pasajeros pueden representar subconjuntos de un Servicio/Reserva dentro del total del Viaje.
- DEC-110 confirma que `Ventas.Tipo de venta` clasifica el Servicio/Reserva y no reemplaza el tipo principal del Lead.
- DEC-111 confirma que el destino manual de `Ventas` es el destino efectivo del Servicio/Reserva y conserva separado el destino inicial del Lead.
- DEC-112 confirma que la `Persona titular` manual pertenece a la Reserva concreta y puede diferir del contacto del Lead.
- DEC-113 confirma que el catálogo inicial de Proveedores se crea desde el histórico de `Ventas`, no desde el catálogo auxiliar existente.
- La comprobación actual detectó 12 filas con moneda manual distinta de la moneda que devuelve el catálogo auxiliar para el mismo proveedor; su tratamiento queda pendiente de confirmación antes del CSV final. Otras 10 filas con proveedor manual no encuentran correspondencia exacta en ese catálogo y se conservan como candidatos de creación inicial, sin consolidación automática.
- DEC-114 resuelve la aparente discrepancia: las 12 filas no son automáticamente errores; evidencian que algunos Proveedores pueden ser multimoneda. La carga inicial debe configurar las monedas observadas por Proveedor y conservar la moneda efectiva en cada Servicio/Reserva.
- DEC-117 confirma que `Fecha de pago (tarjeta cliente)` es la fecha histórica efectiva del pago en plataforma para el componente de Proveedor.
- DEC-118 confirma que `Tracking Form #` es la referencia oficial generada al subir el formulario o *commission report* para seguir la Comisión futura del componente de Proveedor.
- DEC-119 confirma que `# de itinerario` es el número de reservación de plataforma por componente de Proveedor y puede quedar vacío sin inferencia.
- DEC-120 confirma que `Ventas.notas` conserva contexto histórico vinculado al componente de Proveedor sin automatizar su contenido.
- DEC-121 confirma que `Ventas.Concepto` es metadato redundante y no forma parte de la migración.
- Se resolvió el bloqueo del XLSX el 2026-08-13 mediante lectura directa sin modificarlo.

### Relectura directa de la entrega actual — 2026-08-13

- El libro ya estuvo disponible en modo lectura. Su SHA-256 actual es `d33bf2f97e3c95bf8e8e4908fa7b35f675313b117b26e7544eabaec6b6dbea7f`, distinto de la entrega anterior; se trata como fuente actualizada y el perfil nuevo quedó en `artifacts/Control_WM_12_07_2026_profile_2026-08-13.json`.
- `Ventas` ahora tiene 224 filas. Se agregó un cuarto valor de `Status`, `Clientes por viajar`, y un tipo de venta adicional; ambos requieren validación antes de normalizarlos.
- Aplicando únicamente vínculos deterministas desde el ID legado y evidencia independiente, 211 filas de `Ventas` quedan dentro del alcance de Ana Lu y 13 fuera; no quedan vínculos pendientes. Cuatro casos adicionales se vincularon automáticamente porque un único Lead candidato coincide en ambas fechas de viaje; DEC-106 y DEC-107 resolvieron ocho vínculos por revisión de evidencia y confirmación visual; DEC-108 agrupó dos Leads en un mismo Viaje para las filas 44 y 46. Los XLOOKUP no se usaron como evidencia independiente.
- La validación por fila confirma nueve comisiones fijas al 80 % dentro del alcance y una en un vínculo aún dudoso. Las diez se preservan según DEC-102.
- Se localizaron cinco `Costo final` faltantes/no convertibles y cinco comisiones brutas faltantes/no convertibles dentro del alcance, en seis filas distintas. Cuatro filas comparten ambas ausencias y muestran comisión neta derivada como cero; ese cero no se interpreta como evidencia de comisión inexistente. DEC-105 las conserva como importes desconocidos históricos.
- DEC-109 resolvió una discrepancia fija de duración como días de renta de auto y dos discrepancias de pasajeros como subconjuntos de Reservas que suman el total del Viaje. Las diez fechas esperadas de comisión fijas permanecen como overrides históricos con `source_row`.
- DEC-103 confirma el mapeo de los tres estados históricos ya existentes. DEC-104 confirma `Clientes por viajar` como Comisión pendiente y no exigible mientras el viaje no haya finalizado.

## Clientes y coincidencias

`Datos Clientes` contiene 47 registros de directorio maestro. La coincidencia exacta con Leads es limitada, pero DEC-124 confirma que no se usa para enriquecer, fusionar ni deduplicar durante la carga inicial:

| Clave normalizada | Únicos en Leads | Únicos en Clientes | Coincidencias exactas |
|---|---:|---:|---:|
| Nombre | 134 | 47 | 15 |
| Correo | 71 | 37 | 15 |
| Teléfono | 87 | 25 | 14 |

Por tanto, se conserva un Cliente maestro por fila, con su procedencia. No se crea una unión, deduplicación o vínculo automático con Leads durante la carga inicial.

La hoja contiene dirección, fecha de nacimiento y credenciales de una plataforma de terceros. Los campos de usuario/contraseña se excluyen del dashboard. Dirección y nacimiento quedan pendientes de justificación de negocio y minimización.

## Hojas derivadas, duplicadas y secundarias

- `Hoja1`: 80 IDs únicos; 79 existen en la tabla actual `Ventas` y 1 no. El usuario confirmó que fue usada para estadísticas históricas de clientes/familias viajeras; queda excluida de la migración operativa.
- `Detail1`: 15 IDs, todos presentes en `Ventas`; parece un extracto de tabla dinámica.
- `TEMPLATE`: descartada al 100 % por DEC-082; no participa en el modelo, la migración ni la inferencia de datos.
- `PnL`: contiene fórmulas/vistas; se reconstruye desde datos canónicos y no se migra como entidad.
- `PTC Evolution`: 24 filas, fechas en tipos/formatos mixtos y 23 referencias únicas. Aunque dieciséis referencias coinciden con `Ventas`, la usuaria confirmó que la hoja está desactualizada; queda excluida de migración y conciliación.
- `DROP DOWNS`: una tabla de 14 proveedores con moneda y porcentaje de comisión parcial, más listas independientes de tipos, monedas, acciones, estados heredados y metadatos. DEC-122 las clasifica por función: el histórico de Ventas crea Proveedores; los demás valores sirven como semillas o referencias, no como datos transaccionales.
- Hojas financieras y personales se preservan en el XLSX original, pero no forman parte automática del MVP del CRM.
- La revisión integral de las hojas restantes confirma DEC-125: no existe otra fuente de entidad operativa para la migración inicial.

## Mapa inicial de relaciones

| Origen | Relación observada | Destino candidato | Confianza |
|---|---|---|---|
| Leads.ID | XLOOKUP y copia manual | Ventas.ID | Alta |
| Leads.Cliente/Correo/Celular | Coincidencias parciales | Datos Clientes | Media-baja; requiere revisión |
| Ventas.Proveedor | XLOOKUP | DROP DOWNS.Proveedor | Alta |
| Ventas (una fila) | Proveedor, importe, comisión y fechas | Componente de Proveedor + Comisión | Confirmado por el usuario |
| PnL/Detail1 | Tablas dinámicas/extractos | Vistas derivadas | Alta |

## Riesgos de migración priorizados

1. **Crítico — secretos:** credenciales en texto plano; excluir y rotar.
2. **Alto — grano ambiguo:** ID de Lead no equivale necesariamente a Viaje y se repite con fechas distintas.
3. **Alto — colisiones:** IDs calculados de Leads no son únicos.
4. **Alto — clientes:** baja coincidencia exacta entre Leads y Datos Clientes.
5. **Medio — fechas derivadas:** 24 fechas de 1900 y formatos mixtos en PTC.
6. **Medio — monedas/comisiones:** tasas embebidas, valores de texto y posibles excepciones a 90 días.
7. **Medio — duplicación de fuentes:** `Ventas` y `Detail1` se solapan; `Hoja1` queda excluida por decisión confirmada.
8. **Medio — CSV plano:** un único CSV no preserva adecuadamente clientes, viajes, servicios y comisiones uno-a-muchos.

## Recomendaciones de limpieza

- Mantener el libro original inmutable y generar transformaciones reproducibles.
- Crear claves nuevas no semánticas y conservar los IDs actuales en campos `legacy_*`.
- Separar Lead, Cliente, Viaje, Servicio/Reserva y Comisión antes de exportar.
- Convertir teléfonos, itinerarios, tracking e IDs a texto.
- Normalizar fechas a ISO `YYYY-MM-DD`; transformar fechas ficticias de 1900 a `null` con advertencia.
- Normalizar importes a decimal sin símbolos y conservar `currency_code` por registro.
- No calcular conversiones sin guardar tasa, fecha/tipo de tasa y monto original.
- Generar reportes de colisiones, clientes candidatos, referencias no conciliadas y filas rechazadas.
- Excluir credenciales y hojas personales/administrativas o desactualizadas salvo aprobación específica de alcance.

## Decisión estructural confirmada

Cada fila de `Ventas` es un componente de Proveedor dentro del Viaje, no evidencia de que varias filas formen una sola Reserva. El usuario confirmó que el Viaje usa el inicio más temprano y el fin más tardío de sus componentes/servicios, con override manual; las fechas del Lead se conservan como solicitud original.

### Hallazgo de catálogo pendiente

- La tabla de Proveedores contiene `InterCruises` e `International Cruises` como nombres distintos. `Ventas` usa `International Cruises`. La usuaria confirmó que son dos Proveedores diferentes; se mantienen separados (DEC-123).
