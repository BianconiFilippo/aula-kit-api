const { OpenAI } = require('openai');
const prisma = require('./db.js');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Genera el contenido de las clases usando IA basado en una estructura estricta pre-calculada.
 * @param {string} materiaId - ID de la materia
 * @param {Array} estructuraRequerida - Array de objetos con { id_clase: X } enviado desde el front
 * @param {string} instruccionesExtra - Instrucciones adicionales del docente
 */
async function generarLibroTemasIA(materiaId, estructuraRequerida, instruccionesExtra = "") {
  try {
    if (!estructuraRequerida || estructuraRequerida.length === 0) {
      throw new Error("No se recibió la estructura estricta de clases a rellenar.");
    }

    const cantidadClasesA_Generar = estructuraRequerida.length;

    const fuentes = await prisma.fuenteContenido.findMany({ where: { materiaId: materiaId } });
    let textoCombinado = fuentes.map(f => f.textoExtraido).filter(t => t).join('\n\n');

    if (textoCombinado.length > 30000) textoCombinado = textoCombinado.substring(0, 30000);

    const promptSyllabus = `
      Actúa como diseñador curricular. Extrae de la siguiente información un índice estructurado 
      de temas y subtemas para un año lectivo de ${cantidadClasesA_Generar} clases. 
      Sé muy conciso, no des explicaciones, solo devuelve el listado puro.
      \n\nCONTENIDO:\n${textoCombinado}
    `;

    const respuestaSyllabus = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: promptSyllabus }],
      max_tokens: 1500
    });

    const indiceOptimizado = respuestaSyllabus.choices[0].message.content;

    let promptIA = `
      Eres un planificador experto. Basándote en este ÍNDICE DE TEMAS:
      \n\n${indiceOptimizado}\n\n
      
      Tu tarea es desarrollar el contenido ESPECÍFICO para las clases.

      Instrucción Crítica de Conteo:
      Tu tarea es generar EXACTAMENTE ${cantidadClasesA_Generar} clases para esta unidad/tema. Es absolutamente obligatorio que el array JSON de respuesta tenga una longitud exacta de ${cantidadClasesA_Generar} elementos. Ni uno más, ni uno menos.

      Reglas de ajuste de contenido:
      - Si el contenido curricular te parece poco para llenar ${cantidadClasesA_Generar} clases, NO reduzcas la cantidad. En su lugar, divide los temas más complejos en "Parte 1" y "Parte 2", o agrega clases de "Repaso", "Integración" o "Evaluación Formativa".
      - Si el contenido curricular te parece demasiado, agrupa conceptos afines en una misma clase, pero NUNCA excedas la cantidad solicitada.

      Formato de Salida JSON Obligatorio:
      Para garantizar que no pierdes la cuenta, cada clase en el array DEBE incluir un campo numérico secuencial llamado numero_clase, y el campo id_clase correspondiente al mapeo:
      {
        "clases": [
          {
            "id_clase": X,
            "numero_clase": 1,
            "unidad": "...",
            "caracter": "Teórica",
            "titulo": "...",
            "actividades": "..."
          },
          ... (continúa exactamente hasta llegar al objeto donde "numero_clase": ${cantidadClasesA_Generar})
        ]
      }
    `;

    if (instruccionesExtra) {
      promptIA += `\nInstrucciones del profesor: ${instruccionesExtra}`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Devuelve SOLO JSON estrictamente formateado." },
        { role: "user", content: promptIA }
      ]
    });

    const jsonRespuesta = JSON.parse(completion.choices[0].message.content);

    return jsonRespuesta.clases || [];

  } catch (error) {
    console.error("Error en generarLibroTemasIA:", error);
    throw error;
  }
}

module.exports = {
  generarLibroTemasIA
};