import { MissingParamError } from '../../errors';
import { Validation } from './validation';

export class RequireFieldValidation implements Validation {
  private readonly fieldName: string;

  constructor(fieldName: string) {
    this.fieldName = fieldName;
  }

  // eslint-disable-next-line consistent-return
  validate(input: any): Error {
    if (!input[this.fieldName]) {
      return new MissingParamError(this.fieldName);
    }
  }
}
