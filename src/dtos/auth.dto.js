class RegisterDto {
  constructor(data) {
    this.email = data.email;
    this.password = data.password;
    this.nombreCompleto = data.nombreCompleto;
  }

  isValid() {
    return this.email && this.password && this.nombreCompleto;
  }
}

class LoginDto {
  constructor(data) {
    this.email = data.email;
    this.password = data.password;
  }

  isValid() {
    return this.email && this.password;
  }
}

module.exports = { RegisterDto, LoginDto };
