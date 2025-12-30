import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * A guard that triggers the 'local' Passport strategy.
 * Used exclusively for the login endpoint to validate email and password.
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
