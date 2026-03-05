/**
 * Módulo de errores personalizados para el sistema de reservas
 * "El Rinconcito de Anaga"
 *
 * Requirements: 1.3, 1.4, 1.5, 2.2, 5.4
 */

import { Mesa } from '../models/types';

/**
 * Códigos de error del sistema
 * Cada código representa un tipo específico de error de negocio
 */
export enum CodigoError {
  /** La reserva con el código especificado no existe */
  RESERVA_NO_ENCONTRADA = 'RESERVA_NO_ENCONTRADA',
  /** La mesa no está disponible en la franja solicitada */
  MESA_NO_DISPONIBLE = 'MESA_NO_DISPONIBLE',
  /** La fecha es anterior a la fecha actual */
  FECHA_INVALIDA = 'FECHA_INVALIDA',
  /** Faltan campos requeridos en los datos del cliente */
  DATOS_INCOMPLETOS = 'DATOS_INCOMPLETOS',
  /** La hora solicitada está fuera del horario de apertura */
  FUERA_DE_HORARIO = 'FUERA_DE_HORARIO',
  /** El restaurante está cerrado en la fecha solicitada */
  DIA_CERRADO = 'DIA_CERRADO',
  /** La mesa tiene reservas futuras y no puede eliminarse */
  MESA_CON_RESERVAS = 'MESA_CON_RESERVAS',
  /** La modificación se solicita con menos de 2 horas de anticipación */
  MODIFICACION_TARDIA = 'MODIFICACION_TARDIA',
  /** No hay mesas disponibles para el número de comensales */
  CAPACIDAD_INSUFICIENTE = 'CAPACIDAD_INSUFICIENTE',
}

/**
 * Clase base de errores de la aplicación
 * Extiende Error nativo con información adicional para manejo estructurado
 */
export class AppError extends Error {
  /** Código de error para identificación programática */
  codigo: CodigoError;
  /** Detalles adicionales del error (campos faltantes, etc.) */
  detalles?: Record<string, string>;
  /** Alternativas disponibles (mesas alternativas, etc.) */
  alternativas?: Mesa[];

  constructor(
    codigo: CodigoError,
    mensaje: string,
    detalles?: Record<string, string>,
    alternativas?: Mesa[]
  ) {
    super(mensaje);
    this.name = 'AppError';
    this.codigo = codigo;
    this.detalles = detalles;
    this.alternativas = alternativas;
    
    // Mantener el stack trace correcto en V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Error específico para operaciones de reservas
 * Hereda de AppError para mantener compatibilidad con código existente
 */
export class ReservaError extends AppError {
  constructor(
    codigo: CodigoError,
    mensaje: string,
    detalles?: Record<string, string>,
    alternativas?: Mesa[]
  ) {
    super(codigo, mensaje, detalles, alternativas);
    this.name = 'ReservaError';
  }
}

/**
 * Error específico para operaciones de mesas
 */
export class MesaError extends AppError {
  constructor(
    codigo: CodigoError,
    mensaje: string,
    detalles?: Record<string, string>
  ) {
    super(codigo, mensaje, detalles);
    this.name = 'MesaError';
  }
}

/**
 * Error específico para operaciones de disponibilidad
 */
export class DisponibilidadError extends AppError {
  constructor(
    codigo: CodigoError,
    mensaje: string,
    detalles?: Record<string, string>
  ) {
    super(codigo, mensaje, detalles);
    this.name = 'DisponibilidadError';
  }
}
