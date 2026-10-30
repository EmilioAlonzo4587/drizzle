/**
 * Aplica las migraciones pendientes de ./drizzle contra PostgreSQL.
 * Pensado para producción/CI, donde drizzle-kit (devDependency) puede no estar instalado:
 *   npm run build && npm run db:migrate:prod
 */
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './index.js';

try {
  console.log('⏳ Aplicando migraciones...');
  await migrate(db, {
    migrationsFolder: './drizzle',
    migrationsTable: '__drizzle_migrations',
    migrationsSchema: 'drizzle',
  });
  console.log('✅ Migraciones aplicadas');
} catch (error) {
  console.error('❌ Error al aplicar migraciones:', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
