const { Pool } = require('pg');
const env = require('../config/env');

const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  max: env.db.poolMax,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: env.db.ssl ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('[db] unexpected idle client error', err.message);
});

const query = (text, params) => pool.query(text, params);

/**
 * Runs `handler` inside a transaction, rolling back on any thrown error.
 * Every write path that touches more than one table (orders, stock, carts)
 * must go through this so a partial failure cannot corrupt data.
 */
const withTransaction = async (handler) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await handler(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const healthCheck = async () => {
  const { rows } = await pool.query('SELECT 1 AS ok');
  return rows[0].ok === 1;
};

const close = () => pool.end();

module.exports = { pool, query, withTransaction, healthCheck, close };
