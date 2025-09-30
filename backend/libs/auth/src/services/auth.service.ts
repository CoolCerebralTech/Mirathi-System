import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, compare } from 'bcrypt';
import { randomUUID } from 'crypto';

import { ConfigService } from '@shamba/config';
import { PrismaService, User } from '@shamba/database';
import { RegisterRequestDto } from '@shamba/common';
import { AuthResult, JwtPayload, RefreshTokenPayload, TokenPair } from '../interfaces/auth.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // --- Core Authentication Flow ---

  async register(registerDto: RegisterRequestDto): Promise<AuthResult> {
    const { email, password, firstName, lastName, role } = registerDto;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists.');
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

  async validateUser(email: string, password: string): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user && (await this.comparePassword(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    throw new UnauthorizedException('Invalid credentials.');
  }

  async refreshTokens(userId: string): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    return this.generateTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  // --- Password Management ---

  async changePassword(userId: string, currentPass: string, newPass: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');

    const isPasswordValid = await this.comparePassword(currentPass, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Current password is incorrect.');

    const hashedNewPassword = await this.hashPassword(newPass);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });
  }

 async initiatePasswordReset(email: string): Promise<{ token: string; user: { firstName: string; email: string; }; } | null> {
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

    const token = randomUUID();
    const tokenHash = await this.hashPassword(token);
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour from now

    // Store the hashed token in the database.
    await this.prisma.passwordResetToken.create({
      data: { tokenHash, expiresAt, userId: user.id },
    });

    // Return the RAW token to be sent to the user.
    return { token, user: { firstName: user.firstName, email: user.email } };
  }

  async finalizePasswordReset(token: string, newPassword: string): Promise<void> {
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
      throw new BadRequestException('Invalid or expired password reset token.');
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

  public async generateTokenPair(payload: JwtPayload): Promise<TokenPair> {
    const refreshTokenPayload: RefreshTokenPayload = { sub: payload.sub };

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

  private async hashPassword(password: string): Promise<string> {
    const rounds = this.configService.get('BCRYPT_ROUNDS');
    return hash(password, rounds);
  }

  private async comparePassword(password: string, hash: string): Promise<boolean> {
    return compare(password, hash);
  }
}