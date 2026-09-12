# Progreso del proyecto

## Estado actual

- **Cierre de aceptación y addendum de interfaz — 2026-09-12:** la usuaria confirmó el recorrido manual real en **Microsoft Edge a 100 % y 200 %**; esa evidencia sustituye la pausa histórica de zoom de esta misma fecha. Se aplicaron además cinco ajustes posteriores: el selector telefónico muestra país, ISO y lada, mientras residencia muestra sólo país; capas flotantes se descartan al hacer clic fuera; Correo conserva altura compacta; el rango conocido de Lead se ubica antes de presupuesto/moneda; y la regla se auditó en menú de acciones, búsqueda, calendario y notificaciones. `npm test -- --reporter=json --outputFile artifacts/vitest-final-2026-09-12-corrections.json` pasó con **206 suites / 101 archivos / 434 pruebas**; `npm run test:e2e` pasó **29/29**; typecheck, lint, build PWA (14 recursos, 1,300.61 KiB), `npm audit --omit=dev --audit-level=high` (0 vulnerabilidades) y `git diff --check` pasaron. La advertencia de dos chunks >500 kB es deuda de rendimiento no bloqueante. El revisor independiente Astra Medium otorgó **GO para main** sin hallazgos Critical ni Important; se añadió además la aserción de foco destino para las capas descartables. Sigue la integración autorizada.

- **Línea base completa verificada — 2026-09-11:** el canal de la primera ejecución no esperó el resultado de Vitest, pero no había un fallo funcional. La repetición serial con reporte JSON terminó con **206 archivos / 417 pruebas pasadas** y cero fallos; evidencia local reproducible: `artifacts/vitest-full-2026-09-11.json`. Las verificaciones dirigidas registradas siguen vigentes. Aún faltan E2E, revisión visual y demás gates de cierre antes de publicar.

- **Cierre automático repetido — 2026-09-11:** tras las correcciones de contexto/foco de Leads y de hidratación de Configuración, `npm test -- --reporter=json --outputFile artifacts/vitest-final-2026-09-11.json` pasó con **206 archivos / 430 pruebas**; `npm run test:e2e` pasó con **28 flujos** (`test-results/.last-run.json: passed`). También pasan typecheck, lint, build PWA (14 recursos de precache, 1,299.78 KiB), `npm audit --omit=dev --audit-level=high` (0 vulnerabilidades) y `git diff --check` (sin errores de espacio; avisos CRLF propios de Windows). La nueva regresión de Configuración evita que una carga persistida posterior active falsamente `Cancelar cambios` o la guarda de navegación. La advertencia de Vite por dos chunks >500 kB es deuda de rendimiento no bloqueante. **No hay GO de publicación aún:** falta el gate explícito de Edge con zoom real 100 % y 200 % sobre la build final; un viewport reducido o una PWA instalada de una build anterior no lo sustituye.

- **Suite E2E completa verificada — 2026-09-11:** los **22 flujos** de Playwright terminaron con estado `passed` y cero fallos en servidor/origen local aislado. El estado final está en `artifacts/playwright-full-2026-09-11.json/.last-run.json`; el argumento `--output` crea el directorio de artefactos de Playwright, no un JSON de reporter. Aún faltan auditoría visual/manual y el resto de gates antes de publicar.

- **Dependencias y formato — 2026-09-11:** `npm audit --omit=dev --audit-level=high` reportó cero vulnerabilidades. `git diff --check` no emitió errores de espacio; los avisos CRLF reflejan el checkout Windows y no una diferencia de contenido. No equivale a trazabilidad de entrega mientras existan cambios sin versionar.

- **PRE-04 parcialmente verificado — 2026-09-10:** Configuración registra una guarda temporal mientras existe borrador. La navegación lateral y un cambio de hash no desmontan el editor: restauran la ruta de Configuración y muestran **Seguir editando**, **Guardar configuración** o **Descartar cambios**. Guardar espera el resultado de persistencia antes de continuar; descartar es la única salida que pierde el borrador. Un cambio de idioma desde el shell ahora actualiza solo el idioma del borrador y conserva las altas/ediciones de catálogo. Evidencia: `SettingsPage.test.tsx` (10) y `settings-cards.spec.ts` (tres recorridos de navegación/idioma), con typecheck y lint verdes. Aún falta generalizar la primitiva a los demás editores y revisar el preview a zoom real.

- **A1 / PRE-01–04, Configuración verificada de forma dirigida — 2026-09-11:** el alta y la edición de catálogos usan la misma superficie de campo de los formularios (borde, relleno y altura mínima de 44 px). Se corrigió un defecto reproducible al ancho equivalente a zoom 200 %: el input de alta era de 23 px frente al botón de 44 px. `settings-cards.spec.ts` ahora cubre geometría a 100/200 %, ausencia de desbordamiento horizontal, estado contenido en su fila, cambio ES→EN, navegación lateral/hash con borrador, descartar y el recorrido editar→cambiar idioma→seguir editando→guardar→navegar (**7/7**). La vista local actual confirmó a 100 % controles alineados de 44 px y sin overflow. `SettingsPage.test.tsx` conserva el caso de fallo de persistencia y borrador intacto; typecheck y lint pasan. Falta recorrer visualmente los cinco catálogos y la pasada integral D; no hubo publicación ni datos reales.

- **PRE-12 / PRE-14, persistencia y Lead E2E verificados — 2026-09-11:** el round-trip aislado de IndexedDB y respaldo JSON conserva un país nuevo en ISO (`MX`) y teléfono internacional (`+50760000000`) sin convertir ni perder un país/teléfono histórico capturado como texto. Una E2E sintética crea un Lead con residencia, lada independiente, correo y presupuesto USD, recarga, cambia la interfaz a EN y lee IndexedDB para comprobar que los valores capturados no se traducen ni alteran. Evidencia: `backupRestore.test.ts` (7) y `tests/e2e/leads.spec.ts` (2), typecheck y lint verdes. Faltan prefijo compartido, fallo de persistencia y edición tras reabrir, enumerados en el complemento.
- **PRE-15, importes operativos — evidencia automatizada ampliada 2026-09-11:** se inventariaron por tipo todos los controles numéricos en `VERIFIER.md`; sólo los importes monetarios fueron migrados. `AmountField` responde a un reinicio externo del formulario (3 pruebas). Venta y comisión variable de Servicio/Proveedor (9), anticipo de conversión de Lead (4), importe recibido de Comisión (5), alta/corrección de Pago de Cliente (9), corrección desde el expediente de Pago (2) y concepto adicional de Viaje (16) pasan sus regresiones dirigidas. El conjunto dirigido completo suma **8 archivos / 56 pruebas**, con typecheck y lint verdes; el backup JSON confirma que los decimales monetarios se exportan/restauran como `number`, nunca como texto localizado. Chromium real comprobó también que teclear `1234.56` en Presupuesto muestra `1,234.56` y conserva `1234.56` en IndexedDB (`tests/e2e/leads.spec.ts`, 2/2). La vista previa que mostró el valor sin agrupar usó inyección de texto y no reprodujo pulsaciones reales; no es un fallo del control. Falta la revisión visual transversal a 100/200 % y los otros gates del complemento; este avance no habilita publicación ni usa datos reales.

- **PRE-07 parcialmente verificado — 2026-09-11:** `ActionMenu` conserva navegación por flechas, Inicio/Fin y Escape; ahora también cierra al tabular fuera o al hacer clic fuera, sin dejar un menú visible sin foco. Evidencia: `ActionMenu.test.tsx` (3), typecheck y lint verdes. Falta la pasada E2E transversal y la revisión de acciones de los ocho tipos de registro.

- **PRE-05, contexto completo de Leads — corrección dirigida 2026-09-11:** `query`, origen y estado dejaron de pertenecer al árbol desmontable de `LeadList`: `App.tsx` conserva los cuatro filtros de lista (incluido archivo) mientras se abre y se cierra el expediente completo. La regresión E2E primero reprodujo la pérdida de búsqueda (`Calderón` volvía vacío) y, tras elevar el estado, verifica texto + origen + estado, resultado visible y devolución de foco al mismo registro (**2/2** en `filter-context.spec.ts`). Typecheck y lint pasan. Queda medir/restaurar scroll con una lista larga y aplicar esta profundidad a los otros siete expedientes en C2/D; no hubo publicación ni datos reales.

- **C1 / PRE-16–17, ayudas y superficies dirigidas — 2026-09-11:** el diálogo de impacto de eliminación muestra su ayuda mediante portal de viewport; una E2E a ancho equivalente 200 % comprueba el texto completo, posición dentro de los cuatro márgenes y ausencia de recorte por modal. El inventario de `textarea` identificó Lead/Cliente (ya bajo `form-grid`), Proveedor y Viaje (ya bajo `field-label`) y dos huecos: nota de diferencia de Comisión (`conversion-form`) y nota de cancelación de Lead (`detail-section`). Ambos reciben ahora el mismo borde, contraste, 96 px mínimos y redimensionamiento vertical; los checkbox no heredan altura de campo. Evidencia: `delete-records.spec.ts` (3/3), typecheck y lint. Falta la pasada visual completa C1/D en paneles y ES/EN; no hubo publicación ni datos reales.

- **PRE-09 / PRE-11 parcialmente verificados — 2026-09-11:** la exportación JSON/Excel bloquea solamente su propia acción mientras prepara el archivo, informa el fallo sin registrar un respaldo inexistente y deja la restauración disponible. La PWA conserva pendiente el callback de actualización, espera al service worker, limpia listeners al desmontar y comprueba al volver online/visible o cada hora. El manifiesto no cacheado `world-memories-update.json` declara la versión de snapshot: un cambio de esquema exige respaldo actual y ofrece **Ir a respaldo**; los cambios de código conservan la actualización normal. La prueba Playwright de **dos builds realmente distintos en el mismo origen aislado** confirmó aviso, bloqueo ante la versión 3→4, navegación a Datos y respaldo y habilitación tras solicitar la descarga. Una regresión unitaria demuestra que una actualización no se aplica mientras Configuración tiene borrador: el diálogo obliga a continuar editando o descartar antes de recargar. `DataBackupsPage` ya se carga en el shell inicial, pues una app anterior no puede depender de un chunk diferido que la nueva build haya sustituido. Evidencia: `DataBackupsPage` (6), `AppRootUpdate`/`pwa`/`updatePrompt` (incluida la guarda de borrador) y `pwa.spec.ts` (3); typecheck, lint y build verdes. Aún faltan Posponer/reofrecer y el fallo explícito de respaldo antes de certificar PRE-11. No hubo publicación ni datos reales.

- **Tramo B–D parcial verificado — 2026-09-10:** además del editor de Configuración ya registrado, los formularios de Lead, Cliente y Proveedor comparten validación de correo opcional y accesible; Proveedor ahora también expone `aria-invalid` y el mensaje asociado. País de residencia es un combobox offline que busca por nombre ES/EN/código sin acentos y conserva valores históricos no catalogados. El teléfono usa una lada elegida de forma independiente y serializa elecciones nuevas en forma internacional sin inferir residencia. `libphonenumber-js@1.13.13` (MIT, metadatos empaquetados) suministra países/prefijos; no hay consulta remota. Presupuesto usa `AmountField`: `1,234.56` se persiste como `1234.56`, al perder foco muestra dos decimales y rechaza texto ambiguo sin convertirlo silenciosamente. El tooltip se porta al viewport, respeta foco/Escape y queda sobre contenedores que recortan. Evidencia consolidada: 9 archivos / 51 pruebas dirigidas, typecheck, lint y build PWA verdes. Pendientes de estos tramos: round-trip IndexedDB/JSON y E2E de país/teléfono/importe, aplicar importe a los demás campos monetarios según su contrato, y preview a zoom real. No se aplicó el tratamiento estético de filas porque la opción de sombras/superficie sigue pendiente de decisión.

- **Complemento de reanudación — actualizado 2026-09-11:** al reanudar el goal existente leer primero [complemento de reanudación](docs/superpowers/plans/2026-09-10-prepublication-addendum.md). Consolida PRE-01–17, separa avance de cierre y contiene ahora un mapa obligatorio por cola, archivos, contratos, pruebas y salida de cada tramo para Tierra High. No repetir regresiones verdes: PRE-01–04, PRE-07, PRE-09, PRE-11 y PRE-12/14 tienen avances comprobados, pero siguen abiertas sus pruebas integradas, visuales o de superficie completa. La siguiente unidad es **B2/PRE-15**: inventario verificable y conversión exclusiva de los importes monetarios a `AmountField`; el complemento enumera los campos permitidos y los controles que deben mantenerse sin cambio. Luego A1 visual, C1, C2 y D. No hubo publicación ni datos reales; el goal no se canceló ni recreó.

- **Punto de reanudación operativo — actualizado 2026-09-11:** A1/PRE-01–04, A2/PRE-11, B2/PRE-15, C1/PRE-16–17 y el retorno de filtros de Leads PRE-05 tienen evidencia dirigida reciente. A2 ejecutó sus cinco archivos unitarios (**19 pruebas**) y la suite E2E completa posterior terminó `passed`; no cambió el manifiesto de actualización (`workspaceSnapshotVersion: 3`). La siguiente unidad es **C2**: matriz E2E de acciones, filtros, foco y expedientes para los ocho tipos; después B1 (bordes de contacto) y D (matriz global). La suite Vitest final deberá repetirse con reporte capturable antes de cualquier dictamen. No hubo publicación, push, etiqueta ni datos reales.

- **Revisión previa a publicación — 2026-09-10: NO GO.** Se retira la afirmación del 2026-09-08 de que solo faltaba zoom/publicar. La revisión actual confirma pendientes de Configuración, campos compartidos, filtros/contexto, navegación, exportación y cobertura UAT; además detecta un fallo crítico en `AppRoot` al almacenar el callback de actualización PWA. No se cambiaron código ni datos y no se publicó. Hallazgos, alternativas visuales (aún propuestas), alcance histórico de renombrar catálogos y punto de reanudación: [PRE-01–11](docs/qa/2026-09-10-prepublication-review.md). La adquisición de la pestaña Edge agotó el tiempo; no se certificó una nueva revisión visual global ni se repitieron suites. Reanudar por PRE-11 y luego completar las casillas del plan visual; la evidencia técnica histórica no cierra requisitos que no cubre.

