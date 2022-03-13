import { MissingParamError } from '../../errors';
import { badRequest } from '../../helpers/http-helper';
import { EmailValidator } from '../signup/signup-protocols';
import { LoginController } from './login';

interface SutTypes {
  sut: LoginController;
  emailValidatorSub: EmailValidator;
}

const makeEmailValidator = (): EmailValidator => {
  class EmailValidatorStub implements EmailValidator {
    isValid(email: string): boolean {
      return true;
    }
  }
  return new EmailValidatorStub();
};

const makeSut = (): SutTypes => {
  const emailValidatorSub = makeEmailValidator();
  const sut = new LoginController(emailValidatorSub);
  return {
    sut,
    emailValidatorSub,
  };
};

describe('Login Controller', () => {
  test('Should return 400 if no email is provided', async () => {
    const { sut } = makeSut();
    const httpRequest = {
      body: {
        // email: 'any_email@email.com',
        password: 'any_password',
      },
    };
    const httpResponse = await sut.handle(httpRequest);
    // como está comparando objetos, deve ser utilizado o toEqual
    expect(httpResponse).toEqual(badRequest(new MissingParamError('email')));
  });

  test('Should return 400 if no password is provided', async () => {
    const { sut } = makeSut();
    const httpRequest = {
      body: {
        email: 'any_email@email.com',
        // password: 'any_password',
      },
    };
    const httpResponse = await sut.handle(httpRequest);
    expect(httpResponse).toEqual(badRequest(new MissingParamError('password')));
  });

  // esse teste garante a integração correta entre os componentes `LoginController` e `EmailValidator`
  // quando o handle do `sut` for chamado, internamente ele chamará o `isValid`
  test('Should call EmailValidator with correct email', async () => {
    const { sut, emailValidatorSub } = makeSut();
    const isValidSpy = jest.spyOn(emailValidatorSub, 'isValid');
    const httpRequest = {
      body: {
        email: 'any_email@email.com',
        password: 'any_password',
      },
    };
    await sut.handle(httpRequest);
    expect(isValidSpy).toHaveBeenCalledWith('any_email@email.com');
  });
});
