const unsplashService = require('../services/unsplashService');

async function buscarImagen(req, res) {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Debes proporcionar un término de búsqueda en la query (?query=keyword).' });
    }

    const resultado = await unsplashService.buscarImagen(query);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error('Error en imagenController.buscarImagen:', error.message);
    // Retornar fallback para que el frontend no se rompa
    const fallback = unsplashService.obtenerImagenRespaldo(req.query?.query || 'education');
    return res.status(200).json(fallback);
  }
}

module.exports = {
  buscarImagen
};
