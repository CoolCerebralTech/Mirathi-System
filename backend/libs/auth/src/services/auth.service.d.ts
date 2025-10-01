import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@shamba/config';
import { PrismaService, User } from '@shamba/database';
import { RegisterRequestDto } from '@shamba/common';
import { AuthResult, JwtPayload, TokenPair } from '../interfaces/auth.interface';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    register(registerDto: RegisterRequestDto): Promise<AuthResult>;
    validateUser(email: string, password: string): Promise<Omit<User, 'password'>>;
    refreshTokens(userId: string): Promise<TokenPair>;
    changePassword(userId: string, currentPass: string, newPass: string): Promise<void>;
    initiatePasswordReset(email: string): Promise<{
        token: string;
        user: {
            firstName: string;
            email: string;
        };
    } | null>;
    finalizePasswordReset(token: string, newPassword: string): Promise<void>;
    generateTokenPair(payload: JwtPayload): Promise<TokenPair>;
    private hashPassword;
    private comparePassword;
}
//# sourceMappingURL=auth.service.d.ts.map