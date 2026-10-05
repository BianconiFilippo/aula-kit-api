import { z } from 'zod';

// ==========================================
// 1. USUARIO & AUTENTICACIÓN
// ==========================================
export const PlanActualEnum = z.enum(['gratis', 'premium']);
export const TierEnum = z.enum(['free', 'pro', 'premium']);

export const UsuarioSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  nombreCompleto: z.string().nullable().optional(),
  planActual: z.string().default('gratis'),
  tier: TierEnum.default('free'),
  peticiones_ia_restantes: z.number().int().default(3),
  fecha_ultimo_reinicio: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime().optional()
});

export const UserMetadataSchema = z.record(z.string(), z.unknown());

export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  nombreCompleto: z.string(),
  role: z.string().optional(),
  tier: TierEnum.optional(),
  peticiones_ia_restantes: z.number().optional(),
  user_metadata: UserMetadataSchema.optional()
});

export const AuthSessionSchema = z.object({
  access_token: z.string(),
  token_type: z.string().default('bearer'),
  expires_in: z.number().optional(),
  expires_at: z.number().optional(),
  refresh_token: z.string(),
  user: AuthUserSchema
});

export const AuthResponseSchema = z.object({
  mensaje: z.string().optional(),
  session: AuthSessionSchema
});

export const LoginCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const RegisterDataSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
  nombreCompleto: z.string().min(1)
});

export const PerfilUsuarioSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  nombreCompleto: z.string().nullable().optional(),
  planActual: z.string(),
  tier: TierEnum,
  peticiones_ia_restantes: z.number().int(),
  fecha_ultimo_reinicio: z.string().nullable().optional()
});

// ==========================================
// 2. MATERIA, CARPETA & FUENTE
// ==========================================
export const TipoContenidoFuenteEnum = z.enum(['PDF', 'IMAGEN', 'VIDEO', 'PRESENTACION', 'LINK_DRIVE', 'TEXTO_PLANO']);

export const CarpetaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  materiaId: z.string(),
  parentId: z.string().nullable(),
  createdAt: z.string().optional()
});

export const FuenteContenidoSchema = z.object({
  id: z.string(),
  materiaId: z.string(),
  carpetaId: z.string().nullable().optional(),
  tipo: TipoContenidoFuenteEnum,
  urlArchivo: z.string().nullable().optional(),
  nombreArchivo: z.string(),
  textoExtraido: z.string().nullable().optional(),
  createdAt: z.string().optional()
});

export const MateriaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  name: z.string().optional(),
  nivel: z.string().nullable().optional(),
  grado: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  usuarioId: z.string().optional(),
  userId: z.string().optional(),
  fuentes: z.array(FuenteContenidoSchema).optional().default([]),
  carpetas: z.array(CarpetaSchema).optional().default([]),
  createdAt: z.string().optional()
});

export const CreateMateriaPayloadSchema = z.object({
  nombre: z.string().min(1),
  name: z.string().optional(),
  nivel: z.string().nullable().optional(),
  grado: z.string().nullable().optional()
});

// ==========================================
// 3. GENERACIÓN DE RECURSOS (RESUMEN, CLASE, PRESENTACIÓN, SECUENCIA)
// ==========================================
export const TipoRecursoEnum = z.enum([
  'RESUMEN',
  'GUIA_ESTUDIO',
  'EVALUACION',
  'MAPA_CONCEPTUAL',
  'CLASE',
  'PRESENTACION',
  'SECUENCIA_DIDACTICA',
  'SECUENCIA'
]);

export const BloqueResumenSchema = z.object({
  tipo: z.enum(['parrafo', 'subseccion', 'lista', 'imagen_ai', 'imagen']),
  contenido: z.string(),
  items: z.array(z.string()).optional()
});

export const SeccionResumenSchema = z.object({
  titulo_seccion: z.string(),
  bloques: z.array(BloqueResumenSchema)
});

