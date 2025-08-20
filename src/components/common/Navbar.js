import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logoutUser } from '../../services/firebase'; // Ruta CORRECTA
import { useAuth } from '../../hooks/useAuth'; // Ruta CORRECTA
import { toast } from 'react-toastify';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const navItems = [
    { name: 'Inicio', path: '/', icon: '🏠' },
    { name: 'Calendario', path: '/calendario', icon: '📅' },
    { name: 'Agendar', path: '/agendar', icon: '➕' },
    { name: 'Reportes', path: '/reportes', icon: '📊' },
    { name: 'Evaluación', path: '/evaluacion', icon: '⭐' },
  ];

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.info('¡Sesión cerrada correctamente!');
      navigate('/login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error.message);
      toast.error(`Error al cerrar sesión: ${error.message}`);
    }
  };

  return (
    <>
      {/* Navbar para desktop (arriba) */}
      <nav className="hidden md:block bg-white shadow-lg p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-gray-900">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-700">
              AutoLavado Digital
            </span>
          </Link>
          <div className="flex items-center space-x-6">
            {user && navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`text-lg font-medium transition-colors duration-300 ${
                  location.pathname === item.path
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                {item.name}
              </Link>
            ))}
            {user ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition duration-300"
              >
                Cerrar Sesión
              </button>
            ) : (
              <div className="flex space-x-4">
                <Link to="/login" className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition duration-300">
                  Iniciar Sesión
                </Link>
                <Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition duration-300">
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Navbar para móvil (abajo) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-padding">
        <div className="flex justify-around items-center p-2">
          {user ? (
            <>
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex flex-col items-center p-2 rounded-lg transition-colors duration-200 min-w-[60px] ${
                    location.pathname === item.path
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:text-blue-500'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-xs font-medium mt-1">{item.name}</span>
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="flex flex-col items-center p-2 text-red-600 hover:text-red-700 transition-colors duration-200 min-w-[60px]"
                aria-label="Cerrar sesión"
              >
                <span className="text-xl">🚪</span>
                <span className="text-xs font-medium mt-1">Salir</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex flex-col items-center p-2 text-blue-600 hover:text-blue-700 transition-colors duration-200 min-w-[60px]"
                aria-label="Iniciar sesión"
              >
                <span className="text-xl">🔑</span>
                <span className="text-xs font-medium mt-1">Entrar</span>
              </Link>
              <Link
                to="/register"
                className="flex flex-col items-center p-2 text-green-600 hover:text-green-700 transition-colors duration-200 min-w-[60px]"
                aria-label="Registrarse"
              >
                <span className="text-xl">📝</span>
                <span className="text-xs font-medium mt-1">Registro</span>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Espacio para el navbar móvil */}
      <div className="md:hidden h-16 safe-area-padding"></div>
    </>
  );
}