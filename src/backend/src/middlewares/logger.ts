import morgan from 'morgan';
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create a write stream for access logs
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

// Development logging format (colored, detailed)
export const devLogger = morgan('dev');

// Production logging format (combined format to file)
export const prodLogger = morgan('combined', { stream: accessLogStream });

// Custom logging middleware that selects the appropriate logger based on environment
export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production') {
    return prodLogger(req, res, next);
  } else {
    return devLogger(req, res, next);
  }
};

export default loggerMiddleware; 