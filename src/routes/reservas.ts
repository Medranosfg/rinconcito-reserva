/**
 * Rutas de la API de reservas
 * "El Rinconcito de Anaga"
 *
 * Requirements: 1.2, 2.1, 3.1, 4.1, 7.1
 */

import { Router, Request, Response, NextFunction } from 'express';
import Database from 'better-sqlite3';
import { ReservaService, ReservaError, CodigoError } from '../services/ReservaService';
import { DatosReserva, CambiosReserva, FiltrosReserva, EstadoReserva } from '../models/types';
import { enviarSmsConfirmacion, enviarSmsCancelacion, DatosReservaSms } from '../services/SmsService';

const router = Router();
let reservaService: ReservaService;

export function initReservasRouter(db: Database.Database): Router {
  reservaService = new ReservaService(db);
  return router;
}

function getHttpStatusCode(codigo: CodigoError): number {
  switch (codigo) {
    case CodigoError.DATOS_INCOMPLETOS:
    case CodigoError.FECHA_INVALIDA:
    case CodigoError.FUERA_DE_HORARIO:
    case CodigoError.MODIFICACION_TARDIA:
      return 400;
    case CodigoError.RESERVA_NO_ENCONTRADA:
      return 404;
    case CodigoError.MESA_NO_DISPONIBLE:
    case CodigoError.DIA_CERRADO:
    case CodigoError.CAPACIDAD_INSUFICIENTE:
      return 409;
    default:
      return 500;
  }
}

function formatearReserva(reserva: ReturnType<ReservaService['consultarReserva']>) {
  return {
    codigo: reserva.codigo,
    mesaId: reserva.mesaId,
    fecha: reserva.fecha.toISOString().split('T')[0],
    hora: reserva.hora,
    comensales: reserva.comensales,
    cliente: reserva.cliente,
    estado: reserva.estado,
    creadaEn: reserva.creadaEn.toISOString(),
    modificadaEn: reserva.modificadaEn.toISOString(),
  };
}


// POST /api/reservas - Crear nueva reserva
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fecha, hora, comensales, cliente, mesaId } = req.body;
    if (!fecha || !hora || !comensales || !cliente) {
      return res.status(400).json({
        codigo: 'DATOS_INCOMPLETOS',
        mensaje: 'Faltan campos requeridos: fecha, hora, comensales, cliente',
      });
    }
    const datosReserva: DatosReserva = {
      fecha: new Date(fecha),
      hora,
      comensales: Number(comensales),
      cliente: { nombre: cliente.nombre || '', telefono: cliente.telefono || '', email: cliente.email || '' },
      mesaId,
    };
    const reserva = reservaService.crearReserva(datosReserva);
    
    // No enviar SMS automático - solo al confirmar o rechazar
    
    return res.status(201).json({ mensaje: 'Reserva creada exitosamente', ...formatearReserva(reserva) });
  } catch (error) {
    if (error instanceof ReservaError) {
      return res.status(getHttpStatusCode(error.codigo)).json({
        codigo: error.codigo, mensaje: error.message,
        ...(error.detalles && { detalles: error.detalles }),
        ...(error.alternativas && { alternativas: error.alternativas.map((m) => ({ id: m.id, numero: m.numero, capacidad: m.capacidad })) }),
      });
    }
    next(error);
  }
});

// GET /api/reservas/:codigo - Consultar reserva por código
router.get('/:codigo', (req: Request, res: Response, next: NextFunction) => {
  try {
    const reserva = reservaService.consultarReserva(req.params.codigo);
    return res.status(200).json(formatearReserva(reserva));
  } catch (error) {
    if (error instanceof ReservaError) {
      return res.status(getHttpStatusCode(error.codigo)).json({ codigo: error.codigo, mensaje: error.message });
    }
    next(error);
  }
});

