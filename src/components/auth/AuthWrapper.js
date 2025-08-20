import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function AuthWrapper({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <p className="text-2xl text-gray-700">Cargando autenticación...</p>
      </div>
    );
  }

  if (!user) {
    // Redirige al login si no hay usuario autenticado
    return <Navigate to="/login" replace />;
  }

  return children;
}