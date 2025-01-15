﻿import { Request, Response, NextFunction } from 'express';

// Middleware para validar datos con esquemas de Zod
export const validate = (schema: any) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error: any) {
    return res.status(400).json({ 
      message: 'Validation error', 
      errors: error.errors 
    });
  }
};
