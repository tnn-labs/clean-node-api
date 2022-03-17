import { InvalidParamError } from '../../errors';
import { Validation } from './validation';

export class CompareFieldsValidation implements Validation {
  private readonly fieldName: string;

  private readonly fieldToCompareName: string;

  constructor(fieldName: string, fieldToCompareName: string) {
    this.fieldName = fieldName;
    this.fieldToCompareName = fieldToCompareName;
  }

  // eslint-disable-next-line consistent-return
  validate(input: any): Error {
    if (input[this.fieldName] !== input[this.fieldToCompareName]) {
      return new InvalidParamError(this.fieldToCompareName);
    }
  }
}
