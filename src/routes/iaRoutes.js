const express = require('express');
const router = express.Router();
const iaController = require('../controllers/ia.controller');
const authenticate = require('../middlewares/auth.middleware');

// Proteger todas las llamadas de IA
router.use(authenticate);

router.post('/sugerir-unidad', iaController.sugerirUnidad);
router.post('/sugerir-tema', iaController.sugerirTema);
router.post('/sugerir-pda', iaController.sugerirPda);
router.post('/sugerir-objetivos', iaController.sugerirObjetivos);
router.post('/sugerir-indicador-logro', iaController.sugerirIndicadorLogro);
router.post('/generar-imagen-dalle', iaController.generarImagenDalle);

module.exports = router;
