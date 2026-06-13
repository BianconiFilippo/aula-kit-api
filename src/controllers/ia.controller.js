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

const generarImagenDalle = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Falta el campo prompt en la solicitud.' });
    }

    try {
      const url = await aiService.generarImagenDalle(prompt);
      return res.status(200).json({ url });
    } catch (apiError) {
      console.error('Error al generar la imagen con DALL-E 3 (Safe fallback triggered):', apiError.message || apiError);
      
      // Fallback: Retornar error: true y una imagen placeholder bonita de Unsplash
      const fallbackUrl = `https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=1024&auto=format&fit=crop`;
      
      return res.status(200).json({
        url: fallbackUrl,
        error: true,
        message: 'No se pudo generar la imagen con DALL-E 3 debido a políticas de contenido o límites. Usando fallback de seguridad.'
      });
    }
  } catch (error) {
    console.error('Error general en generarImagenDalle controller:', error);
    return res.status(500).json({ error: 'Error interno del servidor al procesar la solicitud de imagen.' });
  }
};

module.exports = {
  sugerirUnidad,
  sugerirTema,
  generarImagenDalle
};
