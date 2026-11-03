import { z } from 'zod';
export declare const PlanActualEnum: z.ZodEnum<["gratis", "premium"]>;
export declare const TierEnum: z.ZodEnum<["free", "pro", "premium"]>;
export declare const UsuarioSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    nombreCompleto: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    planActual: z.ZodDefault<z.ZodString>;
    tier: z.ZodDefault<z.ZodEnum<["free", "pro", "premium"]>>;
    peticiones_ia_restantes: z.ZodDefault<z.ZodNumber>;
    fecha_ultimo_reinicio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    email: string;
    planActual: string;
    tier: "premium" | "free" | "pro";
    peticiones_ia_restantes: number;
    nombreCompleto?: string | null | undefined;
    fecha_ultimo_reinicio?: string | null | undefined;
    createdAt?: string | undefined;
}, {
    id: string;
    email: string;
    nombreCompleto?: string | null | undefined;
    planActual?: string | undefined;
    tier?: "premium" | "free" | "pro" | undefined;
    peticiones_ia_restantes?: number | undefined;
    fecha_ultimo_reinicio?: string | null | undefined;
    createdAt?: string | undefined;
}>;
export declare const UserMetadataSchema: z.ZodRecord<z.ZodString, z.ZodUnknown>;
export declare const AuthUserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    nombreCompleto: z.ZodString;
    role: z.ZodOptional<z.ZodString>;
    tier: z.ZodOptional<z.ZodEnum<["free", "pro", "premium"]>>;
    peticiones_ia_restantes: z.ZodOptional<z.ZodNumber>;
    user_metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    email: string;
    nombreCompleto: string;
    role?: string | undefined;
    tier?: "premium" | "free" | "pro" | undefined;
    peticiones_ia_restantes?: number | undefined;
    user_metadata?: Record<string, unknown> | undefined;
}, {
    id: string;
    email: string;
    nombreCompleto: string;
    role?: string | undefined;
    tier?: "premium" | "free" | "pro" | undefined;
    peticiones_ia_restantes?: number | undefined;
    user_metadata?: Record<string, unknown> | undefined;
}>;
export declare const AuthSessionSchema: z.ZodObject<{
    access_token: z.ZodString;
    token_type: z.ZodDefault<z.ZodString>;
    expires_in: z.ZodOptional<z.ZodNumber>;
    expires_at: z.ZodOptional<z.ZodNumber>;
    refresh_token: z.ZodString;
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        nombreCompleto: z.ZodString;
        role: z.ZodOptional<z.ZodString>;
        tier: z.ZodOptional<z.ZodEnum<["free", "pro", "premium"]>>;
        peticiones_ia_restantes: z.ZodOptional<z.ZodNumber>;
        user_metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        email: string;
        nombreCompleto: string;
        role?: string | undefined;
        tier?: "premium" | "free" | "pro" | undefined;
        peticiones_ia_restantes?: number | undefined;
        user_metadata?: Record<string, unknown> | undefined;
    }, {
        id: string;
        email: string;
        nombreCompleto: string;
        role?: string | undefined;
        tier?: "premium" | "free" | "pro" | undefined;
        peticiones_ia_restantes?: number | undefined;
        user_metadata?: Record<string, unknown> | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    user: {
        id: string;
        email: string;
        nombreCompleto: string;
        role?: string | undefined;
        tier?: "premium" | "free" | "pro" | undefined;
        peticiones_ia_restantes?: number | undefined;
        user_metadata?: Record<string, unknown> | undefined;
    };
    access_token: string;
    token_type: string;
    refresh_token: string;
    expires_in?: number | undefined;
    expires_at?: number | undefined;
}, {
    user: {
        id: string;
        email: string;
        nombreCompleto: string;
        role?: string | undefined;
        tier?: "premium" | "free" | "pro" | undefined;
        peticiones_ia_restantes?: number | undefined;
        user_metadata?: Record<string, unknown> | undefined;
    };
    access_token: string;
    refresh_token: string;
    token_type?: string | undefined;
    expires_in?: number | undefined;
    expires_at?: number | undefined;
}>;
export declare const AuthResponseSchema: z.ZodObject<{
    mensaje: z.ZodOptional<z.ZodString>;
    session: z.ZodObject<{
        access_token: z.ZodString;
        token_type: z.ZodDefault<z.ZodString>;
        expires_in: z.ZodOptional<z.ZodNumber>;
        expires_at: z.ZodOptional<z.ZodNumber>;
        refresh_token: z.ZodString;
        user: z.ZodObject<{
            id: z.ZodString;
            email: z.ZodString;
            nombreCompleto: z.ZodString;
            role: z.ZodOptional<z.ZodString>;
            tier: z.ZodOptional<z.ZodEnum<["free", "pro", "premium"]>>;
            peticiones_ia_restantes: z.ZodOptional<z.ZodNumber>;
            user_metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            email: string;
            nombreCompleto: string;
            role?: string | undefined;
            tier?: "premium" | "free" | "pro" | undefined;
            peticiones_ia_restantes?: number | undefined;
            user_metadata?: Record<string, unknown> | undefined;
        }, {
            id: string;
            email: string;
            nombreCompleto: string;
            role?: string | undefined;
            tier?: "premium" | "free" | "pro" | undefined;
            peticiones_ia_restantes?: number | undefined;
            user_metadata?: Record<string, unknown> | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        user: {
            id: string;
            email: string;
            nombreCompleto: string;
            role?: string | undefined;
            tier?: "premium" | "free" | "pro" | undefined;
            peticiones_ia_restantes?: number | undefined;
            user_metadata?: Record<string, unknown> | undefined;
        };
        access_token: string;
        token_type: string;
        refresh_token: string;
        expires_in?: number | undefined;
        expires_at?: number | undefined;
    }, {
        user: {
            id: string;
            email: string;
            nombreCompleto: string;
            role?: string | undefined;
            tier?: "premium" | "free" | "pro" | undefined;
            peticiones_ia_restantes?: number | undefined;
            user_metadata?: Record<string, unknown> | undefined;
        };
        access_token: string;
        refresh_token: string;
        token_type?: string | undefined;
        expires_in?: number | undefined;
        expires_at?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    session: {
        user: {
            id: string;
            email: string;
            nombreCompleto: string;
            role?: string | undefined;
            tier?: "premium" | "free" | "pro" | undefined;
            peticiones_ia_restantes?: number | undefined;
            user_metadata?: Record<string, unknown> | undefined;
        };
        access_token: string;
        token_type: string;
        refresh_token: string;
        expires_in?: number | undefined;
        expires_at?: number | undefined;
    };
    mensaje?: string | undefined;
}, {
    session: {
        user: {
            id: string;
            email: string;
            nombreCompleto: string;
            role?: string | undefined;
            tier?: "premium" | "free" | "pro" | undefined;
            peticiones_ia_restantes?: number | undefined;
            user_metadata?: Record<string, unknown> | undefined;
        };
        access_token: string;
        refresh_token: string;
        token_type?: string | undefined;
        expires_in?: number | undefined;
        expires_at?: number | undefined;
    };
    mensaje?: string | undefined;
}>;
export declare const LoginCredentialsSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const RegisterDataSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    nombreCompleto: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    nombreCompleto: string;
    password: string;
}, {
    email: string;
    nombreCompleto: string;
    password: string;
}>;
export declare const PerfilUsuarioSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    nombreCompleto: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    planActual: z.ZodString;
    tier: z.ZodEnum<["free", "pro", "premium"]>;
    peticiones_ia_restantes: z.ZodNumber;
    fecha_ultimo_reinicio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    email: string;
    planActual: string;
    tier: "premium" | "free" | "pro";
    peticiones_ia_restantes: number;
    nombreCompleto?: string | null | undefined;
    fecha_ultimo_reinicio?: string | null | undefined;
}, {
    id: string;
    email: string;
    planActual: string;
    tier: "premium" | "free" | "pro";
    peticiones_ia_restantes: number;
    nombreCompleto?: string | null | undefined;
    fecha_ultimo_reinicio?: string | null | undefined;
}>;
export declare const TipoContenidoFuenteEnum: z.ZodEnum<["PDF", "IMAGEN", "VIDEO", "PRESENTACION", "LINK_DRIVE", "TEXTO_PLANO"]>;
export declare const CarpetaSchema: z.ZodObject<{
    id: z.ZodString;
    nombre: z.ZodString;
    materiaId: z.ZodString;
    parentId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    nombre: string;
    materiaId: string;
    parentId: string | null;
    createdAt?: string | undefined;
}, {
    id: string;
    nombre: string;
    materiaId: string;
    parentId: string | null;
    createdAt?: string | undefined;
}>;
export declare const FuenteContenidoSchema: z.ZodObject<{
    id: z.ZodString;
    materiaId: z.ZodString;
    carpetaId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    tipo: z.ZodEnum<["PDF", "IMAGEN", "VIDEO", "PRESENTACION", "LINK_DRIVE", "TEXTO_PLANO"]>;
    urlArchivo: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    nombreArchivo: z.ZodString;
    textoExtraido: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    materiaId: string;
    tipo: "PDF" | "IMAGEN" | "VIDEO" | "PRESENTACION" | "LINK_DRIVE" | "TEXTO_PLANO";
    nombreArchivo: string;
    createdAt?: string | undefined;
    carpetaId?: string | null | undefined;
    urlArchivo?: string | null | undefined;
    textoExtraido?: string | null | undefined;
}, {
    id: string;
    materiaId: string;
    tipo: "PDF" | "IMAGEN" | "VIDEO" | "PRESENTACION" | "LINK_DRIVE" | "TEXTO_PLANO";
    nombreArchivo: string;
    createdAt?: string | undefined;
    carpetaId?: string | null | undefined;
    urlArchivo?: string | null | undefined;
    textoExtraido?: string | null | undefined;
}>;
export declare const MateriaSchema: z.ZodObject<{
    id: z.ZodString;
    nombre: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    nivel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    grado: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    iconoUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    usuarioId: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
    fuentes: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        materiaId: z.ZodString;
        carpetaId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        tipo: z.ZodEnum<["PDF", "IMAGEN", "VIDEO", "PRESENTACION", "LINK_DRIVE", "TEXTO_PLANO"]>;
        urlArchivo: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        nombreArchivo: z.ZodString;
        textoExtraido: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        createdAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        materiaId: string;
        tipo: "PDF" | "IMAGEN" | "VIDEO" | "PRESENTACION" | "LINK_DRIVE" | "TEXTO_PLANO";
        nombreArchivo: string;
        createdAt?: string | undefined;
        carpetaId?: string | null | undefined;
        urlArchivo?: string | null | undefined;
        textoExtraido?: string | null | undefined;
    }, {
        id: string;
        materiaId: string;
        tipo: "PDF" | "IMAGEN" | "VIDEO" | "PRESENTACION" | "LINK_DRIVE" | "TEXTO_PLANO";
        nombreArchivo: string;
        createdAt?: string | undefined;
        carpetaId?: string | null | undefined;
        urlArchivo?: string | null | undefined;
        textoExtraido?: string | null | undefined;
    }>, "many">>>;
    carpetas: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        nombre: z.ZodString;
        materiaId: z.ZodString;
        parentId: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        nombre: string;
        materiaId: string;
        parentId: string | null;
        createdAt?: string | undefined;
    }, {
        id: string;
        nombre: string;
        materiaId: string;
        parentId: string | null;
        createdAt?: string | undefined;
    }>, "many">>>;
    createdAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    nombre: string;
    fuentes: {
        id: string;
        materiaId: string;
        tipo: "PDF" | "IMAGEN" | "VIDEO" | "PRESENTACION" | "LINK_DRIVE" | "TEXTO_PLANO";
        nombreArchivo: string;
        createdAt?: string | undefined;
        carpetaId?: string | null | undefined;
        urlArchivo?: string | null | undefined;
        textoExtraido?: string | null | undefined;
    }[];
    carpetas: {
        id: string;
        nombre: string;
        materiaId: string;
        parentId: string | null;
        createdAt?: string | undefined;
    }[];
    name?: string | undefined;
    description?: string | null | undefined;
    createdAt?: string | undefined;
    nivel?: string | null | undefined;
    grado?: string | null | undefined;
    iconoUrl?: string | null | undefined;
    usuarioId?: string | undefined;
    userId?: string | undefined;
}, {
    id: string;
    nombre: string;
    name?: string | undefined;
    description?: string | null | undefined;
    createdAt?: string | undefined;
    nivel?: string | null | undefined;
    grado?: string | null | undefined;
    iconoUrl?: string | null | undefined;
    usuarioId?: string | undefined;
    userId?: string | undefined;
    fuentes?: {
        id: string;
        materiaId: string;
        tipo: "PDF" | "IMAGEN" | "VIDEO" | "PRESENTACION" | "LINK_DRIVE" | "TEXTO_PLANO";
        nombreArchivo: string;
        createdAt?: string | undefined;
        carpetaId?: string | null | undefined;
        urlArchivo?: string | null | undefined;
        textoExtraido?: string | null | undefined;
    }[] | undefined;
    carpetas?: {
        id: string;
        nombre: string;
        materiaId: string;
        parentId: string | null;
        createdAt?: string | undefined;
    }[] | undefined;
}>;
export declare const CreateMateriaPayloadSchema: z.ZodObject<{
    nombre: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    nivel: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    grado: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    nombre: string;
    name?: string | undefined;
    nivel?: string | null | undefined;
    grado?: string | null | undefined;
}, {
    nombre: string;
    name?: string | undefined;
    nivel?: string | null | undefined;
    grado?: string | null | undefined;
}>;
export declare const TipoRecursoEnum: z.ZodEnum<["RESUMEN", "GUIA_ESTUDIO", "EVALUACION", "MAPA_CONCEPTUAL", "CLASE", "PRESENTACION", "SECUENCIA_DIDACTICA", "SECUENCIA"]>;
export declare const BloqueResumenSchema: z.ZodObject<{
    tipo: z.ZodEnum<["parrafo", "subseccion", "lista", "imagen_ai", "imagen"]>;
    contenido: z.ZodString;
    items: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    tipo: "parrafo" | "subseccion" | "lista" | "imagen_ai" | "imagen";
    contenido: string;
    items?: string[] | undefined;
}, {
    tipo: "parrafo" | "subseccion" | "lista" | "imagen_ai" | "imagen";
    contenido: string;
    items?: string[] | undefined;
}>;
export declare const SeccionResumenSchema: z.ZodObject<{
    titulo_seccion: z.ZodString;
    bloques: z.ZodArray<z.ZodObject<{
        tipo: z.ZodEnum<["parrafo", "subseccion", "lista", "imagen_ai", "imagen"]>;
        contenido: z.ZodString;
        items: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        tipo: "parrafo" | "subseccion" | "lista" | "imagen_ai" | "imagen";
        contenido: string;
        items?: string[] | undefined;
    }, {
        tipo: "parrafo" | "subseccion" | "lista" | "imagen_ai" | "imagen";
        contenido: string;
        items?: string[] | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    titulo_seccion: string;
    bloques: {
        tipo: "parrafo" | "subseccion" | "lista" | "imagen_ai" | "imagen";
        contenido: string;
        items?: string[] | undefined;
    }[];
}, {
    titulo_seccion: string;
    bloques: {
        tipo: "parrafo" | "subseccion" | "lista" | "imagen_ai" | "imagen";
        contenido: string;
        items?: string[] | undefined;
    }[];
}>;
export declare const ResumenSchema: z.ZodObject<{
    titulo_resumen: z.ZodString;
    secciones: z.ZodOptional<z.ZodArray<z.ZodObject<{
        titulo_seccion: z.ZodString;
        bloques: z.ZodArray<z.ZodObject<{
            tipo: z.ZodEnum<["parrafo", "subseccion", "lista", "imagen_ai", "imagen"]>;
            contenido: z.ZodString;
            items: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            tipo: "parrafo" | "subseccion" | "lista" | "imagen_ai" | "imagen";
            contenido: string;
            items?: string[] | undefined;
        }, {
            tipo: "parrafo" | "subseccion" | "lista" | "imagen_ai" | "imagen";
            contenido: string;
            items?: string[] | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        titulo_seccion: string;
        bloques: {
            tipo: "parrafo" | "subseccion" | "lista" | "imagen_ai" | "imagen";
            contenido: string;
            items?: string[] | undefined;
        }[];
    }, {
        titulo_seccion: string;
        bloques: {
            tipo: "parrafo" | "subseccion" | "lista" | "imagen_ai" | "imagen";
            contenido: string;
            items?: string[] | undefined;
        }[];
    }>, "many">>;
    titulo_principal: z.ZodOptional<z.ZodString>;
    html_content: z.ZodOptional<z.ZodString>;
    conceptos_clave: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    actividades_sugeridas: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    titulo_resumen: string;
    secciones?: {
        titulo_seccion: string;
        bloques: {
            tipo: "parrafo" | "subseccion" | "lista" | "imagen_ai" | "imagen";
            contenido: string;
            items?: string[] | undefined;
        }[];
    }[] | undefined;
    titulo_principal?: string | undefined;
    html_content?: string | undefined;
    conceptos_clave?: string[] | undefined;
    actividades_sugeridas?: string[] | undefined;
}, {
    titulo_resumen: string;
    secciones?: {
        titulo_seccion: string;
        bloques: {
            tipo: "parrafo" | "subseccion" | "lista" | "imagen_ai" | "imagen";
            contenido: string;
            items?: string[] | undefined;
        }[];
    }[] | undefined;
    titulo_principal?: string | undefined;
    html_content?: string | undefined;
    conceptos_clave?: string[] | undefined;
    actividades_sugeridas?: string[] | undefined;
}>;
export declare const MomentoDetalleSchema: z.ZodObject<{
    tiempo_minutos: z.ZodNumber;
    nota_para_docente: z.ZodString;
    consigna_literal_alumno: z.ZodString;
    registro_carpeta_tarea: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    tiempo_minutos: number;
    nota_para_docente: string;
    consigna_literal_alumno: string;
    registro_carpeta_tarea?: string | undefined;
}, {
    tiempo_minutos: number;
    nota_para_docente: string;
    consigna_literal_alumno: string;
    registro_carpeta_tarea?: string | undefined;
}>;
export declare const ClaseMomentosSchema: z.ZodObject<{
    inicio: z.ZodObject<{
        tiempo_minutos: z.ZodNumber;
        nota_para_docente: z.ZodString;
        consigna_literal_alumno: z.ZodString;
        registro_carpeta_tarea: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        tiempo_minutos: number;
        nota_para_docente: string;
        consigna_literal_alumno: string;
        registro_carpeta_tarea?: string | undefined;
    }, {
        tiempo_minutos: number;
        nota_para_docente: string;
        consigna_literal_alumno: string;
        registro_carpeta_tarea?: string | undefined;
    }>;
    desarrollo: z.ZodObject<{
        tiempo_minutos: z.ZodNumber;
        nota_para_docente: z.ZodString;
        consigna_literal_alumno: z.ZodString;
        registro_carpeta_tarea: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        tiempo_minutos: number;
        nota_para_docente: string;
        consigna_literal_alumno: string;
        registro_carpeta_tarea?: string | undefined;
    }, {
        tiempo_minutos: number;
        nota_para_docente: string;
        consigna_literal_alumno: string;
        registro_carpeta_tarea?: string | undefined;
    }>;
    cierre: z.ZodObject<{
        tiempo_minutos: z.ZodNumber;
        nota_para_docente: z.ZodString;
        consigna_literal_alumno: z.ZodString;
        registro_carpeta_tarea: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        tiempo_minutos: number;
        nota_para_docente: string;
        consigna_literal_alumno: string;
        registro_carpeta_tarea?: string | undefined;
    }, {
        tiempo_minutos: number;
        nota_para_docente: string;
        consigna_literal_alumno: string;
        registro_carpeta_tarea?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    inicio: {
        tiempo_minutos: number;
        nota_para_docente: string;
        consigna_literal_alumno: string;
        registro_carpeta_tarea?: string | undefined;
    };
    desarrollo: {
        tiempo_minutos: number;
        nota_para_docente: string;
        consigna_literal_alumno: string;
        registro_carpeta_tarea?: string | undefined;
    };
    cierre: {
        tiempo_minutos: number;
        nota_para_docente: string;
        consigna_literal_alumno: string;
        registro_carpeta_tarea?: string | undefined;
    };
}, {
    inicio: {
        tiempo_minutos: number;
        nota_para_docente: string;
        consigna_literal_alumno: string;
        registro_carpeta_tarea?: string | undefined;
    };
    desarrollo: {
        tiempo_minutos: number;
        nota_para_docente: string;
        consigna_literal_alumno: string;
        registro_carpeta_tarea?: string | undefined;
    };
    cierre: {
        tiempo_minutos: number;
        nota_para_docente: string;
        consigna_literal_alumno: string;
        registro_carpeta_tarea?: string | undefined;
    };
}>;
export declare const ClaseGeneradaSchema: z.ZodObject<{
    titulo: z.ZodOptional<z.ZodString>;
    titulo_clase: z.ZodOptional<z.ZodString>;
    duracion_minutos: z.ZodOptional<z.ZodNumber>;
    objetivo_clase: z.ZodOptional<z.ZodString>;
    recursos_necesarios: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    momentos: z.ZodOptional<z.ZodObject<{
        inicio: z.ZodObject<{
            tiempo_minutos: z.ZodNumber;
            nota_para_docente: z.ZodString;
            consigna_literal_alumno: z.ZodString;
            registro_carpeta_tarea: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        }, {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        }>;
        desarrollo: z.ZodObject<{
            tiempo_minutos: z.ZodNumber;
            nota_para_docente: z.ZodString;
            consigna_literal_alumno: z.ZodString;
            registro_carpeta_tarea: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        }, {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        }>;
        cierre: z.ZodObject<{
            tiempo_minutos: z.ZodNumber;
            nota_para_docente: z.ZodString;
            consigna_literal_alumno: z.ZodString;
            registro_carpeta_tarea: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        }, {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        inicio: {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        };
        desarrollo: {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        };
        cierre: {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        };
    }, {
        inicio: {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        };
        desarrollo: {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        };
        cierre: {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        };
    }>>;
    evidencia_aprendizaje: z.ZodOptional<z.ZodString>;
    paso_1_debate: z.ZodOptional<z.ZodObject<{
        pregunta_disparadora: z.ZodString;
        contexto_debate: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        pregunta_disparadora: string;
        contexto_debate: string;
    }, {
        pregunta_disparadora: string;
        contexto_debate: string;
    }>>;
    paso_2_contenido: z.ZodOptional<z.ZodArray<z.ZodObject<{
        subtitulo: z.ZodString;
        parrafo: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        parrafo: string;
        subtitulo: string;
    }, {
        parrafo: string;
        subtitulo: string;
    }>, "many">>;
    paso_3_evaluacion: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    titulo?: string | undefined;
    titulo_clase?: string | undefined;
    duracion_minutos?: number | undefined;
    objetivo_clase?: string | undefined;
    recursos_necesarios?: string[] | undefined;
    momentos?: {
        inicio: {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        };
        desarrollo: {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        };
        cierre: {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        };
    } | undefined;
    evidencia_aprendizaje?: string | undefined;
    paso_1_debate?: {
        pregunta_disparadora: string;
        contexto_debate: string;
    } | undefined;
    paso_2_contenido?: {
        parrafo: string;
        subtitulo: string;
    }[] | undefined;
    paso_3_evaluacion?: string[] | undefined;
}, {
    titulo?: string | undefined;
    titulo_clase?: string | undefined;
    duracion_minutos?: number | undefined;
    objetivo_clase?: string | undefined;
    recursos_necesarios?: string[] | undefined;
    momentos?: {
        inicio: {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        };
        desarrollo: {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        };
        cierre: {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        };
    } | undefined;
    evidencia_aprendizaje?: string | undefined;
    paso_1_debate?: {
        pregunta_disparadora: string;
        contexto_debate: string;
    } | undefined;
    paso_2_contenido?: {
        parrafo: string;
        subtitulo: string;
    }[] | undefined;
    paso_3_evaluacion?: string[] | undefined;
}>;
export declare const SlideContentSchema: z.ZodObject<{
    kicker: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    body: z.ZodOptional<z.ZodString>;
    items: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    imagePrompt: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    body?: string | undefined;
    title?: string | undefined;
    items?: string[] | undefined;
    kicker?: string | undefined;
    imagePrompt?: string | undefined;
    imageUrl?: string | undefined;
}, {
    body?: string | undefined;
    title?: string | undefined;
    items?: string[] | undefined;
    kicker?: string | undefined;
    imagePrompt?: string | undefined;
    imageUrl?: string | undefined;
}>;
export declare const SlideSchema: z.ZodObject<{
    layoutType: z.ZodEnum<["hero", "split_image_text", "grid_3", "quote", "statement", "debate", "lectura", "actividad", "resumen"]>;
    theme: z.ZodDefault<z.ZodEnum<["dark", "light", "primary"]>>;
    content: z.ZodObject<{
        kicker: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        body: z.ZodOptional<z.ZodString>;
        items: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        imagePrompt: z.ZodOptional<z.ZodString>;
        imageUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        body?: string | undefined;
        title?: string | undefined;
        items?: string[] | undefined;
        kicker?: string | undefined;
        imagePrompt?: string | undefined;
        imageUrl?: string | undefined;
    }, {
        body?: string | undefined;
        title?: string | undefined;
        items?: string[] | undefined;
        kicker?: string | undefined;
        imagePrompt?: string | undefined;
        imageUrl?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    content: {
        body?: string | undefined;
        title?: string | undefined;
        items?: string[] | undefined;
        kicker?: string | undefined;
        imagePrompt?: string | undefined;
        imageUrl?: string | undefined;
    };
    layoutType: "hero" | "split_image_text" | "grid_3" | "quote" | "statement" | "debate" | "lectura" | "actividad" | "resumen";
    theme: "dark" | "light" | "primary";
}, {
    content: {
        body?: string | undefined;
        title?: string | undefined;
        items?: string[] | undefined;
        kicker?: string | undefined;
        imagePrompt?: string | undefined;
        imageUrl?: string | undefined;
    };
    layoutType: "hero" | "split_image_text" | "grid_3" | "quote" | "statement" | "debate" | "lectura" | "actividad" | "resumen";
    theme?: "dark" | "light" | "primary" | undefined;
}>;
export declare const PresentacionSchema: z.ZodObject<{
    titulo_presentacion: z.ZodString;
    diapositivas: z.ZodArray<z.ZodObject<{
        layoutType: z.ZodEnum<["hero", "split_image_text", "grid_3", "quote", "statement", "debate", "lectura", "actividad", "resumen"]>;
        theme: z.ZodDefault<z.ZodEnum<["dark", "light", "primary"]>>;
        content: z.ZodObject<{
            kicker: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodString>;
            body: z.ZodOptional<z.ZodString>;
            items: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            imagePrompt: z.ZodOptional<z.ZodString>;
            imageUrl: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            body?: string | undefined;
            title?: string | undefined;
            items?: string[] | undefined;
            kicker?: string | undefined;
            imagePrompt?: string | undefined;
            imageUrl?: string | undefined;
        }, {
            body?: string | undefined;
            title?: string | undefined;
            items?: string[] | undefined;
            kicker?: string | undefined;
            imagePrompt?: string | undefined;
            imageUrl?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        content: {
            body?: string | undefined;
            title?: string | undefined;
            items?: string[] | undefined;
            kicker?: string | undefined;
            imagePrompt?: string | undefined;
            imageUrl?: string | undefined;
        };
        layoutType: "hero" | "split_image_text" | "grid_3" | "quote" | "statement" | "debate" | "lectura" | "actividad" | "resumen";
        theme: "dark" | "light" | "primary";
    }, {
        content: {
            body?: string | undefined;
            title?: string | undefined;
            items?: string[] | undefined;
            kicker?: string | undefined;
            imagePrompt?: string | undefined;
            imageUrl?: string | undefined;
        };
        layoutType: "hero" | "split_image_text" | "grid_3" | "quote" | "statement" | "debate" | "lectura" | "actividad" | "resumen";
        theme?: "dark" | "light" | "primary" | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    titulo_presentacion: string;
    diapositivas: {
        content: {
            body?: string | undefined;
            title?: string | undefined;
            items?: string[] | undefined;
            kicker?: string | undefined;
            imagePrompt?: string | undefined;
            imageUrl?: string | undefined;
        };
        layoutType: "hero" | "split_image_text" | "grid_3" | "quote" | "statement" | "debate" | "lectura" | "actividad" | "resumen";
        theme: "dark" | "light" | "primary";
    }[];
}, {
    titulo_presentacion: string;
    diapositivas: {
        content: {
            body?: string | undefined;
            title?: string | undefined;
            items?: string[] | undefined;
            kicker?: string | undefined;
            imagePrompt?: string | undefined;
            imageUrl?: string | undefined;
        };
        layoutType: "hero" | "split_image_text" | "grid_3" | "quote" | "statement" | "debate" | "lectura" | "actividad" | "resumen";
        theme?: "dark" | "light" | "primary" | undefined;
    }[];
}>;
export declare const RubricaItemSchema: z.ZodObject<{
    criterio: z.ZodString;
    nivel_destacado: z.ZodString;
    nivel_logrado: z.ZodString;
    nivel_en_proceso: z.ZodString;
}, "strip", z.ZodTypeAny, {
    criterio: string;
    nivel_destacado: string;
    nivel_logrado: string;
    nivel_en_proceso: string;
}, {
    criterio: string;
    nivel_destacado: string;
    nivel_logrado: string;
    nivel_en_proceso: string;
}>;
export declare const EvaluacionSecuenciaSchema: z.ZodObject<{
    diagnostica: z.ZodString;
    formativa: z.ZodString;
    final: z.ZodString;
    rubricas: z.ZodArray<z.ZodObject<{
        criterio: z.ZodString;
        nivel_destacado: z.ZodString;
        nivel_logrado: z.ZodString;
        nivel_en_proceso: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        criterio: string;
        nivel_destacado: string;
        nivel_logrado: string;
        nivel_en_proceso: string;
    }, {
        criterio: string;
        nivel_destacado: string;
        nivel_logrado: string;
        nivel_en_proceso: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    diagnostica: string;
    formativa: string;
    final: string;
    rubricas: {
        criterio: string;
        nivel_destacado: string;
        nivel_logrado: string;
        nivel_en_proceso: string;
    }[];
}, {
    diagnostica: string;
    formativa: string;
    final: string;
    rubricas: {
        criterio: string;
        nivel_destacado: string;
        nivel_logrado: string;
        nivel_en_proceso: string;
    }[];
}>;
export declare const ClaseSecuenciaItemSchema: z.ZodObject<{
    numero: z.ZodNumber;
    titulo: z.ZodString;
    duracion_minutos: z.ZodNumber;
    objetivo: z.ZodString;
    momentos: z.ZodObject<{
        inicio: z.ZodObject<{
            tiempo_minutos: z.ZodNumber;
            nota_para_docente: z.ZodString;
            consigna_literal_alumno: z.ZodString;
            registro_carpeta_tarea: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        }, {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        }>;
        desarrollo: z.ZodObject<{
            tiempo_minutos: z.ZodNumber;
            nota_para_docente: z.ZodString;
            consigna_literal_alumno: z.ZodString;
            registro_carpeta_tarea: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        }, {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        }>;
        cierre: z.ZodObject<{
            tiempo_minutos: z.ZodNumber;
            nota_para_docente: z.ZodString;
            consigna_literal_alumno: z.ZodString;
            registro_carpeta_tarea: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        }, {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        inicio: {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        };
        desarrollo: {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        };
        cierre: {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        };
    }, {
        inicio: {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        };
        desarrollo: {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        };
        cierre: {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    titulo: string;
    duracion_minutos: number;
    momentos: {
        inicio: {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        };
        desarrollo: {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        };
        cierre: {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        };
    };
    numero: number;
    objetivo: string;
}, {
    titulo: string;
    duracion_minutos: number;
    momentos: {
        inicio: {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        };
        desarrollo: {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        };
        cierre: {
            tiempo_minutos: number;
            nota_para_docente: string;
            consigna_literal_alumno: string;
            registro_carpeta_tarea?: string | undefined;
        };
    };
    numero: number;
    objetivo: string;
}>;
export declare const SecuenciaDidacticaSchema: z.ZodObject<{
    titulo: z.ZodString;
    espacio_curricular: z.ZodString;
    curso: z.ZodString;
    tema: z.ZodString;
    cantidad_clases: z.ZodNumber;
    fundamentacion: z.ZodString;
    objetivos: z.ZodArray<z.ZodString, "many">;
    capacidades: z.ZodArray<z.ZodString, "many">;
    clases: z.ZodArray<z.ZodObject<{
        numero: z.ZodNumber;
        titulo: z.ZodString;
        duracion_minutos: z.ZodNumber;
        objetivo: z.ZodString;
        momentos: z.ZodObject<{
            inicio: z.ZodObject<{
                tiempo_minutos: z.ZodNumber;
                nota_para_docente: z.ZodString;
                consigna_literal_alumno: z.ZodString;
                registro_carpeta_tarea: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                tiempo_minutos: number;
                nota_para_docente: string;
                consigna_literal_alumno: string;
                registro_carpeta_tarea?: string | undefined;
            }, {
                tiempo_minutos: number;
                nota_para_docente: string;
                consigna_literal_alumno: string;
                registro_carpeta_tarea?: string | undefined;
            }>;
            desarrollo: z.ZodObject<{
                tiempo_minutos: z.ZodNumber;
                nota_para_docente: z.ZodString;
                consigna_literal_alumno: z.ZodString;
                registro_carpeta_tarea: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                tiempo_minutos: number;
                nota_para_docente: string;
                consigna_literal_alumno: string;
                registro_carpeta_tarea?: string | undefined;
            }, {
                tiempo_minutos: number;
                nota_para_docente: string;
                consigna_literal_alumno: string;
                registro_carpeta_tarea?: string | undefined;
            }>;
            cierre: z.ZodObject<{
                tiempo_minutos: z.ZodNumber;
                nota_para_docente: z.ZodString;
                consigna_literal_alumno: z.ZodString;
                registro_carpeta_tarea: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                tiempo_minutos: number;
                nota_para_docente: string;
                consigna_literal_alumno: string;
                registro_carpeta_tarea?: string | undefined;
            }, {
                tiempo_minutos: number;
                nota_para_docente: string;
                consigna_literal_alumno: string;
                registro_carpeta_tarea?: string | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            inicio: {
                tiempo_minutos: number;
                nota_para_docente: string;
                consigna_literal_alumno: string;
                registro_carpeta_tarea?: string | undefined;
            };
            desarrollo: {
                tiempo_minutos: number;
                nota_para_docente: string;
                consigna_literal_alumno: string;
                registro_carpeta_tarea?: string | undefined;
            };
            cierre: {
                tiempo_minutos: number;
                nota_para_docente: string;
                consigna_literal_alumno: string;
                registro_carpeta_tarea?: string | undefined;
            };
        }, {
            inicio: {
                tiempo_minutos: number;
                nota_para_docente: string;
                consigna_literal_alumno: string;
                registro_carpeta_tarea?: string | undefined;
            };
            desarrollo: {
                tiempo_minutos: number;
                nota_para_docente: string;
                consigna_literal_alumno: string;
                registro_carpeta_tarea?: string | undefined;
            };
            cierre: {
                tiempo_minutos: number;
                nota_para_docente: string;
                consigna_literal_alumno: string;
                registro_carpeta_tarea?: string | undefined;
            };
        }>;
    }, "strip", z.ZodTypeAny, {
        titulo: string;
        duracion_minutos: number;
        momentos: {
            inicio: {
                tiempo_minutos: number;
                nota_para_docente: string;
                consigna_literal_alumno: string;
                registro_carpeta_tarea?: string | undefined;
            };
            desarrollo: {
                tiempo_minutos: number;
                nota_para_docente: string;
                consigna_literal_alumno: string;
                registro_carpeta_tarea?: string | undefined;
            };
            cierre: {
                tiempo_minutos: number;
                nota_para_docente: string;
                consigna_literal_alumno: string;
                registro_carpeta_tarea?: string | undefined;
            };
        };
        numero: number;
        objetivo: string;
    }, {
        titulo: string;
        duracion_minutos: number;
        momentos: {
            inicio: {
                tiempo_minutos: number;
                nota_para_docente: string;
                consigna_literal_alumno: string;
                registro_carpeta_tarea?: string | undefined;
            };
            desarrollo: {
                tiempo_minutos: number;
                nota_para_docente: string;
                consigna_literal_alumno: string;
                registro_carpeta_tarea?: string | undefined;
            };
            cierre: {
                tiempo_minutos: number;
                nota_para_docente: string;
                consigna_literal_alumno: string;
                registro_carpeta_tarea?: string | undefined;
            };
        };
        numero: number;
        objetivo: string;
    }>, "many">;
    evaluacion: z.ZodObject<{
        diagnostica: z.ZodString;
        formativa: z.ZodString;
        final: z.ZodString;
        rubricas: z.ZodArray<z.ZodObject<{
            criterio: z.ZodString;
            nivel_destacado: z.ZodString;
            nivel_logrado: z.ZodString;
            nivel_en_proceso: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            criterio: string;
            nivel_destacado: string;
            nivel_logrado: string;
            nivel_en_proceso: string;
        }, {
            criterio: string;
            nivel_destacado: string;
            nivel_logrado: string;
            nivel_en_proceso: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        diagnostica: string;
        formativa: string;
        final: string;
        rubricas: {
            criterio: string;
            nivel_destacado: string;
            nivel_logrado: string;
            nivel_en_proceso: string;
        }[];
    }, {
        diagnostica: string;
        formativa: string;
        final: string;
        rubricas: {
            criterio: string;
            nivel_destacado: string;
            nivel_logrado: string;
            nivel_en_proceso: string;
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    titulo: string;
    espacio_curricular: string;
    curso: string;
    tema: string;
    cantidad_clases: number;
    fundamentacion: string;
    objetivos: string[];
    capacidades: string[];
    clases: {
        titulo: string;
        duracion_minutos: number;
        momentos: {
            inicio: {
                tiempo_minutos: number;
                nota_para_docente: string;
                consigna_literal_alumno: string;
                registro_carpeta_tarea?: string | undefined;
            };
            desarrollo: {
                tiempo_minutos: number;
                nota_para_docente: string;
                consigna_literal_alumno: string;
                registro_carpeta_tarea?: string | undefined;
            };
            cierre: {
                tiempo_minutos: number;
                nota_para_docente: string;
                consigna_literal_alumno: string;
                registro_carpeta_tarea?: string | undefined;
            };
        };
        numero: number;
        objetivo: string;
    }[];
    evaluacion: {
        diagnostica: string;
        formativa: string;
        final: string;
        rubricas: {
            criterio: string;
            nivel_destacado: string;
            nivel_logrado: string;
            nivel_en_proceso: string;
        }[];
    };
}, {
    titulo: string;
    espacio_curricular: string;
    curso: string;
    tema: string;
    cantidad_clases: number;
    fundamentacion: string;
    objetivos: string[];
    capacidades: string[];
    clases: {
        titulo: string;
        duracion_minutos: number;
        momentos: {
            inicio: {
                tiempo_minutos: number;
                nota_para_docente: string;
                consigna_literal_alumno: string;
                registro_carpeta_tarea?: string | undefined;
            };
            desarrollo: {
                tiempo_minutos: number;
                nota_para_docente: string;
                consigna_literal_alumno: string;
                registro_carpeta_tarea?: string | undefined;
            };
            cierre: {
                tiempo_minutos: number;
                nota_para_docente: string;
                consigna_literal_alumno: string;
                registro_carpeta_tarea?: string | undefined;
            };
        };
        numero: number;
        objetivo: string;
    }[];
    evaluacion: {
        diagnostica: string;
        formativa: string;
        final: string;
        rubricas: {
            criterio: string;
            nivel_destacado: string;
            nivel_logrado: string;
            nivel_en_proceso: string;
        }[];
    };
}>;
export declare const GeneracionRecursoSchema: z.ZodObject<{
    id: z.ZodString;
    materiaId: z.ZodString;
    tipo: z.ZodEnum<["RESUMEN", "GUIA_ESTUDIO", "EVALUACION", "MAPA_CONCEPTUAL", "CLASE", "PRESENTACION", "SECUENCIA_DIDACTICA", "SECUENCIA"]>;
    titulo: z.ZodString;
    contenido: z.ZodString;
    fuenteContenidoId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    materiaId: string;
    tipo: "PRESENTACION" | "RESUMEN" | "GUIA_ESTUDIO" | "EVALUACION" | "MAPA_CONCEPTUAL" | "CLASE" | "SECUENCIA_DIDACTICA" | "SECUENCIA";
    contenido: string;
    titulo: string;
    createdAt?: string | undefined;
    fuenteContenidoId?: string | null | undefined;
    updatedAt?: string | undefined;
}, {
    id: string;
    materiaId: string;
    tipo: "PRESENTACION" | "RESUMEN" | "GUIA_ESTUDIO" | "EVALUACION" | "MAPA_CONCEPTUAL" | "CLASE" | "SECUENCIA_DIDACTICA" | "SECUENCIA";
    contenido: string;
    titulo: string;
    createdAt?: string | undefined;
    fuenteContenidoId?: string | null | undefined;
    updatedAt?: string | undefined;
}>;
export declare const RecursoPayloadSchema: z.ZodObject<{
    materiaId: z.ZodString;
    tipo: z.ZodEnum<["RESUMEN", "GUIA_ESTUDIO", "EVALUACION", "MAPA_CONCEPTUAL", "CLASE", "PRESENTACION", "SECUENCIA_DIDACTICA", "SECUENCIA"]>;
    titulo: z.ZodString;
    contenido: z.ZodString;
}, "strip", z.ZodTypeAny, {
    materiaId: string;
    tipo: "PRESENTACION" | "RESUMEN" | "GUIA_ESTUDIO" | "EVALUACION" | "MAPA_CONCEPTUAL" | "CLASE" | "SECUENCIA_DIDACTICA" | "SECUENCIA";
    contenido: string;
    titulo: string;
}, {
    materiaId: string;
    tipo: "PRESENTACION" | "RESUMEN" | "GUIA_ESTUDIO" | "EVALUACION" | "MAPA_CONCEPTUAL" | "CLASE" | "SECUENCIA_DIDACTICA" | "SECUENCIA";
    contenido: string;
    titulo: string;
}>;
export declare const EstadoClaseEnum: z.ZodEnum<["Planificada", "Completada", "Suspendida", "planificada", "dada", "cancelada", "postergada", "CANCELADA"]>;
export declare const ClaseSpreadsheetSchema: z.ZodObject<{
    id: z.ZodString;
    materiaId: z.ZodOptional<z.ZodString>;
    materiaNombre: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    fecha: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    numeroClase: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    unidad: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    caracteristicaClase: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    temaDia: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    actividadesPropuestas: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    observaciones: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    novedades: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    estado: z.ZodDefault<z.ZodEnum<["Planificada", "Completada", "Suspendida", "planificada", "dada", "cancelada", "postergada", "CANCELADA"]>>;
    color: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    tipo: z.ZodOptional<z.ZodLiteral<"clase">>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    estado: "Planificada" | "Completada" | "Suspendida" | "planificada" | "dada" | "cancelada" | "postergada" | "CANCELADA";
    color?: string | null | undefined;
    createdAt?: string | undefined;
    materiaId?: string | undefined;
    tipo?: "clase" | undefined;
    updatedAt?: string | undefined;
    materiaNombre?: string | null | undefined;
    fecha?: string | null | undefined;
    numeroClase?: number | null | undefined;
    unidad?: string | null | undefined;
    caracteristicaClase?: string | null | undefined;
    temaDia?: string | null | undefined;
    actividadesPropuestas?: string | null | undefined;
    observaciones?: string | null | undefined;
    novedades?: string | null | undefined;
}, {
    id: string;
    color?: string | null | undefined;
    createdAt?: string | undefined;
    materiaId?: string | undefined;
    tipo?: "clase" | undefined;
    updatedAt?: string | undefined;
    materiaNombre?: string | null | undefined;
    fecha?: string | null | undefined;
    numeroClase?: number | null | undefined;
    unidad?: string | null | undefined;
    caracteristicaClase?: string | null | undefined;
    temaDia?: string | null | undefined;
    actividadesPropuestas?: string | null | undefined;
    observaciones?: string | null | undefined;
    novedades?: string | null | undefined;
    estado?: "Planificada" | "Completada" | "Suspendida" | "planificada" | "dada" | "cancelada" | "postergada" | "CANCELADA" | undefined;
}>;
export declare const RecordatorioSchema: z.ZodObject<{
    id: z.ZodString;
    titulo: z.ZodString;
    contenido: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    fecha: z.ZodString;
    color: z.ZodDefault<z.ZodString>;
    tipo: z.ZodOptional<z.ZodLiteral<"recordatorio">>;
    usuarioId: z.ZodOptional<z.ZodString>;
    materiaId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    materiaNombre: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    color: string;
    titulo: string;
    fecha: string;
    createdAt?: string | undefined;
    materiaId?: string | null | undefined;
    tipo?: "recordatorio" | undefined;
    usuarioId?: string | undefined;
    contenido?: string | null | undefined;
    updatedAt?: string | undefined;
    materiaNombre?: string | null | undefined;
}, {
    id: string;
    titulo: string;
    fecha: string;
    color?: string | undefined;
    createdAt?: string | undefined;
    materiaId?: string | null | undefined;
    tipo?: "recordatorio" | undefined;
    usuarioId?: string | undefined;
    contenido?: string | null | undefined;
    updatedAt?: string | undefined;
    materiaNombre?: string | null | undefined;
}>;
export declare const EventosCalendarioResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    clases: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        materiaId: z.ZodOptional<z.ZodString>;
        materiaNombre: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        fecha: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        numeroClase: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        unidad: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        caracteristicaClase: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        temaDia: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        actividadesPropuestas: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        observaciones: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        novedades: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        estado: z.ZodDefault<z.ZodEnum<["Planificada", "Completada", "Suspendida", "planificada", "dada", "cancelada", "postergada", "CANCELADA"]>>;
        color: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        tipo: z.ZodOptional<z.ZodLiteral<"clase">>;
        createdAt: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        estado: "Planificada" | "Completada" | "Suspendida" | "planificada" | "dada" | "cancelada" | "postergada" | "CANCELADA";
        color?: string | null | undefined;
        createdAt?: string | undefined;
        materiaId?: string | undefined;
        tipo?: "clase" | undefined;
        updatedAt?: string | undefined;
        materiaNombre?: string | null | undefined;
        fecha?: string | null | undefined;
        numeroClase?: number | null | undefined;
        unidad?: string | null | undefined;
        caracteristicaClase?: string | null | undefined;
        temaDia?: string | null | undefined;
        actividadesPropuestas?: string | null | undefined;
        observaciones?: string | null | undefined;
        novedades?: string | null | undefined;
    }, {
        id: string;
        color?: string | null | undefined;
        createdAt?: string | undefined;
        materiaId?: string | undefined;
        tipo?: "clase" | undefined;
        updatedAt?: string | undefined;
        materiaNombre?: string | null | undefined;
        fecha?: string | null | undefined;
        numeroClase?: number | null | undefined;
        unidad?: string | null | undefined;
        caracteristicaClase?: string | null | undefined;
        temaDia?: string | null | undefined;
        actividadesPropuestas?: string | null | undefined;
        observaciones?: string | null | undefined;
        novedades?: string | null | undefined;
        estado?: "Planificada" | "Completada" | "Suspendida" | "planificada" | "dada" | "cancelada" | "postergada" | "CANCELADA" | undefined;
    }>, "many">;
    recordatorios: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        titulo: z.ZodString;
        contenido: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        fecha: z.ZodString;
        color: z.ZodDefault<z.ZodString>;
        tipo: z.ZodOptional<z.ZodLiteral<"recordatorio">>;
        usuarioId: z.ZodOptional<z.ZodString>;
        materiaId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        materiaNombre: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        createdAt: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        color: string;
        titulo: string;
        fecha: string;
        createdAt?: string | undefined;
        materiaId?: string | null | undefined;
        tipo?: "recordatorio" | undefined;
        usuarioId?: string | undefined;
        contenido?: string | null | undefined;
        updatedAt?: string | undefined;
        materiaNombre?: string | null | undefined;
    }, {
        id: string;
        titulo: string;
        fecha: string;
        color?: string | undefined;
        createdAt?: string | undefined;
        materiaId?: string | null | undefined;
        tipo?: "recordatorio" | undefined;
        usuarioId?: string | undefined;
        contenido?: string | null | undefined;
        updatedAt?: string | undefined;
        materiaNombre?: string | null | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    clases: {
        id: string;
        estado: "Planificada" | "Completada" | "Suspendida" | "planificada" | "dada" | "cancelada" | "postergada" | "CANCELADA";
        color?: string | null | undefined;
        createdAt?: string | undefined;
        materiaId?: string | undefined;
        tipo?: "clase" | undefined;
        updatedAt?: string | undefined;
        materiaNombre?: string | null | undefined;
        fecha?: string | null | undefined;
        numeroClase?: number | null | undefined;
        unidad?: string | null | undefined;
        caracteristicaClase?: string | null | undefined;
        temaDia?: string | null | undefined;
        actividadesPropuestas?: string | null | undefined;
        observaciones?: string | null | undefined;
        novedades?: string | null | undefined;
    }[];
    recordatorios: {
        id: string;
        color: string;
        titulo: string;
        fecha: string;
        createdAt?: string | undefined;
        materiaId?: string | null | undefined;
        tipo?: "recordatorio" | undefined;
        usuarioId?: string | undefined;
        contenido?: string | null | undefined;
        updatedAt?: string | undefined;
        materiaNombre?: string | null | undefined;
    }[];
}, {
    success: boolean;
    clases: {
        id: string;
        color?: string | null | undefined;
        createdAt?: string | undefined;
        materiaId?: string | undefined;
        tipo?: "clase" | undefined;
        updatedAt?: string | undefined;
        materiaNombre?: string | null | undefined;
        fecha?: string | null | undefined;
        numeroClase?: number | null | undefined;
        unidad?: string | null | undefined;
        caracteristicaClase?: string | null | undefined;
        temaDia?: string | null | undefined;
        actividadesPropuestas?: string | null | undefined;
        observaciones?: string | null | undefined;
        novedades?: string | null | undefined;
        estado?: "Planificada" | "Completada" | "Suspendida" | "planificada" | "dada" | "cancelada" | "postergada" | "CANCELADA" | undefined;
    }[];
    recordatorios: {
        id: string;
        titulo: string;
        fecha: string;
        color?: string | undefined;
        createdAt?: string | undefined;
        materiaId?: string | null | undefined;
        tipo?: "recordatorio" | undefined;
        usuarioId?: string | undefined;
        contenido?: string | null | undefined;
        updatedAt?: string | undefined;
        materiaNombre?: string | null | undefined;
    }[];
}>;
export declare const LibroTemaArbolSchema: z.ZodObject<{
    id: z.ZodString;
    materiaId: z.ZodString;
    cicloLectivo: z.ZodOptional<z.ZodNumber>;
    cursoDivision: z.ZodOptional<z.ZodString>;
    unidades: z.ZodOptional<z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    materiaId: string;
    cicloLectivo?: number | undefined;
    cursoDivision?: string | undefined;
    unidades?: Record<string, unknown>[] | undefined;
}, {
    id: string;
    materiaId: string;
    cicloLectivo?: number | undefined;
    cursoDivision?: string | undefined;
    unidades?: Record<string, unknown>[] | undefined;
}>;
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
export declare const ComentarioIASchema: z.ZodObject<{
    id: z.ZodString;
    sugerencia: z.ZodString;
    criterio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    aprobado: z.ZodDefault<z.ZodBoolean>;
    entregaId: z.ZodString;
    createdAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    sugerencia: string;
    aprobado: boolean;
    entregaId: string;
    createdAt?: string | Date | undefined;
    criterio?: string | null | undefined;
}, {
    id: string;
    sugerencia: string;
    entregaId: string;
    createdAt?: string | Date | undefined;
    criterio?: string | null | undefined;
    aprobado?: boolean | undefined;
}>;
export declare const EntregaAlumnoSchema: z.ZodObject<{
    id: z.ZodString;
    nombreOriginal: z.ZodString;
    archivoUrl: z.ZodString;
    evaluacionId: z.ZodString;
    notaFinal: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    createdAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    comentarios: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        sugerencia: z.ZodString;
        criterio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        aprobado: z.ZodDefault<z.ZodBoolean>;
        entregaId: z.ZodString;
        createdAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        sugerencia: string;
        aprobado: boolean;
        entregaId: string;
        createdAt?: string | Date | undefined;
        criterio?: string | null | undefined;
    }, {
        id: string;
        sugerencia: string;
        entregaId: string;
        createdAt?: string | Date | undefined;
        criterio?: string | null | undefined;
        aprobado?: boolean | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    nombreOriginal: string;
    archivoUrl: string;
    evaluacionId: string;
    createdAt?: string | Date | undefined;
    notaFinal?: string | null | undefined;
    comentarios?: {
        id: string;
        sugerencia: string;
        aprobado: boolean;
        entregaId: string;
        createdAt?: string | Date | undefined;
        criterio?: string | null | undefined;
    }[] | undefined;
}, {
    id: string;
    nombreOriginal: string;
    archivoUrl: string;
    evaluacionId: string;
    createdAt?: string | Date | undefined;
    notaFinal?: string | null | undefined;
    comentarios?: {
        id: string;
        sugerencia: string;
        entregaId: string;
        createdAt?: string | Date | undefined;
        criterio?: string | null | undefined;
        aprobado?: boolean | undefined;
    }[] | undefined;
}>;
export declare const EvaluacionBaseSchema: z.ZodObject<{
    id: z.ZodString;
    titulo: z.ZodString;
    consignas: z.ZodString;
    criterios: z.ZodString;
    materiaId: z.ZodString;
    createdAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    entregas: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        nombreOriginal: z.ZodString;
        archivoUrl: z.ZodString;
        evaluacionId: z.ZodString;
        notaFinal: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        createdAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
        comentarios: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            sugerencia: z.ZodString;
            criterio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            aprobado: z.ZodDefault<z.ZodBoolean>;
            entregaId: z.ZodString;
            createdAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            sugerencia: string;
            aprobado: boolean;
            entregaId: string;
            createdAt?: string | Date | undefined;
            criterio?: string | null | undefined;
        }, {
            id: string;
            sugerencia: string;
            entregaId: string;
            createdAt?: string | Date | undefined;
            criterio?: string | null | undefined;
            aprobado?: boolean | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        nombreOriginal: string;
        archivoUrl: string;
        evaluacionId: string;
        createdAt?: string | Date | undefined;
        notaFinal?: string | null | undefined;
        comentarios?: {
            id: string;
            sugerencia: string;
            aprobado: boolean;
            entregaId: string;
            createdAt?: string | Date | undefined;
            criterio?: string | null | undefined;
        }[] | undefined;
    }, {
        id: string;
        nombreOriginal: string;
        archivoUrl: string;
        evaluacionId: string;
        createdAt?: string | Date | undefined;
        notaFinal?: string | null | undefined;
        comentarios?: {
            id: string;
            sugerencia: string;
            entregaId: string;
            createdAt?: string | Date | undefined;
            criterio?: string | null | undefined;
            aprobado?: boolean | undefined;
        }[] | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    materiaId: string;
    titulo: string;
    consignas: string;
    criterios: string;
    createdAt?: string | Date | undefined;
    entregas?: {
        id: string;
        nombreOriginal: string;
        archivoUrl: string;
        evaluacionId: string;
        createdAt?: string | Date | undefined;
        notaFinal?: string | null | undefined;
        comentarios?: {
            id: string;
            sugerencia: string;
            aprobado: boolean;
            entregaId: string;
            createdAt?: string | Date | undefined;
            criterio?: string | null | undefined;
        }[] | undefined;
    }[] | undefined;
}, {
    id: string;
    materiaId: string;
    titulo: string;
    consignas: string;
    criterios: string;
    createdAt?: string | Date | undefined;
    entregas?: {
        id: string;
        nombreOriginal: string;
        archivoUrl: string;
        evaluacionId: string;
        createdAt?: string | Date | undefined;
        notaFinal?: string | null | undefined;
        comentarios?: {
            id: string;
            sugerencia: string;
            entregaId: string;
            createdAt?: string | Date | undefined;
            criterio?: string | null | undefined;
            aprobado?: boolean | undefined;
        }[] | undefined;
    }[] | undefined;
}>;
export declare const CreateEvaluacionPayloadSchema: z.ZodObject<{
    titulo: z.ZodString;
    consignas: z.ZodString;
    criterios: z.ZodString;
    materiaId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    materiaId: string;
    titulo: string;
    consignas: string;
    criterios: string;
}, {
    materiaId: string;
    titulo: string;
    consignas: string;
    criterios: string;
}>;
export type ComentarioIA = z.infer<typeof ComentarioIASchema>;
export type EntregaAlumno = z.infer<typeof EntregaAlumnoSchema>;
export type EvaluacionBase = z.infer<typeof EvaluacionBaseSchema>;
export type CreateEvaluacionPayload = z.infer<typeof CreateEvaluacionPayloadSchema>;
