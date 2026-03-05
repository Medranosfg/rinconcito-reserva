/**
 * Capa de persistencia SQLite para el sistema de reservas
 * "El Rinconcito de Anaga"
 *
 * Requirements: 8.1, 8.2
 */

import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

/**
 * Obtiene la instancia de la base de datos, creándola si no existe
 */
export function getDatabase(dbPath?: string): Database.Database {
  if (!db) {
    const resolvedPath = dbPath || process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'reservas.db');
    db = new Database(resolvedPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

/**
 * Inicializa el esquema de la base de datos
 * Crea las tablas si no existen
 */
export function initializeDatabase(dbPath?: string): Database.Database {
  const database = getDatabase(dbPath);

  // Tabla de mesas
  database.exec(`
    CREATE TABLE IF NOT EXISTS mesas (
      id TEXT PRIMARY KEY,
      numero INTEGER NOT NULL UNIQUE,
      capacidad INTEGER NOT NULL CHECK (capacidad > 0),
      activa INTEGER NOT NULL DEFAULT 1
    )
  `);

  // Tabla de reservas
  database.exec(`
    CREATE TABLE IF NOT EXISTS reservas (
      codigo TEXT PRIMARY KEY,
      mesa_id TEXT NOT NULL,
      fecha TEXT NOT NULL,
      hora TEXT NOT NULL,
      comensales INTEGER NOT NULL CHECK (comensales > 0),
      nombre_cliente TEXT NOT NULL,
      telefono TEXT NOT NULL,
      email TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'cancelada', 'completada', 'no_show')),
      creada_en TEXT NOT NULL,
      modificada_en TEXT NOT NULL,
      FOREIGN KEY (mesa_id) REFERENCES mesas(id)
    )
  `);

  // Índices para reservas
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_reservas_fecha ON reservas(fecha);
    CREATE INDEX IF NOT EXISTS idx_reservas_mesa_fecha ON reservas(mesa_id, fecha);
    CREATE INDEX IF NOT EXISTS idx_reservas_estado ON reservas(estado);
  `);

  // Tabla de horarios
  database.exec(`
    CREATE TABLE IF NOT EXISTS horarios (
      id TEXT PRIMARY KEY,
      dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
      hora_apertura TEXT NOT NULL,
      hora_cierre TEXT NOT NULL,
      activo INTEGER NOT NULL DEFAULT 1,
      UNIQUE(dia_semana)
    )
  `);

  // Tabla de días cerrados
  database.exec(`
    CREATE TABLE IF NOT EXISTS dias_cerrados (
      id TEXT PRIMARY KEY,
      fecha TEXT NOT NULL UNIQUE,
      motivo TEXT NOT NULL
    )
  `);

  return database;
}

/**
 * Cierra la conexión a la base de datos
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Reinicia la base de datos (útil para testing)
 * Elimina todas las tablas y las vuelve a crear
 */
export function resetDatabase(dbPath?: string): Database.Database {
  const database = getDatabase(dbPath);

  database.exec(`
    DROP TABLE IF EXISTS reservas;
    DROP TABLE IF EXISTS mesas;
    DROP TABLE IF EXISTS horarios;
    DROP TABLE IF EXISTS dias_cerrados;
  `);

  return initializeDatabase(dbPath);
}

/**
 * Crea una base de datos en memoria (útil para testing)
 */
export function createInMemoryDatabase(): Database.Database {
  const memDb = new Database(':memory:');
  memDb.pragma('foreign_keys = ON');

  // Crear tablas
  memDb.exec(`
    CREATE TABLE mesas (
      id TEXT PRIMARY KEY,
      numero INTEGER NOT NULL UNIQUE,
      capacidad INTEGER NOT NULL CHECK (capacidad > 0),
      activa INTEGER NOT NULL DEFAULT 1
    )
  `);

  memDb.exec(`
    CREATE TABLE reservas (
      codigo TEXT PRIMARY KEY,
      mesa_id TEXT NOT NULL,
      fecha TEXT NOT NULL,
      hora TEXT NOT NULL,
      comensales INTEGER NOT NULL CHECK (comensales > 0),
      nombre_cliente TEXT NOT NULL,
      telefono TEXT NOT NULL,
      email TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'cancelada', 'completada', 'no_show')),
      creada_en TEXT NOT NULL,
      modificada_en TEXT NOT NULL,
      FOREIGN KEY (mesa_id) REFERENCES mesas(id)
    )
  `);

  memDb.exec(`
    CREATE INDEX idx_reservas_fecha ON reservas(fecha);
    CREATE INDEX idx_reservas_mesa_fecha ON reservas(mesa_id, fecha);
    CREATE INDEX idx_reservas_estado ON reservas(estado);
  `);

  memDb.exec(`
    CREATE TABLE horarios (
      id TEXT PRIMARY KEY,
      dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
      hora_apertura TEXT NOT NULL,
      hora_cierre TEXT NOT NULL,
      activo INTEGER NOT NULL DEFAULT 1,
      UNIQUE(dia_semana)
    )
  `);

  memDb.exec(`
    CREATE TABLE dias_cerrados (
      id TEXT PRIMARY KEY,
      fecha TEXT NOT NULL UNIQUE,
      motivo TEXT NOT NULL
    )
  `);

  return memDb;
}
