/**
 * Servicio para gestión de reservas del restaurante
 * "El Rinconcito de Anaga"
 *
 * Requirements: 1.2, 1.3, 1.4, 1.5
 */

import Database from 'better-sqlite3';
import { Reserva, DatosReserva, DatosCliente, Mesa, CambiosReserva, ResultadoCancelacion, FiltrosReserva } from '../models/types';
import { MesaService } from './MesaService';
import { DisponibilidadService } from './DisponibilidadService';
import { generarCodigoReserva } from '../utils/codigoReserva';
import { ReservaError, CodigoError } from '../utils/errors';

// Re-exportar para mantener compatibilidad con código existente
export { ReservaError, CodigoError };

export class ReservaService {
  private db: Database.Database;
  private mesaService: MesaService;
  private disponibilidadService: DisponibilidadService;

  constructor(db: Database.Database) {
    this.db = db;
    this.mesaService = new MesaService(db);
    this.disponibilidadService = new DisponibilidadService(db);
  }


  /**
   * Crea una nueva reserva en el sistema
   * 
   * Requirements: 1.2, 1.3, 1.4, 1.5
   * 
   * @param datos - Datos de la reserva a crear
   * @returns La reserva creada con su código único
   * @throws ReservaError si los datos son inválidos o no hay disponibilidad
   */
  crearReserva(datos: DatosReserva): Reserva {
    // 1. Validar datos del cliente (nombre, teléfono, email)
    // Requirements: 1.4
    this.validarDatosCliente(datos.cliente);

    // 2. Validar que la fecha no sea anterior a hoy
    // Requirements: 1.5
    this.validarFechaNoEsPasada(datos.fecha);

    // 3. Verificar que el día esté disponible (no cerrado)
    // Requirements: 6.2
    if (!this.disponibilidadService.esDiaDisponible(datos.fecha)) {
      const disponibilidad = this.disponibilidadService.consultarDisponibilidad(datos.fecha);
      throw new ReservaError(
        CodigoError.DIA_CERRADO,
        `El restaurante está cerrado el día seleccionado: ${disponibilidad.motivoCierre || 'Sin horario configurado'}`
      );
    }

    // 4. Verificar que la hora esté dentro del horario de apertura
    // Requirements: 6.1
    if (!this.disponibilidadService.validarHoraEnHorario(datos.fecha, datos.hora)) {
      const disponibilidad = this.disponibilidadService.consultarDisponibilidad(datos.fecha);
      const horario = disponibilidad.horario;
      throw new ReservaError(
        CodigoError.FUERA_DE_HORARIO,
        `La hora ${datos.hora} está fuera del horario de apertura`,
        horario ? {
          horaApertura: horario.horaApertura,
          horaCierre: horario.horaCierre,
        } : undefined
      );
    }

    // 5. Buscar mesa disponible
    let mesaAsignada: Mesa | null = null;

    if (datos.mesaId) {
      // 6. Si se especifica mesaId, verificar que esa mesa específica esté disponible
      // Requirements: 1.3
      mesaAsignada = this.verificarMesaEspecifica(
        datos.mesaId,
        datos.fecha,
        datos.hora,
        datos.comensales
      );
    } else {
      // Buscar automáticamente una mesa disponible con capacidad suficiente
      // Requirements: 1.1
      const mesasDisponibles = this.mesaService.consultarDisponibles(
        datos.fecha,
        datos.hora,
        datos.comensales
      );

      if (mesasDisponibles.length === 0) {
        throw new ReservaError(
          CodigoError.CAPACIDAD_INSUFICIENTE,
          `No hay mesas disponibles para ${datos.comensales} comensales en la fecha y hora seleccionadas`
        );
      }

      // Asignar la primera mesa disponible (ya están ordenadas por capacidad)
      mesaAsignada = mesasDisponibles[0];
    }

    // 7. Generar código de reserva único
    // Requirements: 1.2
    const codigo = this.generarCodigoUnico();

    // 8. Persistir la reserva en la base de datos
    // Requirements: 8.1
    const ahora = new Date();
    const fechaStr = datos.fecha.toISOString().split('T')[0];

    const stmt = this.db.prepare(`
      INSERT INTO reservas (
        codigo, mesa_id, fecha, hora, comensales,
        nombre_cliente, telefono, email, estado,
        creada_en, modificada_en
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, ?)
    `);

    stmt.run(
      codigo,
      mesaAsignada.id,
      fechaStr,
      datos.hora,
      datos.comensales,
      datos.cliente.nombre,
      datos.cliente.telefono,
      datos.cliente.email,
      ahora.toISOString(),
      ahora.toISOString()
    );

    // 9. Retornar la reserva creada
    const reserva: Reserva = {
      codigo,
      mesaId: mesaAsignada.id,
      fecha: datos.fecha,
      hora: datos.hora,
      comensales: datos.comensales,
      cliente: { ...datos.cliente },
      estado: 'pendiente',
      creadaEn: ahora,
      modificadaEn: ahora,
    };

    return reserva;
  }

