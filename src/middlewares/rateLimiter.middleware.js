const rateLimit = require('express-rate-limit');

const aiGenerationLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 1, // Limit each IP or User to 1 request per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Prefer user ID to prevent IP collisions, fallback to client IP
    return req.user?.id || req.ip;
  },
  validate: { keyGeneratorIpFallback: false }, // Disable keyGenerator validations to prevent startup validation crashes
  handler: (req, res, next, options) => {
    return res.status(429).json({
      error: 'Demasiadas solicitudes. Por favor, espera 10 segundos antes de generar otro recurso.',
      code: 'TOO_MANY_REQUESTS'
    });
  }
});

module.exports = { aiGenerationLimiter };
