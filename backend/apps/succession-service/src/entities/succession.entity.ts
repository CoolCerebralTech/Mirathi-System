import {
  Will as PrismaWill,
  Asset as PrismaAsset,
  BeneficiaryAssignment as PrismaAssignment,
  Family as PrismaFamily,
  FamilyMember as PrismaFamilyMember,
} from '@shamba/database';

// ============================================================================
// ARCHITECTURAL NOTE: The Role of Entities
// ============================================================================
// These entities are clean representations of our data models, used for
// serializing API responses. All business logic has been REMOVED and now
// lives in the service layer (e.g., WillsService, AssetsService).
// ============================================================================

export class BeneficiaryAssignmentEntity implements PrismaAssignment {
  id!: string;
  willId!: string;
  assetId!: string;
  beneficiaryId!: string;
  sharePercent!: PrismaAssignment['sharePercent'];
  createdAt!: Date;

  constructor(partial: Partial<PrismaAssignment>) {
    Object.assign(this, partial);
  }
}

export class AssetEntity implements PrismaAsset {
  id!: string;
  name!: string;
  description!: string | null;
  type!: PrismaAsset['type'];
  ownerId!: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<PrismaAsset>) {
    Object.assign(this, partial);
  }
}

export class WillEntity implements PrismaWill {
  id!: string;
  title!: string;
  status!: PrismaWill['status'];
  testatorId!: string;
  createdAt!: Date;
  updatedAt!: Date;

  beneficiaryAssignments?: BeneficiaryAssignmentEntity[];

  constructor(partial: Partial<PrismaWill & { beneficiaryAssignments?: PrismaAssignment[] }>) {
    Object.assign(this, partial);
    if (partial.beneficiaryAssignments) {
      this.beneficiaryAssignments = partial.beneficiaryAssignments.map(
        (a) => new BeneficiaryAssignmentEntity(a),
      );
    }
  }
}

export class FamilyMemberEntity implements PrismaFamilyMember {
    userId!: string;
    familyId!: string;
    role!: PrismaFamilyMember['role'];
    
    constructor(partial: Partial<PrismaFamilyMember>) {
        Object.assign(this, partial);
    }
}

export class FamilyEntity implements PrismaFamily {
    id!: string;
    name!: string;
    creatorId!: string;
    createdAt!: Date;
    updatedAt!: Date;

    members?: FamilyMemberEntity[];

    constructor(partial: Partial<PrismaFamily & { members?: PrismaFamilyMember[] }>) {
        Object.assign(this, partial);
        if (partial.members) {
            this.members = partial.members.map(m => new FamilyMemberEntity(m));
        }
    }
}