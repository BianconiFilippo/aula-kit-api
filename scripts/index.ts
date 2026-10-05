import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { db, pool } from '../src/db/index';
import { progresiones, bloques } from '../src/db/schema';
import { extraerChunksPDF } from './pdf.service';
import {
  extraerEstructuraCurricularConIA,
  ContextoPrevioCurricular,
} from './ai.service';
import { ProgresionCurricular } from './ai.schema';

/**
 * Consolida y unifica las progresiones que comparten la misma Meta y Grado
 * (provenientes de páginas consecutivas o solapadas), combinando sus bloques de aprendizaje sin duplicar.
 */
function consolidarProgresiones(lista: ProgresionCurricular[]): ProgresionCurricular[] {
  const mapa = new Map<string, ProgresionCurricular>();

  for (const prog of lista) {
    if (!prog.meta_proposito || !prog.bloques || prog.bloques.length === 0) {
      continue;
    }

    const key = [
      (prog.nivel || '').toLowerCase().trim(),
      (prog.ciclo_grado || '').toLowerCase().trim(),
      (prog.espacio_curricular || '').toLowerCase().trim(),
      (prog.meta_proposito || '').toLowerCase().trim(),
    ].join('||');

    if (mapa.has(key)) {
      const existente = mapa.get(key)!;
      const aprendizajesSet = new Set(
        existente.bloques.map((b) => b.aprendizaje_y_contenido.toLowerCase().trim())
      );

      for (const b of prog.bloques) {
        const bKey = (b.aprendizaje_y_contenido || '').toLowerCase().trim();
        if (bKey && !aprendizajesSet.has(bKey)) {
          existente.bloques.push(b);
          aprendizajesSet.add(bKey);
        }
      }
    } else {
      mapa.set(key, {
        nivel: prog.nivel,
        ciclo_grado: prog.ciclo_grado,
        espacio_curricular: prog.espacio_curricular,
        meta_proposito: prog.meta_proposito,
        bloques: [...prog.bloques],
      });
    }
  }

  return Array.from(mapa.values());
}

/**
 * Inserta un lote de progresiones curriculares consolidadas y sus bloques asociados
 * dentro de una transacción segura de Drizzle ORM.
 */
async function guardarProgresionesEnBD(listaProgresiones: ProgresionCurricular[]): Promise<{
  totalProgresiones: number;
  totalBloques: number;
}> {
  const consolidadas = consolidarProgresiones(listaProgresiones);

  if (consolidadas.length === 0) {
    return { totalProgresiones: 0, totalBloques: 0 };
  }

  let totalBloques = 0;

  await db.transaction(async (tx) => {
    for (const prog of consolidadas) {
      // 1. Insertar cabecera de Progresión
      const [progGuardada] = await tx
        .insert(progresiones)
        .values({
          nivel: prog.nivel || 'Educación General',
          ciclo_grado: prog.ciclo_grado || 'General',
          espacio_curricular: prog.espacio_curricular || 'General',
          meta_proposito: prog.meta_proposito,
        })
        .returning({ id: progresiones.id });

      // 2. Insertar bloques e indicadores de logro asociados
      const bloquesParaInsertar = prog.bloques
        .filter((b) => b.aprendizaje_y_contenido && b.aprendizaje_y_contenido.trim().length > 0)
        .map((b) => ({
          progresion_id: progGuardada.id,
          aprendizaje_y_contenido: b.aprendizaje_y_contenido,
          indicadores_de_logro: b.indicadores_de_logro || [],
        }));

      if (bloquesParaInsertar.length > 0) {
        await tx.insert(bloques).values(bloquesParaInsertar);
        totalBloques += bloquesParaInsertar.length;
      }
    }
  });

  return {
    totalProgresiones: consolidadas.length,
    totalBloques,
  };
}

/**
 * Busca y retorna la ruta a la carpeta de documentos de progresiones curriculares.
 */
function obtenerCarpetaDocumentos(): string | null {
  const posiblesCarpetas = [
    path.resolve(process.cwd(), 'src/documentos_progresiones_de_aprendizaje '),
    path.resolve(process.cwd(), 'src/documentos_progresiones_de_aprendizaje'),
    path.resolve(process.cwd(), 'documentos_progresiones_de_aprendizaje'),
    path.resolve(process.cwd(), 'documentos'),
  ];

  for (const carpeta of posiblesCarpetas) {
    if (fs.existsSync(carpeta) && fs.statSync(carpeta).isDirectory()) {
      return carpeta;
    }
  }

  return null;
}

/**
 * Obtiene la lista de archivos PDF a procesar según los argumentos o la carpeta predeterminada.
 */
function obtenerArchivosPDF(argPath?: string): string[] {
  if (argPath) {
    const resolvedPath = path.resolve(process.cwd(), argPath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`La ruta especificada no existe: ${resolvedPath}`);
    }

    if (fs.statSync(resolvedPath).isFile()) {
      if (!resolvedPath.toLowerCase().endsWith('.pdf')) {
        throw new Error(`El archivo especificado no es un PDF: ${resolvedPath}`);
      }
      return [resolvedPath];
    }

    if (fs.statSync(resolvedPath).isDirectory()) {
      return fs
        .readdirSync(resolvedPath)
        .filter((file) => file.toLowerCase().endsWith('.pdf'))
        .map((file) => path.join(resolvedPath, file));
    }
  }

  const carpeta = obtenerCarpetaDocumentos();
  if (!carpeta) return [];

  return fs
    .readdirSync(carpeta)
    .filter((file) => file.toLowerCase().endsWith('.pdf'))
    .map((file) => path.join(carpeta, file));
}

