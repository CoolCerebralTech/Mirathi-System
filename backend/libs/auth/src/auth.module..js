"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const config_1 = require("../../config/src");
const database_1 = require("../../database/src");
const auth_service_1 = require("./services/auth.service");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const local_strategy_1 = require("./strategies/local.strategy");
const refresh_token_strategy_1 = require("./strategies/refresh-token.strategy");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const roles_guard_1 = require("./guards/roles.guard");
const local_auth_guard_1 = require("./guards/local-auth.guard");
const refresh_token_guard_1 = require("./guards/refresh-token.guard");
// ============================================================================
// Shamba Sure - Shared Authentication Module
// ============================================================================
// This module bundles all core authentication and authorization logic into a
// single, reusable package. It provides the AuthService for handling business
// logic and the guards for protecting endpoints.
// ============================================================================
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            // We depend on the Config and Database modules being available.
            config_1.ConfigModule,
            database_1.DatabaseModule,
            // The PassportModule is the foundation for all our auth strategies.
            passport_1.PassportModule,
            // The JwtModule is configured asynchronously to ensure it gets the
            // necessary secrets from our ConfigService.
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
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
            auth_service_1.AuthService,
            jwt_strategy_1.JwtStrategy,
            local_strategy_1.LocalStrategy,
            refresh_token_strategy_1.RefreshTokenStrategy,
            jwt_auth_guard_1.JwtAuthGuard,
            roles_guard_1.RolesGuard,
            local_auth_guard_1.LocalAuthGuard,
            refresh_token_guard_1.RefreshTokenGuard,
        ],
        // We export the AuthService and the guards so they can be used
        // throughout the application (in controllers, providers, etc.).
        exports: [
            auth_service_1.AuthService,
            jwt_auth_guard_1.JwtAuthGuard,
            roles_guard_1.RolesGuard,
            local_auth_guard_1.LocalAuthGuard,
            refresh_token_guard_1.RefreshTokenGuard,
        ],
    })
], AuthModule);
//# sourceMappingURL=auth.module..js.map