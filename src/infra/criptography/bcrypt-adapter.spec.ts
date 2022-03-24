import bcrypt from 'bcrypt';

import { BcryptAdapter } from './bcrypt-adapter';

jest.mock('bcrypt', () => ({
  async hash(): Promise<string> {
    return new Promise((resolve) => resolve('hash'));
  },
  async compare(): Promise<boolean> {
    return new Promise((resolve) => resolve(true));
  },
}));

const salt = 12;
const makeSut = (): BcryptAdapter => {
  return new BcryptAdapter(salt);
};

describe('Bcrypt Adapter', () => {
  test('Should call hash with correct values', async () => {
    const sut = makeSut();
    const hashSpy = jest.spyOn(bcrypt, 'hash');
    await sut.hash('any_value');
    expect(hashSpy).toHaveBeenCalledWith('any_value', salt);
  });

  /* -------------------------------------------------- 
    [bcrypt.hash] fluxo de sucesso
  -------------------------------------------------- */
  test('Should return a valid hash on hash success', async () => {
    const sut = makeSut();
    const hash = await sut.hash('any_value');
    expect(hash).toBe('hash');
  });

  /* -------------------------------------------------- 
    [bcrypt.hash] em caso de exceção
  -------------------------------------------------- */
  test('Should throw if bcrypt.hash throws', async () => {
    const sut = makeSut();
    jest.spyOn(bcrypt, 'hash').mockImplementationOnce(() => {
      throw new Error();
    });
    const promise = sut.hash('any_value');
    await expect(promise).rejects.toThrow();
  });

  /* -------------------------------------------------- 
    [bcrypt.compare] deve chamar o método compare com 
    os mesmos valores que o sut recebeu
  -------------------------------------------------- */
  test('Should call compare with correct values', async () => {
    const sut = makeSut();
    const compareSpy = jest.spyOn(bcrypt, 'compare');
    await sut.compare('any_value', 'any_hash');
    expect(compareSpy).toHaveBeenCalledWith('any_value', 'any_hash');
  });

  /* -------------------------------------------------- 
    [bcrypt.compare] fluxo de sucesso
  -------------------------------------------------- */
  test('Should return true when compare succeeds', async () => {
    const sut = makeSut();
    const isValid = await sut.compare('any_value', 'any_hash');
    expect(isValid).toBe(true);
  });

  /* -------------------------------------------------- 
    [bcrypt.compare] em caso de falha
  -------------------------------------------------- */
  test('Should return false when compare fails', async () => {
    const sut = makeSut();
    jest.spyOn(bcrypt, 'compare').mockImplementationOnce(() => false);
    const isValid = await sut.compare('any_value', 'any_hash');
    expect(isValid).toBe(false);
  });

  /* -------------------------------------------------- 
    [bcrypt.compare] em caso de exceção
  -------------------------------------------------- */
  test('Should throw if bcrypt.compare throws', async () => {
    const sut = makeSut();
    jest.spyOn(bcrypt, 'compare').mockImplementationOnce(() => {
      throw new Error();
    });
    const promise = sut.compare('any_value', 'any_hash');
    await expect(promise).rejects.toThrow();
  });
});
