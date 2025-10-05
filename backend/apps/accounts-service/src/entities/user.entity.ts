import { User as PrismaUser, UserProfile, UserRole } from '@shamba/database';
import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * ProfileEntity - Serializable user profile for API responses
 * Maps Prisma UserProfile to a clean DTO structure
 */
@Exclude()
export class ProfileEntity implements Partial<UserProfile> {
  @Expose()
  @ApiProperty({ example: 'clx123456789' })
  id!: string;

  @Expose()
  @ApiProperty({ 
    required: false, 
    nullable: true,
    example: 'Experienced land owner with 20+ years in agriculture' 
  })
  bio!: string | null;

  @Expose()
  @ApiProperty({ 
    required: false, 
    nullable: true,
    example: '+254712345678' 
  })
  phoneNumber!: string | null;

  @Expose()
  @ApiProperty({ 
    required: false, 
    nullable: true,
    type: 'object',
    example: { street: '123 Main St', city: 'Nairobi', postCode: '00100', country: 'Kenya' }
  })
  address!: Record<string, any> | null;

  @Expose()
  @ApiProperty({ 
    required: false, 
    nullable: true,
    type: 'object',
    example: { fullName: 'Jane Doe', relationship: 'Spouse', phoneNumber: '+254712345679' }
  })
  nextOfKin!: Record<string, any> | null;

  @Expose()
  @ApiProperty({ example: 'clx123456789' })
  userId!: string;

  @Expose()
  @ApiProperty({ example: '2025-01-15T10:30:00Z' })
  createdAt!: Date;

  @Expose()
  @ApiProperty({ example: '2025-01-20T14:45:00Z' })
  updatedAt!: Date;

  constructor(partial: Partial<UserProfile>) {
    Object.assign(this, partial);
  }
}

/**
 * UserEntity - Public-facing user representation for API responses
 * Excludes sensitive fields (password) and provides type-safe serialization
 */
@Exclude()
export class UserEntity implements Omit<PrismaUser, 'password'> {
  @Expose()
  @ApiProperty({ example: 'clx123456789' })
  id!: string;

  @Expose()
  @ApiProperty({ example: 'john.doe@example.com' })
  email!: string;

  @Expose()
  @ApiProperty({ example: 'John' })
  firstName!: string;

  @Expose()
  @ApiProperty({ example: 'Doe' })
  lastName!: string;

  @Expose()
  @ApiProperty({ 
    enum: UserRole,
    example: UserRole.LAND_OWNER,
    description: 'User role in the system'
  })
  role!: UserRole;

  @Expose()
  @ApiProperty({ example: '2025-01-15T10:30:00Z' })
  createdAt!: Date;

  @Expose()
  @ApiProperty({ example: '2025-01-20T14:45:00Z' })
  updatedAt!: Date;

  // Password is excluded by default via @Exclude() on class level
  password?: string;

  @Expose()
  @ApiProperty({ 
    type: () => ProfileEntity, 
    required: false,
    nullable: true,
    description: 'User profile details (optional)'
  })
  @Type(() => ProfileEntity)
  profile?: ProfileEntity | null;

  constructor(partial: Partial<PrismaUser & { profile?: UserProfile | null }>) {
    Object.assign(this, partial);

    // Normalize profile: convert null to undefined for consistency
    if (partial.profile === null) {
      this.profile = null;
    } else if (partial.profile) {
      this.profile = new ProfileEntity(partial.profile);
    }
  }
}