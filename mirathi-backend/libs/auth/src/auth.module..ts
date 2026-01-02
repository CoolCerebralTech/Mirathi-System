import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { HashingService } from './services/hashing.service';
import { TokenService } from './services/token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';

@Global()
@Module({
  imports: [ConfigModule, DatabaseModule, PassportModule, JwtModule.register({})],
  providers: [
    HashingService,
    TokenService,
    JwtStrategy,
    LocalStrategy,
    RefreshTokenStrategy,
    JwtAuthGuard,
    RolesGuard,
    { provide: 'IHashingService', useClass: HashingService },
    { provide: 'ITokenService', useClass: TokenService },
  ],
  exports: [
    HashingService,
    TokenService,
    JwtAuthGuard,
    RolesGuard,
    'IHashingService',
    'ITokenService',
  ],
})
export class AuthModule {}