  /**
   * Confirma una reserva pendiente
   * 
   * @param codigo - Código de la reserva a confirmar
   * @returns La reserva confirmada
   * @throws ReservaError si la reserva no existe o no está pendiente
   */
  confirmarReserva(codigo: string): Reserva {
    const reserva = this.consultarReserva(codigo);

    if (reserva.estado !== 'pendiente') {
      throw new ReservaError(
        CodigoError.DATOS_INCOMPLETOS,
        `La reserva no está pendiente de confirmación (estado actual: ${reserva.estado})`
      );
    }

    const ahora = new Date();
    const stmt = this.db.prepare(`
      UPDATE reservas
      SET estado = 'confirmada', modificada_en = ?
      WHERE codigo = ?
    `);

    stmt.run(ahora.toISOString(), codigo);

    return {
      ...reserva,
      estado: 'confirmada',
      modificadaEn: ahora,
    };
  }

  /**
   * Consulta una reserva por su código
   * 
   * Requirements: 2.1, 2.2, 2.3
   * 
   * @param codigo - Código único de la reserva
   * @returns La reserva con todos sus detalles
   * @throws ReservaError si la reserva no existe
   */
  consultarReserva(codigo: string): Reserva {
    const stmt = this.db.prepare(`
      SELECT 
        r.codigo, r.mesa_id, r.fecha, r.hora, r.comensales,
        r.nombre_cliente, r.telefono, r.email, r.estado,
        r.creada_en, r.modificada_en
      FROM reservas r
      WHERE r.codigo = ?
    `);

    const row = stmt.get(codigo) as {
      codigo: string;
      mesa_id: string;
      fecha: string;
      hora: string;
      comensales: number;
      nombre_cliente: string;
      telefono: string;
      email: string;
      estado: string;
      creada_en: string;
      modificada_en: string;
    } | undefined;

    if (!row) {
      throw new ReservaError(
        CodigoError.RESERVA_NO_ENCONTRADA,
        `No se encontró ninguna reserva con el código: ${codigo}`
      );
    }

    // Construir el objeto Reserva con todos los detalles
    const reserva: Reserva = {
      codigo: row.codigo,
      mesaId: row.mesa_id,
      fecha: new Date(row.fecha),
      hora: row.hora,
      comensales: row.comensales,
      cliente: {
        nombre: row.nombre_cliente,
        telefono: row.telefono,
        email: row.email,
      },
      estado: row.estado as 'confirmada' | 'cancelada' | 'completada' | 'no_show',
      creadaEn: new Date(row.creada_en),
      modificadaEn: new Date(row.modificada_en),
    };

    return reserva;
  }

