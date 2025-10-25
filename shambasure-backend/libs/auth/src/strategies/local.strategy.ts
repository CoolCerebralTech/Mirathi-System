import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Inject, forwardRef } from '@nestjs/common'; // <-- Add Inject and forwardRef
import { AuthService } from '../../../../apps/accounts-service/src/services/auth.service';
import { User } from '@shamba/database';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(forwardRef(() => AuthService)) // <-- ADD THIS DECORATOR
    private authService: AuthService,
  ) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, pass: string): Promise<Omit<User, 'password'>> {
    const user = await this.authService.validateUser(email, pass);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
