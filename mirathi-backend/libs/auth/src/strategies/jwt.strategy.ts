// libs/auth/src/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AccountStatus } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { ConfigService } from '@shamba/config';
import { PrismaService } from '@shamba/database';

import { JwtPayload } from '../interfaces/auth.interface';

/**
 * JWT Strategy for validating access tokens
 *
 * Validates:
 * 1. JWT signature
 * 2. Token expiration
 * 3. User exists
 * 4. User is not deleted
 * 5. User is active
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<'JWT_SECRET'>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in configuration');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // Fetch user from database to verify they still exist and are active
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        status: true,
        deletedAt: true,
        role: true,
      },
    });

    // Check if user exists
    if (!user) {
      throw new UnauthorizedException('Invalid token: User not found');
    }

    // Check if user is deleted (soft delete)
    if (user.deletedAt !== null) {
      throw new UnauthorizedException('Invalid token: Account has been deleted');
    }

    // Check if user is active (not suspended or pending onboarding is ok for some operations)
    if (user.status === AccountStatus.SUSPENDED) {
      throw new UnauthorizedException('Invalid token: Account is suspended');
    }

    // Return the payload with updated role (in case it changed)
    return {
      ...payload,
      role: user.role, // Update role in case it changed
    };
  }
}
