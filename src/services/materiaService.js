const prisma = require('./db');
const MateriaModel = require('../models/materia.model');

class MateriaService {
  async create(data) {
    const nuevaMateria = await prisma.materia.create({
      data: {
        nombre: data.nombre,
        usuarioId: data.usuarioId
      }
    });
    return new MateriaModel(nuevaMateria);
  }

  async getAll(usuarioId) {
    const materias = await prisma.materia.findMany({
      where: { usuarioId }
    });
    return materias.map(materia => new MateriaModel(materia));
  }

  async getOne(id) {
    const materia = await prisma.materia.findUnique({
      where: { id },
      include: { 
        fuentes: true,
        carpetas: true
      }
    });
    if (!materia) throw new Error('Materia no encontrada');
    return new MateriaModel(materia);
  }

  async delete(id) {
    const materia = await prisma.materia.findUnique({
      where: { id: id },
      include: { fuentes: true }
    });

    if (!materia) throw new Error('Materia no encontrada');

    const filePaths = materia.fuentes
      .map(f => f.urlArchivo.split('/material/')[1])
      .filter(Boolean);

    if (filePaths.length > 0) {
      await supabase.storage.from('material').remove(filePaths);
    }

    await prisma.fuenteContenido.deleteMany({
      where: { materiaId: id }
    });

    await prisma.materia.delete({
      where: { id: id }
    });

    return true;
  }
}

module.exports = new MateriaService();
