const pptxgen = require('pptxgenjs');

/**
 * Paletas de colores por tema visual
 */
const THEMES = {
  light: {
    bg: 'FFFFFF',
    title: '0F172A', // Slate 900
    body: '334155',  // Slate 700
    kicker: '4F46E5', // Indigo 600
    accent: '6366F1',
    cardBg: 'F8FAFC',
    cardBorder: 'E2E8F0',
    cardText: '1E293B',
    badgeBg: '4F46E5',
    badgeText: 'FFFFFF'
  },
  dark: {
    bg: '0F172A', // Slate 900
    title: 'F8FAFC', // Slate 50
    body: 'CBD5E1',  // Slate 300
    kicker: '818CF8', // Indigo 400
    accent: '818CF8',
    cardBg: '1E293B', // Slate 800
    cardBorder: '334155',
    cardText: 'F1F5F9',
    badgeBg: '6366F1',
    badgeText: 'FFFFFF'
  },
  primary: {
    bg: '1E1B4B', // Indigo 950
    title: 'FFFFFF',
    body: 'E0E7FF', // Indigo 100
    kicker: 'A5B4FC', // Indigo 300
    accent: 'C7D2FE',
    cardBg: '312E81', // Indigo 900
    cardBorder: '4338CA',
    cardText: 'FFFFFF',
    badgeBg: '4338CA',
    badgeText: 'FFFFFF'
  }
};

/**
 * Normaliza el tipo de layout a uno de los soportados
 */
function normalizeLayout(layout) {
  if (!layout) return 'hero';
  const l = String(layout).toLowerCase();
  if (l === 'split_image_text' || l === 'split_50_50' || l === '2_columnas' || l === 'lectura') return 'split_image_text';
  if (l === 'grid_3' || l === 'infografia' || l === 'resumen') return 'grid_3';
  if (l === 'compare_2' || l === 'comparacion') return 'compare_2';
  if (l === 'timeline_steps' || l === 'pasos' || l === 'proceso' || l === 'actividad') return 'timeline_steps';
  if (l === 'quote' || l === 'cita' || l === 'debate') return 'quote';
  if (l === 'statement') return 'statement';
  return 'hero';
}

/**
 * Genera un buffer de PowerPoint (.pptx) nativo 16:9 a partir de los datos de la presentación
 * @param {Object} presentacion - Objeto con titulo_presentacion y diapositivas
 * @returns {Promise<Buffer>} Buffer del archivo .pptx
 */
