import React from 'react';

export default function HomePage() {
  return (
    <div className="min-h-screen md:min-h-[calc(100vh-80px)] flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10 max-w-4xl w-full text-center border border-gray-200 mt-4 md:mt-0">
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-700">
            ¡Bienvenido a tu AutoLavado Digital!
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-700 mb-8">
          Gestiona tus turnos, vehículos y reportes con la eficiencia que siempre soñaste.
          ¡Prepárate para la limpieza digital!
        </p>
        <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4">
          <a
            href="/agendar"
            className="px-6 py-4 bg-blue-600 text-white text-lg font-semibold rounded-full shadow-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105"
          >
            Agendar un Turno
          </a>
          <a
            href="/calendario"
            className="px-6 py-4 bg-purple-600 text-white text-lg font-semibold rounded-full shadow-lg hover:bg-purple-700 transition duration-300 transform hover:scale-105"
          >
            Ver Calendario
          </a>
        </div>
      </div>
    </div>
  );
}