- **Candidato de cierre visual — 2026-09-08:** la implementación y las verificaciones automáticas de las seis oleadas del plan visual están completas, pero el dictamen final y cualquier publicación siguen pendientes de la única evidencia manual que exige el plan: zoom real de Edge a 100 % y 200 %. La automatización solo expone control de viewport; `Ctrl+0`/`Ctrl+=` no alteraron la escala y no se puede sustituir por viewport. Evidencia reciente: `npm test` **93 archivos / 370 pruebas**, `npm run test:e2e` **17 flujos**, typecheck, lint, build PWA, auditoría de producción (0 vulnerabilidades) y `git diff --check` pasan el 2026-09-08. La vista previa aislada `127.0.0.1:4175` mostró Dashboard, Configuración por fichas y Preferencias/formato con logo oficial, sin errores ni advertencias de consola. La matriz de evidencia se actualizó en `VERIFIER.md`; no se ha hecho push, despliegue ni etiqueta.

- **Pausa controlada — 2026-09-07 (cierre visual/interacción):** las oleadas del plan visual siguen **sin certificación formal**; esta pausa no equivale a cierre de Oleada 1 ni 2. Desde el corte anterior se creó el fixture aislado `tests/e2e/fixtures/visualWorkspace.ts` (solo IndexedDB temporal de Playwright, sin perfil de Edge ni datos reales) y pasaron sus recorridos visuales ES/EN: diez módulos poblados, un único `h1`, cero overflow global a 1440×900, 1280×800 y 900×700. También pasaron `settings-cards.spec.ts`, `visual-uat.spec.ts`, `filter-context.spec.ts` y `record-workspaces.spec.ts`; este último corrigió el breadcrumb del expediente completo: el antecesor vuelve a la lista y el registro actual usa `aria-current="page"`. La prueba roja de contexto reveló que Lead perdía el chip **Archivados** al cerrar el expediente; `App.tsx` ahora conserva ese filtro fuera de la rama desmontable y la verificación pasó. Typecheck pasó después de ese cambio.

  **Punto exacto para reanudar:** quedó creada, pero aún no ejecutada, la prueba de integración `replaces a valid backup through the IndexedDB repository without leaving restoration pending` en `tests/integration/backupRestore.test.ts`. Su propósito es aislar el hallazgo real de `tests/e2e/backup-restore-flow.spec.ts`: con un respaldo JSON recién descargado del fixture, la selección, validación y diálogo de confirmación funcionan, pero tras confirmar la restauración la interfaz permanece en **“Restaurando respaldo…”** más de cinco segundos. No se debe ocultar con una espera mayor: primero ejecutar esa prueba Dexie; si confirma el bloqueo, revisar `DexieWorkspaceRepository.replaceSnapshot` y su transacción antes de repetir el E2E. Si no lo confirma, inspeccionar el paso navegador/archivo sin alterar el contrato de respaldo. El último servidor de Playwright fue efímero en `http://127.0.0.1:4174` y ya terminó; la inspección manual anterior sigue en `http://127.0.0.1:5173`, pero debe verificarse antes de usarla. No se ejecutaron restauraciones ni borrados sobre la base de la usuaria.

- **Pausa controlada — 2026-09-07:** la corrección visual/interacción sigue activa; no se ha creado etiqueta B1 ni se ha realizado publicación o despliegue nuevo durante esta corrección. Se consolidó la regla transversal de confirmación visual World Memories: confirmar/cancelar solo ante descarte de borrador, cambios financieros, cancelación comercial, restauración/importación y ciclo de vida; filtros y navegación inocua no solicitan confirmación. `ConfirmDialog` devuelve el foco al disparador, y Pago de Cliente, corrección de Pago, cancelación de Viaje, importación CSV y restauración esperan una segunda confirmación y conservan formulario/diálogo si falla el guardado. El selector de archivo ya tiene botón propio y nombre seleccionado; los procesos de CSV/restauración muestran etapa real, no porcentaje ficticio. Se añadió la protección de que una fecha inválida visible no permita guardar una Tarea con la fecha anterior, y el rango Desde/Hasta invertido de Tareas conserva resultados y explica el error. Inspección local Edge en `http://127.0.0.1:4173`: Proveedores muestra logo oficial, un único título y estado vacío de alta manual; Tareas muestra filtros compactos y su expansión sin el fieldset disruptivo. No se crearon registros durante esa inspección.

  **Último tramo realmente cerrado:** se escribió primero la regresión roja y después se corrigió el Viaje superviviente cuyo Cliente se eliminó deliberadamente. `App.tsx` y `TripDetail.tsx` ahora resuelven la relación como viva/eliminada/no encontrada, muestran `Registro eliminado: …`, no fabrican un Cliente y permiten guardar cambios propios del Viaje. `saveTripWorkspace` y los repositorios Memory/Dexie admiten actualizar solo ese Viaje cuando hay una referencia histórica válida, pero rechazan reconstituir el Cliente eliminado. Las pruebas de este tramo pasaron: `recordLifecyclePersistence`, `tripWorkspace` y `accessibility-shell`, 46 pruebas; typecheck y lint también en verde. Se ajustaron dos pruebas de corrección de pago para confirmar explícitamente el diálogo ya aprobado.

  **Punto exacto para reanudar:** Oleada 3, Tarea 3.2, extensión de lecturas históricas. Ya se añadió una prueba dirigida en `tests/unit/taskBoard.test.tsx` para que el filtro de Viajes de una Tarea muestre `Registro eliminado: Familia histórica` en vez de un fallback sin nombre. Su primera ejecución quedó en curso al pausar y no cuenta como resultado. Retomar verificando esa prueba; lo esperado es que inicialmente revele que `TaskBoard`/`TaskForm` aún no reciben `deletedReferences`. Luego implementar la resolución central `live/deleted/missing` en ambas superficies, pasar `deletedRecordReferences` desde `App.tsx`, y ejecutar de nuevo esa suite, typecheck y lint. Solo después extender el mismo contrato a Comisiones, Calendario, Dashboard, búsqueda y guardas de edición. La regresión completa anterior no tuvo salida final legible; debe repetirse únicamente al cierre y no acredita ninguna oleada. El preview local anterior era `127.0.0.1:4173`; verificarlo antes de usarlo.
- **Corrección visual e interacción en curso (2026-09-06):** se inició la implementación continua del plan visual aprobado. Se corrigieron los filtros de Clientes/Familias, Proveedores, Calendario y Tareas; Configuración abre catálogos como fichas, un editor a la vez y conserva su borrador al volver; y las cabeceras/acciones ya no se superponen. Fecha fija y hora operativa validan borradores sin guardar el valor anterior; menú de acciones y ayudas tienen teclado. Lead, Cliente/Familia, Tarea, Viaje y Proveedor muestran la confirmación alineada “Cambios sin guardar” y usan el aviso nativo de cierre solo si existe un borrador sucio. `ConfirmDialog` ya centraliza foco seguro, Tab/Shift+Tab, Escape y bloqueo durante persistencia; toda salida de un borrador sucio debe ofrecer **Continuar editando**, **Descartar cambios** y, cuando exista, **Guardar cambios**, en vez de descartar por accidente. La eliminación conserva una referencia histórica explícita en una migración aditiva IndexedDB v15 y respaldo JSON v3, espera la transacción, muestra nombres concretos, recomienda archivar, exige segunda confirmación y permite optar por eliminar solo eventos propios. El primer expediente/lista ya representa un Cliente eliminado como vínculo histórico explícito, y el filtro de Viaje de Tareas usa contexto legible en vez de IDs; reprogramar requiere **Aplicar fecha**, espera su persistencia y conserva el borrador con un error visible si falla. El Calendario, Dashboard y alertas omiten registros archivados/cancelados y saldos de componente totalmente cubiertos; nunca suman pagos de moneda distinta y explican saldo conocido, total pendiente o inconsistencia de moneda. La reconciliación tampoco recrea una tarea automática eliminada deliberadamente. La regresión actual ejecutó 84 archivos/330 pruebas, typecheck, lint y `git diff --check` sin diferencias de espacio; las advertencias de CRLF son informativas. Falta cerrar las seis oleadas: referencias históricas en todas las superficies, acordeones/procesos, QA visual poblado, E2E integral y regresión final; **sin B1 ni publicación nueva**.
- **Aceptación visual reabierta (2026-09-05, posterior al piloto):** capturas de la usuaria e inspección en Edge confirman problemas transversales de composición, filtros, Configuración, acciones e internacionalización. El cierre técnico de abajo se conserva como evidencia histórica, no como aceptación visual completa. Dictamen actual: **pendiente de corrección y UAT visual; sin B1**.
- **Diagnóstico y plan guardados:** `docs/qa/2026-09-05-visual-audit.md` contiene cobertura, 27 hallazgos y límites; `docs/superpowers/plans/2026-09-05-world-memories-visual-interaction-closure.md` define seis oleadas para Tierra Alto. El estado “propuesto” que aparece en el texto histórico queda sustituido por la ejecución anterior; las casillas individuales solo se marcarán al cierre verificable de su oleada. Reanudar en el contrato de diálogos/acciones asíncronas y la matriz de referencias históricas antes de certificar la Oleada 1/3.
- **Aclaraciones vigentes:** eliminar también con relaciones mediante impacto específico y segunda confirmación, historial propio opcional y sin borrar relacionados automáticamente. Confirmaciones proporcionadas y protección al salir con cambios sin guardar. DEC-185 registra la precedencia sobre el bloqueo antiguo. La referencia histórica mínima ya se persiste de forma atómica en IndexedDB v14 y respaldo JSON v3. La prevención de reutilizar un ID eliminado ya se aplica en los `put` gestionados y a la tarea automática de Comisión; quedan las superficies de lectura completas, el `automationKey` serializado y la verificación transversal.
- **Evidencia:** diez secciones recorridas, variantes disponibles sin guardar registros, lectura de los ocho expedientes y 5 archivos / 22 pruebas dirigidas pasan. No se certificaron zoom real200, pasada visual completa EN ni variantes pobladas de todos los expedientes. Solo documentación: sin datos, commits, push ni despliegue.

## Corte técnico anterior — histórico frente a la UAT visual actual

- **Cierre correctivo pre-B1 completado (2026-09-05):** el GO técnico `VER-I-048` queda sustituido por la evidencia fresca `VER-I-052`. La fuente operativa `docs/superpowers/plans/2026-09-01-world-memories-pre-b1-closure.md` está cerrada. No se usaron datos reales ni se creó etiqueta B1.
- **Bloque 1 completado:** `WorkspaceConfiguration` persiste en IndexedDB los catálogos globales e idioma; Configuración permite crear, editar y activar/desactivar entradas sin reescribir valores históricos. El idioma se restaura al reabrir, y todas las fechas operativas visibles/capturables usan `DD/MM/YYYY` en ES y EN mediante un control accesible, con horas de 24 horas y números `1,234.56`. Los controles regionales anteriores quedan sustituidos; la representación ISO se reserva al almacenamiento e interoperabilidad.

## Cierre — revisión independiente pre-B1 (2026-09-05)

