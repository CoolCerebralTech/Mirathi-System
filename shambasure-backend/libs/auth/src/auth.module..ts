import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';

import { AuthService } from '../../../apps/accounts-service/src/services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

// ============================================================================
// Shamba Sure - Shared Authentication Module
// ============================================================================
// This module bundles all core authentication and authorization logic into a
// single, reusable package. It provides the AuthService for handling business
// logic and the guards for protecting endpoints.
// ============================================================================

@Global()
@Module({
  imports: [
    // We depend on the Config and Database modules being available.
    ConfigModule,
    DatabaseModule,

    // The PassportModule is the foundation for all our auth strategies.
    PassportModule,

    // The JwtModule is configured asynchronously to ensure it gets the
    // necessary secrets from our ConfigService.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // We configure a global secret and expiration for the main access token.
        // The AuthService will override these for the refresh token.
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION'),
        },
      }),
    }),
  ],
  // All our strategies, guards, and the unified AuthService are provided here.
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    RefreshTokenStrategy,
    JwtAuthGuard,
    RolesGuard,
    LocalAuthGuard,
    RefreshTokenGuard,
  ],
  // We export the AuthService and the guards so they can be used
  // throughout the application (in controllers, providers, etc.).
  exports: [AuthService, JwtAuthGuard, RolesGuard, LocalAuthGuard, RefreshTokenGuard],
})
export class AuthModule {}
