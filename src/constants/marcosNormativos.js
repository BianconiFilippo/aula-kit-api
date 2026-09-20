/**
 * Diccionario de Marcos Normativos y Diseños Curriculares de Argentina
 */
const MARCOS_NORMATIVOS = {
  cordoba: 'Progresiones de Aprendizaje — TransFORMAR@Cba 2025 (Res. M 452-2024)',
  buenos_aires: 'Diseños Curriculares vigentes DGCyE',
  caba: 'Nuevo Diseño Curricular Primaria 2025 (Res. N°2271/MEDGC/24)',
  santa_fe: 'Diseño Curricular 2025–2026 (Res. 2422/25)',
  mendoza: 'Diseño Curricular Provincial + NAP',
  tucuman: 'Diseño Curricular Provincial + NAP',
  entre_rios: 'Diseño Curricular Provincial + NAP',
  salta: 'Diseño Curricular Provincial + NAP',
  jujuy: 'Diseño Curricular Provincial + NAP',
  default: 'Núcleos de Aprendizajes Prioritarios (NAP - Res. CFE 174/12)'
};

/**
 * Normaliza y obtiene el marco normativo curricular según la provincia ingresada.
 * @param {string} [provincia] - Nombre de la provincia o jurisdicción.
 * @returns {string} Marco normativo correspondiente.
 */
function obtenerMarcoNormativo(provincia) {
  if (!provincia || typeof provincia !== 'string') {
    return MARCOS_NORMATIVOS.default;
  }

  const normalizado = provincia
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[\s-]+/g, '_');

  // Mapeos específicos y alias comunes
  if (normalizado.includes('cordoba')) return MARCOS_NORMATIVOS.cordoba;
  if (normalizado.includes('buenos_aires') || normalizado === 'pba' || normalizado === 'bsas' || normalizado === 'bonaerense') return MARCOS_NORMATIVOS.buenos_aires;
  if (normalizado.includes('caba') || normalizado.includes('capital') || normalizado.includes('buenos_aires_ciudad') || normalizado.includes('ciudad_autonoma')) return MARCOS_NORMATIVOS.caba;
  if (normalizado.includes('santa_fe') || normalizado.includes('santafe')) return MARCOS_NORMATIVOS.santa_fe;
  if (normalizado.includes('mendoza')) return MARCOS_NORMATIVOS.mendoza;
  if (normalizado.includes('tucuman')) return MARCOS_NORMATIVOS.tucuman;
  if (normalizado.includes('entre_rios') || normalizado.includes('entrerios')) return MARCOS_NORMATIVOS.entre_rios;
  if (normalizado.includes('salta')) return MARCOS_NORMATIVOS.salta;
  if (normalizado.includes('jujuy')) return MARCOS_NORMATIVOS.jujuy;

  return MARCOS_NORMATIVOS[normalizado] || MARCOS_NORMATIVOS.default;
}

module.exports = {
  MARCOS_NORMATIVOS,
  obtenerMarcoNormativo
};
