import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ExportPDFButton = ({ filters, containerRef }) => {
  const generatePDF = async () => {
    const container = containerRef.current;
    if (!container) return;

    // Mostrar un loading visual (opcional)
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    try {
      // Capturar el contenido del contenedor
      const canvas = await html2canvas(container, {
        scale: 2, // Mayor resolución
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: container.scrollWidth,
        height: container.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');

      // Configurar PDF en A4 con márgenes de 20mm (aprox. 75.6 pt)
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 56.7; // 20mm en puntos

      const pdfWidth = pageWidth - 2 * margin;
      const pdfHeight = pageHeight - 2 * margin;

      // Obtener dimensiones de la imagen
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Escalar la imagen al ancho disponible
      const scaleFactor = pdfWidth / imgWidth;
      const imgScaledHeight = imgHeight * scaleFactor;

      // Calcular cuántas páginas se necesitan
      const totalPages = Math.ceil(imgScaledHeight / pdfHeight);

      // Función para agregar una página con la porción correspondiente de la imagen
      const addPageWithImage = (pageIndex) => {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        // Dibujar la imagen recortada
        pdf.saveGraphicsState();
        // Definir el área de recorte (clip)
        pdf.rect(margin, margin, pdfWidth, pdfHeight, 'S');
        pdf.clip();

        // Posición Y de la imagen: se desplaza hacia arriba para mostrar la parte correspondiente
        const yOffset = -pageIndex * pdfHeight;
        // La imagen se coloca en (margin, margin + yOffset) pero con altura total imgScaledHeight
        pdf.addImage(
          imgData,
          'PNG',
          margin,
          margin + yOffset,
          pdfWidth,
          imgScaledHeight
        );
        pdf.restoreGraphicsState();
      };

      // Generar todas las páginas
      for (let i = 0; i < totalPages; i++) {
        addPageWithImage(i);
      }

      // Guardar PDF
      pdf.save('Reporte_ventas_Dario_Lopez.pdf');

    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Intenta nuevamente.');
    } finally {
      document.body.style.overflow = originalOverflow;
    }
  };

  return (
    <button
      onClick={generatePDF}
      className="px-4 py-2 bg-red-500/20 backdrop-blur-sm hover:bg-red-500/30 text-white text-sm rounded-lg border border-red-500/30 transition"
    >
      Exportar PDF
    </button>
  );
};

export default ExportPDFButton;