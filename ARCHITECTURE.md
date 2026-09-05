# Arquitectura del MVP — World Memories CRM

## Estado del documento

- **Fase:** F — Arquitectura y plan.
- **Estado:** aprobado formalmente el 25 de agosto de 2026; Fase F cerrada.
- **Alcance:** MVP de escritorio local-first, publicado como PWA estática.
- **Autoriza implementación:** no. La autorización de la Fase G continúa pendiente.

Este documento es la fuente de verdad de la arquitectura técnica. Las reglas de producto permanecen en `PRD.md`, las entidades y relaciones en `DATA_MODEL.md`, los intercambios de datos en `IMPORT_EXPORT_SPEC.md` y las decisiones trazables en `DECISIONS.md`.

## Objetivos arquitectónicos

1. Abrir World Memories desde un icono instalado en Windows sin administrar infraestructura.
2. Conservar los datos operativos localmente y trabajar sin internet después de la primera carga.
3. Evitar escrituras parciales, relaciones huérfanas y actualizaciones silenciosas.
4. Proporcionar importación, exportación, respaldo y restauración verificables.
5. Permitir que una evolución adopte Supabase o Cloudflare sin rehacer la interfaz ni las reglas del CRM.

## Límites del MVP

- Escritorio completo; no se promete una experiencia móvil soportada.
- Un navegador/perfil/equipo conserva su propia base; no existe sincronización entre dispositivos.
- GitHub Pages publica la aplicación, no una base de datos.
- No hay cuentas, backend de datos, correos automáticos, notificaciones remotas ni procesos garantizados con la PWA cerrada.
- No se almacenan adjuntos ni contenido de PDF, vouchers o confirmaciones.
- El build publicado no contiene registros operativos, respaldos ni información histórica hardcodeada.

## Ruta de ejecución

```text
GitHub Pages
    │ entrega HTTPS, interfaz y actualizaciones
    ▼
PWA instalada en Windows
    │ abre en ventana propia y conserva el app shell
    ▼
Interfaz React
    ▼
Casos de uso
    ▼
Dominio TypeScript
    ▼
Contratos de repositorios/servicios
    ├── Adaptador IndexedDB — MVP
    ├── Adaptadores CSV/Excel/JSON — MVP
    └── Adaptador Supabase o Cloudflare — evolución
```

## Stack aprobado

- **Interfaz:** React.
- **Lenguaje:** TypeScript con comprobación estricta.
- **Construcción y desarrollo:** Vite.
- **Distribución:** build estático desplegado a GitHub Pages mediante un flujo reproducible de GitHub Actions.
- **Instalación y offline:** manifiesto web y service worker versionados.
- **Persistencia:** IndexedDB detrás de contratos propios de la aplicación.

Las versiones concretas se seleccionan entre versiones estables al preparar la implementación y se bloquean en el archivo de dependencias. Una dependencia no puede convertirse en fuente de reglas de negocio ni acoplar la interfaz a IndexedDB.

Para evitar errores de recarga propios del alojamiento estático de GitHub Pages, la navegación del MVP usa hash routing y configura correctamente la ruta base y el alcance de la PWA. Una futura adopción de dominio propio cambia el origen de almacenamiento: antes de mover la aplicación se exigirá exportar JSON en el origen anterior y restaurarlo en el nuevo.

## Separación por capas

### Presentación

Contiene pantallas, componentes, formularios, navegación, traducciones y estados visuales. Puede mostrar validaciones y solicitar confirmación, pero no decide reglas comerciales ni escribe directamente en IndexedDB.

### Aplicación

Orquesta casos de uso como crear Lead, registrar pago, convertir a `Vendido`, generar Tareas, importar un lote o restaurar un respaldo. Abre la unidad de trabajo, invoca reglas del dominio y solicita persistencia atómica.

### Dominio

Contiene entidades, tipos, estados, transiciones, cálculos, fechas, monedas y reglas descritas en `DATA_MODEL.md` y `PRD.md`. Es TypeScript independiente de React, del navegador y del proveedor de base de datos.

### Contratos

Definen cómo los casos de uso consultan y guardan entidades, ejecutan transacciones, buscan registros, importan/exportan y administran versiones. Las pantallas dependen de estos contratos, no de una tecnología concreta.

### Adaptadores

Implementan los contratos para IndexedDB, CSV/Excel, JSON, reloj/calendario y PWA. Un futuro adaptador remoto podrá implementar el mismo límite con Supabase o Cloudflare, añadiendo autenticación, autorización, migración y sincronización explícitas.

## Persistencia IndexedDB

Existe una única base versionada. Las colecciones se separan por entidad, relación y estado operativo conforme `DATA_MODEL.md`; los índices sirven a consultas aprobadas por relación, estado y fecha.

