import { integer, pgEnum, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

// Añadido en la migración 0001: estado de la tarea.
export const taskStatusEnum = pgEnum('task_status', ['pending', 'in_progress', 'done']);

export const tasks = pgTable('tasks', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  // Añadidos en la migración 0001.
  status: taskStatusEnum('status').notNull().default('pending'),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];
