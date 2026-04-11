const express = require('express');
const router = express.Router();
const materiaController = require('../controllers/materia.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

// Proteger todas las rutas de materias
router.use(authMiddleware);

router.post('/', materiaController.crearMateria);
router.get('/', materiaController.obtenerMaterias);
router.get('/:id', materiaController.obtenerMateria);
router.post('/:id/fuentes', upload.single('archivo'), materiaController.subirFuente);
router.delete('/:id', authMiddleware, materiaController.eliminarMateria);
router.delete('/:id/fuentes/:fuenteId', authMiddleware, materiaController.eliminarFuente);

module.exports = router;
