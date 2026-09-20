class MateriaModel {
  constructor({ id, nombre, nivel, grado, usuarioId, createdAt, fuentes, carpetas }) {
    this.id = id;
    this.nombre = nombre;
    this.nivel = nivel || null;
    this.grado = grado || null;
    this.usuarioId = usuarioId;
    this.createdAt = createdAt;
    this.fuentes = fuentes || [];
    this.carpetas = carpetas || [];
  }
}

module.exports = MateriaModel;
