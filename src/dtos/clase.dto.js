const { z } = require('zod');

const MomentoInicioSchema = z.object({
  tiempo_minutos: z.number().int().positive().describe('Tiempo en minutos asignado para el inicio de la clase'),
  nota_para_docente: z.string().min(1).describe('Qué debe hacer/explicar el docente para motivar y activar conocimientos previos'),
  consigna_literal_alumno: z.string().min(1).describe('Las palabras exactas o preguntas a dictar o decir al alumno')
});

const MomentoDesarrolloSchema = z.object({
  tiempo_minutos: z.number().int().positive().describe('Tiempo en minutos asignado para el desarrollo de la clase'),
  nota_para_docente: z.string().min(1).describe('Guía de mediación pedagógica, profundización conceptual y monitoreo para el docente'),
  consigna_literal_alumno: z.string().min(1).describe('Consigna explícita y detallada para el alumno. Prohibido usar descripciones genéricas como "hacer puesta en común"')
});

const MomentoCierreSchema = z.object({
  tiempo_minutos: z.number().int().positive().describe('Tiempo en minutos asignado para el cierre de la clase'),
  nota_para_docente: z.string().min(1).describe('Cómo evaluar formativamente el cierre y verificar la comprensión alcanzada'),
  consigna_literal_alumno: z.string().min(1).describe('Consigna o pregunta de metacognición/cierre para los alumnos'),
  registro_carpeta_tarea: z.string().min(1).describe('Síntesis exacta para registrar en la carpeta del estudiante o tarea asignada')
});

const MomentosClaseSchema = z.object({
  inicio: MomentoInicioSchema,
  desarrollo: MomentoDesarrolloSchema,
  cierre: MomentoCierreSchema
});

// Esquema base sin refine (usado por OpenAI Structured Outputs vía zodResponseFormat)
const ClaseBaseSchema = z.object({
  titulo: z.string().min(1).describe('Título pedagógico y motivador de la clase'),
  duracion_minutos: z.number().int().positive().describe('Duración total de la clase en minutos (debe ser la suma exacta de los minutos de inicio, desarrollo y cierre)'),
  objetivo_clase: z.string().min(1).describe('Objetivo pedagógico claro, observable y medible'),
  recursos_necesarios: z.array(z.string().min(1)).min(1).describe('Lista de recursos, materiales y herramientas necesarias'),
  momentos: MomentosClaseSchema,
  evidencia_aprendizaje: z.string().min(1).describe('Criterio o producto observable que demuestra el aprendizaje logrado')
});

// Esquema estricto con validación de suma de tiempos
const ClaseSchema = ClaseBaseSchema.refine(
  (data) => {
    const sumaMomentos =
      data.momentos.inicio.tiempo_minutos +
      data.momentos.desarrollo.tiempo_minutos +
      data.momentos.cierre.tiempo_minutos;
    return sumaMomentos === data.duracion_minutos;
  },
  {
    message: 'La suma de tiempo_minutos de inicio, desarrollo y cierre debe ser exactamente igual a duracion_minutos',
    path: ['duracion_minutos']
  }
);

module.exports = {
  MomentoInicioSchema,
  MomentoDesarrolloSchema,
  MomentoCierreSchema,
  MomentosClaseSchema,
  ClaseBaseSchema,
  ClaseSchema
};
