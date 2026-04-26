const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { OpenAI } = require('openai');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

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

    if(instruccionesExtra && instruccionesExtra.trim().length > 0){
      systemPrompt += `\n\nATENCIÓN - Instrucciones específicas del usuario: ${instruccionesExtra}`;
    }



    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Eres un asistente universitario experto. Tu tarea es leer los textos proporcionados y generar un resumen estructurado. Usa un título principal, una breve introducción, y viñetas para los conceptos clave."
        },
        {
          role: "user",
          content: `Por favor, resume el siguiente contenido de mis apuntes:\n\n${textoCombinado}`
        }
      ]
    });

    const textoResumen = completion.choices[0].message.content;

    
    const nuevoRecurso = await prisma.generacionRecurso.create({
      data: {
        titulo: `Resumen de ${fuentes.length} archivo(s)`,
        tipoRecurso: 'RESUMEN',
        contenidoJson: { texto: textoResumen }, 
        materiaId: materiaId,
        fuentes: {
          connect: fuenteIds.map(id => ({ id })) 
        }
      }
    });

    return nuevoRecurso;

  } catch (error) {
    console.error("Error en el servicio de IA:", error);
    throw error;
  }
}

module.exports = { generarResumenMultifuente }; 