  /**
   * Modifica una reserva existente
   * 
   * Requirements: 3.1, 3.2, 3.3, 3.4
   * 
   * @param codigo - Código de la reserva a modificar
   * @param cambios - Cambios a aplicar (fecha, hora, comensales, mesaId)
   * @returns La reserva actualizada
   * @throws ReservaError si la reserva no existe, la modificación es tardía, o no hay disponibilidad
   */
  modificarReserva(codigo: string, cambios: CambiosReserva): Reserva {
    // 1. Buscar la reserva por código (validar que existe)
    // Requirements: 3.1
    const reservaActual = this.consultarReserva(codigo);

    // 2. Validar anticipación mínima de 2 horas
    // Requirements: 3.4
    this.validarAnticipaciónMinima(reservaActual);

    // Determinar los valores finales (usar cambios o mantener actuales)
    const nuevaFecha = cambios.fecha ?? reservaActual.fecha;
    const nuevaHora = cambios.hora ?? reservaActual.hora;
    const nuevosComensales = cambios.comensales ?? reservaActual.comensales;
    const nuevaMesaId = cambios.mesaId ?? reservaActual.mesaId;

    // 3. Si se cambia fecha/hora/comensales/mesa, verificar disponibilidad
    // Requirements: 3.2, 3.3
    const hayModificacionDeDisponibilidad = 
      cambios.fecha !== undefined ||
      cambios.hora !== undefined ||
      cambios.comensales !== undefined ||
      cambios.mesaId !== undefined;

    if (hayModificacionDeDisponibilidad) {
      // Validar que la nueva fecha no sea pasada
      this.validarFechaNoEsPasada(nuevaFecha);

      // Verificar que el día esté disponible (no cerrado)
      if (!this.disponibilidadService.esDiaDisponible(nuevaFecha)) {
        const disponibilidad = this.disponibilidadService.consultarDisponibilidad(nuevaFecha);
        throw new ReservaError(
          CodigoError.DIA_CERRADO,
          `El restaurante está cerrado el día seleccionado: ${disponibilidad.motivoCierre || 'Sin horario configurado'}`
        );
      }

      // Verificar que la hora esté dentro del horario de apertura
      if (!this.disponibilidadService.validarHoraEnHorario(nuevaFecha, nuevaHora)) {
        const disponibilidad = this.disponibilidadService.consultarDisponibilidad(nuevaFecha);
        const horario = disponibilidad.horario;
        throw new ReservaError(
          CodigoError.FUERA_DE_HORARIO,
          `La hora ${nuevaHora} está fuera del horario de apertura`,
          horario ? {
            horaApertura: horario.horaApertura,
            horaCierre: horario.horaCierre,
          } : undefined
        );
      }

      // Verificar disponibilidad de la mesa (excluyendo la reserva actual)
      this.verificarDisponibilidadParaModificacion(
        codigo,
        nuevaMesaId,
        nuevaFecha,
        nuevaHora,
        nuevosComensales
      );
    }

    // 4. Actualizar la reserva en la base de datos
    // Requirements: 3.2, 8.1
    const ahora = new Date();
    const fechaStr = nuevaFecha.toISOString().split('T')[0];

    const stmt = this.db.prepare(`
      UPDATE reservas 
      SET fecha = ?, hora = ?, comensales = ?, mesa_id = ?, modificada_en = ?
      WHERE codigo = ?
    `);

    stmt.run(fechaStr, nuevaHora, nuevosComensales, nuevaMesaId, ahora.toISOString(), codigo);

    // 5. Retornar la reserva actualizada
    const reservaActualizada: Reserva = {
      ...reservaActual,
      fecha: nuevaFecha,
      hora: nuevaHora,
      comensales: nuevosComensales,
      mesaId: nuevaMesaId,
      modificadaEn: ahora,
    };

    return reservaActualizada;
  }

  /**
   * Valida que la modificación se hace con al menos 2 horas de anticipación
   * Requirements: 3.4
   * 
   * @param reserva - Reserva a validar
   * @throws ReservaError si la modificación es tardía
   */
  private validarAnticipaciónMinima(reserva: Reserva): void {
    const ahora = new Date();
    
    // Construir la fecha/hora de la reserva
    const fechaReserva = new Date(reserva.fecha);
    const [horas, minutos] = reserva.hora.split(':').map(Number);
    fechaReserva.setHours(horas, minutos, 0, 0);

    // Calcular la diferencia en milisegundos
    const diferencia = fechaReserva.getTime() - ahora.getTime();
    const dosHorasEnMs = 2 * 60 * 60 * 1000;

    if (diferencia < dosHorasEnMs) {
      throw new ReservaError(
        CodigoError.MODIFICACION_TARDIA,
        'No se puede modificar la reserva con menos de 2 horas de anticipación'
      );
    }
  }

