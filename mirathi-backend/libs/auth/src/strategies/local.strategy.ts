import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({ usernameField: 'email' });
  }

  /**
   * Required by Passport but intentionally never used.
   * Always throws to prevent accidental invocation.
   */
  validate(): never {
    throw new UnauthorizedException(
      'LocalStrategy.validate() should not be called. Use AuthService.login() instead.',
    );
  }
}
