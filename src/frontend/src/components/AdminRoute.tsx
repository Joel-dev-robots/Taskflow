import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAppSelector } from '../store/hooks';
import PrivateRoute from './PrivateRoute';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  
  useEffect(() => {
    // Si el usuario está autenticado pero no es admin, redirigir
    if (isAuthenticated && user && user.role !== 'admin') {
      console.log('Redirección: Usuario no es admin', user);
      router.push('/dashboard');
    }
  }, [user, isAuthenticated, router]);

  return <PrivateRoute>{children}</PrivateRoute>;
};

export default AdminRoute; 