import { Validation } from './validation';

export class ValidationComposite implements Validation {
  private readonly validations: Validation[];

  constructor(validations: Validation[]) {
    this.validations = validations;
  }

  // eslint-disable-next-line consistent-return
  validate(input: any): Error {
    // eslint-disable-next-line no-restricted-syntax
    for (const validation of this.validations) {
      const error = validation.validate(input);
      if (error) {
        return error;
      }
    }
  }
}
