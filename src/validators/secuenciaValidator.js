/**
 * Validador determinístico para Secuencias Didácticas ("El Juez")
 * Aplica reglas estrictas de consistencia pedagógica y temporal.
 */

/**
 * Valida un objeto JSON de secuencia didáctica.
 * @param {Object} json - Objeto generado por la IA.
 * @returns {{ esValido: boolean, errores: string[] }}
 */
function validarSecuenciaDidactica(json) {
  const errores = [];

  if (!json || typeof json !== 'object') {
    return {
      esValido: false,
      errores: ['La respuesta generada no es un objeto JSON válido.']
    };
  }

  // ── Regla 1: json.clases.length debe ser >= 1 ──────────────────────────────
  if (!Array.isArray(json.clases) || json.clases.length < 1) {
    const cant = Array.isArray(json.clases) ? json.clases.length : 0;
    errores.push(
      `La secuencia debe contener al menos 1 clase planificada (actualmente contiene ${cant} clases).`
    );
  }

  if (Array.isArray(json.clases)) {
    json.clases.forEach((clase, idx) => {
      const numClase = clase.numero || (idx + 1);
      const tituloClase = clase.titulo ? `"${clase.titulo}"` : `Clase ${numClase}`;
      const momentos = clase.momentos || {};

      const tInicio = Number(momentos.inicio?.tiempo_minutos) || 0;
      const tDesarrollo = Number(momentos.desarrollo?.tiempo_minutos) || 0;
      const tCierre = Number(momentos.cierre?.tiempo_minutos) || 0;
      const sumaMomentos = tInicio + tDesarrollo + tCierre;
      const duracionTotal = Number(clase.duracion_minutos) || 0;

      // ── Regla 2: inicio.tiempo + desarrollo.tiempo + cierre.tiempo = duracion_minutos (+/- 5 min)
      const diferencia = Math.abs(sumaMomentos - duracionTotal);
      if (diferencia > 5 || duracionTotal <= 0 || sumaMomentos <= 0) {
        errores.push(
          `En ${tituloClase}: La suma de los tiempos de inicio (${tInicio}m), desarrollo (${tDesarrollo}m) y cierre (${tCierre}m) es de ${sumaMomentos}m, lo cual difiere de duracion_minutos (${duracionTotal}m) por ${diferencia} minutos (margen máximo tolerado: +/- 5 min).`
        );
      }

      // ── Regla 3: consigna_literal_alumno en desarrollo >= 30 caracteres ────
      const consignaDesarrollo = (momentos.desarrollo?.consigna_literal_alumno || '').trim();
      if (consignaDesarrollo.length < 30) {
        errores.push(
          `En ${tituloClase}: La "consigna_literal_alumno" del desarrollo es demasiado breve o genérica (${consignaDesarrollo.length} caracteres: "${consignaDesarrollo}"). Debe contener consignas concretas, detalladas y de al menos 30 caracteres para que los alumnos resuelvan, interpreten o argumenten.`
        );
      }
    });
  }

  return {
    esValido: errores.length === 0,
    errores
  };
}

module.exports = {
  validarSecuenciaDidactica
};
