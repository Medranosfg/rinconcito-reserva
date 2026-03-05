/**
 * Rutas de la API de disponibilidad
 * Requirements: 6.1, 6.2, 6.3
 */

import { Router, Request, Response, NextFunction } from 'express';
import Database from 'better-sqlite3';
import { DisponibilidadService } from '../services/DisponibilidadService';
import { Horario } from '../models/types';

const router = Router();
let disponibilidadService: DisponibilidadService;

export function initDisponibilidadRouter(db: Database.Database): Router {
  disponibilidadService = new DisponibilidadService(db);
  return router;
}

// GET /api/disponibilidad/:fecha - Consultar disponibilidad de una fecha
router.get('/:fecha', (req: Request, res: Response) => {
  const fecha = new Date(req.params.fecha);
  const disponibilidad = disponibilidadService.consultarDisponibilidad(fecha);
  res.status(200).json({
    fecha: fecha.toISOString().split('T')[0],
    abierto: disponibilidad.abierto,
    horario: disponibilidad.horario,
    motivoCierre: disponibilidad.motivoCierre,
  });
});

// PUT /api/disponibilidad/horario - Configurar horario de apertura (admin)
router.put('/horario', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { diaSemana, horaApertura, horaCierre, activo } = req.body;
    if (diaSemana === undefined || !horaApertura || !horaCierre) {
      return res.status(400).json({ codigo: 'DATOS_INCOMPLETOS', mensaje: 'Faltan campos: diaSemana, horaApertura, horaCierre' });
    }
    const horario: Horario = { diaSemana: Number(diaSemana), horaApertura, horaCierre, activo: activo !== false };
    disponibilidadService.configurarHorario(horario);
    return res.status(200).json({ mensaje: 'Horario configurado exitosamente', horario });
  } catch (error) {
    next(error);
  }
});

// POST /api/disponibilidad/cierre - Marcar día como cerrado (admin)
router.post('/cierre', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fecha, motivo } = req.body;
    if (!fecha || !motivo) {
      return res.status(400).json({ codigo: 'DATOS_INCOMPLETOS', mensaje: 'Faltan campos: fecha, motivo' });
    }
    disponibilidadService.marcarDiaCerrado(new Date(fecha), motivo);
    return res.status(201).json({ mensaje: 'Día marcado como cerrado', fecha, motivo });
  } catch (error) {
    next(error);
  }
});

// GET /api/disponibilidad/horarios - Obtener todos los horarios
router.get('/config/horarios', (_req: Request, res: Response) => {
  const horarios = disponibilidadService.obtenerHorarios();
  res.status(200).json({ horarios });
});

// GET /api/disponibilidad/dias-cerrados - Obtener días cerrados
router.get('/config/dias-cerrados', (_req: Request, res: Response) => {
  const diasCerrados = disponibilidadService.obtenerDiasCerrados();
  res.status(200).json({ diasCerrados: diasCerrados.map(d => ({ ...d, fecha: d.fecha.toISOString().split('T')[0] })) });
});

export default router;
