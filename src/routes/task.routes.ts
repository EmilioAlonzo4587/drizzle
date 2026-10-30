import { Router } from 'express';
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  replaceTask,
  updateTask,
} from '../controllers/task.controller.js';

export const taskRouter = Router();

taskRouter.get('/', listTasks);
taskRouter.get('/:id', getTask);
taskRouter.post('/', createTask);
taskRouter.put('/:id', replaceTask);
taskRouter.patch('/:id', updateTask);
taskRouter.delete('/:id', deleteTask);