La versión 8 añade el índice compuesto de Notas `[ownerType+ownerId]` para el expediente Cliente/Viaje. No transforma registros, no altera claves ni relaciones y puede aplicarse sobre las versiones previas de la base.

La versión 9 añade el índice `tasks.serviceProviderId` para consultar Tareas creadas desde plantillas de Proveedor sin escanear toda la base. No transforma registros: las Tareas existentes conservan el campo ausente y las nuevas solo pueden referir un componente perteneciente al mismo Viaje.

Las versiones 10 a 13 mantienen migraciones aditivas: incorporan ciclo de archivo, configuración global, campos de Tareas/plantillas y finalmente `serviceAdditionalItems`. Ninguna versión elimina, recodifica o reescribe registros existentes; la versión 13 añade solo la colección e índices necesarios para conceptos adicionales de un Servicio.

Los campos posteriores de tasa de referencia/proyección de Comisión, resultado de cancelación por componente, dirección de Cliente y vínculo de Comisión en Tarea se almacenan como propiedades opcionales compatibles con los registros de v13. No requieren una nueva colección ni una reescritura de datos: la aplicación interpreta la ausencia como el comportamiento histórico y conserva el valor existente sin completarlo artificialmente.

Toda acción de negocio es una transacción: los registros principales, relaciones, derivados persistidos permitidos y Eventos de actividad se confirman juntos. Un fallo de validación o escritura conserva el estado anterior. Esta regla incluye conversión, pagos, tareas generadas, importación, restauración y migraciones de esquema.

La UI nunca usa la API de IndexedDB directamente. Las preferencias pequeñas de interfaz pueden usar almacenamiento simple; los datos del CRM no.

## PWA, caché y actualización

La primera carga necesita conexión. Después, el service worker conserva únicamente los recursos necesarios para ejecutar la interfaz; los datos operativos permanecen en IndexedDB, separados del caché de recursos.

Al abrir con conexión:

1. La PWA muestra de inmediato la versión local vigente.
2. Comprueba GitHub Pages en segundo plano.
3. Si encuentra una versión nueva, la descarga y muestra `Actualizar ahora` o `Más tarde`.
4. Nunca activa una versión ni recarga una sesión en curso sin confirmación.
5. Si la versión cambia el esquema de datos, exige un respaldo JSON del esquema vigente, descargado después del último cambio local conocido, antes de aplicar la migración.

No se confía en ejecución periódica del navegador para alertas operativas con la aplicación cerrada. Esa capacidad requerirá backend en una evolución.

## Datos publicados y datos locales

GitHub Pages puede exponer públicamente los recursos estáticos de la aplicación. El artefacto de despliegue contiene solo HTML, CSS, JavaScript, iconos, fuentes y metadatos necesarios para ejecutar la interfaz. Los archivos fuente históricos, paquetes CSV, respaldos JSON, exportaciones Excel y registros del CRM no forman parte del despliegue.

IndexedDB pertenece al origen web y al perfil del navegador. Cambiar de navegador, perfil, equipo, dominio o protocolo no traslada los datos; el mecanismo soportado de traslado es respaldo JSON y restauración guiada.

## Importación CSV

El único ingreso masivo del MVP es el paquete CSV canónico con `manifest.json` definido en `IMPORT_EXPORT_SPEC.md`.

La aplicación primero valida estructura, versión, checksums, relaciones y filas. Luego muestra una vista previa con conteos, advertencias, errores y duplicados. Una carga posterior es aditiva: una fila cuyo ID ya existe no altera el registro actual; las filas nuevas independientes pueden confirmarse. El subconjunto aceptado se guarda atómicamente con su lote y trazabilidad.

No existe importación directa de Excel, merge automático ni sobrescritura por CSV. La actualización de un registro existente se hace en el CRM; el reemplazo completo usa restauración JSON.

## Exportación, respaldo y restauración

- **Excel:** salida operativa para consulta e interoperabilidad; no reinicia el recordatorio de respaldo.
- **JSON:** copia completa, versionada y restaurable; registra fecha/hora de descarga.
- **CSV:** contrato de carga masiva, no respaldo general.

El JSON de respaldo del MVP no aplica contraseña ni cifrado adicional dentro de la aplicación. Se descarga con un nombre que contiene fecha/hora y el mini manual recomienda guardarlo en una carpeta privada y dedicada de OneDrive, por ejemplo `OneDrive/World Memories/Respaldos CRM`. Antes de descargar o restaurar, la interfaz advierte claramente que el archivo contiene los datos del CRM y debe permanecer bajo control de la usuaria. El cifrado administrado se reconsidera junto con el backend futuro; una contraseña olvidada no debe convertir un respaldo del MVP en irrecuperable.

