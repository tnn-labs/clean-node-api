/* eslint-disable max-classes-per-file */
import { DbAuthentication } from './db-authentication';
import {
  AuthenticationModel,
  AccountModel,
  UpdateAccessTokenRepository,
  LoadAccountByEmailRepository,
  Encrypter,
  HashComparer,
} from './db-authentication-protocols';

const makeFakeAccount = (): AccountModel => ({
  id: 'any_id',
  name: 'any_name',
  email: 'any_email@mail.com',
  password: 'hashed_password',
});

const makeFakeAuthentication = (): AuthenticationModel => ({
  email: 'any_email@email.com',
  password: 'any_password',
});

const makeLoadAccountByEmailRepository = (): LoadAccountByEmailRepository => {
  class LoadAccountByEmailRepositoryStub
    implements LoadAccountByEmailRepository
  {
    async loadByEmail(email: string): Promise<AccountModel> {
      return new Promise((resolve) => resolve(makeFakeAccount()));
    }
  }
  return new LoadAccountByEmailRepositoryStub();
};

const makeHashComparer = (): HashComparer => {
  class HashComparerStub implements HashComparer {
    async compare(value: string, hash: string): Promise<boolean> {
      return new Promise((resolve) => resolve(true));
    }
  }
  return new HashComparerStub();
};

const makeEncrypter = (): Encrypter => {
  class EncrypterStub implements Encrypter {
    async encrypt(value: string): Promise<string> {
      return new Promise((resolve) => resolve('any_token'));
    }
  }
  return new EncrypterStub();
};

const makeUpdateAccessTokenRepository = (): UpdateAccessTokenRepository => {
  class UpdateAccessTokenRepositoryStub {
    async updateAccessToken(id: string, token: string): Promise<void> {
      return new Promise((resolve) => resolve());
    }
  }
  return new UpdateAccessTokenRepositoryStub();
};

interface SutTypes {
  loadAccountByEmailRepositoryStub: LoadAccountByEmailRepository;
  sut: DbAuthentication;
  hashComparerStub: HashComparer;
  encrypterStub: Encrypter;
  updateAccessTokenRepositoryStub: UpdateAccessTokenRepository;
}

const makeSut = (): SutTypes => {
  const loadAccountByEmailRepositoryStub = makeLoadAccountByEmailRepository();
  const hashComparerStub = makeHashComparer();
  const encrypterStub = makeEncrypter();
  const updateAccessTokenRepositoryStub = makeUpdateAccessTokenRepository();
  const sut = new DbAuthentication(
    loadAccountByEmailRepositoryStub,
    hashComparerStub,
    encrypterStub,
    updateAccessTokenRepositoryStub,
  );
  return {
    sut,
    loadAccountByEmailRepositoryStub,
    updateAccessTokenRepositoryStub,
    encrypterStub,
    hashComparerStub,
  };
};