- El cierre correctivo está **completo**. Hasta este punto no se creó commit, etiqueta B1, publicación ni despliegue.
- El logo oficial y el monograma oficial siguen integrados en el shell/PWA; se corrigieron dos referencias CSS no definidas para que alertas y filtros usen la paleta centralizada de World Memories.
- Se amplió el CSV sintético para `service_additional_items.csv`, el Excel ya conserva los campos operativos nuevos y el JSON v2 conserva configuración y conceptos adicionales. La restauración ahora rechaza una Tarea que refiera una Comisión inexistente.
- La protección de actualización ahora exige un respaldo JSON del esquema vigente que no sea anterior al último cambio local conocido. La documentación técnica ya describe la migración aditiva IndexedDB v13 y el CSV de conceptos adicionales.
- Se añadieron filtros independientes de tipo al Calendario; abrir una Tarea o Comisión desde su panel conserva el ID y abre su contexto. Las rutas contextuales serializan `?record=`.
- Hallazgos del corte anterior —**históricos, resueltos por el cierre del 2026-09-05**—: rehidratación contextual; búsqueda en notas/localizadores; Dashboard accionable y comisiones cobradas; alertas de pagos próximos; tasa congelada, historial y override; transición de componente y cancelaciones; timeline combinado; dirección/nota de Cliente; contacto principal; motivo configurable desde Lead; migración v11→v13, columnas Excel y E2E/zoom.
- La evidencia de 75 archivos/259 pruebas y la previsualización inicial son **históricas y sustituidas** por `VER-I-052`: 78 archivos/282 pruebas, 10 E2E reproducibles y revisión visual fresca del 2026-09-05.
- **Evidencia fresca del Bloque 1:** 70 archivos/216 pruebas unitarias e integración en verde, pruebas dirigidas de configuración, idioma, catálogos, fechas y estados localizados; typecheck, lint y build PWA completados el 2026-09-02. Preview local en ES y EN confirmó Configuración operativa, traducción completa de sus textos, catálogos vacíos explícitos donde no había valores aprobados y formato fijo. No se usaron datos reales.
- **Bloque 2 completado:** se puede crear, editar, completar, deshacer, reabrir o reprogramar una Tarea manual con título, fecha, hora y vínculo opcional a Lead, Viaje o Comisión. Los filtros aprobados de estado, Viaje, Proveedor e intervalo de fechas se aplican en Tareas. Las tareas fechadas se proyectan en Dashboard y Calendario, y el expediente de Viaje las muestra junto a su nota. Las plantillas de Proveedor admiten ancla de inicio/fin/manual, días o meses, snapshot, recálculo cuando cambia el Viaje y una decisión trazable para conservar o recalcular una fecha ajustada manualmente. Al abrir/refrescar, la reconciliación completa Viajes vencidos y crea una única Tarea de seguimiento por Comisión vencida.
- **Evidencia fresca del Bloque 2:** 73 archivos/232 pruebas unitarias e integración, 10 E2E —incluido crear, editar, completar, deshacer y proyectar una Tarea manual—, typecheck, lint y build PWA en verde el 2026-09-04. Se verificó round-trip IndexedDB de Tarea manual, recálculo/protección de plantillas y reconciliación idempotente. Preview local aislado confirmó en escritorio el tablero, filtros, formulario accesible con fecha `DD/MM/YYYY`, vínculo opcional y textos ES/EN, sin guardar datos de prueba. `git diff --check` no emitió errores, pero el repositorio continúa sin archivos rastreados y no equivale a trazabilidad de entrega. No se hicieron commits, etiquetas, publicación, despliegue ni operaciones con datos reales.
- **Bloques 3–5 completados:** el cierre añadió conversión con contacto principal visible, dirección de Cliente/Familia, motivo de cancelación desde Lead, tasa de Viaje confirmada y trazable, override/reversión de tasa por Comisión, cancelación no destructiva de Viaje y decisión explícita por componente, timeline combinado, Dashboard accionable, búsqueda en notas de Lead/Viaje y localizadores, y compatibilidad CSV/Excel/JSON para los campos incorporados.
- **Evidencia fresca de cierre:** `npm test` pasó con 78 archivos/282 pruebas; typecheck, lint y build PWA pasaron. Los 10 E2E pasaron secuencialmente. La migración v11→v13, JSON v1/v2, CSV sintético, Excel, actualización protegida, teclado/axe, PWA offline e inspección de consola están cubiertos. Revisión visual de `http://127.0.0.1:4174/#/dashboard` a 100 % y viewport equivalente a 200 %: logo oficial, paleta, rail y contenido legibles, sin desbordamiento observado. `npm audit --omit=dev --audit-level=high` reportó 0 vulnerabilidades.
- **Validación remota:** GitHub Actions reveló que una aserción de historial asumía la zona horaria local de Panamá. La interfaz mantiene horas en la zona local del dispositivo, con formato fijo `DD/MM/YYYY HH:mm`; la prueba ahora compara contra el formateador operativo central para evitar que el ejecutor UTC altere una expectativa de presentación. El despliegue piloto se revalida tras este ajuste de prueba, sin cambiar registros ni semántica de tiempo.
- **Versionado y piloto publicados:** el repositorio público de prueba `hbarcenas88/world-memories-crm-pilot` conserva los commits `4c1f511` y `db2a48e` en la rama `codex/world-memories-mvp`. La calidad remota y Pages pasaron sobre el commit corregido; la URL `https://hbarcenas88.github.io/world-memories-crm-pilot/` respondió 200 con título, logo oficial, navegación completa y consola limpia. Pages permite exclusivamente esa rama. Excel original, artefactos y temporales siguen ignorados; no hay etiqueta B1 ni datos operativos publicados.
- **Fase:** cierre técnico pre-B1 y prueba piloto completados. R1–R4 permanecen revisiones solo lectura ya utilizadas como insumo, no como automatización adicional.
- **Última actualización:** 2026-09-05.
- **Objetivo vigente:** conservar la evidencia del piloto y esperar una decisión separada antes de crear B1, ampliar el alcance o usar datos reales.
- **Estado general:** Fases A–G completadas; la implementación y el cierre correctivo están verificados.

## Trabajo completado

## Oleada 3 — cierre técnico

- **Task 10 — operación diaria, Dashboard y búsqueda cerrado (2026-08-27):** el tablero agrupa las tareas abiertas en Vencidas/Hoy/Próximas/Sin fecha, permite completar, reprogramar y deshacer con eventos auditables. La campana deriva alertas de tareas y comisiones vencidas desde IndexedDB: se mantienen hasta resolver el registro y no se descartan al abrirse. El Dashboard muestra KPIs separados por moneda, Viajes en curso/próximos y la cola de tareas vencidas. El buscador normaliza mayúsculas, acentos y separadores, agrupa Clientes, Leads, Viajes, Proveedores, Tareas y Comisiones, y lleva al módulo contextual. La verificación cerró con 39 archivos / 102 pruebas, lint, typecheck, build, E2E y revisión de interfaz servida de escritorio; el bundle de 805 kB sigue como límite conocido para resolver antes del cierre integral.
- **Task 11 — Calendario operativo cerrado (2026-08-27):** el Calendario deriva únicamente los intervalos efectivos de Viaje, Tareas abiertas con vencimiento, fechas límite de saldo del Cliente por componente activo y Comisiones esperadas. No representa campos sin fecha ni pagos ya registrados como compromisos nuevos. Incluye vistas mensual, semanal y planificación/agenda sin cuadrícula horaria; cada clic abre un panel contextual con rutas aplicables a Tarea, Viaje, Cliente o Comisión. La verificación incluyó proyección unitaria, componente accesible, flujo E2E de Viaje → Calendario → expediente y revisión de interfaz servida.
- **Oleada 3 — cierre técnico (2026-08-27):** las 41 suites / 106 pruebas, lint, typecheck, build, los 4 flujos E2E y `git diff --check` pasaron. La revisión independiente R3 no se activó; queda disponible solo con autorización explícita. El bundle de producción es 813.95 kB y mantiene la advertencia de tamaño, límite conocido que se resolverá antes del cierre integral.

## Oleada 4 — en cierre

- **Task 12 — Datos y recuperación cerrado (2026-08-27):** el ZIP CSV exige un manifiesto versionado con fecha, conteo por archivo y checksum SHA-256; previsualiza por fila y clasifica el subconjunto aditivo de Leads, Clientes, Viajes, Servicios, Proveedores, componentes, plantillas, Comisiones, Notas, Tareas, Pagos y Eventos. La confirmación vuelve a comprobar todos los IDs dentro de la misma transacción para rechazar cualquier colisión surgida después de la vista previa; ante ella o ante una relación inválida no persiste ninguna fila. JSON versionado con conteos/checksum se restaura solo tras descargar un respaldo actual; Excel operativo no usa fórmulas ni secretos. La pantalla de Datos ofrece manual no técnico y el recordatorio de tres días se conserva en IndexedDB, Dashboard y campana.
- **Task 13 — PWA y accesibilidad cerrado (2026-08-29):** la PWA precachea exclusivamente recursos de interfaz, genera manifiesto e iconos y pide explícitamente confirmar una actualización. La prueba visible confirma que `Más tarde` no aplica ninguna actualización y que solo `Actualizar ahora` la solicita. El E2E verifica manifiesto, iconos y acceso offline tras el primer acceso; axe no detecta violaciones serias/críticas en la superficie principal y teclado/foco del diálogo se verifican. El expediente y Datos y respaldos se cargan bajo demanda: el paquete inicial quedó en 388.91 kB, sin advertencia de tamaño. La suite registró 47 archivos / 120 pruebas unitarias e integración, 9 E2E, typecheck, lint, build y `git diff --check` en verde; la auditoría de dependencias de producción no reportó vulnerabilidades. La usuaria validó manualmente instalación en Windows, apertura desde Inicio sin Internet, navegación por módulos y conservación de un registro sintético creado offline en IndexedDB tras cerrar y reabrir. No se publicaron ni se usaron datos reales.

## Próximo diseño solicitado

- **Gestión de registros:** la usuaria solicitó editar, archivar y eliminar de forma visible. DEC-179 aprobado registra que archivar se recomienda pero nunca se ejecuta silenciosamente; no habrá borrado en cascada. La eliminación definitiva requerirá previsualización de impacto, confirmación y que todas las dependencias se hayan archivado, reasignado o resuelto para impedir huérfanos.
- **Expedientes:** DEC-180 aprobado define pantalla completa para los expedientes de registros, conservando la navegación global. DEC-181 aprobado añade paneles laterales redimensionables, con preferencia local y restablecimiento visible.
- **Calidad de interfaz:** se solicitó reforzar la aplicación visible del manual de marca y completar el inglés de todos los textos estáticos, sin traducir datos capturados.
- **Calidad de interfaz:** DEC-183 aprobado adopta la dirección visual Ruta World Memories. El inglés se centralizará para cubrir todos los textos estáticos, sin traducir datos capturados. El SVG oficial del logotipo fue recibido y validado el 2026-08-29; reemplazará el icono y texto provisionales durante la implementación aprobada.
- **Interacción:** DEC-182 aprobado centraliza un kit de componentes pragmático y accesible; especifica dónde usar acciones, filtros, ayuda contextual, procesos guiados y reversión rápida sin forzar patrones de móvil en escritorio.
- **Especificación de refinamiento:** la especificación consolidada está en `docs/superpowers/plans/2026-08-29-world-memories-refinement-spec.md` y su plan trazable en `docs/superpowers/plans/2026-08-29-world-memories-refinement.md`. Fueron aprobados explícitamente el 2026-08-29; la implementación está en curso.

## Refinamiento en ejecución

