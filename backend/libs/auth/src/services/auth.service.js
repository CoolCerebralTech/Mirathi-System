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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt_1 = require("bcrypt");
const crypto_1 = require("crypto");
const config_1 = require("../../../config/src");
const database_1 = require("../../../database/src");
let AuthService = class AuthService {
    prisma;
    jwtService;
    configService;
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    // --- Core Authentication Flow ---
    async register(registerDto) {
        const { email, password, firstName, lastName, role } = registerDto;
        const existingUser = await this.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new common_1.ConflictException('A user with this email already exists.');
        }
        const hashedPassword = await this.hashPassword(password);
        const user = await this.prisma.user.create({
            data: { email, password: hashedPassword, firstName, lastName, role },
        });
        const tokens = await this.generateTokenPair({
            sub: user.id,
            email: user.email,
            role: user.role,
        });
        // We only return a subset of the user data, never the password.
        const userResponse = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
        };
        return { user: userResponse, tokens };
    }
    async validateUser(email, password) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (user && (await this.comparePassword(password, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        throw new common_1.UnauthorizedException('Invalid credentials.');
    }
    async refreshTokens(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, role: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found.');
        }
        return this.generateTokenPair({
            sub: user.id,
            email: user.email,
            role: user.role,
        });
    }
    // --- Password Management ---
    async changePassword(userId, currentPass, newPass) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found.');
        const isPasswordValid = await this.comparePassword(currentPass, user.password);
        if (!isPasswordValid)
            throw new common_1.UnauthorizedException('Current password is incorrect.');
        const hashedNewPassword = await this.hashPassword(newPass);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword },
        });
    }
    async initiatePasswordReset(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return {
                token: '',
                user: {
                    firstName: '',
                    email: email,
                },
            };
        }
        const token = (0, crypto_1.randomUUID)();
        const tokenHash = await this.hashPassword(token);
        const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour from now
        // Store the hashed token in the database.
        await this.prisma.passwordResetToken.create({
            data: { tokenHash, expiresAt, userId: user.id },
        });
        // Return the RAW token to be sent to the user.
        return { token, user: { firstName: user.firstName, email: user.email } };
    }
    async finalizePasswordReset(token, newPassword) {
        const allTokens = await this.prisma.passwordResetToken.findMany({
            where: { expiresAt: { gt: new Date() } }, // Find all non-expired tokens
        });
        let validTokenRecord = null;
        for (const record of allTokens) {
            if (await this.comparePassword(token, record.tokenHash)) {
                validTokenRecord = record;
                break;
            }
        }
        if (!validTokenRecord) {
            throw new common_1.BadRequestException('Invalid or expired password reset token.');
        }
        const hashedPassword = await this.hashPassword(newPassword);
        await this.prisma.user.update({
            where: { id: validTokenRecord.userId },
            data: { password: hashedPassword },
        });
        // Invalidate all reset tokens for this user after successful reset.
        await this.prisma.passwordResetToken.deleteMany({
            where: { userId: validTokenRecord.userId },
        });
    }
    // --- Token and Hashing Utilities (Private) ---
    async generateTokenPair(payload) {
        const refreshTokenPayload = { sub: payload.sub };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: this.configService.get('JWT_EXPIRATION'),
            }),
            this.jwtService.signAsync(refreshTokenPayload, {
                secret: this.configService.get('REFRESH_TOKEN_SECRET'),
                expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRATION'),
            }),
        ]);
        return { accessToken, refreshToken };
    }
    async hashPassword(password) {
        const rounds = this.configService.get('BCRYPT_ROUNDS');
        return (0, bcrypt_1.hash)(password, rounds);
    }
    async comparePassword(password, hash) {
        return (0, bcrypt_1.compare)(password, hash);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map