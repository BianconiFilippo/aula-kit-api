const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { randomUUID } = require('crypto');

/**
 * Detecta si un buffer corresponde a formato HEIF/HEIC (típico de fotos de iPhone).
 * @param {Buffer} buffer 
 * @returns {boolean}
 */
function isHeicBuffer(buffer) {
  if (!buffer || buffer.length < 12) return false;
  // Los archivos HEIF/HEIC contienen 'ftypheic', 'ftypmif1', 'ftypmsf1', o 'ftypheix' en los primeros bytes
  const magic = buffer.slice(4, 12).toString('ascii');
  return magic.includes('ftyp') || buffer.slice(4, 16).toString('ascii').includes('heic');
}

/**
 * Convierte un buffer de imagen a JPEG estándar compatible con navegadores y GPT-4o Vision.
 * Si es HEIC/HEIF o un formato contenedor de Apple, utiliza la utilidad del sistema 'sips'.
 * @param {Buffer} buffer - Buffer original
 * @param {string} originalName - Nombre del archivo original
 * @returns {{ buffer: Buffer, mimetype: string, filename: string }}
 */
function ensureBrowserCompatibleImage(buffer, originalName = 'imagen.jpg') {
  if (!buffer) {
    return { buffer, mimetype: 'image/jpeg', filename: originalName };
  }

  const isHeic = isHeicBuffer(buffer);

  if (isHeic) {
    const tempDir = os.tmpdir();
    const tempIn = path.join(tempDir, `in_${Date.now()}_${randomUUID()}.heic`);
    const tempOut = path.join(tempDir, `out_${Date.now()}_${randomUUID()}.jpg`);

    try {
      fs.writeFileSync(tempIn, buffer);
      // Usar sips nativo de macOS para conversión instantánea a JPEG
      execSync(`/usr/bin/sips -s format jpeg "${tempIn}" --out "${tempOut}"`, { stdio: 'pipe' });

      if (fs.existsSync(tempOut)) {
        const convertedBuffer = fs.readFileSync(tempOut);
        const newName = originalName.replace(/\.[^/.]+$/, '') + '.jpg';
        return {
          buffer: convertedBuffer,
          mimetype: 'image/jpeg',
          filename: newName
        };
      }
    } catch (err) {
      console.warn('Advertencia en conversión HEIC con sips:', err.message);
    } finally {
      if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
      if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
    }
  }

  // Si no es HEIC, determinar mime type adecuado
  const ext = originalName.split('.').pop()?.toLowerCase();
  let mimetype = 'image/jpeg';
  if (ext === 'png') mimetype = 'image/png';
  else if (ext === 'webp') mimetype = 'image/webp';
  else if (ext === 'pdf') mimetype = 'application/pdf';

  return {
    buffer,
    mimetype,
    filename: originalName
  };
}

module.exports = {
  isHeicBuffer,
  ensureBrowserCompatibleImage
};
