const supabase = require('./supabase');
const prisma = require('./db');
const UsuarioModel = require('../models/usuario.model');

class AuthService {
  async register(registerDto) {
    const { data, error } = await supabase.auth.signUp({
      email: registerDto.email,
      password: registerDto.password,
    });

    if (error) throw error;

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        id: data.user.id, 
        email: registerDto.email,
        nombreCompleto: registerDto.nombreCompleto
      }
    });

    return new UsuarioModel(nuevoUsuario);
  }

  async login(loginDto) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginDto.email,
      password: loginDto.password,
    });

    if (error) throw error;
    return data.session;
  }
}

module.exports = new AuthService();