  /**
   * Verifica disponibilidad para modificación, excluyendo la reserva actual
   * Requirements: 3.3
   * 
   * @param codigoReservaActual - Código de la reserva que se está modificando
   * @param mesaId - ID de la mesa a verificar
   * @param fecha - Fecha de la reserva
   * @param hora - Hora de la reserva
   * @param comensales - Número de comensales
   * @throws ReservaError si no hay disponibilidad
   */
  private verificarDisponibilidadParaModificacion(
    codigoReservaActual: string,
    mesaId: string,
    fecha: Date,
    hora: string,
    comensales: number
  ): void {
    // Verificar que la mesa tenga capacidad suficiente
    const stmtMesa = this.db.prepare('SELECT id, numero, capacidad, activa FROM mesas WHERE id = ?');
    const mesa = stmtMesa.get(mesaId) as { id: string; numero: number; capacidad: number; activa: number } | undefined;

    if (!mesa) {
      throw new ReservaError(
        CodigoError.MESA_NO_DISPONIBLE,
        'La mesa especificada no existe'
      );
    }

    if (!mesa.activa) {
      throw new ReservaError(
        CodigoError.MESA_NO_DISPONIBLE,
        `La mesa ${mesa.numero} no está activa`
      );
    }

    if (mesa.capacidad < comensales) {
      const mesasDisponibles = this.mesaService.consultarDisponibles(fecha, hora, comensales);
      throw new ReservaError(
        CodigoError.CAPACIDAD_INSUFICIENTE,
        `La mesa ${mesa.numero} tiene capacidad para ${mesa.capacidad} personas, pero se requieren ${comensales}`,
        undefined,
        mesasDisponibles
      );
    }

    // Verificar que no haya otra reserva para esa mesa en esa fecha/hora
    // (excluyendo la reserva actual y reservas canceladas)
    const fechaStr = fecha.toISOString().split('T')[0];
    const stmtConflicto = this.db.prepare(`
      SELECT codigo FROM reservas 
      WHERE mesa_id = ? 
        AND fecha = ? 
        AND hora = ? 
        AND estado IN ('pendiente', 'confirmada')
        AND codigo != ?
    `);

    const conflicto = stmtConflicto.get(mesaId, fechaStr, hora, codigoReservaActual);

    if (conflicto) {
      const mesasDisponibles = this.mesaService.consultarDisponibles(fecha, hora, comensales);
      throw new ReservaError(
        CodigoError.MESA_NO_DISPONIBLE,
        `La mesa ${mesa.numero} no está disponible en la fecha y hora seleccionadas`,
        undefined,
        mesasDisponibles
      );
    }
  }


  /**
   * Valida que los datos del cliente estén completos
   * Requirements: 1.4
   * 
   * @param cliente - Datos del cliente a validar
   * @throws ReservaError si faltan campos requeridos
   */
  private validarDatosCliente(cliente: DatosCliente): void {
    const camposFaltantes: Record<string, string> = {};

    if (!cliente.nombre || cliente.nombre.trim() === '') {
      camposFaltantes.nombre = 'El nombre es requerido';
    }

    if (!cliente.telefono || cliente.telefono.trim() === '') {
      camposFaltantes.telefono = 'El teléfono es requerido';
    }

    if (!cliente.email || cliente.email.trim() === '') {
      camposFaltantes.email = 'El email es requerido';
    }

    if (Object.keys(camposFaltantes).length > 0) {
      throw new ReservaError(
        CodigoError.DATOS_INCOMPLETOS,
        'Datos de contacto incompletos',
        camposFaltantes
      );
    }
  }

