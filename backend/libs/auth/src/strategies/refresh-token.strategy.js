"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("../../../config/src");
let RefreshTokenStrategy = class RefreshTokenStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'jwt-refresh') {
    configService;
    constructor(configService) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('REFRESH_TOKEN_SECRET'),
            // We need the request object to access the refresh token itself.
            passReqToCallback: true,
        });
        this.configService = configService;
    }
    /**
     * This method is called by Passport after it has successfully verified
     * the refresh token's signature and expiration.
     */
    validate(req, payload) {
        const authHeader = req.get('authorization');
        if (!authHeader) {
            throw new common_1.UnauthorizedException('Authorization header is missing.');
        }
        const refreshToken = authHeader.replace('Bearer', '').trim();
        if (!refreshToken) {
            throw new common_1.UnauthorizedException('Refresh token is missing.');
        }
        // We don't need to check the database here. The existence of the user will be
        // confirmed when the new access token is generated. This makes refreshing faster.
        // The key is to return both the payload AND the token itself so the AuthService can use it.
        return {
            ...payload,
            refreshToken,
        };
    }
};
exports.RefreshTokenStrategy = RefreshTokenStrategy;
exports.RefreshTokenStrategy = RefreshTokenStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RefreshTokenStrategy);
//# sourceMappingURL=refresh-token.strategy.js.map