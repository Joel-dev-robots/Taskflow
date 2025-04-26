import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/authSlice';
import { authService } from '../services/authService';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAdmin = authService.isAdmin();

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-primary-600 cursor-pointer">
                  Task Manager
                </Link>
              </div>
              {isAuthenticated && (
                <nav className="ml-6 flex space-x-8">
                  <Link
                    href="/dashboard"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer ${
                      router.pathname === '/dashboard'
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/tasks"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer ${
                      router.pathname.startsWith('/tasks')
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Tareas
                  </Link>
                </nav>
              )}
            </div>
            <div className="flex items-center">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <button 
                      onClick={toggleMenu}
                      className="flex items-center focus:outline-none cursor-pointer"
                    >
                      <span className="text-sm text-gray-700 mr-2">Hola, {user?.name}</span>
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {isMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                        <Link 
                          href="/profile" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Perfil
                        </Link>
                        {isAdmin && (
                          <Link 
                            href="/admin" 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Panel de Administración
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            handleLogout();
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                        >
                          Cerrar sesión
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 cursor-pointer"
                  >
                    Cerrar sesión
                  </button>
                </div>
              ) : (
                <div className="flex space-x-4">
                  <Link
                    href="/login"
                    className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md cursor-pointer ${
                      router.pathname === '/login'
                        ? 'text-white bg-primary-600'
                        : 'text-primary-600 bg-white hover:bg-gray-50'
                    }`}
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/register"
                    className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md cursor-pointer ${
                      router.pathname === '/register'
                        ? 'text-white bg-primary-600'
                        : 'text-primary-600 bg-white hover:bg-gray-50'
                    }`}
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Task Management. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 