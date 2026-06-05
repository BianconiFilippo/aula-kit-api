const axios = require('axios');

class UnsplashService {
  async buscarImagen(keyword) {
    const key = process.env.UNSPLASH_ACCESS_KEY;
    
    // Si no hay API Key configurada, usar un fallback placeholder directamente
    if (!key || key.trim().length === 0) {
      console.warn('UnsplashService: UNSPLASH_ACCESS_KEY no está configurado. Usando imagen de respaldo.');
      return this.obtenerImagenRespaldo(keyword);
    }

    try {
      const response = await axios.get('https://api.unsplash.com/search/photos', {
        params: {
          query: keyword,
          per_page: 1,
          orientation: 'landscape'
        },
        headers: {
          Authorization: `Client-ID ${key}`
        },
        timeout: 5000 // 5 segundos de timeout
      });

      const results = response.data?.results;
      if (results && results.length > 0) {
        const photo = results[0];
        return {
          url: photo.urls?.regular,
          autor: photo.user?.name || 'Unsplash'
        };
      }

      // Si no hay resultados de búsqueda
      return this.obtenerImagenRespaldo(keyword);
    } catch (error) {
      console.error('Error al consultar Unsplash:', error.response?.data || error.message);
      // Retornar fallback silenciosamente
      return this.obtenerImagenRespaldo(keyword);
    }
  }

  obtenerImagenRespaldo(keyword) {
    const safeKeyword = encodeURIComponent(keyword.trim().toLowerCase().replace(/[^a-z0-9]+/g, ','));
    return {
      url: `https://loremflickr.com/800/450/${safeKeyword}`,
      autor: 'Respaldo (Flickr)'
    };
  }
}

module.exports = new UnsplashService();
