import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import TaskForm from '../../../components/TaskForm';
import PrivateRoute from '../../../components/PrivateRoute';

const EditTaskPage = () => {
  const router = useRouter();
  const { id } = router.query;

  return (
    <PrivateRoute>
      <Layout>
        {id && typeof id === 'string' ? (
          <TaskForm taskId={id} isEditMode={true} />
        ) : (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-600">Loading task...</p>
          </div>
        )}
      </Layout>
    </PrivateRoute>
  );
};

export default EditTaskPage; 