import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';

// Import Guards (this is correct)
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
// 1. --- IMPORT THE NEW SERVICES ---
import { HashingService } from './services/hashing.service';
import { TokenService } from './services/token.service';
// --- REMOVE THE OLD AuthService IMPORT ---
// import { AuthService } from '../services/auth.service';

// Import Strategies (this is correct)
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

    // Bind interfaces to concrete classes
    { provide: 'IHashingService', useClass: HashingService },
    { provide: 'ITokenService', useClass: TokenService },
  ],
  exports: [
    HashingService,
    TokenService,
    JwtAuthGuard,
    RolesGuard,

    // Export the tokens too
    'IHashingService',
    'ITokenService',
  ],
})
export class AuthModule {}
