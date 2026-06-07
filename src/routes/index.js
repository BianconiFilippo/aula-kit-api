const express = require('express');
const router = express.Router();
const axios = require('axios');
const authRoutes = require('./authRoutes');
const materiaRoutes = require('./materiaRoutes');
const authenticate = require('../middlewares/auth.middleware');
const imagenController = require('../controllers/imagen.controller');
const libroTemasNuevoRoutes = require('./libroTemasNuevoRoutes');
const iaRoutes = require('./iaRoutes');

router.use('/auth', authRoutes);
router.use('/materias', authenticate, materiaRoutes);
router.use('/', libroTemasNuevoRoutes);
router.use('/ia', iaRoutes);
router.get('/imagenes/buscar', authenticate, imagenController.buscarImagen);



router.get('/feriados/:anio', async (req, res) => {
  try {
    const { anio } = req.params;
    const response = await axios.get(`https://api.argentinadatos.com/v1/feriados/${anio}`);
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error al consultar feriados:', error.message);
    res.status(500).json({ error: 'Error al consultar feriados desde la API externa' });
  }
});

module.exports = router;
