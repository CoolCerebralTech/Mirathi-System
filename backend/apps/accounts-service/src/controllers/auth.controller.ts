import { 
  Controller, 
  Post, 
  Body, 
  HttpCode, 
  HttpStatus, 
  UseGuards, 
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { 
  RegisterDto, 
  LoginDto, 
  ChangePasswordDto, 
  ResetPasswordDto, 
  ForgotPasswordDto,
  AuthResponseDto,
  UserResponseDto,
  UserQueryDto,
  UserProfileDto,
  createSuccessResponse,
} from '@shamba/common';
import { 
  AuthService, 
  Public, 
  CurrentUser, 
  JwtAuthGuard, 
  RolesGuard, 
  Roles,
} from '@shamba/auth';
import { UserService } from '../services/user.service';
import { ProfileService } from '../services/profile.service';
import { LoggerService } from '@shamba/observability';
import { UserRole } from '@shamba/common';
import { JwtPayload } from '@shamba/auth';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private userService: UserService,
    private profileService: ProfileService,
    private logger: LoggerService,
  ) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'User with this email already exists' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data' 
  })
  async register(@Body() registerDto: RegisterDto) {
    this.logger.info('Registration request received', 'AuthController');
    
    const result = await this.userService.register(registerDto);
    
    return createSuccessResponse(result, 'User registered successfully');
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Invalid credentials' 
  })
  async login(@Body() loginDto: LoginDto) {
    this.logger.info('Login request received', 'AuthController', { 
      email: loginDto.email 
    });
    
    const result = await this.userService.login(loginDto);
    
    return createSuccessResponse(result, 'Login successful');
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh authentication tokens' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Tokens refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Invalid refresh token' 
  })
  async refreshTokens(@Body('refreshToken') refreshToken: string) {
    this.logger.debug('Token refresh request received', 'AuthController');
    
    const result = await this.userService.refreshTokens(refreshToken);
    
    return createSuccessResponse(result, 'Tokens refreshed successfully');
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Password reset email sent if account exists' 
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    this.logger.info('Forgot password request received', 'AuthController', {
      email: forgotPasswordDto.email,
    });
    
    const result = await this.userService.forgotPassword(forgotPasswordDto);
    
    return createSuccessResponse(result, result.message);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset user password' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Password reset successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid or expired reset token' 
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    this.logger.info('Password reset request received', 'AuthController');
    
    const result = await this.userService.resetPassword(resetPasswordDto);
    
    return createSuccessResponse(result, result.message);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Profile retrieved successfully',
    type: UserResponseDto,
  })
  async getProfile(@CurrentUser() user: JwtPayload) {
    this.logger.debug('Profile fetch request', 'AuthController', { 
      userId: user.userId 
    });
    
    const result = await this.userService.getProfile(user.userId);
    
    return createSuccessResponse(result, 'Profile retrieved successfully');
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Profile updated successfully',
    type: UserResponseDto,
  })
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() updateUserDto: UserProfileDto,
  ) {
    this.logger.info('Profile update request', 'AuthController', { 
      userId: user.userId 
    });
    
    const result = await this.profileService.updateProfile(user.userId, updateUserDto);
    
    return createSuccessResponse(result, 'Profile updated successfully');
  }

  @Post('profile/image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload profile image' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Profile image uploaded successfully' 
  })
  async uploadProfileImage(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.logger.info('Profile image upload request', 'AuthController', { 
      userId: user.userId 
    });
    
    const result = await this.profileService.uploadProfileImage(user.userId, file);
    
    return createSuccessResponse(result, result.message);
  }

  @Delete('profile/image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete profile image' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Profile image deleted successfully' 
  })
  async deleteProfileImage(@CurrentUser() user: JwtPayload) {
    this.logger.info('Profile image delete request', 'AuthController', { 
      userId: user.userId 
    });
    
    const result = await this.profileService.deleteProfileImage(user.userId);
    
    return createSuccessResponse(result, result.message);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Password changed successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Current password is incorrect' 
  })
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    this.logger.info('Password change request', 'AuthController', { 
      userId: user.userId 
    });
    
    await this.userService.changePassword(user.userId, changePasswordDto);
    
    return createSuccessResponse(null, 'Password changed successfully');
  }

  @Get('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Logout successful' 
  })
  async logout(@CurrentUser() user: JwtPayload) {
    this.logger.info('User logout', 'AuthController', { 
      userId: user.userId 
    });
    
    // In a more advanced implementation, you might blacklist the token
    return createSuccessResponse(null, 'Logout successful');
  }
}