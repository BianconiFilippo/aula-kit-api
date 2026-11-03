const { z } = require('zod');

const LayoutTypeEnum = z.enum([
  'hero',
  'split_image_text',
  'grid_3',
  'compare_2',
  'timeline_steps',
  'quote',
  'statement',
  // Retrocompatibilidad con esquemas previos
  'debate',
  'lectura',
  'actividad',
  'resumen'
]);

const ThemeEnum = z.enum([
  'dark',
  'light',
  'primary'
]);

const CompareColumnSchema = z.object({
  titulo: z.string().optional(),
  items: z.array(z.string()).optional(),
  descripcion: z.string().optional()
});

const StepItemSchema = z.object({
  paso: z.union([z.number(), z.string()]).optional(),
  titulo: z.string(),
  descripcion: z.string().optional()
});

const ContentSchema = z.object({
  kicker: z.string().optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  items: z.array(z.string()).optional(),
  imagePrompt: z.string().optional(),
  imageUrl: z.string().optional(),
  url: z.string().optional(),
  // Soporte para compare_2
  lado_a: CompareColumnSchema.optional(),
  lado_b: CompareColumnSchema.optional(),
  // Soporte para timeline_steps
  pasos: z.array(StepItemSchema).optional()
});

const SlideSchema = z.object({
  layoutType: LayoutTypeEnum,
  theme: ThemeEnum.default('light'),
  content: ContentSchema,
  notas_docente: z.string().optional(),
  speakerNotes: z.string().optional()
});

const PresentacionSchema = z.object({
  titulo_presentacion: z.string(),
  diapositivas: z.array(SlideSchema).min(1)
});

module.exports = {
  LayoutTypeEnum,
  ThemeEnum,
  CompareColumnSchema,
  StepItemSchema,
  ContentSchema,
  SlideSchema,
  PresentacionSchema
};

