import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { User } from '@shamba/database';

// A type-safe representation of the AuthService this strategy will depend on.
// The actual AuthService will need to implement this interface.
export interface IAuthService {
  validateUser(email: string, password: string): Promise<Omit<User, 'password'> | null>;
}

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: IAuthService) {
    super({
      usernameField: 'email', // Tell passport to use the 'email' field as the username
    });
  }

  /**
   * This method is called by Passport when a user attempts to log in.
   * It delegates the actual email/password validation to the AuthService.
   */
  async validate(email: string, password: string): Promise<Omit<User, 'password'>> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }
    // Passport will attach this user object to `request.user`.
    return user;
  }
}
