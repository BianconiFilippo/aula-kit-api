const prisma = require('../services/db.js');
const libroTemasService = require('../services/libroService');
const axios = require('axios');
const aiService = require('../services/aiService');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');

// --- Helper Functions to validate and map Enums ---
const mapTrimestre = (val) => {
  if (val === 1 || val === '1' || val === 'T1') return 'T1';
  if (val === 2 || val === '2' || val === 'T2') return 'T2';
  if (val === 3 || val === '3' || val === 'T3') return 'T3';
  return null;
};

const ColorUnidadEnum = ['teal', 'blue', 'amber', 'coral', 'purple', 'pink', 'green'];
const CapacidadMCCEnum = ['oralidad', 'pensamiento_critico', 'resolucion_problemas', 'trabajo_colaborativo', 'tecnologias', 'ed_ambiental'];
const TipoContenidoTemaEnum = ['conceptual', 'procedimental', 'actitudinal', 'mixto'];
const EvaluacionTemaEnum = ['observacion', 'tp', 'escrita', 'oral', 'sin_evaluacion'];
const ModalidadClaseEnum = ['individual', 'grupal', 'plenario', 'mixta'];
const EstadoClaseNuevoEnum = ['planificada', 'dada', 'cancelada', 'postergada'];

// --- Helper function to calculate bottom-up dates ---
const calcularFechasJerarquia = (unidades) => {
  return unidades.map(unidad => {
    const temasActualizados = (unidad.temas || []).map(tema => {
      const clasesConFecha = (tema.clases || [])
        .filter(c => c.fechaEstimada)
        .map(c => new Date(c.fechaEstimada));

      let fechaInicio = null;
      let fechaFin = null;

      if (clasesConFecha.length > 0) {
        fechaInicio = new Date(Math.min(...clasesConFecha));
        fechaFin = new Date(Math.max(...clasesConFecha));
      }

      return {
        ...tema,
        fechaInicio,
        fechaFin,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      };
    });

    const fechasTemas = temasActualizados
      .reduce((acc, t) => {
        if (t.fechaInicio) acc.push(t.fechaInicio);
        if (t.fechaFin) acc.push(t.fechaFin);
        return acc;
      }, []);

    let fechaInicioUni = null;
    let fechaFinUni = null;

    if (fechasTemas.length > 0) {
      fechaInicioUni = new Date(Math.min(...fechasTemas));
      fechaFinUni = new Date(Math.max(...fechasTemas));
    }

    return {
      ...unidad,
      temas: temasActualizados,
      fechaInicio: fechaInicioUni,
      fechaFin: fechaFinUni,
      fecha_inicio: fechaInicioUni,
      fecha_fin: fechaFinUni
    };
  });
};

// GET /api/materias/:id/libro-temas
const obtenerArbolLibroTemas = async (req, res) => {
  try {
    const { id } = req.params; // id represents the libroTemaId

    const unidades = await prisma.unidad.findMany({
      where: { libroTemaId: id },
      orderBy: { orden: 'asc' },
      include: {
        temas: {
          orderBy: { orden: 'asc' },
          include: {
            clases: {
              orderBy: [
                { fechaEstimada: 'asc' },
                { orden: 'asc' }
              ]
            }
          }
        }
      }
    });

    const datosConFechas = calcularFechasJerarquia(unidades);

    return res.status(200).json({ success: true, data: datosConFechas });
  } catch (error) {
    console.error('Error al obtener el árbol del libro de temas:', error);
    return res.status(500).json({ error: 'Error interno al cargar el libro de temas.' });
  }
};

const obtenerArbolPorMateria = async (req, res) => {
  try {
    const { materia_id } = req.params;

    const libroTema = await prisma.libroTema.findFirst({
      where: { materiaId: materia_id },
      orderBy: { createdAt: 'desc' }
    });

    if (!libroTema) {
      return res.status(200).json({ success: true, data: [], message: 'No se encontró un libro de temas para esta materia.' });
    }

    const unidades = await prisma.unidad.findMany({
      where: { libroTemaId: libroTema.id },
      orderBy: { orden: 'asc' },
      include: {
        temas: {
          orderBy: { orden: 'asc' },
          include: {
            clases: {
              orderBy: [
                { fechaEstimada: 'asc' },
                { orden: 'asc' }
              ]
            }
          }
        }
      }
    });

    const datosConFechas = calcularFechasJerarquia(unidades);

    return res.status(200).json({ success: true, data: datosConFechas, libroTemaId: libroTema.id });
  } catch (error) {
    console.error('Error al obtener el árbol por materia:', error);
    return res.status(500).json({ error: 'Error interno al cargar el libro de temas.' });
  }
};