/**
 * Función principal del Pipeline ETL de Diseños Curriculares
 */
async function main() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('   🚀 ETL Pipeline: Ingesta de Progresiones Curriculares (IA)   ');
  console.log('════════════════════════════════════════════════════════════════');

  try {
    const args = process.argv.slice(2);
    const seedFlag = args.includes('--seed-json');
    const inputArg = args.find((a) => !a.startsWith('--'));

    // 1. Modo Siembra Rápida desde JSON existente
    const seedJsonPath = path.resolve(
      process.cwd(),
      'src/constants/progresiones_de_aprendizaje.json'
    );

    if (seedFlag) {
      console.log(`[ETL] 📦 Modo de siembra directa desde: ${seedJsonPath}`);
      if (!fs.existsSync(seedJsonPath)) {
        throw new Error(`El archivo JSON de siembra no existe en: ${seedJsonPath}`);
      }

      const rawData = fs.readFileSync(seedJsonPath, 'utf-8');
      const datos: ProgresionCurricular[] = JSON.parse(rawData);

      console.log(`[ETL] 💾 Insertando ${datos.length} progresiones en PostgreSQL...`);
      const resultado = await guardarProgresionesEnBD(datos);

      console.log('────────────────────────────────────────────────────────────────');
      console.log(`✅ Ingesta finalizada con éxito.`);
      console.log(`   • Progresiones insertadas: ${resultado.totalProgresiones}`);
      console.log(`   • Bloques e indicadores insertados: ${resultado.totalBloques}`);
      console.log('────────────────────────────────────────────────────────────────');
      return;
    }

    // 2. Obtener lista de archivos PDF a procesar
    const archivosPDF = obtenerArchivosPDF(inputArg);

    if (archivosPDF.length === 0) {
      throw new Error(
        'No se encontraron archivos PDF para procesar en documentos_progresiones_de_aprendizaje.'
      );
    }

    console.log(`[ETL] 📚 Archivos PDF detectados para procesar: ${archivosPDF.length}`);
    archivosPDF.forEach((p, idx) => console.log(`   ${idx + 1}. ${path.basename(p)}`));

    let totalGlobalProgresiones = 0;
    let totalGlobalBloques = 0;

    for (let i = 0; i < archivosPDF.length; i++) {
      const pdfPath = archivosPDF[i];
      const nombreArchivo = path.basename(pdfPath);

      console.log('\n════════════════════════════════════════════════════════════════');
      console.log(`[ETL] 📄 (${i + 1}/${archivosPDF.length}) Procesando: ${nombreArchivo}`);
      console.log('════════════════════════════════════════════════════════════════');

      // A. Extraer chunks pedagógicos de 4 páginas con solapamiento
      const chunks = await extraerChunksPDF(pdfPath, 4, 1);
      const progresionesBrutas: ProgresionCurricular[] = [];
      let contextoPrevio: ContextoPrevioCurricular | undefined = undefined;

      for (let c = 0; c < chunks.length; c++) {
        const chunk = chunks[c];
        process.stdout.write(`   ↳ [${c + 1}/${chunks.length}] Analizando ${chunk.rangoPaginas}... `);

        const resultadoChunk = await extraerEstructuraCurricularConIA(chunk.texto, contextoPrevio);
        const cantidadExtraida = resultadoChunk.progresiones?.length || 0;

        if (cantidadExtraida > 0) {
          progresionesBrutas.push(...resultadoChunk.progresiones);
          const ultimaProg = resultadoChunk.progresiones[resultadoChunk.progresiones.length - 1];
          if (ultimaProg?.meta_proposito) {
            contextoPrevio = {
              ultimaMeta: ultimaProg.meta_proposito,
              ultimoNivel: ultimaProg.nivel,
              ultimoEspacio: ultimaProg.espacio_curricular,
            };
          }
          console.log(`✅ ${cantidadExtraida} progresión(es) detectada(s).`);
        } else {
          console.log(`⏩ Sin tablas curriculares.`);
        }
      }

      if (progresionesBrutas.length === 0) {
        console.warn(`[ETL] ⚠️ No se detectaron progresiones en el documento: ${nombreArchivo}`);
        continue;
      }

      // B. Consolidación y deduplicación en memoria
      const progresionesConsolidadas = consolidarProgresiones(progresionesBrutas);
      console.log(
        `\n[ETL] 🧩 Progresiones consolidadas tras unificar pliegos: ${progresionesConsolidadas.length} (de ${progresionesBrutas.length} fragmentadas)`
      );

      // C. Inserción atómica en base de datos PostgreSQL
      console.log(`[ETL] 💾 Guardando en base de datos PostgreSQL...`);
      const resultado = await guardarProgresionesEnBD(progresionesConsolidadas);

      totalGlobalProgresiones += resultado.totalProgresiones;
      totalGlobalBloques += resultado.totalBloques;

      console.log(`✅ ${nombreArchivo} guardado: ${resultado.totalProgresiones} progresiones, ${resultado.totalBloques} bloques.`);
    }

    console.log('\n════════════════════════════════════════════════════════════════');
    console.log(`🎉 Pipeline ETL completado con éxito.`);
    console.log(`   • Total Progresiones registradas: ${totalGlobalProgresiones}`);
    console.log(`   • Total Bloques e Indicadores registrados: ${totalGlobalBloques}`);
    console.log('════════════════════════════════════════════════════════════════');
  } catch (error: any) {
    console.error('\n❌ Error en el proceso de ingesta:', error.message || error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
