import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extender Request para incluir usuario
export interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
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
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