- **Base de integridad iniciada (2026-08-29):** se añadió `archivedAt` a los registros principales, análisis de relaciones por tipo, archivo/restauración con evento y eliminación bloqueada desde la transacción cuando existen dependencias. IndexedDB migra aditivamente a v11 sin inventar fechas de archivo; las pruebas cubren rollback al fallar el evento, y demuestran que intentar borrar un Cliente relacionado conserva tanto Cliente como Lead. La interfaz, filtros y edición siguen pendientes.
- **Interacción iniciada:** `ActionMenu` centraliza la apertura accesible de acciones secundarias con foco inicial y cierre por Escape. Está conectado a Lead y Cliente/Familia; faltan los demás tipos de registro.
- **Botones de icono y ayuda contextual:** `IconButton` centraliza botones sin texto con etiqueta accesible y tooltip al foco o hover. El disparador de acciones de expediente lo usa para explicar su función sin ocupar espacio visual adicional.
- **Localización en progreso:** se introdujo un proveedor tipado de idioma para toda la aplicación, con interpolación segura y formato operativo invariable. Ya usan el idioma activo los diálogos de decisión de archivar/eliminar (incluyendo el resumen de dependencias), sus menús, la ruta del expediente, filtros de Lead/Cliente, etiquetas dinámicas de acciones y el toast de archivo/Deshacer. Las pruebas cubren el cambio a EN sin alterar los valores capturados; fechas, horas, números y monedas no cambian por idioma. La sustitución completa de literales por módulo continúa pendiente; no se afirma cobertura completa ES/EN todavía.
- **Acciones seguras en Lead y Cliente/Familia (2026-08-29):** el menú visible permite editar; abre un formulario precargado y guarda de forma atómica, conservando relaciones (estado comercial en Lead; miembros/viajes en Cliente) y agregando el evento de corrección. También carga el impacto real antes de decidir: con dependencias no presenta eliminación definitiva y recomienda archivar; sin ellas exige una segunda confirmación explícita antes de eliminar. Al archivar Lead o Cliente/Familia, confirma mediante un toast de cinco segundos con **Deshacer**, que restaura explícitamente el registro y recarga el snapshot visible. Ambas listas comienzan en **Activos** y ofrecen chips explícitos para **Archivados** y **Todos**; un distintivo identifica el resultado archivado. Las pruebas dirigidas verificaron la decisión y el deshacer de Lead, además de los filtros de ambas listas; la revisión local fresca comprobó el formulario de Cliente/Familia y el resumen real de relaciones, sin errores de consola. Aún falta extender la integración a Servicios, Pagos y Comisiones.
- **Filtros de archivo extendidos:** `ArchiveFilterChips` centraliza Activos, Archivados y Todos con estado accesible. Se usa ahora en Lead, Cliente/Familia, Viaje, Proveedor, Tarea y Comisión; no modifica datos y conserva los resultados archivados como registros recuperables. Las acciones de archivo/restauración ya están conectadas en Viaje, Proveedor, Tarea y Comisión; permanecen pendientes Servicio y Pago.
- **Acciones seguras en Proveedores:** el formulario conserva la edición como acción principal y su cabecera incorpora el menú de ciclo de vida. Este carga el impacto transaccional antes de decidir, bloquea eliminación ante dependencias y ofrece archivo con toast y Deshacer. La prueba de shell verifica archivar y restaurar un Proveedor desde la interfaz.
- **Marca oficial aplicada:** el SVG entregado por la usuaria alimenta el logo lateral y el monograma de instalación PWA. La revisión local fresca comprobó el logo sobre blanco y que `Nuevo lead` continúa abriendo su formulario sin errores de consola; se conservará esta evidencia al cerrar el bloque visual.
- **Expediente enfocado en avance (2026-08-29):** Lead y Cliente/Familia permiten pasar de su panel al expediente completo, que conserva navegación global/topbar, oculta la lista y ofrece ruta de regreso. Sus paneles laterales comparten un separador ajustable por arrastre o teclado, limitado a 320–560 px, con preferencia local `wm.detailPanelWidth` y restablecimiento visible. El modo completo elimina la cuadrícula del panel para usar el ancho disponible y no duplica su propia acción de apertura. La verificación dirigida registró 10 archivos / 31 pruebas, typecheck, lint, build, `git diff --check` y revisión local fresca sin errores de consola. Aún falta aplicar el mismo contenedor a Viaje, Proveedor, Servicio, Pago, Comisión y Tarea, además de las acciones seguras completas.
- **Expediente de Viaje (2026-08-29):** Viajes ya entra al mismo contenedor completo, con breadcrumb, retorno y navegación global persistente; su lista queda fuera de la vista enfocada. El detalle mantiene su borrador único de Cliente/Viaje/Servicios/nota y el aviso de cambios sin guardar; ya incorpora el ciclo de vida seguro cuando no hay cambios pendientes.
- **Acciones seguras en Viajes:** el expediente de Viaje muestra el menú de ciclo de vida solo cuando su borrador está guardado. La decisión carga el impacto real, bloquea eliminación ante relaciones y permite archivar con Deshacer; editar sigue ocurriendo en el borrador unificado. La prueba de shell cubre archivar y restaurar el Viaje desde la interfaz.
- **Acciones seguras en Tareas:** la cola comienza en tareas activas y permite alternar explícitamente a Archivadas o Todas. Cada Tarea ofrece completar/reabrir y reprogramar, más el mismo menú de impacto para archivar, restaurar o solicitar eliminación. La prueba de shell verifica archivar una Tarea y restaurarla mediante **Deshacer**, sin eliminar vínculos ni datos relacionados.
- **Acciones seguras en Comisiones (2026-08-30):** el tablero separa las Comisiones activas de las archivadas mediante filtros explícitos y traduce sus títulos, columnas, estados, acciones y etiquetas accesibles sin alterar los valores registrados. Cada Comisión permite abrir la decisión de impacto, archivar/restaurar y confirmar la eliminación si no existen dependencias; una Comisión archivada conserva su tracking como consulta y no habilita registrar un pago. La prueba de aplicación recorre archivar y restaurar mediante **Deshacer** con su Viaje y Proveedor válidos.
- **Edición de Servicios:** los Servicios existentes muestran una acción explícita de edición que precarga nombre y fechas dentro del mismo borrador de Cliente/Viaje/Servicios. No guarda ni modifica relaciones hasta `Guardar cambios`; la corrección conserva el ID del Servicio y por ello no rompe sus componentes de Proveedor, Pagos ni Comisiones.
- **Corrección trazable de Pagos:** cada pago asociado a un componente ahora se puede abrir de forma explícita para corregir importe y fecha efectiva. La transacción valida el componente, moneda, Viaje y estado activo; conserva el ID del Pago y emite `customer_payment_corrected` con el antes/después. No permite corregir un Pago o Servicio archivados sin restaurarlos primero.
- **Acciones seguras en Servicios y Pagos:** dentro de un expediente guardado, cada Servicio y cada Pago muestran su decisión visible de impacto para archivar, restaurar o solicitar eliminación. El archivo de Servicio evita nuevas asignaciones de Proveedor y nuevos pagos, pero conserva el historial; el archivo de Pago lo muestra como histórico y deshabilita su corrección hasta restaurarlo. La recarga intencional del expediente después de cada acción refresca el estado persistido sin aplicar un cambio sobre un borrador pendiente.
- **Calendario ES/EN:** controles de vista, periodo, encabezados mensual/semanal, días de semana, agenda, panel contextual y rutas de apertura se traducen desde el catálogo. Las fechas conservan `DD/MM/YYYY` al cambiar idioma; los títulos de Tareas, Clientes, Servicios y otros valores capturados se preservan literalmente.
- **Evidencia de bloque:** 66 archivos / 177 pruebas pasaron, además de typecheck, lint y build el 2026-08-30. Un timeout aislado de apertura de Viaje bajo carga pasó inmediatamente al repetirlo aislado y la suite completa posterior quedó en verde. `git diff --check` no emitió errores; el repositorio continúa sin archivos rastreados, por lo que esa comprobación no sustituye una revisión de diff rastreable. No se publicaron, desplegaron ni usaron datos reales.
- **Proveedores ES/EN:** la lista, expediente, pestañas, reglas de comisión, campos, mensajes de validación, estados y plantillas usan el catálogo de idioma. La interfaz en inglés conserva literalmente los nombres de Proveedor y títulos de plantilla ya capturados; también traduce las etiquetas accesibles y el texto auxiliar.
- **Evidencia de bloque:** las pruebas dirigidas de Proveedores pasaron con 3 archivos / 9 pruebas; la suite completa cerró con 66 archivos / 180 pruebas, más typecheck, lint, build y `git diff --check` el 2026-08-30. El chequeo de formato no emitió errores, pero el repositorio sigue enteramente sin rastrear: no sustituye una revisión de diff rastreable. No se publicaron, desplegaron ni usaron datos reales.
- **Expediente completo de Proveedor:** al abrir un Proveedor, el panel lateral usa el separador ajustable compartido y ofrece una acción visible para abrir el expediente en pantalla completa. Esa vista conserva la navegación global, muestra breadcrumb, oculta la lista y permite volver a ella sin perder el registro seleccionado; las acciones de archivo, eliminación o guardado cierran de forma coherente ambas vistas.
- **Evidencia de bloque:** 2 archivos / 26 pruebas dirigidas pasaron y la suite completa, ejecutada en modo aislado, cerró con 66 archivos / 182 pruebas. Typecheck, lint, build de PWA y `git diff --check` también pasaron el 2026-08-30. El repositorio sigue enteramente sin rastrear, por lo que el chequeo de formato no equivale a una revisión de diff rastreable. No se publicaron, desplegaron ni usaron datos reales.
- **Leads ES/EN:** filtros, lista, formulario, validación de moneda, detalle, historial de eventos, tareas y conversión de primer pago se traducen desde el catálogo. Las fuentes, destinos, nombres, títulos de tarea y demás valores guardados permanecen literales; las fechas del historial conservan `DD/MM/YYYY` en ambos idiomas.
- **Evidencia de bloque:** 4 archivos / 14 pruebas dirigidas y suite completa aislada 66 archivos / 185 pruebas, más typecheck, lint, build PWA y `git diff --check`, pasaron el 2026-08-30. El repositorio continúa enteramente sin rastrear, por lo que el chequeo de formato no sustituye una revisión de diff rastreable. No se publicaron, desplegaron ni usaron datos reales.
- **Clientes y Familias ES/EN:** lista, filtros de archivo, formulario de corrección, expediente, miembros, Viajes vinculados e historial agregado se traducen desde el catálogo. Los nombres de familia, miembros, notas y relaciones conservan el contenido original; las fechas de último guardado conservan `DD/MM/YYYY` en ambos idiomas.
- **Evidencia de bloque:** 3 archivos / 6 pruebas dirigidas y suite completa aislada 66 archivos / 187 pruebas, más typecheck, lint, build PWA y `git diff --check`, pasaron el 2026-08-30. El repositorio continúa enteramente sin rastrear, por lo que el chequeo de formato no sustituye una revisión de diff rastreable. No se publicaron, desplegaron ni usaron datos reales.
- **Viajes ES/EN:** lista, expediente, miembros/viajeros, Servicios, asignación de Proveedor, pagos de Cliente, recordatorios y el diálogo de cambios sin guardar consumen el catálogo de idioma. Nombres de familia, miembros, Servicios, Proveedores y notas conservan su texto original; importes y fechas de recordatorio conservan su formato operativo fijo en ambos idiomas.
- **Evidencia de bloque:** 3 archivos / 15 pruebas dirigidas y la suite completa normal 66 archivos / 192 pruebas, más typecheck, lint, build PWA y `git diff --check`, pasaron el 2026-08-30. El modo serializado de Vitest mostró un timeout no reproducible en `ActionMenu`; esa prueba pasa aislada y la suite normal completa está en verde. El repositorio continúa enteramente sin rastrear, por lo que el chequeo de formato no sustituye una revisión de diff rastreable. No se publicaron, desplegaron ni usaron datos reales.
- **Inicio y Notificaciones ES/EN:** las tarjetas, colas, avisos de fecha, panel de alertas y etiquetas accesibles pasan por el catálogo de idioma. Los títulos de tareas y de alertas siguen siendo valores operativos literales.
- **Evidencia de bloque:** las pruebas dirigidas de Inicio y Notificaciones cerraron con 3 archivos / 6 pruebas; la suite completa normal 66 archivos / 194 pruebas, build PWA y `git diff --check` pasaron el 2026-08-30. El repositorio continúa enteramente sin rastrear, por lo que el chequeo de formato no sustituye una revisión de diff rastreable. No se publicaron, desplegaron ni usaron datos reales.
- **Datos, respaldo y Comisiones ES/EN:** el manual de recuperación, descargas JSON/Excel, restauración, importación CSV, mensajes, vista previa, recordatorio y diálogo de pago de Comisión usan el catálogo de idioma. Los formatos JSON, ZIP, CSV, Excel, fechas ISO y monedas ISO se conservan como datos técnicos sin traducción.
- **Evidencia de bloque:** las pruebas dirigidas de Datos y Comisiones cerraron con 2 archivos / 4 pruebas; la suite completa normal 66 archivos / 196 pruebas, typecheck, lint, build PWA y `git diff --check` pasaron el 2026-08-31. El repositorio continúa enteramente sin rastrear, por lo que el chequeo de formato no sustituye una revisión de diff rastreable. No se publicaron, desplegaron ni usaron datos reales.
- **Tareas ES/EN:** grupos operativos, filtros, completar, reprogramar, deshacer y el aviso de acción reciente consumen el catálogo de idioma. Títulos y fechas de las tareas permanecen como valores operativos sin traducción.
- **Evidencia de bloque:** `tests/unit/taskBoard.test.tsx` cerró con 5 pruebas; la suite completa normal 66 archivos / 197 pruebas, typecheck, lint, build PWA y `git diff --check` pasaron el 2026-08-31. El repositorio continúa enteramente sin rastrear, por lo que el chequeo de formato no sustituye una revisión de diff rastreable. No se publicaron, desplegaron ni usaron datos reales.
- **Localización transversal reforzada (2026-08-31):** el shell ya obtiene sus estados vacíos, cargas diferidas y migas de navegación desde el catálogo tipado; el calendario semanal, ayudas de accesibilidad del panel ajustable, ejemplo de tipos de servicio y conector de resumen de impacto también quedan centralizados. Avisos y recordatorios transportan solo tipo/asunto y se presentan en el idioma activo: al cambiar a inglés se muestra, por ejemplo, `Overdue task` sin alterar el título capturado. Las tareas de seguimiento generadas al enviar una cotización o pausar un Lead reciben el título de sistema del idioma activo al momento de crearse; los títulos ya guardados no se traducen.
- **Evidencia de bloque:** 15 archivos / 72 pruebas dirigidas y la suite completa normal de 66 archivos / 199 pruebas pasaron; typecheck, lint y build PWA también pasaron el 2026-08-31. El build precacheó 12 recursos (1033.12 KiB). `git diff --check` no emitió errores, pero el repositorio sigue completamente sin rastrear, por lo que no sustituye una revisión de diff rastreable. No se publicaron, desplegaron ni usaron datos reales.
- **Expediente completo de Tarea (2026-08-31):** cada fila de Tarea ofrece la acción explícita **Abrir expediente completo**. La vista enfocada conserva navegación global, breadcrumb y retorno a la lista; oculta el tablero y reúne estado, fecha límite, completar/reabrir, reprogramación y el mismo menú de archivo/restauración/eliminación segura. Todas las operaciones reutilizan los casos de uso transaccionales existentes y recargan la Tarea seleccionada desde el repositorio, sin crear una copia de datos.
- **Evidencia de bloque:** `accessibility-shell` y `taskBoard` cerraron con 28 pruebas dirigidas; la suite completa normal pasó con 66 archivos / 200 pruebas, además de typecheck, lint, build PWA y `git diff --check` el 2026-08-31. El repositorio continúa completamente sin rastrear, por lo que el chequeo de formato no sustituye una revisión de diff rastreable. No se publicaron, desplegaron ni usaron datos reales.
- **Expediente completo de Comisión (2026-08-31):** cada comisión abre desde el tablero una vista enfocada por Proveedor, manteniendo navegación global, breadcrumb y retorno a la lista. Reúne importe/fecha esperados, estado, tracking, pago y el mismo ciclo de vida seguro; el tracking y el pago reutilizan los casos de uso transaccionales existentes y recargan la comisión seleccionada. Archivar/restaurar también refresca el expediente; una eliminación efectiva vuelve a la lista.
- **Evidencia de bloque:** `accessibility-shell` y `commissionBoard` cerraron con 26 pruebas dirigidas; la suite completa normal pasó con 66 archivos / 201 pruebas, además de typecheck, lint y build PWA el 2026-08-31. El build precacheó 12 recursos (1038.57 KiB). El repositorio continúa completamente sin rastrear, por lo que `git diff --check` no sustituye una revisión de diff rastreable. No se publicaron, desplegaron ni usaron datos reales.
- **Punto de reanudación — pausa solicitada (2026-08-31):** se implementaron los expedientes completos de **Servicio** y **Pago** dentro del contexto de Viajes. Ambos conservan navegación global, breadcrumb y retorno al expediente del Viaje; Servicio permite corregir nombre/fechas mediante `saveTripWorkspace`, y Pago permite la corrección auditable existente. Las acciones de archivar/restaurar/eliminar se ajustaron para refrescar el registro enfocado o volver al contexto anterior cuando corresponda.
- **Última evidencia cerrada antes de la pausa:** la regresión completa pasó con 66 archivos / 203 pruebas; typecheck, lint, build PWA y `git diff --check` también pasaron. El build precacheó 12 recursos (1044.39 KiB). El repositorio continúa completamente sin rastrear, por lo que el chequeo de formato no sustituye una revisión de diff rastreable. No se publicaron, desplegaron ni usaron datos reales.
- **Trabajo iniciado, todavía sin validar:** la auditoría visual detectó que algunos valores de estado persistidos se mostraban como identificadores técnicos (por ejemplo, `sold`). Se añadieron claves ES/EN para estados de Viaje y se comenzó a mapear los estados de Lead en lista y detalle. Antes de ejecutar pruebas, hay que corregir la referencia provisional `leadQuoteSent` por la clave existente `quoteSent`, completar el mismo mapeo en `TripList` y `TripDetail`, y añadir/ajustar las pruebas de presentación correspondientes. No se debe contar este cambio parcial como verificado.
- **Primer paso al reanudar:** terminar ese mapeo de estados, ejecutar primero las pruebas dirigidas de Leads/Viajes y después la regresión completa, typecheck, lint, build PWA y `git diff --check`. Con evidencia verde, recargar la aplicación local ya servida y verificar visualmente: estado de Lead legible en español, selector de idioma en inglés sin datos capturados traducidos, navegación de escritorio y consola limpia. Después actualizar `VERIFIER.md` y este registro antes de proponer el cierre de oleada.
- **Estados localizados y regresión ES/EN (2026-08-31):** se corrigieron los estados visibles persistidos de Lead y Viaje: nunca se presentan como identificadores de dominio (`sold`, `active`, etc.) en listas, detalles ni filtros. La interfaz ahora usa etiquetas tipadas del catálogo para cada estado, sin cambiar los valores guardados ni las exportaciones técnicas. La revisión servida confirmó el estado **Lead convertido** en español y **Lead converted** en inglés; los datos capturados (por ejemplo, `Familia de prueba`) no se traducen. El idioma español se restauró al terminar la comprobación.
- **Evidencia de bloque:** pruebas dirigidas de Leads/Viajes 3 archivos / 9 pruebas, regresión completa 66 archivos / 205 pruebas, 9 E2E, typecheck, lint, build PWA y `git diff --check` pasaron el 2026-08-31. El build precacheó 12 recursos (1044.85 KiB). La revisión visual local en `http://127.0.0.1:5173/` comprobó contenido significativo, sin overlay de framework ni errores/advertencias de consola, y el cambio ES → EN → ES. El repositorio continúa completamente sin rastrear, por lo que `git diff --check` no sustituye una revisión de diff rastreable. No se publicaron, desplegaron ni usaron datos reales.
- **Siguiente punto:** auditar requisito por requisito el plan aprobado y efectuar la revisión visual/accesible de escritorio en las pantallas restantes antes de proponer cualquier gate independiente.
- **Auditoría de navegación de escritorio (2026-08-31):** se recorrieron en la aplicación servida Inicio, Leads, Clientes y familias, Viajes, Calendario, Tareas, Comisiones, Proveedores, Datos y respaldo y Configuración. Cada ruta activó la navegación correspondiente y conservó shell, logo, buscador y selector de idioma; no hubo errores ni advertencias de consola. El flujo se hizo en modo de solo lectura, sin modificar registros existentes.
- **Evidencia de cierre técnico vigente:** `npm audit --omit=dev --json` informó 0 vulnerabilidades de producción (64 dependencias de producción auditadas). Persisten como límites visibles la revisión independiente no activada automáticamente y la validación manual de zoom de escritorio al 200 %; la instalación PWA/offline ya fue validada y aprobada manualmente por la usuaria el 2026-08-29.
- **Vista previa CSV ES/EN (2026-08-31):** el reporte de filas rechazadas ya no expone etiquetas ni motivos internos fijados en español. La pantalla traduce entidad y motivo conocidos al idioma activo —por ejemplo, **Lead row 2: Name is required**— y conserva solo los valores propios del archivo cuando corresponde (como el nombre de un archivo no compatible). La vista previa continúa sin persistir datos.
- **Evidencia de bloque:** `DataBackupsPage` verificó el caso real con un ZIP sintético; la regresión completa pasó con 66 archivos / 206 pruebas, los 9 E2E, typecheck, lint y build PWA también pasaron el 2026-08-31. El build precacheó 12 recursos (1046.53 KiB). No se publicaron, desplegaron, importaron ni migraron datos reales.
- **Punto de reanudación exacto — pausa solicitada (2026-08-31):** el código y la documentación están al cierre técnico de la Oleada 4, después de corregir la localización ES/EN de los estados Lead/Viaje y de la vista previa de errores CSV. La última evidencia reproducible es: 66 archivos / 206 pruebas unitarias, 9 E2E, `typecheck`, `lint` y build PWA correctos; la navegación de escritorio por los diez módulos se revisó sin errores de consola y la validación manual de instalación/offline PWA fue aprobada por la usuaria el 2026-08-29. **No hay una modificación de código en curso ni un proceso de datos pendiente.**
- **Cierre de la prueba de zoom — 2026-08-31:** se verificó de forma interactiva el equivalente de escritorio al **200 %** (viewport CSS 640 × 360 derivado de la vista base 1280 × 720). No hubo desbordamiento horizontal (`scrollWidth` 625), errores ni advertencias de consola. Se comprobó foco en los accesos de navegación y apertura de Clientes y familias/Datos y respaldo desde el rail compacto; al finalizar se restauraron la vista base y la ruta Leads. La revisión detectó que al ocultarse sus textos los iconos no conservaban nombre accesible: se corrigió con etiqueta accesible y ayuda emergente nativa localizada en ES/EN, protegida por prueba unitaria.
- **Evidencia de cierre técnico vigente:** regresión completa de 66 archivos / 207 pruebas, 9 E2E, typecheck, lint, build PWA (12 recursos, 1046.56 KiB) y `git diff --check` correctos el 2026-08-31. La PWA ya cuenta con validación manual de instalación/offline aprobada por la usuaria el 2026-08-29. No se publicaron, desplegaron, importaron ni migraron datos reales.
- **Siguiente punto:** preparar y presentar el informe de go/no-go. El gate independiente de QA funcional no se activa automáticamente; requiere autorización explícita de la usuaria.
- **Informe go/no-go de implementación MVP (2026-08-31): GO técnico para uso local controlado.** El plan implementado no conserva pasos sin verificar: la matriz funcional y la última regresión cubren 66 archivos / 207 pruebas unitarias, 9 E2E, typecheck, lint, build PWA, accesibilidad/foco y navegación de escritorio, junto con la aceptación manual de instalación/offline. Se corrigió además el único hallazgo nuevo del zoom: el rail compacto conserva nombres accesibles y ayudas localizadas. Este dictamen **no** publica, despliega, importa ni migra datos reales. Límites visibles: el repositorio está completamente sin rastrear, por lo que requiere una normalización de control de versiones antes de una entrega versionada; el gate independiente R4 permanece disponible, pero no se ejecutó automáticamente.
- Estas mejoras forman un incremento arquitectónico posterior al MVP técnico. Se diseñarán y aprobarán antes de escribir código.

