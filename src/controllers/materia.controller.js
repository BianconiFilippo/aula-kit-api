const materiaService = require('../services/materiaService');
const { CreateMateriaDto } = require('../dtos/materia.dto');
const fuenteService = require('../services/fuenteService');

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

const obtenerMateria = async (req, res) => {
  try {
    const { id } = req.params;
    const materia = await materiaService.getOne(id);
    return res.status(200).json(materia);
  } catch (error) {
    console.error('Error en obtenerMateria:', error);
    if (error.message === 'Materia no encontrada') {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Error al obtener la materia', detalle: error.message });
  }
};

const subirFuente = async (req, res) => {
  try {
    const { id } = req.params;
    const { carpetaId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const fuente = await fuenteService.subirArchivoYGuardar(id, file, carpetaId);
    return res.status(201).json(fuente);
  }
  catch (error) {
    return res.status(500).json({ error: 'Error al subir la fuente', detalle: error.message });
  }
}

const eliminarMateria = async (req, res) => {
  try {
    const { id } = req.params;
    await materiaService.delete(id);
    return res.status(200).json({ mensaje: 'Materia y sus archivos eliminados correctamente' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const eliminarFuente = async (req, res) => {
  try {
    const { fuenteId } = req.params;
    await fuenteService.eliminarFuente(fuenteId); 
    return res.status(200).json({ mensaje: 'Archivo eliminado correctamente' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = { crearMateria, obtenerMaterias, obtenerMateria, subirFuente, eliminarMateria, eliminarFuente };
