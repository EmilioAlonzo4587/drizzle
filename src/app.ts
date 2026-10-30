import express from 'express';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { taskRouter } from './routes/task.routes.js';

export const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/tasks', taskRouter);

app.use(notFoundHandler);
app.use(errorHandler);
