# Documento de Requisitos

## Introducción

Sistema de reservas de mesas para el restaurante "El Rinconcito de Anaga". La aplicación permitirá a los clientes realizar reservas de mesas de forma online, gestionar sus reservas existentes, y al personal del restaurante administrar la disponibilidad y las reservas recibidas.

## Glosario

- **Sistema_Reservas**: El sistema de software que gestiona las reservas del restaurante
- **Cliente**: Usuario que desea realizar una reserva en el restaurante
- **Mesa**: Unidad física de asiento en el restaurante con capacidad definida
- **Reserva**: Registro que asocia un cliente con una mesa en una fecha y hora específica
- **Administrador**: Personal del restaurante con permisos para gestionar mesas y reservas
- **Franja_Horaria**: Período de tiempo disponible para realizar reservas

## Requisitos

### Requisito 1: Crear Reserva

**Historia de Usuario:** Como cliente, quiero reservar una mesa en el restaurante, para asegurar mi lugar en la fecha y hora deseada.

#### Criterios de Aceptación

1. WHEN un cliente selecciona fecha, hora y número de comensales THEN el Sistema_Reservas SHALL mostrar las mesas disponibles que cumplan con la capacidad requerida
2. WHEN un cliente confirma una reserva con sus datos de contacto THEN el Sistema_Reservas SHALL crear la reserva y enviar una confirmación al cliente
3. WHEN un cliente intenta reservar una mesa ya ocupada en esa franja horaria THEN el Sistema_Reservas SHALL rechazar la reserva y mostrar alternativas disponibles
4. WHEN un cliente proporciona datos de contacto incompletos THEN el Sistema_Reservas SHALL indicar los campos requeridos faltantes
5. IF la fecha seleccionada es anterior a la fecha actual THEN el Sistema_Reservas SHALL rechazar la solicitud e indicar que la fecha no es válida

### Requisito 2: Consultar Reserva

**Historia de Usuario:** Como cliente, quiero consultar mis reservas existentes, para verificar los detalles de mi visita programada.

#### Criterios de Aceptación

1. WHEN un cliente proporciona su código de reserva THEN el Sistema_Reservas SHALL mostrar los detalles completos de la reserva
2. WHEN un cliente proporciona un código de reserva inexistente THEN el Sistema_Reservas SHALL indicar que la reserva no fue encontrada
3. WHEN un cliente consulta una reserva THEN el Sistema_Reservas SHALL mostrar fecha, hora, número de comensales, mesa asignada y estado de la reserva

### Requisito 3: Modificar Reserva

**Historia de Usuario:** Como cliente, quiero modificar mi reserva existente, para ajustar la fecha, hora o número de comensales según mis necesidades.

#### Criterios de Aceptación

1. WHEN un cliente solicita modificar una reserva existente THEN el Sistema_Reservas SHALL permitir cambiar fecha, hora o número de comensales
2. WHEN un cliente modifica una reserva y la nueva configuración está disponible THEN el Sistema_Reservas SHALL actualizar la reserva y enviar confirmación
3. WHEN un cliente intenta modificar una reserva a una configuración no disponible THEN el Sistema_Reservas SHALL rechazar el cambio y mostrar alternativas
4. IF un cliente intenta modificar una reserva con menos de 2 horas de anticipación THEN el Sistema_Reservas SHALL rechazar la modificación e indicar el motivo

### Requisito 4: Cancelar Reserva

**Historia de Usuario:** Como cliente, quiero cancelar mi reserva, para liberar la mesa si no puedo asistir.

#### Criterios de Aceptación

1. WHEN un cliente solicita cancelar una reserva existente THEN el Sistema_Reservas SHALL cancelar la reserva y enviar confirmación de cancelación
2. WHEN una reserva es cancelada THEN el Sistema_Reservas SHALL liberar la mesa para que esté disponible para otras reservas
3. IF un cliente intenta cancelar una reserva con menos de 1 hora de anticipación THEN el Sistema_Reservas SHALL permitir la cancelación pero registrar una penalización

### Requisito 5: Gestionar Mesas

**Historia de Usuario:** Como administrador, quiero gestionar las mesas del restaurante, para mantener actualizada la configuración del local.

#### Criterios de Aceptación

1. WHEN un administrador añade una nueva mesa THEN el Sistema_Reservas SHALL registrar la mesa con su número identificador y capacidad
2. WHEN un administrador modifica una mesa existente THEN el Sistema_Reservas SHALL actualizar la información de la mesa
3. WHEN un administrador elimina una mesa THEN el Sistema_Reservas SHALL verificar que no tenga reservas futuras antes de eliminarla
4. IF un administrador intenta eliminar una mesa con reservas futuras THEN el Sistema_Reservas SHALL rechazar la eliminación e indicar las reservas afectadas

### Requisito 6: Gestionar Disponibilidad

**Historia de Usuario:** Como administrador, quiero configurar los horarios de disponibilidad del restaurante, para controlar cuándo se pueden realizar reservas.

#### Criterios de Aceptación

1. WHEN un administrador configura el horario de apertura THEN el Sistema_Reservas SHALL permitir reservas solo dentro de ese horario
2. WHEN un administrador marca un día como cerrado THEN el Sistema_Reservas SHALL bloquear todas las reservas para ese día
3. WHEN un administrador configura franjas horarias especiales THEN el Sistema_Reservas SHALL aplicar esas restricciones a las nuevas reservas

### Requisito 7: Ver Panel de Reservas

**Historia de Usuario:** Como administrador, quiero ver todas las reservas del día, para organizar el servicio del restaurante.

#### Criterios de Aceptación

1. WHEN un administrador accede al panel de reservas THEN el Sistema_Reservas SHALL mostrar todas las reservas del día actual ordenadas por hora
2. WHEN un administrador selecciona una fecha específica THEN el Sistema_Reservas SHALL mostrar las reservas de esa fecha
3. WHEN un administrador filtra por estado de reserva THEN el Sistema_Reservas SHALL mostrar solo las reservas que coincidan con el filtro
4. THE Sistema_Reservas SHALL mostrar para cada reserva: hora, mesa, número de comensales, nombre del cliente y estado

### Requisito 8: Persistencia de Datos

**Historia de Usuario:** Como sistema, quiero almacenar todas las reservas y configuraciones de forma persistente, para mantener la información disponible entre sesiones.

#### Criterios de Aceptación

1. WHEN una reserva es creada, modificada o cancelada THEN el Sistema_Reservas SHALL persistir los cambios inmediatamente
2. WHEN el sistema se reinicia THEN el Sistema_Reservas SHALL recuperar todas las reservas y configuraciones existentes
3. THE Sistema_Reservas SHALL almacenar los datos de reservas en formato estructurado para permitir consultas eficientes
