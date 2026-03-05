# Plan de Implementación: Reservas Restaurante

## Descripción General

Implementación del sistema de reservas para "El Rinconcito de Anaga" usando TypeScript con Node.js, Express para la API REST, y SQLite para persistencia.

## Tareas

- [x] 1. Configurar estructura del proyecto
  - Inicializar proyecto Node.js con TypeScript
  - Configurar ESLint y Prettier
  - Instalar dependencias: express, sqlite3, fast-check (testing)
  - Crear estructura de carpetas: src/models, src/services, src/routes, src/utils
  - _Requirements: 8.3_

- [ ] 2. Implementar modelos de datos y base de datos
  - [x] 2.1 Crear interfaces TypeScript para Mesa, Reserva, Horario, DiaCerrado
    - Definir tipos según el diseño
    - _Requirements: 8.3_
  
  - [x] 2.2 Implementar capa de persistencia SQLite
    - Crear esquema de base de datos con tablas: mesas, reservas, horarios, dias_cerrados
    - Implementar funciones de inicialización de BD
    - _Requirements: 8.1, 8.2_
  
  - [ ]* 2.3 Escribir property test para round-trip de reserva
    - **Property 2: Round-trip de reserva**
    - **Validates: Requirements 1.2, 2.1, 2.3, 8.1**

- [ ] 3. Implementar servicio de mesas
  - [x] 3.1 Implementar MesaService con operaciones CRUD
    - listarMesas(), crearMesa(), modificarMesa(), eliminarMesa()
    - _Requirements: 5.1, 5.2_
  
  - [x] 3.2 Implementar consultarDisponibles(fecha, hora, comensales)
    - Filtrar mesas por capacidad y disponibilidad
    - _Requirements: 1.1_
  
  - [ ]* 3.3 Escribir property test para mesas disponibles
    - **Property 1: Mesas disponibles cumplen capacidad requerida**
    - **Validates: Requirements 1.1**
  
  - [ ]* 3.4 Escribir property test para gestión de mesas con reservas
    - **Property 9: Gestión de mesas con reservas**
    - **Validates: Requirements 5.3, 5.4**

- [ ] 4. Implementar servicio de disponibilidad
  - [x] 4.1 Implementar DisponibilidadService
    - consultarDisponibilidad(), configurarHorario(), marcarDiaCerrado()
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 4.2 Implementar validación de horarios y días cerrados
    - Verificar que fecha/hora está dentro del horario de apertura
    - Verificar que el día no está marcado como cerrado
    - _Requirements: 6.1, 6.2_
  
  - [ ]* 4.3 Escribir property test para restricciones de disponibilidad
    - **Property 10: Restricciones de disponibilidad**
    - **Validates: Requirements 6.1, 6.2**

- [x] 5. Checkpoint - Verificar servicios base
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implementar servicio de reservas
  - [x] 6.1 Implementar función generarCodigoReserva()
    - Generar código único de 8 caracteres alfanuméricos
    - _Requirements: 1.2_
  
  - [x] 6.2 Implementar crearReserva(datos)
    - Validar datos de cliente (nombre, teléfono, email)
    - Validar fecha no sea pasada
    - Verificar disponibilidad de mesa
    - Crear reserva y persistir
    - _Requirements: 1.2, 1.3, 1.4, 1.5_
  
  - [x] 6.3 Implementar consultarReserva(codigo)
    - Buscar reserva por código
    - Retornar detalles completos o error si no existe
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 6.4 Implementar modificarReserva(codigo, cambios)
    - Validar que la reserva existe
    - Validar anticipación mínima de 2 horas
    - Verificar disponibilidad de nueva configuración
    - Actualizar reserva
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 6.5 Implementar cancelarReserva(codigo)
    - Validar que la reserva existe
    - Cambiar estado a cancelada
    - Registrar penalización si es con menos de 1 hora
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 6.6 Implementar listarReservas(filtros)
    - Filtrar por fecha y/o estado
    - Ordenar por hora ascendente
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ]* 6.7 Escribir property test para conflicto de reservas
    - **Property 3: Conflicto de reservas**
    - **Validates: Requirements 1.3**
  
  - [ ]* 6.8 Escribir property test para validación de datos de cliente
    - **Property 4: Validación de datos de cliente**
    - **Validates: Requirements 1.4**
  
  - [ ]* 6.9 Escribir property test para validación de fechas pasadas
    - **Property 5: Validación de fechas pasadas**
    - **Validates: Requirements 1.5**
  
  - [ ]* 6.10 Escribir property test para código inexistente
    - **Property 6: Código inexistente retorna error**
    - **Validates: Requirements 2.2**
  
  - [ ]* 6.11 Escribir property test para modificación de reserva
    - **Property 7: Modificación de reserva preserva integridad**
    - **Validates: Requirements 3.1, 3.2, 3.3**
  
  - [ ]* 6.12 Escribir property test para cancelación libera mesa
    - **Property 8: Cancelación libera mesa**
    - **Validates: Requirements 4.1, 4.2**
  
  - [ ]* 6.13 Escribir property test para filtrado de reservas
    - **Property 11: Filtrado y ordenamiento de reservas**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [x] 7. Checkpoint - Verificar servicio de reservas
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implementar API REST
  - [x] 8.1 Configurar Express y middleware
    - Configurar JSON parser, CORS, manejo de errores
    - _Requirements: N/A (infraestructura)_
  
  - [x] 8.2 Implementar rutas de reservas
    - POST /api/reservas, GET /api/reservas/:codigo, PUT /api/reservas/:codigo, DELETE /api/reservas/:codigo, GET /api/reservas
    - _Requirements: 1.2, 2.1, 3.1, 4.1, 7.1_
  
  - [x] 8.3 Implementar rutas de mesas
    - GET /api/mesas, GET /api/mesas/disponibles, POST /api/mesas, PUT /api/mesas/:id, DELETE /api/mesas/:id
    - _Requirements: 1.1, 5.1, 5.2, 5.3_
  
  - [x] 8.4 Implementar rutas de disponibilidad
    - GET /api/disponibilidad/:fecha, PUT /api/disponibilidad/horario, POST /api/disponibilidad/cierre
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ]* 8.5 Escribir tests de integración para endpoints
    - Verificar respuestas de API
    - Verificar códigos de error
    - _Requirements: 1.2, 2.2, 5.4_

- [ ] 9. Implementar manejo de errores
  - [x] 9.1 Crear clase de errores personalizados
    - Implementar códigos de error según diseño
    - _Requirements: 1.3, 1.4, 1.5, 2.2, 5.4_
  
  - [x] 9.2 Implementar middleware de manejo de errores
    - Formatear respuestas de error según diseño
    - Incluir alternativas cuando aplique
    - _Requirements: 1.3_

- [x] 10. Checkpoint final
  - Ensure all tests pass, ask the user if questions arise.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los property tests validan propiedades universales de correctitud
- Los tests unitarios validan ejemplos específicos y casos edge
