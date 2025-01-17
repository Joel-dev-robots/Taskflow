import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { auth } from '../middlewares/auth';

const router = Router();

// Rutas pÃºblicas
router.post('/register', register);
router.post('/login', login);

// Rutas protegidas
router.get('/profile', auth, getProfile);

export default router;
