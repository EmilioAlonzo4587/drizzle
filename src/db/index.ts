import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../config/env.js';
import * as schema from './schema.js';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  connectionTimeoutMillis: 5_000,
});

// Si PostgreSQL cierra una conexión inactiva, pg emite 'error' en el pool;
// sin este listener el proceso de Node terminaría.
pool.on('error', (err) => {
  console.error('Error inesperado en una conexión inactiva de PostgreSQL:', err.message);
});

export const db = drizzle({ client: pool, schema });
