/**
 * Interfaces y tipos para el sistema de reservas del restaurante
 * "El Rinconcito de Anaga"
 *
 * Requirements: 8.3
 */

/**
 * Representa una mesa del restaurante
 */
export interface Mesa {
  id: string;
  numero: number;
  capacidad: number;
  activa: boolean;
}

/**
 * Datos de contacto del cliente
 */
export interface DatosCliente {
  nombre: string;
  telefono: string;
  email: string;
}

/**
 * Estados posibles de una reserva
 */
export type EstadoReserva = 'pendiente' | 'confirmada' | 'cancelada' | 'completada' | 'no_show';

/**
 * Representa una reserva de mesa
 */
export interface Reserva {
  codigo: string;
  mesaId: string;
  fecha: Date;
  hora: string;
  comensales: number;
  cliente: DatosCliente;
  estado: EstadoReserva;
  creadaEn: Date;
  modificadaEn: Date;
}

/**
 * Horario de apertura del restaurante para un día de la semana
 */
export interface Horario {
  diaSemana: number; // 0-6 (domingo-sábado)
  horaApertura: string; // "HH:mm"
  horaCierre: string; // "HH:mm"
  activo: boolean;
}

/**
 * Representa un día en que el restaurante está cerrado
 */
export interface DiaCerrado {
  id: string;
  fecha: Date;
  motivo: string;
}

/**
 * Datos necesarios para crear una nueva reserva
 */
export interface DatosReserva {
  fecha: Date;
  hora: string;
  comensales: number;
  cliente: DatosCliente;
  mesaId?: string; // Opcional, se puede asignar automáticamente
}

/**
 * Filtros para consultar reservas
 */
export interface FiltrosReserva {
  fecha?: Date;
  estado?: EstadoReserva;
  mesaId?: string;
}

/**
 * Datos necesarios para crear una nueva mesa
 */
export interface DatosMesa {
  numero: number;
  capacidad: number;
  activa?: boolean;
}

/**
 * Datos para modificar una mesa existente
 */
export interface CambiosMesa {
  numero?: number;
  capacidad?: number;
  activa?: boolean;
}

/**
 * Resultado de una operación de eliminación
 */
export interface ResultadoEliminacion {
  exito: boolean;
  mensaje: string;
  reservasAfectadas?: string[]; // Códigos de reservas que impiden la eliminación
}

/**
 * Información de disponibilidad para una fecha específica
 */
export interface Disponibilidad {
  fecha: Date;
  abierto: boolean;
  horario: Horario | null;
  motivoCierre?: string;
}


/**
 * Datos para modificar una reserva existente
 */
export interface CambiosReserva {
  fecha?: Date;
  hora?: string;
  comensales?: number;
  mesaId?: string;
}


/**
 * Resultado de una operación de cancelación de reserva
 * Requirements: 4.1, 4.2, 4.3
 */
export interface ResultadoCancelacion {
  exito: boolean;
  mensaje: string;
  penalizacion?: boolean;
}

