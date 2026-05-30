const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Acceso denegado. Falta el token de autenticación.' });
    }

    const token = authHeader.split(' ')[1];

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Error validando token:', error.message);
      return res.status(401).json({ error: 'Token inválido o expirado.' });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error('Error en Auth Middleware:', error);
    res.status(500).json({ error: 'Error interno en el servidor.' });
  }
};

module.exports = authMiddleware;