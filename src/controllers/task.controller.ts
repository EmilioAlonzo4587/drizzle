import type { Request, Response } from 'express';
import { asc, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { tasks } from '../db/schema.js';
import { NotFoundError } from '../utils/http-error.js';
import {
  createTaskSchema,
  listTasksQuerySchema,
  replaceTaskSchema,
  taskIdParamSchema,
  updateTaskSchema,
} from '../validators/task.validator.js';

// Express 5 propaga automáticamente los errores de handlers async al error handler.

export async function listTasks(req: Request, res: Response) {
  const { status } = listTasksQuerySchema.parse(req.query);

  const rows = await db
    .select()
    .from(tasks)
    .where(status ? eq(tasks.status, status) : undefined)
    .orderBy(asc(tasks.id));

  res.status(200).json(rows);
}

export async function getTask(req: Request, res: Response) {
  const { id } = taskIdParamSchema.parse(req.params);

  const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
  if (!task) throw new NotFoundError(`La tarea ${id} no existe`);

  res.status(200).json(task);
}

export async function createTask(req: Request, res: Response) {
  const data = createTaskSchema.parse(req.body);

  const [task] = await db.insert(tasks).values(data).returning();

  res.status(201).location(`/api/tasks/${task.id}`).json(task);
}

export async function replaceTask(req: Request, res: Response) {
  const { id } = taskIdParamSchema.parse(req.params);
  const data = replaceTaskSchema.parse(req.body);

  const [task] = await db.update(tasks).set(data).where(eq(tasks.id, id)).returning();
  if (!task) throw new NotFoundError(`La tarea ${id} no existe`);

  res.status(200).json(task);
}

export async function updateTask(req: Request, res: Response) {
  const { id } = taskIdParamSchema.parse(req.params);
  const data = updateTaskSchema.parse(req.body);

  const [task] = await db.update(tasks).set(data).where(eq(tasks.id, id)).returning();
  if (!task) throw new NotFoundError(`La tarea ${id} no existe`);

  res.status(200).json(task);
}

export async function deleteTask(req: Request, res: Response) {
  const { id } = taskIdParamSchema.parse(req.params);

  const [deleted] = await db.delete(tasks).where(eq(tasks.id, id)).returning({ id: tasks.id });
  if (!deleted) throw new NotFoundError(`La tarea ${id} no existe`);

  res.status(204).send();
}
