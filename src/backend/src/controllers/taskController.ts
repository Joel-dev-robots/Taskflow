import { Request, Response } from 'express';
import { z } from 'zod';
import Task from '../models/Task';
import { AuthRequest } from '../middlewares/auth';

// Validation schema for creating/updating a task
const taskSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  status: z.enum(['pending', 'in-progress', 'completed']).default('pending'),
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Get all tasks (with optional filters)
export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    // Basic filters
    const { status, assignedTo, search } = req.query;
    
    // Build filter object
    const filter: any = {};
    
    // Filter by status if provided
    if (status && ['pending', 'in-progress', 'completed'].includes(status as string)) {
      filter.status = status;
    }
    
    // Filter by assignedTo if provided
    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }
    
    // Filter tasks that user created or is assigned to
    filter.$or = [{ createdBy: userId }, { assignedTo: userId }];
    
    // Search in title or description
    if (search) {
      filter.$or.push(
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      );
    }
    
    // Get tasks with populated createdBy and assignedTo fields
    const tasks = await Task.find(filter)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Error retrieving tasks' });
  }
};

// Get a specific task by ID
export const getTaskById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const taskId = req.params.id;
    const userId = req.user?.userId;
    
    const task = await Task.findById(taskId)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');
    
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }
    
    // Check if user is authorized to view this task
    if (task.createdBy._id.toString() !== userId && 
        task.assignedTo?._id.toString() !== userId) {
      res.status(403).json({ message: 'Not authorized to view this task' });
      return;
    }
    
    res.status(200).json({ task });
  } catch (error) {
    console.error('Get task by ID error:', error);
    res.status(500).json({ message: 'Error retrieving task' });
  }
};

// Create a new task
export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    // Validate request body
    const validatedData = taskSchema.parse(req.body);
    
    // Create new task
    const task = new Task({
      ...validatedData,
      createdBy: userId,
    });
    
    await task.save();
    
    // Return populated task
    const populatedTask = await Task.findById(task._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');
    
    res.status(201).json({ task: populatedTask });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.errors });
    } else {
      console.error('Create task error:', error);
      res.status(500).json({ message: 'Error creating task' });
    }
  }
};

// Update an existing task
export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const taskId = req.params.id;
    const userId = req.user?.userId;
    
    // Find the task
    const task = await Task.findById(taskId);
    
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }
    
    // Check if user is authorized to update this task
    if (task.createdBy.toString() !== userId && 
        task.assignedTo?.toString() !== userId) {
      res.status(403).json({ message: 'Not authorized to update this task' });
      return;
    }
    
    // Validate request body
    const validatedData = taskSchema.parse({
      ...req.body,
      // Preserve existing values if not provided
      title: req.body.title || task.title,
      description: req.body.description || task.description,
      status: req.body.status || task.status,
    });
    
    // Update the task
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: validatedData },
      { new: true }
    )
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');
    
    res.status(200).json({ task: updatedTask });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.errors });
    } else {
      console.error('Update task error:', error);
      res.status(500).json({ message: 'Error updating task' });
    }
  }
};

// Delete a task
export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const taskId = req.params.id;
    const userId = req.user?.userId;
    
    // Find the task
    const task = await Task.findById(taskId);
    
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }
    
    // Check if user is authorized to delete this task (only creator can delete)
    if (task.createdBy.toString() !== userId) {
      res.status(403).json({ message: 'Not authorized to delete this task' });
      return;
    }
    
    // Delete the task
    await Task.findByIdAndDelete(taskId);
    
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Error deleting task' });
  }
}; 