## R1 — correcciones en curso

- **Revisión R1 (2026-08-26):** el revisor independiente de lógica/datos devolvió inicialmente `NO-GO` para abrir la Oleada 2. Los hallazgos se aceptaron y se están corrigiendo dentro de la Oleada 1: vínculo explícito o heredado a Cliente existente al convertir; restricción de conversión a estados comerciales válidos; separación `occurredAt`/`recordedAt`; eventos de transición con estado anterior y nuevo; pago inicial persistido como registro propio; acciones de completar/reprogramar la tarea de seguimiento; y validación referencial transaccional.
- **R1 cerrada (2026-08-26):** el revisor independiente emitió `GO` sin hallazgos Critical ni Important. La ejecución verificable también concluyó: 39 pruebas unitarias/integración, typecheck, lint, build y el E2E de Lead pasaron. La Oleada 2 puede iniciar; su revisión R2 continúa sujeta a aprobación explícita al cierre de esa oleada.
- **Cierre de integridad R1:** se bloqueó la reasignación de Cliente de un Lead ya vendido o vinculado a Viaje, y cada evento exige que exista su agregado en la misma transacción. El revisor confirmó el cierre y las verificaciones automatizadas pasaron.

## Oleada 2 — en curso

- **Task 7 — expediente, avance verificable (2026-08-26):** se añadió el expediente enfocado desde Clientes/Viajes con un borrador conjunto de Cliente, Viaje y nota enriquecida; ofrece `Guardar cambios` y la advertencia `Guardar`/`Salir sin guardar`/`Cancelar`. La transacción ya existente conserva el rollback. La prueba unitaria cubre el borrador y el cierre posterior al guardado; el E2E sintético confirma conversión, guardado, cierre y reapertura. Falta completar viajeros, Servicios/Pagos y alertas antes de marcar los pasos 2–4.
- **Task 7 — Viajeros, núcleo de integridad (2026-08-26):** Cliente/Familia admite miembros básicos archivables y el Viaje puede conservar contacto principal/participantes por ID. El caso de uso rechaza de forma atómica cualquier miembro ajeno a la familia o contacto principal no participante; la captura y la edad derivada siguen pendientes de interfaz.
- **Task 7 — Viajeros, interfaz (2026-08-26):** el expediente permite alta rápida de miembro, selección explícita de contacto principal/participantes y muestra edad actual derivada en años/meses. No persiste una edad fija. Falta proyectar la edad al inicio del Viaje y cubrir archivo de miembros.
- **Task 7 — pagos por componente (2026-08-26):** se registran pagos posteriores con componente de Proveedor, importe, moneda y fecha efectiva; se rechazan componentes huérfanos, de otro Viaje o con moneda distinta. El saldo se deriva sin permitir valores negativos ni conversiones implícitas. Falta la interfaz y alertas escalonadas.
- **Task 7 — Servicios, pagos y alertas visibles (2026-08-26):** el expediente añade Servicios al mismo borrador transaccional, consulta componentes mediante el contrato del repositorio y muestra por componente el total pagado, saldo derivado, fecha límite manual y recordatorios internos a 30/7/1/0 días. Desde allí registra el pago con importe, moneda del componente y fecha efectiva. La creación/asignación de Proveedor a un Servicio queda en Task 8; por ello Task 7 aún no se marca completa.
- **Task 7 — expediente operativo cerrado (2026-08-26):** Cliente/Familia cuenta con detalle propio, historial agregado de lectura, miembros archivables/reactivables y edad proyectada al inicio del Viaje. El expediente de Viaje agrega Servicios bajo `Guardar cambios`, permite asignar Proveedor con moneda explícita, importe y fecha límite, y controla pagos/saldos por componente. El anticipo que convirtió el Lead se reasigna después al componente compatible de forma atómica, manteniendo su único movimiento y procedencia. La verificación de cierre registró 69 pruebas en 25 archivos, lint, typecheck, build y E2E de Viajes en verde; el build conserva como límite conocido una advertencia de bundle mayor a 500 kB, a resolver antes del cierre integral.
- **Task 8 — catálogo de Proveedores cerrado (2026-08-26):** el expediente de Proveedor ya gestiona datos generales, monedas permitidas, etiquetas/referencias y reglas de comisión con participación 80/100 y modo de porcentaje fijo o monto variable por Servicio. Un Proveedor inactivo sigue disponible para consulta y exige `Activar y usar`, con evento trazable, antes de una nueva asignación. Las plantillas se crean, editan, activan o desactivan; al confirmar un Proveedor se proponen todas sus plantillas activas y la usuaria puede editar, seleccionar o descartar cualquiera antes de una segunda confirmación que crea solo las Tareas seleccionadas. La verificación de cierre registró 22 pruebas relevantes en 8 archivos, lint, typecheck, build y `git diff --check`; persiste la advertencia de bundle mayor a 500 kB como límite conocido antes del cierre integral.
- **Task 9 — Comisiones cerrada (2026-08-26):** al completar un componente de Proveedor se calcula la Comisión en la misma transacción cuando existen los datos de su modo fijo o variable; conserva el monto bruto, participación 80/100, monto neto esperado, moneda, componente, plazo y fecha esperada como snapshot. `Sin comisión` no crea una Comisión. El tablero separa Esperadas, Próximas, Vencidas y Pagadas; permite registrar `Tracking Form #`, muestra la señal interna `Where’s My Commission` para vencidas y exige confirmar toda diferencia de importe o moneda antes de pagar con fecha efectiva. La verificación cubrió 12 pruebas relevantes, lint, typecheck, build, `git diff --check` y el E2E Viaje → Comisión → pago. Persiste la advertencia de bundle mayor a 500 kB como límite conocido antes del cierre integral.
- **Oleada 2 — cierre técnico (2026-08-26):** Tasks 7–9 están completas. La suite integral cerró con 32 archivos y 87 pruebas en verde, además de lint, typecheck, build, E2E del flujo Viaje → Comisión → pago y `git diff --check`. El build mantiene una advertencia de bundle de 795 kB; se tratará antes del cierre integral. R2 no se activó y requiere autorización explícita de la usuaria.
- **Esquema local v9:** v8 añadió el índice compuesto de notas `[ownerType+ownerId]`; v9 añade `tasks.serviceProviderId` para las Tareas originadas por plantillas de Proveedor. Ninguna versión transforma registros ni toca datos reales; ambas son compatibles con las versiones previas.
- Se inició el núcleo transaccional de expediente: Cliente, Viaje, Servicios y notas se validan y guardan juntos; las fechas efectivas del Viaje se derivan de sus Servicios salvo override explícito.
- Se inició el cálculo de Comisiones: el plazo esperado se limita a 90 días desde el fin del Viaje y la proyección conserva el snapshot 80/100 por moneda, sin tasa de cambio manual.

- **Oleada 1 (2026-08-25):** se implementaron fundación React/TypeScript, tokens del manual de marca, navegación de escritorio, repositorio Dexie/IndexedDB transaccional, eventos de Lead, tareas de seguimiento, conversión Lead → Cliente → Viaje y la operación de Leads (alta, búsqueda/filtros, historial, detalle y primer anticipo). La suite cuenta con 27 pruebas unitarias/integración y un flujo E2E sintético aprobado. Typecheck, lint, build y chequeo de formato pasaron. La captura visual de escritorio se conserva en `artifacts/oleada1-leads.png`; no se publicaron ni migraron datos reales.

