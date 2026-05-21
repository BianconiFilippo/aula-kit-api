const prisma = require('../services/db');

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
  guardarRecurso,
  obtenerRecursosPorMateria
};
