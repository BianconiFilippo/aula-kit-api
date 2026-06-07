const aiService = require('../services/aiService');

const sugerirUnidad = async (req, res) => {
  try {
    const { materia, nivel_anio, nivelAnio, nombre_unidad, nombreUnidad } = req.body;
    
    const resolvedMateria = materia;
    const resolvedNivelAnio = nivelAnio || nivel_anio;
    const resolvedNombreUnidad = nombreUnidad || nombre_unidad;

    if (!resolvedMateria || !resolvedNivelAnio || !resolvedNombreUnidad) {
      return res.status(400).json({ error: 'Faltan campos requeridos: materia, nivel_anio, nombre_unidad.' });
    }

    const sugerencia = await aiService.sugerirDatosUnidad(resolvedMateria, resolvedNivelAnio, resolvedNombreUnidad);
    return res.status(200).json({ success: true, data: sugerencia });
  } catch (error) {
    console.error('Error en sugerirUnidad:', error);
    return res.status(500).json({ error: error.message || 'Error interno al sugerir datos de la unidad.' });
  }
};

const sugerirTema = async (req, res) => {
  try {
    const {
      materia,
      nivel_anio, nivelAnio,
      nombre_unidad, nombreUnidad,
      pda_unidad, pdaUnidad,
      nombre_tema, nombreTema
    } = req.body;

    const resolvedMateria = materia;
    const resolvedNivelAnio = nivelAnio || nivel_anio;
    const resolvedNombreUnidad = nombreUnidad || nombre_unidad;
    const resolvedPdaUnidad = pdaUnidad || pda_unidad;
    const resolvedNombreTema = nombreTema || nombre_tema;

    if (!resolvedMateria || !resolvedNivelAnio || !resolvedNombreUnidad || !resolvedPdaUnidad || !resolvedNombreTema) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: materia, nivel_anio, nombre_unidad, pda_unidad, nombre_tema.'
      });
    }

    const sugerencia = await aiService.sugerirDatosTema(
      resolvedMateria,
      resolvedNivelAnio,
      resolvedNombreUnidad,
      resolvedPdaUnidad,
      resolvedNombreTema
    );
    return res.status(200).json({ success: true, data: sugerencia });
  } catch (error) {
    console.error('Error en sugerirTema:', error);
    return res.status(500).json({ error: error.message || 'Error interno al sugerir datos del tema.' });
  }
};

module.exports = {
  sugerirUnidad,
  sugerirTema
};
