import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError, z } from 'zod';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: 'NotFound', message: `Ruta ${req.method} ${req.originalUrl} no encontrada` });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Payload, params o query inválidos
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'ValidationError',
      message: 'Los datos enviados no son válidos',
      details: z.flattenError(err),
    });
    return;
  }

  // JSON mal formado (lanzado por express.json())
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'BadRequest', message: 'El cuerpo de la petición no es un JSON válido' });
    return;
  }

  if (err?.type === 'entity.too.large') {
    res.status(413).json({ error: 'PayloadTooLarge', message: 'El cuerpo de la petición es demasiado grande' });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.name, message: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: 'InternalServerError',
    message: env.NODE_ENV === 'production' ? 'Error interno del servidor' : String(err?.message ?? err),
  });
};
