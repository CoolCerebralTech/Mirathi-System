import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { ConfigService } from '@shamba/config';

import { RefreshTokenPayload } from '../interfaces/auth.interface';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    const secret = configService.get('REFRESH_TOKEN_SECRET');

    if (!secret) {
      throw new Error('REFRESH_TOKEN_SECRET is not defined in configuration');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: String(secret),
      passReqToCallback: true,
    });
  }

  validate(
    req: Request,
    payload: RefreshTokenPayload,
  ): RefreshTokenPayload & { refreshToken: string } {
    const authHeader = req.get('authorization');

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const refreshToken = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    return {
      ...payload,
      refreshToken,
    };
  }
}
