import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  deleteDoc,
  doc,
  limit,
  updateDoc, // ✅ CORRECTO - importado de firebase/firestore
  writeBatch, // Para operaciones batch
  getDoc // Para leer documentos individuales
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

// Registro de usuario
export const registerUser = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

// Inicio de sesión
export const loginUser = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Cerrar sesión
export const logoutUser = () => {
  return signOut(auth);
};

// Observador de estado de autenticación
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Agregar un turno
export const addTurno = async (turnoData) => {
  try {
    const turnoConTimestamp = {
      ...turnoData,
      createdAt: serverTimestamp(),
      estado: 'pendiente'
    };
    
    const docRef = await addDoc(collection(db, 'turnos'), turnoConTimestamp);
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
};

// Obtener vehículos de un usuario
export const getVehiculos = async (userId) => {
  try {
    const q = query(
      collection(db, 'vehiculos'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting documents: ", error);
    throw error;
  }
};

// Agregar un vehículo
export const addVehiculo = async (vehiculoData) => {
  try {
    const docRef = await addDoc(collection(db, 'vehiculos'), vehiculoData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
};

// Obtener turnos de un usuario
export const getTurnos = async (userId) => {
  try {
    const q = query(
      collection(db, 'turnos'),
      where('userId', '==', userId),
      orderBy('fecha'),
      orderBy('hora')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      fecha: doc.data().fecha,
      hora: doc.data().hora
    }));
  } catch (error) {
    console.error("Error getting documents: ", error);
    throw error;
  }
};

// Eliminar un turno
export const deleteTurno = async (turnoId) => {
  try {
    await deleteDoc(doc(db, 'turnos', turnoId));
    return true;
  } catch (error) {
    console.error("Error eliminando turno: ", error);
    throw error;
  }
};

// Eliminar un vehículo
export const deleteVehiculo = async (vehiculoId) => {
  try {
    await deleteDoc(doc(db, 'vehiculos', vehiculoId));
    return true;
  } catch (error) {
    console.error("Error eliminando vehículo: ", error);
    throw error;
  }
};

// Verificar disponibilidad de horario
export const checkDisponibilidad = async (userId, fecha, hora, turnoId = null, excluirAutoAgendados = false) => {
  try {
    // Convertir la hora a formato comparable (HH:MM)
    const horaFormateada = hora.length === 5 ? hora : hora.padStart(5, '0');
    
    // Calcular hora de inicio y fin (asumiendo 1 hora de duración por turno)
    const horaInicio = new Date(`${fecha}T${horaFormateada}`);
    const horaFin = new Date(horaInicio.getTime() + 60 * 60 * 1000); // +1 hora
    
    // Consultar turnos existentes en la misma fecha
    const q = query(
      collection(db, 'turnos'),
      where('userId', '==', userId),
      where('fecha', '==', fecha)
    );
    
    const querySnapshot = await getDocs(q);
    let disponible = true;
    let mensajeError = '';
    
    querySnapshot.forEach((doc) => {
      const turnoExistente = doc.data();
      
      // Si es el mismo turno que estamos editando, lo saltamos
      if (turnoId && doc.id === turnoId) return;
      
      // Si estamos excluyendo autoagendados y este es autoagendado, lo saltamos
      if (excluirAutoAgendados && turnoExistente.autoAgendado) return;
      
      const horaExistenteFormateada = turnoExistente.hora.padStart(5, '0');
      const horaExistente = new Date(`${turnoExistente.fecha}T${horaExistenteFormateada}`);
      const horaExistenteFin = new Date(horaExistente.getTime() + 60 * 60 * 1000);
      
      // Verificar solapamiento
      if (
        (horaInicio >= horaExistente && horaInicio < horaExistenteFin) ||
        (horaFin > horaExistente && horaFin <= horaExistenteFin) ||
        (horaInicio <= horaExistente && horaFin >= horaExistenteFin)
      ) {
        disponible = false;
        mensajeError = `El horario se solapa con el turno de ${turnoExistente.placa} (${turnoExistente.hora})`;
      }
    });
    
    return { disponible, mensajeError };
  } catch (error) {
    console.error("Error verificando disponibilidad:", error);
    return { disponible: false, mensajeError: "Error al verificar disponibilidad" };
  }
};

// Obtener horarios ocupados para una fecha específica
export const getHorariosOcupados = async (userId, fecha) => {
  try {
    const q = query(
      collection(db, 'turnos'),
      where('userId', '==', userId),
      where('fecha', '==', fecha)
    );
    
    const querySnapshot = await getDocs(q);
    const horariosOcupados = [];
    
    querySnapshot.forEach((doc) => {
      const turno = doc.data();
      horariosOcupados.push({
        hora: turno.hora,
        placa: turno.placa,
        servicio: turno.servicio,
        id: doc.id
      });
    });
    
    return horariosOcupados;
  } catch (error) {
    console.error("Error obteniendo horarios ocupados:", error);
    return [];
  }
};

// Función para calcular la próxima fecha laboral (excluye sábados y domingos)
export const calcularProximaFechaLaboral = (diasSumar = 15, fechaBase = null) => {
  const fecha = fechaBase ? new Date(fechaBase) : new Date();
  let diasAgregados = 0;
  
  while (diasAgregados < diasSumar) {
    fecha.setDate(fecha.getDate() + 1);
    // Saltar fines de semana (0 = domingo, 6 = sábado)
    if (fecha.getDay() !== 0 && fecha.getDay() !== 6) {
      diasAgregados++;
    }
  }
  
  return fecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD
};

// Obtener vehículos que han tenido al menos un turno
export const getVehiculosConTurnos = async (userId) => {
  try {
    // Primero obtener todos los turnos del usuario
    const turnos = await getTurnos(userId);
    
    // Extraer placas únicas de vehículos que han tenido turnos
    const placasConTurnos = [...new Set(turnos.map(turno => turno.placa))];
    
    // Obtener información completa de los vehículos
    const vehiculos = await getVehiculos(userId);
    
    // Filtrar solo los vehículos que han tenido turnos
    return vehiculos.filter(vehiculo => 
      placasConTurnos.includes(vehiculo.placa)
    );
  } catch (error) {
    console.error("Error obteniendo vehículos con turnos:", error);
    throw error;
  }
};

// Obtener el último turno de un vehículo específico
export const getUltimoTurnoVehiculo = async (userId, placa) => {
  try {
    const q = query(
      collection(db, 'turnos'),
      where('userId', '==', userId),
      where('placa', '==', placa),
      orderBy('fecha', 'desc'),
      orderBy('hora', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    return { 
      id: querySnapshot.docs[0].id, 
      ...querySnapshot.docs[0].data() 
    };
  } catch (error) {
    console.error("Error obteniendo último turno:", error);
    throw error;
  }
};

// Función para autoagendar SOLO vehículos que han tenido turnos anteriores
export const autoAgendarVehiculosRecurrentes = async (userId, dias = 15, hora = '09:00') => {
  try {
    // Obtener vehículos que han tenido al menos un turno
    const vehiculosConTurnos = await getVehiculosConTurnos(userId);
    
    if (vehiculosConTurnos.length === 0) {
      return { 
        success: false, 
        message: 'No hay vehículos con turnos anteriores para autoagendar' 
      };
    }
    
    // Calcular fecha objetivo (15 días después, excluyendo fines de semana)
    const fechaObjetivo = calcularProximaFechaLaboral(dias);
    
    // Precios por servicio
    const preciosServicios = {
      'Lavado Básico': 25.00,
      'Lavado Premium': 40.00,
      'Pulido y Encerado': 60.00,
      'Limpieza Interior Profunda': 45.00
    };
    
    let turnosAgendados = 0;
    let errores = [];
    let horariosOcupadosTemporales = []; // Para evitar solapamientos durante el autoagendado
    
    // Agendar cada vehículo que ha tenido turnos anteriores
    for (const vehiculo of vehiculosConTurnos) {
      try {
        // Verificar si este horario ya fue ocupado en este proceso de autoagendado
        const horarioYaOcupado = horariosOcupadosTemporales.includes(hora);
        
        if (horarioYaOcupado) {
          errores.push(`Horario ${hora} ya ocupado en este proceso para ${vehiculo.placa}`);
          continue;
        }
        
        // Verificar disponibilidad para este vehículo (excluyendo otros autoagendados)
        const { disponible, mensajeError } = await checkDisponibilidad(
          userId, 
          fechaObjetivo, 
          hora,
          null, // No hay turnoId para nuevos agendados
          true  // Excluir otros turnos autoagendados
        );
        
        if (!disponible) {
          errores.push(`No disponible para ${vehiculo.placa}: ${mensajeError}`);
          continue;
        }
        
        // Obtener el último servicio usado por este vehículo
        const ultimoTurno = await getUltimoTurnoVehiculo(userId, vehiculo.placa);
        let servicioSeleccionado = '';
        
        if (ultimoTurno && ultimoTurno.servicio) {
          // Usar el mismo servicio del último turno
          servicioSeleccionado = ultimoTurno.servicio;
        } else {
          // Servicio por defecto si no hay histórico
          const servicios = Object.keys(preciosServicios);
          servicioSeleccionado = servicios[Math.floor(Math.random() * servicios.length)];
        }
        
        // Crear turno
        const nuevoTurno = {
          placa: vehiculo.placa,
          dueno: vehiculo.dueno,
          fecha: fechaObjetivo,
          hora: hora.padStart(5, '0'), // Asegurar formato HH:MM
          servicio: servicioSeleccionado,
          precio: preciosServicios[servicioSeleccionado],
          userId: userId,
          estado: 'pendiente',
          autoAgendado: true, // Marcar como autoagendado
          esRecurrente: true // Indicar que es un turno recurrente
        };
        
        // Agregar turno
        await addTurno(nuevoTurno);
        turnosAgendados++;
        
        // Agregar este horario a la lista temporal para evitar solapamientos
        horariosOcupadosTemporales.push(hora);
        
      } catch (error) {
        errores.push(`Error con ${vehiculo.placa}: ${error.message}`);
      }
    }
    
    return {
      success: true,
      turnosAgendados,
      fechaObjetivo,
      hora,
      vehiculosProcesados: vehiculosConTurnos.length,
      errores
    };
    
  } catch (error) {
    console.error("Error en autoagendado recurrente:", error);
    return { 
      success: false, 
      message: `Error general: ${error.message}` 
    };
  }
};
export const obtenerProximoHorarioDisponible = async (userId, fecha, horaInicio = '08:00') => {
  try {
    const horariosOcupados = await getHorariosOcupados(userId, fecha);
    const horariosOcupadosSet = new Set(horariosOcupados.map(t => t.hora));
    
    // Generar horarios de 8:00 a 18:00 cada 30 minutos
    const todosHorarios = [];
    for (let h = 8; h <= 18; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hora = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        todosHorarios.push(hora);
      }
    }
    
    // Encontrar el primer horario disponible después de la hora de inicio
    const inicioIndex = todosHorarios.indexOf(horaInicio);
    if (inicioIndex === -1) return null;
    
    for (let i = inicioIndex; i < todosHorarios.length; i++) {
      if (!horariosOcupadosSet.has(todosHorarios[i])) {
        return todosHorarios[i];
      }
    }
    
    return null; // No hay horarios disponibles
  } catch (error) {
    console.error("Error obteniendo próximo horario:", error);
    return null;
  }
};

// Función mejorada para autoagendado con distribución inteligente
// En services/firebase.js - agregar esta función
export const autoAgendarVehiculosRecurrentesInteligente = async (userId, dias = 15, horaInicio = '08:00') => {
  try {
    // Obtener vehículos que han tenido al menos un turno
    const vehiculosConTurnos = await getVehiculosConTurnos(userId);
    
    if (vehiculosConTurnos.length === 0) {
      return { 
        success: false, 
        message: 'No hay vehículos con turnos anteriores para autoagendar' 
      };
    }
    
    // Calcular fecha objetivo (15 días después, excluyendo fines de semana)
    const fechaObjetivo = calcularProximaFechaLaboral(dias);
    
    // Precios por servicio
    const preciosServicios = {
      'Lavado Básico': 25.00,
      'Lavado Premium': 40.00,
      'Pulido y Encerado': 60.00,
      'Limpieza Interior Profunda': 45.00
    };
    
    let turnosAgendados = 0;
    let errores = [];
    
    // Obtener horarios ocupados para la fecha objetivo
    const horariosOcupados = await getHorariosOcupados(userId, fechaObjetivo);
    const horariosOcupadosSet = new Set(horariosOcupados.map(t => t.hora));
    
    // Generar todos los horarios posibles de 8:00 a 18:00 cada 30 minutos
    const todosHorarios = [];
    for (let h = 8; h <= 18; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hora = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        todosHorarios.push(hora);
      }
    }
    
    // Filtrar solo los horarios disponibles
    const horariosDisponibles = todosHorarios.filter(hora => !horariosOcupadosSet.has(hora));
    
    if (horariosDisponibles.length < vehiculosConTurnos.length) {
      return {
        success: false,
        message: `No hay suficientes horarios disponibles. Necesitas ${vehiculosConTurnos.length} horarios pero solo hay ${horariosDisponibles.length} disponibles.`
      };
    }
    
    // Agendar cada vehículo en un horario diferente
    for (let i = 0; i < vehiculosConTurnos.length; i++) {
      const vehiculo = vehiculosConTurnos[i];
      const horaDisponible = horariosDisponibles[i];
      
      try {
        // Obtener el último servicio usado por este vehículo
        const ultimoTurno = await getUltimoTurnoVehiculo(userId, vehiculo.placa);
        let servicioSeleccionado = '';
        
        if (ultimoTurno && ultimoTurno.servicio) {
          // Usar el mismo servicio del último turno
          servicioSeleccionado = ultimoTurno.servicio;
        } else {
          // Servicio por defecto si no hay histórico
          const servicios = Object.keys(preciosServicios);
          servicioSeleccionado = servicios[Math.floor(Math.random() * servicios.length)];
        }
        
        // Crear turno
        const nuevoTurno = {
          placa: vehiculo.placa,
          dueno: vehiculo.dueno,
          fecha: fechaObjetivo,
          hora: horaDisponible,
          servicio: servicioSeleccionado,
          precio: preciosServicios[servicioSeleccionado],
          userId: userId,
          estado: 'pendiente',
          autoAgendado: true,
          esRecurrente: true
        };
        
        // Agregar turno
        await addTurno(nuevoTurno);
        turnosAgendados++;
        
      } catch (error) {
        errores.push(`Error con ${vehiculo.placa}: ${error.message}`);
      }
    }
    
    return {
      success: true,
      turnosAgendados,
      fechaObjetivo,
      vehiculosProcesados: vehiculosConTurnos.length,
      errores
    };
    
  } catch (error) {
    console.error("Error en autoagendado inteligente:", error);
    return { 
      success: false, 
      message: `Error general: ${error.message}` 
    };
  }
};
// Agregar estas funciones a services/firebase.js
const cache = {
  turnosPendientes: null,
  evaluaciones: null,
  lastFetch: null
};

// Obtener turnos pendientes de evaluación
export const getTurnosPendientesEvaluacion = async (userId) => {
  try {
    // Usar cache si los datos son recientes (menos de 30 segundos)
    if (cache.turnosPendientes && cache.lastFetch && (Date.now() - cache.lastFetch < 30000)) {
      return cache.turnosPendientes;
    }

    const hoy = new Date();
    const hace7Dias = new Date();
    hace7Dias.setDate(hoy.getDate() - 7); // Solo últimos 7 días

    const q = query(
      collection(db, 'turnos'),
      where('userId', '==', userId),
      where('estado', '==', 'pendiente'),
      where('fecha', '<=', hoy.toISOString().split('T')[0]),
      where('fecha', '>=', hace7Dias.toISOString().split('T')[0]), // Limitar rango temporal
      orderBy('fecha', 'desc'),
      orderBy('hora', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const turnos = querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));

    // Guardar en cache
    cache.turnosPendientes = turnos;
    cache.lastFetch = Date.now();
    
    return turnos;
  } catch (error) {
    console.error("Error obteniendo turnos pendientes:", error);
    
    // Si hay error de índice, sugerir crearlo
    if (error.code === 'failed-precondition') {
      console.warn('Se necesita crear un índice para esta consulta');
    }
    
    throw error;
  }
};

// Guardar evaluación de vehículo
export const guardarEvaluacion = async (evaluacionData) => {
  try {
    const evaluacionConTimestamp = {
      ...evaluacionData,
      evaluadoEn: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'evaluaciones'), evaluacionConTimestamp);
    
    // Actualizar el estado del turno
    await updateDoc(doc(db, 'turnos', evaluacionData.turnoId), {
      estado: evaluacionData.presentado ? 'evaluado' : 'no_presentado',
      evaluacionId: docRef.id
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Error guardando evaluación:", error);
    throw error;
  }
};

// Obtener todas las evaluaciones
export const getEvaluaciones = async (userId) => {
  try {
    if (cache.evaluaciones && cache.lastFetch && (Date.now() - cache.lastFetch < 30000)) {
      return cache.evaluaciones;
    }

    const q = query(
      collection(db, 'evaluaciones'),
      where('userId', '==', userId),
      orderBy('evaluadoEn', 'desc'),
      limit(100) // Limitar para mejor performance
    );
    
    const querySnapshot = await getDocs(q);
    const evaluaciones = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fechaEvaluacion: doc.data().evaluadoEn ? doc.data().evaluadoEn.toDate().toLocaleDateString() : 'N/A'
    }));

    cache.evaluaciones = evaluaciones;
    cache.lastFetch = Date.now();
    
    return evaluaciones;
  } catch (error) {
    console.error("Error obteniendo evaluaciones:", error);
    return [];
  }
};

// Obtener evaluaciones por tipo (presentados/no presentados)
export const getEvaluacionesPorTipo = async (userId, presentado) => {
  try {
    const cacheKey = `evaluaciones_${presentado}`;
    
    // Usar cache si disponible
    if (cache[cacheKey] && cache.lastFetch && (Date.now() - cache.lastFetch < 30000)) {
      return cache[cacheKey];
    }

    const q = query(
      collection(db, 'evaluaciones'),
      where('userId', '==', userId),
      where('presentado', '==', presentado),
      orderBy('evaluadoEn', 'desc'),
      limit(50) // Limitar a 50 resultados para mejor performance
    );
    
    const querySnapshot = await getDocs(q);
    const evaluaciones = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convertir timestamp a fecha legible
        fechaEvaluacion: data.evaluadoEn ? data.evaluadoEn.toDate().toLocaleDateString() : 'N/A'
      };
    });

    // Guardar en cache
    cache[cacheKey] = evaluaciones;
    cache.lastFetch = Date.now();
    
    return evaluaciones;
  } catch (error) {
    console.error("Error obteniendo evaluaciones por tipo:", error);
    
    // Si falla la consulta compleja, intentar una más simple
    if (error.code === 'failed-precondition') {
      console.log('Intentando consulta alternativa...');
      return getEvaluacionesAlternativa(userId, presentado);
    }
    
    throw error;
  }
};const getEvaluacionesAlternativa = async (userId, presentado) => {
  try {
    const q = query(
      collection(db, 'evaluaciones'),
      where('userId', '==', userId),
      where('presentado', '==', presentado),
      limit(30)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fechaEvaluacion: doc.data().evaluadoEn ? doc.data().evaluadoEn.toDate().toLocaleDateString() : 'N/A'
    }));
  } catch (error) {
    console.error("Error en consulta alternativa:", error);
    return [];
  }
};
// Limpiar TODAS las evaluaciones
export const limpiarTodasLasEvaluaciones = async (userId) => {
  try {
    const q = query(collection(db, 'evaluaciones'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: true, message: 'No hay evaluaciones para limpiar', eliminados: 0 };
    }

    const batch = writeBatch(db);
    let contador = 0;

    querySnapshot.forEach((document) => {
      batch.delete(doc(db, 'evaluaciones', document.id));
      contador++;
    });

    await batch.commit();
    return { success: true, eliminados: contador };

  } catch (error) {
    console.error("Error limpiando evaluaciones:", error);
    throw error;
  }
};

