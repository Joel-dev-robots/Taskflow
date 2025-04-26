import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User';
import { AuthRequest } from '../middlewares/auth';
import { SignOptions } from 'jsonwebtoken';

// ValidaciÃ³n de registro
const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email invÃ¡lido'),
  password: z.string().min(6, 'La contraseÃ±a debe tener al menos 6 caracteres')
});

// ValidaciÃ³n de login
const loginSchema = z.object({
  email: z.string().email('Email invÃ¡lido'),
  password: z.string().min(6, 'La contraseÃ±a debe tener al menos 6 caracteres')
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
      res.status(400).json({ message: 'Validation error', errors: error.errors });
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
      res.status(400).json({ message: 'Credenciales invÃ¡lidas' });
      return;
    }
    
    // Verificar contraseÃ±a
    const isMatch = await user.comparePassword(validatedData.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Credenciales invÃ¡lidas' });
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
      res.status(400).json({ message: 'Validation error', errors: error.errors });
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
