import React, { useState } from 'react';
import { registerUser } from '../services/firebase';
import { useNavigate, Link } from 'react-router-dom'; // ✅ Agregar Link
import { toast } from 'react-toastify';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerUser(email, password);
      toast.success('¡Registro exitoso! Ahora puedes iniciar sesión.');
      navigate('/login'); // Redirige al login después del registro
    } catch (error) {
      console.error("Error al registrar usuario:", error.message);
      toast.error(`Error al registrar: ${error.message}`);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-r from-blue-600/10 to-purple-600/10 transform -skew-y-6 -translate-y-32"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full transform translate-x-64 translate-y-64"></div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Header con logo - CONSISTENTE con Login */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl shadow-lg mb-6">
            <span className="text-3xl text-white">🚗</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-700">
              Crear Cuenta
            </span>
          </h1>
          <p className="text-gray-600">Únete a AutoLavado Digital</p>
        </div>

        {/* Formulario de registro */}
        <div className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-gray-700 text-lg font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition duration-200"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-gray-700 text-lg font-medium mb-2">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800 transition duration-200"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength="6"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition duration-300 shadow-md transform hover:scale-[1.02]"
            >
              Crear Cuenta
            </button>
          </form>
          
          <p className="mt-6 text-center text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link 
              to="/login" 
              className="text-green-600 hover:underline font-medium"
            >
              Inicia sesión aquí
            </Link>
          </p>
        </div>

        {/* Footer minimalista */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-400">
            © 2024 AutoLavado Digital. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}