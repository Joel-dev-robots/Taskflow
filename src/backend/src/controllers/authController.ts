import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User';
import { AuthRequest } from '../middlewares/auth';
import { SignOptions } from 'jsonwebtoken';

// Validación de registro
const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

// Validación de login
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

// Validación para cambio de contraseña
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres')
});

// Registrar usuario
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar datos
    const validatedData = registerSchema.parse(req.body);
    
    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      res.status(400).json({ message: 'El usuario ya existe' });
      return;
    }
    
    // Crear nuevo usuario
    const user = new User(validatedData);
    await user.save();
    
    // Generar JWT
    const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';
    
    const token = jwt.sign(
      { 
        userId: user.id,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Responder con usuario y token
    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Error de validación', errors: error.errors });
    } else {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Error en el servidor' });
    }
  }
};

// Login de usuario
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar datos
    const validatedData = loginSchema.parse(req.body);
    
    // Buscar usuario por email
    const user = await User.findOne({ email: validatedData.email });
    if (!user) {
      res.status(400).json({ message: 'Credenciales inválidas' });
      return;
    }
    
    // Verificar contraseña
    const isMatch = await user.comparePassword(validatedData.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Credenciales inválidas' });
      return;
    }
    
    // Generar JWT
    const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';
    
    const token = jwt.sign(
      { 
        userId: user.id,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Responder con usuario y token
    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        forcePasswordChange: user.forcePasswordChange || false
      },
      token
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Error de validación', errors: error.errors });
    } else {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Error en el servidor' });
    }
  }
};

// Obtener perfil de usuario
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    console.log("getProfile: ID de usuario en la solicitud:", userId);
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      console.log("getProfile: Usuario no encontrado en BD");
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }
    
    console.log("getProfile: Usuario encontrado en BD:", {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
    
    res.status(200).json({ 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      } 
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

/**
 * Permite a un usuario cambiar su propia contraseña
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  console.log('changePassword: Función llamada');
  
  try {
    // Verificar autenticación
    if (!req.user || !req.user.userId) {
      console.log('changePassword: Usuario no autenticado');
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }
    
    const userId = req.user.userId;
    console.log('changePassword: userId =', userId);
    
    // Validar datos
    try {
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      console.log('changePassword: Datos validados correctamente');
      
      // Buscar usuario
      const user = await User.findById(userId);
      if (!user) {
        console.log('changePassword: Usuario no encontrado con ID', userId);
        res.status(404).json({ message: 'Usuario no encontrado' });
        return;
      }
      
      // Verificar contraseña actual
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        console.log('changePassword: Contraseña actual incorrecta');
        res.status(400).json({ message: 'Contraseña actual incorrecta' });
        return;
      }
      
      // Actualizar contraseña
      user.password = newPassword;
      
      // Desactivar el forzado de cambio si estaba activo
      if (user.forcePasswordChange) {
        user.forcePasswordChange = false;
      }
      
      await user.save();
      console.log('changePassword: Contraseña actualizada con éxito para usuario', user.email);
      
      res.status(200).json({ message: 'Contraseña actualizada con éxito' });
      
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.log('changePassword: Error de validación', validationError.errors);
        res.status(400).json({ 
          message: 'Error de validación', 
          errors: validationError.errors 
        });
      } else {
        throw validationError;
      }
    }
  } catch (error) {
    console.error('changePassword: Error inesperado', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