export const ResumenSchema = z.object({
  titulo_resumen: z.string(),
  secciones: z.array(SeccionResumenSchema).optional(),
  // Campos complementarios UI / editor enriquecido
  titulo_principal: z.string().optional(),
  html_content: z.string().optional(),
  conceptos_clave: z.array(z.string()).optional(),
  actividades_sugeridas: z.array(z.string()).optional()
});

// Clase Pedagógica en 3 momentos
export const MomentoDetalleSchema = z.object({
  tiempo_minutos: z.number(),
  nota_para_docente: z.string(),
  consigna_literal_alumno: z.string(),
  registro_carpeta_tarea: z.string().optional()
});

export const ClaseMomentosSchema = z.object({
  inicio: MomentoDetalleSchema,
  desarrollo: MomentoDetalleSchema,
  cierre: MomentoDetalleSchema
});

export const ClaseGeneradaSchema = z.object({
  titulo: z.string().optional(),
  titulo_clase: z.string().optional(),
  duracion_minutos: z.number().optional(),
  objetivo_clase: z.string().optional(),
  recursos_necesarios: z.array(z.string()).optional(),
  momentos: ClaseMomentosSchema.optional(),
  evidencia_aprendizaje: z.string().optional(),
  // Retrocompatibilidad
  paso_1_debate: z.object({ pregunta_disparadora: z.string(), contexto_debate: z.string() }).optional(),
  paso_2_contenido: z.array(z.object({ subtitulo: z.string(), parrafo: z.string() })).optional(),
  paso_3_evaluacion: z.array(z.string()).optional()
});

// Presentación / Diapositivas
export const SlideContentSchema = z.object({
  kicker: z.string().optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  items: z.array(z.string()).optional(),
  imagePrompt: z.string().optional(),
  imageUrl: z.string().optional()
});

export const SlideSchema = z.object({
  layoutType: z.enum(['hero', 'split_image_text', 'grid_3', 'quote', 'statement', 'debate', 'lectura', 'actividad', 'resumen']),
  theme: z.enum(['dark', 'light', 'primary']).default('light'),
  content: SlideContentSchema
});

export const PresentacionSchema = z.object({
  titulo_presentacion: z.string(),
  diapositivas: z.array(SlideSchema)
});

// Secuencia Didáctica
export const RubricaItemSchema = z.object({
  criterio: z.string(),
  nivel_destacado: z.string(),
  nivel_logrado: z.string(),
  nivel_en_proceso: z.string()
});

export const EvaluacionSecuenciaSchema = z.object({
  diagnostica: z.string(),
  formativa: z.string(),
  final: z.string(),
  rubricas: z.array(RubricaItemSchema)
});

export const ClaseSecuenciaItemSchema = z.object({
  numero: z.number(),
  titulo: z.string(),
  duracion_minutos: z.number(),
  objetivo: z.string(),
  momentos: z.object({
    inicio: MomentoDetalleSchema,
    desarrollo: MomentoDetalleSchema,
    cierre: MomentoDetalleSchema
  })
});

export const SecuenciaDidacticaSchema = z.object({
  titulo: z.string(),
  espacio_curricular: z.string(),
  curso: z.string(),
  tema: z.string(),
  cantidad_clases: z.number(),
  fundamentacion: z.string(),
  objetivos: z.array(z.string()),
  capacidades: z.array(z.string()),
  clases: z.array(ClaseSecuenciaItemSchema),
  evaluacion: EvaluacionSecuenciaSchema
});

