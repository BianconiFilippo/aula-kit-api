const express = require('express');
const router = express.Router();
const evaluacionController = require('../controllers/evaluacion.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const multer = require('multer');

// Configuración de multer en memoria para subida múltiple de entregas
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB por archivo
    files: 50 // hasta 50 exámenes de alumnos a la vez
  }
});

// Todas las rutas de evaluación requieren autenticación
router.use(authMiddleware);

// Middleware para atrapar errores de Multer
const uploadMultiple = (req, res, next) => {
  upload.array('archivos', 50)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Uno de los archivos supera el límite de 20MB.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Se supera el límite máximo de 50 archivos.' });
      }
      return res.status(400).json({ error: `Error de subida: ${err.message}` });
    } else if (err) {
      return res.status(500).json({ error: err.message });
    }
    next();
  });
};

router.post('/', uploadMultiple, evaluacionController.crearEvaluacion);
router.get('/materia/:materiaId', evaluacionController.obtenerPorMateria);
router.get('/:id', evaluacionController.obtenerPorId);

// Rutas de revisión, modificación y exportación
router.patch('/entregas/:entregaId', evaluacionController.actualizarEntrega);
router.post('/entregas/:entregaId/comentarios', evaluacionController.guardarComentario);
router.delete('/comentarios/:comentarioId', evaluacionController.eliminarComentario);
router.post('/entregas/:entregaId/recorregir', evaluacionController.recorregirEntrega);
router.post('/:id/exportar-pdf', evaluacionController.exportarInformePdf);

module.exports = router;
