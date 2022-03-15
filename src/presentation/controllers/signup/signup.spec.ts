/* eslint-disable max-classes-per-file */
import {
  InvalidParamError,
  MissingParamError,
  ServerError,
} from '../../errors';
import { ok, serverError, badRequest } from '../../helpers/http-helper';
import { SignUpController } from './signup';
import {
  EmailValidator,
  AddAccount,
  AccountModel,
  HttpRequest,
  Validation,
} from './signup-protocols';

const makeEmailValidator = (): EmailValidator => {
  class EmailValidatorStub implements EmailValidator {
    isValid(): boolean {
      return true;
    }
  }
  return new EmailValidatorStub();
};

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
  emailValidatorStub: EmailValidator;
  addAccountStub: AddAccount;
  validationSub: Validation;
}

const makeSut = (): SutTypes => {
  const emailValidatorStub = makeEmailValidator();
  const addAccountStub = makeAddAccount();
  const validationSub = makeValidation();
  const sut = new SignUpController(
    emailValidatorStub,
    addAccountStub,
    validationSub,
  );

  return {
    sut,
    emailValidatorStub,
    addAccountStub,
    validationSub,
  };
};

describe('SignUp Controller', () => {
  test('Should return 400 if no name is provided', async () => {
    const { sut } = makeSut();
    const httpRequest = {
      body: {
        email: 'any_email@email.com',
        password: 'any_password',
        passwordConfirmation: 'any_password',
      },
    };
    const httpResponse = await sut.handle(httpRequest);
    // esses 2 expects foram substituidos pelo abaixo
    // expect(httpResponse.statusCode).toBe(400);
    // expect(httpResponse.body).toEqual(new MissingParamError('name'));
    expect(httpResponse).toEqual(badRequest(new MissingParamError('name')));
  });

  test('Should return 400 if no email is provided', async () => {
    const { sut } = makeSut();
    const httpRequest = {
      body: {
        name: 'any_name',
        password: 'any_password',
        passwordConfirmation: 'any_password',
      },
    };
    const httpResponse = await sut.handle(httpRequest);
    // esses 2 expects foram substituidos pelo abaixo
    // expect(httpResponse.statusCode).toBe(400);
    // expect(httpResponse.body).toEqual(new MissingParamError('email'));
    expect(httpResponse).toEqual(badRequest(new MissingParamError('email')));
  });

  test('Should return 400 if no password is provided', async () => {
    const { sut } = makeSut();
    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'any_email@email.com',
        passwordConfirmation: 'any_password',
      },
    };
    const httpResponse = await sut.handle(httpRequest);
    // esses 2 expects foram substituidos pelo abaixo
    // expect(httpResponse.statusCode).toBe(400);figm
    // expect(httpResponse.body).toEqual(new MissingParamError('password'));
    expect(httpResponse).toEqual(badRequest(new MissingParamError('password')));
  });

  test('Should return 400 if no password confirmation is provided', async () => {
    const { sut } = makeSut();
    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'any_email@email.com',
        password: 'any_password',
      },
    };
    const httpResponse = await sut.handle(httpRequest);
    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body).toEqual(
      new MissingParamError('passwordConfirmation'),
    );
  });

  test('Should return 400 if password confirmation fails', async () => {
    const { sut } = makeSut();
    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'any_email@email.com',
        password: 'any_password',
        passwordConfirmation: 'invalid_password',
      },
    };
    const httpResponse = await sut.handle(httpRequest);
    // esses 2 expects foram substituidos pelo abaixo
    // expect(httpResponse.statusCode).toBe(400);
    // expect(httpResponse.body).toEqual(
    //   new InvalidParamError('passwordConfirmation'),
    // );
    expect(httpResponse).toEqual(
      badRequest(new InvalidParamError('passwordConfirmation')),
    );
  });

  test('Should return 400 if an invalid email is provided', async () => {
    const { sut, emailValidatorStub } = makeSut();
    jest.spyOn(emailValidatorStub, 'isValid').mockReturnValueOnce(false);
    const httpResponse = await sut.handle(makeFakeRequest());
    // esses 2 expects foram substituidos pelo abaixo
    // expect(httpResponse.statusCode).toBe(400);
    // expect(httpResponse.body).toEqual(new InvalidParamError('email'));
    expect(httpResponse).toEqual(badRequest(new InvalidParamError('email')));
  });

  test('Should call EmailValidator with correct email', () => {
    const { sut, emailValidatorStub } = makeSut();
    const isValidSpy = jest.spyOn(emailValidatorStub, 'isValid');
    sut.handle(makeFakeRequest());
    expect(isValidSpy).toHaveBeenCalledWith('any_email@email.com');
  });

  test('Should return 500 if EmailValidator throws', async () => {
    const { sut, emailValidatorStub } = makeSut();
    jest.spyOn(emailValidatorStub, 'isValid').mockImplementationOnce(() => {
      throw new Error();
    });
    const httpResponse = await sut.handle(makeFakeRequest());
    // esses 2 expects foram substituidos pelo abaixo
    // expect(httpResponse.statusCode).toBe(500);
    // expect(httpResponse.body).toEqual(new ServerError());
    expect(httpResponse).toEqual(serverError(new ServerError()));
  });

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
});
