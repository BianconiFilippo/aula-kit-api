const axios = require('axios');

class UnsplashService {
  async buscarImagen(keyword) {
    const key = process.env.UNSPLASH_ACCESS_KEY;
    
    // Si no hay API Key configurada, usar un fallback placeholder directamente
    if (!key || key.trim().length === 0) {
      console.warn('UnsplashService: UNSPLASH_ACCESS_KEY no está configurado. Usando imagen de respaldo.');
      return this.obtenerImagenRespaldo(keyword);
    }

    // Limpiar el prompt/keyword para obtener una consulta simple de 2-3 palabras para Unsplash
    let query = keyword || 'education';
    if (keyword && keyword.length > 20) {
      const cleaned = keyword
        .toLowerCase()
        .replace(/a close up of|a hyper-realistic|hyper-realistic|close-up|photorealistic|flat vector|illustration|glowing|high-tech|clean background|isolated|digital art|4k|3d render|showing|concept/g, '')
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
        .trim();
      const words = cleaned.split(/\s+/).filter(w => w.length > 2 && !['the', 'and', 'with', 'for', 'that', 'from', 'of', 'in', 'an', 'a', 'illustration'].includes(w));
      if (words.length > 0) {
        query = words.slice(0, 3).join(' ');
      }
    }

    try {
      const response = await axios.get('https://api.unsplash.com/search/photos', {
        params: {
          query: query,
          per_page: 5,
          orientation: 'landscape'
        },
        headers: {
          Authorization: `Client-ID ${key}`
        },
        timeout: 5000 // 5 segundos de timeout
      });

      const results = response.data?.results;
      if (results && results.length > 0) {
        // Seleccionar una imagen aleatoria entre las primeras 5 para dar variedad al regenerar
        const limit = Math.min(results.length, 5);
        const randomIndex = Math.floor(Math.random() * limit);
        const photo = results[randomIndex];
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
    let query = keyword || 'education';
    if (keyword && keyword.length > 20) {
      const cleaned = keyword
        .toLowerCase()
        .replace(/a close up of|a hyper-realistic|hyper-realistic|close-up|photorealistic|flat vector|illustration|glowing|high-tech|clean background|isolated|digital art|4k|3d render|showing|concept/g, '')
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
        .trim();
      const words = cleaned.split(/\s+/).filter(w => w.length > 2 && !['the', 'and', 'with', 'for', 'that', 'from', 'of', 'in', 'an', 'a', 'illustration'].includes(w));
      if (words.length > 0) {
        query = words.slice(0, 2).join(',');
      }
    }
    const safeKeyword = encodeURIComponent(query.trim().toLowerCase().replace(/[^a-z0-9]+/g, ','));
    const rand = Math.floor(Math.random() * 10000);
    return {
      url: `https://loremflickr.com/800/450/${safeKeyword}?random=${rand}`,
      autor: 'Respaldo (Flickr)'
    };
  }
}

module.exports = new UnsplashService();
