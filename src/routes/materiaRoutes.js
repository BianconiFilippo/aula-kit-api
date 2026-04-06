const express = require('express');
const router = express.Router();
const materiaController = require('../controllers/materiaController');
const authMiddleware = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/upload.middleware');

// Proteger todas las rutas de materias
router.use(authMiddleware);

router.post('/', materiaController.crearMateria);
router.get('/', materiaController.obtenerMaterias);
router.post('/:id/fuentes', authMiddleware, upload.single('archivo'), materiaController.subirFuente);

module.exports = router;
