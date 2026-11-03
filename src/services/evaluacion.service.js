const prisma = require('./db');
const supabaseStorageService = require('./supabase.service');
const { corregirEntregaConIA } = require('./aiCorreccion.service');

class EvaluacionService {
  /**
   * Crea una evaluación base y guarda las entregas de los alumnos vinculadas a la evaluación.
   * Ejecuta la lógica transaccional:
   * 1. Guarda la EvaluacionBase
   * 2. Sube los archivos a Supabase Storage (bucket público 'entregas-alumnos')
   * 3. Registra las EntregaAlumno vinculadas a la evaluación
   * 4. Registra automáticamente la evaluación en GeneracionRecurso (tipo 'EVALUACION') para que figure en "Material Generado"
   * 5. Lanza la corrección inicial con IA (GPT-4o Vision) para las entregas
   */
  async crearEvaluacionConEntregas({ titulo, consignas, criterios, materiaId }, files = []) {
    // 1. Verificar existencia de la materia
    const materia = await prisma.materia.findUnique({
      where: { id: materiaId }
    });

    if (!materia) {
      const error = new Error('La materia especificada no existe.');
      error.statusCode = 404;
      throw error;
    }

    // 2. Transacción de base de datos y subida de archivos
    const evaluacion = await prisma.evaluacionBase.create({
      data: {
        titulo,
        consignas,
        criterios,
        materiaId
      }
    });

    try {
      // 3. Subir los archivos al bucket entregas-alumnos de Supabase
      const archivosSubidos = await supabaseStorageService.subirEntregasAlumnos(files, 'entregas-alumnos');

      // 4. Crear los registros de EntregaAlumno en la BD vinculados a la evaluación
      const entregasCreadas = [];
      for (const archivo of archivosSubidos) {
        const entrega = await prisma.entregaAlumno.create({
          data: {
            nombreOriginal: archivo.nombreOriginal,
            archivoUrl: archivo.archivoUrl,
            evaluacionId: evaluacion.id
          }
        });
        entregasCreadas.push(entrega);
      }

      // 5. Analizar y corregir cada entrega con IA de fondo
      for (const entrega of entregasCreadas) {
        try {
          const resultadoIA = await corregirEntregaConIA({
            consignas,
            criterios,
            archivoUrl: entrega.archivoUrl,
            nombreOriginal: entrega.nombreOriginal
          });

          // Actualizar nota final sugerida
          if (resultadoIA.notaFinal) {
            await prisma.entregaAlumno.update({
              where: { id: entrega.id },
              data: { notaFinal: resultadoIA.notaFinal }
            });
          }

          // Guardar comentarios IA
          if (resultadoIA.comentarios && resultadoIA.comentarios.length > 0) {
            for (const com of resultadoIA.comentarios) {
              await prisma.comentarioIA.create({
                data: {
                  sugerencia: com.sugerencia,
                  criterio: com.criterio || null,
                  aprobado: typeof com.aprobado === 'boolean' ? com.aprobado : true,
                  entregaId: entrega.id
                }
              });
            }
          }
        } catch (iaErr) {
          console.error(`Error al corregir entrega ${entrega.id} con IA:`, iaErr);
        }
      }

      // 6. Registrar en GeneracionRecurso para que aparezca en "Material Generado" del docente
      const evaluacionCompleta = await prisma.evaluacionBase.findUnique({
        where: { id: evaluacion.id },
        include: {
          entregas: {
            include: { comentarios: true }
          }
        }
      });

      await prisma.generacionRecurso.create({
        data: {
          materiaId: materiaId,
          tipo: 'EVALUACION',
          titulo: titulo,
          contenido: JSON.stringify(evaluacionCompleta)
        }
      }).catch(errRec => console.error('Error al registrar en GeneracionRecurso:', errRec));

      return evaluacionCompleta;
    } catch (storageOrDbError) {
      console.error('Error durante la carga de entregas o persistencia:', storageOrDbError);
      await prisma.evaluacionBase.delete({
        where: { id: evaluacion.id }
      }).catch(err => console.error('Error al revertir EvaluacionBase:', err));

      throw storageOrDbError;
    }
  }

