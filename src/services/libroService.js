/**
@param {string} fechaInicioStr - Fecha de inicio (YYYY-MM-DD)
@param {string} fechaFinStr - Fecha de fin (YYYY-MM-DD)
@param {number[]} diasCursada - Días de la semana (0=Domingo, 1=Lunes, 2=Martes... 6=Sábado)
@param {string[]} feriados - Array de fechas feriadas (YYYY-MM-DD)
@returns {Date[]} Array con las fechas exactas de cada clase
 */
const { OpenAI } = require('openai');
const axios = require('axios');

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
    let feriadosOficiales = [];
    try {
        const anio = new Date(configFechas.fechaInicio).getFullYear();
        const response = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${anio}/AR`);
        feriadosOficiales = response.data.map(holiday => holiday.date);
    } catch (apiError) {
        console.error("No se pudieron obtener los feriados de Nager.Date", apiError);
    }

    const fechasExactas = calcularFechasClases(
      configFechas.fechaInicio,
      configFechas.fechaFin,
      configFechas.diasCursada,
      feriadosOficiales
    );

    const cantidadClases = fechasExactas.length;

    if (cantidadClases === 0) {
      throw new Error('La configuración de fechas no genera ningún día de clase válido.');
    }

    const fuentes = await prisma.fuenteContenido.findMany({
      where: { materiaId: materiaId }
    });
    
    let textoCombinado = fuentes.map(f => f.textoExtraido).filter(t => t).join('\n\n');
    if (textoCombinado.length > 30000) {
        textoCombinado = textoCombinado.substring(0, 30000);
    }

    let systemPrompt = `
      Eres un planificador académico experto.
      Tu tarea es dividir el contenido en EXACTAMENTE ${cantidadClases} clases.
      
      REGLA ESTRICTA DE FERIADOS:
      Si una clase cae en una de estas fechas ${JSON.stringify(todosLosFeriados)}, NO asignes temario.
      Debe tener título "FERIADO NACIONAL", estado "CANCELADA", y los demás campos vacíos.

      FORMATO DE SALIDA ESTRICTO (JSON):
      {
        "clases": [
          {
            "unidad": "Unidad X (o vacío)",
            "caracter": "Teórica, Práctica, Teórico-Práctica o Evaluación",
            "titulo": "Tema abordado en la clase",
            "dinamica": "Breve descripción de la dinámica (ej: Exposición, Taller, Debate)",
            "descripcion": "Descripción extendida (opcional)",
            "estado": "PENDIENTE"
          }
        ]
      }
    `;

    if (instruccionesExtra) {
      systemPrompt += `\nInstrucciones extra del profesor: ${instruccionesExtra}`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Genera la planificación para ${cantidadClases} clases basándote en este contenido:\n\n${textoCombinado}` }
      ]
    });

    const respuestaTexto = completion.choices[0].message.content;
    const respuestaJSON = JSON.parse(respuestaTexto);
    
    const clasesGeneradas = respuestaJSON.clases || [];
    
    const clasesConFechas = fechasExactas.map((fecha, i) => {
        const claseIA = clasesGeneradas[i] || { titulo: "Clase de Repaso", descripcion: "Contenido pendiente de asignación", estado: 'PENDIENTE' };
        return {
        orden: i + 1,
        fecha: fecha,
        unidad: temaIA.unidad || '',
        caracter: temaIA.caracter || 'Teórica',
        titulo: temaIA.titulo || '',
        dinamica: temaIA.dinamica || 'Exposición dialogada',
        descripcion: temaIA.descripcion || '',
        observaciones: '',
        estado: temaIA.estado || 'PENDIENTE'
      };
     });

    return clasesConFechas;

  } catch (error) {
    console.error("Error en generarLibroTemasIA:", error);
    throw error;
  }
}

module.exports = {
  calcularFechasClases,
  generarLibroTemasIA
};