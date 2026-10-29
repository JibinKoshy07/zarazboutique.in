const fs = require('fs');
const path = require('path');
const { pool } = require('./pool');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

const ensureMigrationsTable = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
};

const listMigrationFiles = () =>
  fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();

/**
 * Applies every not-yet-applied .sql migration in lexical order. Each file runs
 * in its own transaction so a failed migration leaves the schema untouched.
 */
const migrate = async ({ silent = false } = {}) => {
  const log = silent ? () => {} : (...args) => console.log(...args);
  const client = await pool.connect();
  const applied = [];

  try {
    await ensureMigrationsTable(client);
    const { rows } = await client.query('SELECT name FROM schema_migrations');
    const done = new Set(rows.map((row) => row.name));

    for (const file of listMigrationFiles()) {
      if (done.has(file)) continue;

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      log(`[migrate] applying ${file}`);
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        applied.push(file);
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${err.message}`);
      }
    }

    log(applied.length ? `[migrate] applied ${applied.length} migration(s)` : '[migrate] database already up to date');
    return applied;
  } finally {
    client.release();
  }
};

if (require.main === module) {
  migrate()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[migrate] failed:', err.message);
      await pool.end();
      process.exit(1);
    });
}

module.exports = { migrate };
