import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getTurnos, deleteTurno } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';

export default function CalendarPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [turnoToDelete, setTurnoToDelete] = useState(null);

  useEffect(() => {
    fetchTurnos();
  }, [user]);

  const fetchTurnos = async () => {
    if (user) {
      try {
        const turnos = await getTurnos(user.uid);
        const calendarEvents = turnos.map(turno => ({
          id: turno.id,
          title: `${turno.placa} - ${turno.servicio} ${turno.autoAgendado ? '🤖' : ''}`,
          start: `${turno.fecha}T${turno.hora}`,
            backgroundColor: getEventColor(turno.estado, turno.autoAgendado, turno.estado),
            borderColor: getEventColor(turno.estado, turno.autoAgendado, turno.estado),
          extendedProps: {
            placa: turno.placa,
            dueno: turno.dueno,
            servicio: turno.servicio,
            precio: turno.precio,
            estado: turno.estado,
            evaluacion: turno.estado,
            autoAgendado: turno.autoAgendado || false,
            esRecurrente: turno.esRecurrente || false
          }
        }));
        setEvents(calendarEvents);
      } catch (error) {
        console.error("Error al cargar turnos:", error);
        toast.error("Error al cargar los turnos del calendario");
      } finally {
        setLoading(false);
      }
    }
  };

  const getEventColor = (estado, autoAgendado = false, evaluacion = null) => {
  if (evaluacion) {
    if (evaluacion === 'no_presentado') return '#ef4444'; // Rojo para no presentado
    if (evaluacion === 'evaluado') return '#10b981';      // Verde para evaluado
  }
  
  if (autoAgendado) return '#8b5cf6';
  
  switch (estado) {
    case 'pendiente': return '#fbbf24';
    case 'confirmado': return '#3b82f6';
    case 'finalizado': return '#6b7280';
    case 'cancelado': return '#ef4444';
    default: return '#3b82f6';
  }
};

  const handleEventClick = (info) => {
    const event = info.event;
    const turno = event.extendedProps;
    
    // Mostrar opciones en lugar de información directa
    setTurnoToDelete({
      id: event.id,
      placa: turno.placa,
      servicio: turno.servicio,
      fecha: event.start.toLocaleDateString(),
      hora: event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTurno = async () => {
    if (!turnoToDelete) return;
    
    try {
      await deleteTurno(turnoToDelete.id);
      toast.success('Turno eliminado correctamente');
      fetchTurnos(); // Recargar los turnos
    } catch (error) {
      console.error("Error al eliminar turno:", error);
      toast.error(`Error al eliminar turno: ${error.message}`);
    } finally {
      setShowDeleteConfirm(false);
      setTurnoToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10 max-w-7xl mx-auto border border-gray-200">
        <h2 className="text-3xl md:text-4xl font-bold text-blue-800 mb-6 text-center">
          Calendario de Turnos
        </h2>
        <p className="text-gray-700 text-lg mb-8 text-center">
          Visualiza y gestiona todos tus turnos programados. Haz clic en un turno para ver opciones.
        </p>
        
        <div className="bg-blue-50 rounded-2xl p-4 md:p-6 shadow-md border border-blue-200">
          <div className="bg-white rounded-xl p-4 border border-blue-100">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={events}
              eventClick={handleEventClick}
              height="auto"
              locale="es"
              buttonText={{
                today: 'Hoy',
                month: 'Mes',
                week: 'Semana',
                day: 'Día'
              }}
              allDaySlot={false}
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              weekends={true}
              editable={true}
              selectable={true}
              dayMaxEvents={true}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              }}
            />
          </div>
          
          <div className="mt-6 text-sm text-gray-600 flex flex-wrap justify-center gap-4">
            <span className="flex items-center">
              <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full mr-2"></span>
              Pendiente
            </span>
            <span className="flex items-center">
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Confirmado
            </span>
            <span className="flex items-center">
              <span className="inline-block w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
              Finalizado
            </span>
            <span className="flex items-center">
              <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
              Cancelado
            </span>
            <span className="flex items-center">
              <span className="inline-block w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
              Autoagendado
            </span>
          </div>
        </div>
      </div>

      {/* Modal de confirmación para eliminar turno */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-red-600 mb-4">Eliminar Turno</h3>
            <p className="mb-2">¿Estás seguro de que deseas eliminar este turno?</p>
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <p><strong>Placa:</strong> {turnoToDelete?.placa}</p>
              <p><strong>Servicio:</strong> {turnoToDelete?.servicio}</p>
              <p><strong>Fecha:</strong> {turnoToDelete?.fecha}</p>
              <p><strong>Hora:</strong> {turnoToDelete?.hora}</p>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition duration-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteTurno}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300"
              >
                Eliminar Turno
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}