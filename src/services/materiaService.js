const prisma = require('./db');
const MateriaModel = require('../models/materia.model');

class MateriaService {
  async crearMateria(createMateriaDto) {
    const nuevaMateria = await prisma.materia.create({
      data: {
        nombre: createMateriaDto.nombre,
        usuarioId: createMateriaDto.usuarioId
      }
    });
    return new MateriaModel(nuevaMateria);
  }

  async obtenerMaterias(usuarioId) {
    const materias = await prisma.materia.findMany({
      where: { usuarioId }
    });
    return materias.map(materia => new MateriaModel(materia));
  }
}

module.exports = new MateriaService();
