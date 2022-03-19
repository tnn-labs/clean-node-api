import { MissingParamError } from '../../errors';
import { Validation } from './validation';
import { ValidationComposite } from './validation-composite';

interface SutTypes {
  sut: ValidationComposite;
  validationStubs: Validation[];
}

const makeValidation = (): Validation => {
  class ValidationStub implements Validation {
    validate(input: any): Error {
      return null;
    }
  }
  return new ValidationStub();
};

const makeSut = (): SutTypes => {
  const validationStubs = [makeValidation(), makeValidation()];
  const sut = new ValidationComposite(validationStubs);
  return {
    sut,
    validationStubs,
  };
};

describe('Validation Composite', () => {
  /* --------------------------------------------
    essa é uma dependencia do composite, se 
    qualquer dependencia retornar um erro, 
    deve retornar o mesmo erro
  --------------------------------------------- */
  test('Should return an error if any validation fails', () => {
    const { sut, validationStubs } = makeSut();
    jest
      .spyOn(validationStubs[0], 'validate')
      .mockReturnValueOnce(new MissingParamError('field'));
    const error = sut.validate({ field: 'any_value' });
    expect(error).toEqual(new MissingParamError('field'));
  });

  /* --------------------------------------------
    deve retornar o primeiro erro que falhar 
    na validação
  --------------------------------------------- */
  test('Should return the first error if more then one validation fails', () => {
    const { sut, validationStubs } = makeSut();
    jest.spyOn(validationStubs[0], 'validate').mockReturnValueOnce(new Error());
    jest
      .spyOn(validationStubs[1], 'validate')
      .mockReturnValueOnce(new MissingParamError('field'));
    const error = sut.validate({ field: 'any_value' });
    expect(error).toEqual(new Error());
  });

  /* --------------------------------------------
    esse teste garante que se os dados estiverem 
    ok não haverá nenhum retorno
  --------------------------------------------- */
  test('Should not return if validation succeeds', () => {
    const { sut } = makeSut();
    const error = sut.validate({ field: 'any_value' });
    expect(error).toBeFalsy(); // null ou undefined (não quero que ele tenha valor)
  });
});
