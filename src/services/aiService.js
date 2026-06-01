const { OpenAI } = require('openai');
const prisma = require('./db.js');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    let systemPrompt = `Actúa como un asistente pedagógico experto. Tu tarea es leer los textos proporcionados y generar un recurso pedagógico estructurado.
Debes devolver estrictamente un objeto JSON con la siguiente estructura exacta:
{
  "titulo": "string",
  "resumen_ejecutivo": "string",
  "conceptos_clave": ["string", "string"],
  "actividades_sugeridas": ["string", "string"]
}`;

    if (instruccionesExtra && instruccionesExtra.trim().length > 0) {
      systemPrompt += `\n\nATENCIÓN - Instrucciones específicas del usuario: ${instruccionesExtra}`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Por favor, resume el siguiente contenido de mis apuntes:\n\n${textoCombinado}`
        }
      ]
    });

    const textoResumen = completion.choices[0].message.content;
    const objetoResumen = JSON.parse(textoResumen);

    return objetoResumen;

  } catch (error) {
    console.error("Error en el servicio de IA:", error);
    throw error;
  }
}

module.exports = { generarResumenMultifuente }; 