const prisma = require('../services/db.js');

// Helper to normalize response to match snake_case fields for frontend if needed, 
// but returning the objects with camelCase/snake_case structure is standard in Node.
// We will return the database objects directly which contain the fields as mapped.

// GET /api/materias/:id/libro-temas
const obtenerArbolLibroTemas = async (req, res) => {
  try {
    const { id } = req.params;

    const unidades = await prisma.unidad.findMany({
      where: { materiaId: id },
      orderBy: { orden: 'asc' },
      include: {
        temas: {
          orderBy: { orden: 'asc' },
          include: {
            clases: {
              orderBy: { createdAt: 'asc' }
            }
          }
        }
      }
    });

    return res.status(200).json({ success: true, data: unidades });
  } catch (error) {
    console.error('Error al obtener el árbol del libro de temas:', error);
    return res.status(500).json({ error: 'Error interno al cargar el libro de temas.' });
  }
};

// --- CRUD UNIDADES ---

// POST /api/unidades
const crearUnidad = async (req, res) => {
  try {
    const {
      materia_id, materiaId,
      nombre,
      trimestre,
      semanas_estimadas, semanasEstimadas,
      objetivos,
      aprendizaje_pda, aprendizajePda,
      orden
    } = req.body;

    const resolvedMateriaId = materiaId || materia_id;
    if (!resolvedMateriaId || !nombre || trimestre === undefined) {
      return res.status(400).json({ error: 'Faltan campos requeridos: materiaId, nombre, trimestre.' });
    }

    const resolvedTrimestre = parseInt(trimestre, 10);
    if (resolvedTrimestre < 1 || resolvedTrimestre > 3) {
      return res.status(400).json({ error: 'El trimestre debe ser un número entre 1 y 3.' });
    }

    const nuevaUnidad = await prisma.unidad.create({
      data: {
        materiaId: resolvedMateriaId,
        nombre,
        trimestre: resolvedTrimestre,
        semanasEstimadas: semanasEstimadas !== undefined ? semanasEstimadas : (semanas_estimadas !== undefined ? parseInt(semanas_estimadas, 10) : null),
        objetivos: objetivos || null,
        aprendizajePda: aprendizajePda !== undefined ? aprendizajePda : (aprendizaje_pda || null),
        orden: orden !== undefined ? parseInt(orden, 10) : 0
      }
    });

    return res.status(201).json({ success: true, data: nuevaUnidad });
  } catch (error) {
    console.error('Error al crear unidad:', error);
    return res.status(500).json({ error: 'Error interno al crear la unidad.' });
  }
};

// PUT /api/unidades/:id
const actualizarUnidad = async (req, res) => {
  try {
    const { id } = req.params;
    const data = {};

    if (req.body.nombre !== undefined) data.nombre = req.body.nombre;
    if (req.body.trimestre !== undefined) {
      const resolvedTrimestre = parseInt(req.body.trimestre, 10);
      if (resolvedTrimestre < 1 || resolvedTrimestre > 3) {
        return res.status(400).json({ error: 'El trimestre debe ser un número entre 1 y 3.' });
      }
      data.trimestre = resolvedTrimestre;
    }
    if (req.body.semanasEstimadas !== undefined) data.semanasEstimadas = req.body.semanasEstimadas;
    else if (req.body.semanas_estimadas !== undefined) data.semanasEstimadas = req.body.semanas_estimadas;

    if (req.body.objetivos !== undefined) data.objetivos = req.body.objetivos;
    
    if (req.body.aprendizajePda !== undefined) data.aprendizajePda = req.body.aprendizajePda;
    else if (req.body.aprendizaje_pda !== undefined) data.aprendizajePda = req.body.aprendizaje_pda;

    if (req.body.orden !== undefined) data.orden = parseInt(req.body.orden, 10);

    const actualizada = await prisma.unidad.update({
      where: { id },
      data
    });

    return res.status(200).json({ success: true, data: actualizada });
  } catch (error) {
    console.error('Error al actualizar unidad:', error);
    return res.status(500).json({ error: 'Error interno al actualizar la unidad.' });
  }
};

// DELETE /api/unidades/:id
const eliminarUnidad = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.unidad.delete({
      where: { id }
    });
    return res.status(200).json({ success: true, message: 'Unidad eliminada correctamente.' });
  } catch (error) {
    console.error('Error al eliminar unidad:', error);
    return res.status(500).json({ error: 'Error interno al eliminar la unidad.' });
  }
};

// --- CRUD TEMAS ---

