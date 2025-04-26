import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import User from '../models/User';
import { AuthRequest } from '../middlewares/auth';
import crypto from 'crypto';
import { emitPasswordResetRequest } from '../index';

// Validación para restablecimiento de contraseña
const resetPasswordSchema = z.object({
  userId: z.string().optional(),
  newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
}).refine(data => data.password || data.newPassword, {
  message: "Se requiere una contraseña (password o newPassword)",
  path: ["password"]
});

/**
 * Obtiene la lista de todos los usuarios (excepto sus contraseñas)
 */
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ users });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

/**
 * Obtiene los detalles de un usuario específico (excepto su contraseña)
 */
export const getUserDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }
    
    res.status(200).json({ user });
  } catch (error) {
    console.error('Error al obtener detalles del usuario:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

/**
 * Restablece la contraseña de un usuario
 * Esta función permite a un administrador establecer una nueva contraseña
 * para cualquier usuario, notificando al usuario del cambio
 */
export const resetUserPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('Body recibido:', JSON.stringify(req.body));
    console.log('Params recibidos:', JSON.stringify(req.params));
    
    // Validar datos de entrada
    const validatedData = resetPasswordSchema.parse(req.body);
    console.log('Datos validados:', JSON.stringify(validatedData));
    
    // Obtener userId de los parámetros de la URL (para PUT request) o del cuerpo (para POST request)
    let userId = req.params.userId || validatedData.userId;
    
    console.log('UserID extraído:', userId);
    
    if (!userId) {
      res.status(400).json({ message: 'ID de usuario es requerido' });
      return;
    }
    
    // Obtener la nueva contraseña del cuerpo 
    const newPassword = validatedData.password || validatedData.newPassword;
    
    console.log('¿Password recibido?', !!newPassword);
    
    if (!newPassword) {
      res.status(400).json({ message: 'La nueva contraseña es requerida' });
      return;
    }
    
    // Buscar al usuario
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }
    
    // Establecer la nueva contraseña directamente (se hasheará automáticamente en el pre-save hook)
    user.password = newPassword;
    
    // Forzar cambio de contraseña en siguiente inicio de sesión
    user.forcePasswordChange = true;
    
    // Limpiar la solicitud de restablecimiento si existía
    user.passwordResetRequested = false;
    
    await user.save();
    
    // TODO: En un sistema real, enviar notificación por email al usuario
    
    // Responder con éxito
    res.status(200).json({ 
      message: `Contraseña restablecida para el usuario ${user.email}`,
      emailSent: process.env.NODE_ENV === 'production' 
        ? true 
        : 'Simulado en entorno de desarrollo'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('ZodError:', JSON.stringify(error.errors));
      res.status(400).json({ message: 'Error de validación', errors: error.errors });
    } else {
      console.error('Error al restablecer contraseña:', error);
      res.status(500).json({ message: 'Error en el servidor' });
    }
  }
};

/**
 * Genera un token temporal y envía un enlace de restablecimiento 
 * Esta función envía un email al usuario para que pueda restablecer su contraseña
 */
export const sendPasswordResetEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    // Buscar al usuario
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }
    
    // Generar token único
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Almacenar el token en la base de datos con tiempo de expiración
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hora
    user.passwordResetRequested = true; // Marcar como pendiente de reset
    await user.save();
    
    // Construir URL para reset
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    
    // Emitir notificación por socket.io a los administradores
    emitPasswordResetRequest({
      id: user._id.toString(),
      name: user.name,
      email: user.email
    });
    
    // Responder con éxito
    res.status(200).json({ 
      message: `Solicitud de restablecimiento registrada para ${user.email}`,
      emailSent: process.env.NODE_ENV === 'production' 
        ? true 
        : 'Simulado en entorno de desarrollo',
      // Solo en desarrollo, mostrar el token y URL
      ...(process.env.NODE_ENV !== 'production' && { 
        token: resetToken,
        resetUrl
      })
    });
  } catch (error) {
    console.error('Error al enviar email de restablecimiento:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

/**
 * Actualiza el rol de un usuario
 */
export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    console.log('updateUserRole: ID recibido =', userId);
    console.log('updateUserRole: Tipo de ID =', typeof userId);
    console.log('updateUserRole: Rol recibido =', role);
    
    // Verificar que el rol sea válido
    if (!['user', 'admin'].includes(role)) {
      res.status(400).json({ message: 'Rol inválido. Los valores permitidos son: user, admin' });
      return;
    }
    
    // Buscar y actualizar el usuario
    const user = await User.findByIdAndUpdate(
      userId, 
      { role }, 
      { new: true }
    ).select('-password');
    
    if (!user) {
      console.log('updateUserRole: Usuario no encontrado con ID', userId);
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }
    
    console.log('updateUserRole: Usuario actualizado =', { id: user._id, email: user.email, role: user.role });
    
    res.status(200).json({ 
      message: `Rol actualizado para ${user.email}`,
      user
    });
  } catch (error) {
    console.error('Error al actualizar rol:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
}; 