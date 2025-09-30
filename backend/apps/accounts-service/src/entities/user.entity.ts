import { User as PrismaUser, UserProfile } from '@shamba/database';
import { Exclude } from 'class-transformer';

// ============================================================================
// ARCHITECTURAL NOTE: The Role of the Entity
// ============================================================================
// In our architecture, the Entity is a clean representation of our data model,
// used for serializing API responses. It uses Prisma's generated types as its
// foundation to ensure it's always in sync with the database schema.
//
// All business logic has been REMOVED from this file. That logic belongs in the
// `UsersService` or `AuthService`. An entity's job is to represent data, not
// to perform operations.
// ============================================================================

export class UserEntity implements Omit<PrismaUser, 'password'> {
  id!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  role!: PrismaUser['role'];
  createdAt!: Date;
  updatedAt!: Date;

  // We explicitly exclude the password field from any serialization.
  @Exclude()
  password?: string; // Kept for type compatibility but will not be present.

  profile?: UserProfile;

  constructor(partial: Partial<PrismaUser & { profile?: UserProfile | null }>) { // Allow null for profile
  Object.assign(this, partial);
  if (this.profile === null) {
    delete this.profile;
  }
  delete this.password;
}
}