class MateriaModel {
  constructor({ id, nombre, usuarioId, createdAt }) {
    this.id = id;
    this.nombre = nombre;
    this.usuarioId = usuarioId;
    this.createdAt = createdAt;
  }
}

module.exports = MateriaModel;