// POST /api/reservas/:codigo/confirmar - Confirmar reserva pendiente
router.post('/:codigo/confirmar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reserva = reservaService.confirmarReserva(req.params.codigo);
    
    // Enviar SMS de confirmación
    const datosSms: DatosReservaSms = {
      codigo: reserva.codigo,
      fecha: reserva.fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
      hora: reserva.hora,
      comensales: reserva.comensales,
      nombreCliente: reserva.cliente.nombre,
      telefono: reserva.cliente.telefono
    };
    await enviarSmsConfirmacion(datosSms);
    
    return res.status(200).json({ mensaje: 'Reserva confirmada exitosamente', ...formatearReserva(reserva) });
  } catch (error) {
    if (error instanceof ReservaError) {
      return res.status(getHttpStatusCode(error.codigo)).json({ codigo: error.codigo, mensaje: error.message });
    }
    next(error);
  }
});

// PUT /api/reservas/:codigo - Modificar reserva existente
router.put('/:codigo', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fecha, hora, comensales, mesaId } = req.body;
    const cambios: CambiosReserva = {};
    if (fecha !== undefined) cambios.fecha = new Date(fecha);
    if (hora !== undefined) cambios.hora = hora;
    if (comensales !== undefined) cambios.comensales = Number(comensales);
    if (mesaId !== undefined) cambios.mesaId = mesaId;
    const reserva = reservaService.modificarReserva(req.params.codigo, cambios);
    return res.status(200).json({ mensaje: 'Reserva modificada exitosamente', reserva: formatearReserva(reserva) });
  } catch (error) {
    if (error instanceof ReservaError) {
      return res.status(getHttpStatusCode(error.codigo)).json({
        codigo: error.codigo, mensaje: error.message,
        ...(error.detalles && { detalles: error.detalles }),
        ...(error.alternativas && { alternativas: error.alternativas.map((m) => ({ id: m.id, numero: m.numero, capacidad: m.capacidad })) }),
      });
    }
    next(error);
  }
});

// DELETE /api/reservas/:codigo - Cancelar reserva
router.delete('/:codigo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Obtener datos antes de cancelar para el SMS
    const reservaAntes = reservaService.consultarReserva(req.params.codigo);
    const resultado = reservaService.cancelarReserva(req.params.codigo);
    
    // Obtener motivo del rechazo si existe
    const motivo = req.body?.motivo;
    const canceladoPorCliente = req.body?.canceladoPorCliente;
    
    // Si fue cancelada por el cliente, no enviar SMS (el cliente ya sabe)
    // Solo loguear para notificar al restaurante
    if (canceladoPorCliente) {
      console.log(`⚠️ CANCELACIÓN POR CLIENTE - Código: ${reservaAntes.codigo}, Cliente: ${reservaAntes.cliente.nombre}, Fecha: ${reservaAntes.fecha.toLocaleDateString('es-ES')}, Hora: ${reservaAntes.hora}`);
    } else {
      // Si fue cancelada por el restaurante, enviar SMS al cliente
      const datosSms: DatosReservaSms = {
        codigo: reservaAntes.codigo,
        fecha: reservaAntes.fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
        hora: reservaAntes.hora,
        comensales: reservaAntes.comensales,
        nombreCliente: reservaAntes.cliente.nombre,
        telefono: reservaAntes.cliente.telefono
      };
      await enviarSmsCancelacion(datosSms, motivo);
    }
    
    return res.status(200).json({ mensaje: resultado.mensaje, penalizacion: resultado.penalizacion });
  } catch (error) {
    if (error instanceof ReservaError) {
      return res.status(getHttpStatusCode(error.codigo)).json({ codigo: error.codigo, mensaje: error.message });
    }
    next(error);
  }
});

// GET /api/reservas - Listar reservas con filtros
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fecha, estado, mesaId } = req.query;
    const filtros: FiltrosReserva = {};
    if (fecha) filtros.fecha = new Date(fecha as string);
    if (estado) filtros.estado = estado as EstadoReserva;
    if (mesaId) filtros.mesaId = mesaId as string;
    const reservas = reservaService.listarReservas(filtros);
    return res.status(200).json({ total: reservas.length, reservas: reservas.map(formatearReserva) });
  } catch (error) {
    if (error instanceof ReservaError) {
      return res.status(getHttpStatusCode(error.codigo)).json({ codigo: error.codigo, mensaje: error.message });
    }
    next(error);
  }
});

export default router;
