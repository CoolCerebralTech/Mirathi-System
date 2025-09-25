import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, compare } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { ShambaConfigService } from '@shamba/config';
import { PrismaService } from '@shamba/database';
import { LoginCredentials, AuthResult, TokenPair, JwtPayload, PasswordResetToken } from '../interfaces/auth.interface';
import { RegisterDto, LoginDto } from '@shamba/common';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ShambaConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResult> {
    const { email, password, firstName, lastName, role } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hash(password, this.configService.auth.bcryptRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || 'LAND_OWNER',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user,
      tokens,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResult> {
    const { email, password } = loginDto;

    const user = await this.validateUser(email, password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Update last login timestamp (you might want to add this field to your User model)
    // await this.prisma.user.update({
    //   where: { id: user.id },
    //   data: { lastLoginAt: new Date() },
    // });

    return {
      user,
      tokens,
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await compare(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }

    // Remove password from returned user object
    const { password: _, ...userWithoutPassword } = user;
    
    return userWithoutPassword;
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.auth.refreshTokenSecret,
      });

      // Verify user still exists
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, role: true },
      });

      if (!user) {
        throw new UnauthorizedException('User no longer exists');
      }

      // Generate new tokens
      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async generateTokens(user: any): Promise<TokenPair> {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.auth.jwtSecret,
        expiresIn: this.configService.auth.jwtExpiration,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.auth.refreshTokenSecret,
        expiresIn: this.configService.auth.refreshTokenExpiration,
      }),
    ]);

    // Calculate expiration time
    const expiresIn = this.parseExpiration(this.configService.auth.jwtExpiration);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentPasswordValid = await compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedNewPassword = await hash(newPassword, this.configService.auth.bcryptRounds);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });
  }

  async generatePasswordResetToken(email: string): Promise<PasswordResetToken> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal whether email exists for security
      return {
        token: uuidv4(), // Generate dummy token
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
        userId: 'dummy', // Dummy user ID
      };
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Store reset token in database
    await this.prisma.passwordResetToken.create({
      data: {
        tokenHash: await hash(token, this.configService.auth.bcryptRounds),
        expiresAt,
        userId: user.id,
      },
    });

    return {
      token,
      expiresAt,
      userId: user.id,
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find valid reset token
    const resetTokens = await this.prisma.passwordResetToken.findMany({
      where: {
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    const validToken = resetTokens.find(async (resetToken) => {
      return await compare(token, resetToken.tokenHash);
    });

    if (!validToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, this.configService.auth.bcryptRounds);

    // Update user password
    await this.prisma.user.update({
      where: { id: validToken.userId },
      data: { password: hashedPassword },
    });

    // Delete used reset token
    await this.prisma.passwordResetToken.delete({
      where: { id: validToken.id },
    });

    // Delete all other reset tokens for this user
    await this.prisma.passwordResetToken.deleteMany({
      where: {
        userId: validToken.userId,
        id: { not: validToken.id },
      },
    });
  }

  async logout(userId: string): Promise<void> {
    // In a more advanced implementation, you might want to:
    // - Add token to blacklist
    // - Clear user sessions
    // - Update last logout timestamp
  }

  private parseExpiration(expiration: string): number {
    const units = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 3600; // Default to 1 hour
    }

    const value = parseInt(match[1]);
    const unit = match[2] as keyof typeof units;

    return value * units[unit];
  }
}