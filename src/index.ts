// Sistema de Reservas - El Rinconcito de Anaga
// Punto de entrada de la aplicación

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { initializeDatabase, getDatabase } from './database/db';
import { initReservasRouter } from './routes/reservas';
import { initMesasRouter } from './routes/mesas';
import { initDisponibilidadRouter } from './routes/disponibilidad';
import { AppError, CodigoError } from './utils/errors';
import { Mesa } from './models/types';

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middleware
// ============================================

// JSON parser
app.use(express.json());

// CORS - permitir peticiones desde cualquier origen
app.use(cors());

// Servir archivos estáticos (interfaz web)
app.use(express.static(path.join(__dirname, '..', 'public')));

// ============================================
// Rutas de la API
// ============================================

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Sistema de Reservas funcionando' });
});

// Rutas de reservas
const db = getDatabase();
app.use('/api/reservas', initReservasRouter(db));

// Rutas de mesas
app.use('/api/mesas', initMesasRouter(db));

// Rutas de disponibilidad
app.use('/api/disponibilidad', initDisponibilidadRouter(db));

// ============================================
// Manejo de errores global
// ============================================

/**
 * Interfaz de respuesta de error según el diseño
 * Requirements: 1.3
 */
interface ErrorResponse {
  codigo: string;
  mensaje: string;
  detalles?: Record<string, string>;
  alternativas?: Mesa[];
}

/**
 * Mapea códigos de error de la aplicación a códigos HTTP apropiados
 */
function mapearCodigoErrorAHttp(codigo: CodigoError): number {
  switch (codigo) {
    case CodigoError.RESERVA_NO_ENCONTRADA:
      return 404;
    case CodigoError.MESA_NO_DISPONIBLE:
      return 409; // Conflict
    case CodigoError.FECHA_INVALIDA:
      return 400;
    case CodigoError.DATOS_INCOMPLETOS:
      return 400;
    case CodigoError.FUERA_DE_HORARIO:
      return 400;
    case CodigoError.DIA_CERRADO:
      return 400;
    case CodigoError.MESA_CON_RESERVAS:
      return 409; // Conflict
    case CodigoError.MODIFICACION_TARDIA:
      return 400;
    case CodigoError.CAPACIDAD_INSUFICIENTE:
      return 400;
    default:
      return 500;
  }
}

/**
 * Middleware de manejo de errores
 * Detecta errores de la aplicación (AppError) y formatea la respuesta según el diseño
 * Requirements: 1.3
 */
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);

  // Verificar si es un error de la aplicación
  if (err instanceof AppError) {
    const statusCode = mapearCodigoErrorAHttp(err.codigo);
    
    const errorResponse: ErrorResponse = {
      codigo: err.codigo,
      mensaje: err.message,
    };

    // Incluir detalles si existen
    if (err.detalles) {
      errorResponse.detalles = err.detalles;
    }

    // Incluir alternativas cuando aplique (para errores de disponibilidad)
    if (err.alternativas && err.alternativas.length > 0) {
      errorResponse.alternativas = err.alternativas;
    }

    return res.status(statusCode).json(errorResponse);
  }

  // Error genérico no controlado
  const errorResponse: ErrorResponse = {
    codigo: 'ERROR_INTERNO',
    mensaje: 'Ha ocurrido un error interno en el servidor',
  };

  res.status(500).json(errorResponse);
});

// ============================================
// Inicialización del servidor
// ============================================

async function startServer(): Promise<void> {
  try {
    // Inicializar base de datos
    console.log('Inicializando base de datos...');
    initializeDatabase();
    console.log('Base de datos inicializada correctamente');

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Solo iniciar si no estamos en modo test
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
export { startServer };