describe('DbAuthentication UseCase', () => {
  /* ---------------------------------------------------------
    esse teste garante a integração entre os componentes 
    `DbAuthentication` e `LoadAccountByEmailRepository`
  ---------------------------------------------------------- */
  test('Should call LoadAccountByEmailRepository with correct email', async () => {
    const { loadAccountByEmailRepositoryStub, sut } = makeSut();
    const loadSpy = jest.spyOn(loadAccountByEmailRepositoryStub, 'loadByEmail');
    await sut.auth(makeFakeAuthentication());
    expect(loadSpy).toHaveBeenCalledWith('any_email@email.com');
  });

  /* ---------------------------------------------------------
    se o LoadAccountByEmailRepository exibir uma exceção, 
    deve ser repassada
  ---------------------------------------------------------- */
  test('Should throw if LoadAccountByEmailRepository throws', async () => {
    const { loadAccountByEmailRepositoryStub, sut } = makeSut();
    jest
      .spyOn(loadAccountByEmailRepositoryStub, 'loadByEmail')
      .mockReturnValueOnce(
        new Promise((resolve, reject) => reject(new Error())),
      );
    const promise = sut.auth(makeFakeAuthentication());
    await expect(promise).rejects.toThrow();
  });

  /* ---------------------------------------------------------
    o DbAuthentication deve retornar null se o 
    LoadAccountByEmailRepository retornar null 
  ---------------------------------------------------------- */
  test('Should return null if LoadAccountByEmailRepository returns null', async () => {
    const { loadAccountByEmailRepositoryStub, sut } = makeSut();
    jest
      .spyOn(loadAccountByEmailRepositoryStub, 'loadByEmail')
      .mockReturnValueOnce(null);
    const accessToken = await sut.auth(makeFakeAuthentication());
    expect(accessToken).toBeNull();
  });

  /* --------------------------------------------------------
    comparação entre a senha informada pelo usuário e a que 
    está armazenada no banco de dados
  ---------------------------------------------------------- */
  test('Should call HashComparer with correct values', async () => {
    const { hashComparerStub, sut } = makeSut();
    const compareSpy = jest.spyOn(hashComparerStub, 'compare');
    await sut.auth(makeFakeAuthentication());
    expect(compareSpy).toHaveBeenCalledWith('any_password', 'hashed_password');
  });

  /* ---------------------------------------------------------
    se o HashComparer exibir uma exceção, deve ser repassada
  ---------------------------------------------------------- */
  test('Should throw if HashComparer throws', async () => {
    const { hashComparerStub, sut } = makeSut();
    jest
      .spyOn(hashComparerStub, 'compare')
      .mockReturnValueOnce(new Promise((_, reject) => reject(new Error())));
    const promise = sut.auth(makeFakeAuthentication());
    await expect(promise).rejects.toThrow();
  });

  /* ---------------------------------------------------------
    se a comparação falhar deve retornar null
  ---------------------------------------------------------- */
  test('Should return null if HashComparer returns false', async () => {
    const { hashComparerStub, sut } = makeSut();
    jest
      .spyOn(hashComparerStub, 'compare')
      .mockReturnValueOnce(new Promise((resolve) => resolve(false)));
    const accessToken = await sut.auth(makeFakeAuthentication());
    expect(accessToken).toBeNull();
  });

  /* ---------------------------------------------------------
    gerar token de acesso baseado no id informado
  ---------------------------------------------------------- */
  test('Should call Encrypter with correct id', async () => {
    const { encrypterStub, sut } = makeSut();
    const generateSpy = jest.spyOn(encrypterStub, 'encrypt');
    await sut.auth(makeFakeAuthentication());
    expect(generateSpy).toHaveBeenCalledWith('any_id');
  });

  /* ---------------------------------------------------------
    se o Encrypter exibir uma exceção, deve ser repassada
  ---------------------------------------------------------- */
  test('Should throw if Encrypter throws', async () => {
    const { encrypterStub, sut } = makeSut();
    jest
      .spyOn(encrypterStub, 'encrypt')
      .mockReturnValueOnce(new Promise((_, reject) => reject(new Error())));
    const promise = sut.auth(makeFakeAuthentication());
    await expect(promise).rejects.toThrow();
  });

  /* ---------------------------------------------------------
    teste do caso do sucesso
  ---------------------------------------------------------- */
  test('Should return a token on success', async () => {
    const { sut } = makeSut();
    const accessToken = await sut.auth(makeFakeAuthentication());
    expect(accessToken).toBe('any_token');
  });

  /* ---------------------------------------------------------
    garante a composição entre os componentes DbAuthentication 
    e UpdateAccessToken.
  ---------------------------------------------------------- */
  test('Should call UpdateAccessTokenRepository with correct values', async () => {
    const { sut, updateAccessTokenRepositoryStub } = makeSut();
    const updateSpy = jest.spyOn(
      updateAccessTokenRepositoryStub,
      'updateAccessToken',
    );
    await sut.auth(makeFakeAuthentication());
    expect(updateSpy).toHaveBeenCalledWith('any_id', 'any_token');
  });

  /* ---------------------------------------------------------
    se o UpdateAccessTokenRepository exibir uma exceção, deve ser repassada
  ---------------------------------------------------------- */
  test('Should throw if UpdateAccessTokenRepository throws', async () => {
    const { updateAccessTokenRepositoryStub, sut } = makeSut();
    jest
      .spyOn(updateAccessTokenRepositoryStub, 'updateAccessToken')
      .mockReturnValueOnce(new Promise((_, reject) => reject(new Error())));
    const promise = sut.auth(makeFakeAuthentication());
    await expect(promise).rejects.toThrow();
  });
});
