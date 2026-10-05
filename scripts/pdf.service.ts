import fs from 'fs';
import pdfParse from 'pdf-parse';

export interface PaginaPDF {
  numeroPagina: number;
  texto: string;
}

export interface ChunkPDF {
  rangoPaginas: string;
  paginasInicio: number;
  paginasFin: number;
  texto: string;
}

/**
 * Extrae las páginas individuales de un PDF.
 */
export async function extraerPaginasPDF(filePath: string): Promise<PaginaPDF[]> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`[pdf.service] El archivo no existe: ${filePath}`);
  }

  const dataBuffer = fs.readFileSync(filePath);
  const paginas: PaginaPDF[] = [];
  let contador = 1;

  await pdfParse(dataBuffer, {
    pagerender: (pageData: any) => {
      return pageData.getTextContent().then((textContent: any) => {
        const text = textContent.items.map((i: any) => i.str).join(' ');
        paginas.push({
          numeroPagina: contador++,
          texto: text.trim(),
        });
        return text;
      });
    },
  });

  return paginas;
}

/**
 * Agrupa las páginas en bloques (chunks) de 4 páginas con 1 página de solapamiento (overlap)
 * para asegurar que ninguna Meta o Aprendizaje que se extienda a páginas siguientes pierda su contexto.
 */
export async function extraerChunksPDF(
  filePath: string,
  paginasPorChunk: number = 4,
  solapamiento: number = 1
): Promise<ChunkPDF[]> {
  const paginas = await extraerPaginasPDF(filePath);
  const chunks: ChunkPDF[] = [];
  const paso = Math.max(1, paginasPorChunk - solapamiento);

  for (let i = 0; i < paginas.length; i += paso) {
    const grupo = paginas.slice(i, i + paginasPorChunk);
    if (grupo.length === 0) break;

    const textoCombinado = grupo
      .map((p) => `=== [PÁGINA ${p.numeroPagina}] ===\n${p.texto}`)
      .join('\n\n');

    const textoLower = textoCombinado.toLowerCase();
    const esRelevante =
      textoLower.includes('meta') ||
      textoLower.includes('aprendizaje') ||
      textoLower.includes('indicador') ||
      textoLower.includes('grado') ||
      textoLower.includes('año') ||
      textoLower.includes('sala');

    if (esRelevante && textoCombinado.length > 100) {
      chunks.push({
        rangoPaginas: `Págs. ${grupo[0].numeroPagina} - ${grupo[grupo.length - 1].numeroPagina}`,
        paginasInicio: grupo[0].numeroPagina,
        paginasFin: grupo[grupo.length - 1].numeroPagina,
        texto: textoCombinado,
      });
    }

    if (i + paginasPorChunk >= paginas.length) {
      break;
    }
  }

  console.log(
    `[pdf.service] Documento procesado: ${paginas.length} páginas divididas en ${chunks.length} bloques con solapamiento contextual.`
  );

  return chunks;
}
