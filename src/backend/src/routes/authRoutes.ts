import { Router } from 'express';
import * as authController from '../controllers/authController';
import { auth } from '../middlewares/auth';

// Log to check if changePassword is correctly imported
console.log('Auth controller methods:', Object.keys(authController));

const router = Router();

// Rutas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);

// Rutas protegidas
router.get('/profile', auth, authController.getProfile);
router.put('/change-password', auth, authController.changePassword);

export default router;