async function generarPptxDesdePresentacion(presentacion) {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9'; // 16:9 panorámico (13.33 x 7.5 pulgadas)
  pptx.title = presentacion?.titulo_presentacion || 'Presentación AulaKit';

  const slides = Array.isArray(presentacion?.diapositivas) ? presentacion.diapositivas : [];

  for (let i = 0; i < slides.length; i++) {
    const s = slides[i];
    const layout = normalizeLayout(s.layoutType || s.layout);
    const themeName = (s.theme && THEMES[s.theme]) ? s.theme : 'light';
    const theme = THEMES[themeName];
    const content = s.content || s.contenido || {};
    const notasDocente = s.notas_docente || s.speakerNotes || s.notas_orador || '';

    const slide = pptx.addSlide();
    slide.background = { color: theme.bg };

    // Agregar notas del docente como notas de orador nativas en PowerPoint
    if (notasDocente && notasDocente.trim().length > 0) {
      slide.addNotes(notasDocente.trim());
    }

    const kicker = content.kicker || '';
    const title = content.title || content.titulo || '';
    const body = content.body || content.cuerpo || '';

    switch (layout) {
      case 'hero': {
        // Portada / Hero centrado de gran impacto
        let yPos = 1.6;
        if (kicker) {
          slide.addText(kicker.toUpperCase(), {
            x: 1.0, y: yPos, w: 11.33, h: 0.4,
            fontSize: 12, bold: true, color: theme.kicker, align: 'center', fontFace: 'Arial'
          });
          yPos += 0.5;
        }

        if (title) {
          slide.addText(title, {
            x: 1.0, y: yPos, w: 11.33, h: 2.0,
            fontSize: 38, bold: true, color: theme.title, align: 'center', valign: 'middle', fontFace: 'Arial'
          });
          yPos += 2.2;
        }

        if (body) {
          slide.addText(body, {
            x: 1.5, y: yPos, w: 10.33, h: 1.8,
            fontSize: 16, color: theme.body, align: 'center', fontFace: 'Arial', lineSpacingMultiple: 1.2
          });
        }
        break;
      }

      case 'split_image_text': {
        // Columna izquierda: texto (6 pulgadas)
        let textY = 1.0;
        if (kicker) {
          slide.addText(kicker.toUpperCase(), {
            x: 1.0, y: textY, w: 5.5, h: 0.35,
            fontSize: 11, bold: true, color: theme.kicker, fontFace: 'Arial'
          });
          textY += 0.45;
        }

        if (title) {
          slide.addText(title, {
            x: 1.0, y: textY, w: 5.5, h: 1.4,
            fontSize: 26, bold: true, color: theme.title, fontFace: 'Arial'
          });
          textY += 1.5;
        }

        if (body) {
          slide.addText(body, {
            x: 1.0, y: textY, w: 5.5, h: 3.5,
            fontSize: 14, color: theme.body, fontFace: 'Arial', lineSpacingMultiple: 1.2
          });
        }

        // Columna derecha: Imagen o tarjeta ilustrativa (5.5 pulgadas)
        const imgUrl = content.url || content.imageUrl || content.imagenUrl;
        if (imgUrl && (imgUrl.startsWith('http://') || imgUrl.startsWith('https://'))) {
          try {
            slide.addImage({
              path: imgUrl,
              x: 7.0, y: 1.2, w: 5.3, h: 5.0,
              sizing: { type: 'cover', w: 5.3, h: 5.0 }
            });
          } catch (imgErr) {
            console.warn('pptxService: no se pudo cargar imagen externa, renderizando tarjeta placeholder:', imgErr.message);
            renderImagePlaceholder(slide, theme, 7.0, 1.2, 5.3, 5.0, content.imagePrompt || title);
          }
        } else {
          renderImagePlaceholder(slide, theme, 7.0, 1.2, 5.3, 5.0, content.imagePrompt || title);
        }
        break;
      }

      case 'grid_3': {
        // Encabezado
        let gridY = 0.8;
        if (kicker) {
          slide.addText(kicker.toUpperCase(), {
            x: 1.0, y: gridY, w: 11.33, h: 0.35,
            fontSize: 11, bold: true, color: theme.kicker, fontFace: 'Arial'
          });
          gridY += 0.4;
        }

        if (title) {
          slide.addText(title, {
            x: 1.0, y: gridY, w: 11.33, h: 0.8,
            fontSize: 26, bold: true, color: theme.title, fontFace: 'Arial'
          });
          gridY += 0.85;
        }

        if (body) {
          slide.addText(body, {
            x: 1.0, y: gridY, w: 11.33, h: 0.6,
            fontSize: 13, color: theme.body, fontFace: 'Arial'
          });
          gridY += 0.7;
        }

        // 3 Tarjetas en cuadrícula
        const items = Array.isArray(content.items) && content.items.length > 0
          ? content.items
          : ['Pilar conceptual 1', 'Pilar conceptual 2', 'Pilar conceptual 3'];

        const colWidth = 3.5;
        const colGap = 0.41;
        const startX = 1.0;
        const cardY = Math.max(gridY + 0.1, 2.8);
        const cardH = 3.9;

        for (let j = 0; j < Math.min(items.length, 3); j++) {
          const colX = startX + j * (colWidth + colGap);

          // Fondo tarjeta
          slide.addShape('rect', {
            x: colX, y: cardY, w: colWidth, h: cardH,
            fill: { color: theme.cardBg },
            line: { color: theme.cardBorder, width: 1 },
            roundRadius: 0.15
          });

          // Badge número
          slide.addShape('roundRect', {
            x: colX + 0.3, y: cardY + 0.3, w: 0.5, h: 0.5,
            fill: { color: theme.badgeBg },
            roundRadius: 0.1
          });
          slide.addText(String(j + 1), {
            x: colX + 0.3, y: cardY + 0.3, w: 0.5, h: 0.5,
            fontSize: 12, bold: true, color: theme.badgeText, align: 'center', valign: 'middle', fontFace: 'Arial'
          });

          slide.addText(`PILAR ${j + 1}`, {
            x: colX + 0.95, y: cardY + 0.35, w: 2.2, h: 0.4,
            fontSize: 10, bold: true, color: theme.kicker, fontFace: 'Arial'
          });

          // Texto de la tarjeta
          slide.addText(items[j], {
            x: colX + 0.3, y: cardY + 1.0, w: colWidth - 0.6, h: cardH - 1.2,
            fontSize: 13, color: theme.cardText, fontFace: 'Arial', lineSpacingMultiple: 1.15
          });
        }
        break;
      }

      case 'compare_2': {
        // Encabezado
        let compY = 0.8;
        if (kicker) {
          slide.addText(kicker.toUpperCase(), {
            x: 1.0, y: compY, w: 11.33, h: 0.35,
            fontSize: 11, bold: true, color: theme.kicker, fontFace: 'Arial'
          });
          compY += 0.4;
        }

        if (title) {
          slide.addText(title, {
            x: 1.0, y: compY, w: 11.33, h: 0.8,
            fontSize: 26, bold: true, color: theme.title, fontFace: 'Arial'
          });
          compY += 0.85;
        }

        if (body) {
          slide.addText(body, {
            x: 1.0, y: compY, w: 11.33, h: 0.6,
            fontSize: 13, color: theme.body, fontFace: 'Arial'
          });
          compY += 0.7;
        }

        // 2 Columnas comparativas
        const colW = 5.4;
        const colGap = 0.53;
        const colY = Math.max(compY + 0.1, 2.7);
        const colH = 4.1;

        const ladoA = content.lado_a || { titulo: 'Opción / Modelo A', items: [], descripcion: '' };
        const ladoB = content.lado_b || { titulo: 'Opción / Modelo B', items: [], descripcion: '' };

        // Columna A
        renderCompareBox(slide, 1.0, colY, colW, colH, 'A', ladoA, theme, '4F46E5', 'EEF2FF');

        // Columna B
        renderCompareBox(slide, 1.0 + colW + colGap, colY, colW, colH, 'B', ladoB, theme, 'D97706', 'FFFBEB');
        break;
      }

      case 'timeline_steps': {
        // Encabezado
        let timeY = 0.8;
        if (kicker) {
          slide.addText(kicker.toUpperCase(), {
            x: 1.0, y: timeY, w: 11.33, h: 0.35,
            fontSize: 11, bold: true, color: theme.kicker, fontFace: 'Arial'
          });
          timeY += 0.4;
        }

        if (title) {
          slide.addText(title, {
            x: 1.0, y: timeY, w: 11.33, h: 0.8,
            fontSize: 26, bold: true, color: theme.title, fontFace: 'Arial'
          });
          timeY += 0.85;
        }

        if (body) {
          slide.addText(body, {
            x: 1.0, y: timeY, w: 11.33, h: 0.6,
            fontSize: 13, color: theme.body, fontFace: 'Arial'
          });
          timeY += 0.7;
        }

        const pasos = Array.isArray(content.pasos) && content.pasos.length > 0
          ? content.pasos
          : [
              { paso: 1, titulo: 'Fase Inicial', descripcion: 'Activación y formulación del problema' },
              { paso: 2, titulo: 'Desarrollo', descripcion: 'Exploración y aplicación práctica de conceptos' },
              { paso: 3, titulo: 'Conclusión', descripcion: 'Evaluación formativa y síntesis' }
            ];

        const stepCount = Math.min(pasos.length, 4);
        const stepW = (11.33 - (stepCount - 1) * 0.4) / stepCount;
        const stepY = Math.max(timeY + 0.1, 2.8);
        const stepH = 3.9;

        for (let k = 0; k < stepCount; k++) {
          const stepX = 1.0 + k * (stepW + 0.4);
          const p = pasos[k];

          slide.addShape('rect', {
            x: stepX, y: stepY, w: stepW, h: stepH,
            fill: { color: theme.cardBg },
            line: { color: theme.cardBorder, width: 1 },
            roundRadius: 0.15
          });

          // Badge número circular
          slide.addShape('ellipse', {
            x: stepX + 0.25, y: stepY + 0.3, w: 0.55, h: 0.55,
            fill: { color: theme.badgeBg }
          });
          slide.addText(String(p.paso || k + 1), {
            x: stepX + 0.25, y: stepY + 0.3, w: 0.55, h: 0.55,
            fontSize: 11, bold: true, color: theme.badgeText, align: 'center', valign: 'middle', fontFace: 'Arial'
          });

          slide.addText(p.titulo || `Paso ${k + 1}`, {
            x: stepX + 0.95, y: stepY + 0.35, w: stepW - 1.15, h: 0.5,
            fontSize: 12, bold: true, color: theme.title, fontFace: 'Arial'
          });

          const desc = p.descripcion || '';
          if (desc) {
            slide.addText(desc, {
              x: stepX + 0.25, y: stepY + 1.1, w: stepW - 0.5, h: stepH - 1.3,
              fontSize: 12, color: theme.cardText, fontFace: 'Arial', lineSpacingMultiple: 1.15
            });
          }
        }
        break;
      }

      case 'quote': {
        // Cita grande y autor
        slide.addText('“', {
          x: 1.5, y: 1.5, w: 10.33, h: 0.8,
          fontSize: 60, color: theme.kicker, align: 'center', fontFace: 'Georgia'
        });

        slide.addText(body || title || 'Reflexión clave de la clase', {
          x: 1.5, y: 2.3, w: 10.33, h: 2.8,
          fontSize: 26, italic: true, color: theme.title, align: 'center', valign: 'middle', fontFace: 'Georgia'
        });

        const cite = kicker || content.author || content.fuente || title || '';
        if (cite && cite !== body) {
          slide.addText(`— ${cite.toUpperCase()}`, {
            x: 2.0, y: 5.3, w: 9.33, h: 0.6,
            fontSize: 12, bold: true, color: theme.kicker, align: 'center', fontFace: 'Arial'
          });
        }
        break;
      }

      case 'statement': {
        // Idea fuerza o definición irrefutable
        let stmtY = 1.8;
        if (kicker) {
          slide.addText(kicker.toUpperCase(), {
            x: 1.5, y: stmtY, w: 10.33, h: 0.4,
            fontSize: 13, bold: true, color: theme.kicker, align: 'center', fontFace: 'Arial'
          });
          stmtY += 0.6;
        }

        slide.addText(title || body || 'Concepto central', {
          x: 1.5, y: stmtY, w: 10.33, h: 3.2,
          fontSize: 34, bold: true, color: theme.title, align: 'center', valign: 'middle', fontFace: 'Arial', lineSpacingMultiple: 1.2
        });
        break;
      }

      default: {
        slide.addText(title || 'Diapositiva', {
          x: 1.0, y: 1.0, w: 11.33, h: 1.2,
          fontSize: 28, bold: true, color: theme.title, fontFace: 'Arial'
        });
        if (body) {
          slide.addText(body, {
            x: 1.0, y: 2.4, w: 11.33, h: 4.0,
            fontSize: 15, color: theme.body, fontFace: 'Arial'
          });
        }
        break;
      }
    }

    // Pie de diapositiva discreto (Número de slide y título)
    slide.addText(`${i + 1}`, {
      x: 12.0, y: 6.9, w: 0.8, h: 0.35,
      fontSize: 10, color: theme.body, align: 'right', fontFace: 'Arial'
    });
  }

  return await pptx.write({ outputType: 'nodebuffer' });
}