- **Corrección vigente (2026-08-24):** DEC-137 sustituye la hipótesis de plantillas por flujo del MVP. Las plantillas son por Proveedor y se muestran como sugerencias editables al confirmar su selección dentro de un Servicio/Reserva; no existe activación automática por componentes.
- Se recibió `Control WM_12_07_2026_Dashboard.xlsx` y se preservó sin modificaciones.
- Se registraron tamaño y SHA-256 para trazabilidad.
- Se inventariaron 17 hojas, visibilidad, dimensiones, tablas, pivotes, fórmulas, validaciones y formato condicional.
- Se perfilaron columnas, tipos, nulos, distintos, fórmulas y rangos sin publicar datos personales.
- Se analizaron IDs y relaciones entre Leads, Ventas, Clientes, proveedores y comisiones externas.
- Se identificaron colisiones de IDs, fechas ficticias de 1900, tipos mixtos y hojas derivadas/duplicadas.
- Se detectaron credenciales en texto plano y se documentó su exclusión obligatoria del dashboard.
- Se creó un perfilador reproducible con seis pruebas automatizadas.
- Se regeneró el perfil anonimizado para la entrega actual del XLSX y se confirmó que sus agregados operativos no cambiaron respecto del perfil anterior.
- Se confirmó y registró en DEC-082 que `TEMPLATE` se ignora al 100 % como fuente, regla o evidencia operativa.
- Se confirmó y registró en DEC-083 que cada consulta crea un Lead independiente, incluso sin venta, y que un Cliente puede tener múltiples Leads.
- Se confirmó y registró en DEC-084 que una fecha histórica de solicitud ausente queda explícitamente desconocida, sin inferirse desde otra fecha.
- Se confirmó y registró en DEC-085 que las cotizaciones históricas sin fecha sí fueron enviadas, pero no generan fecha, métrica ni tarea inventada.
- Se confirmó y registró en DEC-086 el uso de IDs internos, legado intacto, trazabilidad por fila en Leads/Ventas y revisión solo de vínculos dudosos.
- Se confirmó y registró en DEC-087 que la migración histórica incluye solo Ana Lu/Analu y excluye en cascada otros agentes.
- Se confirmó y registró en DEC-088 el mapeo de estados específico del lote histórico.
- Se confirmó y registró en DEC-089 que `Cancelado` es el único estado de cierre sin venta en todo el CRM.
- Se confirmó y registró en DEC-090 que origen de adquisición y canal de comunicación son campos distintos.
- Se confirmó y registró en DEC-091 que `País` en `Leads` representa la residencia actual del contacto.
- Se confirmó y registró en DEC-092 que `Tipo de venta` representa la necesidad principal inicial del Lead.
- Se confirmó y registró en DEC-093 que `Destino` representa la intención inicial del Lead, no el itinerario final.
- Se confirmó y registró en DEC-094 la validación previa de `Pax` frente a `Adultos`+`Niños`, sin corrección silenciosa.
- Se confirmó y registró en DEC-095 la excepción histórica de moneda vacía para `Cancelado` y el bloqueo de carga para los demás casos.
- Se confirmó y registró en DEC-096 que `Cotización` conserva un único importe histórico, sin reconstruir revisiones.
- Se confirmó y registró en DEC-097 que la comisión proyectada es al 100% y que las excepciones fijas de 80% se conservan tras validación por fila.
- Se confirmó y registró en DEC-098 que el presupuesto histórico carga valores o vacíos sin fórmulas y que el valor de presupuesto no bloquea una venta.
- Se confirmó y registró en DEC-099 que `# Noches` carga valores numéricos, nunca fórmulas.
- Se confirmó y registró en DEC-100 que `Tiempo de envío` se carga solo con ambas fechas conocidas y, de otro modo, queda no medible.
- Se confirmó y registró en DEC-101 que las notas históricas se vinculan al Lead sin interpretación automática.
- Se confirmó y registró en DEC-102 que las 10 comisiones al 80 % sin fórmula de `Ventas` se conservan como importes históricos fijos; las 214 fórmulas se recalculan.
- Se confirmó y registró en DEC-103 el mapeo de los estados históricos `Comisión pagada`, `Tracking form - Ok` y `Where is my Commission`, sin inventar fecha real de pago.
- Se confirmó y registró en DEC-104 que `Clientes por viajar` conserva el Servicio vendido y una Comisión pendiente no exigible hasta finalizar el viaje.
- Se confirmó y registró en DEC-105 que seis importes financieros históricos problemáticos se conservan como desconocidos, sin convertirlos en cero ni en `sin comisión`.
- Se reabrió y perfiló la entrega actual del XLSX en modo lectura; su SHA-256 cambió a `d33bf2f…`, por lo que se documentó como fuente actualizada.
- Se completó la validación por `source_row` de `Ventas`: 211 vínculos en alcance deterministas, 13 fuera de alcance y ningún vínculo pendiente.
- Se confirmó y registró en DEC-108 que un Viaje puede reunir varios Leads y sus Servicios/Reservas, sin forzar un Lead principal por Servicio.
- Se confirmó y registró en DEC-109 que pasajeros y duración tienen alcance de Viaje o Servicio explícito según el caso.
- Se confirmó y registró en DEC-110 que `Ventas.Tipo de venta` clasifica cada Servicio/Reserva y es independiente del tipo principal del Lead.
- Se confirmó y registró en DEC-111 que el destino manual de `Ventas` tiene prioridad como destino efectivo del Servicio/Reserva.
- Se confirmó y registró en DEC-112 que una `Persona titular` manual corresponde al titular de esa Reserva y puede diferir del contacto del Lead.
- Se confirmó y registró en DEC-113 que la carga masiva inicial crea Proveedores desde `Ventas.Proveedor`, seguida de una limpieza controlada.
- La comprobación de moneda detectó 12 filas manuales incompatibles con el valor del catálogo auxiliar para el mismo proveedor; su tratamiento queda pendiente de confirmación antes del CSV final. Hay 10 filas con proveedor manual sin correspondencia exacta en el catálogo auxiliar, que no bloquean su creación inicial.
- Se confirmó y registró en DEC-114 que los Proveedores pueden ser monomoneda o multimoneda y que la moneda efectiva se selecciona por Servicio/Reserva.
- Se confirmó y registró en DEC-115 que la moneda permitida se selecciona explícitamente antes de guardar cualquier importe del Proveedor.
- Se confirmó y registró en DEC-116 que cada fila de `Ventas` es un componente de Proveedor y no debe agruparse automáticamente con otras filas del mismo Cliente o Viaje.
- Se confirmó y registró en DEC-117 que `Fecha de pago (tarjeta cliente)` es el pago efectivo en plataforma por componente de Proveedor.
- Se confirmó y registró en DEC-118 que `Tracking Form #` identifica el seguimiento oficial de la Comisión y se genera al subir el formulario o *commission report*.
- Se confirmó y registró en DEC-119 que `# de itinerario` es el número de reservación de plataforma por componente de Proveedor y puede quedar vacío.
- Se confirmó y registró en DEC-120 que `Ventas.notas` conserva solo contexto histórico del componente de Proveedor.
- Se confirmó y registró en DEC-121 que `Ventas.Concepto` es redundante y no se migra.
- Se cerró el mapeo semántico de las 25 columnas de `Ventas`; queda pendiente una revisión final de completitud antes de diseñar los CSV.
- Se analizó `DROP DOWNS` en una sola oleada y se clasificaron sus listas: tipos y monedas como semillas; tabla de Proveedores como referencia auxiliar; acciones, estados y ayudas como legado no transaccional.
- Se confirmó y registró en DEC-123 que `InterCruises` e `International Cruises` son Proveedores distintos.
- Se confirmó y registró en DEC-124 que `Datos Clientes` es directorio maestro y se carga sin enriquecimiento, deduplicación ni cruces con otras hojas.
- Se completó la clasificación de las hojas restantes; DEC-125 confirma que ninguna crea una nueva entidad operativa para la migración inicial.
- Se confirmó y registró en DEC-126 el flujo real desde consulta hasta primera cotización: canal original, operación por WhatsApp, calificación, PDF y envío como hito.
- Se confirmó y registró en DEC-127 una Tarea interna automática de seguimiento a los 4 días de la primera cotización, editable por Lead.
- Se confirmó y registró en DEC-128 que el primer cobro exitoso, completo o anticipo, convierte el Lead a `Vendido` y crea/vincula Cliente y Viaje.
- Se confirmó y registró en DEC-129 que cada pago parcial se registra por separado y que el saldo se deriva automáticamente por componente de Proveedor.
- Se confirmó y registró en DEC-130 que la fecha límite de saldo se captura manualmente por componente de Proveedor, sin cálculo automático.
- Se confirmó y registró en DEC-131 que cada fecha límite de saldo crea alertas internas a -1 mes, -1 semana, -1 día y el día límite.
- Se confirmó y registró en DEC-132 la conciliación manual quincenal de depósitos de Archer mediante `Tracking Form #` y el seguimiento interno `Where’s My Commission` para Comisiones vencidas.
- Se confirmó y registró en DEC-133 que una Comisión vencida crea una Tarea interna de reclamo con alerta el día de su vencimiento.
- Se confirmó y registró en DEC-134 que una cancelación posterior a la venta conserva el histórico y que su reembolso depende de la política y fecha aplicable de cada Proveedor.
- Se confirmó y registró en DEC-135 que una cancelación puede afectar componentes individuales y que el reembolso determina si su Comisión se cancela o se mantiene cobrable.
- Se sustituyó esa hipótesis: en el MVP las tareas se administran como plantillas por Proveedor y se sugieren, con selección y edición manual, al confirmar el Proveedor; no se modelan componentes ni reglas complejas de activación.
- Se confirmó en DEC-136 y DEC-137 que la usuaria administra plantillas por Proveedor dentro del MVP, con sugerencias editables al confirmar la selección.
- Se confirmó en DEC-138 que el Viaje se completa automáticamente el día calendario siguiente a su fin efectivo y activa el seguimiento de Comisión.
- Se confirmó en DEC-139 que el dashboard inicial prioriza viajeros en curso, próximos Viajes del mes actual/siguiente, trabajo comercial pendiente y Comisiones vencidas con contador y detalle mínimo.
- Se confirmó en DEC-140 que las Tareas vencidas aparecen primero y se pueden completar o reprogramar directamente desde el dashboard.
- Se confirmó en DEC-141 que el MVP conserva datos estructurados, carga/descarga tabular y respaldo JSON, pero no almacena PDFs, confirmaciones, vouchers ni otros adjuntos; ese alcance queda para una evolución con base de datos.
- Se confirmó en DEC-142 que el MVP importará paquetes CSV canónicos, exportará Excel y usará JSON para respaldo/restauración. La versión actualizada del Excel histórico se convertirá una sola vez al mismo paquete CSV, sin importar Excel directamente en el dashboard.
- Se precisó en DEC-143 que el dashboard recuerda, de forma descartable, descargar un respaldo JSON si pasan tres días calendario; exportar Excel no sustituye ese respaldo.
- Se confirmó inicialmente en DEC-144 la experiencia objetivo desde icono y con IndexedDB; DEC-168 concreta y sustituye su empaquetado: PWA de escritorio publicada en GitHub Pages, sin datos operativos en el sitio y con IndexedDB local.
- Se confirmó en DEC-145 que el MVP incluye un calendario operativo visualmente cuidado, complementario a las colas del dashboard.
- Se recibió el manual de marca World Memories y se registró en DEC-146 como fuente visual para el CRM: paleta primaria/secundaria y variantes de logotipo.
- Se confirmó en DEC-147 que el calendario combina hitos puntuales con Viajes representados como bloques continuos durante todo su intervalo efectivo.
- Se confirmó en DEC-148 que el calendario tendrá vistas mensual, semanal y planificación/agenda de intervalos, sin vista diaria por horas.
- Se confirmó en DEC-149 que un clic abre un panel lateral contextual y desde ahí se navega explícitamente a Tarea, Viaje, Cliente o Comisión; no se usará doble clic como interacción necesaria.
- Se confirmó en DEC-150 que el CRM inicia en español y ofrece selector para cambiar a inglés, sin traducir automáticamente los datos capturados.
- Se confirmó en DEC-151 que el MVP tendrá buscador global para Clientes, Leads, Viajes, Proveedores, Tareas y Comisiones, con resultados agrupados y acceso a contexto.
- Se confirmó en DEC-152 que el buscador global también encuentra texto dentro de notas de Leads y notas de trabajo de Viajes, mostrando contexto sin alterar su contenido.
- Se confirmó en DEC-153 el módulo único de Datos y respaldos con importación CSV, exportación Excel, respaldo/restauración JSON y visibilidad del último respaldo.
- Se confirmó en DEC-165 y DEC-166 mantener Comisiones en el MVP; Finanzas no está comprometido y solo se considerará si aporta capacidades distintas a una evolución avanzada de Comisiones.
- Se confirmó en DEC-155 una campana de notificaciones internas para alertas operativas y, en DEC-156, la evolución futura viable hacia flujos de correo e integraciones externas sin incluirlos en el MVP local.
- Se confirmó en DEC-157 que leer una notificación no la elimina: permanece activa hasta completar, reprogramar o resolver su asunto asociado.
- Se confirmó en DEC-158 que monedas permitidas, reglas de Comisión y plantillas de Tareas se administran dentro de cada Proveedor; Configuración queda para catálogos y preferencias globales.
- Se confirmó en DEC-159 que la línea de tiempo del Viaje combina sus eventos propios con los de sus Leads vinculados, sin duplicar registros ni alterar estados.
- Se confirmó en DEC-160 que el Cliente muestra una línea de tiempo agregada de sus Leads y Viajes vinculados, sin crear copias ni alterar estados.
- Se confirmó en DEC-161 que el MVP prioriza escritorio completo; móvil, PWA y sincronización entre dispositivos quedan para una evolución con base de datos.
- DEC-168 reemplaza únicamente la exclusión de PWA de DEC-161: la PWA entra como mecanismo instalable de escritorio; móvil y sincronización continúan fuera del MVP. DEC-169 deja el acceso a datos detrás de un contrato preparado para una migración futura y explícita a Supabase o Cloudflare, manteniendo GitHub Pages como frontend si sigue siendo conveniente.
- Se aprobó en DEC-170 que la PWA funciona offline después de su primera carga, revisa y descarga actualizaciones en segundo plano y nunca las activa durante una sesión sin confirmación. Las migraciones de esquema exigirán respaldo JSON previo.
- Se aprobó en DEC-171 una restauración JSON guiada que reemplaza íntegramente la base local, exige respaldo actual y evita cualquier merge automático. Datos y respaldos mostrará un mini manual operativo para personas no técnicas.
- Se aprobó en DEC-172 una única base IndexedDB organizada por colecciones de dominio, con transacciones que guardan juntos cada cambio, sus relaciones y su evento o no guardan nada.
- Se aprobó en DEC-173 que las cargas CSV posteriores son aditivas: reportan duplicados sin sobrescribir y permiten confirmar de forma atómica solo los registros nuevos aceptados.
- Se aprobó en DEC-174 React + TypeScript + Vite con arquitectura modular: interfaz, casos de uso, dominio, contratos y adaptadores quedan separados para permitir una evolución posterior de IndexedDB a Supabase o Cloudflare.
- Se aprobó en DEC-175 la estrategia de pruebas y las puertas mínimas de publicación. `ARCHITECTURE.md` consolida todas las decisiones de Fase F para revisión final.
- Se aprobó en DEC-176 el respaldo JSON sin contraseña adicional, con advertencia de manejo privado y ubicación recomendada en una carpeta privada de OneDrive.
- La usuaria aprobó formalmente `ARCHITECTURE.md` el 2026-08-25; Fase F cerrada y transición a Fase G registrada en DEC-177.
- Se confirmó en DEC-162 que el Dashboard es una fotografía actual sin filtros de periodo ni históricos y, en DEC-163, el conjunto acotado de KPIs actuales; conversión pasa a Insights futuro.
- Se detalló en DEC-164 el módulo futuro Insights con KPIs, barras, líneas y tablas, sin nuevas preguntas de descubrimiento y fuera del MVP.
- DEC-165 descarta Finanzas en el MVP y DEC-166 confirma el alcance de Comisiones y la evolución futura condicional.
- DEC-167 registra la aprobación formal del alcance y el cierre de Fase E.
- Se cerró la Fase C con aprobación explícita de la usuaria para pasar a reglas de dominio y alcance del MVP.
- Se completó la clasificación inicial de las 25 columnas de `Ventas`: captura directa, XLOOKUP, cálculo, excepción fija y casos que requieren revisión por fila.
- Se confirmó por estructura que los tres valores de `Ventas.Status` describen seguimiento de comisión y no el estado del Servicio/Reserva.
- Se verificó en el perfil actual que `Ventas.Moneda` está completa en las 224 filas; el faltante pendiente de DEC-095 pertenece a `Leads`.
- Se actualizaron el PRD, el diccionario, la verificación y las decisiones.
- Se añadieron `IMPORT_EXPORT_SPEC.md` y `SECURITY_AND_PRIVACY.md`.
- Interpretación inicial sustituida por DEC-116: cada fila de `Ventas` es un componente de Proveedor; no se agrupa automáticamente en una Reserva por compartir Cliente o Viaje.
- Se confirmó intervalo del Viaje por servicios con override manual y conservación de fechas solicitadas del Lead.
- Se confirmó una bitácora automática para seguimiento, estatus, cotización, conversión y tareas.
- Se confirmó el principio de captura mínima y divulgación progresiva.
- Se confirmó captura inicial balanceada: contacto, solicitud/destino y fechas tentativas, con datos de sistema automáticos.
- Se confirmó el estado explícito `fechas_por_definir` para Leads sin rango tentativo.
- Se confirmó que `Nuevo` es opcional y que la captura manual posterior a una interacción puede entrar directamente como `Contactado`.
- Se confirmaron los nombres `Revisión/Ajustes` y `Vendido`.
- Se confirmó `Cotización en preparación` como estado entre `Contactado` y `Cotización enviada`.
- Se confirmó que `Costo final` conserva totales por moneda para cada Servicio/Reserva y puede tener un total de referencia mediante una tasa editable del Viaje.
- Se confirmó que `Pago de Comisión` es la fecha esperada/límite y que la fecha real se registra por separado al seleccionar un día de pago.
- Se confirmó que `Hoja1`/“Sheet 1” es histórica y queda fuera de la migración operativa.
- Se propuso analytics posteriores basados en datos operativos validados para apoyar promoción y contenido de la agencia.
- Se confirmó que las hojas financieras, administrativas y personales quedan fuera del CRM inicial.
- Se confirmó que `PTC Evolution` está desactualizada y queda fuera de la migración y conciliación.
- Se confirmó un repositorio único de Clientes, alimentado o vinculado desde Leads, con administración progresiva de contactos, preferencias, cuentas de servicio y notas adicionales.
- Se confirmó una Nota útil enriquecida por Cliente/Familia y campos comerciales estructurados para presupuesto, moneda, tipo de viaje y cantidades.
- Se confirmó una captura única de Lead en modo rápido o completo, sin bloquear por datos manuales faltantes.
- Se confirmó el catálogo inicial configurable de tipo de viaje.
- Se confirmó un único tipo principal por Lead; los extras se registran como servicios o adicionales de cotización/Viaje.
- Se confirmó el catálogo inicial configurable de canales de entrada y la semántica de `Cliente` y `Viaje personal`.
- Se confirmó que cada Proveedor dentro de un Servicio/Reserva determina su propia comisión, con comisión bruta al 100% capturada para cada caso.
- Se confirmó que cada Proveedor define individualmente la participación que recibe la agencia, inicialmente 80% o 100%; el monto neto se deriva desde la comisión bruta y esa configuración.
- Se confirmó que cada Proveedor se configura con comisión bruta por porcentaje fijo o monto variable por servicio.
- Se confirmó que el porcentaje fijo se administra en el Proveedor; el monto variable se captura en el Servicio.
- Se confirmó que el porcentaje fijo de cada Proveedor se calcula sobre su propio importe final dentro del Servicio.
- Se confirmó que el pago conserva monto neto esperado y monto real recibido por separado, para reflejar variaciones por tipo de cambio o cargos bancarios.
- Se confirmó que el pago real puede recibirse en una moneda distinta de la comisión esperada; ambas monedas se conservan sin comparar importes sin conversión.
- Se confirmó que no se registra una tasa de cambio manual por pago; en esta etapa los totales de distintas monedas permanecen separados.
- Se confirmó que el dashboard inicial presenta totales separados por moneda; la conversión central queda fuera de esta etapa.
- Se confirmó un único pago real por Comisión; los pagos parciales quedan fuera de alcance inicial.
- Se confirmó que el pago único marca la Comisión como `Pagada` aunque difiera del esperado; el monto real recibido es el reportado como cobro.
- Se confirmó una advertencia de diferencia con acciones de confirmar y regresar a corregir antes de cerrar el pago.
- Se confirmó que el motivo de diferencia será una nota de texto libre opcional y desacoplada, fácil de ocultar o retirar.
- Se confirmó que el plazo de fecha esperada se configura por Proveedor en Administración; el valor inicial sugerido es fin del Viaje +90 días, con override manual.
- Se confirmó que un plazo personalizado del Proveedor es relativo y se recalcula al cambiar el Viaje; una fecha fija manual queda bloqueada.
- Se creó `DATA_MODEL.md` como fuente de verdad del dominio.

