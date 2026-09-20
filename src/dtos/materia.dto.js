class CreateMateriaDto {
  constructor(data, usuarioId) {
    this.nombre = data.nombre;
    this.nivel = data.nivel || null;
    this.grado = data.grado || null;
    this.usuarioId = usuarioId;
  }

  isValid() {
    return this.nombre && this.usuarioId;
  }
}

module.exports = { CreateMateriaDto };
