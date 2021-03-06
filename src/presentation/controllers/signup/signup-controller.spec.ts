/* eslint-disable max-classes-per-file */
import { MissingParamError, ServerError } from '../../errors';
import { ok, serverError, badRequest } from '../../helpers/http/http-helper';
import { SignUpController } from './signup-controller';
import {
  AddAccount,
  AccountModel,
  HttpRequest,
  Validation,
} from './signup-controller-protocols';

const makeFakeAccount = (): AccountModel => ({
  id: 'valid_id',
  name: 'valid_name',
  email: 'valid_email@mail.com',
  password: 'valid_password',
});

const makeFakeRequest = (): HttpRequest => ({
  body: {
    name: 'any_name',
    email: 'any_email@email.com',
    password: 'any_password',
    passwordConfirmation: 'any_password',
  },
});

const makeAddAccount = (): AddAccount => {
  class AddAccountStub implements AddAccount {
    async add(): Promise<AccountModel> {
      return new Promise((resolve) => resolve(makeFakeAccount()));
    }
  }
  return new AddAccountStub();
};

const makeValidation = (): Validation => {
  class ValidationStub implements Validation {
    validate(input: any): Error {
      return null;
    }
  }
  return new ValidationStub();
};
interface SutTypes {
  sut: SignUpController;
  addAccountStub: AddAccount;
  validationSub: Validation;
}

const makeSut = (): SutTypes => {
  const addAccountStub = makeAddAccount();
  const validationSub = makeValidation();
  const sut = new SignUpController(addAccountStub, validationSub);

  return {
    sut,
    addAccountStub,
    validationSub,
  };
};

describe('SignUp Controller', () => {
  test('Should return 500 if AddAccount throws', async () => {
    const { sut, addAccountStub } = makeSut();
    jest.spyOn(addAccountStub, 'add').mockImplementationOnce(() => {
      return new Promise((_, reject) => reject(new Error()));
    });
    const httpResponse = await sut.handle(makeFakeRequest());
    // esses 2 expects foram substituidos pelo abaixo
    // expect(httpResponse.statusCode).toBe(500);
    // expect(httpResponse.body).toEqual(new ServerError());
    expect(httpResponse).toEqual(serverError(new ServerError()));
  });

  test('Should call AddAccount with correct values', () => {
    const { sut, addAccountStub } = makeSut();
    const addSpy = jest
      .spyOn(addAccountStub, 'add')
      .mockImplementationOnce(() => {
        throw new Error();
      });
    sut.handle(makeFakeRequest());
    expect(addSpy).toHaveBeenCalledWith({
      name: 'any_name',
      email: 'any_email@email.com',
      password: 'any_password',
    });
  });

  test('Should return 200 if valid data is provided', async () => {
    const { sut } = makeSut();
    const httpResponse = await sut.handle(makeFakeRequest());
    // esses 2 expects foram substituidos pelo abaixo
    // expect(httpResponse.statusCode).toBe(200);
    // expect(httpResponse.body).toEqual(makeFakeAccount());
    expect(httpResponse).toEqual(ok(makeFakeAccount()));
  });

  /* ---------------------------------------------------------
    esse teste garante a integra????o entre os componentes 
    `LoginController` e `Validation`. Quando o handle for 
    chamado, internamente ele chamar?? o `validate` recebendo
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
