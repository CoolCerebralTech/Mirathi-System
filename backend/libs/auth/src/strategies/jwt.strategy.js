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
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("../../../config/src");
const database_1 = require("../../../database/src");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'jwt') {
    configService;
    prisma;
    constructor(configService, prisma) {
        super({
            // Strategy configuration
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET'),
        });
        this.configService = configService;
        this.prisma = prisma;
    }
    /**
     * This method is called by Passport after it has successfully verified
     * the JWT's signature and expiration. Its job is to perform any additional
     * validation and return the payload that will be attached to `request.user`.
     */
    async validate(payload) {
        // We already trust the payload's content because the signature was verified.
        // The most important check is to ensure the user still exists in our system.
        const userExists = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true }, // We only need to know if the user exists
        });
        if (!userExists) {
            throw new common_1.UnauthorizedException('User not found.');
        }
        // Optional: Add more checks here, e.g., if the user is banned or deactivated.
        // Passport will attach this returned payload to the `request.user` object.
        return payload;
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        database_1.PrismaService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map