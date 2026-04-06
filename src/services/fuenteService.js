const supabase = require('./supabase');
const prisma = require('./db');

class FuenteService {
  async subirArchivoYGuardar(materiaId, file) {
    const extension = file.originalname.split('.').pop();
    const nombreUnico = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
    const filePath = `${materiaId}/${nombreUnico}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('materiales')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) throw new Error(`Error al subir a Supabase: ${uploadError.message}`);

    const { data: { publicUrl } } = supabase.storage
      .from('materiales')
      .getPublicUrl(filePath);
    let tipo = 'TEXTO_PLANO';
    if (file.mimetype.includes('pdf')) tipo = 'PDF';
    else if (file.mimetype.includes('image')) tipo = 'IMAGEN';
    else if (file.mimetype.includes('video')) tipo = 'VIDEO';

    const nuevaFuente = await prisma.fuenteContenido.create({
      data: {
        materiaId: materiaId,
        tipo: tipo,
        urlArchivo: publicUrl,
        nombreArchivo: file.originalname,
      }
    });

    return nuevaFuente;
  }
}

module.exports = new FuenteService();