// --- CRUD UNIDADES ---

// POST /api/unidades
const crearUnidad = async (req, res) => {
  try {
    const {
      libro_tema_id, libroTemaId,
      nombre,
      trimestre,
      semanas_estimadas, semanasEstimadas,
      color,
      objetivos,
      aprendizaje_pda, aprendizajePda,
      meta_ciclo_pda, metaCicloPda,
      capacidades_mcc, capacidadesMcc,
      orden
    } = req.body;

    const resolvedLibroTemaId = libroTemaId || libro_tema_id;
    if (!resolvedLibroTemaId || !nombre || trimestre === undefined || color === undefined) {
      return res.status(400).json({ error: 'Faltan campos requeridos: libroTemaId, nombre, trimestre, color.' });
    }

    const mappedTrimestre = mapTrimestre(trimestre);
    if (!mappedTrimestre) {
      return res.status(400).json({ error: 'El trimestre debe ser 1, 2 o 3.' });
    }

    if (!ColorUnidadEnum.includes(color)) {
      return res.status(400).json({ error: `Color inválido. Debe ser uno de: ${ColorUnidadEnum.join(', ')}` });
    }

    const rawCapacidades = capacidadesMcc || capacidades_mcc || [];
    const validCapacidades = Array.isArray(rawCapacidades) 
      ? rawCapacidades.filter(c => CapacidadMCCEnum.includes(c))
      : [];

    const parsedSemanas = semanasEstimadas !== undefined 
      ? parseInt(semanasEstimadas, 10) 
      : (semanas_estimadas !== undefined ? parseInt(semanas_estimadas, 10) : 1);

    const nuevaUnidad = await prisma.unidad.create({
      data: {
        libroTemaId: resolvedLibroTemaId,
        nombre: nombre.substring(0, 120),
        trimestre: mappedTrimestre,
        semanasEstimadas: parsedSemanas,
        color,
        objetivos: objetivos || null,
        aprendizajePda: aprendizajePda !== undefined ? aprendizajePda : (aprendizaje_pda || null),
        metaCicloPda: metaCicloPda !== undefined ? metaCicloPda : (meta_ciclo_pda || null),
        capacidadesMcc: validCapacidades,
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

    if (req.body.nombre !== undefined) data.nombre = req.body.nombre.substring(0, 120);
    
    if (req.body.trimestre !== undefined) {
      const mappedTrimestre = mapTrimestre(req.body.trimestre);
      if (!mappedTrimestre) {
        return res.status(400).json({ error: 'El trimestre debe ser 1, 2 o 3.' });
      }
      data.trimestre = mappedTrimestre;
    }

    if (req.body.semanasEstimadas !== undefined) {
      data.semanasEstimadas = parseInt(req.body.semanasEstimadas, 10);
    } else if (req.body.semanas_estimadas !== undefined) {
      data.semanasEstimadas = parseInt(req.body.semanas_estimadas, 10);
    }

    if (req.body.color !== undefined) {
      if (!ColorUnidadEnum.includes(req.body.color)) {
        return res.status(400).json({ error: `Color inválido. Debe ser uno de: ${ColorUnidadEnum.join(', ')}` });
      }
      data.color = req.body.color;
    }

    if (req.body.objetivos !== undefined) data.objetivos = req.body.objetivos;
    
    if (req.body.aprendizajePda !== undefined) data.aprendizajePda = req.body.aprendizajePda;
    else if (req.body.aprendizaje_pda !== undefined) data.aprendizajePda = req.body.aprendizaje_pda;

    if (req.body.metaCicloPda !== undefined) data.metaCicloPda = req.body.metaCicloPda;
    else if (req.body.meta_ciclo_pda !== undefined) data.metaCicloPda = req.body.meta_ciclo_pda;

    const rawCapacidades = req.body.capacidadesMcc !== undefined 
      ? req.body.capacidadesMcc 
      : (req.body.capacidades_mcc !== undefined ? req.body.capacidades_mcc : undefined);

    if (rawCapacidades !== undefined) {
      data.capacidadesMcc = Array.isArray(rawCapacidades) 
        ? rawCapacidades.filter(c => CapacidadMCCEnum.includes(c))
        : [];
    }

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
      evaluacion,
      indicador_logro, indicadorLogro,
      observaciones,
      orden
    } = req.body;

    const resolvedUnidadId = unidadId || unidad_id;
    const resolvedTipoContenido = tipoContenido || tipo_contenido;
    const resolvedClasesEstimadas = clasesEstimadas !== undefined 
      ? parseInt(clasesEstimadas, 10) 
      : (clases_estimadas !== undefined ? parseInt(clases_estimadas, 10) : 1);

    if (!resolvedUnidadId || !nombre || !resolvedTipoContenido || evaluacion === undefined) {
      return res.status(400).json({ error: 'Faltan campos requeridos: unidadId, nombre, tipoContenido, evaluacion.' });
    }

    if (!TipoContenidoTemaEnum.includes(resolvedTipoContenido)) {
      return res.status(400).json({ error: `tipoContenido inválido. Debe ser uno de: ${TipoContenidoTemaEnum.join(', ')}` });
    }

    if (!EvaluacionTemaEnum.includes(evaluacion)) {
      return res.status(400).json({ error: `evaluacion inválido. Debe ser uno de: ${EvaluacionTemaEnum.join(', ')}` });
    }

    const nuevoTema = await prisma.tema.create({
      data: {
        unidadId: resolvedUnidadId,
        nombre: nombre.substring(0, 120),
        tipoContenido: resolvedTipoContenido,
        clasesEstimadas: resolvedClasesEstimadas,
        evaluacion: evaluacion,
        indicadorLogro: indicadorLogro !== undefined ? indicadorLogro : (indicador_logro || null),
        observaciones: observaciones || null,
        orden: orden !== undefined ? parseInt(orden, 10) : 0
      }
    });

    return res.status(201).json({ success: true, data: nuevoTema });
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

    if (req.body.nombre !== undefined) data.nombre = req.body.nombre.substring(0, 120);
    
    const resolvedTipoContenido = req.body.tipoContenido !== undefined 
      ? req.body.tipoContenido 
      : (req.body.tipo_contenido !== undefined ? req.body.tipo_contenido : undefined);

    if (resolvedTipoContenido !== undefined) {
      if (!TipoContenidoTemaEnum.includes(resolvedTipoContenido)) {
        return res.status(400).json({ error: `tipoContenido inválido. Debe ser uno de: ${TipoContenidoTemaEnum.join(', ')}` });
      }
      data.tipoContenido = resolvedTipoContenido;
    }

    if (req.body.clasesEstimadas !== undefined) {
      data.clasesEstimadas = parseInt(req.body.clasesEstimadas, 10);
    } else if (req.body.clases_estimadas !== undefined) {
      data.clasesEstimadas = parseInt(req.body.clases_estimadas, 10);
    }

    if (req.body.evaluacion !== undefined) {
      if (!EvaluacionTemaEnum.includes(req.body.evaluacion)) {
        return res.status(400).json({ error: `evaluacion inválido. Debe ser uno de: ${EvaluacionTemaEnum.join(', ')}` });
      }
      data.evaluacion = req.body.evaluacion;
    }

    if (req.body.indicadorLogro !== undefined) data.indicadorLogro = req.body.indicadorLogro;
    else if (req.body.indicador_logro !== undefined) data.indicadorLogro = req.body.indicador_logro;

    if (req.body.observaciones !== undefined) data.observaciones = req.body.observaciones;
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
      estado,
      novedades,
      orden
    } = req.body;

    const resolvedTemaId = temaId || tema_id;
    if (!resolvedTemaId || !titulo || !modalidad) {
      return res.status(400).json({ error: 'Faltan campos requeridos: temaId, titulo, modalidad.' });
    }

    if (!ModalidadClaseEnum.includes(modalidad)) {
      return res.status(400).json({ error: `modalidad inválida. Debe ser una de: ${ModalidadClaseEnum.join(', ')}` });
    }

    if (estado !== undefined && !EstadoClaseNuevoEnum.includes(estado)) {
      return res.status(400).json({ error: `estado inválido. Debe ser uno de: ${EstadoClaseNuevoEnum.join(', ')}` });
    }

    const resolvedFechaEstimada = fechaEstimada !== undefined ? fechaEstimada : fecha_estimada;

    const nuevaClase = await prisma.clase.create({
      data: {
        temaId: resolvedTemaId,
        titulo: titulo.substring(0, 120),
        fechaEstimada: resolvedFechaEstimada ? new Date(resolvedFechaEstimada) : null,
        modalidad,
        estado: estado || 'planificada',
        novedades: novedades || null,
        orden: orden !== undefined ? parseInt(orden, 10) : 0
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

    if (req.body.titulo !== undefined) data.titulo = req.body.titulo.substring(0, 120);
    
    if (req.body.fechaEstimada !== undefined) {
      data.fechaEstimada = req.body.fechaEstimada ? new Date(req.body.fechaEstimada) : null;
    } else if (req.body.fecha_estimada !== undefined) {
      data.fechaEstimada = req.body.fecha_estimada ? new Date(req.body.fecha_estimada) : null;
    }

    if (req.body.modalidad !== undefined) {
      if (!ModalidadClaseEnum.includes(req.body.modalidad)) {
        return res.status(400).json({ error: `modalidad inválida. Debe ser una de: ${ModalidadClaseEnum.join(', ')}` });
      }
      data.modalidad = req.body.modalidad;
    }

    if (req.body.estado !== undefined) {
      if (!EstadoClaseNuevoEnum.includes(req.body.estado)) {
        return res.status(400).json({ error: `estado inválido. Debe ser uno de: ${EstadoClaseNuevoEnum.join(', ')}` });
      }
      data.estado = req.body.estado;
    }

    if (req.body.novedades !== undefined) data.novedades = req.body.novedades;
    if (req.body.orden !== undefined) data.orden = parseInt(req.body.orden, 10);

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

// POST /api/libros-temas/:id/guardar
const guardarLibroDefinitivo = async (req, res) => {
  try {
    const libroTemaId = req.params.id;
    const { clases } = req.body;

    if (!clases || !Array.isArray(clases)) {
      return res.status(400).json({ error: "No se enviaron las clases para guardar." });
    }

    // 1. Eliminar unidades previas (borra en cascada temas y clases)
    await prisma.unidad.deleteMany({
      where: { libroTemaId: libroTemaId }
    });

    // 2. Agrupar clases por unidad
    const unidadesMap = new Map();
    let unidadOrden = 1;

    for (const clase of clases) {
      const nombreUnidad = (clase.unidad && clase.unidad.trim()) || "Unidad General";
      
      if (!unidadesMap.has(nombreUnidad)) {
        unidadesMap.set(nombreUnidad, {
          nombre: nombreUnidad,
          trimestre: 'T1',
          semanasEstimadas: 4,
          color: 'blue',
          objetivos: "",
          aprendizajePda: "",
          metaCicloPda: "",
          capacidadesMcc: [],
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
          tipoContenido: "conceptual",
          clasesEstimadas: 1,
          evaluacion: "sin_evaluacion",
          indicadorLogro: clase.actividades || "",
          orden: clase.orden || 1,
          clases: []
        };
        unidadObj.temas.push(temaObj);
      }

      // Map modality, default states safely
      let parsedModalidad = 'individual';
      const lowercaseModalidad = (clase.caracter || '').toLowerCase();
      if (lowercaseModalidad.includes('práctica') || lowercaseModalidad.includes('grupal')) {
        parsedModalidad = 'grupal';
      }

      let parsedEstado = 'planificada';
      if (clase.estado === 'COMPLETADA' || clase.estado === 'dada') {
        parsedEstado = 'dada';
      }

      temaObj.clases.push({
        titulo: (clase.titulo || "Módulo de clase").substring(0, 120),
        fechaEstimada: clase.fecha ? new Date(clase.fecha) : null,
        modalidad: parsedModalidad,
        estado: parsedEstado,
        novedades: clase.observaciones || clase.actividades || null,
        orden: clase.orden || 1
      });
    }

    // 3. Guardar todo en la base de datos
    for (const uni of unidadesMap.values()) {
      const createdUnidad = await prisma.unidad.create({
        data: {
          libroTemaId: libroTemaId,
          nombre: uni.nombre,
          trimestre: uni.trimestre,
          semanasEstimadas: uni.semanasEstimadas,
          color: uni.color,
          objetivos: uni.objetivos,
          aprendizajePda: uni.aprendizajePda,
          metaCicloPda: uni.metaCicloPda,
          capacidadesMcc: uni.capacidadesMcc,
          orden: uni.orden
        }
      });

      for (const tema of uni.temas) {
        const createdTema = await prisma.tema.create({
          data: {
            unidadId: createdUnidad.id,
            nombre: tema.nombre,
            tipoContenido: tema.tipoContenido,
            clasesEstimadas: tema.clasesEstimadas,
            evaluacion: tema.evaluacion,
            indicadorLogro: tema.indicadorLogro,
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
              estado: cls.estado,
              novedades: cls.novedades,
              orden: cls.orden
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

// GET /api/materias/:id/libros
const obtenerLibrosPorMateria = async (req, res) => {
  try {
    const { id } = req.params;
    const libros = await prisma.libroTema.findMany({
      where: { materiaId: id },
      orderBy: { cicloLectivo: 'desc' }
    });
    return res.status(200).json({ success: true, data: libros });
  } catch (error) {
    console.error('Error al obtener libros por materia:', error);
    return res.status(500).json({ error: 'Error al cargar los libros de temas.' });
  }
};

// POST /api/materias/:id/libros
const crearLibroTema = async (req, res) => {
  try {
    const { id } = req.params;
    const { cicloLectivo, cursoDivision } = req.body;

    if (!cicloLectivo || !cursoDivision) {
      return res.status(400).json({ error: 'Faltan campos requeridos: cicloLectivo, cursoDivision.' });
    }

    const nuevoLibro = await prisma.libroTema.create({
      data: {
        materiaId: id,
        cicloLectivo: parseInt(cicloLectivo, 10),
        cursoDivision
      }
    });

    return res.status(201).json({ success: true, data: nuevoLibro });
  } catch (error) {
    console.error('Error al crear libro de temas:', error);
    return res.status(500).json({ error: 'Error al crear el libro de temas.' });
  }
};

// DELETE /api/libros-temas/:id
const eliminarLibroTema = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.libroTema.delete({
      where: { id }
    });
    return res.status(200).json({ success: true, message: 'Libro de temas eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar libro de temas:', error);
    return res.status(500).json({ error: 'Error al eliminar el libro de temas.' });
  }
};

// POST /api/libros-temas/:id/duplicar
const duplicarLibroTema = async (req, res) => {
  try {
    const { id } = req.params;
    const { cicloLectivo, cursoDivision } = req.body;

    if (!cicloLectivo || !cursoDivision) {
      return res.status(400).json({ error: 'Faltan campos requeridos: cicloLectivo, cursoDivision.' });
    }

    const libroOriginal = await prisma.libroTema.findUnique({
      where: { id },
      include: {
        unidades: {
          include: {
            temas: true
          }
        }
      }
    });

    if (!libroOriginal) {
      return res.status(404).json({ error: 'Libro de temas original no encontrado.' });
    }

    const nuevoLibro = await prisma.libroTema.create({
      data: {
        materiaId: libroOriginal.materiaId,
        cicloLectivo: parseInt(cicloLectivo, 10),
        cursoDivision
      }
    });

    for (const unidad of libroOriginal.unidades) {
      const nuevaUnidad = await prisma.unidad.create({
        data: {
          libroTemaId: nuevoLibro.id,
          nombre: unidad.nombre,
          trimestre: unidad.trimestre,
          semanasEstimadas: unidad.semanasEstimadas,
          color: unidad.color,
          objetivos: unidad.objetivos,
          aprendizajePda: unidad.aprendizajePda,
          metaCicloPda: unidad.metaCicloPda,
          capacidadesMcc: unidad.capacidadesMcc,
          orden: unidad.orden
        }
      });

      for (const tema of unidad.temas) {
        await prisma.tema.create({
          data: {
            unidadId: nuevaUnidad.id,
            nombre: tema.nombre,
            tipoContenido: tema.tipoContenido,
            clasesEstimadas: tema.clasesEstimadas,
            evaluacion: tema.evaluacion,
            indicadorLogro: tema.indicadorLogro,
            observaciones: tema.observaciones,
            orden: tema.orden
          }
        });
      }
    }

    return res.status(201).json({ success: true, data: nuevoLibro });
  } catch (error) {
    console.error('Error al duplicar libro de temas:', error);
    return res.status(500).json({ error: 'Error al duplicar el libro de temas.' });
  }
};

const generarLibroTemas = async (req, res) => {
  try {
    const materiaId = req.params.id;

    const {
      estructuraRequerida,
      instruccionesExtra,
      frecuenciaSemanal, frecuencia_semanal,
      volumenMaterial, volumen_material,
      configFechas
    } = req.body;

    if (!estructuraRequerida || !Array.isArray(estructuraRequerida) || estructuraRequerida.length === 0) {
      return res.status(400).json({ error: 'Falta la estructura requerida de clases o está vacía.' });
    }

    const resultado = await libroTemasService.generarLibroTemasIA(
      materiaId,
      estructuraRequerida,
      instruccionesExtra,
      frecuenciaSemanal || frecuencia_semanal,
      volumenMaterial || volumen_material,
      configFechas
    );

    return res.status(200).json({ success: true, data: resultado });
  } catch (error) {
    console.error('Error al generar libro de temas:', error);
    return res.status(500).json({ error: 'Error interno al generar el libro de temas.' });
  }
};

const modificarFechasLibro = async (req, res) => {
  try {
    const { id } = req.params;
    const { fechaInicio, fechaFin, diasCursada } = req.body;

    if (!fechaInicio || !fechaFin || !diasCursada || !Array.isArray(diasCursada) || diasCursada.length === 0) {
      return res.status(400).json({ error: 'Faltan campos requeridos o son inválidos.' });
    }

    const unidades = await prisma.unidad.findMany({
      where: { libroTemaId: id },
      include: {
        temas: {
          include: {
            clases: {
              orderBy: [
                { fechaEstimada: 'asc' },
                { orden: 'asc' },
                { createdAt: 'asc' }
              ]
            }
          }
        }
      },
      orderBy: { orden: 'asc' }
    });

    let clasesActuales = [];
    let ultimoTemaId = null;

    for (const uni of unidades) {
      for (const tema of uni.temas) {
        ultimoTemaId = tema.id;
        clasesActuales.push(...tema.clases);
      }
    }

    if (!ultimoTemaId) {
      const defaultUnidad = await prisma.unidad.create({
        data: {
          libroTemaId: id,
          nombre: "Unidad General",
          trimestre: "T1",
          semanasEstimadas: 4,
          color: "blue",
          orden: 1
        }
      });
      const defaultTema = await prisma.tema.create({
        data: {
          unidadId: defaultUnidad.id,
          nombre: "Tema General",
          tipoContenido: "conceptual",
          clasesEstimadas: 1,
          evaluacion: "sin_evaluacion",
          orden: 1
        }
      });
      ultimoTemaId = defaultTema.id;
    }

    const anioInicio = new Date(fechaInicio).getFullYear();
    const anioFin = new Date(fechaFin).getFullYear();
    const mapaFeriados = {};

    for (let anio = anioInicio; anio <= anioFin; anio++) {
      try {
        const response = await axios.get(`https://api.argentinadatos.com/v1/feriados/${anio}`);
        if (response.data && Array.isArray(response.data)) {
          response.data.forEach(f => {
            mapaFeriados[f.fecha] = f.nombre;
          });
        }
      } catch (err) {
        console.warn(`Error fetching feriados for year ${anio}:`, err.message);
      }
    }

    const nuevasFechas = [];
    let actual = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    actual.setHours(12, 0, 0, 0);
    fin.setHours(12, 0, 0, 0);

    while (actual <= fin) {
      const diaSemana = actual.getDay();
      const configDia = diasCursada.find(d => d.dia === diaSemana || d.dia === (diaSemana === 0 ? 7 : diaSemana));

      if (configDia) {
        for (let i = 0; i < configDia.modulos; i++) {
          nuevasFechas.push(new Date(actual));
        }
      }
      actual.setDate(actual.getDate() + 1);
    }

    const N = nuevasFechas.length;
    const M = clasesActuales.length;
    const totalLoops = Math.max(N, M);

    for (let i = 0; i < totalLoops; i++) {
      if (i < N && i < M) {
        const clase = clasesActuales[i];
        const fechaObj = nuevasFechas[i];
        
        const yyyy = fechaObj.getFullYear();
        const mm = String(fechaObj.getMonth() + 1).padStart(2, '0');
        const dd = String(fechaObj.getDate()).padStart(2, '0');
        const fechaStr = `${yyyy}-${mm}-${dd}`;
        const nombreFeriado = mapaFeriados[fechaStr];

        if (nombreFeriado) {
          await prisma.clase.update({
            where: { id: clase.id },
            data: {
              fechaEstimada: fechaObj,
              titulo: `FERIADO: ${nombreFeriado}`,
              estado: 'CANCELADA',
              novedades: 'Día no laborable',
              orden: i + 1
            }
          });
        } else {
          const dataToUpdate = {
            fechaEstimada: fechaObj,
            orden: i + 1
          };
          if (clase.titulo.startsWith('FERIADO:')) {
            dataToUpdate.titulo = 'Módulo de clase';
            dataToUpdate.estado = 'planificada';
            dataToUpdate.novedades = null;
          }
          await prisma.clase.update({
            where: { id: clase.id },
            data: dataToUpdate
          });
        }
      } else if (i >= N) {
        const clase = clasesActuales[i];
        await prisma.clase.delete({
          where: { id: clase.id }
        });
      } else {
        const fechaObj = nuevasFechas[i];
        const yyyy = fechaObj.getFullYear();
        const mm = String(fechaObj.getMonth() + 1).padStart(2, '0');
        const dd = String(fechaObj.getDate()).padStart(2, '0');
        const fechaStr = `${yyyy}-${mm}-${dd}`;
        const nombreFeriado = mapaFeriados[fechaStr];

        if (nombreFeriado) {
          await prisma.clase.create({
            data: {
              temaId: ultimoTemaId,
              titulo: `FERIADO: ${nombreFeriado}`,
              fechaEstimada: fechaObj,
              modalidad: 'individual',
              estado: 'CANCELADA',
              novedades: 'Día no laborable',
              orden: i + 1
            }
          });
        } else {
          await prisma.clase.create({
            data: {
              temaId: ultimoTemaId,
              titulo: 'Módulo de clase',
              fechaEstimada: fechaObj,
              modalidad: 'individual',
              estado: 'planificada',
              orden: i + 1
            }
          });
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Fechas y clases actualizadas correctamente.' });
  } catch (error) {
    console.error('Error al modificar fechas del libro:', error);
    return res.status(500).json({ error: 'Error al modificar las fechas del libro de temas.' });
  }
};

const exportarPlanificacionWord = async (req, res) => {
  try {
    const { id } = req.params;

    const libroTema = await prisma.libroTema.findUnique({
      where: { id },
      include: {
        materia: {
          include: {
            usuario: true
          }
        },
        unidades: {
          orderBy: { orden: 'asc' },
          include: {
            temas: {
              orderBy: { orden: 'asc' },
              include: {
                clases: {
                  orderBy: { orden: 'asc' }
                }
              }
            }
          }
        }
      }
    });

    if (!libroTema) {
      return res.status(404).json({ error: 'Libro de temas no encontrado.' });
    }

    const { materia } = libroTema;
    const docente = materia.usuario?.nombreCompleto || 'Docente de Aula Kit';
    const institucion = 'Escuela Primaria de Córdoba';

    const unidadesFormateadas = libroTema.unidades.map(u => ({
      nombre: u.nombre,
      trimestre: u.trimestre === 'T1' ? 1 : (u.trimestre === 'T2' ? 2 : 3),
      semanas: u.semanasEstimadas || 4,
      aprendizaje_pda: u.aprendizajePda || '',
      capacidades_mcc: u.capacidadesMcc || [],
      temas: (u.temas || []).map(t => ({
        nombre: t.nombre,
        tipo: t.tipoContenido,
        clases: t.clasesEstimadas || 2,
        evaluacion: t.evaluacion
      }))
    }));

    const prompt = `Generá una planificación anual completa para entregar a directivos.
Datos del docente:
- Docente: ${docente}
- Institución: ${institucion}
- Materia: ${materia.nombre}
- Nivel: Primaria
- Grado: 4to grado
- Provincia: Córdoba

Unidades del año (en orden):
${JSON.stringify(unidadesFormateadas, null, 2)}

La planificación debe incluir en orden:
1. Encabezado institucional
2. Fundamentación de la materia para este nivel
3. Marco curricular (usar las Progresiones de Aprendizaje de curriculumcordoba.ar como marco principal (NO los NAP). Buscar el documento de ${materia.nombre} y citar aprendizajes esperados por unidad y meta de ciclo.)
4. Objetivos generales anuales (sintetizados de todas las unidades)
5. Tabla de distribución de contenidos por trimestre
6. Contenidos por unidad (conceptuales, procedimentales, actitudinales)
7. Estrategias didácticas generales previstas (Incluir las capacidades fundamentales del MCC en este punto)
8. Evaluación: criterios e instrumentos por trimestre
9. Tabla de distribución de clases por trimestre
10. Recursos y materiales generales
11. Bibliografía docente y para alumnos

Responde en formato Markdown estándar con los encabezados utilizando "#" y "##" y "###".`;

    const planTexto = await aiService.generarPlanificacionAnual(prompt);

    const docChildren = [];

    docChildren.push(
      new Paragraph({
        text: `PLANIFICACIÓN ANUAL DE LA MATERIA: ${materia.nombre.toUpperCase()}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 }
      })
    );

    const lines = planTexto.split('\n');

    lines.forEach(line => {
      const cleanLine = line.trim();
      if (!cleanLine) {
        return;
      }

      if (cleanLine.startsWith('# ')) {
        docChildren.push(
          new Paragraph({
            text: cleanLine.substring(2),
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 }
          })
        );
      } else if (cleanLine.startsWith('## ')) {
        docChildren.push(
          new Paragraph({
            text: cleanLine.substring(3),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 150, after: 80 }
          })
        );
      } else if (cleanLine.startsWith('### ')) {
        docChildren.push(
          new Paragraph({
            text: cleanLine.substring(4),
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 120, after: 60 }
          })
        );
      } else if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
        docChildren.push(
          new Paragraph({
            text: cleanLine.substring(2),
            bullet: { level: 0 },
            spacing: { after: 80 }
          })
        );
      } else {
        docChildren.push(
          new Paragraph({
            children: [new TextRun(cleanLine)],
            spacing: { after: 120 }
          })
        );
      }
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: docChildren
        }
      ]
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=Planificacion_Anual_${materia.nombre.replace(/\s+/g, '_')}.docx`);
    return res.send(buffer);
  } catch (error) {
    console.error('Error al exportar planificación a Word:', error);
    return res.status(500).json({ error: 'Error al generar el documento de planificación Word.' });
  }
};

module.exports = {
  modificarFechasLibro,
  generarLibroTemas,
  obtenerArbolLibroTemas,
  exportarPlanificacionWord,
  obtenerArbolPorMateria,
  guardarLibroDefinitivo,
  obtenerLibrosPorMateria,
  crearLibroTema,
  eliminarLibroTema,
  duplicarLibroTema,
  
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
