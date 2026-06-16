const { OpenAI } = require('openai');
const prisma = require('./db.js');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Genera el contenido de las clases usando IA basado en una estructura estricta pre-calculada.
 * @param {string} materiaId - ID de la materia
 * @param {Array} estructuraRequerida - Array de objetos con { id_clase: X } enviado desde el front
 * @param {string} instruccionesExtra - Instrucciones adicionales del docente
 */
async function generarLibroTemasIA(
  materiaId,
  estructuraRequerida,
  instruccionesExtra = "",
  frecuenciaSemanal = null,
  volumenMaterial = null,
  configFechas = null
) {
  try {
    if (!estructuraRequerida || estructuraRequerida.length === 0) {
      throw new Error("No se recibió la estructura estricta de clases a rellenar.");
    }

    const cantidadClasesA_Generar = estructuraRequerida.length;

    const fuentes = await prisma.fuenteContenido.findMany({ where: { materiaId: materiaId } });
    let textoCombinado = fuentes.map(f => f.textoExtraido).filter(t => t).join('\n\n');

    if (textoCombinado.length > 30000) textoCombinado = textoCombinado.substring(0, 30000);

    // Calcular métricas estimadas si no se especifican
    const totalPalabras = textoCombinado ? textoCombinado.split(/\s+/).filter(Boolean).length : 0;
    const paginasEstimadas = Math.ceil(totalPalabras / 250) || 1;

    const resolvedVolumen = volumenMaterial || `${paginasEstimadas} páginas (aprox. ${totalPalabras} palabras)`;

    let resolvedFrecuencia = frecuenciaSemanal;
    if (!resolvedFrecuencia && configFechas && configFechas.diasCursada) {
      resolvedFrecuencia = configFechas.diasCursada.length;
    }
    if (!resolvedFrecuencia) {
      resolvedFrecuencia = 2; // valor por defecto
    }

    const promptSyllabus = `
      Actúa como diseñador curricular y planificador de clases realista.
      Basándote en la frecuencia semanal de la materia (${resolvedFrecuencia} clases por semana) y el volumen del material didáctico base (${resolvedVolumen}), 
      tu tarea es estructurar una planificación pedagógicamente viable de exactamente ${cantidadClasesA_Generar} clases.
      
      REGLA DE ORO DE REALISMO TEMPORAL:
      Eres un planificador realista. DEBES calcular el tiempo necesario considerando que un alumno promedio puede procesar conceptos complejos a un ritmo de 2 a 3 páginas (o 500-750 palabras) por clase, sumado al tiempo de debate, explicación y actividades prácticas.
      Si el material base es extenso, NO puedes agrupar gran cantidad de páginas o conceptos complejos en solo 1 o 2 clases.
      Debes desglosar y secuenciar los temas en múltiples clases consecutivas a lo largo de varias semanas para garantizar un aprendizaje real y asimilación efectiva.
      Calcula la cantidad y duración de las clases de cada 'Tema' en función de esta regla.
      
      Extrae de la siguiente información un índice estructurado de temas y subtemas ordenados de forma lógica.
      Sé muy conciso, no des explicaciones, solo devuelve el listado de temas.
      
      \n\nCONTENIDO:\n${textoCombinado}
    `;

    const respuestaSyllabus = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: promptSyllabus }],
      max_tokens: 1500
    });

    const indiceOptimizado = respuestaSyllabus.choices[0].message.content;

    let promptIA = `
      Eres un planificador pedagógico experto y realista. Basándote en este ÍNDICE DE TEMAS:
      \n\n${indiceOptimizado}\n\n
      
      Tu tarea es desarrollar el contenido ESPECÍFICO para las clases, respetando el ritmo de aprendizaje determinado por la frecuencia semanal (${resolvedFrecuencia} clases por semana) y el volumen del material base (${resolvedVolumen}).
      
      Instrucción Crítica de Conteo y Realismo:
      Tu tarea es generar EXACTAMENTE ${cantidadClasesA_Generar} clases para esta unidad/tema. Es absolutamente obligatorio que el array JSON de respuesta tenga una longitud exacta de ${cantidadClasesA_Generar} elementos. Ni uno más, ni uno menos.

      Reglas de ajuste de contenido y realismo temporal:
      - DEBES calcular el tiempo necesario considerando que un alumno promedio puede procesar conceptos complejos a un ritmo de 2 a 3 páginas por clase, sumado al tiempo de debate y actividades.
      - Si el material base es muy extenso, NO puedes agruparlo en 1 o 2 clases. Debes desglosarlo en múltiples clases a lo largo de varias semanas para garantizar el aprendizaje real.
      - Si el contenido curricular te parece poco para llenar ${cantidadClasesA_Generar} clases, NO reduzcas la cantidad. En su lugar, divide los temas más complejos en "Parte 1", "Parte 2", etc., o agrega clases de "Repaso", "Integración" o "Evaluación Formativa".
      - Si el contenido curricular te parece demasiado para ${cantidadClasesA_Generar} clases, prioriza los conceptos fundamentales y secuéncialos respetando el ritmo de procesamiento realista por clase.

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
        { role: "system", content: "Devuelve SOLO JSON strictly formatted." },
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