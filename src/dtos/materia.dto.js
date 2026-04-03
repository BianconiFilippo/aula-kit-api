class CreateMateriaDto {
  constructor(data, usuarioId) {
    this.nombre = data.nombre;
    this.usuarioId = usuarioId;
  }

  isValid() {
    return this.nombre && this.usuarioId;
  }
}

module.exports = { CreateMateriaDto };
