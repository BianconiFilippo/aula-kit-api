const rateLimit = require('express-rate-limit');

/**
 * Límite general para toda la API
 * 100 peticiones cada 15 minutos por IP
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas solicitudes desde esta dirección IP. Por favor, intenta nuevamente en 15 minutos.',
    code: 'GLOBAL_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Límite estricto para operaciones de IA y generación intensiva
 * 5 peticiones cada 10 minutos por IP o Usuario autenticado
 */
const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 5, // 5 peticiones
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  validate: { keyGeneratorIpFallback: false },
  handler: (_req, res) => {
    return res.status(429).json({
      error: 'Has superado el límite de generaciones. Por favor, espera unos minutos.',
      code: 'AI_RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * Límite ráfaga para evitar spam de clicks inmediatos (1 req cada 10 segundos)
 */
const aiGenerationLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 segundos
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  validate: { keyGeneratorIpFallback: false },
  handler: (_req, res) => {
    return res.status(429).json({
      error: 'Demasiadas solicitudes seguidas. Por favor, espera 10 segundos antes de generar otro recurso.',
      code: 'TOO_MANY_REQUESTS'
    });
  }
});

/**
 * Utilidad para envío seguro de cookies / sesiones
 * Garantiza httpOnly, secure (en producción) y sameSite: 'strict'
 */
const setSecureCookie = (res, name, value, options = {}) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const defaultOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días por defecto
    path: '/'
  };

  res.cookie(name, value, { ...defaultOptions, ...options });
};

module.exports = {
  globalLimiter,
  aiLimiter,
  aiGenerationLimiter,
  setSecureCookie
};
