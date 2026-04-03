const express = require('express');
const router = express.Router();
const materiaController = require('../controllers/materia.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Proteger todas las rutas de materias
router.use(authMiddleware);

router.post('/', materiaController.crearMateria);
router.get('/', materiaController.obtenerMaterias);

module.exports = router;