// POST /api/temas
const crearTema = async (req, res) => {
  try {
    const {
      unidad_id, unidadId,
      nombre,
      tipo_contenido, tipoContenido,
      clases_estimadas, clasesEstimadas,
      indicador_logro, indicadorLogro,
      forma_evaluacion, formaEvaluacion,
      orden
    } = req.body;

    const resolvedUnidadId = unidadId || unidad_id;
    const resolvedTipoContenido = tipoContenido || tipo_contenido;

    if (!resolvedUnidadId || !nombre || !resolvedTipoContenido) {
      return res.status(400).json({ error: 'Faltan campos requeridos: unidadId, nombre, tipoContenido.' });
    }

    const nuevaUnidad = await prisma.tema.create({
      data: {
        unidadId: resolvedUnidadId,
        nombre,
        tipoContenido: resolvedTipoContenido,
        clasesEstimadas: clasesEstimadas !== undefined ? clasesEstimadas : (clases_estimadas !== undefined ? parseInt(clases_estimadas, 10) : null),
        indicadorLogro: indicadorLogro !== undefined ? indicadorLogro : (indicador_logro || null),
        formaEvaluacion: formaEvaluacion !== undefined ? formaEvaluacion : (forma_evaluacion || null),
        orden: orden !== undefined ? parseInt(orden, 10) : 0
      }
    });

    return res.status(201).json({ success: true, data: nuevaUnidad });
  } catch (error) {
    console.error('Error al crear tema:', error);
    return res.status(500).json({ error: 'Error interno al crear el tema.' });
  }
};

// PUT /api/temas/:id
const actualizarTema = async (req, res) => {
  try {
    const { id } = req.params;
    const data = {};

    if (req.body.nombre !== undefined) data.nombre = req.body.nombre;
    if (req.body.tipoContenido !== undefined) data.tipoContenido = req.body.tipoContenido;
    else if (req.body.tipo_contenido !== undefined) data.tipoContenido = req.body.tipo_contenido;

    if (req.body.clasesEstimadas !== undefined) data.clasesEstimadas = req.body.clasesEstimadas;
    else if (req.body.clases_estimadas !== undefined) data.clasesEstimadas = req.body.clases_estimadas;

    if (req.body.indicadorLogro !== undefined) data.indicadorLogro = req.body.indicadorLogro;
    else if (req.body.indicador_logro !== undefined) data.indicadorLogro = req.body.indicador_logro;

    if (req.body.formaEvaluacion !== undefined) data.formaEvaluacion = req.body.formaEvaluacion;
    else if (req.body.forma_evaluacion !== undefined) data.formaEvaluacion = req.body.forma_evaluacion;

    if (req.body.orden !== undefined) data.orden = parseInt(req.body.orden, 10);

    const actualizado = await prisma.tema.update({
      where: { id },
      data
    });

    return res.status(200).json({ success: true, data: actualizado });
  } catch (error) {
    console.error('Error al actualizar tema:', error);
    return res.status(500).json({ error: 'Error interno al actualizar el tema.' });
  }
};

// DELETE /api/temas/:id
const eliminarTema = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.tema.delete({
      where: { id }
    });
    return res.status(200).json({ success: true, message: 'Tema eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar tema:', error);
    return res.status(500).json({ error: 'Error interno al eliminar el tema.' });
  }
};

// --- CRUD CLASES ---

// POST /api/clases
const crearClase = async (req, res) => {
  try {
    const {
      tema_id, temaId,
      titulo,
      fecha_estimada, fechaEstimada,
      modalidad,
      observaciones,
      estado
    } = req.body;

    const resolvedTemaId = temaId || tema_id;
    if (!resolvedTemaId || !titulo || !modalidad) {
      return res.status(400).json({ error: 'Faltan campos requeridos: temaId, titulo, modalidad.' });
    }

    const resolvedFechaEstimada = fechaEstimada !== undefined ? fechaEstimada : fecha_estimada;

    const nuevaClase = await prisma.clase.create({
      data: {
        temaId: resolvedTemaId,
        titulo,
        fechaEstimada: resolvedFechaEstimada ? new Date(resolvedFechaEstimada) : null,
        modalidad,
        observaciones: observaciones || null,
        estado: estado || 'Pendiente'
      }
    });

    return res.status(201).json({ success: true, data: nuevaClase });
  } catch (error) {
    console.error('Error al crear clase:', error);
    return res.status(500).json({ error: 'Error interno al crear la clase.' });
  }
};

// PUT /api/clases/:id
const actualizarClase = async (req, res) => {
  try {
    const { id } = req.params;
    const data = {};

    if (req.body.titulo !== undefined) data.titulo = req.body.titulo;
    
    if (req.body.fechaEstimada !== undefined) {
      data.fechaEstimada = req.body.fechaEstimada ? new Date(req.body.fechaEstimada) : null;
    } else if (req.body.fecha_estimada !== undefined) {
      data.fechaEstimada = req.body.fecha_estimada ? new Date(req.body.fecha_estimada) : null;
    }

    if (req.body.modalidad !== undefined) data.modalidad = req.body.modalidad;
    if (req.body.observaciones !== undefined) data.observaciones = req.body.observaciones;
    if (req.body.estado !== undefined) data.estado = req.body.estado;

    const actualizada = await prisma.clase.update({
      where: { id },
      data
    });

    return res.status(200).json({ success: true, data: actualizada });
  } catch (error) {
    console.error('Error al actualizar clase:', error);
    return res.status(500).json({ error: 'Error interno al actualizar la clase.' });
  }
};

