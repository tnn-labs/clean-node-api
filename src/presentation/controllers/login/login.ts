import { Authentication } from '../../../domain/usecases/authentication';
import { InvalidParamError, MissingParamError } from '../../errors';
import {
  badRequest,
  serverError,
  unauthorized,
} from '../../helpers/http-helper';
import { Controller, HttpRequest, HttpResponse } from '../../protocols';
import { EmailValidator } from '../signup/signup-protocols';

export class LoginController implements Controller {
  private readonly emailValidator: EmailValidator;

  private readonly authentication: Authentication;

  constructor(emailValidator: EmailValidator, authentication: Authentication) {
    this.emailValidator = emailValidator;
    this.authentication = authentication;
  }

  // eslint-disable-next-line consistent-return
  async handle(httpRequest: HttpRequest): Promise<HttpResponse> {
    try {
      const requiredFieds = ['email', 'password'];
      // eslint-disable-next-line no-restricted-syntax
      for (const field of requiredFieds) {
        if (!httpRequest.body[field]) {
          return badRequest(new MissingParamError(field));
        }
      }

      const { email, password } = httpRequest.body;
      const isValid = this.emailValidator.isValid(email);

      if (!isValid) {
        return badRequest(new InvalidParamError('email'));
      }

      const accessToken = await this.authentication.auth(email, password);
      if (!accessToken) {
        return unauthorized();
      }
    } catch (error) {
      return serverError(error);
    }
  }
}
