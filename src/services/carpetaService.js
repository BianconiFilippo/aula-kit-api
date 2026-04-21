const prisma = require('./db');

class CarpetaService {
  async crearCarpeta(materiaId, nombre, parentId = null) {
    return await prisma.carpeta.create({
      data: {
        nombre,
        materiaId,
        parentId,
      },
    });
  }

  async renombrarCarpeta(carpetaId, nuevoNombre) {
    return await prisma.carpeta.update({
      where: { id: carpetaId },
      data: { nombre: nuevoNombre },
    });
  }

  async eliminarCarpeta(carpetaId) {
    // Las fuentes contendidas o hijas se eliminarán automáticamente si pusiste onDelete: Cascade
    // No obstante, si necesitas eliminar físicamente los archivos de Storage, podrías requerir
    // buscar las fuentes dependientes primero. El borrado a nivel BD se maneja con Cascade.
    
    // Si necesitas borrar archivos en Storage:
    // Aquí puedes incluir el llamado a supabase storage deletion como en MateriaService,
    // o manejarlo vía webhook/trigger/script programado.
    
    return await prisma.carpeta.delete({
      where: { id: carpetaId },
    });
  }
}

module.exports = new CarpetaService();