function renderImagePlaceholder(slide, theme, x, y, w, h, prompt) {
  slide.addShape('rect', {
    x, y, w, h,
    fill: { color: theme.cardBg },
    line: { color: theme.cardBorder, width: 1 },
    roundRadius: 0.2
  });

  slide.addText('[ IMAGEN / DIAGRAMA EDUCATIVO ]', {
    x: x + 0.4, y: y + 1.8, w: w - 0.8, h: 0.5,
    fontSize: 12, bold: true, color: theme.kicker, align: 'center', fontFace: 'Arial'
  });

  if (prompt) {
    slide.addText(`Prompt: ${prompt}`, {
      x: x + 0.4, y: y + 2.5, w: w - 0.8, h: 1.8,
      fontSize: 10, italic: true, color: theme.body, align: 'center', fontFace: 'Arial'
    });
  }
}

function renderCompareBox(slide, x, y, w, h, badge, data, theme, badgeColor, boxBg) {
  slide.addShape('rect', {
    x, y, w, h,
    fill: { color: theme.cardBg },
    line: { color: theme.cardBorder, width: 1 },
    roundRadius: 0.15
  });

  // Badge
  slide.addShape('roundRect', {
    x: x + 0.3, y: y + 0.3, w: 0.5, h: 0.5,
    fill: { color: badgeColor },
    roundRadius: 0.1
  });
  slide.addText(badge, {
    x: x + 0.3, y: y + 0.3, w: 0.5, h: 0.5,
    fontSize: 12, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', fontFace: 'Arial'
  });

  slide.addText(data.titulo || `Columna ${badge}`, {
    x: x + 0.95, y: y + 0.35, w: w - 1.25, h: 0.45,
    fontSize: 14, bold: true, color: theme.title, fontFace: 'Arial'
  });

  let textY = y + 1.0;
  if (data.descripcion) {
    slide.addText(data.descripcion, {
      x: x + 0.3, y: textY, w: w - 0.6, h: 1.4,
      fontSize: 12, color: theme.cardText, fontFace: 'Arial', lineSpacingMultiple: 1.15
    });
    textY += 1.5;
  }

  if (Array.isArray(data.items) && data.items.length > 0) {
    const textObjects = data.items.map(it => ({
      text: it,
      options: { bullet: true, fontSize: 12, color: theme.cardText, breakLine: true }
    }));
    slide.addText(textObjects, {
      x: x + 0.3, y: textY, w: w - 0.6, h: (y + h) - textY - 0.2,
      fontFace: 'Arial', lineSpacingMultiple: 1.15
    });
  }
}

module.exports = {
  generarPptxDesdePresentacion
};
