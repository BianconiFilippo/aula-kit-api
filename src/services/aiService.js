const { OpenAI } = require('openai');
const prisma = require('./db.js');
const { randomUUID } = require('crypto');
const axios = require('axios');
const supabase = require('./supabase');
const { PresentacionSchema } = require('../dtos/presentacion.dto.js');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ─────────────────────────────────────────────────────────────────────────────
// Función existente: Resumen multi-fuente
// ─────────────────────────────────────────────────────────────────────────────
async function generarResumenMultifuente(materiaId, fuenteIds, instruccionesExtra = '', textoBase = null) {
  try {
    let textoCombinado = '';

    if (textoBase) {
      textoCombinado = textoBase;
    } else {
      const fuentes = await prisma.fuenteContenido.findMany({
        where: {
          id: { in: fuenteIds },
          materiaId: materiaId
        }
      });

      if (fuentes.length === 0) {
        throw new Error('No se encontraron los archivos seleccionados o no tienen texto.');
      }

      textoCombinado = fuentes
        .map(f => `--- Documento: ${f.nombreArchivo} ---\n${f.textoExtraido}`)
        .join('\n\n');
    }

    if (textoCombinado.length > 30000) {
      console.warn('El texto combinado es muy largo. Recortando para evitar errores...');
      textoCombinado = textoCombinado.substring(0, 30000);
    }

    let systemPrompt = `Actúa como un "Editor de Libros de Texto Modernos". Tu tarea es leer los textos proporcionados y generar un resumen pedagógico estructurado y profundo.

Regla de Jerarquía: Estructura el contenido utilizando secciones principales y, si el tema es complejo, utiliza subsecciones para dividir la información.

Regla de Imágenes: Debes insertar bloques de tipo 'imagen_ai' solo donde visualmente aporten a la comprensión (ej. diagramas, conceptos clave, personajes históricos). No satures el documento. Cuando decidas usar una imagen, el contenido debe ser un Prompt descriptivo en inglés optimizado para DALL-E 3.

Debes devolver estrictamente un objeto JSON con la siguiente estructura exacta:
{
  "titulo_resumen": "string",
  "secciones": [
    {
      "titulo_seccion": "string",
      "bloques": [
        {
          "tipo": "parrafo | subseccion | lista | imagen_ai",
          "contenido": "string (texto, subtítulo, o prompt en inglés si es imagen_ai)",
          "items": ["string"] // Opcional, solo usar si el tipo es 'lista'
        }
      ]
    }
  ]
}`;

    if (instruccionesExtra && instruccionesExtra.trim().length > 0) {
      systemPrompt += `\n\nATENCIÓN - Instrucciones específicas del usuario: ${instruccionesExtra}`;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Por favor, resume el siguiente contenido de mis apuntes:\n\n${textoCombinado}` }
      ]
    });

    const textoResumen = completion.choices[0].message.content;
    const objetoResumen = JSON.parse(textoResumen);

    return objetoResumen;
  } catch (error) {
    console.error('Error en el servicio de IA (resumen):', error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Nueva función: Generación de Clase en 3 pasos
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Genera una "Clase" estructurada en 3 pasos a partir de un texto base.
 * @param {string} textoBase          - Texto extraído del material fuente.
 * @param {string} instruccionesExtra - Instrucciones opcionales del docente.
 * @returns {Promise<Object>} Objeto JSON con la estructura de 3 pasos.
 */
async function generarClase(textoBase, instruccionesExtra = '') {
  const systemPrompt = `Eres un diseñador instruccional experto en pedagogía activa. Tu tarea es analizar el texto proporcionado y crear una clase completa estructurada en exactamente 3 pasos.

Debes devolver ÚNICAMENTE un objeto JSON válido con la siguiente estructura exacta, sin texto adicional:
{
  "titulo_clase": "string — título descriptivo y atractivo para la clase",
  "paso_1_debate": {
    "pregunta_disparadora": "string — una pregunta abierta, provocadora y reflexiva para iniciar la clase",
    "contexto_debate": "string — 2-3 oraciones explicando el propósito de la pregunta y qué se espera del debate"
  },
  "paso_2_contenido": [
    { "subtitulo": "string", "parrafo": "string — desarrollo profundo del subtema, mínimo 3 oraciones" }
  ],
  "paso_3_evaluacion": [
    "string — pregunta de evaluación conceptual o aplicada"
  ]
}

Reglas estrictas:
- paso_2_contenido debe tener entre 3 y 6 objetos con subtítulo y párrafo.
- paso_3_evaluacion debe tener entre 3 y 5 preguntas variadas (conceptuales, aplicadas, de análisis).
- Responde SOLO con el JSON, sin bloques de código ni explicaciones.`;

  let userMessage = `Analiza el siguiente texto y genera la clase estructurada:\n\n${textoBase}`;
  if (instruccionesExtra && instruccionesExtra.trim().length > 0) {
    userMessage += `\n\nInstrucciones adicionales del docente: ${instruccionesExtra}`;
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ]
  });

  const rawContent = completion.choices[0].message.content;

  // Parseo con validación explícita
  let resultado;
  try {
    resultado = JSON.parse(rawContent);
  } catch (parseError) {
    console.error('generarClase: La IA devolvió JSON inválido:', rawContent);
    throw new Error('La IA devolvió una respuesta con formato inválido. Intenta de nuevo.');
  }

  // Validación mínima de campos obligatorios
  if (
    !resultado.titulo_clase ||
    !resultado.paso_1_debate ||
    !Array.isArray(resultado.paso_2_contenido) ||
    !Array.isArray(resultado.paso_3_evaluacion)
  ) {
    console.error('generarClase: JSON incompleto recibido de la IA:', resultado);
    throw new Error('La respuesta de la IA no contiene todos los campos requeridos. Intenta de nuevo.');
  }

  return resultado;
}

// ─────────────────────────────────────────────────────────────────────────────
// Nueva función: Generación de Presentación estructurada basada en Layouts (Gamma model)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Genera una "Presentación" estructurada basada en tarjetas ("Layouts") a partir de un texto base.
 * @param {string} textoBase          - Texto extraído del material fuente.
 * @param {string} instruccionesExtra - Instrucciones opcionales del docente.
 * @returns {Promise<Object>} Objeto JSON con la estructura de la presentación basada en Layouts.
 */
async function generarPresentacion(textoBase, instruccionesExtra = '') {
  const systemPrompt = `Actúa como un Diseñador Instruccional Senior y Prompt Engineer experto en OpenAI. Tu tarea es analizar el texto proporcionado y estructurar una presentación educativa basada en tarjetas semánticas ("Layouts"), similar al modelo de Gamma App.

REGLAS DE CONTENIDO Y DISEÑO INSTRUCCIONAL:
1. CONTENIDO EXTENSO Y RICO: No generes resúmenes escuetos ni diapositivas vacías. El texto de cada diapositiva debe ser académicamente profundo, fluido, explicativo y pedagógicamente valioso.
2. PROHIBIDAS LAS VIÑETAS ABURRIDAS: Está estrictamente prohibido usar listas genéricas o punteadas aburridas como recurso por defecto. Organiza la información utilizando los diferentes layouts semánticos según el propósito del contenido.
3. ELECCIÓN OBLIGATORIA DE LAYOUTS (\`layoutType\`): Debes elegir obligatoriamente el layoutType que mejor represente el tipo de información:
   - 'hero': Usado para portadas, introducciones de alto impacto o aperturas de temas principales. Debe incluir 'title' y 'body' profundo, opcionalmente 'kicker' e 'imagePrompt'.
   - 'split_image_text': Usado para conceptos visuales o comparativos que combinan explicaciones detalladas con una ilustración. Requiere 'title', 'body' descriptivo extenso e 'imagePrompt' en inglés optimizado para DALL-E.
   - 'grid_3': Usado para enumerar o comparar exactamente 3 características, pilares, pasos o ejemplos clave. Debe incluir 'title', 'body' introductorio y 'items' (array de exactamente 3 strings sustanciales).
   - 'quote': Usado para conclusiones pedagógicas, citas de autores, reflexiones o testimonios clave. Debe incluir 'body' (la cita o reflexión profunda) y opcionalmente 'kicker' o 'title' (autor, fuente o contexto).
   - 'statement': Usado para mensajes fuerza, definiciones centrales, estadísticas o ideas clave de alto impacto visual. Requiere 'title' o 'body' conciso y resonante.

4. PALETA DE TEMAS (\`theme\`):
   - 'dark': Estilo oscuro, sofisticado y elegante.
   - 'light': Estilo claro, limpio y accesible.
   - 'primary': Estilo con color de acento vibrante e institucional.
   Alterna los temas entre diapositivas para darle un ritmo visual dinámico a la presentación.

5. PROMPTS DE IMAGEN (\`imagePrompt\`):
   - Cuando el layout requiera o se beneficie de una imagen ('split_image_text' o 'hero'), el campo 'imagePrompt' debe contener un prompt descriptivo en INGLÉS optimizado para DALL-E 3 (ej. "A high quality, hyper-realistic 3D render of a plant cell with labeled organelles, clean studio background, cinematic lighting").

Debes devolver ÚNICAMENTE un objeto JSON válido con la siguiente estructura exacta:
{
  "titulo_presentacion": "string — título global de la presentación",
  "diapositivas": [
    {
      "layoutType": "hero" | "split_image_text" | "grid_3" | "quote" | "statement",
      "theme": "dark" | "light" | "primary",
      "content": {
        "kicker": "string (opcional antetítulo)",
        "title": "string (opcional título)",
        "body": "string (opcional párrafo descriptivo)",
        "items": ["string", "string", "string"] (opcional, array de strings para cuadrículas),
        "imagePrompt": "string (opcional prompt en inglés para DALL-E)"
      }
    }
  ]
}`;

  let userMessage = `Analiza el siguiente texto y genera la presentación estructurada basada en Layouts:\n\n${textoBase}`;
  if (instruccionesExtra && instruccionesExtra.trim().length > 0) {
    userMessage += `\n\nInstrucciones adicionales del docente: ${instruccionesExtra}`;
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ]
  });

  const rawContent = completion.choices[0].message.content;

  let jsonParsed;
  try {
    jsonParsed = JSON.parse(rawContent);
  } catch (parseError) {
    console.error('generarPresentacion: La IA devolvió JSON inválido:', rawContent);
    throw new Error('La IA devolvió una respuesta con formato JSON inválido para la presentación.');
  }

  // Validación mediante Zod Schema
  const validation = PresentacionSchema.safeParse(jsonParsed);
  if (!validation.success) {
    console.error('generarPresentacion: Error de validación Zod:', JSON.stringify(validation.error.format(), null, 2));

    // Sanitización/Fallback si la IA estructuró ligeramente distinto
    if (jsonParsed && Array.isArray(jsonParsed.diapositivas)) {
      const validLayouts = ['hero', 'split_image_text', 'grid_3', 'quote', 'statement'];
      const validThemes = ['dark', 'light', 'primary'];

      jsonParsed.diapositivas = jsonParsed.diapositivas.map(slide => {
        return {
          layoutType: validLayouts.includes(slide.layoutType) ? slide.layoutType : 'hero',
          theme: validThemes.includes(slide.theme) ? slide.theme : 'light',
          content: {
            kicker: slide.content?.kicker || undefined,
            title: slide.content?.title || slide.titulo || undefined,
            body: slide.content?.body || slide.body || undefined,
            items: Array.isArray(slide.content?.items) ? slide.content.items : undefined,
            imagePrompt: slide.content?.imagePrompt || undefined
          }
        };
      });

      const fallbackValidation = PresentacionSchema.safeParse(jsonParsed);
      if (fallbackValidation.success) {
        return fallbackValidation.data;
      }
    }

    throw new Error('La respuesta de la IA no cumple con la estructura JSON y esquema de Layouts requerido.');
  }

  return validation.data;
}


// ─────────────────────────────────────────────────────────────────────────────
// Sugerir Datos de Unidad (Objetivos y PdA)
// ─────────────────────────────────────────────────────────────────────────────
async function sugerirDatosUnidad(materia, nivelAnio, nombreUnidad) {
  const systemPrompt = `Eres un experto en el Diseño Curricular y las Progresiones de Aprendizaje (PdA) de Argentina, enfocado en la provincia de Córdoba. Dado el nombre de una materia, el año/grado y el nombre de una unidad didáctica, debes deducir y sugerir: 1) Una lista de 3 objetivos de aprendizaje. 2) El 'Aprendizaje esperado' principal según la PdA oficial que mejor se adapte a ese tema.
Debes responder estrictamente con un objeto JSON válido con la siguiente estructura exacta:
{
  "objetivos_sugeridos": ["string", "string", "string"],
  "aprendizaje_pda_sugerido": "string"
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.5,
    max_tokens: 300,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Materia: ${materia}\nAño/Grado: ${nivelAnio}\nNombre de la unidad: ${nombreUnidad}` }
    ]
  });

  const rawContent = completion.choices[0].message.content;
  try {
    return JSON.parse(rawContent);
  } catch (parseError) {
    console.error('sugerirDatosUnidad: La IA devolvió JSON inválido:', rawContent);
    throw new Error('La IA devolvió una respuesta con formato inválido para la unidad.');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sugerir Datos de Tema (Indicador de Logro)
// ─────────────────────────────────────────────────────────────────────────────
async function sugerirDatosTema(materia, nivelAnio, nombreUnidad, pdaUnidad, nombreTema) {
  const systemPrompt = `Eres un experto en el Diseño Curricular de Córdoba, Argentina. Teniendo en cuenta el contexto de una materia, una unidad, su Aprendizaje Esperado (PdA) y el nombre de un tema específico dentro de esa unidad, debes sugerir el 'Indicador de Logro' correspondiente a ese tema.
Debes responder estrictamente con un objeto JSON válido con la siguiente estructura exacta:
{
  "indicador_logro_sugerido": "string"
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.5,
    max_tokens: 300,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Materia: ${materia}\nAño/Grado: ${nivelAnio}\nUnidad: ${nombreUnidad}\nPdA de la unidad: ${pdaUnidad}\nNombre del tema: ${nombreTema}` }
    ]
  });

  const rawContent = completion.choices[0].message.content;
  try {
    return JSON.parse(rawContent);
  } catch (parseError) {
    console.error('sugerirDatosTema: La IA devolvió JSON inválido:', rawContent);
    throw new Error('La IA devolvió una respuesta con formato inválido para el tema.');
  }
}

