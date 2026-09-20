const { z } = require('zod');

// Esquema para cada momento didáctico de una clase dentro de la secuencia
const MomentoSecuenciaSchema = z.object({
  tiempo_minutos: z.number().int().positive().describe('Tiempo estimado en minutos para este momento'),
  nota_para_docente: z.string().min(1).describe('Orientación metodológica y pedagógica exclusiva para el docente'),
  consigna_literal_alumno: z.string().min(1).describe('Consigna explícita, literal y detallada para el alumno')
});

const MomentosClaseSecuenciaSchema = z.object({
  inicio: MomentoSecuenciaSchema,
  desarrollo: MomentoSecuenciaSchema,
  cierre: MomentoSecuenciaSchema
});

// Esquema de cada clase que compone la secuencia didáctica
const ClaseSecuenciaSchema = z.object({
  numero: z.number().int().positive().describe('Número correlativo de clase en la secuencia (ej. 1, 2, 3...)'),
  titulo: z.string().min(1).describe('Título pedagógico y motivador de la clase'),
  duracion_minutos: z.number().int().positive().describe('Duración total de la clase en minutos (ej. 80)'),
  objetivo: z.string().min(1).describe('Objetivo de aprendizaje específico de esta clase'),
  momentos: MomentosClaseSecuenciaSchema
});

// Esquema para ítems de rúbrica de evaluación analítica
const RubricaItemSchema = z.object({
  criterio: z.string().min(1).describe('Criterio o dimensión a evaluar en la secuencia'),
  nivel_destacado: z.string().min(1).describe('Descriptor para desempeño destacado / avanzado'),
  nivel_logrado: z.string().min(1).describe('Descriptor para desempeño logrado / satisfactorio'),
  nivel_en_proceso: z.string().min(1).describe('Descriptor para desempeño en proceso / a fortalecer')
});

// Esquema del dispositivo integral de evaluación
const EvaluacionSecuenciaSchema = z.object({
  diagnostica: z.string().min(1).describe('Estrategia e instrumentos de evaluación inicial / diagnóstica'),
  formativa: z.string().min(1).describe('Estrategia de evaluación procesual, retroalimentación y seguimiento formativo'),
  final: z.string().min(1).describe('Estrategia de evaluación integradora / sumativa final o producto final'),
  rubricas: z.array(RubricaItemSchema).min(1).describe('Array de matrices de rúbricas analíticas para valorar los aprendizajes')
});

// Esquema Base de la Secuencia Didáctica para OpenAI Structured Outputs
const SecuenciaDidacticaBaseSchema = z.object({
  titulo: z.string().min(1).describe('Título general y atractivo de la secuencia didáctica'),
  espacio_curricular: z.string().min(1).describe('Nombre del espacio curricular, asignatura o materia'),
  curso: z.string().min(1).describe('Año, grado o curso destinatario'),
  tema: z.string().min(1).describe('Tema o núcleo problemático abordado'),
  cantidad_clases: z.number().int().positive().describe('Cantidad total de clases planificadas en la secuencia'),
  fundamentacion: z.string().min(1).describe('Fundamentación pedagógica, relevancia didáctica y contextualización'),
  objetivos: z.array(z.string().min(1)).min(1).describe('Objetivos de aprendizaje de la secuencia didáctica'),
  capacidades: z.array(z.string().min(1)).min(1).describe('Capacidades fundamentales o competencias priorizadas a desarrollar'),
  clases: z.array(ClaseSecuenciaSchema).min(1).describe('Listado correlativo de todas las clases que conforman la secuencia didáctica'),
  evaluacion: EvaluacionSecuenciaSchema
});

// Esquema con validaciones lógicas adicionales
const SecuenciaDidacticaSchema = SecuenciaDidacticaBaseSchema.refine(
  (data) => data.clases.length === data.cantidad_clases,
  {
    message: 'La cantidad de elementos en el array "clases" debe coincidir con "cantidad_clases"',
    path: ['clases']
  }
);

module.exports = {
  MomentoSecuenciaSchema,
  MomentosClaseSecuenciaSchema,
  ClaseSecuenciaSchema,
  RubricaItemSchema,
  EvaluacionSecuenciaSchema,
  SecuenciaDidacticaBaseSchema,
  SecuenciaDidacticaSchema
};
