import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { loadUser } from '../store/authSlice';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, token } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // If we have a token but no user, try to load the user
    if (token && !isAuthenticated && !isLoading) {
      dispatch(loadUser());
    }
    
    // If we have no token and are not loading, redirect to login
    if (!token && !isLoading) {
      router.push('/login');
    }
  }, [token, isAuthenticated, isLoading, dispatch, router]);

  // Show loading or null while checking authentication
  if (isLoading || (!isAuthenticated && token)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If authenticated, render children
  return isAuthenticated ? <>{children}</> : null;
};

export default PrivateRoute; 