import { Router } from 'express';
import { 
  getUsers, 
  getUserDetails, 
  resetUserPassword, 
  sendPasswordResetEmail,
  updateUserRole
} from '../controllers/adminController';
import { auth, adminAuth } from '../middlewares/auth';

const router = Router();

// Todas las rutas de administrador están protegidas
// Se requiere autenticación + rol de administrador
router.use(auth);
router.use(adminAuth);

// Rutas para gestión de usuarios
router.get('/users', getUsers);
router.get('/users/:userId', getUserDetails);
router.put('/users/:userId/role', updateUserRole);

// Rutas para gestión de contraseñas
router.post('/users/:userId/reset-password-email', sendPasswordResetEmail);
router.post('/users/reset-password', resetUserPassword);
router.put('/users/:userId/password', resetUserPassword);

export default router; 