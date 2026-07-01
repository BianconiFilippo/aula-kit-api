const pdfService = require('../services/pdfService');

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

module.exports = {
  exportarPdf
};
