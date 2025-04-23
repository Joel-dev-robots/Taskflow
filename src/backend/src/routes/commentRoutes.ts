import { Router } from 'express';
import { 
  getComments, 
  createComment, 
  updateComment, 
  deleteComment 
} from '../controllers/commentController';
import { auth } from '../middlewares/auth';

const router = Router();

// All comment routes are protected
router.use(auth);

// Get comments for a task
router.get('/task/:taskId', getComments);

// Create a new comment for a task
router.post('/task/:taskId', createComment);

// Update a comment
router.put('/:commentId', updateComment);

// Delete a comment
router.delete('/:commentId', deleteComment);

export default router; 