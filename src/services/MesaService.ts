/**
 * Servicio para gestión de mesas del restaurante
 * "El Rinconcito de Anaga"
 *
 * Requirements: 5.1, 5.2
 */

import Database from 'better-sqlite3';
import crypto from 'crypto';
import { Mesa, DatosMesa, CambiosMesa, ResultadoEliminacion } from '../models/types';

export class MesaService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Lista todas las mesas del restaurante
   * Requirements: 5.1
   */
  listarMesas(): Mesa[] {
    const stmt = this.db.prepare('SELECT id, numero, capacidad, activa FROM mesas ORDER BY numero');
    const rows = stmt.all() as { id: string; numero: number; capacidad: number; activa: number }[];

    return rows.map((row) => ({
      id: row.id,
      numero: row.numero,
      capacidad: row.capacidad,
      activa: row.activa === 1,
    }));
  }

  /**
   * Crea una nueva mesa en el restaurante
   * Requirements: 5.1
   */
  crearMesa(datos: DatosMesa): Mesa {
    const id = crypto.randomUUID();
    const activa = datos.activa !== undefined ? datos.activa : true;

    const stmt = this.db.prepare(
      'INSERT INTO mesas (id, numero, capacidad, activa) VALUES (?, ?, ?, ?)'
    );

    stmt.run(id, datos.numero, datos.capacidad, activa ? 1 : 0);

    return {
      id,
      numero: datos.numero,
      capacidad: datos.capacidad,
      activa,
    };
  }

  /**
   * Modifica una mesa existente
   * Requirements: 5.2
   */
  modificarMesa(id: string, cambios: CambiosMesa): Mesa {
    // Verificar que la mesa existe
    const mesaExistente = this.obtenerMesaPorId(id);
    if (!mesaExistente) {
      throw new Error(`Mesa con id ${id} no encontrada`);
    }

    // Construir la actualización
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (cambios.numero !== undefined) {
      updates.push('numero = ?');
      values.push(cambios.numero);
    }
    if (cambios.capacidad !== undefined) {
      updates.push('capacidad = ?');
      values.push(cambios.capacidad);
    }
    if (cambios.activa !== undefined) {
      updates.push('activa = ?');
      values.push(cambios.activa ? 1 : 0);
    }

    if (updates.length > 0) {
      values.push(id);
      const stmt = this.db.prepare(`UPDATE mesas SET ${updates.join(', ')} WHERE id = ?`);
      stmt.run(...values);
    }

    // Retornar la mesa actualizada
    return this.obtenerMesaPorId(id)!;
  }

  /**
   * Elimina una mesa del restaurante
   * Verifica que no tenga reservas futuras antes de eliminar
   * Requirements: 5.3, 5.4
   */
  eliminarMesa(id: string): ResultadoEliminacion {
    // Verificar que la mesa existe
    const mesaExistente = this.obtenerMesaPorId(id);
    if (!mesaExistente) {
      return {
        exito: false,
        mensaje: `Mesa con id ${id} no encontrada`,
      };
    }

    // Verificar si tiene reservas futuras pendientes o confirmadas
    const hoy = new Date().toISOString().split('T')[0];
    const stmtReservas = this.db.prepare(`
      SELECT codigo FROM reservas 
      WHERE mesa_id = ? AND fecha >= ? AND estado IN ('pendiente', 'confirmada')
    `);
    const reservasFuturas = stmtReservas.all(id, hoy) as { codigo: string }[];

    if (reservasFuturas.length > 0) {
      return {
        exito: false,
        mensaje: `No se puede eliminar la mesa ${mesaExistente.numero} porque tiene ${reservasFuturas.length} reserva(s) futura(s)`,
        reservasAfectadas: reservasFuturas.map((r) => r.codigo),
      };
    }

    // Eliminar la mesa
    const stmtDelete = this.db.prepare('DELETE FROM mesas WHERE id = ?');
    stmtDelete.run(id);

    return {
      exito: true,
      mensaje: `Mesa ${mesaExistente.numero} eliminada correctamente`,
    };
  }

  /**
   * Obtiene una mesa por su ID
   */
  private obtenerMesaPorId(id: string): Mesa | null {
    const stmt = this.db.prepare('SELECT id, numero, capacidad, activa FROM mesas WHERE id = ?');
    const row = stmt.get(id) as { id: string; numero: number; capacidad: number; activa: number } | undefined;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      numero: row.numero,
      capacidad: row.capacidad,
      activa: row.activa === 1,
    };
  }

  /**
   * Consulta las mesas disponibles para una fecha, hora y número de comensales
   * Requirements: 1.1
   *
   * @param fecha - Fecha de la reserva
   * @param hora - Hora de la reserva (formato "HH:mm")
   * @param comensales - Número de comensales
   * @returns Lista de mesas disponibles que cumplen con la capacidad requerida
   */
  consultarDisponibles(fecha: Date, hora: string, comensales: number): Mesa[] {
    // Formatear fecha a string YYYY-MM-DD para comparar con la BD
    const fechaStr = fecha.toISOString().split('T')[0];

    // Consulta que:
    // 1. Filtra mesas activas con capacidad >= comensales
    // 2. Excluye mesas que tienen reserva pendiente o confirmada para esa fecha y hora
    const stmt = this.db.prepare(`
      SELECT m.id, m.numero, m.capacidad, m.activa
      FROM mesas m
      WHERE m.activa = 1
        AND m.capacidad >= ?
        AND m.id NOT IN (
          SELECT r.mesa_id
          FROM reservas r
          WHERE r.fecha = ?
            AND r.hora = ?
            AND r.estado IN ('pendiente', 'confirmada')
        )
      ORDER BY m.capacidad ASC, m.numero ASC
    `);

    const rows = stmt.all(comensales, fechaStr, hora) as {
      id: string;
      numero: number;
      capacidad: number;
      activa: number;
    }[];

    return rows.map((row) => ({
      id: row.id,
      numero: row.numero,
      capacidad: row.capacidad,
      activa: row.activa === 1,
    }));
  }


}
