import React, { useState, useEffect } from 'react';
import { 
  addTurno, 
  getVehiculos, 
  addVehiculo, 
  deleteVehiculo, 
  checkDisponibilidad, 
  getHorariosOcupados,
  getVehiculosConTurnos,
  calcularProximaFechaLaboral,
  getTurnos
} from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';

export default function AgendarPage() {
  const { user } = useAuth();
  // Estados para agendado manual
  const [placa, setPlaca] = useState('');
  const [dueno, setDueno] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [servicio, setServicio] = useState('');
  const [precio, setPrecio] = useState('');
  const [vehiculosGuardados, setVehiculosGuardados] = useState([]);
  const [selectedVehiculo, setSelectedVehiculo] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [vehiculoToDelete, setVehiculoToDelete] = useState(null);
  const [horariosOcupados, setHorariosOcupados] = useState([]);
  const [validandoHorario, setValidandoHorario] = useState(false);
  
  // Estados para autoagendado
  const [autoAgendando, setAutoAgendando] = useState(false);
  const [vehiculosConTurnos, setVehiculosConTurnos] = useState([]);
  const [fechaBaseAutoagendado, setFechaBaseAutoagendado] = useState('');
  const [vehiculosFechaSeleccionada, setVehiculosFechaSeleccionada] = useState([]);
  const [cargandoVehiculosFecha, setCargandoVehiculosFecha] = useState(false);

  useEffect(() => {
    fetchVehiculos();
  }, [user]);

  useEffect(() => {
    if (fecha && user) {
      fetchHorariosOcupados();
    } else {
      setHorariosOcupados([]);
    }
  }, [fecha, user]);

  useEffect(() => {
    if (user) {
      fetchVehiculosConTurnos();
    }
  }, [user, vehiculosGuardados]);

  useEffect(() => {
    if (fechaBaseAutoagendado && user) {
      fetchVehiculosDeFecha();
    } else {
      setVehiculosFechaSeleccionada([]);
    }
  }, [fechaBaseAutoagendado, user]);

  const fetchVehiculos = async () => {
    if (user) {
      try {
        const vehs = await getVehiculos(user.uid);
        setVehiculosGuardados(vehs);
      } catch (error) {
        console.error("Error al cargar vehículos:", error);
        toast.error("Error al cargar vehículos guardados.");
      }
    }
  };

  const fetchVehiculosConTurnos = async () => {
    if (user) {
      try {
        const vehs = await getVehiculosConTurnos(user.uid);
        setVehiculosConTurnos(vehs);
      } catch (error) {
        console.error("Error al cargar vehículos con turnos:", error);
      }
    }
  };

  const fetchHorariosOcupados = async () => {
    try {
      const ocupados = await getHorariosOcupados(user.uid, fecha);
      setHorariosOcupados(ocupados);
    } catch (error) {
      console.error("Error al cargar horarios ocupados:", error);
    }
  };

  const fetchVehiculosDeFecha = async () => {
  if (!user || !fechaBaseAutoagendado) return;
  
  setCargandoVehiculosFecha(true);
  try {
    const turnos = await getTurnos(user.uid);
    const turnosDeLaFecha = turnos.filter(turno => turno.fecha === fechaBaseAutoagendado);
    
    const vehiculosUnicos = [];
    const placasUnicas = new Set();
    
    turnosDeLaFecha.forEach(turno => {
      if (!placasUnicas.has(turno.placa)) {
        placasUnicas.add(turno.placa);
        vehiculosUnicos.push({
          placa: turno.placa,
          dueno: turno.dueno || 'No especificado',
          servicio: turno.servicio || 'Lavado Básico',
          hora: turno.hora || '09:00' // Valor por defecto si no tiene hora
        });
      }
    });
    
    setVehiculosFechaSeleccionada(vehiculosUnicos);
  } catch (error) {
    console.error("Error al cargar vehículos de la fecha:", error);
    toast.error("Error al cargar vehículos de la fecha seleccionada");
  } finally {
    setCargandoVehiculosFecha(false);
  }
};

  // --- FUNCIONES DE AGENDADO MANUAL ---
  const handleVehiculoChange = (e) => {
    const selectedId = e.target.value;
    setSelectedVehiculo(selectedId);
    if (selectedId) {
      const veh = vehiculosGuardados.find(v => v.id === selectedId);
      if (veh) {
        setPlaca(veh.placa);
        setDueno(veh.dueno);
      }
    } else {
      setPlaca('');
      setDueno('');
    }
  };

  const confirmDeleteVehiculo = (vehiculo) => {
    setVehiculoToDelete(vehiculo);
    setShowDeleteConfirm(true);
  };

  const handleDeleteVehiculo = async () => {
    if (!vehiculoToDelete) return;
    
    try {
      await deleteVehiculo(vehiculoToDelete.id);
      toast.success('Vehículo eliminado correctamente');
      fetchVehiculos();
      fetchVehiculosConTurnos();
    } catch (error) {
      console.error("Error al eliminar vehículo:", error);
      toast.error(`Error al eliminar vehículo: ${error.message}`);
    } finally {
      setShowDeleteConfirm(false);
      setVehiculoToDelete(null);
    }
  };

  const verificarDisponibilidad = async () => {
    if (!fecha || !hora) return { disponible: false, mensajeError: 'Fecha y hora requeridos' };
    
    setValidandoHorario(true);
    try {
      const resultado = await checkDisponibilidad(user.uid, fecha, hora);
      return resultado;
    } catch (error) {
      console.error("Error verificando disponibilidad:", error);
      return { disponible: false, mensajeError: "Error al verificar disponibilidad" };
    } finally {
      setValidandoHorario(false);
    }
  };

  const handleAddTurno = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Debes iniciar sesión para agendar un turno.");
      return;
    }

    if (!placa || !dueno || !fecha || !hora || !servicio || !precio) {
      toast.error("Por favor, completa todos los campos.");
      return;
    }

    const { disponible, mensajeError } = await verificarDisponibilidad();
    
    if (!disponible) {
      toast.error(mensajeError || "El horario seleccionado no está disponible");
      return;
    }

    try {
      const newTurno = {
        placa: placa.toUpperCase(),
        dueno,
        fecha,
        hora: hora.padStart(5, '0'),
        servicio,
        precio: parseFloat(precio),
        userId: user.uid,
        estado: 'pendiente'
      };
      
      await addTurno(newTurno);
      toast.success('¡Turno agendado con éxito!');
      
      const vehiculoExiste = vehiculosGuardados.some(v => v.placa === placa.toUpperCase());
      if (!vehiculoExiste) {
        await addVehiculo({ placa: placa.toUpperCase(), dueno, userId: user.uid });
        toast.info('Vehículo guardado para futuras ocasiones.');
      }
      
      // Limpiar formulario
      setPlaca('');
      setDueno('');
      setFecha('');
      setHora('');
      setServicio('');
      setPrecio('');
      setSelectedVehiculo('');
      
      // Recargar datos
      fetchVehiculos();
      fetchHorariosOcupados();
      fetchVehiculosConTurnos();

    } catch (error) {
      console.error("Error al agendar turno:", error);
      toast.error(`Error al agendar turno: ${error.message}`);
    }
  };

  const generarOpcionesHorario = () => {
    const opciones = [];
    for (let h = 8; h <= 18; h++) {
      for (let m = 0; m < 60; m += 30) {
        const horaFormato = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        const estaOcupado = horariosOcupados.some(turno => turno.hora === horaFormato);
        
        opciones.push(
          <option 
            key={horaFormato} 
            value={horaFormato}
            disabled={estaOcupado}
            className={estaOcupado ? 'bg-red-100 text-red-800' : ''}
          >
            {horaFormato} {estaOcupado ? '(Ocupado)' : ''}
          </option>
        );
      }
    }
    return opciones;
  };

  // --- FUNCIÓN DE AUTOAGENDADO POR FECHA ---
  const handleAutoAgendarDesdeFecha = async () => {
  if (!user || !fechaBaseAutoagendado || vehiculosFechaSeleccionada.length === 0) {
    toast.error("Selecciona una fecha con vehículos para autoagendar");
    return;
  }
  
  setAutoAgendando(true);
  
  try {
    const fechaBase = new Date(fechaBaseAutoagendado);
    const fechaObjetivo = calcularProximaFechaLaboral(15, fechaBase);
    
    const preciosServicios = {
      'Lavado Básico': 25.00,
      'Lavado Premium': 40.00,
      'Pulido y Encerado': 60.00,
      'Limpieza Interior Profunda': 45.00
    };
    
    let turnosAgendados = 0;
    let errores = [];
    
    // Para cada vehículo, mantener su hora original
    for (const vehiculo of vehiculosFechaSeleccionada) {
      try {
        // Usar la misma hora que tenía originalmente
        const horaOriginal = vehiculo.hora.padStart(5, '0'); // Asegurar formato HH:MM
        
        // Verificar disponibilidad para este vehículo con su hora original
        const { disponible, mensajeError } = await checkDisponibilidad(
          user.uid, 
          fechaObjetivo, 
          horaOriginal
        );
        
        if (!disponible) {
          // Si no está disponible, buscar el próximo horario disponible ese mismo día
          const horariosOcupados = await getHorariosOcupados(user.uid, fechaObjetivo);
          const horariosOcupadosSet = new Set(horariosOcupados.map(t => t.hora));
          
          // Generar todos los horarios posibles de 8:00 a 18:00 cada 30 minutos
          const todosHorarios = [];
          for (let h = 8; h <= 18; h++) {
            for (let m = 0; m < 60; m += 30) {
              const hora = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
              todosHorarios.push(hora);
            }
          }
          
          // Encontrar el próximo horario disponible después de la hora original
          const horaIndex = todosHorarios.indexOf(horaOriginal);
          let horaDisponible = null;
          
          if (horaIndex !== -1) {
            for (let i = horaIndex; i < todosHorarios.length; i++) {
              if (!horariosOcupadosSet.has(todosHorarios[i])) {
                horaDisponible = todosHorarios[i];
                break;
              }
            }
          }
          
          if (!horaDisponible) {
            errores.push(`No hay horarios disponibles para ${vehiculo.placa} el ${fechaObjetivo}`);
            continue;
          }
          
          // Usar el horario disponible encontrado
          const servicioSeleccionado = vehiculo.servicio;
          
          const nuevoTurno = {
            placa: vehiculo.placa,
            dueno: vehiculo.dueno,
            fecha: fechaObjetivo,
            hora: horaDisponible,
            servicio: servicioSeleccionado,
            precio: preciosServicios[servicioSeleccionado] || 30.00,
            userId: user.uid,
            estado: 'pendiente',
            autoAgendado: true,
            esRecurrente: true,
            fechaOrigen: fechaBaseAutoagendado,
            horaOriginal: horaOriginal, // Guardar la hora original como referencia
            horarioAjustado: horaDisponible !== horaOriginal // Indicar si se ajustó el horario
          };
          
          await addTurno(nuevoTurno);
          turnosAgendados++;
          
          if (horaDisponible !== horaOriginal) {
            errores.push(`⚠️ ${vehiculo.placa}: Horario ajustado de ${horaOriginal} a ${horaDisponible}`);
          }
          
        } else {
          // Si está disponible, usar la hora original
          const servicioSeleccionado = vehiculo.servicio;
          
          const nuevoTurno = {
            placa: vehiculo.placa,
            dueno: vehiculo.dueno,
            fecha: fechaObjetivo,
            hora: horaOriginal,
            servicio: servicioSeleccionado,
            precio: preciosServicios[servicioSeleccionado] || 30.00,
            userId: user.uid,
            estado: 'pendiente',
            autoAgendado: true,
            esRecurrente: true,
            fechaOrigen: fechaBaseAutoagendado
          };
          
          await addTurno(nuevoTurno);
          turnosAgendados++;
        }
        
      } catch (error) {
        errores.push(`Error con ${vehiculo.placa}: ${error.message}`);
      }
    }
    
    if (turnosAgendados > 0) {
      toast.success(`¡${turnosAgendados} vehículos autoagendados para el ${fechaObjetivo}!`);
    } else {
      toast.info("No se pudo autoagendar ningún vehículo.");
    }
    
    if (errores.length > 0) {
      // Mostrar resumen de errores
      if (errores.length > 3) {
        toast.warning(`${errores.length} vehículos tuvieron problemas. Ver consola para detalles.`, { autoClose: 7000 });
        console.log("Errores de autoagendado:", errores);
      } else {
        errores.forEach(error => {
          toast.warning(error, { autoClose: 8000 });
        });
      }
    }
    
  } catch (error) {
    console.error("Error en autoagendado:", error);
    toast.error("Error al autoagendar vehículos");
  } finally {
    setAutoAgendando(false);
  }
};

  return (
    <div className="min-h-screen md:min-h-[calc(100vh-80px)] flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
  <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10 max-w-6xl w-full border border-gray-200 mt-4 md:mt-0">
        <h2 className="text-4xl font-bold text-purple-800 mb-6 text-center">Agendar Turnos</h2>
        
        {/* SECCIÓN DE AUTOAGENDADO POR FECHA */}
        <div className="mb-8 bg-green-50 rounded-xl p-6 shadow-md border border-green-200">
          <h3 className="text-2xl font-bold text-green-800 mb-4 text-center">Autoagendado Masivo</h3>
          <p className="text-green-700 mb-4 text-center">
            Selecciona una fecha y autoagenda todos sus vehículos para 15 días después
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Fecha Base</label>
              <input
                type="date"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                value={fechaBaseAutoagendado}
                onChange={(e) => setFechaBaseAutoagendado(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={fetchVehiculosDeFecha}
                disabled={!fechaBaseAutoagendado}
                className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buscar Vehículos
              </button>
            </div>
            
            <div className="flex items-end">
              <button
  onClick={handleAutoAgendarDesdeFecha}
  disabled={autoAgendando || !fechaBaseAutoagendado || vehiculosFechaSeleccionada.length === 0}
  className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-teal-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {autoAgendando ? 'Autoagendando...' : `Autoagendar ${vehiculosFechaSeleccionada.length} Vehículos`}
  <br />
  <span className="text-xs font-normal">(Misma hora original)</span>
</button>
            </div>
          </div>
          
          {cargandoVehiculosFecha && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-green-700 mt-2">Buscando vehículos...</p>
            </div>
          )}
          
          // En la sección de visualización de vehículos encontrados
{vehiculosFechaSeleccionada.length > 0 && (
  <div className="bg-white rounded-lg p-4 border border-green-200">
    <h4 className="font-semibold text-green-800 mb-3">
      {vehiculosFechaSeleccionada.length} vehículos encontrados para {fechaBaseAutoagendado}
    </h4>
    <div className="max-h-40 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2">
      {vehiculosFechaSeleccionada.map((vehiculo, index) => (
        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
          <div>
            <span className="text-sm font-medium block">{vehiculo.placa}</span>
            <span className="text-xs text-gray-600">{vehiculo.servicio}</span>
          </div>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {vehiculo.hora}
          </span>
        </div>
      ))}
    </div>
    <p className="text-xs text-gray-500 mt-2">
      Se agendarán para: {fechaBaseAutoagendado && calcularProximaFechaLaboral(15, new Date(fechaBaseAutoagendado))}
      <br />
      <span className="text-green-600">Manteniendo sus horarios originales</span>
    </p>
  </div>
)}
        </div>

        {/* SECCIÓN DE AGENDADO MANUAL (EXISTENTE) */}
        <div className="bg-purple-50 rounded-2xl p-6 shadow-md border border-purple-200">
          <h3 className="text-2xl font-bold text-purple-800 mb-4 text-center">Agendado Manual</h3>
          
          <form onSubmit={handleAddTurno} className="bg-white rounded-xl p-4 border border-purple-100 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Vehículo Guardado</label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  value={selectedVehiculo}
                  onChange={handleVehiculoChange}
                >
                  <option value="">Seleccionar vehículo guardado</option>
                  {vehiculosGuardados.map(veh => (
                    <option key={veh.id} value={veh.id}>{veh.placa} - {veh.dueno}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Acciones</label>
                <button
                  type="button"
                  onClick={() => selectedVehiculo && confirmDeleteVehiculo(vehiculosGuardados.find(v => v.id === selectedVehiculo))}
                  disabled={!selectedVehiculo}
                  className="w-full bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Eliminar Vehículo
                </button>
              </div>
            </div>

            <input
              type="text"
              placeholder="Placa del vehículo (ej: ABC-123)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800 uppercase"
              value={placa}
              onChange={(e) => setPlaca(e.target.value)}
              required
            />
            
            <input
              type="text"
              placeholder="Dueño del vehículo"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800"
              value={dueno}
              onChange={(e) => setDueno(e.target.value)}
              required
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Fecha</label>
                <input
                  type="date"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Hora</label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  required
                  disabled={!fecha}
                >
                  <option value="">Seleccionar hora</option>
                  {fecha && generarOpcionesHorario()}
                </select>
                {validandoHorario && (
                  <p className="text-sm text-blue-600 mt-1">Verificando disponibilidad...</p>
                )}
              </div>
            </div>
            
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800"
              value={servicio}
              onChange={(e) => setServicio(e.target.value)}
              required
            >
              <option value="">Seleccionar Servicio</option>
              <option value="Lavado Básico">Lavado Básico</option>
              <option value="Lavado Premium">Lavado Premium</option>
              <option value="Pulido y Encerado">Pulido y Encerado</option>
              <option value="Limpieza Interior Profunda">Limpieza Interior Profunda</option>
            </select>
            
            <input
              type="number"
              placeholder="Precio (ej: 25.00)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              step="0.01"
              min="0"
              required
            />
            
            <button
              type="submit"
              disabled={validandoHorario}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {validandoHorario ? 'Verificando...' : 'Agendar Turno'}
            </button>
          </form>

          {/* Lista de vehículos guardados */}
          {vehiculosGuardados.length > 0 && (
            <div className="mt-6 bg-white rounded-xl p-4 border border-purple-100">
              <h3 className="text-xl font-bold text-purple-800 mb-4">Vehículos Guardados</h3>
              <div className="space-y-2">
                {vehiculosGuardados.map(veh => {
                  const esRecurrente = vehiculosConTurnos.some(v => v.placa === veh.placa);
                  
                  return (
                    <div key={veh.id} className={`flex justify-between items-center p-2 rounded-lg ${
                      esRecurrente ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                    }`}>
                      <div>
                        <span className="font-semibold">{veh.placa}</span> - {veh.dueno}
                        {esRecurrente && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Recurrente
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => confirmDeleteVehiculo(veh)}
                        className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition duration-300"
                      >
                        Eliminar
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación para eliminar vehículo */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-red-600 mb-4">Confirmar Eliminación</h3>
            <p className="mb-4">¿Estás seguro de que deseas eliminar el vehículo <strong>{vehiculoToDelete?.placa}</strong> - {vehiculoToDelete?.dueno}?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition duration-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteVehiculo}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}