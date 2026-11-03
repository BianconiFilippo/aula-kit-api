const { OpenAI } = require('openai');
const { zodResponseFormat } = require('openai/helpers/zod');
const prisma = require('./db.js');
const { randomUUID } = require('crypto');
const axios = require('axios');
const supabase = require('./supabase');
const { PresentacionSchema } = require('../dtos/presentacion.dto.js');
const { ClaseBaseSchema, ClaseSchema } = require('../dtos/clase.dto.js');
const { SecuenciaDidacticaBaseSchema, SecuenciaDidacticaSchema } = require('../dtos/secuencia.dto.js');
const { obtenerMarcoNormativo } = require('../constants/marcosNormativos.js');
const { validarSecuenciaDidactica } = require('../validators/secuenciaValidator.js');

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
// Generación de Clase Individual estructurada pedagógicamente
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Genera una "Clase Individual" estructurada pedagógicamente a partir de un texto base.
 * @param {string} textoBase          - Texto extraído del material fuente.
 * @param {string} instruccionesExtra - Instrucciones opcionales del docente.
 * @returns {Promise<Object>} Objeto JSON validado con el esquema pedagógico profundo.
 */
async function generarClase(textoBase, instruccionesExtra = '') {
  const systemPrompt = `Actuás como especialista en didáctica y planificación del nivel secundario argentino. Tu tarea es producir una clase completa, profesional y directamente utilizable en el aula basándote en el tema que pide el usuario.

REGLAS ESTRICTAS:
1. No resumas el pedido. Desarrolla la clase completa.
2. No reemplaces actividades por descripciones genéricas como 'dialogar sobre el tema' o 'hacer una puesta en común'. Escribí las consignas concretas.
3. Diferenciá claramente entre la información para el docente (nota_para_docente) y lo que el estudiante debe resolver (consigna_literal_alumno).
4. Priorizá actividades que obliguen al estudiante a inferir, interpretar y argumentar (no solo buscar información literal).
5. La clase debe ser extensa y detallada, lista para aplicarse sin que el docente deba completarla posteriormente.

REGLA DE TIEMPOS OBLIGATORIA:
- La suma de momentos.inicio.tiempo_minutos + momentos.desarrollo.tiempo_minutos + momentos.cierre.tiempo_minutos DEBE ser exactamente igual a duracion_minutos (por defecto 80 minutos o el tiempo indicado).`;

  let userMessage = `Tema o contenido solicitado para la clase:\n\n${textoBase}`;
  if (instruccionesExtra && instruccionesExtra.trim().length > 0) {
    userMessage += `\n\nInstrucciones o contexto adicional del docente:\n${instruccionesExtra}`;
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: zodResponseFormat(ClaseBaseSchema, 'clase_individual'),
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
    console.error('generarClase: La IA devolvió JSON inválido:', rawContent);
    throw new Error('La IA devolvió una respuesta con formato inválido. Intenta de nuevo.');
  }

  // Asegurar consistencia de duracion_minutos con la suma de momentos
  const sumaTiempos =
    (jsonParsed?.momentos?.inicio?.tiempo_minutos || 0) +
    (jsonParsed?.momentos?.desarrollo?.tiempo_minutos || 0) +
    (jsonParsed?.momentos?.cierre?.tiempo_minutos || 0);

  if (sumaTiempos > 0 && jsonParsed.duracion_minutos !== sumaTiempos) {
    jsonParsed.duracion_minutos = sumaTiempos;
  }

  const validation = ClaseSchema.safeParse(jsonParsed);
  if (!validation.success) {
    console.error('generarClase: Error de validación Zod:', JSON.stringify(validation.error.format(), null, 2));
    throw new Error('La respuesta de la IA no cumple con el esquema pedagógico requerido. Intenta de nuevo.');
  }

  return validation.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Nueva función: Generación de Presentación estructurada basada en Layouts (Gamma model)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Genera una "Presentación" educativa estructurada basada en tarjetas ("Layouts") a partir de un texto base.
 * @param {string} textoBase          - Texto extraído del material fuente.
 * @param {string} instruccionesExtra - Instrucciones opcionales del docente.
 * @param {Object} [opciones]         - Opciones pedagógicas (cantidadDiapositivas, tipoPresentacion).
 * @returns {Promise<Object>} Objeto JSON con la estructura de la presentación educativa basada en Layouts.
 */
async function generarPresentacion(textoBase, instruccionesExtra = '', opciones = {}) {
  const cantidadSlides = Number(opciones.cantidadDiapositivas) || 7;
  const tipoClase = opciones.tipoPresentacion || 'desarrollo_tematico';

  let contextoTipo = '';
  if (tipoClase === 'introductoria') {
    contextoTipo = 'Enfoque de la clase: INTRODUCTORIA. Diseñada para despertar curiosidad, activar conocimientos previos y sentar bases conceptuales clave.';
  } else if (tipoClase === 'profundizacion') {
    contextoTipo = 'Enfoque de la clase: PROFUNDIZACIÓN. Diseñada para profundizar en matices, análisis crítico, causas-efectos y comparativas sustanciales.';
  } else if (tipoClase === 'taller_practico') {
    contextoTipo = 'Enfoque de la clase: TALLER / PRÁCTICA. Diseñada con ejemplos concretos, secuencias paso a paso y desafíos interactivos de aplicación.';
  } else if (tipoClase === 'repaso_sintesis') {
    contextoTipo = 'Enfoque de la clase: REPASO Y SÍNTESIS. Diseñada para articular ideas principales, cuadros de contraste y conclusiones formativas.';
  }

  const systemPrompt = `Actúa como un Diseñador Instruccional Senior y Pedagogo experto en Tecnología Educativa.
Tu tarea es analizar el material provisto y estructurar una PRESENTACIÓN EDUCATIVA PROFESIONAL DE ${cantidadSlides} DIAPOSITIVAS basada en tarjetas semánticas ("Layouts"), orientada a una clase escolar/académica de excelencia.

${contextoTipo}

REGLAS DE DISEÑO DIDÁCTICO Y NARRATIVA PEDAGÓGICA:
1. SECUENCIA DIDÁCTICA ESTRICTA:
   La presentación debe seguir un hilo conductor pedagógico lógico a lo largo de las ${cantidadSlides} diapositivas:
   - Diapositiva 1 (Portada / Apertura - 'hero'): Título atractivo de la clase, materia/área, y subtítulo o pregunta convocante.
   - Diapositiva 2 (Gancho / Activación - 'statement' o 'quote' o 'split_image_text'): Pregunta desafiante o afirmación disparadora que conecte con la experiencia de los estudiantes.
   - Diapositivas Intermedias (Desarrollo Conceptual y Andamiaje): Distribuir los conceptos centrales de menor a mayor complejidad empleando layouts visuales adecuados:
     * 'split_image_text': Para conceptos que se benefician de una ilustración/diagrama (requiere 'imagePrompt' en inglés).
     * 'grid_3': Para enumerar exactamente 3 pilares, causas, ejemplos o dimensiones fundamentales.
     * 'compare_2': Para contrastar dos visiones, modelos opuestos, antes/después o mito vs. realidad (usando 'lado_a' y 'lado_b').
     * 'timeline_steps': Para secuencias temporales, fases metodológicas o procesos paso a paso (usando 'pasos').
     * 'statement': Para una definición esencial irrefutable o teorema que los estudiantes deban asimilar.
   - Penúltima Diapositiva (Dinámica / Aplicación en Aula - 'quote' o 'grid_3' o 'split_image_text'): Pregunta o consigna breve para debatir en parejas o plenario.
   - Última Diapositiva (Síntesis / Conclusión - 'hero' o 'statement'): Cierre con las ideas fuerza que los estudiantes deben llevarse en su carpeta.

2. NOTAS PARA EL DOCENTE ('notas_docente') OBLIGATORIAS:
   Cada diapositiva DEBE incluir obligatoriamente el campo 'notas_docente' (texto de 2 a 4 oraciones de alto valor pedagógico):
   - Explicación oral sugerida para quien está al frente de la clase.
   - 1 o 2 preguntas reflexivas para interpelar a los estudiantes.
   - Advertencia de errores conceptuales comunes que conviene anticipar.

3. ELECCIÓN DE LAYOUTS DISPONIBLES ('layoutType'):
   - 'hero': Portada de alto impacto o cierre potente. Requiere 'title', 'body' y opcionalmente 'kicker'.
   - 'split_image_text': Explicación profunda acompañada de imagen ilustrativa. Requiere 'title', 'body' e 'imagePrompt' en inglés optimizado para DALL-E.
   - 'grid_3': Cuadrícula con exactamente 3 tarjetas. Requiere 'title', 'body' de contexto y 'items' (array de 3 strings sustanciales).
   - 'compare_2': Cuadro comparativo en dos columnas. Requiere 'title', 'body' y los objetos 'lado_a' ({ "titulo": "...", "items": ["..."], "descripcion": "..." }) y 'lado_b' ({ "titulo": "...", "items": ["..."], "descripcion": "..." }).
   - 'timeline_steps': Secuencia de 3 a 4 pasos o etapas. Requiere 'title', 'body' y el array 'pasos' ([{ "paso": 1, "titulo": "...", "descripcion": "..." }]).
   - 'quote': Cita de autor, reflexión profunda o pregunta filosófica. Requiere 'body' (la frase) y 'kicker' (autor o contexto).
   - 'statement': Mensaje fuerza o definición de gran impacto visual. Requiere 'title' o 'body'.

4. PALETA DE TEMAS VISUALES ('theme'):
   - 'light': Fondo claro, legible y accesible (ideal para diapositivas con mucho texto conceptual).
   - 'dark': Fondo oscuro, sofisticado y moderno (ideal para portada, citas o momentos reflexivos).
   - 'primary': Fondo vibrante institucional con color de acento.
   Alterna temas con ritmo pedagógico (ej: portada y cierre en 'dark' o 'primary', desarrollo en 'light').

5. PROHIBIDO EL TEXT-DUMP EN PANTALLA:
   El texto proyectado para los alumnos debe ser claro, estructurado y sintético. La explicación exhaustiva debe estar en 'notas_docente'.

Debes devolver ÚNICAMENTE un objeto JSON válido con la siguiente estructura exacta:
{
  "titulo_presentacion": "string — título global de la presentación",
  "diapositivas": [
    {
      "layoutType": "hero" | "split_image_text" | "grid_3" | "compare_2" | "timeline_steps" | "quote" | "statement",
      "theme": "dark" | "light" | "primary",
      "notas_docente": "string — Guía oral, preguntas para la clase y advertencias para el profesor al proyectar esta diapositiva",
      "content": {
        "kicker": "string (opcional antetítulo)",
        "title": "string (opcional título)",
        "body": "string (opcional desarrollo conceptual)",
        "items": ["string", "string", "string"] (opcional, para listas o grid_3),
        "imagePrompt": "string (opcional prompt en inglés descriptivo)",
        "lado_a": {
          "titulo": "string",
          "items": ["string", "string"],
          "descripcion": "string (opcional)"
        },
        "lado_b": {
          "titulo": "string",
          "items": ["string", "string"],
          "descripcion": "string (opcional)"
        },
        "pasos": [
          { "paso": 1, "titulo": "string", "descripcion": "string" },
          { "paso": 2, "titulo": "string", "descripcion": "string" },
          { "paso": 3, "titulo": "string", "descripcion": "string" }
        ]
      }
    }
  ]
}`;

  let userMessage = `Analiza el siguiente material curricular y genera exactamente ${cantidadSlides} diapositivas estructuradas:\n\n${textoBase}`;
  if (instruccionesExtra && instruccionesExtra.trim().length > 0) {
    userMessage += `\n\nInstrucciones pedagógicas adicionales del docente: ${instruccionesExtra}`;
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-5.1',
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

    // Sanitización y normalización robusta si la IA estructuró ligeramente distinto
    if (jsonParsed && Array.isArray(jsonParsed.diapositivas)) {
      const validLayouts = [
        'hero',
        'split_image_text',
        'grid_3',
        'compare_2',
        'timeline_steps',
        'quote',
        'statement',
        'debate',
        'lectura',
        'actividad',
        'resumen'
      ];
      const validThemes = ['dark', 'light', 'primary'];

      jsonParsed.diapositivas = jsonParsed.diapositivas.map((slide, idx) => {
        const layoutType = validLayouts.includes(slide.layoutType)
          ? slide.layoutType
          : (idx === 0 ? 'hero' : 'split_image_text');
        const theme = validThemes.includes(slide.theme) ? slide.theme : 'light';
        const notasDocente = slide.notas_docente || slide.speakerNotes || slide.notas_orador || '';

        return {
          layoutType,
          theme,
          notas_docente: notasDocente,
          speakerNotes: notasDocente,
          content: {
            kicker: slide.content?.kicker || undefined,
            title: slide.content?.title || slide.titulo || undefined,
            body: slide.content?.body || slide.body || slide.cuerpo || undefined,
            items: Array.isArray(slide.content?.items) ? slide.content.items : (Array.isArray(slide.items) ? slide.items : undefined),
            imagePrompt: slide.content?.imagePrompt || slide.imagePrompt || undefined,
            imageUrl: slide.content?.imageUrl || slide.content?.url || slide.imageUrl || undefined,
            url: slide.content?.url || slide.url || undefined,
            lado_a: slide.content?.lado_a || slide.lado_a || undefined,
            lado_b: slide.content?.lado_b || slide.lado_b || undefined,
            pasos: Array.isArray(slide.content?.pasos) ? slide.content.pasos : (Array.isArray(slide.pasos) ? slide.pasos : undefined)
          }
        };
      });

      const fallbackValidation = PresentacionSchema.safeParse(jsonParsed);
      if (fallbackValidation.success) {
        return fallbackValidation.data;
      }
    }

    throw new Error('La respuesta de la IA no cumple con la estructura JSON y esquema de Layouts pedagógicos requerido.');
  }

  // Asegurar consistencia entre notas_docente y speakerNotes
  const datosValidados = validation.data;
  datosValidados.diapositivas = datosValidados.diapositivas.map(d => {
    const notas = d.notas_docente || d.speakerNotes || '';
    return {
      ...d,
      notas_docente: notas,
      speakerNotes: notas
    };
  });

  return datosValidados;
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

      const { error: uploadError } = await supabase.storage
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
      formatInstructions = `El objeto JSON debe respetar la estructura pedagógica de una Clase:
{
  "titulo": "string",
  "duracion_minutos": "number (suma exacta de inicio, desarrollo y cierre)",
  "objetivo_clase": "string",
  "recursos_necesarios": ["string"],
  "momentos": {
    "inicio": {
      "tiempo_minutos": "number",
      "nota_para_docente": "string (Qué debe hacer/explicar el docente)",
      "consigna_literal_alumno": "string (Las palabras exactas o preguntas a dictar al alumno)"
    },
    "desarrollo": {
      "tiempo_minutos": "number",
      "nota_para_docente": "string",
      "consigna_literal_alumno": "string (Prohibido usar descripciones genéricas como 'hacer puesta en común')"
    },
    "cierre": {
      "tiempo_minutos": "number",
      "nota_para_docente": "string (Cómo evaluar formativamente el cierre)",
      "consigna_literal_alumno": "string",
      "registro_carpeta_tarea": "string"
    }
  },
  "evidencia_aprendizaje": "string"
}
Asegúrate de que la suma de tiempo_minutos de inicio, desarrollo y cierre sea estrictamente igual a duracion_minutos.`;
    } else if (tipo === 'PRESENTACION') {
      formatInstructions = `El objeto JSON debe respetar la estructura de una Presentación basada en Layouts pedagógicos:
{
  "titulo_presentacion": "string",
  "diapositivas": [
    {
      "layoutType": "hero" | "split_image_text" | "grid_3" | "compare_2" | "timeline_steps" | "quote" | "statement",
      "theme": "dark" | "light" | "primary",
      "notas_docente": "string (orientaciones pedagógicas para el profesor frente al aula)",
      "content": {
        "kicker": "string (opcional)",
        "title": "string (opcional)",
        "body": "string (opcional)",
        "items": ["string"] (opcional),
        "imagePrompt": "string (opcional prompt DALL-E en inglés)",
        "lado_a": { "titulo": "string", "items": ["string"], "descripcion": "string (opcional)" },
        "lado_b": { "titulo": "string", "items": ["string"], "descripcion": "string (opcional)" },
        "pasos": [{ "paso": 1, "titulo": "string", "descripcion": "string" }]
      }
    }
  ]
}`;
    } else if (tipo === 'SECUENCIA' || tipo === 'SECUENCIA_DIDACTICA') {
      formatInstructions = `El objeto JSON debe respetar la estructura pedagógica de una Secuencia Didáctica:
{
  "titulo": "string",
  "espacio_curricular": "string",
  "curso": "string",
  "tema": "string",
  "cantidad_clases": number,
  "fundamentacion": "string",
  "objetivos": ["string"],
  "capacidades": ["string"],
  "clases": [
    {
      "numero": number,
      "titulo": "string",
      "duracion_minutos": number,
      "objetivo": "string",
      "momentos": {
        "inicio": { "tiempo_minutos": number, "nota_para_docente": "string", "consigna_literal_alumno": "string" },
        "desarrollo": { "tiempo_minutos": number, "nota_para_docente": "string", "consigna_literal_alumno": "string" },
        "cierre": { "tiempo_minutos": number, "nota_para_docente": "string", "consigna_literal_alumno": "string" }
      }
    }
  ],
  "evaluacion": {
    "diagnostica": "string",
    "formativa": "string",
    "final": "string",
    "rubricas": [
      { "criterio": "string", "nivel_destacado": "string", "nivel_logrado": "string", "nivel_en_proceso": "string" }
    ]
  }
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

/**
 * Genera una Secuencia Didáctica completa estructurada y tipada, adaptando dinámicamente el marco normativo provincial.
 * @param {Object} params - Datos para la generación.
 * @param {string} [params.provincia] - Provincia para resolver marco normativo.
 * @param {string} [params.espacio_curricular] - Materia / Asignatura.
 * @param {string} [params.curso] - Curso / Nivel.
 * @param {string} [params.tema] - Tema central o eje de la secuencia.
 * @param {number} [params.cantidad_clases=3] - Número de clases de la secuencia.
 * @param {string} [params.enfoque_objetivo] - Enfoque pedagógico u objetivo específico.
 * @param {string} [params.textoBase] - Texto base extraído de documentos o apuntes.
 * @param {string} [params.instruccionesExtra] - Instrucciones o requerimientos adicionales.
 * @returns {Promise<Object>} Objeto JSON validado con el esquema Zod de Secuencia Didáctica.
 */
async function generarSecuenciaDidactica(params = {}) {
  const {
    provincia,
    espacio_curricular = '',
    curso = '',
    tema = '',
    cantidad_clases = 3,
    enfoque_objetivo = '',
    textoBase = '',
    instruccionesExtra = '',
    meta_proposito = '',
    aprendizajes_seleccionados = [],
    indicadores_logro = []
  } = params;

  const marco_provincial = obtenerMarcoNormativo(provincia);

  const systemPrompt = `Actuás como especialista en didáctica de Argentina. Basa esta secuencia OBLIGATORIAMENTE en el marco normativo: ${marco_provincial}. Crea una progresión de aprendizaje de MÚLTIPLES clases. NO asumas interpretaciones; escribe las consignas literales para los alumnos. Diferencia notas del docente de consignas de alumnos. Prohibido resumir.

DIRECTIVAS CURRICULARES Y PEDAGÓGICAS:
1. "fundamentacion": Explica con rigor la pertinencia didáctica y la progresión de saberes según el marco normativo ${marco_provincial}.
2. "objetivos" y "capacidades": Formula metas de aprendizaje observables y capacidades prioritarias (resolución de problemas, pensamiento crítico, comunicación, trabajo en equipo).
3. "clases": Desarrolla de manera exhaustiva un total de ${cantidad_clases} clases correlativas (mínimo 1 clase). Cada clase debe tener:
   - "numero": Correlativo (1 a ${cantidad_clases}).
   - "titulo": Título pedagógico y motivador.
   - "duracion_minutos": Duración total en minutos.
   - "objetivo": Objetivo específico de la clase.
   - "momentos":
     * "inicio": { tiempo_minutos, nota_para_docente, consigna_literal_alumno }
     * "desarrollo": { tiempo_minutos, nota_para_docente, consigna_literal_alumno (obligatorio redactar consigna detallada de al menos 30 caracteres) }
     * "cierre": { tiempo_minutos, nota_para_docente, consigna_literal_alumno }
4. "evaluacion": Define estrategias claras para evaluación diagnóstica, formativa y final, además de una matriz analítica de rúbricas ("rubricas") con criterios y descriptores por nivel de desempeño.`;

  let userPrompt = `Genera la Secuencia Didáctica completa con los siguientes parámetros:
- Espacio Curricular / Materia: ${espacio_curricular || 'No especificado'}
- Curso / Año: ${curso || 'Nivel Secundario'}
- Tema / Contexto narrativo: ${tema || 'Diseño Curricular'}
- Cantidad de clases requeridas: ${cantidad_clases}
- Marco Normativo Provincial asignado: ${marco_provincial}`;

  if (meta_proposito) {
    userPrompt += `\n- Meta/Propósito Curricular Oficial: ${meta_proposito}`;
  }

  if (Array.isArray(aprendizajes_seleccionados) && aprendizajes_seleccionados.length > 0) {
    userPrompt += `\n- Aprendizajes y Contenidos Seleccionados:\n  * ${aprendizajes_seleccionados.join('\n  * ')}`;
  }

  if (Array.isArray(indicadores_logro) && indicadores_logro.length > 0) {
    userPrompt += `\n- Indicadores de Logro Asociados:\n  * ${indicadores_logro.join('\n  * ')}`;
  }

  if (enfoque_objetivo && enfoque_objetivo.trim().length > 0) {
    userPrompt += `\n- Enfoque pedagógico u objetivo docente: ${enfoque_objetivo}`;
  }

  if (textoBase && textoBase.trim().length > 0 && textoBase !== tema) {
    userPrompt += `\n\nMaterial bibliográfico o fuentes de referencia:\n${textoBase}`;
  }

  if (instruccionesExtra && instruccionesExtra.trim().length > 0) {
    userPrompt += `\n\nInstrucciones adicionales del docente:\n${instruccionesExtra}`;
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const MAX_RETRIES = 2; // Hasta 2 reintentos de corrección (máximo 3 llamadas)
  let intento = 0;
  let ultimoError = null;

  while (intento <= MAX_RETRIES) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: zodResponseFormat(SecuenciaDidacticaBaseSchema, 'secuencia_didactica'),
        messages: messages
      });

      const rawContent = completion.choices[0].message.content;

      let jsonParsed;
      try {
        jsonParsed = JSON.parse(rawContent);
      } catch (parseError) {
        console.error(`generarSecuenciaDidactica: JSON inválido recibido en intento ${intento + 1}:`, rawContent);
        throw new Error('La IA devolvió una respuesta con formato inválido para la secuencia didáctica.');
      }

      // ── 1. Validación determinística de "El Juez" ──
      const juicio = validarSecuenciaDidactica(jsonParsed);

      if (juicio.esValido) {
        // Normalización / sanitización de tiempos y clases para asegurar consistencia
        if (Array.isArray(jsonParsed.clases)) {
          jsonParsed.cantidad_clases = jsonParsed.clases.length;
          jsonParsed.clases.forEach((clase) => {
            const tInicio = Number(clase.momentos?.inicio?.tiempo_minutos) || 0;
            const tDesarrollo = Number(clase.momentos?.desarrollo?.tiempo_minutos) || 0;
            const tCierre = Number(clase.momentos?.cierre?.tiempo_minutos) || 0;
            const suma = tInicio + tDesarrollo + tCierre;
            if (suma > 0) {
              clase.duracion_minutos = suma;
            }
          });
        }

        const validation = SecuenciaDidacticaSchema.safeParse(jsonParsed);
        if (validation.success) {
          if (intento > 0) {
            console.log(`generarSecuenciaDidactica: Secuencia corregida y validada exitosamente en el intento ${intento + 1}.`);
          }
          return validation.data;
        }
      }

      // Si no pasa la validación del Juez
      ultimoError = juicio.errores;
      console.warn(`generarSecuenciaDidactica: Intento ${intento + 1}/${MAX_RETRIES + 1} rechazado por el Juez:`, juicio.errores);

      if (intento < MAX_RETRIES) {
        // Inyectamos la respuesta defectuosa y la orden de corrección precisa
        messages.push({ role: 'assistant', content: rawContent });
        messages.push({
          role: 'user',
          content: `Tu respuesta anterior fue rechazada por los siguientes errores:\n${juicio.errores.map(e => `- ${e}`).join('\n')}\n\nCorrige estos problemas, expande las clases y devuelve el JSON válido.`
        });
      }
    } catch (apiError) {
      console.error(`generarSecuenciaDidactica: Error en intento ${intento + 1}:`, apiError.message || apiError);
      ultimoError = [apiError.message || 'Error en la llamada a la API'];
    }

    intento++;
  }

  // Si se agotaron los 2 reintentos
  console.error('generarSecuenciaDidactica: Se agotaron los reintentos de auto-corrección. Errores finales:', ultimoError);
  throw new Error(`La IA no pudo generar una secuencia didáctica válida tras ${MAX_RETRIES + 1} intentos. Motivos: ${ultimoError ? ultimoError.join('; ') : 'Error de validación desconocido'}`);
}

module.exports = {
  generarResumenMultifuente,
  generarClase,
  generarPresentacion,
  sugerirDatosUnidad,
  sugerirDatosTema,
  generarImagenDalle,
  editarRecursoConIA,
  generarPlanificacionAnual,
  generarSecuenciaDidactica
};