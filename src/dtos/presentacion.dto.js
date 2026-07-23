const { z } = require('zod');

const LayoutTypeEnum = z.enum([
  'hero',
  'split_image_text',
  'grid_3',
  'quote',
  'statement'
]);

const ThemeEnum = z.enum([
  'dark',
  'light',
  'primary'
]);

const ContentSchema = z.object({
  kicker: z.string().optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  items: z.array(z.string()).optional(),
  imagePrompt: z.string().optional()
});

const SlideSchema = z.object({
  layoutType: LayoutTypeEnum,
  theme: ThemeEnum,
  content: ContentSchema
});

const PresentacionSchema = z.object({
  titulo_presentacion: z.string(),
  diapositivas: z.array(SlideSchema).min(1)
});

module.exports = {
  LayoutTypeEnum,
  ThemeEnum,
  ContentSchema,
  SlideSchema,
  PresentacionSchema
};
