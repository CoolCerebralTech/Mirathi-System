import { User as PrismaUser, UserProfile } from '@shamba/database';
import { Exclude, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Lightweight ProfileEntity used for serialization (keeps Prisma types out of controllers)
export class ProfileEntity implements Partial<UserProfile> {
  @ApiProperty()
  id!: string;

  @ApiProperty({ required: false, nullable: true })
  bio!: string | null;

  @ApiProperty({ required: false, nullable: true })
  phoneNumber!: string | null;

  @ApiProperty({ required: false, type: Object })
  address!: Record<string, any> | null;

  @ApiProperty({ required: false, type: Object })
  nextOfKin!: Record<string, any> | null;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  constructor(partial: Partial<UserProfile> = {}) {
    Object.assign(this, partial);
  }
}

// UserEntity: public-facing serialized shape for API responses
export class UserEntity implements Omit<PrismaUser, 'password'> {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  // Keep role as-is from Prisma type; avoid exposing Prisma runtime types in controller signatures
  @ApiProperty()
  role!: PrismaUser['role'];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  // Exclude password from serialization entirely
  @Exclude()
  password?: string;

  // Nested profile (optional) — use class-transformer to ensure proper instantiation
  @ApiProperty({ type: () => ProfileEntity, required: false })
  @Type(() => ProfileEntity)
  profile?: ProfileEntity;

  constructor(partial: Partial<PrismaUser & { profile?: UserProfile | null }> = {}) {
    // Map primitive fields
    Object.assign(this, partial);

    // If profile is present, wrap it in the ProfileEntity class for safe serialization
    if (partial.profile) {
      // handle null vs undefined
      if (partial.profile === null) {
        delete this.profile;
      } else {
        this.profile = new ProfileEntity(partial.profile as UserProfile);
      }
    }

    // Always remove password from the serialized object
    if ((this as any).password) {
      delete (this as any).password;
    }
  }
}
