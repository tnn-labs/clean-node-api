import { InvalidParamError, MissingParamError } from '../../errors';
import { badRequest, serverError } from '../../helpers/http-helper';
import { HttpRequest } from '../../protocols';
import { EmailValidator } from '../signup/signup-protocols';
import { LoginController } from './login';

interface SutTypes {
  sut: LoginController;
  emailValidatorSub: EmailValidator;
}

const makeFakeRequest = (): HttpRequest => ({
  body: {
    email: 'any_email@email.com',
    password: 'any_password',
  },
});

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

  test('Should return 400 if invalid email is provided', async () => {
    const { sut, emailValidatorSub } = makeSut();
    jest.spyOn(emailValidatorSub, 'isValid').mockReturnValueOnce(false);
    const httpResponse = await sut.handle(makeFakeRequest());
    expect(httpResponse).toEqual(badRequest(new InvalidParamError('email')));
  });

  // esse teste garante a integração correta entre os componentes `LoginController` e `EmailValidator`
  // quando o handle do `sut` for chamado, internamente ele chamará o `isValid`
  test('Should call EmailValidator with correct email', async () => {
    const { sut, emailValidatorSub } = makeSut();
    const isValidSpy = jest.spyOn(emailValidatorSub, 'isValid');
    await sut.handle(makeFakeRequest());
    expect(isValidSpy).toHaveBeenCalledWith('any_email@email.com');
  });

  test('Should return 500 if EmailValidator throws', async () => {
    const { sut, emailValidatorSub } = makeSut();
    jest.spyOn(emailValidatorSub, 'isValid').mockImplementationOnce(() => {
      throw new Error();
    });
    const httpResponse = await sut.handle(makeFakeRequest());
    expect(httpResponse).toEqual(serverError(new Error()));
  });
});
