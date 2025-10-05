import {
  Will as PrismaWill,
  Asset as PrismaAsset,
  BeneficiaryAssignment as PrismaAssignment,
  Family as PrismaFamily,
  FamilyMember as PrismaFamilyMember,
  WillStatus,
  AssetType,
  RelationshipType,
  Decimal,
} from '@shamba/database';
import { Exclude, Expose, Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * BeneficiaryAssignmentEntity - Asset distribution assignment
 * Links a beneficiary to an asset in a will with share percentage
 */
@Exclude()
export class BeneficiaryAssignmentEntity implements PrismaAssignment {
  @Expose()
  @ApiProperty({ 
    example: 'clx789012345',
    description: 'Unique assignment identifier'
  })
  id!: string;

  @Expose()
  @ApiProperty({ 
    example: 'clx456789012',
    description: 'Will ID'
  })
  willId!: string;

  @Expose()
  @ApiProperty({ 
    example: 'clx123456789',
    description: 'Asset ID'
  })
  assetId!: string;

  @Expose()
  @ApiProperty({ 
    example: 'clx987654321',
    description: 'Beneficiary user ID'
  })
  beneficiaryId!: string;

  @Expose()
  @ApiProperty({ 
    required: false,
    nullable: true,
    type: 'number',
    example: 50.5,
    description: 'Percentage share of asset (0-100)'
  })
  @Transform(({ value }) => value ? Number(value) : null) // Convert Decimal to number
  sharePercent!: Decimal | null;

  @Expose()
  @ApiProperty({ 
    example: '2025-01-15T10:30:00Z',
    description: 'Assignment creation timestamp'
  })
  createdAt!: Date;

  constructor(partial: Partial<PrismaAssignment>) {
    Object.assign(this, partial);
  }
}

/**
 * AssetEntity - Serializable asset for API responses
 * Represents land parcels, bank accounts, vehicles, properties, etc.
 */
@Exclude()
export class AssetEntity implements PrismaAsset {
  @Expose()
  @ApiProperty({ 
    example: 'clx123456789',
    description: 'Unique asset identifier'
  })
  id!: string;

  @Expose()
  @ApiProperty({ 
    example: 'Land Parcel 123 - Kiambu',
    description: 'Asset name'
  })
  name!: string;

  @Expose()
  @ApiProperty({ 
    required: false,
    nullable: true,
    example: '5 acres of agricultural land with title deed',
    description: 'Detailed asset description'
  })
  description!: string | null;

  @Expose()
  @ApiProperty({ 
    enum: AssetType,
    example: AssetType.LAND_PARCEL,
    description: 'Type of asset'
  })
  type!: AssetType;

  @Expose()
  @ApiProperty({ 
    example: 'clx987654321',
    description: 'Owner user ID'
  })
  ownerId!: string;

  @Expose()
  @ApiProperty({ 
    example: '2025-01-15T10:30:00Z',
    description: 'Asset creation timestamp'
  })
  createdAt!: Date;

  @Expose()
  @ApiProperty({ 
    example: '2025-01-20T14:45:00Z',
    description: 'Last update timestamp'
  })
  updatedAt!: Date;

  // Optional: Include assignments if loaded
  @Expose()
  @ApiProperty({ 
    type: [BeneficiaryAssignmentEntity],
    required: false,
    description: 'Beneficiary assignments for this asset'
  })
  @Type(() => BeneficiaryAssignmentEntity)
  beneficiaryAssignments?: BeneficiaryAssignmentEntity[];

  constructor(partial: Partial<PrismaAsset & { beneficiaryAssignments?: PrismaAssignment[] }>) {
    Object.assign(this, partial);
    if (partial.beneficiaryAssignments) {
      this.beneficiaryAssignments = partial.beneficiaryAssignments.map(
        a => new BeneficiaryAssignmentEntity(a)
      );
    }
  }
}

/**
 * WillEntity - Serializable will for API responses
 * Represents a testator's will with beneficiary assignments
 */
@Exclude()
export class WillEntity implements PrismaWill {
  @Expose()
  @ApiProperty({ 
    example: 'clx456789012',
    description: 'Unique will identifier'
  })
  id!: string;

  @Expose()
  @ApiProperty({ 
    example: 'My Last Will and Testament',
    description: 'Will title'
  })
  title!: string;

  @Expose()
  @ApiProperty({ 
    enum: WillStatus,
    example: WillStatus.ACTIVE,
    description: 'Current will status'
  })
  status!: WillStatus;

  @Expose()
  @ApiProperty({ 
    example: 'clx123456789',
    description: 'Testator (will creator) user ID'
  })
  testatorId!: string;

  @Expose()
  @ApiProperty({ 
    example: '2025-01-15T10:30:00Z',
    description: 'Will creation timestamp'
  })
  createdAt!: Date;

  @Expose()
  @ApiProperty({ 
    example: '2025-01-20T14:45:00Z',
    description: 'Last update timestamp'
  })
  updatedAt!: Date;

  @Expose()
  @ApiProperty({ 
    type: [BeneficiaryAssignmentEntity],
    required: false,
    description: 'Beneficiary assignments (asset distributions)'
  })
  @Type(() => BeneficiaryAssignmentEntity)
  beneficiaryAssignments?: BeneficiaryAssignmentEntity[];

  constructor(partial: Partial<PrismaWill & { beneficiaryAssignments?: PrismaAssignment[] }>) {
    Object.assign(this, partial);
    if (partial.beneficiaryAssignments) {
      this.beneficiaryAssignments = partial.beneficiaryAssignments.map(
        a => new BeneficiaryAssignmentEntity(a)
      );
    }
  }
}

/**
 * FamilyMemberEntity - Family member relationship
 * Links a user to a family with their relationship role
 */
@Exclude()
export class FamilyMemberEntity implements PrismaFamilyMember {
  @Expose()
  @ApiProperty({ 
    example: 'clx123456789',
    description: 'User ID'
  })
  userId!: string;

  @Expose()
  @ApiProperty({ 
    example: 'clx987654321',
    description: 'Family ID'
  })
  familyId!: string;

  @Expose()
  @ApiProperty({ 
    enum: RelationshipType,
    example: RelationshipType.SPOUSE,
    description: 'Relationship type to family creator'
  })
  role!: RelationshipType;

  constructor(partial: Partial<PrismaFamilyMember>) {
    Object.assign(this, partial);
  }
}

/**
 * FamilyEntity - Family tree (HeirLink™)
 * Represents a family group with member relationships
 */
@Exclude()
export class FamilyEntity implements PrismaFamily {
  @Expose()
  @ApiProperty({ 
    example: 'clx987654321',
    description: 'Unique family identifier'
  })
  id!: string;

  @Expose()
  @ApiProperty({ 
    example: 'Kamau Family',
    description: 'Family name'
  })
  name!: string;

  @Expose()
  @ApiProperty({ 
    example: 'clx123456789',
    description: 'Family creator user ID'
  })
  creatorId!: string;

  @Expose()
  @ApiProperty({ 
    example: '2025-01-15T10:30:00Z',
    description: 'Family creation timestamp'
  })
  createdAt!: Date;

  @Expose()
  @ApiProperty({ 
    example: '2025-01-20T14:45:00Z',
    description: 'Last update timestamp'
  })
  updatedAt!: Date;

  @Expose()
  @ApiProperty({ 
    type: [FamilyMemberEntity],
    required: false,
    description: 'Family members with their relationships'
  })
  @Type(() => FamilyMemberEntity)
  members?: FamilyMemberEntity[];

  constructor(partial: Partial<PrismaFamily & { members?: PrismaFamilyMember[] }>) {
    Object.assign(this, partial);
    if (partial.members) {
      this.members = partial.members.map(m => new FamilyMemberEntity(m));
    }
  }
}

/**
 * WillSummaryEntity - Lightweight will for list views
 * Excludes assignments for performance
 */
@Exclude()
export class WillSummaryEntity implements Omit<PrismaWill, 'beneficiaryAssignments'> {
  @Expose()
  @ApiProperty({ example: 'clx456789012' })
  id!: string;

  @Expose()
  @ApiProperty({ example: 'My Last Will and Testament' })
  title!: string;

  @Expose()
  @ApiProperty({ enum: WillStatus, example: WillStatus.ACTIVE })
  status!: WillStatus;

  @Expose()
  @ApiProperty({ example: 'clx123456789' })
  testatorId!: string;

  @Expose()
  @ApiProperty({ example: '2025-01-15T10:30:00Z' })
  createdAt!: Date;

  @Expose()
  @ApiProperty({ example: '2025-01-20T14:45:00Z' })
  updatedAt!: Date;

  constructor(partial: Partial<PrismaWill>) {
    Object.assign(this, partial);
  }
}

/**
 * AssetSummaryEntity - Lightweight asset for list views
 * Excludes assignments for performance
 */
@Exclude()
export class AssetSummaryEntity implements Omit<PrismaAsset, 'beneficiaryAssignments'> {
  @Expose()
  @ApiProperty({ example: 'clx123456789' })
  id!: string;

  @Expose()
  @ApiProperty({ example: 'Land Parcel 123 - Kiambu' })
  name!: string;

  @Expose()
  @ApiProperty({ required: false, nullable: true })
  description!: string | null;

  @Expose()
  @ApiProperty({ enum: AssetType, example: AssetType.LAND_PARCEL })
  type!: AssetType;

  @Expose()
  @ApiProperty({ example: 'clx987654321' })
  ownerId!: string;

  @Expose()
  @ApiProperty({ example: '2025-01-15T10:30:00Z' })
  createdAt!: Date;

  @Expose()
  @ApiProperty({ example: '2025-01-20T14:45:00Z' })
  updatedAt!: Date;

  constructor(partial: Partial<PrismaAsset>) {
    Object.assign(this, partial);
  }
}