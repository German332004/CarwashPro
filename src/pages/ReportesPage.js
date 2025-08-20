import React, { useState, useEffect } from 'react';
import { getEvaluacionesConFiltros } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { generarPDFDesdeData } from '../services/pdfGenerator';
import LimpiezaReportes from '../components/reports/LimpiezaReportes';
import { toast } from 'react-toastify';

export default function ReportesPage() {
  const { user } = useAuth();
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [evaluacionesFiltradas, setEvaluacionesFiltradas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    tipo: 'todos' // 'todos', 'presentados', 'no-presentados'
  });

  useEffect(() => {
    if (user) {
      fetchEvaluaciones();
    }
  }, [user]);

  useEffect(() => {
    aplicarFiltros();
  }, [evaluaciones, filtros]);

  const fetchEvaluaciones = async () => {
    setCargando(true);
    try {
      const data = await getEvaluacionesConFiltros(user.uid);
      setEvaluaciones(data);
    } catch (error) {
      console.error("Error cargando evaluaciones:", error);
      toast.error("Error al cargar evaluaciones");
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltros = () => {
    let filtered = [...evaluaciones];

    // Filtrar por tipo
    if (filtros.tipo === 'presentados') {
      filtered = filtered.filter(e => e.presentado);
    } else if (filtros.tipo === 'no-presentados') {
      filtered = filtered.filter(e => !e.presentado);
    }

    // Filtrar por fecha
    if (filtros.fechaInicio) {
      filtered = filtered.filter(e => e.fechaTurno >= filtros.fechaInicio);
    }

    if (filtros.fechaFin) {
      filtered = filtered.filter(e => e.fechaTurno <= filtros.fechaFin);
    }

    setEvaluacionesFiltradas(filtered);
  };

  const handleGenerarPDF = async (tipo = 'completo') => {
    setGenerandoPDF(true);
    try {
      let data;
      let filename;

      // Filtrar data según el tipo específico del botón
      if (tipo === 'presentados') {
        data = evaluacionesFiltradas.filter(e => e.presentado);
        filename = `reporte-presentados-${new Date().toISOString().split('T')[0]}.pdf`;
      } else if (tipo === 'no-presentados') {
        data = evaluacionesFiltradas.filter(e => !e.presentado);
        filename = `reporte-no-presentados-${new Date().toISOString().split('T')[0]}.pdf`;
      } else {
        data = evaluacionesFiltradas;
        filename = `reporte-completo-${new Date().toISOString().split('T')[0]}.pdf`;
      }

      await generarPDFDesdeData(data, filename);
      toast.success('✅ PDF generado correctamente');

    } catch (error) {
      toast.error('❌ Error generando PDF: ' + error.message);
    } finally {
      setGenerandoPDF(false);
    }
  };

  // Calcular estadísticas
  const estadisticas = {
    total: evaluacionesFiltradas.length,
    presentados: evaluacionesFiltradas.filter(e => e.presentado).length,
    noPresentados: evaluacionesFiltradas.filter(e => !e.presentado).length,
    tasaPresentacion: evaluacionesFiltradas.length > 0 ? 
      Math.round((evaluacionesFiltradas.filter(e => e.presentado).length / evaluacionesFiltradas.length) * 100) : 0
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-green-800 mb-8 text-center">📊 Reportes y Evaluaciones</h2>

        {/* Panel de Limpieza */}
        <LimpiezaReportes />

        {/* Panel de Filtros */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Filtros de Reportes</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tipo:</label>
              <select
                value={filtros.tipo}
                onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="todos">Todos</option>
                <option value="presentados">Presentados</option>
                <option value="no-presentados">No Presentados</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Fecha desde:</label>
              <input
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) => setFiltros({...filtros, fechaInicio: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Fecha hasta:</label>
              <input
                type="date"
                value={filtros.fechaFin}
                onChange={(e) => setFiltros({...filtros, fechaFin: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {evaluacionesFiltradas.length} evaluaciones filtradas
            </span>
            <button
              onClick={() => setFiltros({ fechaInicio: '', fechaFin: '', tipo: 'todos' })}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Botones de Exportación */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">📤 Exportar Reportes</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleGenerarPDF('completo')}
              disabled={generandoPDF || evaluacionesFiltradas.length === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              📄 Exportar PDF Completo
            </button>
            <button
              onClick={() => handleGenerarPDF('presentados')}
              disabled={generandoPDF || estadisticas.presentados === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              ✅ PDF Presentados
            </button>
            <button
              onClick={() => handleGenerarPDF('no-presentados')}
              disabled={generandoPDF || estadisticas.noPresentados === 0}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              ❌ PDF No Presentados
            </button>
          </div>
          {generandoPDF && (
            <p className="text-sm text-blue-600 mt-3">🔄 Generando PDF...</p>
          )}
        </div>

        {/* Contenido de Reportes */}
        <div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Vehículos Presentados */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-semibold text-green-700 mb-4 flex items-center">
                <span className="text-2xl mr-2">✅</span> Vehículos Presentados ({estadisticas.presentados})
              </h3>
              
              {estadisticas.presentados === 0 ? (
                <p className="text-gray-600 text-center py-4">No hay evaluaciones de vehículos presentados</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {evaluacionesFiltradas
                    .filter(e => e.presentado)
                    .map(evaluacion => (
                    <div key={evaluacion.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold">{evaluacion.placa}</span>
                        <span className="text-yellow-400 text-lg">
                          {'★'.repeat(evaluacion.calificacion || 0)}
                          {'☆'.repeat(5 - (evaluacion.calificacion || 0))}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{evaluacion.fechaTurno} - {evaluacion.servicio}</p>
                      <p className="text-sm"><strong>Aire:</strong> {evaluacion.aireAcondicionado || 'No evaluado'}</p>
                      <p className="text-sm"><strong>Cauchos:</strong> {evaluacion.estadoCauchos || 'No evaluado'}</p>
                      {evaluacion.observaciones && (
                        <p className="text-sm mt-2 text-gray-700"><strong>Obs:</strong> {evaluacion.observaciones}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vehículos No Presentados */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-semibold text-red-700 mb-4 flex items-center">
                <span className="text-2xl mr-2">❌</span> Vehículos No Presentados ({estadisticas.noPresentados})
              </h3>
              
              {estadisticas.noPresentados === 0 ? (
                <p className="text-gray-600 text-center py-4">No hay registros de vehículos no presentados</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {evaluacionesFiltradas
                    .filter(e => !e.presentado)
                    .map(evaluacion => (
                    <div key={evaluacion.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">{evaluacion.placa}</span>
                        <span className="text-red-600 text-sm">No presentado</span>
                      </div>
                      <p className="text-sm text-gray-600">{evaluacion.fechaTurno} - {evaluacion.servicio}</p>
                      <p className="text-sm text-gray-600">Dueño: {evaluacion.dueno}</p>
                      {evaluacion.evaluadoEn && (
                        <p className="text-sm text-red-700 mt-2">
                          Turno perdido el {new Date(evaluacion.evaluadoEn?.toDate()).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Estadísticas */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
            <h3 className="text-xl font-semibold mb-4">Estadísticas de Evaluación</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{estadisticas.total}</div>
                <div className="text-sm text-blue-800">Total Evaluados</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{estadisticas.presentados}</div>
                <div className="text-sm text-green-800">Presentados</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{estadisticas.noPresentados}</div>
                <div className="text-sm text-red-800">No Presentados</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {estadisticas.tasaPresentacion}%
                </div>
                <div className="text-sm text-yellow-800">Tasa de Presentación</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}