import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Servicio para manejar operaciones relacionadas con correos electrónicos
 * como recuperación de contraseña, verificación de cuenta, etc.
 */

interface EmailResponse {
  success: boolean;
  message: string;
  data?: any;
}

class EmailService {
  private apiUrl: string;
  
  constructor() {
    // URL base de la API para operaciones de correo
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  }

  /**
   * Solicita un restablecimiento de contraseña para el correo electrónico proporcionado
   * @param email - Correo electrónico del usuario
   * @returns Respuesta con estado de éxito y mensaje
   */
  async requestPasswordReset(email: string): Promise<EmailResponse> {
    // En modo desarrollo, simular una respuesta exitosa
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV MODE] Simulando solicitud de recuperación para: ${email}`);
      
      // Simular un pequeño retraso como lo haría una API real
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: `Se ha enviado un enlace de recuperación a ${email}. (Simulado en modo desarrollo)`,
      };
    }
    
    try {
      // En producción, conectarse a la API real
      const response = await fetch(`${this.apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'No se pudo procesar la solicitud de recuperación de contraseña');
      }
      
      return {
        success: true,
        message: data.message || 'Se ha enviado un enlace de recuperación a tu correo electrónico',
        data: data.data,
      };
    } catch (error: any) {
      console.error('Error al solicitar recuperación de contraseña:', error);
      throw new Error(error.message || 'Error al conectar con el servicio. Inténtalo de nuevo más tarde.');
    }
  }

  /**
   * Verifica un token de restablecimiento de contraseña
   * @param token - Token de recuperación
   * @returns Respuesta con estado de validez del token
   */
  async verifyResetToken(token: string): Promise<EmailResponse> {
    if (process.env.NODE_ENV !== 'production') {
      // En desarrollo, aceptar cualquier token que no sea vacío
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!token) {
        return {
          success: false,
          message: 'Token inválido o expirado',
        };
      }
      
      return {
        success: true,
        message: 'Token válido',
      };
    }
    
    try {
      const response = await fetch(`${this.apiUrl}/auth/verify-reset-token/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Token inválido o expirado');
      }
      
      return {
        success: true,
        message: data.message || 'Token verificado correctamente',
        data: data.data,
      };
    } catch (error: any) {
      console.error('Error al verificar token de recuperación:', error);
      throw new Error(error.message || 'No se pudo verificar el token. Inténtalo de nuevo.');
    }
  }

  /**
   * Restablece la contraseña de un usuario utilizando un token válido
   * @param token - Token de recuperación
   * @param newPassword - Nueva contraseña
   * @returns Respuesta con estado de éxito
   */
  async resetPassword(token: string, newPassword: string): Promise<EmailResponse> {
    if (process.env.NODE_ENV !== 'production') {
      // En desarrollo, simular éxito si el token no está vacío y la contraseña tiene al menos 6 caracteres
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (!token) {
        return {
          success: false,
          message: 'Token inválido o expirado',
        };
      }
      
      if (newPassword.length < 6) {
        return {
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres',
        };
      }
      
      return {
        success: true,
        message: 'Contraseña restablecida correctamente (Simulado en modo desarrollo)',
      };
    }
    
    try {
      const response = await fetch(`${this.apiUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'No se pudo restablecer la contraseña');
      }
      
      return {
        success: true,
        message: data.message || 'Contraseña restablecida correctamente',
        data: data.data,
      };
    } catch (error: any) {
      console.error('Error al restablecer contraseña:', error);
      throw new Error(error.message || 'Error al conectar con el servicio. Inténtalo de nuevo más tarde.');
    }
  }
}

// Exportar una única instancia del servicio
const emailService = new EmailService();
export default emailService; 