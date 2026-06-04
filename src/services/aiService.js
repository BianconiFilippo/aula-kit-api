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

module.exports = { generarResumenMultifuente, generarClase };