/**
 * Tests unitarios para ReservaService
 * 
 * Requirements: 1.2, 1.3, 1.4, 1.5
 */

import { ReservaService, ReservaError, CodigoError } from './ReservaService';
import { MesaService } from './MesaService';
import { DisponibilidadService } from './DisponibilidadService';
import { createInMemoryDatabase } from '../database/db';
import { DatosReserva, DatosCliente } from '../models/types';
import Database from 'better-sqlite3';

describe('ReservaService', () => {
  let db: Database.Database;
  let reservaService: ReservaService;
  let mesaService: MesaService;
  let disponibilidadService: DisponibilidadService;

  // Helper para crear una fecha futura válida
  const crearFechaFutura = (diasAdelante: number = 7): Date => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + diasAdelante);
    return fecha;
  };

  // Helper para obtener el día de la semana de una fecha
  const getDiaSemana = (fecha: Date): number => fecha.getDay();

  // Datos de cliente válidos
  const clienteValido: DatosCliente = {
    nombre: 'Juan Pérez',
    telefono: '612345678',
    email: 'juan@example.com',
  };

  beforeEach(() => {
    db = createInMemoryDatabase();
    reservaService = new ReservaService(db);
    mesaService = new MesaService(db);
    disponibilidadService = new DisponibilidadService(db);

    // Crear mesas de prueba
    mesaService.crearMesa({ numero: 1, capacidad: 2 });
    mesaService.crearMesa({ numero: 2, capacidad: 4 });
    mesaService.crearMesa({ numero: 3, capacidad: 6 });
  });

  afterEach(() => {
    db.close();
  });


  describe('crearReserva', () => {
    describe('Validación de datos del cliente (Req 1.4)', () => {
      it('debe rechazar reserva sin nombre', () => {
        const fechaFutura = crearFechaFutura();
        disponibilidadService.configurarHorario({
          diaSemana: getDiaSemana(fechaFutura),
          horaApertura: '12:00',
          horaCierre: '23:00',
          activo: true,
        });

        const datos: DatosReserva = {
          fecha: fechaFutura,
          hora: '14:00',
          comensales: 2,
          cliente: { nombre: '', telefono: '612345678', email: 'test@test.com' },
        };

        expect(() => reservaService.crearReserva(datos)).toThrow(ReservaError);
        try {
          reservaService.crearReserva(datos);
        } catch (error) {
          expect(error).toBeInstanceOf(ReservaError);
          expect((error as ReservaError).codigo).toBe(CodigoError.DATOS_INCOMPLETOS);
          expect((error as ReservaError).detalles?.nombre).toBeDefined();
        }
      });

      it('debe rechazar reserva sin teléfono', () => {
        const fechaFutura = crearFechaFutura();
        disponibilidadService.configurarHorario({
          diaSemana: getDiaSemana(fechaFutura),
          horaApertura: '12:00',
          horaCierre: '23:00',
          activo: true,
        });

        const datos: DatosReserva = {
          fecha: fechaFutura,
          hora: '14:00',
          comensales: 2,
          cliente: { nombre: 'Juan', telefono: '', email: 'test@test.com' },
        };

        expect(() => reservaService.crearReserva(datos)).toThrow(ReservaError);
        try {
          reservaService.crearReserva(datos);
        } catch (error) {
          expect((error as ReservaError).codigo).toBe(CodigoError.DATOS_INCOMPLETOS);
          expect((error as ReservaError).detalles?.telefono).toBeDefined();
        }
      });

      it('debe rechazar reserva sin email', () => {
        const fechaFutura = crearFechaFutura();
        disponibilidadService.configurarHorario({
          diaSemana: getDiaSemana(fechaFutura),
          horaApertura: '12:00',
          horaCierre: '23:00',
          activo: true,
        });

        const datos: DatosReserva = {
          fecha: fechaFutura,
          hora: '14:00',
          comensales: 2,
          cliente: { nombre: 'Juan', telefono: '612345678', email: '' },
        };

        expect(() => reservaService.crearReserva(datos)).toThrow(ReservaError);
        try {
          reservaService.crearReserva(datos);
        } catch (error) {
          expect((error as ReservaError).codigo).toBe(CodigoError.DATOS_INCOMPLETOS);
          expect((error as ReservaError).detalles?.email).toBeDefined();
        }
      });

      it('debe indicar todos los campos faltantes', () => {
        const fechaFutura = crearFechaFutura();
        const datos: DatosReserva = {
          fecha: fechaFutura,
          hora: '14:00',
          comensales: 2,
          cliente: { nombre: '', telefono: '', email: '' },
        };

        try {
          reservaService.crearReserva(datos);
        } catch (error) {
          expect((error as ReservaError).detalles?.nombre).toBeDefined();
          expect((error as ReservaError).detalles?.telefono).toBeDefined();
          expect((error as ReservaError).detalles?.email).toBeDefined();
        }
      });
    });


    describe('Validación de fecha (Req 1.5)', () => {
      it('debe rechazar reserva con fecha pasada', () => {
        const fechaPasada = new Date();
        fechaPasada.setDate(fechaPasada.getDate() - 1);

        const datos: DatosReserva = {
          fecha: fechaPasada,
          hora: '14:00',
          comensales: 2,
          cliente: clienteValido,
        };

        expect(() => reservaService.crearReserva(datos)).toThrow(ReservaError);
        try {
          reservaService.crearReserva(datos);
        } catch (error) {
          expect((error as ReservaError).codigo).toBe(CodigoError.FECHA_INVALIDA);
        }
      });

      it('debe aceptar reserva para hoy', () => {
        const hoy = new Date();
        disponibilidadService.configurarHorario({
          diaSemana: getDiaSemana(hoy),
          horaApertura: '00:00',
          horaCierre: '23:59',
          activo: true,
        });

        const datos: DatosReserva = {
          fecha: hoy,
          hora: '14:00',
          comensales: 2,
          cliente: clienteValido,
        };

        const reserva = reservaService.crearReserva(datos);
        expect(reserva).toBeDefined();
        expect(reserva.codigo).toHaveLength(8);
      });
    });

    describe('Validación de disponibilidad (Req 6.1, 6.2)', () => {
      it('debe rechazar reserva en día cerrado', () => {
        const fechaFutura = crearFechaFutura();
        disponibilidadService.marcarDiaCerrado(fechaFutura, 'Festivo');

        const datos: DatosReserva = {
          fecha: fechaFutura,
          hora: '14:00',
          comensales: 2,
          cliente: clienteValido,
        };

        expect(() => reservaService.crearReserva(datos)).toThrow(ReservaError);
        try {
          reservaService.crearReserva(datos);
        } catch (error) {
          expect((error as ReservaError).codigo).toBe(CodigoError.DIA_CERRADO);
        }
      });

      it('debe rechazar reserva fuera del horario de apertura', () => {
        const fechaFutura = crearFechaFutura();
        disponibilidadService.configurarHorario({
          diaSemana: getDiaSemana(fechaFutura),
          horaApertura: '12:00',
          horaCierre: '22:00',
          activo: true,
        });

        const datos: DatosReserva = {
          fecha: fechaFutura,
          hora: '23:00', // Fuera del horario
          comensales: 2,
          cliente: clienteValido,
        };

        expect(() => reservaService.crearReserva(datos)).toThrow(ReservaError);
        try {
          reservaService.crearReserva(datos);
        } catch (error) {
          expect((error as ReservaError).codigo).toBe(CodigoError.FUERA_DE_HORARIO);
        }
      });

      it('debe rechazar reserva antes del horario de apertura', () => {
        const fechaFutura = crearFechaFutura();
        disponibilidadService.configurarHorario({
          diaSemana: getDiaSemana(fechaFutura),
          horaApertura: '12:00',
          horaCierre: '22:00',
          activo: true,
        });

        const datos: DatosReserva = {
          fecha: fechaFutura,
          hora: '10:00', // Antes de apertura
          comensales: 2,
          cliente: clienteValido,
        };

        expect(() => reservaService.crearReserva(datos)).toThrow(ReservaError);
        try {
          reservaService.crearReserva(datos);
        } catch (error) {
          expect((error as ReservaError).codigo).toBe(CodigoError.FUERA_DE_HORARIO);
        }
      });
    });


    describe('Asignación de mesa (Req 1.1, 1.3)', () => {
      it('debe asignar automáticamente una mesa con capacidad suficiente', () => {
        const fechaFutura = crearFechaFutura();
        disponibilidadService.configurarHorario({
          diaSemana: getDiaSemana(fechaFutura),
          horaApertura: '12:00',
          horaCierre: '23:00',
          activo: true,
        });

        const datos: DatosReserva = {
          fecha: fechaFutura,
          hora: '14:00',
          comensales: 3,
          cliente: clienteValido,
        };

        const reserva = reservaService.crearReserva(datos);
        expect(reserva).toBeDefined();
        expect(reserva.mesaId).toBeDefined();
        
        // Verificar que la mesa asignada tiene capacidad suficiente
        const mesas = mesaService.listarMesas();
        const mesaAsignada = mesas.find(m => m.id === reserva.mesaId);
        expect(mesaAsignada?.capacidad).toBeGreaterThanOrEqual(3);
      });

      it('debe rechazar si no hay mesas con capacidad suficiente', () => {
        const fechaFutura = crearFechaFutura();
        disponibilidadService.configurarHorario({
          diaSemana: getDiaSemana(fechaFutura),
          horaApertura: '12:00',
          horaCierre: '23:00',
          activo: true,
        });

        const datos: DatosReserva = {
          fecha: fechaFutura,
          hora: '14:00',
          comensales: 10, // Más que cualquier mesa
          cliente: clienteValido,
        };

        expect(() => reservaService.crearReserva(datos)).toThrow(ReservaError);
        try {
          reservaService.crearReserva(datos);
        } catch (error) {
          expect((error as ReservaError).codigo).toBe(CodigoError.CAPACIDAD_INSUFICIENTE);
        }
      });

      it('debe permitir reservar mesa específica si está disponible', () => {
        const fechaFutura = crearFechaFutura();
        disponibilidadService.configurarHorario({
          diaSemana: getDiaSemana(fechaFutura),
          horaApertura: '12:00',
          horaCierre: '23:00',
          activo: true,
        });

        const mesas = mesaService.listarMesas();
        const mesaEspecifica = mesas.find(m => m.capacidad >= 4)!;

        const datos: DatosReserva = {
          fecha: fechaFutura,
          hora: '14:00',
          comensales: 3,
          cliente: clienteValido,
          mesaId: mesaEspecifica.id,
        };

        const reserva = reservaService.crearReserva(datos);
        expect(reserva.mesaId).toBe(mesaEspecifica.id);
      });

      it('debe rechazar mesa específica si ya está ocupada (Req 1.3)', () => {
        const fechaFutura = crearFechaFutura();
        disponibilidadService.configurarHorario({
          diaSemana: getDiaSemana(fechaFutura),
          horaApertura: '12:00',
          horaCierre: '23:00',
          activo: true,
        });

        const mesas = mesaService.listarMesas();
        const mesa = mesas[0];

        // Primera reserva
        const datos1: DatosReserva = {
          fecha: fechaFutura,
          hora: '14:00',
          comensales: 2,
          cliente: clienteValido,
          mesaId: mesa.id,
        };
        reservaService.crearReserva(datos1);

        // Segunda reserva para la misma mesa y hora
        const datos2: DatosReserva = {
          fecha: fechaFutura,
          hora: '14:00',
          comensales: 2,
          cliente: { nombre: 'María', telefono: '698765432', email: 'maria@test.com' },
          mesaId: mesa.id,
        };

        expect(() => reservaService.crearReserva(datos2)).toThrow(ReservaError);
        try {
          reservaService.crearReserva(datos2);
        } catch (error) {
          expect((error as ReservaError).codigo).toBe(CodigoError.MESA_NO_DISPONIBLE);
          // Debe ofrecer alternativas
          expect((error as ReservaError).alternativas).toBeDefined();
        }
      });
    });


    describe('Creación exitosa de reserva (Req 1.2)', () => {
      it('debe crear reserva con código único de 8 caracteres', () => {
        const fechaFutura = crearFechaFutura();
        disponibilidadService.configurarHorario({
          diaSemana: getDiaSemana(fechaFutura),
          horaApertura: '12:00',
          horaCierre: '23:00',
          activo: true,
        });

        const datos: DatosReserva = {
          fecha: fechaFutura,
          hora: '14:00',
          comensales: 2,
          cliente: clienteValido,
        };

        const reserva = reservaService.crearReserva(datos);
        
        expect(reserva.codigo).toHaveLength(8);
        expect(reserva.codigo).toMatch(/^[A-Z0-9]+$/);
      });

      it('debe persistir la reserva con todos los datos correctos', () => {
        const fechaFutura = crearFechaFutura();
        disponibilidadService.configurarHorario({
          diaSemana: getDiaSemana(fechaFutura),
          horaApertura: '12:00',
          horaCierre: '23:00',
          activo: true,
        });

        const datos: DatosReserva = {
          fecha: fechaFutura,
          hora: '14:00',
          comensales: 2,
          cliente: clienteValido,
        };

        const reserva = reservaService.crearReserva(datos);

        expect(reserva.hora).toBe('14:00');
        expect(reserva.comensales).toBe(2);
        expect(reserva.cliente.nombre).toBe(clienteValido.nombre);
        expect(reserva.cliente.telefono).toBe(clienteValido.telefono);
        expect(reserva.cliente.email).toBe(clienteValido.email);
        expect(reserva.estado).toBe('pendiente');
        expect(reserva.creadaEn).toBeInstanceOf(Date);
        expect(reserva.modificadaEn).toBeInstanceOf(Date);
      });

      it('debe generar códigos únicos para múltiples reservas', () => {
        const fechaFutura = crearFechaFutura();
        disponibilidadService.configurarHorario({
          diaSemana: getDiaSemana(fechaFutura),
          horaApertura: '12:00',
          horaCierre: '23:00',
          activo: true,
        });

        const codigos = new Set<string>();

        // Crear varias reservas en diferentes horas
        for (let i = 0; i < 5; i++) {
          const datos: DatosReserva = {
            fecha: fechaFutura,
            hora: `${14 + i}:00`,
            comensales: 2,
            cliente: {
              nombre: `Cliente ${i}`,
              telefono: `61234567${i}`,
              email: `cliente${i}@test.com`,
            },
          };

          const reserva = reservaService.crearReserva(datos);
          codigos.add(reserva.codigo);
        }

        // Todos los códigos deben ser únicos
        expect(codigos.size).toBe(5);
      });
    });
  });


  describe('consultarReserva', () => {
    describe('Consulta exitosa (Req 2.1, 2.3)', () => {
      it('debe retornar todos los detalles de una reserva existente', () => {
        const fechaFutura = crearFechaFutura();
        disponibilidadService.configurarHorario({
          diaSemana: getDiaSemana(fechaFutura),
          horaApertura: '12:00',
          horaCierre: '23:00',
          activo: true,
        });

        // Crear una reserva
        const datos: DatosReserva = {
          fecha: fechaFutura,
          hora: '14:00',
          comensales: 2,
          cliente: clienteValido,
        };
        const reservaCreada = reservaService.crearReserva(datos);

        // Consultar la reserva
        const reservaConsultada = reservaService.consultarReserva(reservaCreada.codigo);

        // Verificar todos los detalles
        expect(reservaConsultada.codigo).toBe(reservaCreada.codigo);
        expect(reservaConsultada.mesaId).toBe(reservaCreada.mesaId);
        expect(reservaConsultada.hora).toBe('14:00');
        expect(reservaConsultada.comensales).toBe(2);
        expect(reservaConsultada.cliente.nombre).toBe(clienteValido.nombre);
        expect(reservaConsultada.cliente.telefono).toBe(clienteValido.telefono);
        expect(reservaConsultada.cliente.email).toBe(clienteValido.email);
        expect(reservaConsultada.estado).toBe('pendiente');
      });

      it('debe retornar fecha, hora, comensales, mesa y estado (Req 2.3)', () => {
        const fechaFutura = crearFechaFutura();
        disponibilidadService.configurarHorario({
          diaSemana: getDiaSemana(fechaFutura),
          horaApertura: '12:00',
          horaCierre: '23:00',
          activo: true,
        });

        const datos: DatosReserva = {
          fecha: fechaFutura,
          hora: '19:30',
          comensales: 4,
          cliente: clienteValido,
        };
        const reservaCreada = reservaService.crearReserva(datos);

        const reservaConsultada = reservaService.consultarReserva(reservaCreada.codigo);

        // Verificar que todos los campos requeridos por 2.3 están presentes
        expect(reservaConsultada.fecha).toBeInstanceOf(Date);
        expect(reservaConsultada.hora).toBe('19:30');
        expect(reservaConsultada.comensales).toBe(4);
        expect(reservaConsultada.mesaId).toBeDefined();
        expect(reservaConsultada.estado).toBeDefined();
      });
    });


    describe('Código inexistente (Req 2.2)', () => {
      it('debe lanzar error RESERVA_NO_ENCONTRADA para código inexistente', () => {
        expect(() => reservaService.consultarReserva('NOEXISTE')).toThrow(ReservaError);
        
        try {
          reservaService.consultarReserva('NOEXISTE');
        } catch (error) {
          expect(error).toBeInstanceOf(ReservaError);
          expect((error as ReservaError).codigo).toBe(CodigoError.RESERVA_NO_ENCONTRADA);
        }
      });

      it('debe incluir el código buscado en el mensaje de error', () => {
        const codigoInexistente = 'ABC12345';
        
        try {
          reservaService.consultarReserva(codigoInexistente);
        } catch (error) {
          expect((error as ReservaError).message).toContain(codigoInexistente);
        }
      });

      it('debe lanzar error para código vacío', () => {
        expect(() => reservaService.consultarReserva('')).toThrow(ReservaError);
        
        try {
          reservaService.consultarReserva('');
        } catch (error) {
          expect((error as ReservaError).codigo).toBe(CodigoError.RESERVA_NO_ENCONTRADA);
        }
      });
    });
  });

  describe('modificarReserva', () => {
    // Helper para crear una reserva de prueba con anticipación suficiente
    const crearReservaDePruebaModificar = (diasAdelante: number = 7, hora: string = '14:00') => {
      const fechaFutura = crearFechaFutura(diasAdelante);
      disponibilidadService.configurarHorario({
        diaSemana: getDiaSemana(fechaFutura),
        horaApertura: '12:00',
        horaCierre: '23:00',
        activo: true,
      });

      const datos: DatosReserva = {
        fecha: fechaFutura,
        hora,
        comensales: 2,
        cliente: clienteValido,
      };

      return reservaService.crearReserva(datos);
    };

    describe('Validación de existencia (Req 3.1)', () => {
      it('debe lanzar error si la reserva no existe', () => {
        expect(() => reservaService.modificarReserva('NOEXISTE', { comensales: 4 })).toThrow(ReservaError);
        
        try {
          reservaService.modificarReserva('NOEXISTE', { comensales: 4 });
        } catch (error) {
          expect((error as ReservaError).codigo).toBe(CodigoError.RESERVA_NO_ENCONTRADA);
        }
      });
    });

    describe('Validación de anticipación mínima (Req 3.4)', () => {
      it('debe rechazar modificación con menos de 2 horas de anticipación', () => {
        // Crear una reserva para dentro de 1 hora
        const ahora = new Date();
        const fechaProxima = new Date(ahora);
        fechaProxima.setHours(ahora.getHours() + 1, 30, 0, 0);
        
        // Si la hora próxima cae en el día siguiente, ajustar
        const diaSemana = fechaProxima.getDay();
        disponibilidadService.configurarHorario({
          diaSemana,
          horaApertura: '00:00',
          horaCierre: '23:59',
          activo: true,
        });

        // Insertar reserva directamente en la BD para simular una reserva próxima
        const fechaStr = fechaProxima.toISOString().split('T')[0];
        const horaStr = `${String(fechaProxima.getHours()).padStart(2, '0')}:${String(fechaProxima.getMinutes()).padStart(2, '0')}`;
        
        const mesas = mesaService.listarMesas();
        const stmt = db.prepare(`
          INSERT INTO reservas (codigo, mesa_id, fecha, hora, comensales, nombre_cliente, telefono, email, estado, creada_en, modificada_en)
          VALUES ('TESTCODE', ?, ?, ?, 2, 'Test', '123456789', 'test@test.com', 'confirmada', datetime('now'), datetime('now'))
        `);
        stmt.run(mesas[0].id, fechaStr, horaStr);

        expect(() => reservaService.modificarReserva('TESTCODE', { comensales: 4 })).toThrow(ReservaError);
        
        try {
          reservaService.modificarReserva('TESTCODE', { comensales: 4 });
        } catch (error) {
          expect((error as ReservaError).codigo).toBe(CodigoError.MODIFICACION_TARDIA);
        }
      });

      it('debe permitir modificación con más de 2 horas de anticipación', () => {
        const reserva = crearReservaDePruebaModificar(7);
        
        // Cambiar solo la hora, no los comensales (la mesa tiene capacidad 2)
        const reservaModificada = reservaService.modificarReserva(reserva.codigo, { hora: '15:00' });
        
        expect(reservaModificada.hora).toBe('15:00');
      });
    });

    describe('Modificación de campos (Req 3.1, 3.2)', () => {
      it('debe permitir cambiar el número de comensales', () => {
        // Crear reserva con mesa de mayor capacidad
        const fechaFutura = crearFechaFutura(7);
        disponibilidadService.configurarHorario({
          diaSemana: getDiaSemana(fechaFutura),
          horaApertura: '12:00',
          horaCierre: '23:00',
          activo: true,
        });
        
        // Crear reserva para 2 personas en mesa de 6
        const mesas = mesaService.listarMesas();
        const mesaGrande = mesas.find((m) => m.capacidad >= 6)!;
        
        const reserva = reservaService.crearReserva({
          fecha: fechaFutura,
          hora: '14:00',
          comensales: 2,
          cliente: clienteValido,
          mesaId: mesaGrande.id,
        });
        
        // Ahora podemos aumentar comensales hasta 6
        const reservaModificada = reservaService.modificarReserva(reserva.codigo, { comensales: 5 });
        
        expect(reservaModificada.comensales).toBe(5);
        expect(reservaModificada.codigo).toBe(reserva.codigo);
      });

      it('debe permitir cambiar la hora', () => {
        const reserva = crearReservaDePruebaModificar();
        
        const reservaModificada = reservaService.modificarReserva(reserva.codigo, { hora: '20:00' });
        
        expect(reservaModificada.hora).toBe('20:00');
      });

      it('debe permitir cambiar la fecha', () => {
        const reserva = crearReservaDePruebaModificar();
        const nuevaFecha = crearFechaFutura(14);
        
        // Configurar horario para el nuevo día
        disponibilidadService.configurarHorario({
          diaSemana: getDiaSemana(nuevaFecha),
          horaApertura: '12:00',
          horaCierre: '23:00',
          activo: true,
        });
        
        const reservaModificada = reservaService.modificarReserva(reserva.codigo, { fecha: nuevaFecha });
        
        expect(reservaModificada.fecha.toISOString().split('T')[0]).toBe(nuevaFecha.toISOString().split('T')[0]);
      });

      it('debe permitir cambiar la mesa', () => {
        const reserva = crearReservaDePruebaModificar();
        const mesas = mesaService.listarMesas();
        const otraMesa = mesas.find((m) => m.id !== reserva.mesaId && m.capacidad >= 2)!;
        
        const reservaModificada = reservaService.modificarReserva(reserva.codigo, { mesaId: otraMesa.id });
        
        expect(reservaModificada.mesaId).toBe(otraMesa.id);
      });

      it('debe actualizar la fecha de modificación', () => {
        const reserva = crearReservaDePruebaModificar();
        const fechaModificacionOriginal = reserva.modificadaEn;
        
        // Cambiar solo la hora, no los comensales
        const reservaModificada = reservaService.modificarReserva(reserva.codigo, { hora: '16:00' });
        
        expect(reservaModificada.modificadaEn.getTime()).toBeGreaterThanOrEqual(fechaModificacionOriginal.getTime());
      });

      it('debe mantener los datos no modificados', () => {
        const reserva = crearReservaDePruebaModificar();
        
        // Cambiar solo la hora
        const reservaModificada = reservaService.modificarReserva(reserva.codigo, { hora: '17:00' });
        
        expect(reservaModificada.comensales).toBe(reserva.comensales);
        expect(reservaModificada.mesaId).toBe(reserva.mesaId);
        expect(reservaModificada.cliente).toEqual(reserva.cliente);
        expect(reservaModificada.estado).toBe(reserva.estado);
      });
    });

    describe('Verificación de disponibilidad (Req 3.3)', () => {
      it('debe rechazar si la nueva configuración no está disponible', () => {
        const fechaFutura = crearFechaFutura(7);
        disponibilidadService.configurarHorario({
          diaSemana: getDiaSemana(fechaFutura),
          horaApertura: '12:00',
          horaCierre: '23:00',
          activo: true,
        });

        const mesas = mesaService.listarMesas();
        
        // Crear primera reserva
        reservaService.crearReserva({
          fecha: fechaFutura,
          hora: '14:00',
          comensales: 2,
          cliente: clienteValido,
          mesaId: mesas[0].id,
        });

        // Crear segunda reserva en otra mesa
        const reserva2 = reservaService.crearReserva({
          fecha: fechaFutura,
          hora: '16:00',
          comensales: 2,
          cliente: { nombre: 'María', telefono: '698765432', email: 'maria@test.com' },
          mesaId: mesas[1].id,
        });

        // Intentar modificar la segunda reserva para usar la mesa de la primera en la misma hora
        expect(() => reservaService.modificarReserva(reserva2.codigo, { 
          mesaId: mesas[0].id, 
          hora: '14:00' 
        })).toThrow(ReservaError);
        
        try {
          reservaService.modificarReserva(reserva2.codigo, { mesaId: mesas[0].id, hora: '14:00' });
        } catch (error) {
          expect((error as ReservaError).codigo).toBe(CodigoError.MESA_NO_DISPONIBLE);
        }
      });

      it('debe permitir modificar a la misma mesa en diferente hora', () => {
        const reserva = crearReservaDePruebaModificar();
        
        const reservaModificada = reservaService.modificarReserva(reserva.codigo, { hora: '18:00' });
        
        expect(reservaModificada.hora).toBe('18:00');
        expect(reservaModificada.mesaId).toBe(reserva.mesaId);
      });

      it('debe rechazar si la nueva fecha está en día cerrado', () => {
        const reserva = crearReservaDePruebaModificar();
        const fechaCerrada = crearFechaFutura(10);
        disponibilidadService.marcarDiaCerrado(fechaCerrada, 'Festivo');
        
        expect(() => reservaService.modificarReserva(reserva.codigo, { fecha: fechaCerrada })).toThrow(ReservaError);
        
        try {
          reservaService.modificarReserva(reserva.codigo, { fecha: fechaCerrada });
        } catch (error) {
          expect((error as ReservaError).codigo).toBe(CodigoError.DIA_CERRADO);
        }
      });

      it('debe rechazar si la nueva hora está fuera del horario', () => {
        const reserva = crearReservaDePruebaModificar();
        
        expect(() => reservaService.modificarReserva(reserva.codigo, { hora: '23:30' })).toThrow(ReservaError);
        
        try {
          reservaService.modificarReserva(reserva.codigo, { hora: '23:30' });
        } catch (error) {
          expect((error as ReservaError).codigo).toBe(CodigoError.FUERA_DE_HORARIO);
        }
      });

      it('debe rechazar si la nueva mesa no tiene capacidad suficiente', () => {
        const fechaFutura = crearFechaFutura(7);
        disponibilidadService.configurarHorario({
          diaSemana: getDiaSemana(fechaFutura),
          horaApertura: '12:00',
          horaCierre: '23:00',
          activo: true,
        });

        // Crear reserva para 4 personas
        const reserva = reservaService.crearReserva({
          fecha: fechaFutura,
          hora: '14:00',
          comensales: 4,
          cliente: clienteValido,
        });

        // Buscar mesa con capacidad insuficiente
        const mesas = mesaService.listarMesas();
        const mesaPequena = mesas.find((m) => m.capacidad < 4);
        
        if (mesaPequena) {
          expect(() => reservaService.modificarReserva(reserva.codigo, { mesaId: mesaPequena.id })).toThrow(ReservaError);
          
          try {
            reservaService.modificarReserva(reserva.codigo, { mesaId: mesaPequena.id });
          } catch (error) {
            expect((error as ReservaError).codigo).toBe(CodigoError.CAPACIDAD_INSUFICIENTE);
          }
        }
      });
    });

    describe('Persistencia de cambios (Req 3.2)', () => {
      it('debe persistir los cambios en la base de datos', () => {
        // Crear reserva con mesa de mayor capacidad
        const fechaFutura = crearFechaFutura(7);
        disponibilidadService.configurarHorario({
          diaSemana: getDiaSemana(fechaFutura),
          horaApertura: '12:00',
          horaCierre: '23:00',
          activo: true,
        });
        
        const mesas = mesaService.listarMesas();
        const mesaGrande = mesas.find((m) => m.capacidad >= 6)!;
        
        const reserva = reservaService.crearReserva({
          fecha: fechaFutura,
          hora: '14:00',
          comensales: 2,
          cliente: clienteValido,
          mesaId: mesaGrande.id,
        });
        
        reservaService.modificarReserva(reserva.codigo, { comensales: 5, hora: '19:00' });
        
        // Consultar la reserva nuevamente para verificar persistencia
        const reservaConsultada = reservaService.consultarReserva(reserva.codigo);
        
        expect(reservaConsultada.comensales).toBe(5);
        expect(reservaConsultada.hora).toBe('19:00');
      });
    });
  });

  describe('cancelarReserva', () => {
    // Helper para crear una reserva de prueba
    const crearReservaDePrueba = (diasAdelante: number = 7, hora: string = '14:00') => {
      const fechaFutura = crearFechaFutura(diasAdelante);
      disponibilidadService.configurarHorario({
        diaSemana: getDiaSemana(fechaFutura),
        horaApertura: '12:00',
        horaCierre: '23:00',
        activo: true,
      });

      const datos: DatosReserva = {
        fecha: fechaFutura,
        hora,
        comensales: 2,
        cliente: clienteValido,
      };

      return reservaService.crearReserva(datos);
    };

    describe('Validación de existencia (Req 4.1)', () => {
      it('debe lanzar error si la reserva no existe', () => {
        expect(() => reservaService.cancelarReserva('NOEXISTE')).toThrow(ReservaError);
        
        try {
          reservaService.cancelarReserva('NOEXISTE');
        } catch (error) {
          expect((error as ReservaError).codigo).toBe(CodigoError.RESERVA_NO_ENCONTRADA);
        }
      });
    });

    describe('Cancelación exitosa (Req 4.1, 4.2)', () => {
      it('debe cancelar una reserva existente', () => {
        const reserva = crearReservaDePrueba();
        
        const resultado = reservaService.cancelarReserva(reserva.codigo);
        
        expect(resultado.exito).toBe(true);
        expect(resultado.mensaje).toContain('cancelada');
      });

      it('debe cambiar el estado de la reserva a cancelada', () => {
        const reserva = crearReservaDePrueba();
        
        reservaService.cancelarReserva(reserva.codigo);
        
        const reservaCancelada = reservaService.consultarReserva(reserva.codigo);
        expect(reservaCancelada.estado).toBe('cancelada');
      });

      it('debe liberar la mesa para otras reservas (Req 4.2)', () => {
        const fechaFutura = crearFechaFutura(7);
        disponibilidadService.configurarHorario({
          diaSemana: getDiaSemana(fechaFutura),
          horaApertura: '12:00',
          horaCierre: '23:00',
          activo: true,
        });

        const mesas = mesaService.listarMesas();
        const mesa = mesas[0];

        // Crear y cancelar una reserva
        const reserva1 = reservaService.crearReserva({
          fecha: fechaFutura,
          hora: '14:00',
          comensales: 2,
          cliente: clienteValido,
          mesaId: mesa.id,
        });
        
        reservaService.cancelarReserva(reserva1.codigo);

        // Ahora debería poder crear otra reserva para la misma mesa y hora
        const reserva2 = reservaService.crearReserva({
          fecha: fechaFutura,
          hora: '14:00',
          comensales: 2,
          cliente: { nombre: 'María', telefono: '698765432', email: 'maria@test.com' },
          mesaId: mesa.id,
        });

        expect(reserva2).toBeDefined();
        expect(reserva2.mesaId).toBe(mesa.id);
      });
    });

    describe('Penalización por cancelación tardía (Req 4.3)', () => {
      it('debe registrar penalización si cancela con menos de 1 hora de anticipación', () => {
        // Crear una reserva para dentro de 30 minutos
        const ahora = new Date();
        const fechaProxima = new Date(ahora);
        fechaProxima.setMinutes(ahora.getMinutes() + 30);
        
        const diaSemana = fechaProxima.getDay();
        disponibilidadService.configurarHorario({
          diaSemana,
          horaApertura: '00:00',
          horaCierre: '23:59',
          activo: true,
        });

        // Insertar reserva directamente en la BD para simular una reserva próxima
        const fechaStr = fechaProxima.toISOString().split('T')[0];
        const horaStr = `${String(fechaProxima.getHours()).padStart(2, '0')}:${String(fechaProxima.getMinutes()).padStart(2, '0')}`;
        
        const mesas = mesaService.listarMesas();
        const stmt = db.prepare(`
          INSERT INTO reservas (codigo, mesa_id, fecha, hora, comensales, nombre_cliente, telefono, email, estado, creada_en, modificada_en)
          VALUES ('TARDCODE', ?, ?, ?, 2, 'Test', '123456789', 'test@test.com', 'confirmada', datetime('now'), datetime('now'))
        `);
        stmt.run(mesas[0].id, fechaStr, horaStr);

        const resultado = reservaService.cancelarReserva('TARDCODE');
        
        expect(resultado.exito).toBe(true);
        expect(resultado.penalizacion).toBe(true);
        expect(resultado.mensaje).toContain('penalización');
      });

      it('no debe registrar penalización si cancela con más de 1 hora de anticipación', () => {
        const reserva = crearReservaDePrueba(7); // 7 días en el futuro
        
        const resultado = reservaService.cancelarReserva(reserva.codigo);
        
        expect(resultado.exito).toBe(true);
        expect(resultado.penalizacion).toBe(false);
        expect(resultado.mensaje).not.toContain('penalización');
      });

      it('debe permitir la cancelación aunque sea tardía', () => {
        // Crear una reserva para dentro de 30 minutos
        const ahora = new Date();
        const fechaProxima = new Date(ahora);
        fechaProxima.setMinutes(ahora.getMinutes() + 30);
        
        const diaSemana = fechaProxima.getDay();
        disponibilidadService.configurarHorario({
          diaSemana,
          horaApertura: '00:00',
          horaCierre: '23:59',
          activo: true,
        });

        const fechaStr = fechaProxima.toISOString().split('T')[0];
        const horaStr = `${String(fechaProxima.getHours()).padStart(2, '0')}:${String(fechaProxima.getMinutes()).padStart(2, '0')}`;
        
        const mesas = mesaService.listarMesas();
        const stmt = db.prepare(`
          INSERT INTO reservas (codigo, mesa_id, fecha, hora, comensales, nombre_cliente, telefono, email, estado, creada_en, modificada_en)
          VALUES ('LATECODE', ?, ?, ?, 2, 'Test', '123456789', 'test@test.com', 'confirmada', datetime('now'), datetime('now'))
        `);
        stmt.run(mesas[0].id, fechaStr, horaStr);

        // La cancelación debe ser exitosa aunque sea tardía
        const resultado = reservaService.cancelarReserva('LATECODE');
        
        expect(resultado.exito).toBe(true);
        
        // Verificar que el estado cambió a cancelada
        const reservaCancelada = reservaService.consultarReserva('LATECODE');
        expect(reservaCancelada.estado).toBe('cancelada');
      });
    });
  });

  describe('listarReservas', () => {
    // Helper para crear múltiples reservas de prueba
    const crearReservasDePrueba = () => {
      const fechaFutura = crearFechaFutura(7);
      const fechaFutura2 = crearFechaFutura(8);
      
      // Configurar horarios para ambos días
      disponibilidadService.configurarHorario({
        diaSemana: getDiaSemana(fechaFutura),
        horaApertura: '12:00',
        horaCierre: '23:00',
        activo: true,
      });
      disponibilidadService.configurarHorario({
        diaSemana: getDiaSemana(fechaFutura2),
        horaApertura: '12:00',
        horaCierre: '23:00',
        activo: true,
      });

      const mesas = mesaService.listarMesas();

      // Crear varias reservas con diferentes fechas, horas y estados
      const reserva1 = reservaService.crearReserva({
        fecha: fechaFutura,
        hora: '14:00',
        comensales: 2,
        cliente: { nombre: 'Cliente 1', telefono: '611111111', email: 'cliente1@test.com' },
        mesaId: mesas[0].id,
      });

      const reserva2 = reservaService.crearReserva({
        fecha: fechaFutura,
        hora: '18:00',
        comensales: 4,
        cliente: { nombre: 'Cliente 2', telefono: '622222222', email: 'cliente2@test.com' },
        mesaId: mesas[1].id,
      });

      const reserva3 = reservaService.crearReserva({
        fecha: fechaFutura,
        hora: '16:00',
        comensales: 2,
        cliente: { nombre: 'Cliente 3', telefono: '633333333', email: 'cliente3@test.com' },
        mesaId: mesas[2].id,
      });

      const reserva4 = reservaService.crearReserva({
        fecha: fechaFutura2,
        hora: '15:00',
        comensales: 2,
        cliente: { nombre: 'Cliente 4', telefono: '644444444', email: 'cliente4@test.com' },
        mesaId: mesas[0].id,
      });

      // Cancelar una reserva para tener diferentes estados
      reservaService.cancelarReserva(reserva3.codigo);

      return { fechaFutura, fechaFutura2, mesas, reserva1, reserva2, reserva3, reserva4 };
    };

    describe('Sin filtros (Req 7.1)', () => {
      it('debe retornar todas las reservas ordenadas por hora', () => {
        const { reserva1, reserva2, reserva3, reserva4 } = crearReservasDePrueba();
        
        const reservas = reservaService.listarReservas();
        
        expect(reservas.length).toBe(4);
        // Verificar que están ordenadas por hora
        for (let i = 1; i < reservas.length; i++) {
          expect(reservas[i].hora >= reservas[i - 1].hora).toBe(true);
        }
      });

      it('debe retornar lista vacía si no hay reservas', () => {
        const reservas = reservaService.listarReservas();
        
        expect(reservas).toEqual([]);
      });
    });

    describe('Filtro por fecha (Req 7.1, 7.2)', () => {
      it('debe filtrar reservas por fecha específica', () => {
        const { fechaFutura, reserva1, reserva2, reserva3 } = crearReservasDePrueba();
        
        const reservas = reservaService.listarReservas({ fecha: fechaFutura });
        
        expect(reservas.length).toBe(3);
        reservas.forEach(r => {
          expect(r.fecha.toISOString().split('T')[0]).toBe(fechaFutura.toISOString().split('T')[0]);
        });
      });

      it('debe retornar lista vacía si no hay reservas en la fecha', () => {
        crearReservasDePrueba();
        const fechaSinReservas = crearFechaFutura(30);
        
        const reservas = reservaService.listarReservas({ fecha: fechaSinReservas });
        
        expect(reservas).toEqual([]);
      });
    });

    describe('Filtro por estado (Req 7.3)', () => {
      it('debe filtrar reservas por estado pendiente', () => {
        crearReservasDePrueba();
        
        const reservas = reservaService.listarReservas({ estado: 'pendiente' });
        
        expect(reservas.length).toBe(3);
        reservas.forEach(r => {
          expect(r.estado).toBe('pendiente');
        });
      });

      it('debe filtrar reservas por estado cancelada', () => {
        crearReservasDePrueba();
        
        const reservas = reservaService.listarReservas({ estado: 'cancelada' });
        
        expect(reservas.length).toBe(1);
        expect(reservas[0].estado).toBe('cancelada');
      });
    });

    describe('Filtro por mesaId', () => {
      it('debe filtrar reservas por mesa específica', () => {
        const { mesas } = crearReservasDePrueba();
        
        const reservas = reservaService.listarReservas({ mesaId: mesas[0].id });
        
        expect(reservas.length).toBe(2);
        reservas.forEach(r => {
          expect(r.mesaId).toBe(mesas[0].id);
        });
      });
    });

    describe('Filtros combinados', () => {
      it('debe filtrar por fecha y estado', () => {
        const { fechaFutura } = crearReservasDePrueba();
        
        const reservas = reservaService.listarReservas({ 
          fecha: fechaFutura, 
          estado: 'pendiente' 
        });
        
        expect(reservas.length).toBe(2);
        reservas.forEach(r => {
          expect(r.fecha.toISOString().split('T')[0]).toBe(fechaFutura.toISOString().split('T')[0]);
          expect(r.estado).toBe('pendiente');
        });
      });

      it('debe filtrar por fecha, estado y mesaId', () => {
        const { fechaFutura, mesas } = crearReservasDePrueba();
        
        const reservas = reservaService.listarReservas({ 
          fecha: fechaFutura, 
          estado: 'pendiente',
          mesaId: mesas[0].id,
        });
        
        expect(reservas.length).toBe(1);
        expect(reservas[0].mesaId).toBe(mesas[0].id);
        expect(reservas[0].estado).toBe('pendiente');
      });
    });

    describe('Ordenamiento por hora (Req 7.1, 7.4)', () => {
      it('debe ordenar las reservas por hora ascendente', () => {
        const { fechaFutura } = crearReservasDePrueba();
        
        const reservas = reservaService.listarReservas({ fecha: fechaFutura });
        
        // Verificar orden ascendente por hora
        expect(reservas[0].hora).toBe('14:00');
        expect(reservas[1].hora).toBe('16:00');
        expect(reservas[2].hora).toBe('18:00');
      });
    });

    describe('Datos completos de reserva (Req 7.4)', () => {
      it('debe retornar todos los campos de cada reserva', () => {
        crearReservasDePrueba();
        
        const reservas = reservaService.listarReservas();
        
        reservas.forEach(r => {
          // Verificar que todos los campos requeridos están presentes
          expect(r.codigo).toBeDefined();
          expect(r.mesaId).toBeDefined();
          expect(r.fecha).toBeInstanceOf(Date);
          expect(r.hora).toBeDefined();
          expect(r.comensales).toBeDefined();
          expect(r.cliente).toBeDefined();
          expect(r.cliente.nombre).toBeDefined();
          expect(r.cliente.telefono).toBeDefined();
          expect(r.cliente.email).toBeDefined();
          expect(r.estado).toBeDefined();
          expect(r.creadaEn).toBeInstanceOf(Date);
          expect(r.modificadaEn).toBeInstanceOf(Date);
        });
      });
    });
  });
});