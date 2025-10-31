import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

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