## Trabajo en curso

- Preparación de Oleada 1: fundaciones, dominio, persistencia, conversión y pantallas de Leads conforme a `docs/superpowers/plans/2026-08-25-world-memories-mvp.md`.
- Task 1 completada: configuración React/TypeScript/Vite, pruebas, typecheck, CI y reglas iniciales de moneda/fechas; la auditoría de dependencias quedó en cero vulnerabilidades tras sustituir librerías de exportación Excel con alertas conocidas.
- Task 2 en curso: transiciones comerciales del Lead bajo pruebas unitarias.

## Próximos pasos

1. Ejecutar y verificar la Oleada 1 del plan de implementación.
2. Proponer a la usuaria la activación de un revisor Terra High de lógica/datos para la Oleada 1.
3. Incorporar hallazgos aceptados antes de iniciar la Oleada 2.

## Bloqueos

- **B-004 — Seguridad:** las credenciales del libro deben rotarse/moverse a un gestor; no bloquea el análisis, pero sí una migración segura.

## Preguntas abiertas priorizadas

1. Cuando el viaje ya se realizó, ¿cómo y cuándo haces seguimiento a la Comisión de cada Proveedor hasta marcarla como pagada?

## Decisiones recientes

- DEC-003 confirma conservar el XLSX original y transformar por capas.
- DEC-004 propone excluir credenciales y gestionarlas fuera del CRM.
- DEC-005 fue precisada por DEC-116: una fila de `Ventas` por componente de Proveedor.
- DEC-006 confirma intervalo del Viaje por servicios con override.
- DEC-007 confirma eventos automáticos para historial y métricas.
- DEC-008 confirma captura mínima y divulgación progresiva.
- DEC-009 confirma captura inicial balanceada de Lead.
- DEC-010 confirma el estado `fechas_por_definir`.
- DEC-011 confirma la entrada opcional en Nuevo y la creación directa como Contactado.
- DEC-012 confirma Revisión/Ajustes y Vendido.
- DEC-012 confirma Cotización en preparación.
- DEC-013 confirma que Costo final es importe cobrado al cliente.
- DEC-014 confirma fecha límite y fecha real de pago separadas.
- DEC-015 confirma exclusión de `Hoja1`.
- DEC-016 propone analytics como evolución posterior.
- DEC-017 confirma exclusión de hojas financieras, administrativas y personales del CRM inicial.
- DEC-018 confirma exclusión de `PTC Evolution` por desactualización.
- DEC-019 confirma el expediente único de Cliente, la vinculación desde Leads y las contraseñas fuera del CRM.
- DEC-020 confirma la Nota útil de familia y los campos comerciales básicos disponibles.
- DEC-021 confirma la captura adaptable de Lead y los campos condicionales de referido.
- DEC-022 confirma el catálogo inicial configurable de tipo de viaje.
- DEC-022 confirma un tipo principal y extras separados por servicio.
- DEC-023 confirma canales de entrada y sus casos especiales.
- DEC-024 confirma el alcance por Proveedor dentro de Servicio, permitiendo varios Proveedores por Servicio.
- DEC-025 confirma participación individual de agencia al 80% o 100% por Proveedor, independiente del modo de comisión bruta.
- DEC-025 confirma porcentaje fijo configurable por Proveedor o monto variable capturado en el Servicio.
- DEC-025 separa el modo de comisión bruta de la participación 80%/100% de la agencia.
- DEC-026 confirma monto esperado y monto real recibido separados.
- DEC-026 confirma monedas esperada y recibida independientes.
- DEC-026 descarta tasa de cambio manual por pago.
- DEC-026 confirma totales iniciales separados por moneda.
- DEC-026 confirma pago único por Comisión.
- DEC-026 confirma monto real como fuente de reportes y estatus Pagada.
- DEC-026 confirma advertencia y corrección previa cuando el monto difiere.
- DEC-026 confirma nota de texto libre opcional desacoplada para el motivo.
- DEC-027 confirma plazo configurable por Proveedor y valor inicial sugerido de +90 días.
- DEC-027 distingue override relativo recalculable de fecha fija manual.
- DEC-027 confirma que `commission.due_on` permanece vacía si el Viaje aún no tiene fecha efectiva.
- DEC-027 confirma que una Comisión conserva el plazo vigente al crearla; cambios posteriores del Proveedor solo aplican a Comisiones nuevas.
- DEC-028 confirma que cada Proveedor de servicio sin comisión se marca explícitamente y no crea una Comisión vacía.
- DEC-028 confirma que un Proveedor de servicio `Sin comisión` puede pasar a `Con comisión` y crear una Comisión manualmente.
- DEC-028 confirma que todo Proveedor de servicio inicia `Con comisión`; `Sin comisión` es una excepción explícita.
- DEC-029 confirma que los totales del Servicio se derivan por moneda de importes por Proveedor más conceptos adicionales sin Proveedor.
- DEC-029 confirma que el porcentaje fijo de un Proveedor usa su propio importe final, no el total del Servicio.
- DEC-029 confirma que un concepto adicional solo requiere nombre, importe y moneda; las categorías quedan para una evolución posterior si hacen falta.
- DEC-029 confirma que un Servicio puede ser multimoneda y que sus totales se muestran separados por moneda, sin conversión implícita.
- DEC-030 confirma una tasa de cambio de referencia, única y editable, por Viaje; los importes originales se preservan.
- DEC-030 confirma que la moneda de referencia es la moneda de cotización al cliente y que la tasa muestra siempre un par explícito, por ejemplo `1 USD = 18.50 MXN`; comisiones se validarán aparte.
- DEC-030 confirma recálculo automático durante preparación, congelamiento al marcar `Vendido` y ajuste posterior explícito con trazabilidad.
- DEC-030 confirma historial automático de tasa anterior/nueva, fecha/hora y usuario, con motivo opcional.
- DEC-031 confirma que cada Comisión inicia con la tasa del Viaje y luego puede tener una tasa de proyección propia sin modificar el Viaje ni otras Comisiones.
- DEC-031 confirma que la Comisión sigue automáticamente los cambios de tasa del Viaje hasta que recibe su primer override manual.
- DEC-031 confirma que `Volver a usar la tasa del Viaje` elimina un override y reactiva el seguimiento automático de esa Comisión.
- DEC-032 confirma detección asistida de posibles duplicados de Cliente, con decisión humana de fusionar o crear un Cliente independiente.
- DEC-032 confirma que los candidatos de duplicado no revisados se importan como Clientes independientes marcados para revisión y no bloquean el lote.
- DEC-033 confirma que `Pausado` y `Cancelado` solo se reactivan manualmente hacia `Seguimiento` o `Revisión/Ajustes`; no existen reactivaciones automáticas.
- DEC-033 confirma que pausar sugiere una próxima tarea o recordatorio opcional, sin crearla ni exigirla.
- DEC-033 confirma que `Cancelado` usa categoría principal configurable, nota libre opcional y alta rápida de categorías desde el mismo flujo.
- DEC-033 confirma el catálogo inicial `Canceló viaje`, `Costo/presupuesto`, `Eligió otra agencia` y `No respondió`.
- DEC-034 confirma que el seguimiento posterior a una cotización se activa cambiando manualmente a `Seguimiento`; la fecha y el evento se generan automáticamente.
- DEC-035 confirma que los avances y pendientes se registran en una nota enriquecida dentro del Viaje, separada de la Nota útil del Cliente/Familia.
- DEC-035 confirma una sola nota de trabajo por Viaje, con múltiples asuntos/fechas y formatos rápidos de texto.
- DEC-035 confirma que `Insertar fecha` abre un calendario para elegir la fecha exacta que se inserta en la nota.
- DEC-036 confirma un único `Guardar cambios` para el expediente de Cliente, incluyendo modificaciones de Viajes, Proveedores, importes y notas en una operación consistente.
- DEC-036 confirma una advertencia al salir con cambios sin guardar, con `Guardar`, `Salir sin guardar` y `Cancelar`.
- DEC-036 confirma toast breve tras guardar, botón restablecido y `Última vez guardado` visible en Cliente y Viaje.
- DEC-036 confirma formato corto de `Última vez guardado` con detalle completo al pasar el cursor.
- Se recomienda un paquete versionado con varios CSV, no un CSV único denormalizado.

## Archivos modificados o creados