// DELETE /api/clases/:id
const eliminarClase = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.clase.delete({
      where: { id }
    });
    return res.status(200).json({ success: true, message: 'Clase eliminada correctamente.' });
  } catch (error) {
    console.error('Error al eliminar clase:', error);
    return res.status(500).json({ error: 'Error interno al eliminar la clase.' });
  }
};

// POST /api/materias/:id/libro-temas/guardar
const guardarLibroDefinitivo = async (req, res) => {
  try {
    const materiaId = req.params.id;
    const { clases } = req.body;

    if (!clases || !Array.isArray(clases)) {
      return res.status(400).json({ error: "No se enviaron las clases para guardar." });
    }

    // 1. Eliminar unidades previas (borra en cascada temas y clases)
    await prisma.unidad.deleteMany({
      where: { materiaId: materiaId }
    });

    // 2. Agrupar clases por unidad
    const unidadesMap = new Map();
    let unidadOrden = 1;

    for (const clase of clases) {
      const nombreUnidad = (clase.unidad && clase.unidad.trim()) || "Unidad General";
      
      if (!unidadesMap.has(nombreUnidad)) {
        unidadesMap.set(nombreUnidad, {
          nombre: nombreUnidad,
          trimestre: 1,
          semanasEstimadas: 4,
          objetivos: "",
          aprendizajePda: "",
          orden: unidadOrden++,
          temas: []
        });
      }

      const unidadObj = unidadesMap.get(nombreUnidad);
      const temaNombre = (clase.titulo && clase.titulo.trim()) || "Tema General";
      
      let temaObj = unidadObj.temas.find(t => t.nombre === temaNombre);
      if (!temaObj) {
        temaObj = {
          nombre: temaNombre,
          tipoContenido: "Conceptual",
          clasesEstimadas: 1,
          indicadorLogro: clase.actividades || "",
          formaEvaluacion: clase.caracter || "Teórica",
          orden: clase.orden || 1,
          clases: []
        };
        unidadObj.temas.push(temaObj);
      }

      temaObj.clases.push({
        titulo: clase.titulo || "Módulo de clase",
        fechaEstimada: clase.fecha ? new Date(clase.fecha) : null,
        modalidad: clase.caracter === "Práctica" ? "Grupal" : "Individual",
        observaciones: clase.observaciones || clase.actividades || null,
        estado: clase.estado === "COMPLETADA" ? "Completada" : "Pendiente"
      });
    }

    // 3. Guardar todo en la base de datos
    for (const uni of unidadesMap.values()) {
      const createdUnidad = await prisma.unidad.create({
        data: {
          materiaId: materiaId,
          nombre: uni.nombre,
          trimestre: uni.trimestre,
          semanasEstimadas: uni.semanasEstimadas,
          objetivos: uni.objetivos,
          aprendizajePda: uni.aprendizajePda,
          orden: uni.orden
        }
      });

      for (const tema of uni.temas) {
        const createdTema = await prisma.tema.create({
          data: {
            unidadId: createdUnidad.id,
            nombre: tema.nombre,
            tipoContenido: "Conceptual",
            clasesEstimadas: tema.clasesEstimadas,
            indicadorLogro: tema.indicadorLogro,
            formaEvaluacion: tema.formaEvaluacion,
            orden: tema.orden
          }
        });

        for (const cls of tema.clases) {
          await prisma.clase.create({
            data: {
              temaId: createdTema.id,
              titulo: cls.titulo,
              fechaEstimada: cls.fechaEstimada,
              modalidad: cls.modalidad,
              observaciones: cls.observaciones,
              estado: cls.estado
            }
          });
        }
      }
    }

    return res.status(201).json({ success: true, message: "Libro de temas jerárquico guardado con éxito." });
  } catch (error) {
    console.error("Error al guardar el libro definitivo jerárquico:", error);
    return res.status(500).json({ error: "Error interno al guardar los datos jerárquicos." });
  }
};

module.exports = {
  obtenerArbolLibroTemas,
  guardarLibroDefinitivo,
  
  crearUnidad,
  actualizarUnidad,
  eliminarUnidad,

  crearTema,
  actualizarTema,
  eliminarTema,

  crearClase,
  actualizarClase,
  eliminarClase
};

