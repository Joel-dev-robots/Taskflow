import { Router } from 'express';
import { 
  getTasks, 
  getTaskById, 
  createTask, 
  updateTask, 
  deleteTask 
} from '../controllers/taskController';
import { auth } from '../middlewares/auth';

const router = Router();

// All task routes are protected
router.use(auth);

// Get all tasks with optional filters
router.get('/', getTasks);

// Get a specific task by ID
router.get('/:id', getTaskById);

// Create a new task
router.post('/', createTask);

// Update an existing task
router.put('/:id', updateTask);

// Delete a task
router.delete('/:id', deleteTask);

export default router; 