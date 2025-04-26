import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import TaskList from '../../components/TaskList';
import PrivateRoute from '../../components/PrivateRoute';

const TasksPage = () => {
  const router = useRouter();

  return (
    <PrivateRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Gestión de tareas</h1>
            <button
              onClick={() => router.push('/tasks/new')}
              className="btn btn-primary"
            >
              Crear nueva tarea
            </button>
          </div>
          
          <TaskList />
        </div>
      </Layout>
    </PrivateRoute>
  );
};

export default TasksPage; 