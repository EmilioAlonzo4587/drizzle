import { app } from './app.js';
import { env } from './config/env.js';
import { pool } from './db/index.js';

const server = app.listen(env.PORT, () => {
  console.log(`🚀 API escuchando en http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

function shutdown(signal: string) {
  console.log(`${signal} recibido, cerrando servidor...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
