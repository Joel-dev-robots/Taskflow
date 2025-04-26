import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import AdminRoute from '../../components/AdminRoute';
import adminService from '../../services/adminService';
import { authService } from '../../services/authService';
import { useAppSelector } from '../../store/hooks';
import axios from 'axios';
// import { io, Socket } from 'socket.io-client';

interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: string;
  passwordResetRequested?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Función auxiliar para extraer el ID del usuario consistentemente
const getUserId = (user: User): string => {
  return user._id || user.id || '';
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
// const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

const AdminPanel: React.FC = () => {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para gestionar la modificación de roles
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'user' | 'admin'>('user');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [roleUpdateMessage, setRoleUpdateMessage] = useState<string | null>(null);
  
  // Estado para gestionar el restablecimiento de contraseñas
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [passwordResetMessage, setPasswordResetMessage] = useState<string | null>(null);
  
  // Estado para notificaciones
  // const [socket, setSocket] = useState<Socket | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  
  // Verificar si el usuario es administrador al cargar la página
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
    } else if (user) {
      loadUsers(); // Load users if user is admin
    }
  }, [router, user]);
  
  /* Comentar el código de socket.io hasta que esté instalado
  // Configurar Socket.io
  useEffect(() => {
    // Solo inicializar socket si no existe ya
    if (!socket) {
      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);
      
      // Unirse a la sala de admin
      newSocket.emit('join-admin');
      
      return () => {
        newSocket.emit('leave-admin');
        newSocket.disconnect();
      };
    }
    
    return () => {};
  }, []);
  
  // Escuchar eventos de Socket.io
  useEffect(() => {
    if (socket) {
      // Escuchar solicitudes de restablecimiento de contraseña
      socket.on('password-reset-request', (data) => {
        const { userName, userEmail } = data;
        setNotification(`${userName} (${userEmail}) ha solicitado restablecer su contraseña`);
        
        // Recargar la lista de usuarios para mostrar la nueva solicitud
        loadUsers();
        
        // Mostrar notificación del navegador si está permitido
        if (Notification.permission === 'granted') {
          new Notification('Solicitud de restablecimiento de contraseña', {
            body: `${userName} (${userEmail}) ha solicitado restablecer su contraseña`,
            icon: '/favicon.ico'
          });
        }
        
        // Sonido de notificación (opcional)
        const audio = new Audio('/notification.mp3');
        audio.play().catch(err => console.log('No se pudo reproducir el sonido', err));
      });
      
      return () => {
        socket.off('password-reset-request');
      };
    }
  }, [socket]);
  */
  
  // Cargar la lista de usuarios
  const loadUsers = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const token = authService.getToken();
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Transformar usuarios para asegurar consistencia del ID
      const transformedUsers = response.data.users.map((user: any) => ({
        ...user,
        id: user._id || user.id // Asegurar que id exista
      }));
      
      setUsers(transformedUsers);
    } catch (err: any) {
      console.error('Error completo al cargar usuarios:', err);
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Manejar cambio de rol
  const handleRoleUpdate = async () => {
    if (!selectedUserId) return;
    
    setError('');
    setIsUpdatingRole(true);
    setRoleUpdateMessage(null);
    
    try {
      const token = authService.getToken();
      const response = await axios.put(
        `${API_URL}/admin/users/${selectedUserId}/role`,
        { role: selectedRole },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Actualizar la lista de usuarios
      setUsers(users.map(user => 
        (getUserId(user) === selectedUserId) 
          ? { ...user, role: selectedRole } 
          : user
      ));
      
      setSelectedUserId('');
      setSelectedRole('user');
    } catch (err: any) {
      console.error('Error completo al actualizar rol:', err);
      if (err.response) {
        console.error('Datos de respuesta de error:', err.response.data);
        console.error('Estado de respuesta de error:', err.response.status);
      }
      setRoleUpdateMessage(`Error: ${err.message}`);
    } finally {
      setIsUpdatingRole(false);
    }
  };
  
  // Manejar restablecimiento de contraseña
  const handlePasswordReset = async () => {
    if (!passwordUserId || !newPassword) return;
    
    setError('');
    setIsResettingPassword(true);
    setPasswordResetMessage(null);
    
    try {
      const token = authService.getToken();
      await axios.put(
        `${API_URL}/admin/users/${passwordUserId}/password`,
        { password: newPassword },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setPasswordUserId('');
      setNewPassword('');
      alert('Contraseña actualizada con éxito');
    } catch (err: any) {
      console.error('Error completo al restablecer contraseña:', err);
      if (err.response) {
        console.error('Datos de respuesta de error:', err.response.data);
        console.error('Estado de respuesta de error:', err.response.status);
      }
      setPasswordResetMessage(`Error: ${err.message}`);
    } finally {
      setIsResettingPassword(false);
    }
  };
  
  // Manejar envío de correo para restablecimiento
  const handleSendResetEmail = async (userId: string) => {
    setError('');
    try {
      const token = authService.getToken();
      await axios.post(
        `${API_URL}/admin/users/${userId}/reset-password-email`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      alert('Email de restablecimiento enviado con éxito');
    } catch (err: any) {
      console.error('Error completo al enviar correo:', err);
      if (err.response) {
        console.error('Datos de respuesta de error:', err.response.data);
        console.error('Estado de respuesta de error:', err.response.status);
      }
      alert(`Error: ${err.message}`);
    }
  };
  
  // Función para probar las conexiones
  const testConnections = async () => {
    try {
      const token = authService.getToken();
      console.log("Token actual:", token);
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log("Payload del token:", payload);
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      console.log("URL base de la API:", apiUrl);
      
      // 1. Probar obtención de usuarios
      console.log("Probando conexión a GET /admin/users...");
      const responseUsers = await axios.get(`${apiUrl}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log("Obtención de usuarios exitosa:", responseUsers.data);
      
      // Si hay usuarios, usar el primero para pruebas
      if (responseUsers.data.users && responseUsers.data.users.length > 0) {
        const testUser = responseUsers.data.users[0];
        console.log("Usuario seleccionado para pruebas:", testUser);
        
        // Extraer correctamente el ID del usuario (puede ser _id o id)
        const userId = testUser._id || testUser.id;
        console.log("ID de usuario para pruebas:", userId);
        
        // 2. Probar actualización de rol
        const currentRole = testUser.role;
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        console.log(`Probando actualización de rol de ${currentRole} a ${newRole}...`);
        
        try {
          const roleResponse = await axios.put(
            `${apiUrl}/admin/users/${userId}/role`, 
            { role: newRole }, 
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          console.log("Actualización de rol exitosa:", roleResponse.data);
          
          // Restaurar el rol original
          await axios.put(
            `${apiUrl}/admin/users/${userId}/role`, 
            { role: currentRole }, 
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
        } catch (roleError: any) {
          console.error("Error en prueba de actualización de rol:", roleError);
          if (roleError.response) {
            console.error("Datos del error:", roleError.response.data);
          }
        }
        
        // 3. Probar envío de email de reset
        console.log("Probando envío de email de reset...");
        try {
          const emailResponse = await axios.post(
            `${apiUrl}/admin/users/${userId}/reset-password-email`, 
            {}, 
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          console.log("Envío de email exitoso:", emailResponse.data);
        } catch (emailError: any) {
          console.error("Error en prueba de envío de email:", emailError);
          if (emailError.response) {
            console.error("Datos del error:", emailError.response.data);
          }
        }
      }
      
      alert("Pruebas completadas. Revisa la consola para más detalles.");
    } catch (error: any) {
      console.error("Error en las pruebas de conexión:", error);
      if (error.response) {
        console.error("Datos del error:", error.response.data);
        console.error("Estado HTTP:", error.response.status);
      }
      alert(`Error en la conexión: ${error.message}`);
    }
  };

  return (
    <AdminRoute>
      <Layout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>
          
          {/* Contador de peticiones pendientes de reset */}
          {users.filter(user => user.passwordResetRequested).length > 0 && (
            <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Atención:</strong> Hay {users.filter(user => user.passwordResetRequested).length} solicitud(es) de restablecimiento de contraseña pendientes.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Botón de prueba de conexión */}
          <div className="mb-6">
            <button 
              onClick={testConnections}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Probar Conexión
            </button>
            <p className="mt-2 text-sm text-gray-600">
              Haz clic para verificar la conexión con el backend. Revisa la consola para más detalles.
            </p>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Lista de usuarios */}
            <div className="md:col-span-2">
              <div className="bg-white shadow overflow-hidden rounded-lg">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h2 className="text-lg font-medium">Usuarios</h2>
                </div>
                
                {isLoading ? (
                  <div className="px-4 py-5 text-center">
                    <svg className="animate-spin h-8 w-8 mx-auto text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nombre
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rol
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={getUserId(user)} className={user.passwordResetRequested ? 'bg-yellow-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.name}
                              {user.passwordResetRequested && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Reset solicitado
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => {
                                  setSelectedUserId(getUserId(user));
                                  setSelectedRole(user.role === 'admin' ? 'user' : 'admin');
                                }}
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                              >
                                Cambiar rol
                              </button>
                              <button
                                onClick={() => {
                                  setPasswordUserId(getUserId(user));
                                  setNewPassword('');
                                }}
                                className={`${
                                  user.passwordResetRequested 
                                    ? 'text-red-600 hover:text-red-900 font-bold' 
                                    : 'text-yellow-600 hover:text-yellow-900'
                                } mr-3`}
                              >
                                {user.passwordResetRequested ? '⚠️ Reset' : 'Restablecer contraseña'}
                              </button>
                              <button
                                onClick={() => handleSendResetEmail(getUserId(user))}
                                className="text-green-600 hover:text-green-900"
                              >
                                Enviar email
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            
            {/* Panel lateral con formularios */}
            <div className="space-y-6">
              {/* Formulario de cambio de rol */}
              {selectedUserId && (
                <div className="bg-white shadow overflow-hidden rounded-lg">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="text-lg font-medium">Cambiar rol de usuario</h3>
                  </div>
                  <div className="px-4 py-5">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                          Nuevo rol
                        </label>
                        <select
                          id="role"
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value as 'user' | 'admin')}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                          <option value="user">Usuario</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>
                      
                      {roleUpdateMessage && (
                        <div className={`mt-2 text-sm ${roleUpdateMessage.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                          {roleUpdateMessage}
                        </div>
                      )}
                      
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedUserId(null)}
                          className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleRoleUpdate}
                          disabled={isUpdatingRole}
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {isUpdatingRole ? 'Actualizando...' : 'Actualizar rol'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Formulario de restablecimiento de contraseña */}
              {passwordUserId && (
                <div className="bg-white shadow overflow-hidden rounded-lg">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="text-lg font-medium">Restablecer contraseña</h3>
                  </div>
                  <div className="px-4 py-5">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                          Nueva contraseña
                        </label>
                        <input
                          type="password"
                          id="newPassword"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Mínimo 6 caracteres"
                          minLength={6}
                        />
                      </div>
                      
                      {passwordResetMessage && (
                        <div className={`mt-2 text-sm ${passwordResetMessage.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                          {passwordResetMessage}
                        </div>
                      )}
                      
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setPasswordUserId(null)}
                          className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handlePasswordReset}
                          disabled={isResettingPassword || newPassword.length < 6}
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        >
                          {isResettingPassword ? 'Restableciendo...' : 'Restablecer contraseña'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Información sobre el panel */}
              <div className="bg-white shadow overflow-hidden rounded-lg">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="text-lg font-medium">Información</h3>
                </div>
                <div className="px-4 py-5">
                  <p className="text-sm text-gray-600 mb-3">
                    Este panel le permite gestionar usuarios y sus contraseñas.
                  </p>
                  <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                    <li>Cambiar roles de usuario</li>
                    <li>Restablecer contraseñas directamente</li>
                    <li>Enviar emails de recuperación</li>
                  </ul>
                  <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          Por seguridad, cuando restablezca una contraseña, el usuario deberá cambiarla al iniciar sesión.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </AdminRoute>
  );
};

export default AdminPanel; 