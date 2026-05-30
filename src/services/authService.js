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

  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/login`,
      },
    });

    if (error) throw error;
    return data.url;
  }
}

module.exports = new AuthService();