  /**
   * Obtiene todas las evaluaciones de una materia
   */
  async obtenerEvaluacionesPorMateria(materiaId) {
    return prisma.evaluacionBase.findMany({
      where: { materiaId },
      include: {
        entregas: {
          include: {
            comentarios: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Obtiene una evaluación específica con sus entregas y comentarios
   */
  async obtenerEvaluacionPorId(id) {
    const evaluacion = await prisma.evaluacionBase.findUnique({
      where: { id },
      include: {
        materia: true,
        entregas: {
          include: {
            comentarios: {
              orderBy: { createdAt: 'asc' }
            }
          }
        }
      }
    });

    if (!evaluacion) {
      const error = new Error('Evaluación no encontrada.');
      error.statusCode = 404;
      throw error;
    }

    return evaluacion;
  }

  /**
   * Actualiza una entrega de alumno: nota final o datos
   */
  async actualizarEntrega(entregaId, { notaFinal }) {
    return prisma.entregaAlumno.update({
      where: { id: entregaId },
      data: {
        notaFinal
      },
      include: {
        comentarios: true
      }
    });
  }

  /**
   * Agrega o edita un comentario de IA / docente
   */
  async guardarComentario(entregaId, { id, sugerencia, criterio, aprobado }) {
    if (id) {
      return prisma.comentarioIA.update({
        where: { id },
        data: { sugerencia, criterio, aprobado }
      });
    }

    return prisma.comentarioIA.create({
      data: {
        sugerencia,
        criterio,
        aprobado: aprobado ?? true,
        entregaId
      }
    });
  }

  /**
   * Elimina un comentario
   */
  async eliminarComentario(comentarioId) {
    return prisma.comentarioIA.delete({
      where: { id: comentarioId }
    });
  }

  /**
   * Reevalúa o solicita corrección con IA para una entrega
   */
  async corregirEntregaConIAIndividual(entregaId) {
    const entrega = await prisma.entregaAlumno.findUnique({
      where: { id: entregaId },
      include: { evaluacion: true }
    });

    if (!entrega) {
      throw new Error('Entrega no encontrada.');
    }

    const resultado = await corregirEntregaConIA({
      consignas: entrega.evaluacion.consignas,
      criterios: entrega.evaluacion.criterios,
      archivoUrl: entrega.archivoUrl,
      nombreOriginal: entrega.nombreOriginal
    });

    if (resultado.notaFinal) {
      await prisma.entregaAlumno.update({
        where: { id: entregaId },
        data: { notaFinal: resultado.notaFinal }
      });
    }

    // Limpiar comentarios previos y cargar los nuevos
    await prisma.comentarioIA.deleteMany({ where: { entregaId } });

    for (const com of resultado.comentarios) {
      await prisma.comentarioIA.create({
        data: {
          sugerencia: com.sugerencia,
          criterio: com.criterio,
          aprobado: com.aprobado ?? true,
          entregaId
        }
      });
    }

    return prisma.entregaAlumno.findUnique({
      where: { id: entregaId },
      include: { comentarios: true }
    });
  }

  /**
   * Agrega nuevas entregas de alumnos a una evaluación existente y las corrige con IA.
   */
  async agregarEntregas(evaluacionId, files) {
    const evaluacion = await prisma.evaluacionBase.findUnique({
      where: { id: evaluacionId },
      select: { id: true, consignas: true, criterios: true, materiaId: true }
    });

    if (!evaluacion) {
      const error = new Error('Evaluación no encontrada.');
      error.statusCode = 404;
      throw error;
    }

    if (!files || files.length === 0) {
      const error = new Error('Se requiere al menos un archivo.');
      error.statusCode = 400;
      throw error;
    }

    const archivosSubidos = await supabaseStorageService.subirEntregasAlumnos(files, 'entregas-alumnos');
    const entregasCreadas = [];

    for (const archivo of archivosSubidos) {
      const entrega = await prisma.entregaAlumno.create({
        data: {
          nombreOriginal: archivo.nombreOriginal,
          archivoUrl: archivo.archivoUrl,
          evaluacionId
        }
      });
      entregasCreadas.push(entrega);
    }

    // Corregir cada nueva entrega con IA
    for (const entrega of entregasCreadas) {
      try {
        const resultadoIA = await corregirEntregaConIA({
          consignas: evaluacion.consignas,
          criterios: evaluacion.criterios,
          archivoUrl: entrega.archivoUrl,
          nombreOriginal: entrega.nombreOriginal
        });

        if (resultadoIA.notaFinal) {
          await prisma.entregaAlumno.update({
            where: { id: entrega.id },
            data: { notaFinal: resultadoIA.notaFinal }
          });
          entrega.notaFinal = resultadoIA.notaFinal;
        }

        if (resultadoIA.comentarios && resultadoIA.comentarios.length > 0) {
          entrega.comentarios = [];
          for (const com of resultadoIA.comentarios) {
            const comentario = await prisma.comentarioIA.create({
              data: {
                sugerencia: com.sugerencia,
                criterio: com.criterio || null,
                aprobado: typeof com.aprobado === 'boolean' ? com.aprobado : true,
                entregaId: entrega.id
              }
            });
            entrega.comentarios.push(comentario);
          }
        }
      } catch (iaErr) {
        console.error(`Error al corregir nueva entrega ${entrega.id} con IA:`, iaErr);
        entrega.comentarios = [];
      }
    }

    return entregasCreadas;
  }

  /**
   * Sincroniza el registro de GeneracionRecurso con el estado actual de la evaluación en la BD.
   * Permite "guardar" el estado visible en Material Generado.
   */
  async sincronizarRecursoGenerado(evaluacionId) {
    const evaluacion = await prisma.evaluacionBase.findUnique({
      where: { id: evaluacionId },
      include: {
        entregas: {
          include: { comentarios: { orderBy: { createdAt: 'asc' } } }
        }
      }
    });

    if (!evaluacion) {
      const error = new Error('Evaluación no encontrada.');
      error.statusCode = 404;
      throw error;
    }

    // Actualizar el snapshot de GeneracionRecurso si existe
    await prisma.generacionRecurso.updateMany({
      where: {
        materiaId: evaluacion.materiaId,
        tipo: 'EVALUACION',
        titulo: evaluacion.titulo
      },
      data: {
        contenido: JSON.stringify(evaluacion)
      }
    }).catch(err => console.error('Error al sincronizar GeneracionRecurso:', err));

    return evaluacion;
  }
}

module.exports = new EvaluacionService();
