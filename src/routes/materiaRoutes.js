const express = require('express');
const router = express.Router();
const materiaController = require('../controllers/materia.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const carpetaController = require('../controllers/carpeta.controller');
const multer = require('multer');
const libroTemasController = require('../controllers/libroTemas.controller');
const recursoController = require('../controllers/recurso.controller');

// Proteger todas las rutas de materias
router.use(authMiddleware);

router.post('/', materiaController.crearMateria);
router.get('/', materiaController.obtenerMaterias);
router.get('/:id', materiaController.obtenerMateria);
router.post('/:id/fuentes', (req, res, next) => {
  upload.single('archivo')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'El archivo supera el límite permitido (50MB)' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: err.message });
    }
    next();
  });
}, materiaController.subirFuente);
router.delete('/:id', authMiddleware, materiaController.eliminarMateria);
router.delete('/:id/fuentes/:fuenteId', authMiddleware, materiaController.eliminarFuente);
router.get('/:id/fuentes', materiaController.getFuentesMateria);

// Rutas de carpetas
router.post('/:id/carpetas', authMiddleware, carpetaController.crearCarpeta);
router.patch('/:id/carpetas/:carpetaId', authMiddleware, carpetaController.renombrarCarpeta);
router.delete('/:id/carpetas/:carpetaId', authMiddleware, carpetaController.eliminarCarpeta);

// Rutas AI 
router.post('/:id/generar-resumen', recursoController.generarResumen);

// Rutas Libro Temas
router.get('/:id/libro-temas', libroTemasController.getLibroTemasDeMateria);
router.post('/:id/libro-temas/generar', libroTemasController.generarLibroTemas);
router.post('/:id/libro-temas/guardar', authMiddleware, libroTemasController.guardarLibroDefinitivo);
router.put('/:id/libro-temas/:claseId', authMiddleware, libroTemasController.actualizarClase);

// Rutas de Recursos (Generados por IA)
router.get('/:id/recursos', recursoController.obtenerRecursosPorMateria);
router.post('/:id/recursos', recursoController.guardarRecurso);
router.get('/:id/recursos/:recursoId', recursoController.obtenerRecursoPorId);
router.put('/:id/recursos/:recursoId', recursoController.actualizarRecurso);


module.exports = router;

