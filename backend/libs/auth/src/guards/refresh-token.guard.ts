import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * A guard that triggers the 'jwt-refresh' Passport strategy.
 * Used exclusively for the token refresh endpoint.
 */
@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {}