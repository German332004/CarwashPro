import React, { useState, useEffect } from 'react';
import { 
  getTodosTurnosParaEvaluacion, 
  guardarEvaluacion
} from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';

export default function EvaluacionPage() {
  const { user } = useAuth();
  const [todosTurnos, setTodosTurnos] = useState([]);
  const [turnosFiltrados, setTurnosFiltrados] = useState([]);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [modo, setModo] = useState('pendientes');
  const [busqueda, setBusqueda] = useState('');
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: ''
  });

  const [evaluacion, setEvaluacion] = useState({
    presentado: true,
    aireAcondicionado: '',
    estadoCauchos: '',
    observaciones: '',
    calificacion: 0
  });

  useEffect(() => {
    if (user) {
      fetchTodosTurnos();
    }
  }, [user]);

  useEffect(() => {
    aplicarFiltros();
  }, [todosTurnos, modo, busqueda, filtros]);

  const fetchTodosTurnos = async () => {
    if (!user) return;
    
    setCargando(true);
    try {
      const turnos = await getTodosTurnosParaEvaluacion(user.uid);
      setTodosTurnos(turnos);
    } catch (error) {
      console.error("Error cargando turnos:", error);
      toast.error("Error al cargar los turnos");
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltros = () => {
    let turnosFiltrados = [...todosTurnos];

    // Filtrar por modo
    if (modo === 'pendientes') {
      turnosFiltrados = turnosFiltrados.filter(turno => 
        turno.estado === 'pendiente' || turno.estado === 'confirmado'
      );
    }

    // Filtrar por búsqueda
    if (busqueda) {
      turnosFiltrados = turnosFiltrados.filter(turno => {
        const placaMatch = turno.placa && turno.placa.toLowerCase().includes(busqueda.toLowerCase());
        const duenoMatch = turno.dueno && turno.dueno.toLowerCase().includes(busqueda.toLowerCase());
        return placaMatch || duenoMatch;
      });
    }

    // Filtrar por fecha
    if (filtros.fechaInicio) {
      turnosFiltrados = turnosFiltrados.filter(turno => 
        turno.fecha >= filtros.fechaInicio
      );
    }

    if (filtros.fechaFin) {
      turnosFiltrados = turnosFiltrados.filter(turno => 
        turno.fecha <= filtros.fechaFin
      );
    }

    setTurnosFiltrados(turnosFiltrados);
  };

  const handleBuscarTurnos = () => {
    if (!busqueda.trim()) {
      aplicarFiltros();
      return;
    }

    // Búsqueda local
    const resultados = todosTurnos.filter(turno => {
      const placaMatch = turno.placa && turno.placa.toLowerCase().includes(busqueda.toLowerCase());
      const duenoMatch = turno.dueno && turno.dueno.toLowerCase().includes(busqueda.toLowerCase());
      return placaMatch || duenoMatch;
    });

    setTurnosFiltrados(resultados);
    
    if (resultados.length === 0) {
      toast.info('No se encontraron turnos que coincidan con la búsqueda');
    }
  };

  const handleSeleccionTurno = (turno) => {
    const hoy = new Date().toISOString().split('T')[0];
    if (turno.fecha > hoy) {
      toast.warning('No puedes evaluar turnos futuros');
      return;
    }

    setTurnoSeleccionado(turno);
    setEvaluacion({
      presentado: true,
      aireAcondicionado: '',
      estadoCauchos: '',
      observaciones: '',
      calificacion: 0
    });
  };

  const handleSubmitEvaluacion = async (e) => {
    e.preventDefault();
    if (!turnoSeleccionado || !user) return;
    
    setGuardando(true);
    
    try {
      await guardarEvaluacion({
        ...evaluacion,
        turnoId: turnoSeleccionado.id,
        placa: turnoSeleccionado.placa,
        dueno: turnoSeleccionado.dueno,
        servicio: turnoSeleccionado.servicio,
        fechaTurno: turnoSeleccionado.fecha,
        userId: user.uid
      });
      
      toast.success('Evaluación guardada correctamente');
      setTurnoSeleccionado(null);
      fetchTodosTurnos();
      
    } catch (error) {
      console.error("Error guardando evaluación:", error);
      toast.error("Error al guardar la evaluación");
    } finally {
      setGuardando(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'confirmado': return 'bg-blue-100 text-blue-800';
      case 'evaluado': return 'bg-green-100 text-green-800';
      case 'no_presentado': return 'bg-red-100 text-red-800';
      case 'cancelado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'confirmado': return 'Confirmado';
      case 'evaluado': return 'Evaluado';
      case 'no_presentado': return 'No Presentado';
      case 'cancelado': return 'Cancelado';
      default: return estado;
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-yellow-800 mb-6 text-center">Evaluación de Vehículos</h2>

        {/* Filtros y Búsqueda */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Filtros y Búsqueda</h3>
          
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Mostrar:</label>
              <select
                value={modo}
                onChange={(e) => setModo(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="pendientes">Solo Pendientes</option>
                <option value="todos">Todos los Turnos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Buscar por placa o dueño:</label>
              <div className="flex">
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="ABC-123 o Nombre"
                  className="flex-1 p-2 border border-gray-300 rounded-l-lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleBuscarTurnos()}
                />
                <button
                  onClick={handleBuscarTurnos}
                  className="bg-blue-600 text-white px-4 rounded-r-lg hover:bg-blue-700"
                >
                  🔍
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Filtrar por fecha:</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  placeholder="Desde"
                  value={filtros.fechaInicio}
                  onChange={(e) => setFiltros({...filtros, fechaInicio: e.target.value})}
                  className="p-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="date"
                  placeholder="Hasta"
                  value={filtros.fechaFin}
                  onChange={(e) => setFiltros({...filtros, fechaFin: e.target.value})}
                  className="p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {turnosFiltrados.length} turnos encontrados
            </span>
            <button
              onClick={() => {
                setBusqueda('');
                setFiltros({ fechaInicio: '', fechaFin: '' });
                setModo('pendientes');
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Lista de turnos */}
        {!turnoSeleccionado && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">
              {modo === 'pendientes' ? 'Turnos Pendientes de Evaluación' : 'Todos los Turnos'}
            </h3>
            
            {turnosFiltrados.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No hay turnos que coincidan con los filtros</p>
            ) : (
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {turnosFiltrados.map(turno => (
                  <div key={turno.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSeleccionTurno(turno)}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold">{turno.placa}</span>
                        <span className="text-sm text-gray-600">{turno.dueno}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getEstadoColor(turno.estado)}`}>
                          {getEstadoTexto(turno.estado)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{turno.servicio} - {turno.fecha} {turno.hora}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold">${turno.precio || '0'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Formulario de evaluación */}
        {turnoSeleccionado && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Evaluando: {turnoSeleccionado.placa}</h3>
              <button onClick={() => setTurnoSeleccionado(null)} className="text-gray-500 hover:text-gray-700">
                ← Volver
              </button>
            </div>

            <form onSubmit={handleSubmitEvaluacion} className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-lg font-medium mb-3">¿El vehículo se presentó?</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input type="radio" name="presentado" checked={evaluacion.presentado} 
                      onChange={() => setEvaluacion({...evaluacion, presentado: true})} className="mr-2" />
                    <span className="text-green-600 font-medium">✓ Sí se presentó</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="presentado" checked={!evaluacion.presentado} 
                      onChange={() => setEvaluacion({...evaluacion, presentado: false})} className="mr-2" />
                    <span className="text-red-600 font-medium">✗ No se presentó</span>
                  </label>
                </div>
              </div>

              {evaluacion.presentado && (
                <>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Estado del Aire Acondicionado</label>
                    <select value={evaluacion.aireAcondicionado} 
                      onChange={(e) => setEvaluacion({...evaluacion, aireAcondicionado: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required>
                      <option value="">Seleccionar estado</option>
                      <option value="excelente">Excelente - Funciona perfectamente</option>
                      <option value="bueno">Bueno - Funciona con normalidad</option>
                      <option value="regular">Regular - Requiere mantenimiento</option>
                      <option value="malo">Malo - No funciona correctamente</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Estado de los Cauchos</label>
                    <select value={evaluacion.estadoCauchos} 
                      onChange={(e) => setEvaluacion({...evaluacion, estadoCauchos: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required>
                      <option value="">Seleccionar estado</option>
                      <option value="excelente">Excelente - Nuevos o como nuevos</option>
                      <option value="bueno">Bueno - Desgaste normal</option>
                      <option value="regular">Regular - Requieren cambio pronto</option>
                      <option value="malo">Malo - Urgente cambio</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Calificación General (1-5)</label>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} type="button" onClick={() => setEvaluacion({...evaluacion, calificacion: star})}
                          className={`text-2xl ${evaluacion.calificacion >= star ? 'text-yellow-400' : 'text-gray-300'}`}>
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Observaciones</label>
                    <textarea value={evaluacion.observaciones} 
                      onChange={(e) => setEvaluacion({...evaluacion, observaciones: e.target.value})}
                      rows="4" placeholder="Notas adicionales sobre el estado del vehículo..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
                  </div>
                </>
              )}

              <div className="flex space-x-4">
                <button type="button" onClick={() => setTurnoSeleccionado(null)}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition duration-300">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-700 transition duration-300 disabled:opacity-50">
                  {guardando ? 'Guardando...' : 'Guardar Evaluación'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}