// Limpiar evaluaciones por fecha
export const limpiarEvaluacionesPorFecha = async (userId, fechaLimite) => {
  try {
    const q = query(
      collection(db, 'evaluaciones'),
      where('userId', '==', userId),
      where('fechaTurno', '<=', fechaLimite)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: true, message: 'No hay evaluaciones para la fecha seleccionada', eliminados: 0 };
    }

    const batch = writeBatch(db);
    let contador = 0;

    querySnapshot.forEach((document) => {
      batch.delete(doc(db, 'evaluaciones', document.id));
      contador++;
    });

    await batch.commit();
    return { success: true, eliminados: contador };

  } catch (error) {
    console.error("Error limpiando evaluaciones por fecha:", error);
    throw error;
  }
};

// Exportar evaluaciones a JSON antes de limpiar
export const exportarEvaluaciones = async (userId) => {
  try {
    const q = query(
      collection(db, 'evaluaciones'),
      where('userId', '==', userId),
      orderBy('evaluadoEn', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const evaluaciones = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      evaluaciones.push({
        id: doc.id,
        ...data,
        evaluadoEn: data.evaluadoEn ? data.evaluadoEn.toDate().toISOString() : null
      });
    });

    return evaluaciones;

  } catch (error) {
    console.error("Error exportando evaluaciones:", error);
    throw error;
  }
};
// Obtener TODOS los turnos (no solo pendientes) para evaluación
export const getTodosTurnosParaEvaluacion = async (userId) => {
  try {
    const q = query(
      collection(db, 'turnos'),
      where('userId', '==', userId),
      orderBy('fecha', 'desc'),
      orderBy('hora', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
  } catch (error) {
    console.error("Error obteniendo todos los turnos:", error);
    throw error;
  }
};

// Obtener evaluaciones con filtros
export const getEvaluacionesConFiltros = async (userId, filtros = {}) => {
  try {
    let q = query(
      collection(db, 'evaluaciones'),
      where('userId', '==', userId),
      orderBy('evaluadoEn', 'desc')
    );

    // Aplicar filtros dinámicos
    if (filtros.fechaInicio && filtros.fechaFin) {
      q = query(q, where('fechaTurno', '>=', filtros.fechaInicio), where('fechaTurno', '<=', filtros.fechaFin));
    } else if (filtros.fechaInicio) {
      q = query(q, where('fechaTurno', '>=', filtros.fechaInicio));
    } else if (filtros.fechaFin) {
      q = query(q, where('fechaTurno', '<=', filtros.fechaFin));
    }

    if (filtros.presentado !== undefined) {
      q = query(q, where('presentado', '==', filtros.presentado));
    }

    const querySnapshot = await getDocs(q);
    const evaluaciones = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Asegurar que estas propiedades existan
        placa: data.placa || 'N/A',
        dueno: data.dueno || 'N/A',
        servicio: data.servicio || 'N/A',
        fechaTurno: data.fechaTurno || 'N/A',
        presentado: data.presentado !== undefined ? data.presentado : true,
        calificacion: data.calificacion || 0,
        aireAcondicionado: data.aireAcondicionado || '',
        estadoCauchos: data.estadoCauchos || '',
        observaciones: data.observaciones || '',
        evaluadoEn: data.evaluadoEn || null,
        fechaEvaluacion: data.evaluadoEn ? data.evaluadoEn.toDate().toLocaleDateString() : 'N/A'
      };
    });

    return evaluaciones;

  } catch (error) {
    console.error("Error obteniendo evaluaciones con filtros:", error);
    throw error;
  }
};
export const buscarTurnos = async (userId, busqueda) => {
  try {
    // Primero obtenemos todos los turnos
    const todosTurnos = await getTodosTurnosParaEvaluacion(userId);
    
    // Luego filtramos localmente por la búsqueda
    return todosTurnos.filter(turno => {
      const placaMatch = turno.placa && turno.placa.toLowerCase().includes(busqueda.toLowerCase());
      const duenoMatch = turno.dueno && turno.dueno.toLowerCase().includes(busqueda.toLowerCase());
      return placaMatch || duenoMatch;
    });
  } catch (error) {
    console.error("Error buscando turnos:", error);
    throw error;
  }
};