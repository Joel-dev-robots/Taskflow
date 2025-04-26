import { Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import Task from '../models/Task';
import { AuthRequest } from '../middlewares/auth';

// Validation schema for creating/updating a task
const taskSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  status: z.enum(['pending', 'in-progress', 'completed']).default('pending'),
  assignedTo: z.string().optional().nullable(),
  tags: z.union([z.array(z.string()), z.string()]).optional().nullable().transform(val => {
    // Si es un string, conviértelo en array
    if (typeof val === 'string') {
      return val.split(',').map(tag => tag.trim()).filter(Boolean);
    }
    // Si es null o undefined, devuelve un array vacío
    if (val === null || val === undefined) {
      return [];
    }
    // Si ya es un array, devuélvelo tal cual
    return val;
  }),
});

// Get all tasks (with optional filters)
export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role || 'user';
    
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
    
    // Por defecto, todos los usuarios pueden ver todas las tareas
    // Aquí se podrían agregar restricciones específicas por rol si es necesario
    
    // Implementar búsqueda si existe un término
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
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
    const userRole = req.user?.role || 'user';
    
    const task = await Task.findById(taskId)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');
    
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }
    
    // Por defecto, todos los usuarios pueden ver cualquier tarea
    // Aquí se podrían agregar restricciones específicas por rol si es necesario en el futuro
    
    res.status(200).json({ task });
  } catch (error) {
    console.error('Get task by ID error:', error);
    res.status(500).json({ message: 'Error retrieving task' });
  }
};

// Create a new task
export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Verificar que existe el usuario
    const userId = req.user?.userId;
    if (!userId) {
      console.error('Create task error: No user ID in request');
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    console.log('Creating task with user ID:', userId);
    console.log('Request body:', req.body);
    
    // Verificar que los datos son válidos
    let validatedData;
    try {
      validatedData = taskSchema.parse(req.body);
      console.log('Validated data:', validatedData);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error('Validation error:', validationError.errors);
        res.status(400).json({ message: 'Validation error', errors: validationError.errors });
      } else {
        console.error('Unknown validation error:', validationError);
        res.status(400).json({ message: 'Invalid task data' });
      }
      return;
    }
    
    // Preparar datos de la tarea
    const taskData: any = {
      title: validatedData.title,
      description: validatedData.description,
      status: validatedData.status,
      createdBy: userId,
      tags: validatedData.tags || []
    };
    
    // Verificar y añadir assignedTo solo si existe y es un ObjectId válido
    if (validatedData.assignedTo && validatedData.assignedTo.trim() !== '') {
      try {
        if (mongoose.Types.ObjectId.isValid(validatedData.assignedTo)) {
          taskData.assignedTo = validatedData.assignedTo;
        } else {
          console.error('Invalid assignedTo ObjectId:', validatedData.assignedTo);
        }
      } catch (err) {
        console.error('Error processing assignedTo:', err);
        // No asignamos el campo si hay un error
      }
    }
    
    // Crear la tarea
    try {
      console.log('Final task data to save:', taskData);
      const task = new Task(taskData);
      
      await task.save();
      console.log('Task saved successfully with ID:', task._id);
      
      // Return populated task
      const populatedTask = await Task.findById(task._id)
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email');
      
      if (!populatedTask) {
        console.error('Task was saved but could not be retrieved:', task._id);
        res.status(500).json({ message: 'Task was created but could not be retrieved' });
        return;
      }
      
      res.status(201).json({ task: populatedTask });
    } catch (dbError: any) {
      console.error('Database error saving task:', dbError);
      // Más detalles sobre el error para debugging
      if (dbError.name === 'ValidationError') {
        console.error('Mongoose validation error:', dbError.message);
        res.status(400).json({ message: 'Invalid task data', details: dbError.message });
      } else if (dbError.name === 'CastError') {
        console.error('Cast error (likely invalid ObjectId):', dbError.message);
        res.status(400).json({ message: 'Invalid ID format', details: dbError.message });
      } else {
        res.status(500).json({ message: 'Error saving task to database' });
      }
    }
  } catch (error) {
    console.error('Create task unexpected error:', error);
    res.status(500).json({ message: 'Error creating task' });
  }
};

// Update an existing task
export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const taskId = req.params.id;
    const userId = req.user?.userId;
    
    if (!userId) {
      console.error('Update task error: No user ID in request');
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    console.log('Updating task ID:', taskId);
    console.log('Request body:', req.body);
    
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
    
    // Validate request body with existing values as fallbacks
    let validatedData;
    try {
      validatedData = taskSchema.parse({
        title: req.body.title || task.title,
        description: req.body.description || task.description,
        status: req.body.status || task.status,
        assignedTo: req.body.assignedTo === undefined ? task.assignedTo : req.body.assignedTo,
        tags: req.body.tags === undefined ? task.tags : req.body.tags
      });
      console.log('Validated data for update:', validatedData);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error('Validation error:', validationError.errors);
        res.status(400).json({ message: 'Validation error', errors: validationError.errors });
      } else {
        console.error('Unknown validation error:', validationError);
        res.status(400).json({ message: 'Invalid task data' });
      }
      return;
    }
    
    // Preparar datos para la actualización
    const updateData: any = {
      title: validatedData.title,
      description: validatedData.description,
      status: validatedData.status,
      tags: validatedData.tags || []
    };
    
    // Verificar y añadir assignedTo solo si existe y es un ObjectId válido
    if (validatedData.assignedTo) {
      if (validatedData.assignedTo.trim() === '') {
        // Si es una cadena vacía, eliminar la asignación
        updateData.assignedTo = null;
      } else {
        try {
          if (mongoose.Types.ObjectId.isValid(validatedData.assignedTo)) {
            updateData.assignedTo = validatedData.assignedTo;
          } else {
            console.error('Invalid assignedTo ObjectId:', validatedData.assignedTo);
            // Mantener el valor original si el nuevo no es válido
            if (task.assignedTo) {
              updateData.assignedTo = task.assignedTo;
            }
          }
        } catch (err) {
          console.error('Error processing assignedTo:', err);
          // Mantener el valor original en caso de error
          if (task.assignedTo) {
            updateData.assignedTo = task.assignedTo;
          }
        }
      }
    }
    
    console.log('Final update data:', updateData);
    
    // Update the task
    try {
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email');
      
      if (!updatedTask) {
        console.error('Task was not found after update attempt:', taskId);
        res.status(404).json({ message: 'Task not found after update' });
        return;
      }
      
      console.log('Task updated successfully:', updatedTask._id);
      res.status(200).json({ task: updatedTask });
    } catch (dbError: any) {
      console.error('Database error updating task:', dbError);
      // Más detalles sobre el error para debugging
      if (dbError.name === 'ValidationError') {
        console.error('Mongoose validation error:', dbError.message);
        res.status(400).json({ message: 'Invalid task data', details: dbError.message });
      } else if (dbError.name === 'CastError') {
        console.error('Cast error (likely invalid ObjectId):', dbError.message);
        res.status(400).json({ message: 'Invalid ID format', details: dbError.message });
      } else {
        res.status(500).json({ message: 'Error updating task' });
      }
    }
  } catch (error) {
    console.error('Update task unexpected error:', error);
    res.status(500).json({ message: 'Error updating task' });
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