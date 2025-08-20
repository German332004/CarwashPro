// src/components/reports/LimpiezaReportes.js
import React, { useState } from 'react';
import { limpiarTodasLasEvaluaciones, limpiarEvaluacionesPorFecha, exportarEvaluaciones } from '../../services/firebase';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';

export default function LimpiezaReportes() {
  const { user } = useAuth();
  const [limpiando, setLimpiando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [fechaLimite, setFechaLimite] = useState('');

  const handleLimpiezaTotal = async () => {
    if (!window.confirm('⚠️ ¿ESTÁS ABSOLUTAMENTE SEGURO?\n\nEsta acción eliminará TODOS los reportes de evaluación existentes. \n\nESTA ACCIÓN NO SE PUEDE DESHACER.')) {
      return;
    }

    setLimpiando(true);
    try {
      const resultado = await limpiarTodasLasEvaluaciones(user.uid);
      toast.success(`✅ ${resultado.eliminados} evaluaciones eliminadas permanentemente`);
    } catch (error) {
      toast.error('❌ Error durante la limpieza: ' + error.message);
    } finally {
      setLimpiando(false);
    }
  };

  const handleLimpiezaPorFecha = async () => {
    if (!fechaLimite) {
      toast.error('Selecciona una fecha límite');
      return;
    }

    if (!window.confirm(`¿Eliminar TODAS las evaluaciones anteriores al ${fechaLimite}?`)) {
      return;
    }

    setLimpiando(true);
    try {
      const resultado = await limpiarEvaluacionesPorFecha(user.uid, fechaLimite);
      toast.success(`✅ ${resultado.eliminados} evaluaciones eliminadas`);
    } catch (error) {
      toast.error('❌ Error durante la limpieza: ' + error.message);
    } finally {
      setLimpiando(false);
    }
  };


  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
      <h3 className="text-xl font-semibold text-red-600 mb-4">🧹 Gestión de Reportes</h3>
      
      <div className="grid md:grid-cols-3 gap-4">


        {/* Limpieza por Fecha */}
        <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
          <h4 className="font-semibold text-orange-800 mb-2">🗓️ Limpiar por Fecha</h4>
          <p className="text-sm text-orange-600 mb-2">
            Eliminar reportes anteriores a:
          </p>
          <input
            type="date"
            value={fechaLimite}
            onChange={(e) => setFechaLimite(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 mb-2 text-sm"
          />
          <button
            onClick={handleLimpiezaPorFecha}
            disabled={limpiando || !fechaLimite}
            className="w-full bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50 text-sm"
          >
            {limpiando ? 'Limpiando...' : 'Limpiar Reportes Antiguos'}
          </button>
        </div>

        {/* Limpieza Total */}
        <div className="border border-red-200 rounded-lg p-4 bg-red-50">
          <h4 className="font-semibold text-red-800 mb-2">⚠️ Limpieza Total</h4>
          <p className="text-sm text-red-600 mb-3">
            Elimina TODOS los reportes permanentemente.
          </p>
          <button
            onClick={handleLimpiezaTotal}
            disabled={limpiando}
            className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 text-sm"
          >
            {limpiando ? 'Eliminando...' : 'Limpiar Todo'}
          </button>
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          ⚠️ <strong>Precaución:</strong> Estas acciones son irreversibles. 
          Se recomienda siempre exportar un backup antes de limpiar reportes.
        </p>
      </div>
    </div>
  );
}