/**
 * Rutas de la API de mesas
 * Requirements: 1.1, 5.1, 5.2, 5.3
 */

import { Router, Request, Response, NextFunction } from 'express';
import Database from 'better-sqlite3';
import { MesaService } from '../services/MesaService';
import { DatosMesa, CambiosMesa } from '../models/types';

const router = Router();
let mesaService: MesaService;

export function initMesasRouter(db: Database.Database): Router {
  mesaService = new MesaService(db);
  return router;
}

// GET /api/mesas - Listar todas las mesas
router.get('/', (_req: Request, res: Response) => {
  const mesas = mesaService.listarMesas();
  res.status(200).json({ total: mesas.length, mesas });
});

// GET /api/mesas/disponibles - Consultar mesas disponibles
router.get('/disponibles', (req: Request, res: Response) => {
  const { fecha, hora, comensales } = req.query;
  if (!fecha || !hora || !comensales) {
    return res.status(400).json({ codigo: 'DATOS_INCOMPLETOS', mensaje: 'Faltan parámetros: fecha, hora, comensales' });
  }
  const mesas = mesaService.consultarDisponibles(new Date(fecha as string), hora as string, Number(comensales));
  return res.status(200).json({ total: mesas.length, mesas });
});

// POST /api/mesas - Crear mesa (admin)
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { numero, capacidad, activa } = req.body;
    if (!numero || !capacidad) {
      return res.status(400).json({ codigo: 'DATOS_INCOMPLETOS', mensaje: 'Faltan campos: numero, capacidad' });
    }
    const datos: DatosMesa = { numero: Number(numero), capacidad: Number(capacidad), activa };
    const mesa = mesaService.crearMesa(datos);
    return res.status(201).json({ mensaje: 'Mesa creada exitosamente', mesa });
  } catch (error) {
    next(error);
  }
});

// PUT /api/mesas/:id - Modificar mesa (admin)
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { numero, capacidad, activa } = req.body;
    const cambios: CambiosMesa = {};
    if (numero !== undefined) cambios.numero = Number(numero);
    if (capacidad !== undefined) cambios.capacidad = Number(capacidad);
    if (activa !== undefined) cambios.activa = activa;
    const mesa = mesaService.modificarMesa(req.params.id, cambios);
    return res.status(200).json({ mensaje: 'Mesa modificada exitosamente', mesa });
  } catch (error) {
    if (error instanceof Error && error.message.includes('no encontrada')) {
      return res.status(404).json({ codigo: 'MESA_NO_ENCONTRADA', mensaje: error.message });
    }
    next(error);
  }
});

// DELETE /api/mesas/:id - Eliminar mesa (admin)
router.delete('/:id', (req: Request, res: Response) => {
  const resultado = mesaService.eliminarMesa(req.params.id);
  if (!resultado.exito) {
    const status = resultado.mensaje.includes('no encontrada') ? 404 : 409;
    return res.status(status).json({ codigo: 'ERROR_ELIMINACION', mensaje: resultado.mensaje, reservasAfectadas: resultado.reservasAfectadas });
  }
  return res.status(200).json({ mensaje: resultado.mensaje });
});

export default router;
