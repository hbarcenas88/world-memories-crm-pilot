# Contrato operativo del proyecto

## Propósito

Este repositorio alojará la especificación y, únicamente después de aprobación explícita, la implementación de un CRM local-first para una agencia de viajes. El sistema busca centralizar el proceso desde la entrada de un lead hasta el viaje, los proveedores, las comisiones y el cierre.

## Acompañamiento de producto y práctica profesional

- Este es el primer CRM que construye la usuaria. El equipo debe explicar las buenas prácticas, riesgos y alternativas de forma clara antes de convertirlas en decisiones.
- Las recomendaciones profesionales son una guía adaptable al proceso real de la agencia: se privilegia el resultado operativo, la menor captura posible y una justificación explícita cuando se acepta una excepción.
- Una sugerencia no se convierte en requisito, regla definitiva ni implementación sin validación de la usuaria; los desacuerdos y excepciones se registran con su impacto.
- Al cerrar cada respuesta con un siguiente paso, recomendar el modelo y nivel de esfuerzo adecuados, equilibrando la complejidad/riesgo de la tarea con el consumo de límites. Usar `Luna` para consultas o ajustes acotados, `Tierra` como opción equilibrada para análisis y decisiones de dominio, y `Sol` para análisis complejos, arquitectura o verificación de alto riesgo. Indicar también `bajo`, `medio` o `alto` esfuerzo y una razón breve.

## Estado y prioridad vigentes

- **Fase actual:** implementación autorizada — Oleada 1.
- **Estado:** Fases A–G completadas y aprobadas; la implementación está autorizada con Terra High y revisiones independientes sujetas a aprobación por oleada.
- **Prioridad:** ejecutar y verificar la Oleada 1 antes de proponer el revisor Terra High de lógica/datos.
- **Restricción absoluta:** no crear código, scaffolding, prototipos funcionales ni arquitectura definitiva antes de completar las fases A–G y recibir autorización inequívoca del usuario.

## Flujo obligatorio

1. Observar archivos y hechos disponibles.
2. Modelar hallazgos separando **Confirmado**, **Inferido**, **Propuesto**, **Pendiente** y **Descartado**.
3. Entrevistar por fases, con una pregunta principal por turno.
4. Proponer alternativas para decisiones estructurales y explicar sus compromisos.
5. Validar procesos, alcance, datos, reglas, criterios y arquitectura con el usuario.
6. Mantener actualizados `PROGRESS.md`, `PRD.md`, `DECISIONS.md` y `VERIFIER.md`.
7. Solicitar aprobación explícita al finalizar la Fase G.
8. Solo entonces preparar un plan de implementación; cada incremento debe probarse y documentarse.

Las fases de descubrimiento son: A) orientación e inventario; B) análisis de Excel; C) proceso actual; D) dominio y reglas; E) alcance y diseño del MVP; F) arquitectura y plan; G) aprobación.

## Convenciones y fuentes de verdad

- `CRM_PROJECT_CONTEXT.md` o el contexto adjunto es insumo inicial, no especificación aprobada.
- `PRD.md` es la fuente de verdad de producto.
- `DECISIONS.md` es la fuente de verdad de decisiones de producto y arquitectura.
- `DATA_DICTIONARY.md` es la fuente de verdad del mapeo de datos.
- `DATA_MODEL.md` es la fuente de verdad de entidades, relaciones, fechas y eventos del dominio.
- `EXCEL_ANALYSIS.md` es la evidencia del perfilado de archivos fuente.
- `ARCHITECTURE.md` es la fuente de verdad de la arquitectura técnica, persistencia, publicación, actualización, recuperación y estrategia de pruebas.
- `VERIFIER.md` contiene criterios, métodos y resultados de verificación.
- `PROGRESS.md` refleja el estado de trabajo y el siguiente punto de validación.
- `APPROVAL_PACKAGE.md` consolida el alcance sometido a autorización durante la Fase G.
- No se crea documentación por anticipación: cada documento nuevo debe tener una fuente de verdad, una fase o una necesidad de verificación concreta.
- La documentación se escribe en español, en Markdown y con identificadores estables para requisitos, decisiones y verificaciones.
- No duplicar una regla en varios documentos; enlazar a su fuente de verdad.

## Centralización obligatoria para una futura implementación

- **Diseño:** colores, tipografía, espaciado, radios, sombras, breakpoints, z-index, estados, iconos y componentes.
- **Dominio:** catálogos, estados, transiciones, tipos de viaje/servicio/tarea, monedas, canales, prioridades y estados de comisión.
- **Configuración:** marca, moneda base, tasas, regla estándar de comisiones, fechas, prefijos, calendario y alertas.
- **Datos:** esquemas versionados, validaciones, migraciones, serialización, importación, exportación, respaldo y restauración.

