const evaluacionService = require('../services/evaluacion.service');
const { EvaluacionBaseSchema } = require('../validators/evaluacion.schema');
const pdfService = require('../services/pdfService');

class EvaluacionController {
  /**
   * POST /api/evaluaciones
   * Intercepta los exámenes mediante multer (upload.array('archivos')) y los datos de la rúbrica desde req.body.
   */
  async crearEvaluacion(req, res) {
    try {
      const parseResult = EvaluacionBaseSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: 'Datos inválidos para crear la evaluación.',
          detalles: parseResult.error.flatten().fieldErrors
        });
      }

      const files = req.files || [];

      const evaluacion = await evaluacionService.crearEvaluacionConEntregas(
        parseResult.data,
        files
      );

      return res.status(201).json({
        mensaje: 'Evaluación y entregas registradas correctamente.',
        datos: evaluacion
      });
    } catch (error) {
      console.error('Error en EvaluacionController.crearEvaluacion:', error);
      const status = error.statusCode || 500;
      return res.status(status).json({
        error: error.message || 'Error interno al registrar la evaluación.'
      });
    }
  }

  /**
   * GET /api/evaluaciones/materia/:materiaId
   */
  async obtenerPorMateria(req, res) {
    try {
      const { materiaId } = req.params;
      const evaluaciones = await evaluacionService.obtenerEvaluacionesPorMateria(materiaId);
      return res.status(200).json(evaluaciones);
    } catch (error) {
      console.error('Error al obtener evaluaciones:', error);
      const status = error.statusCode || 500;
      return res.status(status).json({
        error: error.message || 'Error al obtener evaluaciones.'
      });
    }
  }

  /**
   * GET /api/evaluaciones/:id
   */
  async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const evaluacion = await evaluacionService.obtenerEvaluacionPorId(id);
      return res.status(200).json(evaluacion);
    } catch (error) {
      console.error('Error al obtener evaluación por ID:', error);
      const status = error.statusCode || 500;
      return res.status(status).json({
        error: error.message || 'Error al obtener evaluación.'
      });
    }
  }

  /**
   * PATCH /api/evaluaciones/entregas/:entregaId
   * Actualiza la nota final de una entrega
   */
  async actualizarEntrega(req, res) {
    try {
      const { entregaId } = req.params;
      const { notaFinal } = req.body;

      const entrega = await evaluacionService.actualizarEntrega(entregaId, { notaFinal });
      return res.status(200).json(entrega);
    } catch (error) {
      console.error('Error al actualizar entrega:', error);
      return res.status(500).json({ error: error.message || 'Error al actualizar la entrega.' });
    }
  }

  /**
   * POST /api/evaluaciones/entregas/:entregaId/comentarios
   * Agrega o edita un comentario de IA o docente
   */
  async guardarComentario(req, res) {
    try {
      const { entregaId } = req.params;
      const { id, sugerencia, criterio, aprobado } = req.body;

      if (!sugerencia) {
        return res.status(400).json({ error: 'La sugerencia/comentario es obligatorio.' });
      }

      const comentario = await evaluacionService.guardarComentario(entregaId, {
        id,
        sugerencia,
        criterio,
        aprobado
      });

      return res.status(200).json(comentario);
    } catch (error) {
      console.error('Error al guardar comentario:', error);
      return res.status(500).json({ error: error.message || 'Error al guardar comentario.' });
    }
  }

  /**
   * DELETE /api/evaluaciones/comentarios/:comentarioId
   */
  async eliminarComentario(req, res) {
    try {
      const { comentarioId } = req.params;
      await evaluacionService.eliminarComentario(comentarioId);
      return res.status(200).json({ mensaje: 'Comentario eliminado.' });
    } catch (error) {
      console.error('Error al eliminar comentario:', error);
      return res.status(500).json({ error: error.message || 'Error al eliminar comentario.' });
    }
  }

  /**
   * POST /api/evaluaciones/entregas/:entregaId/recorregir
   */
  async recorregirEntrega(req, res) {
    try {
      const { entregaId } = req.params;
      const entregaActualizada = await evaluacionService.corregirEntregaConIAIndividual(entregaId);
      return res.status(200).json(entregaActualizada);
    } catch (error) {
      console.error('Error al recorregir entrega:', error);
      return res.status(500).json({ error: error.message || 'Error al procesar corrección con IA.' });
    }
  }

  /**
   * POST /api/evaluaciones/:id/exportar-pdf
   * Genera un informe en PDF de la evaluación y las correcciones de todos los alumnos
   */
  async exportarInformePdf(req, res) {
    try {
      const { id } = req.params;
      const { html } = req.body;

      if (!html) {
        return res.status(400).json({ error: 'Se requiere el contenido HTML del informe.' });
      }

      const pdfBuffer = await pdfService.generarPdfDesdeHtml(html, false);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Correccion_Evaluacion_${id}.pdf"`);
      return res.send(pdfBuffer);
    } catch (error) {
      console.error('Error al exportar informe PDF:', error);
      return res.status(500).json({ error: 'Error al generar el PDF de la evaluación.' });
    }
  }

  /**
   * POST /api/evaluaciones/:id/agregar-entregas
   * Añade nuevos exámenes a una evaluación existente y los corrige con IA
   */
  async agregarEntregas(req, res) {
    try {
      const { id } = req.params;
      const files = req.files || [];

      if (files.length === 0) {
        return res.status(400).json({ error: 'Se requiere al menos un archivo.' });
      }

      const entregas = await evaluacionService.agregarEntregas(id, files);
      return res.status(201).json({
        mensaje: `${entregas.length} entrega(s) agregada(s) y analizada(s) correctamente.`,
        datos: entregas
      });
    } catch (error) {
      console.error('Error al agregar entregas:', error);
      const status = error.statusCode || 500;
      return res.status(status).json({ error: error.message || 'Error al agregar entregas.' });
    }
  }

  /**
   * POST /api/evaluaciones/:id/guardar
   * Sincroniza el snapshot de GeneracionRecurso con el estado actual de la BD
   */
  async sincronizarRecurso(req, res) {
    try {
      const { id } = req.params;
      const evaluacion = await evaluacionService.sincronizarRecursoGenerado(id);
      return res.status(200).json({
        mensaje: 'Evaluación guardada correctamente en Material Generado.',
        datos: evaluacion
      });
    } catch (error) {
      console.error('Error al sincronizar recurso generado:', error);
      const status = error.statusCode || 500;
      return res.status(status).json({ error: error.message || 'Error al guardar.' });
    }
  }
}

module.exports = new EvaluacionController();
