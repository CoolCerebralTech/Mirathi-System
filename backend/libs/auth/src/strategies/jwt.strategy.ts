import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ShambaConfigService } from '@shamba/config';
import { PrismaService } from '@shamba/database';
import { JwtPayload } from '../interfaces/auth.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ShambaConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter('token'),
        ExtractJwt.fromBodyField('token'),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.auth.jwtSecret,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: JwtPayload): Promise<JwtPayload> {
    try {
      // Verify user still exists and is active
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User no longer exists');
      }

      // You can add additional checks here:
      // - Is user account locked?
      // - Is user email verified?
      // - Has password been changed since token issued?

      return {
        userId: user.id,
        email: user.email,
        role: user.role,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}