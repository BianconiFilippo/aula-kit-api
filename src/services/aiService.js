const { OpenAI } = require('openai');
const prisma = require('./db.js');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ─────────────────────────────────────────────────────────────────────────────
// Función existente: Resumen multi-fuente
// ─────────────────────────────────────────────────────────────────────────────
async function generarResumenMultifuente(materiaId, fuenteIds, instruccionesExtra = '') {
  try {
    const fuentes = await prisma.fuenteContenido.findMany({
      where: {
        id: { in: fuenteIds },
        materiaId: materiaId
      }
    });

    if (fuentes.length === 0) {
      throw new Error('No se encontraron los archivos seleccionados o no tienen texto.');
    }

    let textoCombinado = fuentes
      .map(f => `--- Documento: ${f.nombreArchivo} ---\n${f.textoExtraido}`)
      .join('\n\n');

    if (textoCombinado.length > 30000) {
      console.warn('El texto combinado es muy largo. Recortando para evitar errores...');
      textoCombinado = textoCombinado.substring(0, 30000);
    }

    let systemPrompt = `Actúa como un asistente pedagógico experto. Tu tarea es leer los textos proporcionados y generar un recurso pedagógico estructurado y profundo.
Debes devolver estrictamente un objeto JSON con la siguiente estructura exacta:
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
}

Analiza el texto y genera múltiples objetos dentro del array 'secciones'. Cada sección debe representar un apartado lógico del documento, con su respectivo título y un desarrollo profundo en contenido.`;

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
// Nueva función: Generación de Presentación estructurada
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Genera una "Presentación" estructurada a partir de un texto base.
 * @param {string} textoBase          - Texto extraído del material fuente.
 * @param {string} instruccionesExtra - Instrucciones opcionales del docente.
 * @returns {Promise<Object>} Objeto JSON con la estructura de la presentación.
 */
async function generarPresentacion(textoBase, instruccionesExtra = '') {
  const systemPrompt = `Actúa como un Director de Arte Editorial y experto en diseño instruccional. Tu tarea es analizar el texto proporcionado y estructurar una presentación minimalista, legible y visualmente premium.
Deberás sugerir una paleta temática general y definir fondos dinámicos individuales por diapositiva.

Reglas de Diseño y Contenido:
1. No satures la presentación con imágenes. Solo utiliza el bloque tipo 'imagen' o fondos tipo 'imagen_ai' cuando visualmente aporten a la comprensión del tema (ej. diagramas conceptuales, anatomía, paisajes específicos). Si el concepto es abstracto, prefiere layouts de texto limpio con 1 o 2 columnas.
2. Limita el uso de fondos tipo 'imagen_ai' principalmente a la diapositiva de Portada o a separadores de sección importantes para no afectar la legibilidad general.
3. Cuando decidas usar una imagen (bloque 'imagen' o fondo 'imagen_ai'), el valor del campo correspondiente debe ser un Prompt descriptivo en inglés optimizado para un generador de IA como DALL-E 3 (ej. "A hyper-realistic close-up of a plant cell showing the nucleus, clean background").
4. Si el layout es "2_columnas", el array de columnas debe contener exactamente dos objetos (orden 1 y orden 2).
5. Si el bloque es de tipo "lista", el campo "contenido" debe ser un Array de strings. Para los demás tipos de bloques, "contenido" debe ser un String (o prompt en inglés si es imagen).

Debes devolver ÚNICAMENTE un objeto JSON válido con la siguiente estructura exacta:
{
  "titulo_presentacion": "string — título global de la presentación",
  "tema_sugerido": "minimalista | corporativo | creativo | oscuro",
  "diapositivas": [
    {
      "layout": "1_columna | 2_columnas",
      "fondo": {
        "tipo": "solido | gradiente | imagen_ai",
        "valor": "string (hexadecimal, o prompt en inglés si es imagen_ai)"
      },
      "columnas": [
        {
          "orden": 1,
          "bloques": [
            {
              "tipo": "h1 | h2 | parrafo | lista | imagen",
              "contenido": "texto, array de textos, o prompt en inglés si es imagen"
            }
          ]
        }
      ],
      "notas_orador": "string — notas detalladas para el profesor al presentar la diapositiva"
    }
  ]
}`;

  let userMessage = `Analiza el siguiente texto y genera la presentación estructurada:\n\n${textoBase}`;
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

  // Parseo con validación
  let resultado;
  try {
    resultado = JSON.parse(rawContent);
  } catch (parseError) {
    console.error('generarPresentacion: La IA devolvió JSON inválido:', rawContent);
    throw new Error('La IA devolvió una respuesta con formato inválido para la presentación. Intenta de nuevo.');
  }

  // Validación de campos obligatorios
  if (
    !resultado.titulo_presentacion ||
    !resultado.tema_sugerido ||
    !Array.isArray(resultado.diapositivas)
  ) {
    console.error('generarPresentacion: JSON incompleto recibido de la IA:', resultado);
    throw new Error('La respuesta de la IA no contiene la estructura de presentación requerida. Intenta de nuevo.');
  }

  // Validar y sanear cada diapositiva
  resultado.diapositivas = resultado.diapositivas.map(slide => {
    let layout = slide.layout || '1_columna';
    if (!['1_columna', '2_columnas'].includes(layout)) {
      layout = '1_columna';
    }
    
    let fondo = slide.fondo || { tipo: 'solido', valor: '#ffffff' };
    if (!['solido', 'gradiente', 'imagen_ai'].includes(fondo.tipo)) {
      fondo.tipo = 'solido';
    }
    if (!fondo.valor) {
      fondo.valor = fondo.tipo === 'imagen_ai' ? 'abstract background' : '#ffffff';
    }

    let cols = Array.isArray(slide.columnas) ? slide.columnas : [];
    
    if (layout === '2_columnas') {
      if (cols.length < 2) {
        cols = [
          cols[0] || { orden: 1, bloques: [] },
          { orden: 2, bloques: [] }
        ];
      }
    } else {
      if (cols.length === 0) {
        cols = [{ orden: 1, bloques: [] }];
      }
    }

    cols = cols.map((col, index) => {
      const bloques = Array.isArray(col.bloques) ? col.bloques : [];
      return {
        orden: col.orden || (index + 1),
        bloques: bloques.map(b => ({
          tipo: ['h1', 'h2', 'parrafo', 'lista', 'imagen'].includes(b.tipo) ? b.tipo : 'parrafo',
          contenido: b.contenido || ''
        }))
      };
    });

    return {
      layout: layout,
      fondo: fondo,
      columnas: cols,
      notas_orador: slide.notas_orador || ''
    };
  });

  return resultado;
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

module.exports = {
  generarResumenMultifuente,
  generarClase,
  generarPresentacion,
  sugerirDatosUnidad,
  sugerirDatosTema
};