import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { ConfigService } from '@shamba/config';
import { PrismaService } from '@shamba/database';
import { JwtPayload } from '../interfaces/auth.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      // Strategy configuration
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    } as StrategyOptions);
  }

  /**
   * This method is called by Passport after it has successfully verified
   * the JWT's signature and expiration. Its job is to perform any additional
   * validation and return the payload that will be attached to `request.user`.
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // We already trust the payload's content because the signature was verified.
    // The most important check is to ensure the user still exists in our system.
    const userExists = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true }, // We only need to know if the user exists
    });

    if (!userExists) {
      throw new UnauthorizedException('User not found.');
    }

    // Optional: Add more checks here, e.g., if the user is banned or deactivated.

    // Passport will attach this returned payload to the `request.user` object.
    return payload;
  }
}