const supabase = require('./supabase');
const { randomUUID } = require('crypto');

/**
 * Servicio para gestión de almacenamiento de entregas de alumnos en Supabase Storage
 */
class EvaluacionStorageService {
  /**
   * Sube un archivo de entrega de alumno y retorna la URL pública.
   * @param {Buffer} buffer - Buffer del archivo
   * @param {string} originalName - Nombre original (ej: perez_juan.pdf)
   * @param {string} mimetype - Tipo MIME del archivo
   * @param {string} evaluacionId - ID de la evaluación
   * @param {string} bucketName - Bucket (por defecto 'material')
   * @returns {Promise<string>} URL pública del archivo
   */
  async subirEntregaAlumno(buffer, originalName, mimetype, evaluacionId, bucketName = 'material') {
    const extension = originalName ? originalName.split('.').pop() : 'pdf';
    // Sanitizar nombre para storage
    const sanitizedBase = (originalName || 'archivo')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);
    const fileName = `evaluaciones/${evaluacionId}/${Date.now()}-${randomUUID()}-${sanitizedBase}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: mimetype || 'application/octet-stream',
        upsert: false
      });

    if (uploadError) {
      console.error(`Error al subir entrega a Supabase (${bucketName}):`, uploadError);
      throw new Error(`Error al subir archivo a Supabase Storage: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return publicUrl;
  }
}

module.exports = new EvaluacionStorageService();
