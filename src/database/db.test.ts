/**
 * Tests para la capa de persistencia SQLite
 *
 * Requirements: 8.1, 8.2
 */

// Tests para la capa de persistencia SQLite
import Database from 'better-sqlite3';
import { createInMemoryDatabase } from './db';

describe('Database - Inicialización', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createInMemoryDatabase();
  });

  afterEach(() => {
    db.close();
  });

  it('debe crear la tabla mesas con las columnas correctas', () => {
    const tableInfo = db.prepare("PRAGMA table_info(mesas)").all() as Array<{
      name: string;
      type: string;
      notnull: number;
      pk: number;
    }>;

    const columns = tableInfo.map((col) => col.name);
    expect(columns).toContain('id');
    expect(columns).toContain('numero');
    expect(columns).toContain('capacidad');
    expect(columns).toContain('activa');
  });

  it('debe crear la tabla reservas con las columnas correctas', () => {
    const tableInfo = db.prepare("PRAGMA table_info(reservas)").all() as Array<{
      name: string;
      type: string;
      notnull: number;
      pk: number;
    }>;

    const columns = tableInfo.map((col) => col.name);
    expect(columns).toContain('codigo');
    expect(columns).toContain('mesa_id');
    expect(columns).toContain('fecha');
    expect(columns).toContain('hora');
    expect(columns).toContain('comensales');
    expect(columns).toContain('nombre_cliente');
    expect(columns).toContain('telefono');
    expect(columns).toContain('email');
    expect(columns).toContain('estado');
    expect(columns).toContain('creada_en');
    expect(columns).toContain('modificada_en');
  });

  it('debe crear la tabla horarios con las columnas correctas', () => {
    const tableInfo = db.prepare("PRAGMA table_info(horarios)").all() as Array<{
      name: string;
      type: string;
      notnull: number;
      pk: number;
    }>;

    const columns = tableInfo.map((col) => col.name);
    expect(columns).toContain('id');
    expect(columns).toContain('dia_semana');
    expect(columns).toContain('hora_apertura');
    expect(columns).toContain('hora_cierre');
    expect(columns).toContain('activo');
  });

  it('debe crear la tabla dias_cerrados con las columnas correctas', () => {
    const tableInfo = db.prepare("PRAGMA table_info(dias_cerrados)").all() as Array<{
      name: string;
      type: string;
      notnull: number;
      pk: number;
    }>;

    const columns = tableInfo.map((col) => col.name);
    expect(columns).toContain('id');
    expect(columns).toContain('fecha');
    expect(columns).toContain('motivo');
  });

  it('debe permitir insertar y recuperar una mesa', () => {
    const insertStmt = db.prepare(
      'INSERT INTO mesas (id, numero, capacidad, activa) VALUES (?, ?, ?, ?)'
    );
    insertStmt.run('mesa-1', 1, 4, 1);

    const selectStmt = db.prepare('SELECT * FROM mesas WHERE id = ?');
    const mesa = selectStmt.get('mesa-1') as {
      id: string;
      numero: number;
      capacidad: number;
      activa: number;
    };

    expect(mesa.id).toBe('mesa-1');
    expect(mesa.numero).toBe(1);
    expect(mesa.capacidad).toBe(4);
    expect(mesa.activa).toBe(1);
  });

  it('debe permitir insertar y recuperar una reserva', () => {
    // Primero insertar una mesa
    db.prepare('INSERT INTO mesas (id, numero, capacidad, activa) VALUES (?, ?, ?, ?)').run(
      'mesa-1',
      1,
      4,
      1
    );

    const now = new Date().toISOString();
    const insertStmt = db.prepare(`
      INSERT INTO reservas (codigo, mesa_id, fecha, hora, comensales, nombre_cliente, telefono, email, estado, creada_en, modificada_en)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertStmt.run(
      'ABC12345',
      'mesa-1',
      '2024-12-25',
      '20:00',
      4,
      'Juan Pérez',
      '123456789',
      'juan@email.com',
      'pendiente',
      now,
      now
    );

    const selectStmt = db.prepare('SELECT * FROM reservas WHERE codigo = ?');
    const reserva = selectStmt.get('ABC12345') as {
      codigo: string;
      mesa_id: string;
      fecha: string;
      hora: string;
      comensales: number;
      nombre_cliente: string;
      telefono: string;
      email: string;
      estado: string;
    };

    expect(reserva.codigo).toBe('ABC12345');
    expect(reserva.mesa_id).toBe('mesa-1');
    expect(reserva.fecha).toBe('2024-12-25');
    expect(reserva.hora).toBe('20:00');
    expect(reserva.comensales).toBe(4);
    expect(reserva.nombre_cliente).toBe('Juan Pérez');
    expect(reserva.estado).toBe('pendiente');
  });

  it('debe rechazar capacidad de mesa <= 0', () => {
    const insertStmt = db.prepare(
      'INSERT INTO mesas (id, numero, capacidad, activa) VALUES (?, ?, ?, ?)'
    );

    expect(() => insertStmt.run('mesa-bad', 99, 0, 1)).toThrow();
    expect(() => insertStmt.run('mesa-bad', 99, -1, 1)).toThrow();
  });

  it('debe rechazar estados de reserva inválidos', () => {
    db.prepare('INSERT INTO mesas (id, numero, capacidad, activa) VALUES (?, ?, ?, ?)').run(
      'mesa-1',
      1,
      4,
      1
    );

    const now = new Date().toISOString();
    const insertStmt = db.prepare(`
      INSERT INTO reservas (codigo, mesa_id, fecha, hora, comensales, nombre_cliente, telefono, email, estado, creada_en, modificada_en)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    expect(() =>
      insertStmt.run(
        'ABC12345',
        'mesa-1',
        '2024-12-25',
        '20:00',
        4,
        'Juan',
        '123',
        'j@e.com',
        'estado_invalido',
        now,
        now
      )
    ).toThrow();
  });

  it('debe rechazar día de semana fuera de rango en horarios', () => {
    const insertStmt = db.prepare(
      'INSERT INTO horarios (id, dia_semana, hora_apertura, hora_cierre, activo) VALUES (?, ?, ?, ?, ?)'
    );

    expect(() => insertStmt.run('h-1', -1, '12:00', '23:00', 1)).toThrow();
    expect(() => insertStmt.run('h-2', 7, '12:00', '23:00', 1)).toThrow();
  });

  it('debe permitir insertar horarios válidos', () => {
    const insertStmt = db.prepare(
      'INSERT INTO horarios (id, dia_semana, hora_apertura, hora_cierre, activo) VALUES (?, ?, ?, ?, ?)'
    );
    insertStmt.run('h-lunes', 1, '12:00', '23:00', 1);

    const selectStmt = db.prepare('SELECT * FROM horarios WHERE id = ?');
    const horario = selectStmt.get('h-lunes') as {
      id: string;
      dia_semana: number;
      hora_apertura: string;
      hora_cierre: string;
      activo: number;
    };

    expect(horario.dia_semana).toBe(1);
    expect(horario.hora_apertura).toBe('12:00');
    expect(horario.hora_cierre).toBe('23:00');
  });

  it('debe permitir insertar días cerrados', () => {
    const insertStmt = db.prepare(
      'INSERT INTO dias_cerrados (id, fecha, motivo) VALUES (?, ?, ?)'
    );
    insertStmt.run('dc-1', '2024-12-25', 'Navidad');

    const selectStmt = db.prepare('SELECT * FROM dias_cerrados WHERE id = ?');
    const diaCerrado = selectStmt.get('dc-1') as {
      id: string;
      fecha: string;
      motivo: string;
    };

    expect(diaCerrado.fecha).toBe('2024-12-25');
    expect(diaCerrado.motivo).toBe('Navidad');
  });

  it('debe aplicar foreign key constraint en reservas', () => {
    const now = new Date().toISOString();
    const insertStmt = db.prepare(`
      INSERT INTO reservas (codigo, mesa_id, fecha, hora, comensales, nombre_cliente, telefono, email, estado, creada_en, modificada_en)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Intentar insertar reserva con mesa_id que no existe
    expect(() =>
      insertStmt.run(
        'ABC12345',
        'mesa-inexistente',
        '2024-12-25',
        '20:00',
        4,
        'Juan',
        '123',
        'j@e.com',
        'confirmada',
        now,
        now
      )
    ).toThrow();
  });
});
