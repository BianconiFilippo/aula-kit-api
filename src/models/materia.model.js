class MateriaModel {
  constructor({ id, nombre, usuarioId, createdAt, fuentes }) {
    this.id = id;
    this.nombre = nombre;
    this.usuarioId = usuarioId;
    this.createdAt = createdAt;
    this.fuentes = fuentes || [];
  }
}

module.exports = MateriaModel;
