const supabase = require('./supabase');

class AuthService {

  _mapUser(supabaseUser, fallbackName = 'Usuario') {
    const metadata = supabaseUser.user_metadata || {};
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      nombreCompleto: metadata.nombreCompleto || metadata.full_name || fallbackName
    };
  }

  async register(registerDto) {
    const { data, error } = await supabase.auth.signUp({
      email: registerDto.email,
      password: registerDto.password,
      options: {
        data: {
          nombreCompleto: registerDto.nombreCompleto
        }
      }
    });

    if (error) throw error;

    return {
      access_token: data.session?.access_token || null,
      user: this._mapUser(data.user, registerDto.nombreCompleto)
    };
  }

  async login(loginDto) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginDto.email,
      password: loginDto.password,
    });

    if (error) throw error;

    return {
      access_token: data.session.access_token,
      user: this._mapUser(data.user)
    };
  }

}

module.exports = new AuthService();