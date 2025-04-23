import React from 'react';
import Layout from '../../components/Layout';
import TaskForm from '../../components/TaskForm';
import PrivateRoute from '../../components/PrivateRoute';

const NewTaskPage = () => {
  return (
    <PrivateRoute>
      <Layout>
        <TaskForm />
      </Layout>
    </PrivateRoute>
  );
};

export default NewTaskPage; 