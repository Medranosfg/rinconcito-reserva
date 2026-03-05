/**
 * Tests unitarios para DisponibilidadService
 * Requirements: 6.1, 6.2, 6.3
 */

import { DisponibilidadService } from './DisponibilidadService';
import { createInMemoryDatabase } from '../database/db';
import Database from 'better-sqlite3';

describe('DisponibilidadService', () => {
  let db: Database.Database;
  let service: DisponibilidadService;

  beforeEach(() => {
    db = createInMemoryDatabase();
    service = new DisponibilidadService(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('configurarHorario', () => {
    it('debe crear un nuevo horario para un día de la semana', () => {
      const horario = {
        diaSemana: 1, // Lunes
        horaApertura: '12:00',
        horaCierre: '23:00',
        activo: true,
      };

      service.configurarHorario(horario);

      const horarios = service.obtenerHorarios();
      expect(horarios).toHaveLength(1);
      expect(horarios[0]).toEqual(horario);
    });

    it('debe actualizar un horario existente', () => {
      const horarioInicial = {
        diaSemana: 1,
        horaApertura: '12:00',
        horaCierre: '22:00',
        activo: true,
      };
      service.configurarHorario(horarioInicial);

      const horarioActualizado = {
        diaSemana: 1,
        horaApertura: '13:00',
        horaCierre: '23:30',
        activo: true,
      };
      service.configurarHorario(horarioActualizado);

      const horarios = service.obtenerHorarios();
      expect(horarios).toHaveLength(1);
      expect(horarios[0].horaApertura).toBe('13:00');
      expect(horarios[0].horaCierre).toBe('23:30');
    });

    it('debe permitir desactivar un horario', () => {
      const horario = {
        diaSemana: 0, // Domingo
        horaApertura: '12:00',
        horaCierre: '16:00',
        activo: false,
      };

      service.configurarHorario(horario);

      const horarios = service.obtenerHorarios();
      expect(horarios[0].activo).toBe(false);
    });
  });


  describe('marcarDiaCerrado', () => {
    it('debe marcar un día como cerrado', () => {
      const fecha = new Date('2025-12-25');
      const motivo = 'Navidad';

      service.marcarDiaCerrado(fecha, motivo);

      const diasCerrados = service.obtenerDiasCerrados();
      expect(diasCerrados).toHaveLength(1);
      expect(diasCerrados[0].fecha.toISOString().split('T')[0]).toBe('2025-12-25');
      expect(diasCerrados[0].motivo).toBe('Navidad');
    });

    it('debe actualizar el motivo si el día ya está cerrado', () => {
      const fecha = new Date('2025-12-31');
      service.marcarDiaCerrado(fecha, 'Fin de año');
      service.marcarDiaCerrado(fecha, 'Nochevieja - Evento privado');

      const diasCerrados = service.obtenerDiasCerrados();
      expect(diasCerrados).toHaveLength(1);
      expect(diasCerrados[0].motivo).toBe('Nochevieja - Evento privado');
    });
  });

  describe('consultarDisponibilidad', () => {
    it('debe retornar abierto=false si el día está cerrado', () => {
      const fecha = new Date('2025-12-25');
      service.marcarDiaCerrado(fecha, 'Navidad');

      const disponibilidad = service.consultarDisponibilidad(fecha);

      expect(disponibilidad.abierto).toBe(false);
      expect(disponibilidad.horario).toBeNull();
      expect(disponibilidad.motivoCierre).toBe('Navidad');
    });

    it('debe retornar abierto=false si no hay horario configurado', () => {
      const fecha = new Date('2025-07-14'); // Un lunes sin horario configurado

      const disponibilidad = service.consultarDisponibilidad(fecha);

      expect(disponibilidad.abierto).toBe(false);
      expect(disponibilidad.horario).toBeNull();
      expect(disponibilidad.motivoCierre).toBe('Sin horario configurado para este día');
    });

    it('debe retornar abierto=true con horario si está configurado', () => {
      // Configurar horario para lunes (día 1)
      const horario = {
        diaSemana: 1,
        horaApertura: '12:00',
        horaCierre: '23:00',
        activo: true,
      };
      service.configurarHorario(horario);

      // Buscar un lunes
      const fecha = new Date('2025-07-14'); // Es lunes

      const disponibilidad = service.consultarDisponibilidad(fecha);

      expect(disponibilidad.abierto).toBe(true);
      expect(disponibilidad.horario).not.toBeNull();
      expect(disponibilidad.horario?.horaApertura).toBe('12:00');
      expect(disponibilidad.horario?.horaCierre).toBe('23:00');
      expect(disponibilidad.motivoCierre).toBeUndefined();
    });

    it('debe retornar abierto=false si el horario está desactivado', () => {
      const horario = {
        diaSemana: 1,
        horaApertura: '12:00',
        horaCierre: '23:00',
        activo: false,
      };
      service.configurarHorario(horario);

      const fecha = new Date('2025-07-14'); // Lunes

      const disponibilidad = service.consultarDisponibilidad(fecha);

      expect(disponibilidad.abierto).toBe(false);
    });

    it('día cerrado tiene prioridad sobre horario configurado', () => {
      // Configurar horario para lunes
      service.configurarHorario({
        diaSemana: 1,
        horaApertura: '12:00',
        horaCierre: '23:00',
        activo: true,
      });

      // Marcar ese lunes específico como cerrado
      const fecha = new Date('2025-07-14');
      service.marcarDiaCerrado(fecha, 'Cierre por obras');

      const disponibilidad = service.consultarDisponibilidad(fecha);

      expect(disponibilidad.abierto).toBe(false);
      expect(disponibilidad.motivoCierre).toBe('Cierre por obras');
    });
  });

  describe('eliminarDiaCerrado', () => {
    it('debe eliminar un día cerrado existente', () => {
      const fecha = new Date('2025-12-25');
      service.marcarDiaCerrado(fecha, 'Navidad');

      const resultado = service.eliminarDiaCerrado(fecha);

      expect(resultado).toBe(true);
      expect(service.obtenerDiasCerrados()).toHaveLength(0);
    });

    it('debe retornar false si el día no estaba cerrado', () => {
      const fecha = new Date('2025-07-14');

      const resultado = service.eliminarDiaCerrado(fecha);

      expect(resultado).toBe(false);
    });
  });

  describe('validarHoraEnHorario', () => {
    beforeEach(() => {
      // Configurar horario para lunes (día 1): 12:00 - 23:00
      service.configurarHorario({
        diaSemana: 1,
        horaApertura: '12:00',
        horaCierre: '23:00',
        activo: true,
      });
    });

    it('debe retornar true si la hora está dentro del horario de apertura', () => {
      const fecha = new Date('2025-07-14'); // Lunes
      
      expect(service.validarHoraEnHorario(fecha, '12:00')).toBe(true);
      expect(service.validarHoraEnHorario(fecha, '14:30')).toBe(true);
      expect(service.validarHoraEnHorario(fecha, '22:59')).toBe(true);
    });

    it('debe retornar false si la hora está antes de la apertura', () => {
      const fecha = new Date('2025-07-14'); // Lunes
      
      expect(service.validarHoraEnHorario(fecha, '11:59')).toBe(false);
      expect(service.validarHoraEnHorario(fecha, '08:00')).toBe(false);
    });

    it('debe retornar false si la hora es igual o posterior al cierre', () => {
      const fecha = new Date('2025-07-14'); // Lunes
      
      expect(service.validarHoraEnHorario(fecha, '23:00')).toBe(false);
      expect(service.validarHoraEnHorario(fecha, '23:30')).toBe(false);
    });

    it('debe retornar false si el día está cerrado', () => {
      const fecha = new Date('2025-07-14'); // Lunes
      service.marcarDiaCerrado(fecha, 'Cierre especial');
      
      expect(service.validarHoraEnHorario(fecha, '14:00')).toBe(false);
    });

    it('debe retornar false si no hay horario configurado para ese día', () => {
      const fecha = new Date('2025-07-15'); // Martes (sin horario configurado)
      
      expect(service.validarHoraEnHorario(fecha, '14:00')).toBe(false);
    });

    it('debe retornar false si el horario está desactivado', () => {
      service.configurarHorario({
        diaSemana: 2, // Martes
        horaApertura: '12:00',
        horaCierre: '23:00',
        activo: false,
      });
      const fecha = new Date('2025-07-15'); // Martes
      
      expect(service.validarHoraEnHorario(fecha, '14:00')).toBe(false);
    });
  });

  describe('esDiaDisponible', () => {
    it('debe retornar true si el día tiene horario activo', () => {
      service.configurarHorario({
        diaSemana: 1, // Lunes
        horaApertura: '12:00',
        horaCierre: '23:00',
        activo: true,
      });
      const fecha = new Date('2025-07-14'); // Lunes
      
      expect(service.esDiaDisponible(fecha)).toBe(true);
    });

    it('debe retornar false si el día está marcado como cerrado', () => {
      service.configurarHorario({
        diaSemana: 1,
        horaApertura: '12:00',
        horaCierre: '23:00',
        activo: true,
      });
      const fecha = new Date('2025-07-14');
      service.marcarDiaCerrado(fecha, 'Festivo');
      
      expect(service.esDiaDisponible(fecha)).toBe(false);
    });

    it('debe retornar false si no hay horario configurado', () => {
      const fecha = new Date('2025-07-14'); // Sin horario configurado
      
      expect(service.esDiaDisponible(fecha)).toBe(false);
    });

    it('debe retornar false si el horario está desactivado', () => {
      service.configurarHorario({
        diaSemana: 1,
        horaApertura: '12:00',
        horaCierre: '23:00',
        activo: false,
      });
      const fecha = new Date('2025-07-14');
      
      expect(service.esDiaDisponible(fecha)).toBe(false);
    });
  });
});
