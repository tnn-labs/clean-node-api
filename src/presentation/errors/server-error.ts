export class ServerError extends Error {
  constructor(stack?: string) {
    // as classes que extendem de Error precisam invocar o método super
    super('Internal server error');
    // é uma boa pratica setar o this.name com o nome da classe
    this.name = 'ServerError';
    this.stack = stack;
  }
}