async function generarImagenDalle(prompt) {
  let imgUrl = null;
  try {
    let response;
    // Intenta con dall-e-3 primero
    try {
      response = await openai.images.generate({
        model: 'gpt-image-1-mini',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard'
      });
    } catch (dalle3Error) {
      console.warn('Fallo DALL-E 3, intentando fallback con DALL-E 2:', dalle3Error.message);
      // Fallback a dall-e-2
      response = await openai.images.generate({
        model: 'gpt-image-1-mini',
        prompt: prompt,
        n: 1,
        size: '512x512'
      });
    }

    if (!response.data || response.data.length === 0) {
      throw new Error('No image data returned from OpenAI API');
    }

    const imgData = response.data[0];
    if (imgData.url) {
      imgUrl = imgData.url;
    } else if (imgData.b64_json) {
      imgUrl = `data:image/png;base64,${imgData.b64_json}`;
    } else {
      throw new Error('Image response does not contain url or b64_json');
    }

    // Descarga la imagen y la sube a Supabase Storage
    try {
      let buffer;
      if (imgUrl.startsWith('data:image')) {
        const base64Data = imgUrl.split(';base64,').pop();
        buffer = Buffer.from(base64Data, 'base64');
      } else {
        const axiosRes = await axios.get(imgUrl, { responseType: 'arraybuffer' });
        buffer = Buffer.from(axiosRes.data);
      }

      const fileName = `${randomUUID()}.png`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('material_images')
        .upload(fileName, buffer, { contentType: 'image/png', upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('material_images')
        .getPublicUrl(fileName);

      console.log('Imagen subida con éxito a Supabase Storage:', publicUrl);
      return publicUrl;
    } catch (supabaseError) {
      console.error('Error al subir la imagen a Supabase Storage (se usará URL temporal):', supabaseError.message || supabaseError);
      return imgUrl; // Fallback a la URL temporal
    }
  } catch (error) {
    console.error('generarImagenDalle: Error llamando a DALL-E API:', error.message || error);
    throw error;
  }
}

async function editarRecursoConIA(tipo, instrucciones, contenidoActual) {
  try {
    const contenidoString = typeof contenidoActual === 'string'
      ? contenidoActual
      : JSON.stringify(contenidoActual);

    let formatInstructions = '';
    if (tipo === 'RESUMEN') {
      formatInstructions = `El objeto JSON debe mantener EXACTAMENTE las mismas claves principales que el objeto JSON del recurso actual.
- Si el recurso actual tiene la clave "html_content", debes devolver "html_content" (como un único string conteniendo todo el texto formateado en HTML) y no debes incluir la clave "secciones". Edita el HTML de forma limpia y mantén el formato.
- Si el recurso actual tiene la clave "secciones", debes devolver "secciones" (como un array de objetos con título y contenido) y no debes incluir la clave "html_content".
Estructura en caso de usar html_content:
{
  "titulo_principal": "string",
  "html_content": "string",
  "conceptos_clave": ["string"],
  "actividades_sugeridas": ["string"]
}
Estructura en caso de usar secciones:
{
  "titulo_principal": "string",
  "secciones": [
    {
      "titulo": "string",
      "contenido": "string"
    }
  ],
  "conceptos_clave": ["string"],
  "actividades_sugeridas": ["string"]
}`;
    } else if (tipo === 'CLASE') {
      formatInstructions = `El objeto JSON debe respetar la estructura de una Clase:
{
  "titulo_clase": "string",
  "paso_1_debate": {
    "pregunta_disparadora": "string",
    "contexto_debate": "string"
  },
  "paso_2_contenido": [
    {
      "subtitulo": "string",
      "parrafo": "string"
    }
  ],
  "paso_3_evaluacion": ["string"]
}`;
    } else if (tipo === 'PRESENTACION') {
      formatInstructions = `El objeto JSON debe respetar la estructura de una Presentación basada en Layouts:
{
  "titulo_presentacion": "string",
  "diapositivas": [
    {
      "layoutType": "hero" | "split_image_text" | "grid_3" | "quote" | "statement",
      "theme": "dark" | "light" | "primary",
      "content": {
        "kicker": "string (opcional)",
        "title": "string (opcional)",
        "body": "string (opcional)",
        "items": ["string"] (opcional),
        "imagePrompt": "string (opcional prompt DALL-E en inglés)"
      }
    }
  ]
}`;
    }

    const systemPrompt = `Eres un asistente de IA experto en diseño pedagógico y edición de recursos.
Tu tarea es modificar un recurso existente según las instrucciones específicas proporcionadas por el usuario.
Debes analizar la estructura del recurso actual en formato JSON, aplicar las modificaciones solicitadas con precisión, y devolver el recurso actualizado en el mismo formato JSON exacto sin añadir ningún comentario fuera del JSON.

Estructura requerida para el tipo ${tipo}:
${formatInstructions}

Reglas críticas:
1. Retorna estrictamente el objeto JSON modificado. No agregues texto explicativo ni bloques de código formateados (ej: \`\`\`json ... \`\`\`).
2. Mantén los datos existentes que no hayan sido afectados por las instrucciones del usuario.
3. Asegúrate de que las modificaciones sigan criterios pedagógicos de alta calidad.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Instrucciones de modificación: "${instrucciones}"\n\nRecurso actual (JSON):\n${contenidoString}` }
      ]
    });

    const textoRespuesta = completion.choices[0].message.content;
    const objetoRespuesta = JSON.parse(textoRespuesta);

    return objetoRespuesta;
  } catch (error) {
    console.error('Error al editar recurso con IA:', error);
    throw error;
  }
}

async function generarPlanificacionAnual(promptContent) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      messages: [
        { role: 'system', content: 'Eres un especialista en diseño curricular de Córdoba, Argentina.' },
        { role: 'user', content: promptContent }
      ]
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error al generar planificación con IA:', error);
    throw error;
  }
}

module.exports = {
  generarResumenMultifuente,
  generarClase,
  generarPresentacion,
  sugerirDatosUnidad,
  sugerirDatosTema,
  generarImagenDalle,
  editarRecursoConIA,
  generarPlanificacionAnual
};