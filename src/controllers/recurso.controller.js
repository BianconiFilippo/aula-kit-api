const prisma = require('../services/db');
const { generarResumenMultifuente, generarClase: generarClaseIA, generarPresentacion: generarPresentacionIA, editarRecursoConIA } = require('../services/aiService');

async function generarResumen(req, res) {
  try {
    const materiaId = req.params.id;
    const { fuenteIds, instruccionesExtra, textoBase } = req.body;
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ error: 'Acceso denegado. Usuario no autenticado.' });
    }

    if (!textoBase && (!fuenteIds || !Array.isArray(fuenteIds) || fuenteIds.length === 0)) {
      return res.status(400).json({ 
        error: 'Debes seleccionar al menos un archivo o proporcionar un prompt/texto base.' 
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
    const nuevoRecurso = await generarResumenMultifuente(materiaId, fuenteIds || [], instruccionesExtra, textoBase);

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

async function generarClase(req, res) {
  try {
    const materiaId = req.params.id;
    const { material_id, instrucciones_extra, textoBase } = req.body;
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ error: 'Acceso denegado. Usuario no autenticado.' });
    }

    let textoBaseFinal = '';

    if (material_id === 'from-scratch') {
      if (!textoBase) {
        return res.status(400).json({ error: 'Debes proporcionar el campo textoBase.' });
      }
      textoBaseFinal = textoBase;
    } else {
      if (!material_id) {
        return res.status(400).json({ error: 'Debes proporcionar el campo material_id.' });
      }

      // 1. Verificar que el material existe y pertenece a la materia
      const fuente = await prisma.fuenteContenido.findFirst({
        where: { id: material_id, materiaId: materiaId }
      });

      if (!fuente) {
        return res.status(404).json({
          error: 'Material base no encontrado o no pertenece a esta materia.'
        });
      }

      if (!fuente.textoExtraido || fuente.textoExtraido.trim().length === 0) {
        return res.status(400).json({
          error: 'El material seleccionado no tiene texto extraído. Sube un archivo con contenido de texto.'
        });
      }
      textoBaseFinal = fuente.textoExtraido;
    }

    // 2. Obtener datos del usuario y verificar créditos
    let dbUser = await prisma.usuario.findUnique({ where: { id: usuarioId } });

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

    // 3. Evaluación lazy de reinicio mensual
    const ahora = new Date();
    let necesitaReinicio = false;

    if (!dbUser.fecha_ultimo_reinicio) {
      necesitaReinicio = true;
    } else {
      const fechaUltimo = new Date(dbUser.fecha_ultimo_reinicio);
      if (
        fechaUltimo.getMonth() !== ahora.getMonth() ||
        fechaUltimo.getFullYear() !== ahora.getFullYear()
      ) {
        necesitaReinicio = true;
      }
    }

    if (necesitaReinicio) {
      dbUser = await prisma.usuario.update({
        where: { id: usuarioId },
        data: { peticiones_ia_restantes: 5, fecha_ultimo_reinicio: ahora }
      });
    }

    // 4. Control de tiers y límite de consumo
    if (dbUser.tier !== 'premium') {
      if (dbUser.peticiones_ia_restantes <= 0) {
        return res.status(403).json({
          error: 'Límite gratuito alcanzado',
          code: 'LIMIT_REACHED'
        });
      }
    }

    // 5. Truncar texto si es muy largo
    let textoBaseFinalTruncado = textoBaseFinal;
    if (textoBaseFinalTruncado.length > 30000) {
      console.warn('generarClase: texto truncado por longitud excesiva.');
      textoBaseFinalTruncado = textoBaseFinalTruncado.substring(0, 30000);
    }

    // 6. Llamada a la IA
    const claseGenerada = await generarClaseIA(textoBaseFinalTruncado, instrucciones_extra || '');

    // 7. Descontar crédito solo tras respuesta exitosa
    if (dbUser.tier !== 'premium') {
      await prisma.usuario.update({
        where: { id: usuarioId },
        data: { peticiones_ia_restantes: { decrement: 1 } }
      });
    }

    return res.status(200).json({
      mensaje: 'Clase generada con éxito',
      datos: claseGenerada
    });
  } catch (error) {
    console.error('Error al generar la clase:', error);

    // Error de validación de estructura JSON de la IA
    if (error.message.includes('formato inválido') || error.message.includes('campos requeridos')) {
      return res.status(502).json({ error: error.message });
    }

    return res.status(500).json({
      error: 'Hubo un problema al generar la clase con Inteligencia Artificial.'
    });
  }
}

