import { User, UserProfile } from '@shamba/database';

/**
 * A combined type representing a User object that is guaranteed to have
 * its 'profile' relation included.
 *
 * This type is exported by the @shamba/auth library to create a consistent
 * contract for the user object that is attached to the request by authentication
 * guards like LocalAuthGuard.
 */
export type UserWithProfile = User & {
  profile: UserProfile | null;
};
