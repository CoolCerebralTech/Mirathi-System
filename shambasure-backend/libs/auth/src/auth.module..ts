import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';

// 1. --- IMPORT THE NEW SERVICES ---
import { HashingService } from './services/hashing.service';
import { TokenService } from './services/token.service';

// --- REMOVE THE OLD AuthService IMPORT ---
// import { AuthService } from '../services/auth.service';

// Import Strategies (this is correct)
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';

// Import Guards (this is correct)
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Global()
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    PassportModule,
    // The JwtModule is now just a generic utility, not configured with secrets here.
    // The TokenService will handle secrets.
    JwtModule.register({}),
  ],
  // 2. --- UPDATE THE PROVIDERS ---
  providers: [
    // Core utility services
    HashingService,
    TokenService,

    // Passport Strategies
    JwtStrategy,
    LocalStrategy,
    RefreshTokenStrategy,

    // Guards
    JwtAuthGuard,
    RolesGuard,
  ],
  // 3. --- UPDATE THE EXPORTS ---
  // We now export the tools, not the business logic.
  exports: [HashingService, TokenService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
