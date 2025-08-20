import React, { useState } from 'react';
import { registerUser } from '../services/firebase';
import { useNavigate } from 'react-router-dom';
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
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full border border-gray-200">
        <h2 className="text-4xl font-bold text-purple-800 mb-6 text-center">Registrarse</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-gray-700 text-lg font-medium mb-2">Email</label>
            <input
              type="email"
              id="email"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-700 text-lg font-medium mb-2">Contraseña</label>
            <input
              type="password"
              id="password"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800"
              placeholder=""
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-700 transition duration-300 shadow-md"
          >
            Crear Cuenta
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-purple-600 hover:underline font-medium">
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  );
}