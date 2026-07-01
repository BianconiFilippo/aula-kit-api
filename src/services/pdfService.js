const puppeteer = require('puppeteer');

async function generarPdfDesdeHtml(contenidoHtml, landscape = false) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
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

module.exports = {
  generarPdfDesdeHtml
};
