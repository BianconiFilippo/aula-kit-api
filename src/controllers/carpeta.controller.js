const carpetaService = require('../services/carpetaService');

const crearCarpeta = async (req, res) => {
  const { id } = req.params; // materiaId
  const { nombre, parentId } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre de la carpeta es requerido' });
  }

  try {
    const carpeta = await carpetaService.crearCarpeta(id, nombre, parentId);
    return res.status(201).json(carpeta);
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo crear la carpeta', detalle: error.message });
  }
};

const renombrarCarpeta = async (req, res) => {
  const { carpetaId } = req.params;
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nuevo nombre es requerido' });
  }

  try {
    const carpeta = await carpetaService.renombrarCarpeta(carpetaId, nombre);
    return res.status(200).json(carpeta);
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo renombrar la carpeta', detalle: error.message });
  }
};

const eliminarCarpeta = async (req, res) => {
  const { carpetaId } = req.params;

  try {
    await carpetaService.eliminarCarpeta(carpetaId);
    return res.status(200).json({ mensaje: 'Carpeta eliminada correctamente' });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo eliminar la carpeta', detalle: error.message });
  }
};

module.exports = { crearCarpeta, renombrarCarpeta, eliminarCarpeta };
