const prisma = require('../services/db.js');
const libroTemasService = require('../services/libroService');

const generarLibroTemas = async (req, res) => {
  try {
    const materiaId = req.params.id;
    const { fuenteIds, configFechas, instruccionesExtra } = req.body;

    if (!configFechas || !configFechas.fechaInicio || !configFechas.fechaFin || !configFechas.diasCursada) {
      return res.status(400).json({ error: 'Faltan datos en la configuración de fechas.' });
    }
    const resultado = await libroTemasService.generarLibroTemasIA(
      materiaId, 
      fuenteIds, 
      configFechas, 
      instruccionesExtra
    );

    return res.status(200).json({ success: true, data: resultado });
  } catch (error) {
    console.error('Error al generar libro de temas:', error);
    return res.status(500).json({ error: 'Error interno al generar el libro de temas.' });
  }
};

const getLibroTemasDeMateria = async (req, res) => {
  try {
    const materiaId = req.params.id;

    const temas = await prisma.registroLibroTema.findMany({
      where: { materiaId: materiaId },
      orderBy: { orden: 'asc' }
    });

    return res.status(200).json({ data: temas });
  } catch (error) {
    console.error('Error al obtener el libro de temas:', error);
    return res.status(500).json({ error: 'Error al cargar el libro de temas.' });
  }
};
const guardarLibroDefinitivo = async (req, res) => {
    try {
        const materiaId = req.params.id;
        const { clases } = req.body;

        if (!clases || !Array.isArray(clases)) {
            return res.status(400).json({ error: "No se enviaron las clases para guardar." });
        }

        await prisma.registroLibroTema.deleteMany({
            where: { materiaId: materiaId }
        });
        const registrosAInsertar = clases.map(clase => ({
            materiaId: materiaId,
            orden: clase.orden,
            fecha: new Date(clase.fecha), 
            titulo: clase.titulo || "",
            actividades: clase.actividades || null, 
            estado: clase.estado || "PENDIENTE",
            unidad: clase.unidad || null,
            caracter: clase.caracter || null,
            observaciones: clase.observaciones || null
        }));
        const resultado = await prisma.registroLibroTema.createMany({
            data: registrosAInsertar
        });

        return res.status(201).json({ success: true, count: resultado.count });
    } catch (error) {
        console.error("Error al guardar el libro definitivo:", error);
        return res.status(500).json({ error: "Error interno al guardar los datos."});
    }
}

const actualizarClase = async (req, res) => {
    try {
        const { claseId } = req.params;
        const { unidad, caracter, estado, titulo, actividades, observaciones } = req.body;

        const actualizada = await prisma.registroLibroTema.update({
            where: { id: claseId },
            data: {
                unidad,
                caracter,
                estado,
                titulo,
                actividades,
                observaciones
            }
        });

        return res.status(200).json({ success: true, data: actualizada });
    } catch (error) {
        console.error("Error al actualizar la clase:", error);
        return res.status(500).json({ error: "Error interno al actualizar la clase." });
    }
};

module.exports = {
  generarLibroTemas,
  getLibroTemasDeMateria,
  guardarLibroDefinitivo,
  actualizarClase
};