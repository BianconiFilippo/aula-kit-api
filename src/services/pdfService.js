const puppeteer = require('puppeteer');

async function generarPdfDesdeHtml(contenidoHtml, landscape = false) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const htmlCompleto = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            body {
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              line-height: 1.6;
              color: #1f2937;
              padding: 0;
              margin: 0;
              font-size: 15px;
            }
            p {
              page-break-inside: auto;
              margin-bottom: 14px;
            }
            h1, h2, h3 {
              page-break-after: avoid;
              page-break-inside: avoid;
              color: #111827;
              font-weight: 700;
              margin-top: 24px;
              margin-bottom: 12px;
            }
            h1 { font-size: 26px; }
            h2 { font-size: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
            h3 { font-size: 16px; }
            ul, ol {
              page-break-inside: avoid;
              margin-bottom: 16px;
              padding-left: 20px;
            }
            li {
              margin-bottom: 6px;
            }
            img {
              page-break-inside: avoid;
              max-width: 100%;
              height: auto;
              display: block;
              margin: 16px auto;
              border-radius: 8px;
            }
            .pdf-section {
              page-break-inside: avoid;
              margin-top: 24px;
            }
            .pdf-list {
              padding-left: 20px;
            }
            /* Slide specific layout styles */
            .slide-canvas {
              page-break-inside: avoid;
              page-break-after: always;
              width: 100%;
              box-sizing: border-box;
              margin-bottom: 40px;
            }
            .slide-canvas:last-child {
              page-break-after: avoid;
            }
          </style>
        </head>
        <body>
          ${contenidoHtml}
        </body>
      </html>
    `;

    await page.setContent(htmlCompleto, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: !!landscape,
      margin: landscape ? {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      } : {
        top: '2cm',
        right: '2cm',
        bottom: '2cm',
        left: '2cm'
      },
      printBackground: true
    });

    return pdfBuffer;
  } catch (error) {
    console.error('Error generating PDF via Puppeteer:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Genera un PDF nativo 16:9 con diseño panorámico de alta resolución para presentaciones
 * @param {Object} presentacionData - Objeto con titulo_presentacion y diapositivas
 * @returns {Promise<Buffer>} Buffer del archivo PDF generado
 */
async function generarPdfPresentacion(presentacionData) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

    const slides = Array.isArray(presentacionData?.diapositivas) ? presentacionData.diapositivas : [];
    const tituloPresentacion = escapeHtml(presentacionData?.titulo_presentacion || 'Presentación AulaKit');

    let slidesHtml = '';
    for (let i = 0; i < slides.length; i++) {
      const s = slides[i];
      const layout = s.layoutType || s.layout || 'hero';
      const theme = s.theme || 'light';
      const content = s.content || s.contenido || {};
      const kicker = escapeHtml(content.kicker || '');
      const title = escapeHtml(content.title || content.titulo || '');
      const body = escapeHtml(content.body || content.cuerpo || '');
      const imgUrl = content.url || content.imageUrl || content.imagenUrl || '';

      let bodyHtml = '';
      switch (layout) {
        case 'hero':
          bodyHtml = `
            <div class="content-hero">
              ${kicker ? `<div class="kicker">${kicker}</div>` : ''}
              ${title ? `<h1 class="hero-title">${title}</h1>` : ''}
              ${body ? `<p class="hero-body">${body}</p>` : ''}
            </div>
          `;
          break;

        case 'split_image_text':
          bodyHtml = `
            <div class="content-split">
              <div class="split-left">
                ${kicker ? `<div class="kicker">${kicker}</div>` : ''}
                ${title ? `<h2 class="slide-title">${title}</h2>` : ''}
                ${body ? `<p class="slide-body">${body}</p>` : ''}
              </div>
              <div class="split-right">
                ${imgUrl ? `<img src="${imgUrl}" class="split-image" alt="Ilustración" />` : `
                  <div class="image-placeholder">
                    <div class="ph-icon">🖼️</div>
                    <div class="ph-title">Esquema / Imagen Ilustrativa</div>
                    ${content.imagePrompt ? `<div class="ph-prompt">${escapeHtml(content.imagePrompt)}</div>` : ''}
                  </div>
                `}
              </div>
            </div>
          `;
          break;

        case 'grid_3': {
          const items = Array.isArray(content.items) ? content.items : ['Pilar 1', 'Pilar 2', 'Pilar 3'];
          bodyHtml = `
            <div class="content-grid-wrapper">
              <div class="header-group">
                ${kicker ? `<div class="kicker">${kicker}</div>` : ''}
                ${title ? `<h2 class="slide-title">${title}</h2>` : ''}
                ${body ? `<p class="slide-body">${body}</p>` : ''}
              </div>
              <div class="grid-3">
                ${items.slice(0, 3).map((it, idx) => `
                  <div class="grid-card">
                    <div class="card-badge">Pilar ${idx + 1}</div>
                    <div class="card-text">${escapeHtml(it)}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
          break;
        }

        case 'compare_2': {
          const ladoA = content.lado_a || { titulo: 'Opción A', items: [], descripcion: '' };
          const ladoB = content.lado_b || { titulo: 'Opción B', items: [], descripcion: '' };
          bodyHtml = `
            <div class="content-compare-wrapper">
              <div class="header-group">
                ${kicker ? `<div class="kicker">${kicker}</div>` : ''}
                ${title ? `<h2 class="slide-title">${title}</h2>` : ''}
                ${body ? `<p class="slide-body">${body}</p>` : ''}
              </div>
              <div class="compare-grid">
                <div class="compare-card compare-a">
                  <div class="compare-badge">A</div>
                  <h3 class="compare-col-title">${escapeHtml(ladoA.titulo || 'Lado A')}</h3>
                  ${ladoA.descripcion ? `<p class="compare-desc">${escapeHtml(ladoA.descripcion)}</p>` : ''}
                  ${Array.isArray(ladoA.items) && ladoA.items.length ? `
                    <ul class="compare-list">
                      ${ladoA.items.map(it => `<li>${escapeHtml(it)}</li>`).join('')}
                    </ul>
                  ` : ''}
                </div>
                <div class="compare-card compare-b">
                  <div class="compare-badge badge-b">B</div>
                  <h3 class="compare-col-title">${escapeHtml(ladoB.titulo || 'Lado B')}</h3>
                  ${ladoB.descripcion ? `<p class="compare-desc">${escapeHtml(ladoB.descripcion)}</p>` : ''}
                  ${Array.isArray(ladoB.items) && ladoB.items.length ? `
                    <ul class="compare-list">
                      ${ladoB.items.map(it => `<li>${escapeHtml(it)}</li>`).join('')}
                    </ul>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
          break;
        }

        case 'timeline_steps': {
          const pasos = Array.isArray(content.pasos) && content.pasos.length
            ? content.pasos
            : [{ paso: 1, titulo: 'Fase 1', descripcion: '' }, { paso: 2, titulo: 'Fase 2', descripcion: '' }, { paso: 3, titulo: 'Fase 3', descripcion: '' }];
          bodyHtml = `
            <div class="content-timeline-wrapper">
              <div class="header-group">
                ${kicker ? `<div class="kicker">${kicker}</div>` : ''}
                ${title ? `<h2 class="slide-title">${title}</h2>` : ''}
                ${body ? `<p class="slide-body">${body}</p>` : ''}
              </div>
              <div class="timeline-steps">
                ${pasos.slice(0, 4).map((p, idx) => `
                  <div class="timeline-card">
                    <div class="step-circle">${escapeHtml(p.paso || idx + 1)}</div>
                    <div class="step-title">${escapeHtml(p.titulo || `Paso ${idx + 1}`)}</div>
                    ${p.descripcion ? `<div class="step-desc">${escapeHtml(p.descripcion)}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          `;
          break;
        }

        case 'quote':
          bodyHtml = `
            <div class="content-quote">
              <div class="quote-symbol">“</div>
              <div class="quote-text">${body || title}</div>
              ${(kicker || title) ? `<div class="quote-author">— ${kicker || title}</div>` : ''}
            </div>
          `;
          break;

        case 'statement':
          bodyHtml = `
            <div class="content-statement">
              ${kicker ? `<div class="kicker">${kicker}</div>` : ''}
              <div class="statement-title">${title || body}</div>
            </div>
          `;
          break;

        default:
          bodyHtml = `
            <div class="content-default">
              ${title ? `<h2 class="slide-title">${title}</h2>` : ''}
              ${body ? `<p class="slide-body">${body}</p>` : ''}
            </div>
          `;
          break;
      }

      slidesHtml += `
        <div class="slide-page theme-${theme}">
          <div class="slide-inner">
            ${bodyHtml}
          </div>
          <div class="slide-footer">
            <span class="footer-title">${tituloPresentacion}</span>
            <span class="footer-num">${i + 1} / ${slides.length}</span>
          </div>
        </div>
      `;
    }

    const htmlCompleto = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            
            @page {
              size: 1920px 1080px;
              margin: 0;
            }

            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }

            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background-color: #0f172a;
            }

            .slide-page {
              width: 1920px;
              height: 1080px;
              page-break-after: always;
              position: relative;
              padding: 90px 140px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              overflow: hidden;
            }

            .slide-page:last-child {
              page-break-after: avoid;
            }

            /* TEMAS */
            .theme-light {
              background-color: #ffffff;
              color: #0f172a;
            }
            .theme-light .kicker { color: #4f46e5; }
            .theme-light .slide-title, .theme-light .hero-title { color: #0f172a; }
            .theme-light .slide-body, .theme-light .hero-body { color: #475569; }
            .theme-light .grid-card, .theme-light .compare-card, .theme-light .timeline-card {
              background-color: #f8fafc;
              border: 2px solid #e2e8f0;
              color: #1e293b;
            }
            .theme-light .slide-footer { color: #94a3b8; border-top: 1px solid #f1f5f9; }

            .theme-dark {
              background-color: #0b0f19;
              color: #f8fafc;
            }
            .theme-dark .kicker { color: #818cf8; }
            .theme-dark .slide-title, .theme-dark .hero-title { color: #ffffff; }
            .theme-dark .slide-body, .theme-dark .hero-body { color: #cbd5e1; }
            .theme-dark .grid-card, .theme-dark .compare-card, .theme-dark .timeline-card {
              background-color: #141c2e;
              border: 2px solid #25334e;
              color: #f1f5f9;
            }
            .theme-dark .slide-footer { color: #64748b; border-top: 1px solid #1e293b; }

            .theme-primary {
              background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
              color: #ffffff;
            }
            .theme-primary .kicker { color: #a5b4fc; }
            .theme-primary .slide-title, .theme-primary .hero-title { color: #ffffff; }
            .theme-primary .slide-body, .theme-primary .hero-body { color: #e0e7ff; }
            .theme-primary .grid-card, .theme-primary .compare-card, .theme-primary .timeline-card {
              background-color: #272368;
              border: 2px solid #4338ca;
              color: #ffffff;
            }
            .theme-primary .slide-footer { color: #818cf8; border-top: 1px solid #312e81; }

            /* TIPOGRAFIA & LAYOUTS */
            .kicker {
              font-size: 18px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.15em;
              margin-bottom: 20px;
            }

            .slide-inner {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }

            .slide-title {
              font-size: 52px;
              font-weight: 800;
              line-height: 1.15;
              letter-spacing: -0.02em;
              margin-bottom: 24px;
            }

            .slide-body {
              font-size: 26px;
              line-height: 1.6;
              font-weight: 400;
              max-width: 1400px;
            }

            /* HERO */
            .content-hero {
              text-align: center;
              max-width: 1300px;
              margin: 0 auto;
            }
            .hero-title {
              font-size: 68px;
              font-weight: 900;
              line-height: 1.1;
              letter-spacing: -0.03em;
              margin-bottom: 32px;
            }
            .hero-body {
              font-size: 28px;
              line-height: 1.6;
            }

            /* SPLIT */
            .content-split {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 80px;
              align-items: center;
            }
            .split-image {
              width: 100%;
              height: 580px;
              object-fit: cover;
              border-radius: 28px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            }
            .image-placeholder {
              width: 100%;
              height: 580px;
              border-radius: 28px;
              background: rgba(255,255,255,0.05);
              border: 3px dashed rgba(255,255,255,0.2);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 40px;
              text-align: center;
            }
            .ph-icon { font-size: 64px; margin-bottom: 16px; }
            .ph-title { font-size: 24px; font-weight: 700; margin-bottom: 12px; }
            .ph-prompt { font-size: 18px; opacity: 0.7; font-style: italic; }

            /* GRID 3 */
            .grid-3 {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 40px;
              margin-top: 40px;
            }
            .grid-card {
              border-radius: 24px;
              padding: 40px;
              display: flex;
              flex-direction: column;
              gap: 16px;
            }
            .card-badge {
              font-size: 16px;
              font-weight: 800;
              text-transform: uppercase;
              color: #6366f1;
            }
            .card-text {
              font-size: 22px;
              line-height: 1.5;
              font-weight: 500;
            }

            /* COMPARE 2 */
            .compare-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 50px;
              margin-top: 40px;
            }
            .compare-card {
              border-radius: 24px;
              padding: 44px;
              display: flex;
              flex-direction: column;
              gap: 16px;
            }
            .compare-badge {
              width: 44px;
              height: 44px;
              border-radius: 12px;
              background: #4f46e5;
              color: #ffffff;
              font-size: 20px;
              font-weight: 800;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .badge-b { background: #d97706; }
            .compare-col-title { font-size: 30px; font-weight: 800; }
            .compare-desc { font-size: 20px; line-height: 1.5; opacity: 0.9; }
            .compare-list { padding-left: 28px; font-size: 20px; line-height: 1.6; }

            /* TIMELINE */
            .timeline-steps {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
              gap: 36px;
              margin-top: 40px;
            }
            .timeline-card {
              border-radius: 24px;
              padding: 36px;
              display: flex;
              flex-direction: column;
              gap: 16px;
            }
            .step-circle {
              width: 48px;
              height: 48px;
              border-radius: 50%;
              background: #4f46e5;
              color: #ffffff;
              font-size: 20px;
              font-weight: 800;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .step-title { font-size: 24px; font-weight: 800; }
            .step-desc { font-size: 18px; line-height: 1.5; opacity: 0.85; }

            /* QUOTE */
            .content-quote {
              text-align: center;
              max-width: 1400px;
              margin: 0 auto;
            }
            .quote-symbol { font-size: 110px; color: #6366f1; line-height: 1; }
            .quote-text {
              font-size: 46px;
              font-style: italic;
              line-height: 1.35;
              margin: 20px 0 32px 0;
            }
            .quote-author {
              font-size: 22px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: #818cf8;
            }

            /* STATEMENT */
            .content-statement {
              text-align: center;
              max-width: 1400px;
              margin: 0 auto;
            }
            .statement-title {
              font-size: 64px;
              font-weight: 900;
              line-height: 1.2;
              letter-spacing: -0.02em;
            }

            /* FOOTER */
            .slide-footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding-top: 24px;
              font-size: 18px;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          ${slidesHtml}
        </body>
      </html>
    `;

    await page.setContent(htmlCompleto, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      width: '1920px',
      height: '1080px',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    return pdfBuffer;
  } catch (error) {
    console.error('Error generating Presentation PDF via Puppeteer:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = {
  generarPdfDesdeHtml,
  generarPdfPresentacion
};
