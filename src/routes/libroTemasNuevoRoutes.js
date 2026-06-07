const express = require('express');
const router = express.Router();
const libroTemasController = require('../controllers/libro-temas.controller');
const authenticate = require('../middlewares/auth.middleware');

// Asegurar que estén autenticadas todas las llamadas
router.use(authenticate);

// --- Unidades ---
router.post('/unidades', libroTemasController.crearUnidad);
router.put('/unidades/:id', libroTemasController.actualizarUnidad);
router.delete('/unidades/:id', libroTemasController.eliminarUnidad);

// --- Temas ---
router.post('/temas', libroTemasController.crearTema);
router.put('/temas/:id', libroTemasController.actualizarTema);
router.delete('/temas/:id', libroTemasController.eliminarTema);

// --- Clases ---
router.post('/clases', libroTemasController.crearClase);
router.put('/clases/:id', libroTemasController.actualizarClase);
router.delete('/clases/:id', libroTemasController.eliminarClase);

module.exports = router;
