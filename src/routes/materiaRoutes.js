const express = require('express');
const router = express.Router();
const materiaController = require('../controllers/materiaController');
const authMiddleware = require('../middlewares/authMiddleware');

// Proteger todas las rutas de materias
router.use(authMiddleware);

router.post('/', materiaController.crearMateria);
router.get('/', materiaController.obtenerMaterias);

module.exports = router;
