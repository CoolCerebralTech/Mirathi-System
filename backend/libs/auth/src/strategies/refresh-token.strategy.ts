import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { ConfigService } from '@shamba/config';
import { Request } from 'express';
import { RefreshTokenPayload } from '../interfaces/auth.interface';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('REFRESH_TOKEN_SECRET'),
      // We need the request object to access the refresh token itself.
      passReqToCallback: true,
    } as StrategyOptions);
  }

  /**
   * This method is called by Passport after it has successfully verified
   * the refresh token's signature and expiration.
   */
  validate(req: Request, payload: RefreshTokenPayload): any {
    const refreshToken = req.get('authorization').replace('Bearer', '').trim();

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing.');
    }

    // We don't need to check the database here. The existence of the user will be
    // confirmed when the new access token is generated. This makes refreshing faster.
    // The key is to return both the payload AND the token itself so the AuthService can use it.
    return {
      ...payload,
      refreshToken,
    };
  }
}