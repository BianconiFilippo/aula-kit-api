const pdfService = require('../services/pdfService');
const pptxService = require('../services/pptxService');

const exportarPdf = async (req, res) => {
  try {
    const { html, filename, landscape } = req.body;
    if (!html) {
      return res.status(400).json({ error: 'Falta el campo HTML en el cuerpo de la solicitud.' });
    }

    const pdfBuffer = await pdfService.generarPdfDesdeHtml(html, landscape);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'Documento.pdf'}"`);
    
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error in exportarPdf controller:', error);
    return res.status(500).json({ error: 'Error interno del servidor al exportar el PDF.' });
  }
};

const exportarPresentacionPptx = async (req, res) => {
  try {
    const { presentacion, filename } = req.body;
    if (!presentacion || !Array.isArray(presentacion.diapositivas)) {
      return res.status(400).json({ error: 'Faltan los datos de la presentación en el cuerpo de la solicitud.' });
    }

    const pptxBuffer = await pptxService.generarPptxDesdePresentacion(presentacion);
    const finalFilename = filename || `${presentacion.titulo_presentacion || 'Presentacion'}.pptx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(finalFilename)}"`);

    return res.send(pptxBuffer);
  } catch (error) {
    console.error('Error in exportarPresentacionPptx controller:', error);
    return res.status(500).json({ error: 'Error interno del servidor al exportar la presentación a PowerPoint.' });
  }
};

const exportarPresentacionPdf = async (req, res) => {
  try {
    const { presentacion, filename } = req.body;
    if (!presentacion || !Array.isArray(presentacion.diapositivas)) {
      return res.status(400).json({ error: 'Faltan los datos de la presentación en el cuerpo de la solicitud.' });
    }

    const pdfBuffer = await pdfService.generarPdfPresentacion(presentacion);
    const finalFilename = filename || `${presentacion.titulo_presentacion || 'Presentacion'}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(finalFilename)}"`);

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error in exportarPresentacionPdf controller:', error);
    return res.status(500).json({ error: 'Error interno del servidor al exportar la presentación a PDF.' });
  }
};

module.exports = {
  exportarPdf,
  exportarPresentacionPptx,
  exportarPresentacionPdf
};