No usar constantes mágicas ni reglas de negocio dispersas.

- No pedir manualmente fechas, estados o datos que puedan derivarse con seguridad de la acción realizada.
- Registrar eventos solo al confirmar acciones de negocio, no por cada tecla, navegación o edición sin guardar.

## Calidad y comandos

Todavía no existe aplicación, instalación, lint ni build. Herramientas de análisis disponibles:

- Perfil anonimizado: `python tools/profile_excel.py "Control WM_12_07_2026_Dashboard.xlsx" artifacts/Control_WM_12_07_2026_profile.json`
- Pruebas del perfilador: `python -m unittest tests.test_profile_excel -v`

No inventar comandos de producto. Cuando exista una herramienta nueva, documentar aquí su comando canónico.

Antes de declarar una tarea o fase terminada debe existir evidencia reproducible: prueba automatizada, validación de esquema, importación de muestra, comparación con resultado esperado, prueba manual registrada o revisión explícita de criterios de aceptación.

## Esquemas y migraciones

- Ningún cambio de esquema se realiza sin requisito trazable, impacto analizado, versión nueva y estrategia de compatibilidad.
- Toda migración debe ser determinista, verificable, idempotente cuando sea viable y conservar una ruta de restauración.
- Nunca modificar los Excel originales. Analizarlos en modo lectura y anonimizar muestras.
- No declarar definitiva una clave, relación o transformación hasta contrastarla con datos reales y validarla con el usuario.

## Persistencia local

- IndexedDB es la persistencia estructurada seleccionada para el MVP y debe validarse en Fase F bajo el origen estable de la PWA publicada.
- Local Storage solo podrá guardar preferencias o valores pequeños, nunca la base principal del CRM.
- El acceso a datos deberá quedar detrás de límites claros para permitir una futura migración a backend.
- Deben existir versionado, manejo de errores, integridad referencial, respaldo y restauración verificada.

## Importación, exportación y respaldo

- Toda importación debe ofrecer mapeo/validación, vista previa, detección de duplicados, reporte por fila y confirmación antes de persistir.
- Toda importación debe preservar relaciones o rechazar de forma explicable los registros inválidos.
- La exportación general debe conservar esquema, versión, relaciones y metadatos necesarios para restaurar.
- CSV/Excel sirven para interoperabilidad; un formato de respaldo propio queda pendiente de diseño.
- Antes de una importación masiva o migración debe existir respaldo recuperable.

## Seguridad y privacidad

- Tratar datos de contacto, fechas de nacimiento, itinerarios, confirmaciones, pagos y documentos de pasajeros como datos personales o sensibles según corresponda.
- No incluir datos reales en logs, pruebas, capturas, documentación o commits.
- No imprimir filas candidatas a encabezado: pueden ser datos reales mal clasificados.
- Excluir del dashboard usuarios, contraseñas y secretos de plataformas; conservarlos únicamente en la fuente histórica hasta completar su retiro seguro.
- No almacenar documentos de identidad o datos de pago en el MVP sin una decisión específica de seguridad y cumplimiento.
- Los respaldos sin cifrar y IndexedDB no equivalen a una solución segura multiusuario.
- Documentar políticas de retención, exportación, borrado, acceso y pruebas antes de implementar datos sensibles.

## Accesibilidad, responsive y PWA

- Objetivo mínimo propuesto: WCAG 2.2 AA, sujeto a validación.
- No comunicar estados solo mediante color; usar texto, iconos o formas adicionales.
- Soportar navegación por teclado, foco visible, etiquetas, contraste y zoom.
- Validar la experiencia completa de escritorio; la experiencia móvil ligera queda fuera del MVP hasta disponer de backend y sincronización.
- La PWA forma parte del MVP como mecanismo instalable de escritorio. No implementar service worker, instalación ni caché sin una estrategia aprobada de actualización, almacenamiento, recuperación y pruebas offline.

## Definición de terminado

Una tarea solo termina cuando el requisito y alcance están claros, cumple su criterio de aceptación, pasan las verificaciones relevantes, se revisaron casos límite y regresiones, la documentación está actualizada y las limitaciones conocidas son visibles. Una fase documental requiere validación del usuario. La implementación completa requiere la aprobación explícita de Fase G antes de empezar.

## Prohibiciones y anti-patrones

- Programar antes de aprobación.
- Convertir el contexto inicial en requisitos definitivos sin entrevista.
- Alterar archivos fuente o exponer datos personales.
- Ocultar supuestos, fallos o deuda técnica.
- Mezclar cliente, viaje, venta, reserva, proveedor y comisión sin modelado validado.
- Usar Local Storage como base de datos principal.
- Afirmar éxito sin evidencia reciente.
- Sobrediseñar capacidades futuras o implementar módulos fuera del MVP aprobado.
