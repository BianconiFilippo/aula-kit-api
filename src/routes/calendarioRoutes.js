const express = require('express');
const router = express.Router();
const calendarioController = require('../controllers/calendario.controller');
const authenticate = require('../middlewares/auth.middleware');

// Todas las rutas de calendario requieren autenticación
router.use(authenticate);

// Obtener todos los eventos (clases y recordatorios)
router.get('/eventos', calendarioController.obtenerEventosCalendario);

// CRUD de Recordatorios
router.post('/recordatorios', calendarioController.crearRecordatorio);
router.put('/recordatorios/:id', calendarioController.actualizarRecordatorio);
router.delete('/recordatorios/:id', calendarioController.eliminarRecordatorio);

module.exports = router;
