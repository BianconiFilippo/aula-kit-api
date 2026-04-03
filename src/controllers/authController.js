const authService = require('../services/authService');
const { RegisterDto, LoginDto } = require('../dtos/auth.dto');

const register = async (req, res) => {
  const registerDto = new RegisterDto(req.body);

  if (!registerDto.isValid()) {
    return res.status(400).json({ error: 'Faltan datos requeridos (email, password, nombreCompleto)' });
  }

  try {
    const usuario = await authService.register(registerDto);
    return res.status(201).json({ mensaje: "Usuario registrado", usuario });
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

module.exports = { register, login };