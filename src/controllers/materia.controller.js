const materiaService = require('../services/materiaService');
const { CreateMateriaDto } = require('../dtos/materia.dto');
const fuenteService = require('../services/fuenteService');
const { generarResumenMultifuente } = require('../services/aiService');
const prisma = require('../services/db');

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

const generarResumen = async (req, res) => {
  try {
    const materiaId = req.params.id;
    const { fuenteIds, instruccionesExtra } = req.body;

    if (!fuenteIds || !Array.isArray(fuenteIds) || fuenteIds.length === 0) {
      return res.status(400).json({ 
        error: 'Debes seleccionar al menos un archivo para generar el resumen.' 
      });
    }

    const nuevoRecurso = await generarResumenMultifuente(materiaId, fuenteIds, instruccionesExtra);

    return res.status(201).json({
      mensaje: 'Resumen generado con éxito',
      data: nuevoRecurso
    });

  } catch (error) {
    console.error('Error al procesar el resumen en el controlador:', error);
    return res.status(500).json({ 
      error: 'Hubo un problema al generar el resumen con Inteligencia Artificial.' 
    });
  }
};

const getFuentesMateria = async (req, res) => {
  try {
    const materiaId = req.params.id;
    const fuentes = await prisma.fuenteContenido.findMany({
      where: {
        materiaId: materiaId
      },
      select: {
        id: true,
        nombreArchivo: true,
        tipo: true,
        carpetaId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc' 
      }
    });
    return res.status(200).json({ data: fuentes });
    
  } catch (error) {
    return res.status(500).json({ error: 'Error al cargar los archivos de la materia.' });
  }
}

module.exports = { crearMateria, obtenerMaterias, obtenerMateria, subirFuente, eliminarMateria, eliminarFuente, generarResumen, getFuentesMateria };
