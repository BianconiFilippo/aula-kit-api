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

module.exports = {
  generarLibroTemas,
  getLibroTemasDeMateria
};