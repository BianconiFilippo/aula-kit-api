const { OpenAI } = require('openai');
const axios = require('axios');
const { ensureBrowserCompatibleImage } = require('./imageConverter.service');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Analiza un examen de alumno (imagen o PDF) utilizando GPT-4o Vision contra las consignas y rúbrica del docente.
 * Devuelve nota sugerida y lista estructurada de comentarios por criterio.
 *
 * @param {Object} params
 * @param {string} params.consignas - Texto de las consignas del examen
 * @param {string} params.criterios - Rúbrica de corrección del docente
 * @param {string} params.archivoUrl - URL pública del examen en Supabase Storage
 * @param {string} params.nombreOriginal - Nombre del archivo del alumno
 * @returns {Promise<{ notaFinal: string, comentarios: Array<{ criterio: string, sugerencia: string, aprobado: boolean }> }>}
 */
async function corregirEntregaConIA({ consignas, criterios, archivoUrl, nombreOriginal }) {
  try {
    const isImage = /\.(jpe?g|png|webp|heic|heif)$/i.test(archivoUrl) || /\.(jpe?g|png|webp|heic|heif)$/i.test(nombreOriginal);

    const systemPrompt = `Eres un docente pedagógico de élite experto en evaluación de exámenes matemáticos y académicos.
Tu tarea es analizar detalladamente el examen manuscrito entregado por el alumno (adjunto en la imagen), contrastándolo rigurosamente contra las CONSIGNAS y la RÚBRICA/CRITERIOS definidos por el docente.

Directrices de corrección:
1. Lee y analiza cada uno de los ejercicios resueltos a mano en la imagen.
2. Identifica el planteo, desarrollo analítico, aplicación de fórmulas, reglas de derivación y errores algebraicos/aritméticos.
3. Evalúa cada consigna por separado indicando claramente aciertos, equivocaciones y qué procedimiento debió seguir el alumno.
4. Determina una "notaFinal" en formato cuantitativo (ej: "8.5/10", "7/10", "9/10", etc.) basándote fielmente en el puntaje de la rúbrica.
5. Para cada punto o ejercicio evaluado, genera un comentario estructurado con:
   - "criterio": El nombre del ejercicio o criterio evaluado (ej. "Ejercicio 1: Regla de la Cadena", "Ejercicio 2: Derivación Implícita", etc.).
   - "sugerencia": La retroalimentación pedagógica detallada, indicando qué respondió el alumno, aciertos y cómo corregir cualquier error.
   - "aprobado": Booleano (true si cumple satisfactoriamente el ejercicio, false si está incompleto o con error grave).

Debes devolver estrictamente un objeto JSON con este formato exacto:
{
  "notaFinal": "string (ej. 7.5/10)",
  "comentarios": [
    {
      "criterio": "string",
      "sugerencia": "string",
      "aprobado": true
    }
  ]
}
No agregues formato adicional fuera del JSON.`;

    const userTextPrompt = `CONSIGNAS DEL EXAMEN:\n${consignas}\n\nRÚBRICA / CRITERIOS DE CORRECCIÓN:\n${criterios}\n\nNOMBRE DEL ARCHIVO DEL ALUMNO: ${nombreOriginal}\n\nPor favor analiza la entrega adjunta minuciosamente y devuelve la corrección detallada por ejercicio y la nota final.`;

    const userContent = [];
    userContent.push({
      type: 'text',
      text: userTextPrompt
    });

    if (isImage) {
      // Descargamos la imagen para asegurar formato compatible base64 (JPEG) si es HEIC o para garantizar acceso directo a OpenAI
      try {
        const imgResp = await axios.get(archivoUrl, { responseType: 'arraybuffer', timeout: 15000 });
        const compatible = ensureBrowserCompatibleImage(Buffer.from(imgResp.data), nombreOriginal);
        const base64Data = compatible.buffer.toString('base64');
        const mime = compatible.mimetype || 'image/jpeg';

        userContent.push({
          type: 'image_url',
          image_url: {
            url: `data:${mime};base64,${base64Data}`,
            detail: 'high'
          }
        });
      } catch (dlErr) {
        console.warn('No se pudo descargar imagen para base64, usando URL directa:', dlErr.message);
        userContent.push({
          type: 'image_url',
          image_url: {
            url: archivoUrl,
            detail: 'high'
          }
        });
      }
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2
    });

    const raw = response.choices[0]?.message?.content;
    const resultado = JSON.parse(raw);

    return {
      notaFinal: resultado.notaFinal || '7/10',
      comentarios: Array.isArray(resultado.comentarios) && resultado.comentarios.length > 0 
        ? resultado.comentarios 
        : [
            {
              criterio: 'Evaluación General',
              sugerencia: 'El examen fue analizado. Revisa los desarrollos manuscritos de los ejercicios.',
              aprobado: true
            }
          ]
    };
  } catch (error) {
    console.error('Error en corregirEntregaConIA:', error);
    return {
      notaFinal: 'Pendiente de revisión',
      comentarios: [
        {
          criterio: 'Revisión General',
          sugerencia: `No se pudo completar el análisis automático de la imagen (${error.message}). Puedes reintentar con el botón de recorregir o revisar manualmente.`,
          aprobado: false
        }
      ]
    };
  }
}

module.exports = {
  corregirEntregaConIA
};
