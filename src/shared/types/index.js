"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateEvaluacionPayloadSchema = exports.EvaluacionBaseSchema = exports.EntregaAlumnoSchema = exports.ComentarioIASchema = exports.LibroTemaArbolSchema = exports.EventosCalendarioResponseSchema = exports.RecordatorioSchema = exports.ClaseSpreadsheetSchema = exports.EstadoClaseEnum = exports.RecursoPayloadSchema = exports.GeneracionRecursoSchema = exports.SecuenciaDidacticaSchema = exports.ClaseSecuenciaItemSchema = exports.EvaluacionSecuenciaSchema = exports.RubricaItemSchema = exports.PresentacionSchema = exports.SlideSchema = exports.SlideContentSchema = exports.ClaseGeneradaSchema = exports.ClaseMomentosSchema = exports.MomentoDetalleSchema = exports.ResumenSchema = exports.SeccionResumenSchema = exports.BloqueResumenSchema = exports.TipoRecursoEnum = exports.CreateMateriaPayloadSchema = exports.MateriaSchema = exports.FuenteContenidoSchema = exports.CarpetaSchema = exports.TipoContenidoFuenteEnum = exports.PerfilUsuarioSchema = exports.RegisterDataSchema = exports.LoginCredentialsSchema = exports.AuthResponseSchema = exports.AuthSessionSchema = exports.AuthUserSchema = exports.UserMetadataSchema = exports.UsuarioSchema = exports.TierEnum = exports.PlanActualEnum = void 0;
const zod_1 = require("zod");
// ==========================================
// 1. USUARIO & AUTENTICACIÓN
// ==========================================
exports.PlanActualEnum = zod_1.z.enum(['gratis', 'premium']);
exports.TierEnum = zod_1.z.enum(['free', 'pro', 'premium']);
exports.UsuarioSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    nombreCompleto: zod_1.z.string().nullable().optional(),
    planActual: zod_1.z.string().default('gratis'),
    tier: exports.TierEnum.default('free'),
    peticiones_ia_restantes: zod_1.z.number().int().default(3),
    fecha_ultimo_reinicio: zod_1.z.string().datetime().nullable().optional(),
    createdAt: zod_1.z.string().datetime().optional()
});
exports.UserMetadataSchema = zod_1.z.record(zod_1.z.string(), zod_1.z.unknown());
exports.AuthUserSchema = zod_1.z.object({
    id: zod_1.z.string(),
    email: zod_1.z.string().email(),
    nombreCompleto: zod_1.z.string(),
    role: zod_1.z.string().optional(),
    tier: exports.TierEnum.optional(),
    peticiones_ia_restantes: zod_1.z.number().optional(),
    user_metadata: exports.UserMetadataSchema.optional()
});
exports.AuthSessionSchema = zod_1.z.object({
    access_token: zod_1.z.string(),
    token_type: zod_1.z.string().default('bearer'),
    expires_in: zod_1.z.number().optional(),
    expires_at: zod_1.z.number().optional(),
    refresh_token: zod_1.z.string(),
    user: exports.AuthUserSchema
});
exports.AuthResponseSchema = zod_1.z.object({
    mensaje: zod_1.z.string().optional(),
    session: exports.AuthSessionSchema
});
exports.LoginCredentialsSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1)
});
exports.RegisterDataSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(4),
    nombreCompleto: zod_1.z.string().min(1)
});
exports.PerfilUsuarioSchema = zod_1.z.object({
    id: zod_1.z.string(),
    email: zod_1.z.string().email(),
    nombreCompleto: zod_1.z.string().nullable().optional(),
    planActual: zod_1.z.string(),
    tier: exports.TierEnum,
    peticiones_ia_restantes: zod_1.z.number().int(),
    fecha_ultimo_reinicio: zod_1.z.string().nullable().optional()
});
// ==========================================
// 2. MATERIA, CARPETA & FUENTE
// ==========================================
exports.TipoContenidoFuenteEnum = zod_1.z.enum(['PDF', 'IMAGEN', 'VIDEO', 'PRESENTACION', 'LINK_DRIVE', 'TEXTO_PLANO']);
exports.CarpetaSchema = zod_1.z.object({
    id: zod_1.z.string(),
    nombre: zod_1.z.string(),
    materiaId: zod_1.z.string(),
    parentId: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string().optional()
});
exports.FuenteContenidoSchema = zod_1.z.object({
    id: zod_1.z.string(),
    materiaId: zod_1.z.string(),
    carpetaId: zod_1.z.string().nullable().optional(),
    tipo: exports.TipoContenidoFuenteEnum,
    urlArchivo: zod_1.z.string().nullable().optional(),
    nombreArchivo: zod_1.z.string(),
    textoExtraido: zod_1.z.string().nullable().optional(),
    createdAt: zod_1.z.string().optional()
});
exports.MateriaSchema = zod_1.z.object({
    id: zod_1.z.string(),
    nombre: zod_1.z.string(),
    name: zod_1.z.string().optional(),
    nivel: zod_1.z.string().nullable().optional(),
    grado: zod_1.z.string().nullable().optional(),
    iconoUrl: zod_1.z.string().nullable().optional(),
    description: zod_1.z.string().nullable().optional(),
    usuarioId: zod_1.z.string().optional(),
    userId: zod_1.z.string().optional(),
    fuentes: zod_1.z.array(exports.FuenteContenidoSchema).optional().default([]),
    carpetas: zod_1.z.array(exports.CarpetaSchema).optional().default([]),
    createdAt: zod_1.z.string().optional()
});
exports.CreateMateriaPayloadSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1),
    name: zod_1.z.string().optional(),
    nivel: zod_1.z.string().nullable().optional(),
    grado: zod_1.z.string().nullable().optional()
});
// ==========================================
// 3. GENERACIÓN DE RECURSOS (RESUMEN, CLASE, PRESENTACIÓN, SECUENCIA)
// ==========================================
exports.TipoRecursoEnum = zod_1.z.enum([
    'RESUMEN',
    'GUIA_ESTUDIO',
    'EVALUACION',
    'MAPA_CONCEPTUAL',
    'CLASE',
    'PRESENTACION',
    'SECUENCIA_DIDACTICA',
    'SECUENCIA'
]);
exports.BloqueResumenSchema = zod_1.z.object({
    tipo: zod_1.z.enum(['parrafo', 'subseccion', 'lista', 'imagen_ai', 'imagen']),
    contenido: zod_1.z.string(),
    items: zod_1.z.array(zod_1.z.string()).optional()
});
exports.SeccionResumenSchema = zod_1.z.object({
    titulo_seccion: zod_1.z.string(),
    bloques: zod_1.z.array(exports.BloqueResumenSchema)
});
exports.ResumenSchema = zod_1.z.object({
    titulo_resumen: zod_1.z.string(),
    secciones: zod_1.z.array(exports.SeccionResumenSchema).optional(),
    // Campos complementarios UI / editor enriquecido
    titulo_principal: zod_1.z.string().optional(),
    html_content: zod_1.z.string().optional(),
    conceptos_clave: zod_1.z.array(zod_1.z.string()).optional(),
    actividades_sugeridas: zod_1.z.array(zod_1.z.string()).optional()
});
// Clase Pedagógica en 3 momentos
exports.MomentoDetalleSchema = zod_1.z.object({
    tiempo_minutos: zod_1.z.number(),
    nota_para_docente: zod_1.z.string(),
    consigna_literal_alumno: zod_1.z.string(),
    registro_carpeta_tarea: zod_1.z.string().optional()
});
exports.ClaseMomentosSchema = zod_1.z.object({
    inicio: exports.MomentoDetalleSchema,
    desarrollo: exports.MomentoDetalleSchema,
    cierre: exports.MomentoDetalleSchema
});
exports.ClaseGeneradaSchema = zod_1.z.object({
    titulo: zod_1.z.string().optional(),
    titulo_clase: zod_1.z.string().optional(),
    duracion_minutos: zod_1.z.number().optional(),
    objetivo_clase: zod_1.z.string().optional(),
    recursos_necesarios: zod_1.z.array(zod_1.z.string()).optional(),
    momentos: exports.ClaseMomentosSchema.optional(),
    evidencia_aprendizaje: zod_1.z.string().optional(),
    // Retrocompatibilidad
    paso_1_debate: zod_1.z.object({ pregunta_disparadora: zod_1.z.string(), contexto_debate: zod_1.z.string() }).optional(),
    paso_2_contenido: zod_1.z.array(zod_1.z.object({ subtitulo: zod_1.z.string(), parrafo: zod_1.z.string() })).optional(),
    paso_3_evaluacion: zod_1.z.array(zod_1.z.string()).optional()
});
// Presentación / Diapositivas
exports.SlideContentSchema = zod_1.z.object({
    kicker: zod_1.z.string().optional(),
    title: zod_1.z.string().optional(),
    body: zod_1.z.string().optional(),
    items: zod_1.z.array(zod_1.z.string()).optional(),
    imagePrompt: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().optional()
});
exports.SlideSchema = zod_1.z.object({
    layoutType: zod_1.z.enum(['hero', 'split_image_text', 'grid_3', 'quote', 'statement', 'debate', 'lectura', 'actividad', 'resumen']),
    theme: zod_1.z.enum(['dark', 'light', 'primary']).default('light'),
    content: exports.SlideContentSchema
});
exports.PresentacionSchema = zod_1.z.object({
    titulo_presentacion: zod_1.z.string(),
    diapositivas: zod_1.z.array(exports.SlideSchema)
});
// Secuencia Didáctica
exports.RubricaItemSchema = zod_1.z.object({
    criterio: zod_1.z.string(),
    nivel_destacado: zod_1.z.string(),
    nivel_logrado: zod_1.z.string(),
    nivel_en_proceso: zod_1.z.string()
});
exports.EvaluacionSecuenciaSchema = zod_1.z.object({
    diagnostica: zod_1.z.string(),
    formativa: zod_1.z.string(),
    final: zod_1.z.string(),
    rubricas: zod_1.z.array(exports.RubricaItemSchema)
});
exports.ClaseSecuenciaItemSchema = zod_1.z.object({
    numero: zod_1.z.number(),
    titulo: zod_1.z.string(),
    duracion_minutos: zod_1.z.number(),
    objetivo: zod_1.z.string(),
    momentos: zod_1.z.object({
        inicio: exports.MomentoDetalleSchema,
        desarrollo: exports.MomentoDetalleSchema,
        cierre: exports.MomentoDetalleSchema
    })
});
exports.SecuenciaDidacticaSchema = zod_1.z.object({
    titulo: zod_1.z.string(),
    espacio_curricular: zod_1.z.string(),
    curso: zod_1.z.string(),
    tema: zod_1.z.string(),
    cantidad_clases: zod_1.z.number(),
    fundamentacion: zod_1.z.string(),
    objetivos: zod_1.z.array(zod_1.z.string()),
    capacidades: zod_1.z.array(zod_1.z.string()),
    clases: zod_1.z.array(exports.ClaseSecuenciaItemSchema),
    evaluacion: exports.EvaluacionSecuenciaSchema
});
// Entidad DB GeneracionRecurso
exports.GeneracionRecursoSchema = zod_1.z.object({
    id: zod_1.z.string(),
    materiaId: zod_1.z.string(),
    tipo: exports.TipoRecursoEnum,
    titulo: zod_1.z.string(),
    contenido: zod_1.z.string(), // Contenido JSON serializado o HTML
    fuenteContenidoId: zod_1.z.string().nullable().optional(),
    createdAt: zod_1.z.string().optional(),
    updatedAt: zod_1.z.string().optional()
});
exports.RecursoPayloadSchema = zod_1.z.object({
    materiaId: zod_1.z.string(),
    tipo: exports.TipoRecursoEnum,
    titulo: zod_1.z.string(),
    contenido: zod_1.z.string()
});
// ==========================================
// 4. LIBRO DE TEMAS & CLASES (SPREADSHEET)
// ==========================================
exports.EstadoClaseEnum = zod_1.z.enum(['Planificada', 'Completada', 'Suspendida', 'planificada', 'dada', 'cancelada', 'postergada', 'CANCELADA']);
exports.ClaseSpreadsheetSchema = zod_1.z.object({
    id: zod_1.z.string(),
    materiaId: zod_1.z.string().optional(),
    materiaNombre: zod_1.z.string().nullable().optional(),
    fecha: zod_1.z.string().nullable().optional(),
    numeroClase: zod_1.z.number().nullable().optional(),
    unidad: zod_1.z.string().nullable().optional(),
    caracteristicaClase: zod_1.z.string().nullable().optional(),
    temaDia: zod_1.z.string().nullable().optional(),
    actividadesPropuestas: zod_1.z.string().nullable().optional(),
    observaciones: zod_1.z.string().nullable().optional(),
    novedades: zod_1.z.string().nullable().optional(),
    estado: exports.EstadoClaseEnum.default('Planificada'),
    color: zod_1.z.string().nullable().optional(),
    tipo: zod_1.z.literal('clase').optional(),
    createdAt: zod_1.z.string().optional(),
    updatedAt: zod_1.z.string().optional()
});
exports.RecordatorioSchema = zod_1.z.object({
    id: zod_1.z.string(),
    titulo: zod_1.z.string(),
    contenido: zod_1.z.string().nullable().optional(),
    fecha: zod_1.z.string(),
    color: zod_1.z.string().default('blue'),
    tipo: zod_1.z.literal('recordatorio').optional(),
    usuarioId: zod_1.z.string().optional(),
    materiaId: zod_1.z.string().nullable().optional(),
    materiaNombre: zod_1.z.string().nullable().optional(),
    createdAt: zod_1.z.string().optional(),
    updatedAt: zod_1.z.string().optional()
});
exports.EventosCalendarioResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    clases: zod_1.z.array(exports.ClaseSpreadsheetSchema),
    recordatorios: zod_1.z.array(exports.RecordatorioSchema)
});
exports.LibroTemaArbolSchema = zod_1.z.object({
    id: zod_1.z.string(),
    materiaId: zod_1.z.string(),
    cicloLectivo: zod_1.z.number().optional(),
    cursoDivision: zod_1.z.string().optional(),
    unidades: zod_1.z.array(zod_1.z.record(zod_1.z.string(), zod_1.z.unknown())).optional()
});
// ==========================================
// 6. CORRECCIÓN DE EVALUACIONES CON IA (PASO 1)
// ==========================================
exports.ComentarioIASchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    sugerencia: zod_1.z.string(),
    criterio: zod_1.z.string().nullable().optional(),
    aprobado: zod_1.z.boolean().default(false),
    entregaId: zod_1.z.string().uuid(),
    createdAt: zod_1.z.string().or(zod_1.z.date()).optional()
});
exports.EntregaAlumnoSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    nombreOriginal: zod_1.z.string(),
    archivoUrl: zod_1.z.string().url(),
    evaluacionId: zod_1.z.string().uuid(),
    notaFinal: zod_1.z.string().nullable().optional(),
    createdAt: zod_1.z.string().or(zod_1.z.date()).optional(),
    comentarios: zod_1.z.array(exports.ComentarioIASchema).optional()
});
exports.EvaluacionBaseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    titulo: zod_1.z.string().min(1, 'El título es obligatorio'),
    consignas: zod_1.z.string().min(1, 'Las consignas son obligatorias'),
    criterios: zod_1.z.string().min(1, 'Los criterios de rúbrica son obligatorios'),
    materiaId: zod_1.z.string().uuid('Debe especificar una materia válida'),
    createdAt: zod_1.z.string().or(zod_1.z.date()).optional(),
    entregas: zod_1.z.array(exports.EntregaAlumnoSchema).optional()
});
exports.CreateEvaluacionPayloadSchema = zod_1.z.object({
    titulo: zod_1.z.string().min(1, 'El título es obligatorio'),
    consignas: zod_1.z.string().min(1, 'Las consignas son obligatorias'),
    criterios: zod_1.z.string().min(1, 'Los criterios son obligatorios'),
    materiaId: zod_1.z.string().uuid('El ID de materia debe ser un UUID válido')
});
