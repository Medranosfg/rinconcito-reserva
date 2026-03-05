/**
 * Tests unitarios para MesaService
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import { MesaService } from './MesaService';
import { createInMemoryDatabase } from '../database/db';
import Database from 'better-sqlite3';

describe('MesaService', () => {
  let db: Database.Database;
  let mesaService: MesaService;

  beforeEach(() => {
    db = createInMemoryDatabase();
    mesaService = new MesaService(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('listarMesas', () => {
    it('debe retornar lista vacía cuando no hay mesas', () => {
      const mesas = mesaService.listarMesas();
      expect(mesas).toEqual([]);
    });

    it('debe retornar todas las mesas ordenadas por número', () => {
      mesaService.crearMesa({ numero: 3, capacidad: 4 });
      mesaService.crearMesa({ numero: 1, capacidad: 2 });
      mesaService.crearMesa({ numero: 2, capacidad: 6 });

      const mesas = mesaService.listarMesas();

      expect(mesas).toHaveLength(3);
      expect(mesas[0].numero).toBe(1);
      expect(mesas[1].numero).toBe(2);
      expect(mesas[2].numero).toBe(3);
    });
  });

  describe('crearMesa', () => {
    it('debe crear una mesa con los datos proporcionados', () => {
      const mesa = mesaService.crearMesa({ numero: 1, capacidad: 4 });

      expect(mesa.id).toBeDefined();
      expect(mesa.numero).toBe(1);
      expect(mesa.capacidad).toBe(4);
      expect(mesa.activa).toBe(true);
    });

    it('debe crear una mesa inactiva si se especifica', () => {
      const mesa = mesaService.crearMesa({ numero: 1, capacidad: 4, activa: false });

      expect(mesa.activa).toBe(false);
    });
  });

  describe('modificarMesa', () => {
    it('debe modificar la capacidad de una mesa', () => {
      const mesa = mesaService.crearMesa({ numero: 1, capacidad: 4 });
      const mesaModificada = mesaService.modificarMesa(mesa.id, { capacidad: 6 });

      expect(mesaModificada.capacidad).toBe(6);
      expect(mesaModificada.numero).toBe(1);
    });

    it('debe modificar el número de una mesa', () => {
      const mesa = mesaService.crearMesa({ numero: 1, capacidad: 4 });
      const mesaModificada = mesaService.modificarMesa(mesa.id, { numero: 5 });

      expect(mesaModificada.numero).toBe(5);
    });

    it('debe desactivar una mesa', () => {
      const mesa = mesaService.crearMesa({ numero: 1, capacidad: 4 });
      const mesaModificada = mesaService.modificarMesa(mesa.id, { activa: false });

      expect(mesaModificada.activa).toBe(false);
    });

    it('debe lanzar error si la mesa no existe', () => {
      expect(() => {
        mesaService.modificarMesa('id-inexistente', { capacidad: 6 });
      }).toThrow('Mesa con id id-inexistente no encontrada');
    });
  });

  describe('eliminarMesa', () => {
    it('debe eliminar una mesa sin reservas', () => {
      const mesa = mesaService.crearMesa({ numero: 1, capacidad: 4 });
      const resultado = mesaService.eliminarMesa(mesa.id);

      expect(resultado.exito).toBe(true);
      expect(mesaService.listarMesas()).toHaveLength(0);
    });

    it('debe retornar error si la mesa no existe', () => {
      const resultado = mesaService.eliminarMesa('id-inexistente');

      expect(resultado.exito).toBe(false);
      expect(resultado.mensaje).toContain('no encontrada');
    });

    it('debe rechazar eliminación si tiene reservas futuras', () => {
      const mesa = mesaService.crearMesa({ numero: 1, capacidad: 4 });

      // Crear una reserva futura
      const fechaFutura = new Date();
      fechaFutura.setDate(fechaFutura.getDate() + 7);
      const fechaStr = fechaFutura.toISOString().split('T')[0];

      db.prepare(`
        INSERT INTO reservas (codigo, mesa_id, fecha, hora, comensales, nombre_cliente, telefono, email, estado, creada_en, modificada_en)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('RES12345', mesa.id, fechaStr, '20:00', 4, 'Juan', '123456789', 'juan@test.com', 'confirmada', new Date().toISOString(), new Date().toISOString());

      const resultado = mesaService.eliminarMesa(mesa.id);

      expect(resultado.exito).toBe(false);
      expect(resultado.reservasAfectadas).toContain('RES12345');
    });
  });

  describe('consultarDisponibles', () => {
    it('debe retornar mesas con capacidad suficiente', () => {
      // Requirements: 1.1
      mesaService.crearMesa({ numero: 1, capacidad: 2 });
      mesaService.crearMesa({ numero: 2, capacidad: 4 });
      mesaService.crearMesa({ numero: 3, capacidad: 6 });

      const fecha = new Date('2025-12-15');
      const disponibles = mesaService.consultarDisponibles(fecha, '20:00', 4);

      expect(disponibles).toHaveLength(2);
      expect(disponibles.every((m) => m.capacidad >= 4)).toBe(true);
    });

    it('debe excluir mesas con reserva confirmada para esa fecha y hora', () => {
      // Requirements: 1.1
      const mesa1 = mesaService.crearMesa({ numero: 1, capacidad: 4 });
      const mesa2 = mesaService.crearMesa({ numero: 2, capacidad: 4 });

      // Crear reserva confirmada para mesa1
      db.prepare(`
        INSERT INTO reservas (codigo, mesa_id, fecha, hora, comensales, nombre_cliente, telefono, email, estado, creada_en, modificada_en)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('RES001', mesa1.id, '2025-12-15', '20:00', 4, 'Juan', '123456789', 'juan@test.com', 'confirmada', new Date().toISOString(), new Date().toISOString());

      const fecha = new Date('2025-12-15');
      const disponibles = mesaService.consultarDisponibles(fecha, '20:00', 2);

      expect(disponibles).toHaveLength(1);
      expect(disponibles[0].id).toBe(mesa2.id);
    });

    it('debe incluir mesas con reserva cancelada para esa fecha y hora', () => {
      // Requirements: 1.1
      const mesa1 = mesaService.crearMesa({ numero: 1, capacidad: 4 });

      // Crear reserva cancelada para mesa1
      db.prepare(`
        INSERT INTO reservas (codigo, mesa_id, fecha, hora, comensales, nombre_cliente, telefono, email, estado, creada_en, modificada_en)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('RES001', mesa1.id, '2025-12-15', '20:00', 4, 'Juan', '123456789', 'juan@test.com', 'cancelada', new Date().toISOString(), new Date().toISOString());

      const fecha = new Date('2025-12-15');
      const disponibles = mesaService.consultarDisponibles(fecha, '20:00', 2);

      expect(disponibles).toHaveLength(1);
      expect(disponibles[0].id).toBe(mesa1.id);
    });

    it('debe excluir mesas inactivas', () => {
      // Requirements: 1.1
      mesaService.crearMesa({ numero: 1, capacidad: 4, activa: true });
      mesaService.crearMesa({ numero: 2, capacidad: 4, activa: false });

      const fecha = new Date('2025-12-15');
      const disponibles = mesaService.consultarDisponibles(fecha, '20:00', 2);

      expect(disponibles).toHaveLength(1);
      expect(disponibles[0].numero).toBe(1);
    });

    it('debe retornar lista vacía si no hay mesas con capacidad suficiente', () => {
      // Requirements: 1.1
      mesaService.crearMesa({ numero: 1, capacidad: 2 });
      mesaService.crearMesa({ numero: 2, capacidad: 4 });

      const fecha = new Date('2025-12-15');
      const disponibles = mesaService.consultarDisponibles(fecha, '20:00', 10);

      expect(disponibles).toHaveLength(0);
    });

    it('debe ordenar mesas por capacidad ascendente', () => {
      // Requirements: 1.1
      mesaService.crearMesa({ numero: 1, capacidad: 8 });
      mesaService.crearMesa({ numero: 2, capacidad: 4 });
      mesaService.crearMesa({ numero: 3, capacidad: 6 });

      const fecha = new Date('2025-12-15');
      const disponibles = mesaService.consultarDisponibles(fecha, '20:00', 2);

      expect(disponibles[0].capacidad).toBe(4);
      expect(disponibles[1].capacidad).toBe(6);
      expect(disponibles[2].capacidad).toBe(8);
    });

    it('debe permitir reservas en diferentes horas para la misma mesa', () => {
      // Requirements: 1.1
      const mesa1 = mesaService.crearMesa({ numero: 1, capacidad: 4 });

      // Crear reserva para las 20:00
      db.prepare(`
        INSERT INTO reservas (codigo, mesa_id, fecha, hora, comensales, nombre_cliente, telefono, email, estado, creada_en, modificada_en)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('RES001', mesa1.id, '2025-12-15', '20:00', 4, 'Juan', '123456789', 'juan@test.com', 'confirmada', new Date().toISOString(), new Date().toISOString());

      const fecha = new Date('2025-12-15');

      // No disponible a las 20:00
      const disponibles2000 = mesaService.consultarDisponibles(fecha, '20:00', 2);
      expect(disponibles2000).toHaveLength(0);

      // Disponible a las 21:00
      const disponibles2100 = mesaService.consultarDisponibles(fecha, '21:00', 2);
      expect(disponibles2100).toHaveLength(1);
    });
  });
});
