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
}

module.exports = new MateriaService();
