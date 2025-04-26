import { authService } from './authService';
import axios from 'axios';

interface AdminResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

class AdminService {
  private apiUrl: string;
  
  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  }
  
  // Helper para obtener la configuración de autenticación
  private getAuthConfig() {
    const token = authService.getToken();
    if (!token) {
      throw new Error('Se requiere autenticación');
    }
    
    return {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
  }
  
  // Transforma los usuarios de MongoDB a nuestro formato frontend
  private transformUser(mongoUser: any): User {
    return {
      id: mongoUser._id || mongoUser.id,  // Soporte para ambos formatos
      name: mongoUser.name,
      email: mongoUser.email,
      role: mongoUser.role,
      createdAt: mongoUser.createdAt,
      updatedAt: mongoUser.updatedAt
    };
  }
  
  /**
   * Obtiene todos los usuarios del sistema
   */
  async getUsers(): Promise<User[]> {
    try {
      console.log(`Haciendo petición GET a ${this.apiUrl}/admin/users`);
      const response = await axios.get(`${this.apiUrl}/admin/users`, this.getAuthConfig());
      console.log('Respuesta completa de getUsers:', response);
      
      // Transformar los usuarios de MongoDB (_id) a nuestro formato (id)
      const transformedUsers = response.data.users.map((user: any) => this.transformUser(user));
      return transformedUsers;
    } catch (error: any) {
      console.error('Error completo en adminService.getUsers:', error);
      if (error.response) {
        console.error('Error de respuesta:', error.response.data);
        console.error('Estado HTTP:', error.response.status);
        throw new Error(error.response.data.message || 'Error al obtener usuarios');
      }
      throw error;
    }
  }
  
  /**
   * Obtiene los detalles de un usuario específico
   */
  async getUserDetails(userId: string): Promise<User> {
    try {
      console.log(`Haciendo petición GET a ${this.apiUrl}/admin/users/${userId}`);
      const response = await axios.get(`${this.apiUrl}/admin/users/${userId}`, this.getAuthConfig());
      console.log('Respuesta completa de getUserDetails:', response);
      return this.transformUser(response.data.user);
    } catch (error: any) {
      console.error('Error completo en adminService.getUserDetails:', error);
      if (error.response) {
        console.error('Error de respuesta:', error.response.data);
        console.error('Estado HTTP:', error.response.status);
        throw new Error(error.response.data.message || 'Error al obtener detalles del usuario');
      }
      throw error;
    }
  }
  
  /**
   * Actualiza el rol de un usuario
   */
  async updateUserRole(userId: string, role: 'user' | 'admin'): Promise<AdminResponse> {
    try {
      console.log(`Haciendo petición PUT a ${this.apiUrl}/admin/users/${userId}/role con rol ${role}`);
      // Verificamos explícitamente que userId no sea undefined
      if (!userId) {
        throw new Error('ID de usuario no puede ser undefined');
      }
      
      const response = await axios.put(
        `${this.apiUrl}/admin/users/${userId}/role`, 
        { role }, 
        this.getAuthConfig()
      );
      console.log('Respuesta completa de updateUserRole:', response);
      
      return {
        success: true,
        message: response.data.message,
        data: response.data.user ? this.transformUser(response.data.user) : undefined
      };
    } catch (error: any) {
      console.error('Error completo en adminService.updateUserRole:', error);
      if (error.response) {
        console.error('Error de respuesta:', error.response.data);
        console.error('Estado HTTP:', error.response.status);
        throw new Error(error.response.data.message || 'Error al actualizar rol');
      }
      throw error;
    }
  }
  
  /**
   * Restablece la contraseña de un usuario
   */
  async resetUserPassword(userId: string, newPassword: string): Promise<AdminResponse> {
    try {
      console.log(`Haciendo petición POST a ${this.apiUrl}/admin/users/reset-password`);
      // Verificamos explícitamente que userId no sea undefined
      if (!userId) {
        throw new Error('ID de usuario no puede ser undefined');
      }
      
      const response = await axios.post(
        `${this.apiUrl}/admin/users/reset-password`, 
        { userId, newPassword }, 
        this.getAuthConfig()
      );
      console.log('Respuesta completa de resetUserPassword:', response);
      
      return {
        success: true,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Error completo en adminService.resetUserPassword:', error);
      if (error.response) {
        console.error('Error de respuesta:', error.response.data);
        console.error('Estado HTTP:', error.response.status);
        throw new Error(error.response.data.message || 'Error al restablecer contraseña');
      }
      throw error;
    }
  }
  
  /**
   * Envía un correo de restablecimiento de contraseña
   */
  async sendPasswordResetEmail(userId: string): Promise<AdminResponse> {
    try {
      console.log(`Haciendo petición POST a ${this.apiUrl}/admin/users/${userId}/reset-password-email`);
      // Verificamos explícitamente que userId no sea undefined
      if (!userId) {
        throw new Error('ID de usuario no puede ser undefined');
      }
      
      const response = await axios.post(
        `${this.apiUrl}/admin/users/${userId}/reset-password-email`, 
        {}, 
        this.getAuthConfig()
      );
      console.log('Respuesta completa de sendPasswordResetEmail:', response);
      
      return {
        success: true,
        message: response.data.message,
        data: response.data.token && response.data.resetUrl 
          ? { token: response.data.token, resetUrl: response.data.resetUrl } 
          : undefined
      };
    } catch (error: any) {
      console.error('Error completo en adminService.sendPasswordResetEmail:', error);
      if (error.response) {
        console.error('Error de respuesta:', error.response.data);
        console.error('Estado HTTP:', error.response.status);
        throw new Error(error.response.data.message || 'Error al enviar correo');
      }
      throw error;
    }
  }
}

// Exportar una única instancia del servicio
const adminService = new AdminService();
export default adminService; 