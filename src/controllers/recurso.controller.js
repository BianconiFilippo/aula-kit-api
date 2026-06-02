const prisma = require('../services/db');
const { generarResumenMultifuente } = require('../services/aiService');

async function generarResumen(req, res) {
  try {
    const materiaId = req.params.id;
    const { fuenteIds, instruccionesExtra } = req.body;
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ error: 'Acceso denegado. Usuario no autenticado.' });
    }

    if (!fuenteIds || !Array.isArray(fuenteIds) || fuenteIds.length === 0) {
      return res.status(400).json({ 
        error: 'Debes seleccionar al menos un archivo para generar el resumen.' 
      });
    }

    // 1. Obtener datos de consumo del usuario local
    let dbUser = await prisma.usuario.findUnique({
      where: { id: usuarioId }
    });

    // Sincronización automática de seguridad si el trigger no ha corrido
    if (!dbUser) {
      dbUser = await prisma.usuario.create({
        data: {
          id: usuarioId,
          email: req.user.email,
          nombreCompleto: req.user.user_metadata?.nombreCompleto || req.user.user_metadata?.full_name || 'Usuario',
          tier: 'free',
          peticiones_ia_restantes: 3,
          fecha_ultimo_reinicio: new Date()
        }
      });
    }

    // Evaluación Lazy de Reinicio Mensual
    const ahora = new Date();
    let necesitaReinicio = false;

    if (!dbUser.fecha_ultimo_reinicio) {
      necesitaReinicio = true;
    } else {
      const fechaUltimo = new Date(dbUser.fecha_ultimo_reinicio);
      if (fechaUltimo.getMonth() !== ahora.getMonth() || fechaUltimo.getFullYear() !== ahora.getFullYear()) {
        necesitaReinicio = true;
      }
    }

    if (necesitaReinicio) {
      dbUser = await prisma.usuario.update({
        where: { id: usuarioId },
        data: {
          peticiones_ia_restantes: 5, // Límite por defecto mensual
          fecha_ultimo_reinicio: ahora
        }
      });
    }

    // 2. Control de Tiers y Límite de Consumo
    if (dbUser.tier !== 'premium') {
      if (dbUser.peticiones_ia_restantes <= 0) {
        return res.status(403).json({
          error: 'Límite gratuito alcanzado',
          code: 'LIMIT_REACHED'
        });
      }
    }

    // 3. Generación mediante OpenAI Service
    const nuevoRecurso = await generarResumenMultifuente(materiaId, fuenteIds, instruccionesExtra);

    // 4. Descontar petición solo tras respuesta OpenAI exitosa
    if (dbUser.tier !== 'premium') {
      await prisma.usuario.update({
        where: { id: usuarioId },
        data: {
          peticiones_ia_restantes: {
            decrement: 1
          }
        }
      });
    }

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

async function obtenerRecursoPorId(req, res) {
  try {
    const { recursoId } = req.params;

    const recurso = await prisma.generacionRecurso.findUnique({
      where: { id: recursoId }
    });

    if (!recurso) {
      return res.status(404).json({ error: 'Recurso no encontrado' });
    }

    return res.status(200).json(recurso);
  } catch (error) {
    console.error('Error al obtener el recurso:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function actualizarRecurso(req, res) {
  try {
    const { recursoId } = req.params;
    const { titulo, contenido } = req.body;

    const recurso = await prisma.generacionRecurso.update({
      where: { id: recursoId },
      data: {
        titulo,
        contenido
      }
    });

    return res.status(200).json(recurso);
  } catch (error) {
    console.error('Error al actualizar el recurso:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = {
  generarResumen,
  guardarRecurso,
  obtenerRecursosPorMateria,
  obtenerRecursoPorId,
  actualizarRecurso
};