- `AGENTS.md`
- `PROGRESS.md`
- `VERIFIER.md`
- `PRD.md`
- `DECISIONS.md`
- `EXCEL_ANALYSIS.md`
- `DATA_DICTIONARY.md`
- `SCREEN_MAP.md`
- `DATA_MODEL.md`
- `IMPORT_EXPORT_SPEC.md`
- `SECURITY_AND_PRIVACY.md`
- `tools/profile_excel.py`
- `tests/test_profile_excel.py`
- `artifacts/Control_WM_12_07_2026_profile.json`

## Verificaciones ejecutadas

| Fecha | Verificación | Resultado |
|---|---|---|
| 2026-07-12 | Lectura completa de los adjuntos iniciales | Pasa |
| 2026-07-12 | Perfilado no destructivo del XLSX | Pasa; 17 hojas procesadas |
| 2026-07-12 | `python -m unittest tests.test_profile_excel -v` | Pasa; 6/6 pruebas |
| 2026-07-12 | Trazabilidad Leads→Ventas | Pasa; 108/108 IDs de Ventas enlazan a Leads |
| 2026-07-12 | Revisión de privacidad del perfil | Pasa después de impedir valores en candidatos de encabezado |
| 2026-07-12 | Verificación de hash posterior al análisis | Pasa; SHA-256 coincide con el inicial |
| 2026-08-02 | `python -m unittest tests.test_profile_excel -v` | Pasa; 6/6 pruebas |
| 2026-08-02 | Perfilado no destructivo de la entrega actual | Pasa; 17 hojas, SHA-256 `1c172c06…` |
| 2026-08-02 | Comparación anonimizada con perfil anterior | Pasa; sin cambios en estructura ni agregados de `Leads`, `Ventas`, `Datos Clientes` y `DROP DOWNS` |

## Riesgos detectados

- Credenciales, datos de contacto, direcciones, nacimiento, referencias y finanzas en el mismo libro.
- Un ID calculado colisiona y no representa inequívocamente un viaje.
- Un CSV plano perdería relaciones o duplicaría información.
- Fórmulas y cachés pueden contener valores derivados obsoletos; el XLSX no recalcula en el perfilador.
- `openpyxl` no interpreta extensiones x14; se inventariaron desde XML y no se guardó la fuente.
- Coincidencia exacta limitada entre Leads y Datos Clientes.
- Fuentes solapadas (`Ventas`, `Detail1`) requieren jerarquía confirmada; `Hoja1` ya está excluida.

## Deuda técnica aceptada

- El perfilador emite una advertencia conocida de `openpyxl` sobre extensiones x14; la cobertura se complementa con análisis XML directo.
- La definición de campos mínimos de Lead queda abierta hasta recibir respuesta del usuario.

## Próximo punto de validación con el usuario

Al terminar Oleada 1, decidir si autoriza el subagente Terra High de revisión independiente de lógica/datos.
- DEC-037 confirma la navegación equivalente desde Clientes/Familias y Viajes activos hacia el mismo expediente enfocado de Viaje.
- DEC-038 confirma fecha de nacimiento para contacto principal y demás viajeros, con edad dinámica en años y meses; otros atributos estructurados de Pasajero quedan en backlog.
- DEC-039 confirma miembros básicos de Cliente/Familia y selección explícita de viajeros por Viaje, con contacto principal obligatorio.
- DEC-040 registra para fases futuras respaldo JSON completo, paquete Excel operativo y recordatorio descartable tras tres días sin respaldo; quedan pendientes seguridad, restauración y arquitectura.
- DEC-041 confirma edad vigente en Cliente/Familia y edad proyectada al inicio efectivo dentro del Viaje.
- DEC-042 confirma el Calendario como tercera entrada al mismo expediente enfocado de Viaje.
- DEC-040 precisa que la alerta de respaldo reaparece cada 24 horas tras descartarse, hasta registrar una nueva descarga.
- DEC-043 confirma relación opcional y básica de cada miembro con el contacto principal: Pareja, Madre, Padre, Hijo, Hija u Otro.
- DEC-044 confirma alta rápida de un miembro desde el expediente de Viaje, asociándolo a la familia para uso actual y futuro.
- DEC-045 confirma archivo no destructivo de miembros con historial, excluyéndolos de nuevas selecciones sin alterar Viajes anteriores.
- DEC-046 confirma contacto principal seleccionado al crear el Viaje, fijo por defecto, y alta de Cliente/Familia desde el mismo flujo cuando no existe.
- DEC-047 confirma reactivación explícita de miembros archivados sin alterar su historial.
- DEC-048 confirma visibilidad etiquetada de miembros archivados y exclusión de nuevas selecciones hasta reactivación.
- DEC-049 confirma tareas manuales mínimas, módulo global de tareas y plantillas editables por Proveedor sugeridas al confirmar su selección.
- DEC-050 confirma fechas de tareas de plantilla relativas al inicio del Viaje por días/meses, incluido mismo día, después del inicio o fecha manual, además de condiciones por tipo, componentes o destino.
- DEC-051 confirma tareas de plantilla relativas al fin efectivo del Viaje para seguimiento posterior.
- DEC-052 confirma recálculo de tareas de plantilla con protección de fechas editadas manualmente, alerta amable de revisión y acciones para recalcular o mantener el ajuste.
- DEC-053 confirma alertas internas como alcance inicial; notificaciones nativas, WhatsApp e integraciones externas quedan anotadas en roadmap.
- DEC-054 confirma agrupamiento operativo global de tareas y filtros iniciales por Viaje, fechas y Proveedor, con ampliación solo según uso validado.
- DEC-055 confirma toast temporal con `Deshacer` al completar tareas y trazabilidad de completar, revertir o reabrir.
- DEC-056 confirma versionado de plantillas de Proveedor: cambios futuros no alteran tareas ya generadas.
- DEC-057 confirma Calendario unificado de Viajes, Tareas, fechas límite de pago y Comisiones esperadas, con filtros independientes y sin eventos de fecha inexistente.
- DEC-058 confirma panel lateral contextual desde Calendario y navegación explícita a Viaje, Tarea, Cliente o Comisión.
- DEC-059, sustituida por DEC-148, confirma vista mensual predeterminada, semanal y planificación/agenda sin vista diaria.
- DEC-060 confirma expediente de Proveedor con pestañas enfocadas: Datos generales, Comisiones y Plantillas de tareas.
- DEC-061 confirma datos generales ligeros de Proveedor, etiquetas múltiples configurables, referencias múltiples y resumen de comisión sin duplicar reglas.
- DEC-062 confirma que un Proveedor inactivo sigue visible y etiquetado; seleccionarlo para un nuevo servicio exige reactivación explícita.
- DEC-063 confirma que el aviso de selección ofrece `Activar y usar` o `Cancelar`, y que solo la activación explícita permite agregar el Proveedor al servicio nuevo.
- DEC-064 confirma que la activación es global y reversible desde Administración, sin alterar el historial del Proveedor.
- DEC-065 confirma que los vínculos existentes siguen siendo editables al inactivar un Proveedor; la activación previa solo aplica al agregarlo a un Servicio nuevo.
- DEC-066 confirma que la inactivación no altera Comisiones pendientes ni Tareas ya generadas.
- DEC-067 incorpora un buscador global persistente por texto libre; queda por delimitar su alcance inicial y exclusiones de privacidad.
- DEC-068 confirma búsqueda en entidades operativas, títulos de Tareas y notas de Cliente/Familia/Viaje, con tipo, contexto y detalle breve visibles en cada resultado.
- DEC-069 confirma navegación directa desde resultados hacia el punto exacto de trabajo dentro de su expediente.
- DEC-070 confirma agrupación inicial por tipo con todos los grupos visibles y sin filtros manuales obligatorios.
- DEC-071 confirma un estado vacío sencillo, con la consulta visible y acción para limpiar, sin sugerencias inventadas.
- DEC-072 confirma búsqueda parcial normalizada e insensible a mayúsculas, tildes, espacios y separadores, sin corrección automática de errores tipográficos en el MVP.
- DEC-073 incorpora bilingüismo integral español/inglés para todo texto del sistema, preservando sin traducción los datos capturados por la usuaria; idioma predeterminado pendiente.
- DEC-074 confirma español como idioma inicial, selector para cambiar a inglés y conservación local de la preferencia.
- DEC-075 confirma que idioma y formatos operativos son independientes: solo se traducen textos del sistema; números, fechas y monedas no cambian.
- DEC-076 confirma formato fijo `DD/MM/YYYY` para fechas operativas, incluso con interfaz en inglés.
- DEC-077 confirma exportación de fechas CSV como `YYYY-MM-DD` para interoperabilidad, sin cambiar el formato operativo del CRM.
- DEC-078 confirma montos CSV como números puros con punto decimal y moneda ISO-4217 en columna independiente.
- DEC-079 confirma codificación UTF-8 con BOM para conservar acentos y caracteres especiales en CSV.
- DEC-080 confirma manifiesto obligatorio por paquete CSV con versión, fecha, archivos, conteos y checksum.
- DEC-081 confirma SHA-256 como algoritmo de checksum registrado por archivo.
- DEC-082 confirma la exclusión total de `TEMPLATE` del modelo, la migración y la inferencia de datos.
- DEC-083 confirma que el Lead representa una consulta independiente y no se convierte ni reutiliza como Cliente.
- DEC-084 confirma el tratamiento de la fecha de solicitud histórica desconocida.
- DEC-085 confirma el tratamiento de cotizaciones históricas enviadas sin fecha.
- DEC-086 confirma IDs internos nuevos, IDs legados intactos y trazabilidad/vinculación controlada entre Leads y Ventas.
- DEC-087 confirma el alcance histórico exclusivo de Ana Lu/Analu.
- DEC-088 confirma el mapeo de estados específico de la migración histórica.
- DEC-089 confirma `Cancelado` como estado único de cierre sin venta para todo el CRM.
- DEC-090 confirma que `Contacto con WM` es origen de adquisición y `Comunicación` es el canal de conversación; pueden coincidir sin duplicarse.
- DEC-091 confirma que `País` en `Leads` es residencia actual, no nacionalidad ni destino, y no actualiza un Cliente automáticamente.
- DEC-092 confirma que `Tipo de venta` clasifica la necesidad inicial del Lead y no crea detalle de Viaje, Servicios/Reservas ni Proveedores.
- DEC-093 confirma que `Destino` de `Leads` es texto libre de intención inicial y no un itinerario, Reserva ni destino final.
- DEC-094 confirma cero diferencias calculables actuales entre `Pax` y `Adultos`+`Niños`; una diferencia futura genera advertencia por fila antes de migrar.
- DEC-095 confirma que solo cuatro `Cancelado` históricos pueden quedar sin moneda; el vacío restante se completa antes del CSV final y `Vendido` exige ISO-4217.
- DEC-096 confirma que `Cotización` se importa como un único importe histórico y permanece separada del importe vendido final.
- DEC-097 confirma comisión proyectada al 100%, recálculo de 148 fórmulas de 80% y clasificación previa de las ocho celdas sin fórmula.
- DEC-098 confirma que Presupuesto se importa como resultado o vacío histórico, nunca como fórmula, y que su valor puede permanecer vacío incluso en `Vendido`.
- DEC-099 confirma que `# Noches` se importa como resultado numérico o valor fijo, nunca como fórmula.
- DEC-100 confirma que `Tiempo de envío` se calcula y carga solo cuando solicitud y envío son conocidos; de otro modo queda vacío/no medible.
- DEC-101 confirma que las notas de `Leads` se importan como contexto vinculado, sin crear automatizaciones desde su texto.
- DEC-102 confirma que las comisiones al 80 % fijas de `Ventas` se conservan y las fórmulas se recalculan.
- DEC-103 confirma el mapeo histórico de tres estados de comisión, sin fecha de pago inventada.
- DEC-104 confirma `Clientes por viajar` como Comisión pendiente mientras el viaje no ha finalizado.
- DEC-105 confirma importes financieros históricos desconocidos sin inferir cero ni `sin comisión`.
- DEC-106 confirma un vínculo histórico específico por tipo, fecha de fin y proximidad de inicio.
- DEC-107 confirma siete vínculos históricos por revisión visual; dos filas quedan pendientes de cardinalidad Lead–Viaje.
- DEC-108 confirma varios Leads vinculados a un mismo Viaje y resuelve las dos filas restantes.
- DEC-109 confirma el alcance de pasajeros y duración para Viaje y Servicio/Reserva.
- DEC-110 confirma el tipo de Servicio/Reserva independiente del tipo principal del Lead.
- DEC-111 confirma el destino efectivo de Servicio/Reserva independiente de la intención inicial del Lead.
- DEC-112 confirma el titular de Reserva independiente del contacto del Lead.
- DEC-113 confirma la creación inicial de Proveedores desde el histórico.
- DEC-114 confirma Proveedores monomoneda o multimoneda y moneda efectiva por Servicio/Reserva.
- DEC-115 confirma selección explícita de moneda antes de guardar un importe.
- DEC-116 confirma una fila de Ventas por componente de Proveedor.
- DEC-117 confirma pago efectivo con tarjeta por componente de Proveedor.
- DEC-118 confirma identificador oficial de seguimiento de Comisión.
- DEC-119 confirma localizador de Reserva por componente de Proveedor.
- DEC-120 confirma notas históricas por componente de Proveedor.
- DEC-121 confirma metadato `Concepto` redundante fuera de migración.
- DEC-122 clasifica `DROP DOWNS` por función y evita migrarlo como un bloque único.
- DEC-123 confirma dos Proveedores distintos con nombres similares.
- DEC-124 confirma directorio maestro de Clientes sin enriquecimiento en migración.
- DEC-125 confirma el cierre de las fuentes restantes del libro.
- DEC-126 confirma el flujo de consulta hasta primera cotización.
- DEC-127 confirma seguimiento automático a los 4 días de la primera cotización.
- DEC-128 confirma conversión al primer cobro exitoso.
- DEC-129 confirma control de pagos parciales por componente de Proveedor.
- DEC-130 confirma fecha límite de saldo manual por componente de Proveedor.
- DEC-131 confirma alertas escalonadas para saldo pendiente.
