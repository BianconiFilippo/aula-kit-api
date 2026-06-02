const authService = require('../services/authService');
const { RegisterDto, LoginDto } = require('../dtos/auth.dto');

const prisma = require('../services/db');

const register = async (req, res) => {
  const registerDto = new RegisterDto(req.body);

  if (!registerDto.isValid()) {
    return res.status(400).json({ error: 'Faltan datos requeridos (email, password, nombreCompleto)' });
  }

  try {
    const session = await authService.register(registerDto);
    return res.status(201).json({ mensaje: "Usuario registrado", session });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const login = async (req, res) => {
  const loginDto = new LoginDto(req.body);

  if (!loginDto.isValid()) {
    return res.status(400).json({ error: 'Email y password son requeridos' });
  }

  try {
    const session = await authService.login(loginDto);
    return res.status(200).json({ mensaje: "Login exitoso", session });
  } catch (error) {
    return res.status(401).json({ error: "Credenciales inválidas o error de autenticación" });
  }
};

const obtenerPerfil = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    let dbUser = await prisma.usuario.findUnique({
      where: { id: usuarioId }
    });

    if (!dbUser) {
      dbUser = await prisma.usuario.create({
        data: {
          id: usuarioId,
          email: req.user.email,
          nombreCompleto: req.user.user_metadata?.nombreCompleto || req.user.user_metadata?.full_name || 'Usuario',
          tier: 'free',
          peticiones_ia_restantes: 3
        }
      });
    }

    return res.status(200).json(dbUser);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    return res.status(500).json({ error: 'Error al obtener el perfil del usuario' });
  }
};

module.exports = { register, login, obtenerPerfil };