  /**
   * Valida que la fecha no sea anterior a la fecha actual
   * Requirements: 1.5
   * 
   * @param fecha - Fecha a validar
   * @throws ReservaError si la fecha es pasada
   */
  private validarFechaNoEsPasada(fecha: Date): void {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaReserva = new Date(fecha);
    fechaReserva.setHours(0, 0, 0, 0);

    if (fechaReserva < hoy) {
      throw new ReservaError(
        CodigoError.FECHA_INVALIDA,
        'La fecha de la reserva no puede ser anterior a la fecha actual'
      );
    }
  }

  /**
   * Verifica que una mesa específica esté disponible
   * Requirements: 1.3
   * 
   * @param mesaId - ID de la mesa a verificar
   * @param fecha - Fecha de la reserva
   * @param hora - Hora de la reserva
   * @param comensales - Número de comensales
   * @returns La mesa si está disponible
   * @throws ReservaError si la mesa no está disponible o no tiene capacidad suficiente
   */
  private verificarMesaEspecifica(
    mesaId: string,
    fecha: Date,
    hora: string,
    comensales: number
  ): Mesa {
    // Obtener todas las mesas disponibles para esa fecha/hora/comensales
    const mesasDisponibles = this.mesaService.consultarDisponibles(fecha, hora, comensales);

    // Buscar la mesa específica entre las disponibles
    const mesaEspecifica = mesasDisponibles.find((m) => m.id === mesaId);

    if (!mesaEspecifica) {
      // Verificar si la mesa existe pero no está disponible
      const fechaStr = fecha.toISOString().split('T')[0];
      const stmtMesa = this.db.prepare('SELECT id, numero, capacidad, activa FROM mesas WHERE id = ?');
      const mesa = stmtMesa.get(mesaId) as { id: string; numero: number; capacidad: number; activa: number } | undefined;

      if (!mesa) {
        throw new ReservaError(
          CodigoError.MESA_NO_DISPONIBLE,
          `La mesa especificada no existe`
        );
      }

      if (mesa.capacidad < comensales) {
        throw new ReservaError(
          CodigoError.CAPACIDAD_INSUFICIENTE,
          `La mesa ${mesa.numero} tiene capacidad para ${mesa.capacidad} personas, pero se requieren ${comensales}`,
          undefined,
          mesasDisponibles
        );
      }

      // La mesa existe pero está ocupada en esa franja horaria
      throw new ReservaError(
        CodigoError.MESA_NO_DISPONIBLE,
        `La mesa ${mesa.numero} no está disponible en la fecha y hora seleccionadas`,
        undefined,
        mesasDisponibles
      );
    }

    return mesaEspecifica;
  }

  /**
   * Genera un código de reserva único que no exista en la base de datos
   * Requirements: 1.2
   * 
   * @returns Código único de 8 caracteres
   */
  private generarCodigoUnico(): string {
    let codigo: string;
    let intentos = 0;
    const maxIntentos = 10;

    do {
      codigo = generarCodigoReserva();
      const stmt = this.db.prepare('SELECT codigo FROM reservas WHERE codigo = ?');
      const existe = stmt.get(codigo);

      if (!existe) {
        return codigo;
      }

      intentos++;
    } while (intentos < maxIntentos);

    // En caso extremadamente raro de colisiones repetidas
    throw new Error('No se pudo generar un código de reserva único');
  }

