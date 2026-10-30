import { z } from 'zod';

export const taskIdParamSchema = z.object({
  id: z.coerce.number().int().positive().max(2147483647),
});

const title = z.string().trim().min(1, 'El título es obligatorio').max(200);
const description = z.string().trim().max(2000).nullable();

// POST: title obligatorio; el resto opcional. Campos desconocidos -> 400.
export const createTaskSchema = z.strictObject({
  title,
  description: description.optional(),
});

// PUT: reemplazo completo del recurso; todos los campos son obligatorios.
export const replaceTaskSchema = z.strictObject({
  title,
  description,
});

// PATCH: actualización parcial; al menos un campo.
export const updateTaskSchema = createTaskSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo a actualizar',
  });
