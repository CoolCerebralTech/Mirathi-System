import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * A decorator to mark a route as public, bypassing the global authentication guard.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);