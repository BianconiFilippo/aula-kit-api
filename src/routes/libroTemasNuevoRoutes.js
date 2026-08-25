const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const libroTemasController = require('../controllers/libro-temas.controller');
const authenticate = require('../middlewares/auth.middleware');

// Asegurar que estén autenticadas todas las llamadas
router.use(authenticate);

// --- Libros de Temas ---
router.get('/libros-temas/:id/arbol', libroTemasController.obtenerArbolLibroTemas);
router.get('/libro-temas/:materia_id/arbol', libroTemasController.obtenerArbolPorMateria);
router.post('/libros-temas/:id/guardar', libroTemasController.guardarLibroDefinitivo);
router.post('/libros-temas/:id/duplicar', libroTemasController.duplicarLibroTema);
router.delete('/libros-temas/:id', libroTemasController.eliminarLibroTema);
router.post('/libro-temas/generar', libroTemasController.generarLibroTemas);
router.post('/libro-temas/:materia_id/generar', libroTemasController.generarLibroTemas);
router.post('/libro-temas/generar-esqueleto', libroTemasController.generarEsqueletoClases);
router.post('/libro-temas/:materia_id/generar-esqueleto', libroTemasController.generarEsqueletoClases);
router.post('/libro-temas/completar-ia', upload.single('archivo'), libroTemasController.completarConIA);
router.post('/libro-temas/:materia_id/completar-ia', upload.single('archivo'), libroTemasController.completarConIA);
router.post('/libros-temas/:id/modificar-fechas', libroTemasController.modificarFechasLibro);
router.post('/libros-temas/:id/exportar-planificacion', libroTemasController.exportarPlanificacionWord);

// --- Unidades ---
router.post('/unidades', libroTemasController.crearUnidad);
router.put('/unidades/:id', libroTemasController.actualizarUnidad);
router.delete('/unidades/:id', libroTemasController.eliminarUnidad);

// --- Temas ---
router.post('/temas', libroTemasController.crearTema);
router.put('/temas/:id', libroTemasController.actualizarTema);
router.delete('/temas/:id', libroTemasController.eliminarTema);

// --- Clases (Modelo Plano Spreadsheet) ---
router.get('/libro-temas/:materia_id/clases', libroTemasController.obtenerClasesPorMateria);
router.patch('/libro-temas/clases/:id', libroTemasController.actualizarClaseParcial);

router.post('/clases', libroTemasController.crearClase);
router.put('/clases/:id', libroTemasController.actualizarClase);
router.delete('/clases/:id', libroTemasController.eliminarClase);

module.exports = router;