// Entidad DB GeneracionRecurso
export const GeneracionRecursoSchema = z.object({
  id: z.string(),
  materiaId: z.string(),
  tipo: TipoRecursoEnum,
  titulo: z.string(),
  contenido: z.string(), // Contenido JSON serializado o HTML
  fuenteContenidoId: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export const RecursoPayloadSchema = z.object({
  materiaId: z.string(),
  tipo: TipoRecursoEnum,
  titulo: z.string(),
  contenido: z.string()
});

// ==========================================
// 4. LIBRO DE TEMAS & CLASES (SPREADSHEET)
// ==========================================
export const EstadoClaseEnum = z.enum(['Planificada', 'Completada', 'Suspendida', 'planificada', 'dada', 'cancelada', 'postergada', 'CANCELADA']);

export const ClaseSpreadsheetSchema = z.object({
  id: z.string(),
  materiaId: z.string().optional(),
  materiaNombre: z.string().nullable().optional(),
  fecha: z.string().nullable().optional(),
  numeroClase: z.number().nullable().optional(),
  unidad: z.string().nullable().optional(),
  caracteristicaClase: z.string().nullable().optional(),
  temaDia: z.string().nullable().optional(),
  actividadesPropuestas: z.string().nullable().optional(),
  novedades: z.string().nullable().optional(),
  estado: EstadoClaseEnum.default('Planificada'),
  color: z.string().nullable().optional(),
  tipo: z.literal('clase').optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export const RecordatorioSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  contenido: z.string().nullable().optional(),
  fecha: z.string(),
  color: z.string().default('blue'),
  tipo: z.literal('recordatorio').optional(),
  usuarioId: z.string().optional(),
  materiaId: z.string().nullable().optional(),
  materiaNombre: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export const EventosCalendarioResponseSchema = z.object({
  success: z.boolean(),
  clases: z.array(ClaseSpreadsheetSchema),
  recordatorios: z.array(RecordatorioSchema)
});

export const LibroTemaArbolSchema = z.object({
  id: z.string(),
  materiaId: z.string(),
  cicloLectivo: z.number().optional(),
  cursoDivision: z.string().optional(),
  unidades: z.array(z.record(z.string(), z.unknown())).optional()
});

// ==========================================
// 5. INFERENCIA DE TIPOS TYPESCRIPT
// ==========================================
export type Usuario = z.infer<typeof UsuarioSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type AuthSession = z.infer<typeof AuthSessionSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;
export type RegisterData = z.infer<typeof RegisterDataSchema>;
export type PerfilUsuario = z.infer<typeof PerfilUsuarioSchema>;

export type Carpeta = z.infer<typeof CarpetaSchema>;
export type FuenteContenido = z.infer<typeof FuenteContenidoSchema>;
export type Materia = z.infer<typeof MateriaSchema>;
export type CreateMateriaPayload = z.infer<typeof CreateMateriaPayloadSchema>;

export type TipoRecurso = z.infer<typeof TipoRecursoEnum>;
export type BloqueResumen = z.infer<typeof BloqueResumenSchema>;
export type SeccionResumen = z.infer<typeof SeccionResumenSchema>;
export type Resumen = z.infer<typeof ResumenSchema>;

export type MomentoDetalle = z.infer<typeof MomentoDetalleSchema>;
export type ClaseMomentos = z.infer<typeof ClaseMomentosSchema>;
export type ClaseGenerada = z.infer<typeof ClaseGeneradaSchema>;

export type SlideContent = z.infer<typeof SlideContentSchema>;
export type Slide = z.infer<typeof SlideSchema>;
export type Presentacion = z.infer<typeof PresentacionSchema>;

export type RubricaItem = z.infer<typeof RubricaItemSchema>;
export type EvaluacionSecuencia = z.infer<typeof EvaluacionSecuenciaSchema>;
export type ClaseSecuenciaItem = z.infer<typeof ClaseSecuenciaItemSchema>;
export type SecuenciaDidactica = z.infer<typeof SecuenciaDidacticaSchema>;

export type GeneracionRecurso = z.infer<typeof GeneracionRecursoSchema>;
export type RecursoPayload = z.infer<typeof RecursoPayloadSchema>;

export type EstadoClase = z.infer<typeof EstadoClaseEnum>;
export type ClaseSpreadsheet = z.infer<typeof ClaseSpreadsheetSchema>;
export type Recordatorio = z.infer<typeof RecordatorioSchema>;
export type EventosCalendarioResponse = z.infer<typeof EventosCalendarioResponseSchema>;
export type LibroTemaArbol = z.infer<typeof LibroTemaArbolSchema>;
