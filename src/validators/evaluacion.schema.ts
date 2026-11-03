import { z } from 'zod';

export const EvaluacionBaseSchema = z.object({
  titulo: z.string().min(1, 'El título es obligatorio'),
  consignas: z.string().min(1, 'Las consignas son obligatorias'),
  criterios: z.string().min(1, 'La rúbrica o criterios de corrección son obligatorios'),
  materiaId: z.string().uuid('El ID de materia debe ser un UUID válido')
});

export type EvaluacionBaseInput = z.infer<typeof EvaluacionBaseSchema>;
