import React from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-r from-blue-600/10 to-purple-600/10 transform -skew-y-6 -translate-y-32"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full transform translate-x-64 translate-y-64"></div>
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 max-w-4xl w-full border border-white/20">
          {/* Header con logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl shadow-lg mb-6">
              <span className="text-3xl text-white">🚗</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-700">
                CarwashPro
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 font-light">
              Manejo de lavado para flotas
            </p>
          </div>

          {/* Características principales */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="text-center p-6 bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Agenda Inteligente</h3>
              <p className="text-gray-600 text-sm">Reserva turnos en segundos, sin esperas</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Reportes en Tiempo Real</h3>
              <p className="text-gray-600 text-sm">Monitorea el rendimiento de tu negocio</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⭐</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Evaluación de Calidad</h3>
              <p className="text-gray-600 text-sm">Mantén los más altos estándares de servicio</p>
            </div>
          </div>

          {/* Llamado a la acción principal */}
          <div className="text-center">
            <p className="text-gray-600 mb-8 text-lg">
              Flota actual RADDI
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/agendar"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-full shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <span>Agendar Ahora</span>
                <span>→</span>
              </Link>
              
              <Link
                to="/calendario"
                className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-full border-2 border-blue-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-300 flex items-center justify-center space-x-2"
              >
                <span>Ver Disponibilidad</span>
                <span>📅</span>
              </Link>
            </div>

            {/* Texto secundario */}
            <p className="text-sm text-gray-500 mt-6">
              Sin complicaciones • Sin descargas • Acceso inmediato
            </p>
          </div>

          {/* Footer minimalista */}
          <div className="text-center mt-12 pt-8 border-t border-gray-100">
            <div className="flex justify-center space-x-6 mb-4">
              <span className="text-sm text-gray-500">⚡ Rápido</span>
              <span className="text-sm text-gray-500">🔒 Seguro</span>
              <span className="text-sm text-gray-500">💎 Premium</span>
            </div>
            <p className="text-xs text-gray-400">
              © 2024 AutoLavado Digital. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}