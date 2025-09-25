# @shamba/auth

Authentication and authorization library for Shamba Sure platform.

## Features

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing and validation
- Refresh token support
- Password reset functionality
- Comprehensive security guards

## Usage

```typescript
import { 
  AuthModule, 
  JwtAuthGuard, 
  RolesGuard, 
  CurrentUser, 
  Roles, 
  Public 
} from '@shamba/auth';

@Module({
  imports: [AuthModule],
})
export class YourModule {}

@Controller('auth')
export class AuthController {
  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  async login(@CurrentUser() user: JwtPayload) {
    return user;
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: JwtPayload) {
    return user;
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateProfile(@CurrentUser('userId') userId: string) {
    // Admin-only endpoint
  }
}