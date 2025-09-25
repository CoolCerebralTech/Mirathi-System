import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { PasswordService } from './services/password.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@Global()
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ShambaConfigService) => ({
        secret: configService.auth.jwtSecret,
        signOptions: { 
          expiresIn: configService.auth.jwtExpiration,
        },
      }),
      inject: [ShambaConfigService],
    }),
    ConfigModule,
    DatabaseModule,
  ],
  providers: [
    AuthService,
    TokenService,
    PasswordService,
    JwtStrategy,
    LocalStrategy,
    RefreshTokenStrategy,
    JwtAuthGuard,
    RolesGuard,
    LocalAuthGuard,
    RefreshTokenGuard,
  ],
  exports: [
    AuthService,
    TokenService,
    PasswordService,
    JwtAuthGuard,
    RolesGuard,
    LocalAuthGuard,
    RefreshTokenGuard,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}