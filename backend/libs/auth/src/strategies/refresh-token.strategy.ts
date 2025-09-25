import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ExtractJwt } from 'passport-jwt';
import { ShambaConfigService } from '@shamba/config';
import { PrismaService } from '@shamba/database';
import { JwtPayload } from '../interfaces/auth.interface';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private configService: ShambaConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.auth.refreshTokenSecret,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: JwtPayload): Promise<JwtPayload> {
    try {
      // Verify user still exists
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, role: true },
      });

      if (!user) {
        throw new UnauthorizedException('User no longer exists');
      }

      // Verify refresh token hasn't been revoked
      // You might want to implement a refresh token blacklist here

      return {
        userId: user.id,
        email: user.email,
        role: user.role,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}