async function generarPresentacion(req, res) {
  try {
    const materiaId = req.params.id;
    const { material_id, instrucciones_extra, textoBase } = req.body;
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      return res.status(401).json({ error: 'Acceso denegado. Usuario no autenticado.' });
    }

    let textoBaseFinal = '';

    if (material_id === 'from-scratch') {
      if (!textoBase) {
        return res.status(400).json({ error: 'Debes proporcionar el campo textoBase.' });
      }
      textoBaseFinal = textoBase;
    } else {
      if (!material_id) {
        return res.status(400).json({ error: 'Debes proporcionar el campo material_id.' });
      }

      // 1. Verificar que el material existe y pertenece a la materia
      const fuente = await prisma.fuenteContenido.findFirst({
        where: { id: material_id, materiaId: materiaId }
      });

      if (!fuente) {
        return res.status(404).json({
          error: 'Material base no encontrado o no pertenece a esta materia.'
        });
      }

      if (!fuente.textoExtraido || fuente.textoExtraido.trim().length === 0) {
        return res.status(400).json({
          error: 'El material seleccionado no tiene texto extraído. Sube un archivo con contenido de texto.'
        });
      }
      textoBaseFinal = fuente.textoExtraido;
    }

    // 2. Obtener datos del usuario y verificar créditos
    let dbUser = await prisma.usuario.findUnique({ where: { id: usuarioId } });

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

    // 3. Evaluación lazy de reinicio mensual
    const ahora = new Date();
    let necesitaReinicio = false;

    if (!dbUser.fecha_ultimo_reinicio) {
      necesitaReinicio = true;
    } else {
      const fechaUltimo = new Date(dbUser.fecha_ultimo_reinicio);
      if (
        fechaUltimo.getMonth() !== ahora.getMonth() ||
        fechaUltimo.getFullYear() !== ahora.getFullYear()
      ) {
        necesitaReinicio = true;
      }
    }

    if (necesitaReinicio) {
      dbUser = await prisma.usuario.update({
        where: { id: usuarioId },
        data: { peticiones_ia_restantes: 5, fecha_ultimo_reinicio: ahora }
      });
    }

    // 4. Control de tiers y límite de consumo
    if (dbUser.tier !== 'premium') {
      if (dbUser.peticiones_ia_restantes <= 0) {
        return res.status(403).json({
          error: 'Límite gratuito alcanzado',
          code: 'LIMIT_REACHED'
        });
      }
    }

    // 5. Truncar texto si es muy largo
    let textoBaseFinalTruncado = textoBaseFinal;
    if (textoBaseFinalTruncado.length > 30000) {
      console.warn('generarPresentacion: texto truncado por longitud excesiva.');
      textoBaseFinalTruncado = textoBaseFinalTruncado.substring(0, 30000);
    }

    // 6. Llamada a la IA
    const presentacionGenerada = await generarPresentacionIA(textoBaseFinalTruncado, instrucciones_extra || '');

    // 7. Descontar crédito solo tras respuesta exitosa
    if (dbUser.tier !== 'premium') {
      await prisma.usuario.update({
        where: { id: usuarioId },
        data: { peticiones_ia_restantes: { decrement: 1 } }
      });
    }

    return res.status(200).json({
      mensaje: 'Presentación generada con éxito',
      datos: presentacionGenerada
    });
  } catch (error) {
    console.error('Error al generar la presentación:', error);

    // Error de validación de estructura JSON de la IA
    if (error.message.includes('formato inválido') || error.message.includes('estructura de presentación')) {
      return res.status(502).json({ error: error.message });
    }

    return res.status(500).json({
      error: 'Hubo un problema al generar la presentación con Inteligencia Artificial.'
    });
  }
}

async function editarRecursoAI(req, res) {
  try {
    const { tipo, instrucciones, contenido } = req.body;

    if (!tipo || !instrucciones || !contenido) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (tipo, instrucciones, contenido)' });
    }

    const contenidoModificado = await editarRecursoConIA(tipo, instrucciones, contenido);

    return res.status(200).json({ datos: contenidoModificado });
  } catch (error) {
    console.error('Error al editar recurso con IA:', error);
    return res.status(500).json({ error: 'Error al aplicar modificaciones con IA', detalle: error.message });
  }
}

async function eliminarRecurso(req, res) {
  try {
    const { recursoId } = req.params;

    const recurso = await prisma.generacionRecurso.findUnique({
      where: { id: recursoId }
    });

    if (!recurso) {
      return res.status(404).json({ error: 'Recurso no encontrado' });
    }

    await prisma.generacionRecurso.delete({
      where: { id: recursoId }
    });

    return res.status(200).json({ mensaje: 'Recurso eliminado con éxito' });
  } catch (error) {
    console.error('Error al eliminar el recurso:', error);
    return res.status(500).json({ error: 'Error interno al eliminar el recurso' });
  }
}

module.exports = {
  generarResumen,
  generarClase,
  generarPresentacion,
  guardarRecurso,
  obtenerRecursosPorMateria,
  obtenerRecursoPorId,
  actualizarRecurso,
  editarRecursoAI,
  eliminarRecurso
};


