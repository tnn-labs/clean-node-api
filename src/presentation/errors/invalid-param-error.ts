export class InvalidParamError extends Error {
  constructor(paramName: string) {
    // as classes que extendem de Error precisam invocar o método super
    super(`Invalid param: ${paramName}`);
    // é uma boa pratica setar o this.name com o nome da classe
    this.name = 'MissingParamError';
  }
}
