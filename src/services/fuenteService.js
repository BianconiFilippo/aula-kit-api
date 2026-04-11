const supabase = require('./supabase');
const prisma = require('./db');
const pdf = require('pdf-parse');

class FuenteService {
  async subirArchivoYGuardar(materiaId, file) {
    const extension = file.originalname.split('.').pop();
    const nombreUnico = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
    const filePath = `${materiaId}/${nombreUnico}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('material')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) throw new Error(`Error al subir a Supabase: ${uploadError.message}`);

    const { data: { publicUrl } } = supabase.storage
      .from('material')
      .getPublicUrl(filePath);
    
    let tipo = 'TEXTO_PLANO';
    let textoExtraido = null;

    if (file.mimetype.includes('pdf')) {
      tipo = 'PDF';
      try {
        const data = await pdf(file.buffer);
        // Limpiar el texto: quitar excesos de saltos de línea y espacios dobles
        textoExtraido = data.text
          .replace(/\n+/g, '\n')
          .replace(/[ ]+/g, ' ')
          .trim();
      } catch (error) {
        console.warn('Error al extraer texto del PDF (posiblemente encriptado o corrupto):', error.message);
        textoExtraido = null;
      }
    } else if (file.mimetype.includes('image')) {
      tipo = 'IMAGEN';
    } else if (file.mimetype.includes('video')) {
      tipo = 'VIDEO';
    }

    const nuevaFuente = await prisma.fuenteContenido.create({
      data: {
        materiaId: materiaId,
        tipo: tipo,
        urlArchivo: publicUrl,
        nombreArchivo: file.originalname,
        textoExtraido: textoExtraido
      }
    });
    return nuevaFuente;
  }

  async eliminarFuente(fuenteId) {
    const fuente = await prisma.fuenteContenido.findUnique({
      where: { id: fuenteId }
    });
    if (!fuente) throw new Error('Fuente no encontrada');
    const { error } = await supabase.storage.from('material').remove([fuente.urlArchivo]);
    if (error) throw new Error('Error al eliminar fuente');
    await prisma.fuenteContenido.delete({
      where: { id: fuenteId }
    });
    return true;
  }
}

module.exports = new FuenteService();