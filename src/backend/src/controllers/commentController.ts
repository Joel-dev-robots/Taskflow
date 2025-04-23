import { Response } from 'express';
import { z } from 'zod';
import Comment from '../models/Comment';
import Task from '../models/Task';
import { AuthRequest } from '../middlewares/auth';
import { emitTaskUpdate } from '../index';

// Validation schema
const commentSchema = z.object({
  content: z.string().min(1, 'Comment content cannot be empty'),
});

// Get comments for a task
export const getComments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.userId;

    // Check if task exists and user has access
    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Verify user has access to task
    if (task.createdBy.toString() !== userId && 
        task.assignedTo?.toString() !== userId) {
      res.status(403).json({ message: 'Not authorized to view comments for this task' });
      return;
    }

    // Get comments for the task
    const comments = await Comment.find({ task: taskId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Error fetching comments' });
  }
};

// Create a new comment
export const createComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.userId;

    // Validate request body
    const validatedData = commentSchema.parse(req.body);

    // Check if task exists and user has access
    const task = await Task.findById(taskId);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    // Create the comment
    const comment = new Comment({
      task: taskId,
      user: userId,
      content: validatedData.content,
    });

    await comment.save();

    // Return the populated comment
    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'name email');

    // Emit socket event for real-time updates
    emitTaskUpdate(taskId, 'comment:created', populatedComment);

    res.status(201).json({ comment: populatedComment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.errors });
    } else {
      console.error('Create comment error:', error);
      res.status(500).json({ message: 'Error creating comment' });
    }
  }
};

// Update a comment
export const updateComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.userId;

    // Validate request body
    const validatedData = commentSchema.parse(req.body);

    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    // Verify user is the owner of the comment
    if (comment.user.toString() !== userId) {
      res.status(403).json({ message: 'Not authorized to update this comment' });
      return;
    }

    // Update the comment
    comment.content = validatedData.content;
    await comment.save();

    // Get populated comment
    const updatedComment = await Comment.findById(commentId)
      .populate('user', 'name email');

    // Emit socket event for real-time updates
    emitTaskUpdate(comment.task.toString(), 'comment:updated', updatedComment);

    res.status(200).json({ comment: updatedComment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.errors });
    } else {
      console.error('Update comment error:', error);
      res.status(500).json({ message: 'Error updating comment' });
    }
  }
};

// Delete a comment
export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.userId;

    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    // Verify user is the owner of the comment or task creator
    const task = await Task.findById(comment.task);
    const isTaskCreator = task && task.createdBy.toString() === userId;
    const isCommentCreator = comment.user.toString() === userId;

    if (!isCommentCreator && !isTaskCreator) {
      res.status(403).json({ message: 'Not authorized to delete this comment' });
      return;
    }

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    // Emit socket event for real-time updates
    emitTaskUpdate(comment.task.toString(), 'comment:deleted', { _id: commentId });

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Error deleting comment' });
  }
}; 