# Tasks API — Express + TypeScript + PostgreSQL + Drizzle ORM

API REST para gestionar tareas (CRUD completo), con validación con Zod y migraciones versionadas con `drizzle-kit`.

## Estructura

```
.
├── drizzle/                         # Migraciones generadas (SE VERSIONAN EN GIT)
│   ├── 0000_init.sql                # 1ª migración: crea la tabla tasks
│   ├── 0001_add_status_and_updated_at.sql  # 2ª migración: enum status + updated_at
│   └── meta/
│       ├── _journal.json            # Orden de las migraciones
│       ├── 0000_snapshot.json       # Estado del esquema tras cada migración
│       └── 0001_snapshot.json
├── src/
│   ├── config/env.ts                # Carga y valida variables de entorno (Zod)
│   ├── db/
│   │   ├── schema.ts                # Esquema Drizzle (fuente de verdad)
│   │   ├── index.ts                 # Pool de pg + instancia de Drizzle
│   │   └── migrate.ts               # Aplica migraciones de forma programática
│   ├── validators/task.validator.ts # Esquemas Zod de body, params y query
│   ├── controllers/task.controller.ts
│   ├── routes/task.routes.ts
│   ├── middlewares/error-handler.ts # 400 / 404 / 413 / 500 centralizados
│   ├── utils/http-error.ts
│   ├── app.ts                       # Configuración de Express
│   └── server.ts                    # Arranque + apagado ordenado
├── drizzle.config.ts
├── docker-compose.yml               # PostgreSQL 16 local
├── .env.example
├── package.json
└── tsconfig.json
```

## Instalación de dependencias (desde cero)

```bash
npm init -y
npm i express@^5 drizzle-orm pg zod@^4 dotenv
npm i -D typescript tsx drizzle-kit @types/express @types/pg @types/node
```

En este repositorio basta con `npm install`.

## Puesta en marcha

```bash
# 1. Variables de entorno
cp .env.example .env            # y ajusta credenciales/puertos

# 2. PostgreSQL local (opcional si ya tienes uno)
docker compose up -d --wait

# 3. Aplicar migraciones (crea tabla, enum y tabla de control de migraciones)
npm run db:migrate

# 4. Arrancar en desarrollo (recarga en caliente)
npm run dev

# Producción
npm run build
npm run db:migrate:prod         # usa drizzle-orm/migrator, no requiere drizzle-kit
npm start
```

> Si el puerto 5432 ya está ocupado, cambia `POSTGRES_PORT` en `.env` y el puerto de `DATABASE_URL` al mismo valor.

## Endpoints

| Método | Ruta                | Descripción                                  | Éxito |
|--------|---------------------|----------------------------------------------|-------|
| GET    | `/health`           | Healthcheck                                  | 200   |
| GET    | `/api/tasks`        | Lista tareas (filtro opcional `?status=done`) | 200   |
| GET    | `/api/tasks/:id`    | Obtiene una tarea                            | 200   |
| POST   | `/api/tasks`        | Crea (`title` obligatorio)                   | 201 + `Location` |
| PUT    | `/api/tasks/:id`    | Reemplazo completo (`title`, `description`, `status`) | 200 |
| PATCH  | `/api/tasks/:id`    | Actualización parcial (≥ 1 campo)            | 200   |
| DELETE | `/api/tasks/:id`    | Elimina                                      | 204   |

Errores: `400` (validación Zod, JSON mal formado, campos desconocidos, id no numérico), `404` (tarea o ruta inexistente), `413` (body > 100 kB), `500` (error inesperado; mensaje genérico en producción).

```bash
curl -X POST localhost:3000/api/tasks -H "Content-Type: application/json" \
  -d '{"title":"Aprender Drizzle","description":"migraciones"}'
curl -X PATCH localhost:3000/api/tasks/1 -H "Content-Type: application/json" -d '{"status":"done"}'
curl "localhost:3000/api/tasks?status=done"
curl -X DELETE localhost:3000/api/tasks/1
```

## Flujo de migraciones

`src/db/schema.ts` es la fuente de verdad. Nunca se modifica la base de datos a mano: se cambia el esquema, se genera la migración SQL y se aplica.

### 1ª migración — esquema inicial

Esquema inicial de `src/db/schema.ts`:

```ts
export const tasks = pgTable('tasks', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

```bash
npx drizzle-kit generate --name init      # → drizzle/0000_init.sql
```

### 2ª migración — evolución del esquema

Se añaden el enum `task_status` y las columnas `status` y `updated_at` (ver `src/db/schema.ts` actual):

```bash
npx drizzle-kit generate --name add_status_and_updated_at
# → drizzle/0001_add_status_and_updated_at.sql
```

SQL generado:

```sql
CREATE TYPE "public"."task_status" AS ENUM('pending', 'in_progress', 'done');
ALTER TABLE "tasks" ADD COLUMN "status" "task_status" DEFAULT 'pending' NOT NULL;
ALTER TABLE "tasks" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
```

Como las columnas nuevas tienen `DEFAULT`, la migración funciona también con filas ya existentes.

### Aplicar migraciones

```bash
npm run db:migrate         # drizzle-kit migrate (desarrollo)
npm run db:migrate:prod    # node dist/db/migrate.js (producción/CI, tras npm run build)
```

Ambos leen `drizzle/meta/_journal.json`, comparan con la tabla `drizzle.__drizzle_migrations` y ejecutan solo las migraciones pendientes, cada una en una transacción. Ejecutarlos varias veces es seguro.

### Migraciones y Git

- **Versiona toda la carpeta `drizzle/`**, incluidos `meta/_journal.json` y los `*_snapshot.json`. Los snapshots son lo que `drizzle-kit generate` usa para calcular el *diff* de la siguiente migración; sin ellos generaría una migración que vuelve a crear todo.
- Haz commit del cambio en `schema.ts` **junto con** su migración generada, en el mismo commit.
- **No edites ni borres migraciones ya aplicadas** en algún entorno compartido. Para corregir algo, genera una migración nueva.
- Si dos ramas generan migraciones en paralelo, al hacer merge regenera la tuya sobre la rama actualizada (`npm run db:check` detecta conflictos en los snapshots).
- `.env` está en `.gitignore`; solo se versiona `.env.example`.

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat(db): añadir status y updated_at a tasks"
```

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor en modo watch con `tsx` |
| `npm run build` / `npm start` | Compila a `dist/` y ejecuta |
| `npm run typecheck` | Comprobación de tipos |
| `npm run db:generate` | Genera migración a partir de cambios en `schema.ts` |
| `npm run db:migrate` | Aplica migraciones con drizzle-kit |
| `npm run db:migrate:prod` | Aplica migraciones con el script compilado |
| `npm run db:check` | Verifica la consistencia de las migraciones |
| `npm run db:studio` | Abre Drizzle Studio |
