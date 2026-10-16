const supabase = require('./supabase');
const { randomUUID } = require('crypto');

/**
 * Servicio para gestión de almacenamiento en Supabase Storage
 */
class SupabaseStorageService {
  /**
   * Sube un archivo al bucket público especificado y retorna la URL pública.
   * @param {Buffer} buffer - Contenido binario del archivo
   * @param {string} originalName - Nombre original del archivo (para extraer extensión)
   * @param {string} mimetype - Tipo MIME del archivo
   * @param {string} bucketName - Nombre del bucket en Supabase (por defecto 'materia-icons')
   * @returns {Promise<string>} URL pública del archivo subido
   */
  async subirIconoMateria(buffer, originalName, mimetype, bucketName = 'materia-icons') {
    const extension = originalName ? originalName.split('.').pop() : 'png';
    const fileName = `${Date.now()}-${randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: mimetype || 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error(`Error al subir a bucket ${bucketName}:`, uploadError);
      throw new Error(`Error al subir imagen a Supabase Storage: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return publicUrl;
  }
}

module.exports = new SupabaseStorageService();
