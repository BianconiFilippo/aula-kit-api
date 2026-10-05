import 'dotenv/config';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import {
  CurriculoExtraccionResponse,
  CurriculoExtraccionResponseSchema,
} from './ai.schema';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn(
    '[ai.service] Advertencia: OPENAI_API_KEY no está definida en las variables de entorno.'
  );
}

const openai = new OpenAI({
  apiKey: apiKey || '',
});

export interface ContextoPrevioCurricular {
  ultimaMeta?: string;
  ultimoNivel?: string;
  ultimoEspacio?: string;
}

/**
 * Procesa un fragmento (chunk) de un documento curricular mediante OpenAI
 * forzando la respuesta a coincidir con el esquema Zod estructurado.
 * Utiliza memoria contextual previa para páginas que son continuación de una Meta anterior.
 * @param textoChunk Texto del bloque de páginas a analizar.
 * @param contextoPrevio Memoria de la última meta y nivel analizados.
 * @returns Progresiones encontradas en este fragmento.
 */
export async function extraerEstructuraCurricularConIA(
  textoChunk: string,
  contextoPrevio?: ContextoPrevioCurricular
): Promise<CurriculoExtraccionResponse> {
  const contextoInfo = contextoPrevio?.ultimaMeta
    ? `\n\nCONTEXTO PREVIO HEREDADO DE PÁGINAS ANTERIORES:\n- Último Nivel: ${contextoPrevio.ultimoNivel || 'N/A'}\n- Último Espacio: ${contextoPrevio.ultimoEspacio || 'N/A'}\n- Última Meta Activa: "${contextoPrevio.ultimaMeta}"\n(Si las primeras páginas de este fragmento no tienen un nuevo título de 'Meta' explícito, los aprendizajes iniciales continúan perteneciendo a esta 'Última Meta Activa').`
    : '';

  const systemPrompt = `
Actúa como un especialista senior en diseño curricular, pedagogía y extracción estructurada de bases de datos educativas.
Tu tarea es analizar el texto oficial del Diseño Curricular / Progresiones de Aprendizaje y extraer con fidelidad exacta las progresiones formativas.

═══════════════════════════════════════════════════════════════════════════════
ESTRUCTURA DEL DOCUMENTO Y REGLAS FUNDAMENTALES DE EXTRACCIÓN:
═══════════════════════════════════════════════════════════════════════════════

1. DISTINCIÓN CRÍTICA ENTRE "META" Y "APRENDIZAJE Y CONTENIDO":
   - La "Meta" es el propósito general del ciclo que se encuentra SIEMPRE dentro del recuadro o sección titulada explícitamente "Meta" al inicio de una unidad.
   - Los "Aprendizajes y contenidos" son los contenidos formativos puntuales que van precedidos por el título "Aprendizaje y contenido" y tienen debajo sus "Indicadores de logro".
   - ⚠️ PROHIBICIÓN ESTRICTA: NUNCA utilices un texto de "Aprendizaje y contenido" como "meta_proposito".
   - Si una página es continuación de la página anterior y NO contiene un nuevo cuadro de "Meta", debes asignar a esos bloques la Meta activa correspondiente (utilizando la Meta Activa del encabezado de ese pliego o el Contexto Previo provisto).

2. SEPARACIÓN ESTRICTA POR GRADO / AÑO / SALA:
   - Una misma "Meta" encabeza un ciclo o par de grados (ejemplo visible en encabezados: "Educación Primaria · 3.° y 4.° grado").
   - En las páginas existen columnas o bloques diferenciados con badges para cada grado (ej: "3.° grado" en una columna y "4.° grado" en otra).
   - REGLA: DEBES GENERAR UN OBJETO DE PROGRESIÓN INDEPENDIENTE PARA CADA GRADO.
     • Si una meta se comparte entre 3.° grado y 4.° grado, crea UNA progresión con ciclo_grado="3° Grado" con sus bloques correspondientes, y OTRA progresión con ciclo_grado="4° Grado" con los bloques correspondientes a 4° grado. NUNCA mezcles los aprendizajes de diferentes grados en un solo registro.

3. CAMPOS DE CADA PROGRESIÓN:
   - "nivel": Nivel educativo (ej: "Educación Inicial", "Educación Primaria", "Educación Secundaria").
   - "ciclo_grado": Grado exacto normalizado (ej: "Sala de 3", "Sala de 4", "Sala de 5", "1° Grado", "2° Grado", "3° Grado", "4° Grado", "5° Grado", "6° Grado", "1° Año", "2° Año", "3° Año", "4° Año", "5° Año", "6° Año", "Ciclo Básico", "Ciclo Orientado").
   - "espacio_curricular": Nombre del espacio curricular (ej: "Lengua Extranjera-Inglés", "Matemática", "Ciencias Naturales", "Ciencias Sociales", "Ciudadanía y Humanidades", "Educación Tecnológica y Ciencias de la Computación", "Formación para la Vida y el Trabajo").
   - "meta_proposito": Texto literal y completo de la "Meta" oficial (NUNCA un aprendizaje).
   - "bloques": Lista de TODOS los bloques de aprendizaje asociados a ese grado:
     • "aprendizaje_y_contenido": Texto literal del aprendizaje y contenido.
     • "indicadores_de_logro": Array con cada uno de los criterios o indicadores formativos de evaluación.

4. REGLAS DE CONTROL:
   - Si el fragmento es solo portada, índice general o texto introductorio sin tablas pedagógicas, devuelve: { "progresiones": [] }.
   - Conserva la redacción textual exacta sin resumir ni abreviar.${contextoInfo}
`;

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Extrae todas las progresiones curriculares distinguiendo estrictamente cada grado y respetando las metas del siguiente texto:\n\n${textoChunk}`,
      },
    ],
    response_format: zodResponseFormat(
      CurriculoExtraccionResponseSchema,
      'curriculum_extraction'
    ),
    temperature: 0.1,
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    if (completion.choices[0]?.message?.refusal) {
      console.warn(`[ai.service] OpenAI rechazó el fragmento: ${completion.choices[0].message.refusal}`);
      return { progresiones: [] };
    }
    return { progresiones: [] };
  }

  try {
    const parsedJson = JSON.parse(content);
    const parsed = CurriculoExtraccionResponseSchema.parse(parsedJson);
    return parsed;
  } catch (err: any) {
    console.error('[ai.service] Error parseando respuesta JSON:', err.message);
    return { progresiones: [] };
  }
}
