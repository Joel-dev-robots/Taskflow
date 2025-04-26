import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createTask, updateTask, fetchTaskById, clearTaskError } from '../store/taskSlice';

interface TaskFormProps {
  taskId?: string;
  isEditMode?: boolean;
}

interface TaskFormInputs {
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo?: string;
  tags?: string;
}

const TaskForm: React.FC<TaskFormProps> = ({ taskId, isEditMode = false }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentTask, isLoading, error } = useAppSelector((state) => state.tasks);
  const [showError, setShowError] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<TaskFormInputs>();

  // Load task data if in edit mode
  useEffect(() => {
    if (isEditMode && taskId) {
      dispatch(fetchTaskById(taskId));
    }
  }, [dispatch, isEditMode, taskId]);

  // Populate form when task data is loaded
  useEffect(() => {
    if (isEditMode && currentTask) {
      setValue('title', currentTask.title);
      setValue('description', currentTask.description);
      setValue('status', currentTask.status);
      setValue('assignedTo', currentTask.assignedTo?._id || '');
      
      // Convert tags array to comma-separated string
      if (currentTask.tags && currentTask.tags.length > 0) {
        setValue('tags', currentTask.tags.join(', '));
        setTagInput(currentTask.tags.join(', '));
      }
    }
  }, [isEditMode, currentTask, setValue]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearTaskError());
    };
  }, [dispatch]);

  // Show error message
  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
        dispatch(clearTaskError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const onSubmit = async (data: TaskFormInputs) => {
    try {
      // Process tags from comma-separated string to array
      const tags = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
      
      if (isEditMode && taskId) {
        // Update existing task
        await dispatch(updateTask({
          id: taskId,
          data: {
            ...data,
            tags
          }
        })).unwrap();
        router.push(`/tasks/${taskId}`);
      } else {
        // Create new task
        const result = await dispatch(createTask({
          ...data,
          tags
        })).unwrap();
        router.push(`/tasks/${result._id}`);
      }
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <div className="px-4 sm:px-0 mb-6">
        <h1 className="text-lg font-medium leading-6 text-gray-900">
          {isEditMode ? 'Editar información' : 'Información detallada'}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {isEditMode
            ? 'Actualiza los detalles de esta actividad.'
            : 'Completa la información para crear una nueva actividad.'}
        </p>
      </div>

      {/* Error alert */}
      {showError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="title" className="form-label">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            className="form-input"
            placeholder="Título de la actividad"
            {...register('title', {
              required: 'El título es obligatorio',
              minLength: {
                value: 2,
                message: 'El título debe tener al menos 2 caracteres',
              },
            })}
          />
          {errors.title && <p className="form-error">{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className="form-label">
            Descripción <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            rows={4}
            className="form-input"
            placeholder="Descripción detallada"
            {...register('description', {
              required: 'La descripción es obligatoria',
              minLength: {
                value: 5,
                message: 'La descripción debe tener al menos 5 caracteres',
              },
            })}
          />
          {errors.description && <p className="form-error">{errors.description.message}</p>}
        </div>

        <div>
          <label htmlFor="status" className="form-label">
            Estado <span className="text-red-500">*</span>
          </label>
          <select
            id="status"
            className="form-input"
            {...register('status', {
              required: 'El estado es obligatorio',
            })}
          >
            <option value="pending">Pendiente</option>
            <option value="in-progress">En progreso</option>
            <option value="completed">Completada</option>
          </select>
          {errors.status && <p className="form-error">{errors.status.message}</p>}
        </div>

        <div>
          <label htmlFor="assignedTo" className="form-label">
            Asignar a (Opcional)
          </label>
          <select
            id="assignedTo"
            className="form-input"
            {...register('assignedTo')}
          >
            <option value="">Sin asignación</option>
            {/* This should be populated with users from the backend */}
            <option value="user-id-1">John Doe</option>
            <option value="user-id-2">Jane Smith</option>
          </select>
        </div>

        <div>
          <label htmlFor="tags" className="form-label">
            Etiquetas (Opcional, separadas por comas)
          </label>
          <input
            id="tags"
            type="text"
            className="form-input"
            placeholder="feature, bug, urgente"
            {...register('tags')}
            value={tagInput}
            onChange={(e) => {
              setValue('tags', e.target.value);
              setTagInput(e.target.value);
            }}
          />
          <p className="mt-1 text-xs text-gray-500">
            Introduce etiquetas separadas por comas, ej: "feature, bug, urgente"
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary inline-flex justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </>
            ) : (
              <>{isEditMode ? 'Actualizar' : 'Crear'}</>
            )}
          </button>
          
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => router.back()}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm; 