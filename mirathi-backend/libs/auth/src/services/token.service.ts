import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import type { StringValue } from 'ms';

import { ConfigService } from '@shamba/config';

import { JwtPayload, RefreshTokenPayload } from '../interfaces/auth.interface';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private getAccessTokenOptions(): JwtSignOptions {
    const secret = this.configService.get('JWT_SECRET');
    const expiresIn = this.configService.get('JWT_EXPIRATION');

    return {
      secret: String(secret),
      expiresIn: String(expiresIn) as StringValue,
    };
  }

  private getRefreshTokenOptions(): JwtSignOptions {
    const secret = this.configService.get('REFRESH_TOKEN_SECRET');
    const expiresIn = this.configService.get('REFRESH_TOKEN_EXPIRATION');

    return {
      secret: String(secret),
      expiresIn: String(expiresIn) as StringValue,
    };
  }

  generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, this.getAccessTokenOptions());
  }

  generateRefreshToken(payload: RefreshTokenPayload): string {
    return this.jwtService.sign(payload, this.getRefreshTokenOptions());
  }

  verifyAccessToken(token: string): JwtPayload {
    const { secret } = this.getAccessTokenOptions();
    return this.jwtService.verify<JwtPayload>(token, { secret });
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    const { secret } = this.getRefreshTokenOptions();
    return this.jwtService.verify<RefreshTokenPayload>(token, { secret });
  }
}
