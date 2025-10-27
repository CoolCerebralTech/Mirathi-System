import { Prisma, UserProfile as PrismaUserProfile } from '@prisma/client';

/**
 * UserEntity
 *
 * Represents the full User object as returned by Prisma, including all relations
 * defined in the `UserInclude` object. This is the "database model".
 */
export type UserEntity = Prisma.UserGetPayload<{ include: typeof UserInclude }>;

/**

 * UserProfileEntity
 *
 * Represents the UserProfile object as returned by Prisma.
 */
export type UserProfileEntity = PrismaUserProfile;

/**
 * A Prisma Helper Object to ensure we always include the profile relation
 * when querying for a User. This keeps our data shapes consistent.
 */
export const UserInclude = {
  profile: true,
};

/**
 * UserCreateData
 *
 * This type is derived directly from the Prisma schema and represents the
 * exact shape of data required to create a new User. It prevents schema drift.
 */
export type UserCreateData = Prisma.UserCreateInput;

/**
 * UserUpdateData
 *
 * This type is derived directly from the Prisma schema and represents the
 * exact shape of data that can be used to update a User.
 */
export type UserUpdateData = Prisma.UserUpdateInput;

/**
--- UserProfile Related Types ---
*/

/**
 * A Prisma Helper Object for the UserProfile model.
 * Currently empty, but can be used to include future relations.
 */
export const UserProfileInclude = {};

/**
 * ProfileEntity
 * Represents the UserProfile as returned by Prisma.
 */
export type ProfileEntity = Prisma.UserProfileGetPayload<{ include: typeof UserProfileInclude }>;

/**
 * ProfileCreateData
 *
 * Derived from the Prisma schema for creating a new UserProfile.
 */
export type ProfileCreateData = Prisma.UserProfileCreateInput;

/**
 * ProfileUpdateData
 *
 * Derived from the Prisma schema for updating a UserProfile.
 */
export type ProfileUpdateData = Prisma.UserProfileUpdateInput;
