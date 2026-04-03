const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const materiaRoutes = require('./materia.routes');

router.use('/auth', authRoutes);
router.use('/materias', materiaRoutes);

module.exports = router;
