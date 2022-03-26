import { MissingParamError } from '../../errors';
import {
  badRequest,
  ok,
  serverError,
  unauthorized,
} from '../../helpers/http/http-helper';
import { LoginController } from './login-controller';
import {
  Authentication,
  AuthenticationModel,
  HttpRequest,
  Validation,
} from './login-controller-protocols';

interface SutTypes {
  sut: LoginController;
  authenticationSub: Authentication;
  validationSub: Validation;
}

const makeFakeRequest = (): HttpRequest => ({
  body: {
    email: 'any_email@email.com',
    password: 'any_password',
  },
});

const makeValidation = (): Validation => {
  class ValidationStub implements Validation {
    validate(input: any): Error {
      return null;
    }
  }
  return new ValidationStub();
};

const makeAuthentication = (): Authentication => {
  class AuthenticationStub implements Authentication {
    async auth(authentication: AuthenticationModel): Promise<string> {
      return new Promise((resolve) => resolve('any_token'));
    }
  }
  return new AuthenticationStub();
};

const makeSut = (): SutTypes => {
  const authenticationSub = makeAuthentication();
  const validationSub = makeValidation();
  const sut = new LoginController(authenticationSub, validationSub);
  return {
    sut,
    authenticationSub,
    validationSub,
  };
};

describe('Login Controller', () => {
  /* ---------------------------------------------------------
    6. esse teste garante a integração entre os componentes 
    `LoginController` e `Authentication`. Quando o handle for 
    chamado, internamente ele chamará o `auth`
  ---------------------------------------------------------- */
  test('Should call Authentication with correct values', async () => {
    const { sut, authenticationSub } = makeSut();
    const authSpy = jest.spyOn(authenticationSub, 'auth');
    await sut.handle(makeFakeRequest());
    expect(authSpy).toHaveBeenCalledWith({
      email: 'any_email@email.com',
      password: 'any_password',
    });
  });

  /* --------------------------------------------------------------
    7. esse teste garante que se as credenciais forem inválidas o 
    sistema retornará um erro 401 (o sistema não conhece o usuário).
  ---------------------------------------------------------------- */
  test('Should return 401 if invalid credentials are provided', async () => {
    const { sut, authenticationSub } = makeSut();
    jest
      .spyOn(authenticationSub, 'auth')
      .mockReturnValueOnce(new Promise((resolve) => resolve(null)));
    const httpResponse = await sut.handle(makeFakeRequest());
    expect(httpResponse).toEqual(unauthorized());
  });

  /* ------------------------------------------------------------- 
    8. esse teste garante que se o handle.authentication estourar
    uma exceção o sistema exibirá um erro do tipo serverError
  ------------------------------------------------------------- */
  test('Should return 500 if Authentication throws', async () => {
    const { sut, authenticationSub } = makeSut();
    jest.spyOn(authenticationSub, 'auth').mockImplementationOnce(() => {
      throw new Error();
    });
    const httpResponse = await sut.handle(makeFakeRequest());
    expect(httpResponse).toEqual(serverError(new Error()));
  });

  /* ------------------------------------------------------- 
    9. testa o fluxo de caso de sucesso. passando email e 
    password o sistema responde com um token
  ------------------------------------------------------ */
  test('Should return 200 if valid credentials are provided', async () => {
    const { sut } = makeSut();
    const httpResponse = await sut.handle(makeFakeRequest());
    expect(httpResponse).toEqual(ok({ accessToken: 'any_token' }));
  });

  /* ---------------------------------------------------------
    esse teste garante a integração entre os componentes 
    `LoginController` e `Validation`. Quando o handle for 
    chamado, internamente ele chamará o `validate` recebendo
    os valores do body
  ---------------------------------------------------------- */
  test('Should call Validation with correct value', async () => {
    const { sut, validationSub } = makeSut();
    const validateSpy = jest.spyOn(validationSub, 'validate');
    const httpRequest = makeFakeRequest();
    await sut.handle(httpRequest);
    expect(validateSpy).toHaveBeenCalledWith(httpRequest.body);
  });

  /* ---------------------------------------------------------
    esse teste garante que se o Validation retornar um erro,
    deve ser exibido um erro do tipo 400
  ---------------------------------------------------------- */
  test('Should return 400 if Validation returns an error', async () => {
    const { sut, validationSub } = makeSut();
    jest
      .spyOn(validationSub, 'validate')
      .mockReturnValueOnce(new MissingParamError('any_field'));
    const httpResponse = await sut.handle(makeFakeRequest());
    expect(httpResponse).toEqual(
      badRequest(new MissingParamError('any_field')),
    );
  });
});
