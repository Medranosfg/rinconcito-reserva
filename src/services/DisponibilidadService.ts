/**
 * Servicio para gestión de disponibilidad del restaurante
 * "El Rinconcito de Anaga"
 *
 * Requirements: 6.1, 6.2, 6.3
 */

import Database from 'better-sqlite3';
import crypto from 'crypto';
import { Horario, DiaCerrado, Disponibilidad } from '../models/types';

export class DisponibilidadService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Consulta la disponibilidad para una fecha específica
   * Verifica si el día está abierto y retorna el horario correspondiente
   * Requirements: 6.1, 6.2
   */
  consultarDisponibilidad(fecha: Date): Disponibilidad {
    const fechaStr = fecha.toISOString().split('T')[0];
    const diaSemana = fecha.getDay(); // 0-6 (domingo-sábado)

    // Verificar si el día está marcado como cerrado
    const stmtCerrado = this.db.prepare(
      'SELECT id, fecha, motivo FROM dias_cerrados WHERE fecha = ?'
    );
    const diaCerrado = stmtCerrado.get(fechaStr) as { id: string; fecha: string; motivo: string } | undefined;

    if (diaCerrado) {
      return {
        fecha,
        abierto: false,
        horario: null,
        motivoCierre: diaCerrado.motivo,
      };
    }

    // Obtener el horario para el día de la semana
    const stmtHorario = this.db.prepare(
      'SELECT id, dia_semana, hora_apertura, hora_cierre, activo FROM horarios WHERE dia_semana = ?'
    );
    const horarioRow = stmtHorario.get(diaSemana) as {
      id: string;
      dia_semana: number;
      hora_apertura: string;
      hora_cierre: string;
      activo: number;
    } | undefined;

    if (!horarioRow || horarioRow.activo === 0) {
      return {
        fecha,
        abierto: false,
        horario: null,
        motivoCierre: 'Sin horario configurado para este día',
      };
    }

    const horario: Horario = {
      diaSemana: horarioRow.dia_semana,
      horaApertura: horarioRow.hora_apertura,
      horaCierre: horarioRow.hora_cierre,
      activo: horarioRow.activo === 1,
    };

    return {
      fecha,
      abierto: true,
      horario,
    };
  }


  /**
   * Configura el horario de apertura para un día de la semana
   * Si ya existe un horario para ese día, lo actualiza
   * Requirements: 6.1, 6.3
   */
  configurarHorario(horario: Horario): void {
    // Verificar si ya existe un horario para ese día
    const stmtExiste = this.db.prepare(
      'SELECT id FROM horarios WHERE dia_semana = ?'
    );
    const existente = stmtExiste.get(horario.diaSemana) as { id: string } | undefined;

    if (existente) {
      // Actualizar horario existente
      const stmtUpdate = this.db.prepare(`
        UPDATE horarios 
        SET hora_apertura = ?, hora_cierre = ?, activo = ?
        WHERE dia_semana = ?
      `);
      stmtUpdate.run(
        horario.horaApertura,
        horario.horaCierre,
        horario.activo ? 1 : 0,
        horario.diaSemana
      );
    } else {
      // Crear nuevo horario
      const id = crypto.randomUUID();
      const stmtInsert = this.db.prepare(`
        INSERT INTO horarios (id, dia_semana, hora_apertura, hora_cierre, activo)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmtInsert.run(
        id,
        horario.diaSemana,
        horario.horaApertura,
        horario.horaCierre,
        horario.activo ? 1 : 0
      );
    }
  }

  /**
   * Marca un día específico como cerrado
   * Requirements: 6.2
   */
  marcarDiaCerrado(fecha: Date, motivo: string): void {
    const fechaStr = fecha.toISOString().split('T')[0];

    // Verificar si ya existe un registro para esa fecha
    const stmtExiste = this.db.prepare(
      'SELECT id FROM dias_cerrados WHERE fecha = ?'
    );
    const existente = stmtExiste.get(fechaStr) as { id: string } | undefined;

    if (existente) {
      // Actualizar motivo si ya existe
      const stmtUpdate = this.db.prepare(
        'UPDATE dias_cerrados SET motivo = ? WHERE fecha = ?'
      );
      stmtUpdate.run(motivo, fechaStr);
    } else {
      // Crear nuevo registro de día cerrado
      const id = crypto.randomUUID();
      const stmtInsert = this.db.prepare(
        'INSERT INTO dias_cerrados (id, fecha, motivo) VALUES (?, ?, ?)'
      );
      stmtInsert.run(id, fechaStr, motivo);
    }
  }

  /**
   * Obtiene todos los horarios configurados
   */
  obtenerHorarios(): Horario[] {
    const stmt = this.db.prepare(
      'SELECT id, dia_semana, hora_apertura, hora_cierre, activo FROM horarios ORDER BY dia_semana'
    );
    const rows = stmt.all() as {
      id: string;
      dia_semana: number;
      hora_apertura: string;
      hora_cierre: string;
      activo: number;
    }[];

    return rows.map((row) => ({
      diaSemana: row.dia_semana,
      horaApertura: row.hora_apertura,
      horaCierre: row.hora_cierre,
      activo: row.activo === 1,
    }));
  }

  /**
   * Obtiene todos los días cerrados
   */
  obtenerDiasCerrados(): DiaCerrado[] {
    const stmt = this.db.prepare(
      'SELECT id, fecha, motivo FROM dias_cerrados ORDER BY fecha'
    );
    const rows = stmt.all() as { id: string; fecha: string; motivo: string }[];

    return rows.map((row) => ({
      id: row.id,
      fecha: new Date(row.fecha),
      motivo: row.motivo,
    }));
  }

  /**
   * Elimina un día cerrado (reabre el día)
   */
  eliminarDiaCerrado(fecha: Date): boolean {
    const fechaStr = fecha.toISOString().split('T')[0];
    const stmt = this.db.prepare('DELETE FROM dias_cerrados WHERE fecha = ?');
    const result = stmt.run(fechaStr);
    return result.changes > 0;
  }

  /**
   * Verifica si una hora específica está dentro del horario de apertura para una fecha
   * Requirements: 6.1
   * @param fecha - La fecha a verificar
   * @param hora - La hora en formato "HH:mm"
   * @returns true si la hora está dentro del horario de apertura, false en caso contrario
   */
  validarHoraEnHorario(fecha: Date, hora: string): boolean {
    const disponibilidad = this.consultarDisponibilidad(fecha);

    // Si el día no está abierto o no tiene horario, la hora no es válida
    if (!disponibilidad.abierto || !disponibilidad.horario) {
      return false;
    }

    const { horaApertura, horaCierre } = disponibilidad.horario;

    // Convertir horas a minutos para comparación
    const horaEnMinutos = this.horaAMinutos(hora);
    const aperturaEnMinutos = this.horaAMinutos(horaApertura);
    const cierreEnMinutos = this.horaAMinutos(horaCierre);

    // La hora debe estar entre apertura y cierre (inclusive apertura, exclusivo cierre)
    return horaEnMinutos >= aperturaEnMinutos && horaEnMinutos < cierreEnMinutos;
  }

  /**
   * Verifica si un día está disponible para reservas
   * Un día está disponible si no está marcado como cerrado y tiene horario activo
   * Requirements: 6.2
   * @param fecha - La fecha a verificar
   * @returns true si el día está disponible, false en caso contrario
   */
  esDiaDisponible(fecha: Date): boolean {
    const disponibilidad = this.consultarDisponibilidad(fecha);
    return disponibilidad.abierto;
  }

  /**
   * Convierte una hora en formato "HH:mm" a minutos desde medianoche
   * @param hora - Hora en formato "HH:mm"
   * @returns Minutos desde medianoche
   */
  private horaAMinutos(hora: string): number {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  }


}
