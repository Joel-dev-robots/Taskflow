import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// Extender Request para incluir usuario
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}

// Interfaz para el payload del token JWT
interface JwtPayload {
  userId: string;
  role?: string;
}

export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Get token from header
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1];

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Asegurarnos de copiar el rol desde el token si existe
    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };
    
    console.log("Token decodificado:", decoded);
    console.log("Usuario en la solicitud:", req.user);
    
    next();
  } catch (err) {
    console.error("Error al verificar token:", err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware para verificar si el usuario es administrador
export const adminAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.userId) {
    return res.status(401).json({ message: 'Authorization denied' });
  }
  
  try {
    // Si ya tenemos el rol del token y es 'admin', podemos proceder sin consultar la BD
    if (req.user.role === 'admin') {
      console.log("Usuario ya autenticado como admin por el token");
      return next();
    }
    
    // Si no tenemos el rol o no es admin, verificamos en la BD
    console.log("Verificando rol de admin en la base de datos para usuario:", req.user.userId);
    
    // Buscar el usuario para verificar su rol
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      console.log("Usuario no encontrado en la BD");
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    console.log("Rol del usuario en la BD:", user.role);
    
    if (user.role !== 'admin') {
      console.log("Usuario no tiene rol de admin");
      return res.status(403).json({ message: 'Acceso denegado: se requieren privilegios de administrador' });
    }
    
    // Añadir el rol al objeto user en la solicitud
    req.user.role = user.role;
    console.log("Usuario autenticado como admin después de verificar en la BD");
    next();
  } catch (error) {
    console.error('Error en adminAuth middleware:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};
