import { InvalidParamError, MissingParamError } from '../../errors';
import {
  badRequest,
  ok,
  serverError,
  unauthorized,
} from '../../helpers/http-helper';
import { LoginController } from './login';
import { EmailValidator, Authentication, HttpRequest } from './login-protocols';

interface SutTypes {
  sut: LoginController;
  emailValidatorSub: EmailValidator;
  authenticationSub: Authentication;
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

const makeAuthentication = (): Authentication => {
  class AuthenticationStub implements Authentication {
    async auth(email: string, password: string): Promise<string> {
      return new Promise((resolve) => resolve('any_token'));
    }
  }
  return new AuthenticationStub();
};

const makeSut = (): SutTypes => {
  const emailValidatorSub = makeEmailValidator();
  const authenticationSub = makeAuthentication();
  const sut = new LoginController(emailValidatorSub, authenticationSub);
  return {
    sut,
    emailValidatorSub,
    authenticationSub,
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

  test('Should call Authentication with correct values', async () => {
    const { sut, authenticationSub } = makeSut();
    const authSpy = jest.spyOn(authenticationSub, 'auth');
    await sut.handle(makeFakeRequest());
    expect(authSpy).toHaveBeenCalledWith('any_email@email.com', 'any_password');
  });

  test('Should return 401 if invalid credentials are provided', async () => {
    const { sut, authenticationSub } = makeSut();
    jest
      .spyOn(authenticationSub, 'auth')
      .mockReturnValueOnce(new Promise((resolve) => resolve(null)));
    const httpResponse = await sut.handle(makeFakeRequest());
    expect(httpResponse).toEqual(unauthorized());
  });

  test('Should return 500 if Authentication throws', async () => {
    const { sut, authenticationSub } = makeSut();
    jest.spyOn(authenticationSub, 'auth').mockImplementationOnce(() => {
      throw new Error();
    });
    const httpResponse = await sut.handle(makeFakeRequest());
    expect(httpResponse).toEqual(serverError(new Error()));
  });

  test('Should return 200 if valid credentials are provided', async () => {
    const { sut } = makeSut();
    const httpResponse = await sut.handle(makeFakeRequest());
    expect(httpResponse).toEqual(ok({ accessToken: 'any_token' }));
  });
});
