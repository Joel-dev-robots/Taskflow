import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../components/Layout';
import axios from 'axios';

// Definir la URL de la API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Definir una interfaz temporal para el estado de autenticación
interface AuthState {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    forcePasswordChange?: boolean;
  } | null;
  isAuthenticated: boolean;
  token: string | null;
}

interface RootState {
  auth: AuthState;
}

interface ChangePasswordInputs {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ChangePasswordPage: React.FC = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordInputs>();
  
  // Obtener el valor actual de newPassword para comparar en la validación
  const newPassword = watch('newPassword');
  
  // Redirigir si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);
  
  // Función para cambiar la contraseña
  const onSubmit = async (data: ChangePasswordInputs) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    console.log('Iniciando cambio de contraseña...');
    
    try {
      console.log('Llamando a la API para cambiar contraseña...');
      // Llamar a la API para cambiar la contraseña
      await changePassword(data);
      
      console.log('Contraseña cambiada con éxito!');
      setSuccessMessage('Contraseña actualizada correctamente');
      
      // Redirigir después de un breve tiempo
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      
      if (error.response) {
        console.error('Datos de respuesta de error:', error.response.data);
        console.error('Estado de respuesta de error:', error.response.status);
        
        if (error.response.data && error.response.data.message) {
          setErrorMessage(error.response.data.message);
        } else {
          setErrorMessage('Error en la respuesta del servidor');
        }
      } else if (error.request) {
        console.error('No se recibió respuesta del servidor');
        setErrorMessage('No se pudo conectar con el servidor');
      } else {
        console.error('Error de configuración de la solicitud:', error.message);
        setErrorMessage(error.message || 'Error al cambiar la contraseña');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Función para hacer el cambio de contraseña a través de la API
  const changePassword = async (data: ChangePasswordInputs): Promise<void> => {
    console.log('Token disponible:', !!token);
    
    if (!token) {
      throw new Error('No hay token de autenticación');
    }
    
    console.log('URL de la API:', `${API_URL}/auth/change-password`);
    console.log('Datos enviados:', { 
      currentPassword: '******', 
      newPassword: '******' 
    });
    
    try {
      const response = await axios.put(
        `${API_URL}/auth/change-password`,
        {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log('Respuesta del servidor:', response.status);
      console.log('Datos de respuesta:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error en la petición axios:', error);
      throw error;
    }
  };
  
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Cambiar contraseña
            </h2>
            {user?.forcePasswordChange && (
              <div className="mt-2 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Por motivos de seguridad, debes cambiar tu contraseña antes de continuar.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {successMessage && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div className="mb-4">
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña actual
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Contraseña actual"
                  {...register('currentPassword', {
                    required: 'Debes introducir tu contraseña actual',
                  })}
                />
                {errors.currentPassword && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva contraseña
                </label>
                <input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Nueva contraseña"
                  {...register('newPassword', {
                    required: 'Debes introducir una nueva contraseña',
                    minLength: {
                      value: 6,
                      message: 'La contraseña debe tener al menos 6 caracteres',
                    },
                  })}
                />
                {errors.newPassword && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar nueva contraseña
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Confirmar nueva contraseña"
                  {...register('confirmPassword', {
                    required: 'Debes confirmar tu nueva contraseña',
                    validate: (value) =>
                      value === newPassword || 'Las contraseñas no coinciden',
                  })}
                />
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </>
                ) : (
                  'Cambiar contraseña'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ChangePasswordPage; 