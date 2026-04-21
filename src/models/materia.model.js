class MateriaModel {
  constructor({ id, nombre, usuarioId, createdAt, fuentes, carpetas }) {
    this.id = id;
    this.nombre = nombre;
    this.usuarioId = usuarioId;
    this.createdAt = createdAt;
    this.fuentes = fuentes || [];
    this.carpetas = carpetas || [];
  }
}

module.exports = MateriaModel;
