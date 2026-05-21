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

    let systemPrompt = "Eres un asistente universitario experto. Tu tarea es leer los textos proporcionados y generar un resumen estructurado. Usa un título principal, una breve introducción, y viñetas para los conceptos clave.";

    if(instruccionesExtra && instruccionesExtra.trim().length > 0){
      systemPrompt += `\n\nATENCIÓN - Instrucciones específicas del usuario: ${instruccionesExtra}`;
    }



    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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

    return textoResumen;

  } catch (error) {
    console.error("Error en el servicio de IA:", error);
    throw error;
  }
}

module.exports = { generarResumenMultifuente }; 