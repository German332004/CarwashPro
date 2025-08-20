// src/services/pdfGenerator.js
import jsPDF from 'jspdf';

export const generarPDFDesdeData = (data, filename = 'reporte.pdf') => {
  try {
    const pdf = new jsPDF();
    
    // Configuración inicial
    pdf.setFontSize(16);
    pdf.setTextColor(40, 40, 40);
    pdf.text('Reporte de Evaluaciones - AutoLavado Digital', 105, 15, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generado el: ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });
    
    let y = 35;
    let page = 1;
    
    // Función para agregar nueva página
    const addNewPage = () => {
      pdf.addPage();
      y = 20;
      page++;
      // Encabezado de página
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`AutoLavado Digital - Página ${page}`, 105, 10, { align: 'center' });
    };
    
    data.forEach((item, index) => {
      // Agregar nueva página si es necesario
      if (y > 250) {
        addNewPage();
      }
      
      // Encabezado del item
      pdf.setFontSize(12);
      pdf.setTextColor(40, 40, 40);
      pdf.text(`Vehículo: ${item.placa || 'N/A'}`, 20, y);
      
      // Detalles básicos
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      
      if (item.dueno) pdf.text(`Dueño: ${item.dueno}`, 20, y + 7);
      if (item.servicio) pdf.text(`Servicio: ${item.servicio}`, 20, y + 14);
      if (item.fechaTurno) pdf.text(`Fecha turno: ${item.fechaTurno}`, 20, y + 21);
      
      // Información de evaluación
      if (item.presentado) {
        pdf.setTextColor(0, 128, 0);
        pdf.text('Estado: ✅ Presentado', 100, y);
        pdf.setTextColor(80, 80, 80);
        
        if (item.calificacion) {
          pdf.text(`Calificación: ${'★'.repeat(item.calificacion)}${'☆'.repeat(5 - item.calificacion)}`, 100, y + 7);
        }
        if (item.aireAcondicionado) {
          pdf.text(`Aire acondicionado: ${item.aireAcondicionado}`, 100, y + 14);
        }
        if (item.estadoCauchos) {
          pdf.text(`Estado cauchos: ${item.estadoCauchos}`, 100, y + 21);
        }
        
        // ✅ OBSERVACIONES - Nueva sección
        if (item.observaciones) {
          pdf.setTextColor(40, 40, 40);
          pdf.setFontSize(10);
          pdf.text('Observaciones:', 20, y + 35);
          
          // Dividir observaciones en líneas si son muy largas
          const observaciones = item.observaciones;
          const maxLineLength = 80;
          let observacionesY = y + 42;
          
          if (observaciones.length > maxLineLength) {
            // Dividir en múltiples líneas
            const words = observaciones.split(' ');
            let currentLine = '';
            
            for (const word of words) {
              if ((currentLine + word).length > maxLineLength) {
                pdf.text(currentLine, 20, observacionesY);
                observacionesY += 6;
                currentLine = word + ' ';
              } else {
                currentLine += word + ' ';
              }
            }
            
            if (currentLine) {
              pdf.text(currentLine, 20, observacionesY);
              observacionesY += 6;
            }
            
            y = observacionesY + 10;
          } else {
            pdf.text(observaciones, 20, observacionesY);
            y = observacionesY + 16;
          }
        } else {
          y += 35;
        }
      } else {
        pdf.setTextColor(255, 0, 0);
        pdf.text('Estado: ❌ No presentado', 100, y);
        y += 35;
      }
      
      // Línea separadora
      pdf.setDrawColor(200, 200, 200);
      pdf.line(15, y - 5, 195, y - 5);
      
      // Espacio adicional después de las observaciones
      y += 10;
    });
    
    // Pie de página final
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Total de registros: ${data.length}`, 20, 280);
    pdf.text(`Página ${page}`, 105, 280, { align: 'center' });
    pdf.text('AutoLavado Digital - Sistema de Gestión', 190, 280, { align: 'right' });
    
    pdf.save(filename);
    return true;

  } catch (error) {
    console.error('Error generando PDF:', error);
    throw error;
  }
};

// Función alternativa para generar PDF desde HTML
export const generarPDF = async (elementId, filename = 'reporte.pdf') => {
  try {
    // Esta función requiere html2canvas, puedes implementarla luego
    console.warn('Función generarPDF no implementada completamente');
    return generarPDFDesdeData([], filename);
  } catch (error) {
    console.error('Error generando PDF desde HTML:', error);
    throw error;
  }
};