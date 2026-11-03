"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluacionBaseSchema = void 0;
const zod_1 = require("zod");
exports.EvaluacionBaseSchema = zod_1.z.object({
    titulo: zod_1.z.string().min(1, 'El título es obligatorio'),
    consignas: zod_1.z.string().min(1, 'Las consignas son obligatorias'),
    criterios: zod_1.z.string().min(1, 'La rúbrica o criterios de corrección son obligatorios'),
    materiaId: zod_1.z.string().uuid('El ID de materia debe ser un UUID válido')
});
