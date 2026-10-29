const { createApp } = require('./app');
const env = require('./config/env');
const { pool, healthCheck } = require('./db/pool');
const { migrate } = require('./db/migrate');
const { seed } = require('./db/seed');

/**
 * Boots the API: waits for PostgreSQL, applies migrations, seeds defaults and
 * only then starts accepting traffic. Retrying the connection keeps the service
 * resilient when Compose starts it before the database is ready to accept
 * connections.
 */
const waitForDatabase = async (attempts = 20, delayMs = 2000) => {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await healthCheck();
      return;
    } catch (err) {
      if (attempt === attempts) throw err;
      console.log(`[boot] waiting for database (${attempt}/${attempts})`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

const start = async () => {
  await waitForDatabase();
  await migrate();
  if (env.seed.enabled) await seed();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[boot] Zaraz Boutique API listening on port ${env.port} (${env.nodeEnv})`);
  });

  const shutdown = async (signal) => {
    console.log(`[shutdown] received ${signal}, closing server`);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

start().catch((err) => {
  console.error('[boot] failed to start:', err.message);
  process.exit(1);
});
