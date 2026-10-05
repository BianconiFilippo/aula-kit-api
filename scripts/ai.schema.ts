import { z } from 'zod';

export const BloqueCurricularSchema = z.object({
  aprendizaje_y_contenido: z
    .string()
    .describe('El contenido formativo o aprendizaje específico redactado en el diseño curricular.'),
  indicadores_de_logro: z
    .array(z.string())
    .describe('Lista de indicadores de logro, evidencias o criterios formativos de evaluación asociados.'),
});

export const ProgresionCurricularSchema = z.object({
  nivel: z
    .string()
    .describe('Nivel educativo correspondiente (ej: Educación Inicial, Educación Primaria, Educación Secundaria).'),
  ciclo_grado: z
    .string()
    .describe('Ciclo, grado o sala correspondiente (ej: Sala de 3, Sala de 4, 1° Grado, 4° Año).'),
  espacio_curricular: z
    .string()
    .describe('Nombre del espacio curricular o asignatura (ej: Matemática, Ciencias Naturales, Lengua y Literatura).'),
  meta_proposito: z
    .string()
    .describe('Meta o propósito formativo general del grado o ciclo establecido en el marco curricular.'),
  bloques: z
    .array(BloqueCurricularSchema)
    .describe('Lista de bloques de aprendizaje y contenido con sus respectivos indicadores de logro.'),
});

export const CurriculoExtraccionResponseSchema = z.object({
  progresiones: z
    .array(ProgresionCurricularSchema)
    .describe('Conjunto estructurado de progresiones de aprendizaje extraídas del documento curricular.'),
});

export type BloqueCurricular = z.infer<typeof BloqueCurricularSchema>;
export type ProgresionCurricular = z.infer<typeof ProgresionCurricularSchema>;
export type CurriculoExtraccionResponse = z.infer<typeof CurriculoExtraccionResponseSchema>;
