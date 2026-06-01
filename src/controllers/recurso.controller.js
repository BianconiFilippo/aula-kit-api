const prisma = require('../services/db');
const { generarResumenMultifuente } = require('../services/aiService');

async function generarResumen(req, res) {
  try {
    const materiaId = req.params.id;
    const { fuenteIds, instruccionesExtra } = req.body;

    if (!fuenteIds || !Array.isArray(fuenteIds) || fuenteIds.length === 0) {
      return res.status(400).json({ 
        error: 'Debes seleccionar al menos un archivo para generar el resumen.' 
      });
    }

    const nuevoRecurso = await generarResumenMultifuente(materiaId, fuenteIds, instruccionesExtra);

    return res.status(200).json({
      mensaje: 'Recurso generado con éxito',
      datos: nuevoRecurso
    });
  } catch (error) {
    console.error('Error al procesar el resumen en el controlador:', error);
    return res.status(500).json({ 
      error: 'Hubo un problema al generar el recurso con Inteligencia Artificial.' 
    });
  }
}

async function guardarRecurso(req, res) {
  try {
    const { materiaId, tipo, titulo, contenido } = req.body;

    if (!materiaId || !tipo || !titulo || !contenido) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const recurso = await prisma.generacionRecurso.create({
      data: {
        materiaId,
        tipo,
        titulo,
        contenido
      }
    });

    return res.status(201).json(recurso);
  } catch (error) {
    console.error('Error al guardar el recurso:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function obtenerRecursosPorMateria(req, res) {
  try {
    const { id: materiaId } = req.params;

    const recursos = await prisma.generacionRecurso.findMany({
      where: { materiaId },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(recursos);
  } catch (error) {
    console.error('Error al obtener los recursos:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = {
  generarResumen,
  guardarRecurso,
  obtenerRecursosPorMateria
};
