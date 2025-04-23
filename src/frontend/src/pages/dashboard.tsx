import React, { useEffect } from 'react';
import Layout from '../components/Layout';
import PrivateRoute from '../components/PrivateRoute';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchTasks } from '../store/taskSlice';
import Link from 'next/link';

const DashboardPage = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { tasks } = useAppSelector((state) => state.tasks);
  
  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);
  
  // Calculate task statistics
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  
  // Tasks assigned to the current user
  const assignedToUser = tasks.filter(task => 
    task.assignedTo && task.assignedTo._id === user?.id
  ).length;
  
  // Tasks created by the current user
  const createdByUser = tasks.filter(task => 
    task.createdBy._id === user?.id
  ).length;

  return (
    <PrivateRoute>
      <Layout>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <div className="px-4 py-5 sm:px-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Welcome to your personal dashboard.
            </p>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Full name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {user?.name}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {user?.email}
                </dd>
              </div>
            </dl>
          </div>

          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Task Overview</h2>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Tasks</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{totalTasks}</dd>
                    <dd className="mt-3">
                      <Link href="/tasks" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                        View all tasks
                      </Link>
                    </dd>
                  </dl>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Tasks by Status</dt>
                    <dd className="mt-1 text-md font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                        <span>Pending: {pendingTasks}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                        <span>In Progress: {inProgressTasks}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                        <span>Completed: {completedTasks}</span>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Your Tasks</dt>
                    <dd className="mt-1 text-md font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <span>Created by you: {createdByUser}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span>Assigned to you: {assignedToUser}</span>
                      </div>
                    </dd>
                    <dd className="mt-3">
                      <Link href="/tasks/new" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                        Create new task
                      </Link>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent Tasks Section */}
          <div className="px-4 py-5 sm:px-6 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Recent Tasks</h2>
              <Link href="/tasks" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                View all
              </Link>
            </div>
            
            {tasks.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p>No tasks found. Create your first task to get started!</p>
                <Link href="/tasks/new" className="mt-2 inline-block text-primary-600 hover:text-primary-500">
                  Create Task
                </Link>
              </div>
            ) : (
              <div className="mt-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Title</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Assigned To</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {tasks.slice(0, 5).map((task) => (
                      <tr key={task._id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <Link href={`/tasks/${task._id}`} className="text-primary-600 hover:text-primary-900">
                            {task.title}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            task.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : task.status === 'in-progress' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                          }`}>
                            {task.status === 'in-progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {task.assignedTo ? task.assignedTo.name : 'Unassigned'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </PrivateRoute>
  );
};

export default DashboardPage; 