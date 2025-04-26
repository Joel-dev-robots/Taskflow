/**
 * Servicio para manejar operaciones relacionadas con la autenticación
 * Proporciona métodos para recuperar, almacenar y eliminar tokens
 */
class AuthService {
  /**
   * Obtiene el token de autenticación almacenado
   * @returns El token almacenado o null si no existe
   */
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }
  
  /**
   * Guarda el token de autenticación
   * @param token - El token JWT a almacenar
   */
  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }
  
  /**
   * Elimina el token de autenticación
   */
  removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }
  
  /**
   * Verifica si el usuario actual es administrador
   * @returns true si el usuario tiene rol de administrador
   */
  isAdmin(): boolean {
    try {
      const token = this.getToken();
      if (!token) {
        console.log('isAdmin: No hay token');
        return false;
      }
      
      // Decodificar el token para obtener la carga útil (payload)
      // Nota: Esto NO verifica la validez del token, solo decodifica su contenido
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('isAdmin: Payload del token:', payload);
      
      // Comprobar si el payload contiene un campo role con valor 'admin'
      const isAdmin = payload.role === 'admin';
      console.log('isAdmin: El usuario es admin?', isAdmin);
      return isAdmin;
    } catch (error) {
      console.error('Error al verificar rol de administrador:', error);
      return false;
    }
  }
}

// Exportar una instancia única del servicio
export const authService = new AuthService(); 