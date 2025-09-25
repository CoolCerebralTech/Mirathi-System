import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ShambaConfigService } from '@shamba/config';
import { JwtPayload } from '../interfaces/auth.interface';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ShambaConfigService,
  ) {}

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: this.configService.auth.jwtSecret,
    });
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: this.configService.auth.refreshTokenSecret,
    });
  }

  async decodeToken(token: string): Promise<JwtPayload | null> {
    try {
      return this.jwtService.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }

  getTokenExpiration(token: string): Date | null {
    try {
      const payload = this.jwtService.decode(token) as any;
      if (payload && payload.exp) {
        return new Date(payload.exp * 1000);
      }
      return null;
    } catch {
      return null;
    }
  }

  isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;
    
    return expiration < new Date();
  }
}