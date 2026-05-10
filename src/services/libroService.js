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

function calcularFechasModulos(fechaInicio, fechaFin, configDias, feriados) {
    let fechas = [];
    let actual = new Date(fechaInicio + "T12:00:00Z");
    const fin = new Date(fechaFin + "T12:00:00Z");

    while (actual <= fin) {
      const diaSemana = actual.getUTCDay(); 
      const configDia = configDias.find(d => d.dia === diaSemana);
      
      if (configDia && configDia.modulos > 0) {
        const fechaStr = actual.toISOString().split('T')[0];
        const esFeriado = feriados.includes(fechaStr);

        for (let i = 0; i < configDia.modulos; i++) {
            fechas.push({
                fecha: new Date(actual),
                esFeriado: esFeriado
            });
        }
      }
      actual.setUTCDate(actual.getUTCDate() + 1); 
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

    const todosLosFeriados = [...feriadosOficiales, ...(configFechas.feriados || [])];

    const fechasExactas = calcularFechasModulos(
      configFechas.fechaInicio,
      configFechas.fechaFin,
      configFechas.diasCursada,
      todosLosFeriados
    );

    const cantidadClases = fechasExactas.length;

    if (cantidadClases === 0) {
      throw new Error('La configuración de fechas no genera ningún módulo de clase válido.');
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
      Tu tarea es dividir el contenido en EXACTAMENTE ${cantidadClases} módulos/clases.
      Ten en cuenta que puede haber varios módulos en un mismo día.
      
      REGLA DE FERIADOS: Si la fecha coincide con un feriado, debes generar el objeto con título: "FERIADO NACIONAL" y estado: "CANCELADA".

      FORMATO DE SALIDA ESTRICTO (JSON):
      {
        "clases": [
          {
            "unidad": "Unidad X (o vacío)",
            "caracter": "Teórica, Práctica, Teórico-Práctica o Evaluación",
            "titulo": "Tema central de este módulo",
            "actividades": "Actividades propuestas para los alumnos en este módulo",
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
        { role: "user", content: `Genera la planificación para ${cantidadClases} módulos basándote en este contenido:\n\n${textoCombinado}` }
      ]
    });

    const respuestaTexto = completion.choices[0].message.content;
    const respuestaJSON = JSON.parse(respuestaTexto);
    
    const clasesGeneradas = respuestaJSON.clases || [];
    
    const borradorClases = fechasExactas.map((item, i) => {
      const temaIA = clasesGeneradas[i] || { titulo: "Clase de Repaso", estado: "PENDIENTE" };
      return {
        orden: i + 1,
        fecha: item.fecha,
        unidad: item.esFeriado ? '' : (temaIA.unidad || ''),
        caracter: item.esFeriado ? '' : (temaIA.caracter || 'Teórica'),
        titulo: item.esFeriado ? 'FERIADO NACIONAL' : (temaIA.titulo || ''),
        actividades: item.esFeriado ? 'Día no laborable' : (temaIA.actividades || ''),
        observaciones: '',
        estado: item.esFeriado ? 'CANCELADA' : (temaIA.estado || 'PENDIENTE')
      };
    });
    
    return borradorClases;
    
  } catch (error) {
    console.error("Error en generarLibroTemasIA:", error);
    throw error;
  }
}

module.exports = {
  calcularFechasModulos,
  generarLibroTemasIA
};