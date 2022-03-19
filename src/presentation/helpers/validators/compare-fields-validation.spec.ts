import { InvalidParamError } from '../../errors';
import { CompareFieldsValidation } from './compare-fields-validation';

const makeSut = (): CompareFieldsValidation => {
  return new CompareFieldsValidation('field', 'fieldToCompare');
};

describe('CompareFields Validation', () => {
  /* --------------------------------------------
    se os valores não forem iguais o sistema 
    retornará um InvalidParamError
  --------------------------------------------- */
  test('Should return a InvalidParamError if validation fails', () => {
    const sut = makeSut();
    const error = sut.validate({
      field: 'any_value',
      fieldToCompare: 'wrong_value',
    });
    expect(error).toEqual(new InvalidParamError('fieldToCompare'));
  });

  /* --------------------------------------------
    esse teste garante que se os dados estiverem 
    ok não haverá nenhum retorno
  --------------------------------------------- */
  test('Should not return if validation succeeds', () => {
    const sut = makeSut();
    const error = sut.validate({
      field: 'any_value',
      fieldToCompare: 'any_value',
    });
    expect(error).toBeFalsy(); // null ou undefined (não quero que ele tenha valor)
  });
});
