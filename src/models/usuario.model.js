class UsuarioModel {
  constructor({ id, email, nombreCompleto, planActual, tier, peticiones_ia_restantes, fecha_ultimo_reinicio }) {
    this.id = id;
    this.email = email;
    this.nombreCompleto = nombreCompleto;
    this.planActual = planActual || 'gratis';
    this.tier = tier || 'free';
    this.peticiones_ia_restantes = peticiones_ia_restantes !== undefined ? peticiones_ia_restantes : 3;
    this.fecha_ultimo_reinicio = fecha_ultimo_reinicio || null;
  }
}

module.exports = UsuarioModel;
