const materiaService = require('../services/materia.service');
const { CreateMateriaDto } = require('../dtos/materia.dto');

const crearMateria = async (req, res) => {
  const createMateriaDto = new CreateMateriaDto(req.body, req.user.id);

  if (!createMateriaDto.isValid()) {
    return res.status(400).json({ error: 'Faltan datos requeridos para la materia' });
  }

  try {
    const materia = await materiaService.create(createMateriaDto);
    return res.status(201).json(materia);
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo crear la materia', detalle: error.message });
  }
};

const obtenerMaterias = async (req, res) => {
  try {
    const materias = await materiaService.getAll(req.user.id);
    return res.status(200).json(materias);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener materias' });
  }
};

module.exports = { crearMateria, obtenerMaterias };
