const { OpenAI } = require('openai');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const prisma = require('./db.js');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Extrae texto de un archivo cargado en memoria según su tipo (PDF, DOCX, XLSX, TXT)
 */
async function extraerTextoDeArchivo(fileBuffer, mimeType = '', originalName = '') {
  if (!fileBuffer) return '';
  const ext = originalName ? originalName.split('.').pop().toLowerCase() : '';

  try {
    if (mimeType.includes('pdf') || ext === 'pdf') {
      const pdfData = await pdfParse(fileBuffer);
      return pdfData.text || '';
    }

    if (mimeType.includes('word') || mimeType.includes('docx') || ext === 'docx' || ext === 'doc') {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value || '';
    }

    if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || ext === 'xlsx' || ext === 'xls') {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      let text = '';
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        text += XLSX.utils.sheet_to_txt(sheet) + '\n\n';
      });
      return text;
    }

    return fileBuffer.toString('utf-8');
  } catch (err) {
    console.error('Error al extraer texto del archivo:', err);
    return fileBuffer.toString('utf-8');
  }
}

/**
 * Mapea la planificación anual sobre un esqueleto existente de clases (UUIDs pasados a la IA)
 */
async function completarEsqueletoConIA(_materiaId, textoExtraido, esqueleto) {
  const esqueletoFormatted = esqueleto.map(c => ({
    id: c.id,
    fecha: c.fecha ? new Date(c.fecha).toISOString().split('T')[0] : null,
    numero_clase: c.numeroClase
  }));

  const systemPrompt = `Eres un experto en diseño curricular. A continuación recibirás el texto de una Planificación Anual y un JSON con un esqueleto de clases disponibles (fechas y números). Tu objetivo es distribuir lógicamente los contenidos de la planificación en estas clases. Debes devolver un JSON estricto: un array de objetos donde cada objeto contenga: id (el UUID exacto que te pasamos), unidad (nombre del bloque), caracteristica_clase (ej: Desarrollo, Repaso, Evaluación), tema_dia (el tema específico a dar) y actividades_propuestas (tareas sugeridas en base al documento).`;

  let textToUse = textoExtraido ? textoExtraido.trim() : '';
  if (textToUse.length > 30000) {
    textToUse = textToUse.substring(0, 30000);
  }

  const userPrompt = `TEXTO DE LA PLANIFICACIÓN ANUAL:
${textToUse}

ESQUELETO DE CLASES DISPONIBLES (${esqueletoFormatted.length} clases):
${JSON.stringify(esqueletoFormatted, null, 2)}

Debes devolver obligatoriamente un JSON estricto con la propiedad "clases" conteniendo un array de ${esqueletoFormatted.length} objetos, asegurando mantener la propiedad "id" EXACTA que te pasamos para cada clase.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.3
  });

  const jsonContent = JSON.parse(response.choices[0].message.content || '{}');
  const clasesGeneradas = jsonContent.clases || jsonContent.data || [];
  return clasesGeneradas;
}

/**
 * Genera el desglose de clases en formato plano usando IA (OpenAI GPT-4o-mini)
 */
async function generarLibroTemasIA(
  materiaId,
  textoPlanificacion = "",
  fechasDisponibles = [],
  instruccionesExtra = ""
) {
  try {
    let resolvedTexto = textoPlanificacion ? textoPlanificacion.trim() : "";

    if (!resolvedTexto && materiaId) {
      const fuentes = await prisma.fuenteContenido.findMany({ where: { materiaId: materiaId } });
      resolvedTexto = fuentes.map(f => f.textoExtraido).filter(t => t).join('\n\n');
    }

    if (!resolvedTexto) {
      throw new Error("No se proporcionó texto de planificación anual ni existen fuentes cargadas para esta materia.");
    }

    if (!fechasDisponibles || !Array.isArray(fechasDisponibles) || fechasDisponibles.length === 0) {
      throw new Error("No se proporcionó un listado de fechas disponibles de clases.");
    }

    if (resolvedTexto.length > 30000) {
      resolvedTexto = resolvedTexto.substring(0, 30000);
    }

    const systemPrompt = `Eres un experto en diseño instruccional y pedagogía. Recibirás el texto de una 'Planificación Anual' de un docente y un listado de fechas de clases disponibles para el ciclo lectivo. Tu tarea es distribuir los contenidos generales, metodologías y objetivos de la planificación en un cronograma clase por clase.
Reglas:
- Crea exactamente una fila (clase) por cada fecha proporcionada.
- Agrupa las clases en bloques temáticos usando el campo 'unidad' como etiqueta descriptiva.
- En 'tema_dia', sé específico sobre qué se verá ese día basado en los contenidos del documento.
- En 'actividades_propuestas', sugiere tareas concretas.`;

    const userPrompt = `TEXTO DE LA PLANIFICACIÓN ANUAL:
${resolvedTexto}

FECHAS DISPONIBLES (${fechasDisponibles.length} clases):
${JSON.stringify(fechasDisponibles, null, 2)}
${instruccionesExtra ? `\nINSTRUCCIONES ADICIONALES DEL DOCENTE:\n${instruccionesExtra}` : ''}

Debes devolver obligatoriamente un objeto JSON con una única propiedad 'clases' que contenga exactamente un array de ${fechasDisponibles.length} objetos con la estructura especificada.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3
    });

    const jsonContent = JSON.parse(response.choices[0].message.content || '{}');
    const clasesGeneradas = jsonContent.clases || jsonContent.data || [];

    return clasesGeneradas;

  } catch (error) {
    console.error("Error en generarLibroTemasIA:", error);
    throw error;
  }
}

module.exports = {
  extraerTextoDeArchivo,
  completarEsqueletoConIA,
  generarLibroTemasIA
};