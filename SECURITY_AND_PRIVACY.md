# Seguridad y privacidad

## Estado

- **Versión:** evaluación 0.2.
- **Alcance:** libro fuente, MVP local-first y evolución futura.
- **Conclusión:** el archivo debe tratarse como altamente sensible.

## Hallazgo crítico

Las hojas `Usuarios` y `Datos Clientes` contienen nombres de usuario y contraseñas de plataformas en texto plano. No se reproducen sus valores en esta documentación.

Acciones recomendadas:

1. Excluir completamente esos campos de CSV, IndexedDB, logs, pruebas y respaldos del dashboard.
2. Rotar las credenciales contenidas en la copia compartida, priorizando plataformas de reservas, pagos, correo y redes sociales.
3. Mover las credenciales vigentes a un gestor de contraseñas con MFA.
4. Proteger o retirar las hojas del libro operativo una vez verificada la migración al gestor.
5. Tratar copias existentes del XLSX como archivos confidenciales.

## Clasificación inicial

| Nivel | Ejemplos detectados | Tratamiento propuesto |
|---|---|---|
| Secreto | Usuarios y contraseñas | Prohibido en el CRM; gestor de secretos/contraseñas |
| Altamente sensible | Datos bancarios, localizadores, tracking, fechas de pago | Fuera del MVP o acceso específicamente diseñado |
| Personal | Nombre, correo, teléfono, dirección, nacimiento, itinerario | Minimización, propósito definido y exportación protegida |
| Operativo | Estado, destino, proveedor, tareas, notas | CRM, evitando texto sensible innecesario |
| Configuración | Catálogos, monedas, porcentajes | Importable con versionado y validación |

## Minimización para el MVP

- Nombre, uno o más medios de contacto y datos básicos del viaje pueden ser necesarios.
- Dirección completa y fecha de nacimiento se importan solo si existe un caso de uso aprobado.
- Documentos de identidad, tarjetas y contraseñas quedan fuera.
- Las notas deben advertir que no se escriban secretos ni datos de pago.
- Los localizadores se almacenarán como datos sensibles operativos y no aparecerán en logs.

## Cuentas de servicios de clientes

- El CRM puede conservar metadatos operativos de una cuenta vinculada a un Cliente, por ejemplo plataforma, identificador de acceso, propósito y referencias de tickets.
- Las contraseñas no se importan, almacenan, respaldan ni exportan desde el CRM. La usuaria las gestiona fuera del sistema en un Excel separado bajo su propia responsabilidad.
- La necesidad de acceder a una cuenta no convierte automáticamente al CRM local-first en un gestor de contraseñas seguro.

## Riesgos de la arquitectura local-first

- IndexedDB queda accesible desde el perfil del navegador y dispositivo.
- Borrar datos del navegador o perder el equipo puede eliminar el CRM.
- Un respaldo sin cifrar replica toda la exposición.
- No existe aislamiento real entre usuarios del mismo perfil/dispositivo.
- Un frontend comprometido puede leer datos accesibles a la aplicación.

La aplicación local-first no debe presentarse como equivalente a un sistema multiusuario seguro.

## Política propuesta de logs y pruebas

- Usar IDs internos y estadísticas; nunca nombres, correos, teléfonos, direcciones, localizadores o importes identificables.
- Muestras sintéticas, no copias de filas reales.
- Errores de importación identifican `source_sheet` y `source_row`, pero enmascaran el valor problemático.
- No adjuntar el XLSX ni perfiles con secretos a repositorios remotos.
- El perfilador solo emite encabezados confirmados, estadísticas y muestras anonimizadas.

## Exportación y respaldo

- Toda exportación debe advertir que contiene datos personales.
- El respaldo JSON completo del MVP se descarga sin contraseña o cifrado adicional, conforme DEC-176. Antes de descargar/restaurar, la interfaz advierte su manejo privado.
- El mini manual recomienda una carpeta privada y dedicada de OneDrive, por ejemplo `OneDrive/World Memories/Respaldos CRM`; la decisión autoriza esa sincronización personal controlada por la propietaria.
- Cifrado administrado, control de acceso y respaldos centralizados se evalúan cuando exista backend.
- Registrar fecha del último respaldo y verificar restauración periódicamente.
- Separar exportación interoperable (CSV minimizado) de respaldo completo versionado.

## Retención, archivo y borrado

Pendiente definir:

- tiempo de conservación de leads perdidos;
- política para clientes inactivos;
- borrado versus anonimización;
- conservación financiera/legal;
- respuesta a solicitudes de acceso/corrección/eliminación;
- jurisdicciones aplicables.

## Puertas de seguridad antes de implementar

- Aprobación explícita de campos personales del MVP.
- Credenciales excluidas del esquema y pipeline.
- Política de respaldo/restauración definida.
- Amenazas y limitaciones local-first aceptadas.
- Datos de prueba sintéticos disponibles.
- Validaciones que impidan exportar campos bloqueados.
