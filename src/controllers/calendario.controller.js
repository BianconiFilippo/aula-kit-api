// Forzar reinicio de nodemon: 1
const prisma = require('../services/db.js');

// GET /api/calendario/eventos
const obtenerEventosCalendario = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    // 1. Obtener todas las clases asociadas a materias del usuario
    const clases = await prisma.clase.findMany({
      where: {
        tema: {
          unidad: {
            libroTema: {
              materia: {
                usuarioId: usuarioId
              }
            }
          }
        }
      },
      include: {
        tema: {
          select: {
            id: true,
            nombre: true,
            tipoContenido: true,
            unidad: {
              select: {
                id: true,
                nombre: true,
                color: true,
                libroTema: {
                  select: {
                    id: true,
                    cicloLectivo: true,
                    cursoDivision: true,
                    materia: {
                      select: {
                        id: true,
                        nombre: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        fechaEstimada: 'asc'
      }
    });

    // Formatear clases para que sean fáciles de consumir en el frontend
    const clasesFormateadas = clases.map(c => ({
      id: c.id,
      titulo: c.titulo,
      fecha: c.fechaEstimada,
      modalidad: c.modalidad,
      estado: c.estado,
      novedades: c.novedades,
      orden: c.orden,
      tipo: 'clase',
      // Datos de jerarquía
      temaId: c.tema.id,
      temaNombre: c.tema.nombre,
      tipoContenido: c.tema.tipoContenido,
      unidadId: c.tema.unidad.id,
      unidadNombre: c.tema.unidad.nombre,
      color: c.tema.unidad.color,
      libroTemaId: c.tema.unidad.libroTema.id,
      cicloLectivo: c.tema.unidad.libroTema.cicloLectivo,
      cursoDivision: c.tema.unidad.libroTema.cursoDivision,
      materiaId: c.tema.unidad.libroTema.materia.id,
      materiaNombre: c.tema.unidad.libroTema.materia.nombre
    }));

    // 2. Obtener todos los recordatorios del usuario
    const recordatorios = await prisma.recordatorio.findMany({
      where: {
        usuarioId: usuarioId
      },
      include: {
        materia: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: {
        fecha: 'asc'
      }
    });

    const recordatoriosFormateados = recordatorios.map(r => ({
      id: r.id,
      titulo: r.titulo,
      contenido: r.contenido,
      fecha: r.fecha,
      color: r.color || 'blue',
      tipo: 'recordatorio',
      usuarioId: r.usuarioId,
      materiaId: r.materiaId,
      materiaNombre: r.materia ? r.materia.nombre : null,
      createdAt: r.createdAt
    }));

    return res.status(200).json({
      success: true,
      clases: clasesFormateadas,
      recordatorios: recordatoriosFormateados
    });
  } catch (error) {
    console.error('Error al obtener eventos del calendario:', error);
    return res.status(500).json({ error: 'Error al cargar los eventos del calendario.' });
  }
};

// POST /api/calendario/recordatorios
const crearRecordatorio = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { titulo, contenido, fecha, color, materiaId } = req.body;

    if (!titulo || !fecha) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: titulo y fecha.' });
    }

    const nuevoRecordatorio = await prisma.recordatorio.create({
      data: {
        titulo: titulo.substring(0, 120),
        contenido: contenido || null,
        fecha: new Date(fecha),
        color: color || 'blue',
        usuarioId: usuarioId,
        materiaId: materiaId || null
      },
      include: {
        materia: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      data: {
        id: nuevoRecordatorio.id,
        titulo: nuevoRecordatorio.titulo,
        contenido: nuevoRecordatorio.contenido,
        fecha: nuevoRecordatorio.fecha,
        color: nuevoRecordatorio.color,
        tipo: 'recordatorio',
        usuarioId: nuevoRecordatorio.usuarioId,
        materiaId: nuevoRecordatorio.materiaId,
        materiaNombre: nuevoRecordatorio.materia ? nuevoRecordatorio.materia.nombre : null,
        createdAt: nuevoRecordatorio.createdAt
      }
    });
  } catch (error) {
    console.error('Error al crear recordatorio:', error);
    return res.status(500).json({ error: 'Error al crear el recordatorio.' });
  }
};

// PUT /api/calendario/recordatorios/:id
const actualizarRecordatorio = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { id } = req.params;
    const { titulo, contenido, fecha, color, materiaId } = req.body;

    // Verificar propiedad
    const recordatorioExistente = await prisma.recordatorio.findFirst({
      where: {
        id: id,
        usuarioId: usuarioId
      }
    });

    if (!recordatorioExistente) {
      return res.status(404).json({ error: 'Recordatorio no encontrado o sin autorización.' });
    }

    const data = {};
    if (titulo !== undefined) data.titulo = titulo.substring(0, 120);
    if (contenido !== undefined) data.contenido = contenido;
    if (fecha !== undefined) data.fecha = new Date(fecha);
    if (color !== undefined) data.color = color;
    if (materiaId !== undefined) data.materiaId = materiaId || null;

    const recordatorioActualizado = await prisma.recordatorio.update({
      where: { id: id },
      data,
      include: {
        materia: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        id: recordatorioActualizado.id,
        titulo: recordatorioActualizado.titulo,
        contenido: recordatorioActualizado.contenido,
        fecha: recordatorioActualizado.fecha,
        color: recordatorioActualizado.color,
        tipo: 'recordatorio',
        usuarioId: recordatorioActualizado.usuarioId,
        materiaId: recordatorioActualizado.materiaId,
        materiaNombre: recordatorioActualizado.materia ? recordatorioActualizado.materia.nombre : null,
        createdAt: recordatorioActualizado.createdAt
      }
    });
  } catch (error) {
    console.error('Error al actualizar recordatorio:', error);
    return res.status(500).json({ error: 'Error al actualizar el recordatorio.' });
  }
};

// DELETE /api/calendario/recordatorios/:id
const eliminarRecordatorio = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { id } = req.params;

    // Verificar propiedad
    const recordatorioExistente = await prisma.recordatorio.findFirst({
      where: {
        id: id,
        usuarioId: usuarioId
      }
    });

    if (!recordatorioExistente) {
      return res.status(404).json({ error: 'Recordatorio no encontrado o sin autorización.' });
    }

    await prisma.recordatorio.delete({
      where: { id: id }
    });

    return res.status(200).json({
      success: true,
      message: 'Recordatorio eliminado correctamente.'
    });
  } catch (error) {
    console.error('Error al eliminar recordatorio:', error);
    return res.status(500).json({ error: 'Error al eliminar el recordatorio.' });
  }
};

module.exports = {
  obtenerEventosCalendario,
  crearRecordatorio,
  actualizarRecordatorio,
  eliminarRecordatorio
};