  /**
   * Cancela una reserva existente
   *
   * Requirements: 4.1, 4.2, 4.3
   *
   * @param codigo - Código de la reserva a cancelar
   * @returns Resultado de la cancelación indicando si hubo penalización
   * @throws ReservaError si la reserva no existe
   */
  cancelarReserva(codigo: string): ResultadoCancelacion {
    // 1. Buscar la reserva por código (validar que existe)
    // Requirements: 4.1
    const reserva = this.consultarReserva(codigo);

    // 2. Verificar si la cancelación es con menos de 1 hora de anticipación
    // Requirements: 4.3
    const penalizacion = this.esCancelacionTardia(reserva);

    // 3. Cambiar el estado de la reserva a 'cancelada'
    // Requirements: 4.1, 4.2
    const ahora = new Date();
    const stmt = this.db.prepare(`
      UPDATE reservas
      SET estado = 'cancelada', modificada_en = ?
      WHERE codigo = ?
    `);

    stmt.run(ahora.toISOString(), codigo);

    // 4. Retornar resultado indicando si hubo penalización
    const resultado: ResultadoCancelacion = {
      exito: true,
      mensaje: penalizacion
        ? 'Reserva cancelada con penalización por cancelación tardía (menos de 1 hora de anticipación)'
        : 'Reserva cancelada exitosamente',
      penalizacion,
    };

    return resultado;
  }

  /**
   * Verifica si la cancelación es con menos de 1 hora de anticipación
   * Requirements: 4.3
   *
   * @param reserva - Reserva a verificar
   * @returns true si la cancelación es tardía (menos de 1 hora)
   */
  private esCancelacionTardia(reserva: Reserva): boolean {
    const ahora = new Date();

    // Construir la fecha/hora de la reserva
    const fechaReserva = new Date(reserva.fecha);
    const [horas, minutos] = reserva.hora.split(':').map(Number);
    fechaReserva.setHours(horas, minutos, 0, 0);

    // Calcular la diferencia en milisegundos
    const diferencia = fechaReserva.getTime() - ahora.getTime();
    const unaHoraEnMs = 60 * 60 * 1000;

    return diferencia < unaHoraEnMs;
  }

  /**
   * Lista reservas aplicando filtros opcionales
   *
   * Requirements: 7.1, 7.2, 7.3, 7.4
   *
   * @param filtros - Filtros opcionales (fecha, estado, mesaId)
   * @returns Lista de reservas que cumplen con los filtros, ordenadas por hora ascendente
   */
  listarReservas(filtros: FiltrosReserva = {}): Reserva[] {
    // Construir la consulta SQL dinámicamente según los filtros
    let query = `
      SELECT 
        r.codigo, r.mesa_id, r.fecha, r.hora, r.comensales,
        r.nombre_cliente, r.telefono, r.email, r.estado,
        r.creada_en, r.modificada_en
      FROM reservas r
      WHERE 1=1
    `;

    const params: (string | number)[] = [];

    // Filtrar por fecha si se especifica
    // Requirements: 7.1, 7.2
    if (filtros.fecha) {
      const fechaStr = filtros.fecha.toISOString().split('T')[0];
      query += ' AND r.fecha = ?';
      params.push(fechaStr);
    }

    // Filtrar por estado si se especifica
    // Requirements: 7.3
    if (filtros.estado) {
      query += ' AND r.estado = ?';
      params.push(filtros.estado);
    }

    // Filtrar por mesaId si se especifica
    if (filtros.mesaId) {
      query += ' AND r.mesa_id = ?';
      params.push(filtros.mesaId);
    }

    // Ordenar por hora ascendente
    // Requirements: 7.1, 7.4
    query += ' ORDER BY r.hora ASC';

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as Array<{
      codigo: string;
      mesa_id: string;
      fecha: string;
      hora: string;
      comensales: number;
      nombre_cliente: string;
      telefono: string;
      email: string;
      estado: string;
      creada_en: string;
      modificada_en: string;
    }>;

    // Convertir las filas a objetos Reserva
    // Requirements: 7.4
    const reservas: Reserva[] = rows.map((row) => ({
      codigo: row.codigo,
      mesaId: row.mesa_id,
      fecha: new Date(row.fecha),
      hora: row.hora,
      comensales: row.comensales,
      cliente: {
        nombre: row.nombre_cliente,
        telefono: row.telefono,
        email: row.email,
      },
      estado: row.estado as 'confirmada' | 'cancelada' | 'completada' | 'no_show',
      creadaEn: new Date(row.creada_en),
      modificadaEn: new Date(row.modificada_en),
    }));

    return reservas;
  }

}
