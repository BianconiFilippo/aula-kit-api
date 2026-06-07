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
  const systemPrompt = `Eres un diseñador de diapositivas experto en síntesis visual, maquetación dinámica y pedagogía. Tu tarea es analizar el texto proporcionado y crear una presentación estructurada utilizando una arquitectura flexible de bloques y columnas.

Reglas estrictas de estructuración:
1. Determina para cada diapositiva si requiere un diseño de 1 columna (para portadas, títulos principales o secciones de transición) o de 2 columnas (para texto + imagen lateral, comparaciones, o explicaciones detalladas).
2. Desglosa el contenido de cada columna en una secuencia ordenada de bloques. Los tipos de bloques permitidos son:
   - "h1": Título de tamaño grande.
   - "h2": Subtítulo o sección.
   - "parrafo": Bloque de texto descriptivo (muy conciso, máximo 2 líneas).
   - "lista": Un conjunto de viñetas (cada elemento de la lista debe ser corto, máximo 2 líneas).
   - "imagen": Una palabra clave descriptiva en inglés para buscar imágenes de stock.
3. No satures las diapositivas. Máximo 4 o 5 bloques por columna para mantener una buena respiración visual.
4. Si el diseño (layout) es "2_columnas", el array de columnas debe contener exactamente dos objetos (orden 1 y orden 2).
5. Si el bloque es de tipo "imagen", el campo "contenido" debe ser una única palabra clave en INGLÉS (ej. "microscope", "revolution", "server").
6. Si el bloque es de tipo "lista", el campo "contenido" debe ser un Array de strings. Para los demás tipos de bloques, "contenido" debe ser un String.

Debes devolver ÚNICAMENTE un objeto JSON válido con la siguiente estructura exacta:
{
  "titulo_presentacion": "string — título global de la presentación",
  "diapositivas": [
    {
      "layout": "1_columna | 2_columnas",
      "columnas": [
        {
          "orden": 1,
          "bloques": [
            {
              "tipo": "h1 | h2 | parrafo | lista | imagen",
              "contenido": "string o array de strings (según el tipo de bloque)"
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
      columnas: cols,
      notas_orador: slide.notas_orador || ''
    };
  });

  return resultado;
}

module.exports = { generarResumenMultifuente, generarClase, generarPresentacion };