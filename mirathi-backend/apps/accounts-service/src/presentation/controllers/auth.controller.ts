// src/presentation/controllers/auth.controller.ts
import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
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

    if (!redirectUri) {
      this.logger.error('GOOGLE_REDIRECT_URI is not set in environment variables');
      throw new InternalServerErrorException('Server misconfiguration: Redirect URI missing');
    }

    try {
      const { user, isNewUser } = await this.oauthService.handleOAuthCallback({
        code,
        redirectUri,
        provider: provider.toUpperCase(),
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      // ✅ FIX: Better redirect logic with user info
      if (isNewUser) {
        // ✅ New user - send to onboarding with success
        this.logger.log(`New user ${user.id} created, redirecting to onboarding`);
        res.redirect(`${frontendUrl}/onboarding?status=success&userId=${user.id}`);
      } else {
        // ✅ Existing user - send to dashboard with success + generate token on frontend
        this.logger.log(`Existing user ${user.id} logged in, redirecting to dashboard`);
        res.redirect(`${frontendUrl}/dashboard?status=success&userId=${user.id}`);
      }
    } catch (error: any) {
      // ✅ FIX: Better error logging with context
      this.logger.error(`OAuth callback failed for ${provider}: ${error.message}`, error.stack);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      // ✅ FIX: Pass specific error message to frontend
      const errorType = this.getErrorType(error);
      res.redirect(
        `${frontendUrl}/login?error=${errorType}&message=${encodeURIComponent(error.message)}`,
      );
    }
  }

  // ✅ NEW: Helper to categorize errors for frontend
  private getErrorType(error: any): string {
    if (error.message?.includes('already exists')) {
      return 'account_exists';
    }
    if (error.message?.includes('required')) {
      return 'missing_info';
    }
    if (error.message?.includes('Invalid')) {
      return 'invalid_token';
    }
    return 'oauth_failed';
  }
}
