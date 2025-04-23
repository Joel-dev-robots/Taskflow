import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  iat: number;
  exp: number;
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

export const auth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No authentication token, access denied');
    }
    
    // Verify token
    const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    
    // Add user to request
    req.user = {
      userId: decoded.userId
    };
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed: Invalid token' });
  }
}; 