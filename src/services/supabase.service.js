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

  /**
   * Sube múltiples archivos al bucket público 'entregas-alumnos' y retorna sus URLs y nombres originales.
   * @param {Array<Express.Multer.File>} files - Lista de archivos de multer en memoria
   * @param {string} bucketName - Nombre del bucket (por defecto 'entregas-alumnos')
   * @returns {Promise<Array<{ nombreOriginal: string, archivoUrl: string }>>}
   */
  async subirEntregasAlumnos(files, bucketName = 'entregas-alumnos') {
    if (!files || files.length === 0) {
      return [];
    }

    const { ensureBrowserCompatibleImage } = require('./imageConverter.service');
    const resultados = [];

    for (const file of files) {
      // Convertir si es foto de iPhone (HEIC disfrazado de JPG) para que Chrome y OpenAI puedan leerlo
      const compatible = ensureBrowserCompatibleImage(file.buffer, file.originalname);
      const extension = compatible.filename.split('.').pop() || 'jpg';
      const sanitizedName = (compatible.filename || 'examen')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .substring(0, 80);
      const fileName = `${Date.now()}-${randomUUID()}-${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, compatible.buffer, {
          contentType: compatible.mimetype || 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        console.error(`Error al subir ${file.originalname} a ${bucketName}:`, uploadError);
        throw new Error(`Error al subir archivo a Supabase Storage (${file.originalname}): ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      resultados.push({
        nombreOriginal: file.originalname,
        archivoUrl: publicUrl
      });
    }

    return resultados;
  }
}

module.exports = new SupabaseStorageService();
