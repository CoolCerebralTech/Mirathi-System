import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  // <--- Add this
  Logger,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

import { Public } from '@shamba/auth';

import { OAuthAuthService } from '../../application/services/oauth-auth.service';

@Controller('auth')
@Public()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly oauthService: OAuthAuthService) {}

  @Get(':provider')
  login(@Param('provider') provider: string, @Res() res: Response) {
    if (!provider) throw new BadRequestException('Provider is required');

    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!redirectUri) {
      this.logger.error('GOOGLE_REDIRECT_URI is not set in environment variables');
      throw new InternalServerErrorException('Server misconfiguration: Redirect URI missing');
    }

    this.logger.log(`Initiating ${provider} login. Redirecting to: ${redirectUri}`);

    const url = this.oauthService.getAuthorizationUrl(provider.toUpperCase(), redirectUri);
    res.redirect(url);
  }

  @Get(':provider/callback')
  async callback(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Res() res: Response,
  ) {
    if (!code) throw new BadRequestException('Authorization code is missing');

    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    // 👇 FIX: Strict check ensures 'redirectUri' is a string, not undefined
    if (!redirectUri) {
      this.logger.error('GOOGLE_REDIRECT_URI is not set in environment variables');
      throw new InternalServerErrorException('Server misconfiguration: Redirect URI missing');
    }

    try {
      const { user, isNewUser } = await this.oauthService.handleOAuthCallback({
        code,
        redirectUri, // Now guaranteed to be a string
        provider: provider.toUpperCase(),
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const targetPath = isNewUser ? '/onboarding' : '/dashboard';

      // Pass the userId (or token) to the frontend
      res.redirect(`${frontendUrl}${targetPath}?status=success&userId=${user.id}`);
    } catch (error) {
      this.logger.error(`OAuth callback failed: ${error.message}`);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  }
}
