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

function calcularFechasModulos(fechaInicio, fechaFin, configDias, mapaFeriados) {
    let fechas = [];
    let actual = new Date(fechaInicio + "T12:00:00Z");
    const fin = new Date(fechaFin + "T12:00:00Z");

    while (actual <= fin) {
      const diaSemana = actual.getUTCDay();
      const configDia = configDias.find(d => d.dia === diaSemana);
      
      if (configDia && configDia.modulos > 0) {
        const fechaStr = actual.toISOString().split('T')[0];
        const nombreFeriado = mapaFeriados[fechaStr]; 

        for (let i = 0; i < configDia.modulos; i++) {
            fechas.push({
                fecha: new Date(actual),
                esFeriado: !!nombreFeriado,
                nombreFeriado: nombreFeriado || null
            });
        }
      }
      actual.setUTCDate(actual.getUTCDate() + 1);
    }
    return fechas;
}


async function generarLibroTemasIA(materiaId, fuenteIds, configFechas, instruccionesExtra = "") {
  try {
    const anio = new Date(configFechas.fechaInicio).getFullYear();
    let mapaFeriados = {}; 
    try {
        const response = await axios.get(`https://api.argentinadatos.com/v1/feriados/${anio}`);
        response.data.forEach(feriado => mapaFeriados[feriado.fecha] = feriado.nombre);
    } catch (error) { console.warn("Fallo feriados", error.message); }

    const fechasExactas = calcularFechasModulos(configFechas.fechaInicio, configFechas.fechaFin, configFechas.diasCursada, mapaFeriados);
    
    const modulosHabiles = fechasExactas.filter(f => !f.esFeriado);
    const cantidadClasesA_Generar = modulosHabiles.length;

    if (fechasExactas.length === 0) throw new Error('No hay fechas válidas.');

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

    let clasesGeneradas = [];
    const LOTE_SIZE = 20; 
    let modulosRestantes = cantidadClasesA_Generar;
    let indexLote = 0;

    while (modulosRestantes > 0) {
      const pedirAhora = Math.min(modulosRestantes, LOTE_SIZE);
      const claseInicio = (indexLote * LOTE_SIZE) + 1;
      const claseFin = claseInicio + pedirAhora - 1;

      let promptBatch = `
        Eres un planificador experto. Basándote en este ÍNDICE DE TEMAS:
        \n\n${indiceOptimizado}\n\n
        
        Tu tarea es generar la planificación ESPECÍFICA para las clases de la número ${claseInicio} hasta la ${claseFin} (Total: ${pedirAhora} clases).
        
        FORMATO DE SALIDA ESTRICTO (JSON):
        {
          "clases": [
            { "unidad": "...", "caracter": "Teórica", "titulo": "...", "actividades": "..." }
          ]
        }
      `;

      if (instruccionesExtra) promptBatch += `\nInstrucciones del profesor: ${instruccionesExtra}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Devuelve SOLO JSON." },
          { role: "user", content: promptBatch }
        ]
      });

      const jsonBatch = JSON.parse(completion.choices[0].message.content);
      clasesGeneradas = clasesGeneradas.concat(jsonBatch.clases || []);
      
      modulosRestantes -= pedirAhora;
      indexLote++;
    }

    let cursorIA = 0; 

    const borradorClases = fechasExactas.map((item, i) => {
      if (item.esFeriado) {
        return {
          orden: i + 1,
          fecha: item.fecha,
          unidad: '', caracter: '',
          titulo: `FERIADO: ${item.nombreFeriado}`,
          actividades: 'Día no laborable',
          observaciones: '', estado: 'CANCELADA'
        };
      } else {
        const temaIA = clasesGeneradas[cursorIA] || { titulo: "Clase de Repaso", estado: "PENDIENTE" };
        cursorIA++;
        
        return {
          orden: i + 1,
          fecha: item.fecha,
          unidad: temaIA.unidad || '',
          caracter: temaIA.caracter || 'Teórica',
          titulo: temaIA.titulo || 'Sin título',
          actividades: temaIA.actividades || '',
          observaciones: '', estado: 'PENDIENTE'
        };
      }
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