Restaurar JSON reemplaza completamente la base local. Antes de habilitarlo, el sistema exige descargar un respaldo del estado actual, valida integridad/compatibilidad y presenta fecha, versión y conteos del archivo elegido. La usuaria confirma explícitamente. La restauración se completa toda o no modifica nada.

La pantalla Datos y respaldos incluye el mini manual operativo no técnico aprobado en DEC-171 junto a las acciones correspondientes.

## Manejo de errores

- Un error de validación señala el campo o fila y explica cómo corregirlo sin tecnicismos.
- Una operación transaccional fallida revierte todos sus cambios y conserva la información capturada en pantalla cuando sea seguro.
- Una importación o restauración inválida no modifica IndexedDB.
- Un fallo de exportación no registra el respaldo como descargado.
- Un fallo al buscar actualizaciones no bloquea el uso de la versión local.
- Una migración de esquema fallida no se declara exitosa y ofrece la ruta documentada de restauración.
- Los reportes técnicos usan identificadores y causas controladas; la interfaz presenta mensajes accionables.

## Evolución a Supabase o Cloudflare

GitHub Pages puede continuar alojando la interfaz. El cambio futuro agrega un adaptador remoto y servicios persistentes para usuarios, sincronización, correos, push e integraciones.

Antes de esa evolución se diseñarán explícitamente autenticación, autorización, reglas de acceso, resolución de conflictos, migración inicial, cifrado, auditoría y rollback. No se implementan capas ficticias de sincronización en el MVP; solo se preserva el límite técnico que evita reescribir el dominio y la UI.

Los Eventos de actividad y estados de Tareas/alertas son la fuente futura de disparadores. GitHub Pages no ejecutará esos disparadores: Supabase, Cloudflare u otra infraestructura persistente lo hará.

## Estrategia de pruebas aprobada

### Pruebas automáticas

- **Estáticas:** TypeScript estricto, reglas de calidad y build de producción.
- **Unitarias:** estados, transiciones, fechas, monedas, comisiones, alertas, tareas y transformaciones puras.
- **Contrato:** el adaptador de memoria usado por pruebas y el adaptador IndexedDB cumplen los mismos comportamientos.
- **Integración:** transacciones IndexedDB, migraciones, búsqueda, importación CSV, exportación Excel y ciclo JSON respaldo/restauración.
- **Componentes:** formularios, validaciones, diálogos, foco, traducciones y estados accesibles.
- **Extremo a extremo:** Lead → cotización → primer pago → Viaje → Tareas/Proveedor → Comisión → cierre, además de importación y recuperación.

### Pruebas reales y manuales

- Instalación de PWA y apertura desde icono en Windows.
- Operación offline después de primera carga.
- Detección de versión nueva, `Más tarde`, `Actualizar ahora` y actualización con migración.
- Restauración en una base limpia y comparación de IDs, conteos, relaciones, fechas y montos.
- Revisión visual de escritorio, marca, zoom, teclado, foco, contraste y alternativas al color.
- Validación en navegadores Chromium de escritorio soportados, con Chrome como referencia principal y Edge como compatibilidad.

### Datos de prueba

Las pruebas automatizadas usan datos sintéticos. La migración final utiliza el libro actualizado únicamente mediante el proceso de conversión aprobado y genera reportes trazables; los valores reales no se incorporan al código ni a capturas/documentación de prueba.

## Puertas de calidad antes de publicar

1. Compilación y pruebas automáticas sin fallos.
2. Cero relaciones huérfanas en datos de prueba y lote de migración.
3. Round-trip JSON verificable: respaldar, restaurar en base limpia y comparar.
4. Importación CSV con duplicados/errores sin sobrescritura ni cambios parciales.
5. Flujo comercial principal completado de extremo a extremo.
6. PWA instalable, utilizable offline y actualizable sin interrumpir una sesión.
7. Revisión visual y accesible de las pantallas incluidas en el MVP.
8. Limitaciones conocidas y recuperación documentadas dentro de la plataforma.

## Decisiones que sustentan esta arquitectura

- DEC-142–144: intercambio de datos, respaldo y experiencia sin infraestructura cotidiana.
- DEC-153, DEC-161: módulo de datos y límite de escritorio/móvil.
- DEC-168–170: GitHub Pages, PWA, adaptadores, offline y actualizaciones.
- DEC-171–173: restauración, transacciones e importación aditiva.
- DEC-174–176: stack modular, estrategia de pruebas y política de respaldo local.

## Puerta siguiente

La Fase F quedó cerrada con la aprobación formal de esta arquitectura. Se presenta el paquete de aprobación de la Fase G. Solo una autorización inequívoca de implementación en Fase G permite crear código, instalar dependencias o desplegar el producto.
