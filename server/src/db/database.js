import { DatabaseSync } from 'node:sqlite';
import pkg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import config from '../config.js';

const { Pool } = pkg;

/**
 * Unified async database abstraction supporting two backends:
 *   - PostgreSQL (when config.databaseUrl is set)
 *   - SQLite via node:sqlite (otherwise)
 *
 * All public methods are async and share the same signature so repository
 * code never has to know which backend is active.
 *
 * Conventions kept identical across both engines (to avoid dialect drift):
 *   - Booleans are stored as INTEGER 0/1.
 *   - Timestamps are stored as BIGINT Unix epoch milliseconds.
 */
class Database {
  constructor() {
    this.isPg = Boolean(config.databaseUrl);
    if (this.isPg) {
      this.pool = new Pool({ connectionString: config.databaseUrl });
    } else {
      const dbPath = path.resolve(config.serverRoot, config.sqlitePath);
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
      this.sqlite = new DatabaseSync(dbPath);
    }
    this._transactionDepth = 0;
  }

  async testConnection() {
    if (this.isPg) {
      await this.pool.query('SELECT 1');
    } else {
      this.sqlite.prepare('SELECT 1').get();
    }
  }

  async close() {
    if (this.isPg) await this.pool.end();
    else this.sqlite.close();
  }

  // Escape LIKE special characters in a user-supplied term.
  escapeLike(s) {
    return String(s).replace(/[\\%_]/g, (c) => '\\' + c);
  }

  // SQL fragment for a case-insensitive "contains" match.
  // Postgres needs ILIKE (with explicit escape); SQLite LIKE is ASCII-CI by default.
  containsOperator() {
    return this.isPg ? 'ILIKE' : 'LIKE';
  }

  // Convert SQLite-style `?` placeholders to Postgres `$1, $2, ...`.
  // Our repository SQL only uses `?` as parameter placeholders (never inside
  // literals), so a simple ordered replacement is safe.
  static toPg(sql) {
    let i = 0;
    return sql.replace(/\?/g, () => `$${++i}`);
  }

  /**
   * Run a write query (INSERT/UPDATE/DELETE).
   * Returns { changes, lastInsertRowid }.
   */
  async run(sql, params = []) {
    if (this.isPg) {
      const r = await this.pool.query(Database.toPg(sql), params);
      return { changes: r.rowCount || 0, lastInsertRowid: null };
    }
    const stmt = this.sqlite.prepare(sql);
    const info = stmt.run(...params);
    return { changes: Number(info.changes), lastInsertRowid: Number(info.lastInsertRowid) };
  }

  /**
   * Insert a single row and return its generated id.
   * Works on both backends without RETURNING clauses in the caller's SQL.
   */
  async insertRowId(sql, params = []) {
    if (this.isPg) {
      const r = await this.pool.query(`${Database.toPg(sql)} RETURNING id`, params);
      return Number(r.rows[0]?.id ?? 0);
    }
    const info = this.sqlite.prepare(sql).run(...params);
    return Number(info.lastInsertRowid);
  }

  /** Return the first matching row or null. */
  async get(sql, params = []) {
    if (this.isPg) {
      const r = await this.pool.query(Database.toPg(sql), params);
      return r.rows[0] || null;
    }
    return this.sqlite.prepare(sql).get(...params) || null;
  }

  /** Return all matching rows. */
  async all(sql, params = []) {
    if (this.isPg) {
      const r = await this.pool.query(Database.toPg(sql), params);
      return r.rows;
    }
    return this.sqlite.prepare(sql).all(...params);
  }

  /** Execute one or more statements. */
  async exec(sql) {
    if (this.isPg) {
      await this.pool.query(sql);
    } else {
      this.sqlite.exec(sql);
    }
  }

  /**
   * Run fn inside a transaction.
   * For SQLite (synchronous) a manual BEGIN/COMMIT is used so the whole fn
   * runs under one transaction; for Postgres we use a single client's
   * BEGIN/COMMIT/ROLLBACK.
   */
  async transaction(fn) {
    if (this.isPg) {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        const result = await fn({
          all: (sql, p) => client.query(Database.toPg(sql), p).then((r) => r.rows),
          get: (sql, p) => client.query(Database.toPg(sql), p).then((r) => r.rows[0] || null),
          run: (sql, p) => client.query(Database.toPg(sql), p).then((r) => ({ changes: r.rowCount || 0, lastInsertRowid: null })),
          isPg: true,
        });
        await client.query('COMMIT');
        return result;
      } catch (e) {
        try { await client.query('ROLLBACK'); } catch { /* ignore */ }
        throw e;
      } finally {
        client.release();
      }
    }
    // SQLite
    this.sqlite.exec('BEGIN');
    this._transactionDepth += 1;
    try {
      const result = await fn({
        all: async (sql, p) => this.sqlite.prepare(sql).all(...p),
        get: async (sql, p) => this.sqlite.prepare(sql).get(...p) || null,
        run: async (sql, p) => {
          const info = this.sqlite.prepare(sql).run(...p);
          return { changes: Number(info.changes), lastInsertRowid: Number(info.lastInsertRowid) };
        },
        isPg: false,
      });
      this.sqlite.exec('COMMIT');
      return result;
    } catch (e) {
      try { this.sqlite.exec('ROLLBACK'); } catch { /* ignore */ }
      throw e;
    } finally {
      this._transactionDepth -= 1;
    }
  }
}

let _db;
/** Singleton shared by all repositories. */
export function getDb() {
  if (!_db) _db = new Database();
  return _db;
}

export default getDb;
