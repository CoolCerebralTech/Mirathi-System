import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@shamba/config';
import { Request } from 'express';
import { RefreshTokenPayload } from '../interfaces/auth.interface';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    const secret = configService.get<'REFRESH_TOKEN_SECRET'>('REFRESH_TOKEN_SECRET');
    if (!secret) {
      throw new Error('REFRESH_TOKEN_SECRET is not defined in configuration');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true, // allows us to access the request in validate()
    });
  }

  /**
   * Called after the refresh token's signature & expiration are verified.
   * Returns both the payload and the raw refresh token for AuthService.
   */
  validate(
    req: Request,
    payload: RefreshTokenPayload,
  ): RefreshTokenPayload & { refreshToken: string } {
    const authHeader = req.get('authorization');
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing.');
    }

    const refreshToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing.');
    }

    return {
      ...payload,
      refreshToken,
    };
  }
}
