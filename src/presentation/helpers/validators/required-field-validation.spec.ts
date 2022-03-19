import { MissingParamError } from '../../errors';
import { RequiredFieldValidation } from './required-field-validation';

const makeSut = (): RequiredFieldValidation => {
  return new RequiredFieldValidation('field');
};

describe('RequiredField Validation', () => {
  /* --------------------------------------------
    esse teste garante que se a validação falhar o 
    sistema retornará um MissingParamError
  --------------------------------------------- */
  test('Should return a MissingParamError if validation fails', () => {
    const sut = makeSut();
    const error = sut.validate({ name: 'any_name' });
    expect(error).toEqual(new MissingParamError('field'));
  });

  /* --------------------------------------------
    esse teste garante que se os dados estiverem 
    ok não haverá nenhum retorno
  --------------------------------------------- */
  test('Should not return if validation succeeds', () => {
    const sut = makeSut();
    const error = sut.validate({ field: 'any_name' });
    expect(error).toBeFalsy(); // null ou undefined (não quero que ele tenha valor)
  });
});
