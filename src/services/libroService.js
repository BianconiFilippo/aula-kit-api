/**
@param {string} fechaInicioStr - Fecha de inicio (YYYY-MM-DD)
@param {string} fechaFinStr - Fecha de fin (YYYY-MM-DD)
@param {number[]} diasCursada - Días de la semana (0=Domingo, 1=Lunes, 2=Martes... 6=Sábado)
@param {string[]} feriados - Array de fechas feriadas (YYYY-MM-DD)
@returns {Date[]} Array con las fechas exactas de cada clase
 */
const { OpenAI } = require('openai');

const prisma = require('./db.js');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
function calcularFechasClases(fechaInicioStr, fechaFinStr, diasCursada, feriados = []) {
  const fechas = [];
  
  let fechaActual = new Date(fechaInicioStr);
  const fin = new Date(fechaFinStr);

  fechaActual.setHours(12, 0, 0, 0);
  fin.setHours(12, 0, 0, 0);

  while (fechaActual <= fin) {
    const diaSemana = fechaActual.getDay(); 
    const fechaFormatoString = fechaActual.toISOString().split('T')[0]; 

    if (diasCursada.includes(diaSemana) && !feriados.includes(fechaFormatoString)) {
      fechas.push(new Date(fechaActual));
    }
    
    fechaActual.setDate(fechaActual.getDate() + 1);
  }

  return fechas;
}


async function generarLibroTemasIA(materiaId, fuenteIds, configFechas, instruccionesExtra = "") {
  try {
    const fechasExactas = calcularFechasClases(
      configFechas.fechaInicio, 
      configFechas.fechaFin, 
      configFechas.diasCursada, 
      configFechas.feriados
    );

    const cantidadClases = fechasExactas.length;
    if (cantidadClases === 0) {
      throw new Error('La configuración de fechas no genera ningún día de clase válido.');
    }

    const fuentes = await prisma.fuenteContenido.findMany({
      where: { materiaId: materiaId }
    });
    let textoCombinado = fuentes.map(f => f.textoExtraido).join('\n\n').substring(0, 30000);
    let systemPrompt = `Eres un planificador académico experto. 
Tu tarea es dividir el contenido proporcionado en EXACTAMENTE ${cantidadClases} clases.
DEBES devolver la respuesta ÚNICAMENTE en formato JSON, con la siguiente estructura exacta:
{
  "clases": [
    { "titulo": "Tema de la clase", "descripcion": "Breve descripción de lo que se verá" }
  ]
}`;

    if (instruccionesExtra) {
      systemPrompt += `\nInstrucciones extra del profesor: ${instruccionesExtra}`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Aquí tienes los apuntes. Genera la planificación para ${cantidadClases} clases:\n\n${textoCombinado}` }
      ]
    });

    const respuestaJSON = JSON.parse(completion.choices[0].message.content);
    const clasesGeneradas = respuestaJSON.clases;
    const registrosAInsertar = [];
    
    for (let i = 0; i < fechasExactas.length; i++) {
      const temaIA = clasesGeneradas[i] || { titulo: "Clase de Repaso / Comodín", descripcion: "" };
      
      registrosAInsertar.push({
        materiaId: materiaId,
        orden: i + 1,
        fecha: fechasExactas[i],
        titulo: temaIA.titulo,
        descripcion: temaIA.descripcion,
        estado: 'PENDIENTE'
      });
    }

    const resultado = await prisma.registroLibroTema.createMany({
      data: registrosAInsertar
    });

    return { 
      mensaje: `Se generaron ${resultado.count} clases con éxito.`,
      fechas: fechasExactas
    };

  } catch (error) {
    console.error("Error en generarLibroTemasIA:", error);
    throw error;
  }
}

module.exports = {
  calcularFechasClases,
  generarLibroTemasIA
};