import { WillStatus, AssetType, UserRole } from '@shamba/common';
import { Exclude } from 'class-transformer';

export class WillEntity {
  id: string;
  title: string;
  status: WillStatus;
  testatorId: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  beneficiaryAssignments?: BeneficiaryAssignmentEntity[];
  testator?: any;

  constructor(partial: Partial<WillEntity>) {
    Object.assign(this, partial);
  }

  // Business logic methods
  canBeModified(): boolean {
    return this.status === WillStatus.DRAFT;
  }

  canBeExecuted(): boolean {
    return this.status === WillStatus.ACTIVE;
  }

  canBeRevoked(): boolean {
    return this.status === WillStatus.ACTIVE;
  }

  isComplete(): boolean {
    return this.beneficiaryAssignments && this.beneficiaryAssignments.length > 0;
  }

  getTotalAssetDistribution(): number {
    if (!this.beneficiaryAssignments) return 0;

    const assetShares = new Map<string, number>();
    
    this.beneficiaryAssignments.forEach(assignment => {
      const current = assetShares.get(assignment.assetId) || 0;
      assetShares.set(assignment.assetId, current + (assignment.sharePercent || 0));
    });

    // Check if any asset is over-allocated
    for (const [_, total] of assetShares) {
      if (total > 100) {
        return -1; // Over-allocated
      }
    }

    return Array.from(assetShares.values()).reduce((sum, total) => sum + total, 0);
  }

  hasDistributionConflicts(): boolean {
    const total = this.getTotalAssetDistribution();
    return total === -1; // Over-allocated
  }

  validateForActivation(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.title || this.title.length < 3) {
      errors.push('Will title must be at least 3 characters long');
    }

    if (!this.isComplete()) {
      errors.push('Will must have at least one beneficiary assignment');
    }

    if (this.hasDistributionConflicts()) {
      errors.push('Asset distribution exceeds 100% for one or more assets');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export class AssetEntity {
  id: string;
  name: string;
  description?: string;
  type: AssetType;
  ownerId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  beneficiaryAssignments?: BeneficiaryAssignmentEntity[];
  owner?: any;

  constructor(partial: Partial<AssetEntity>) {
    Object.assign(this, partial);
  }

  // Business logic methods
  isLandParcel(): boolean {
    return this.type === AssetType.LAND_PARCEL;
  }

  isFinancialAsset(): boolean {
    return this.type === AssetType.BANK_ACCOUNT;
  }

  canBeTransferred(): boolean {
    // Add business rules for asset transferability
    return true;
  }

  getEstimatedValue(): number | null {
    // This would integrate with valuation services
    return this.metadata?.estimatedValue || null;
  }

  requiresSpecialTransfer(): boolean {
    // Land parcels might require special transfer procedures
    return this.isLandParcel();
  }
}

export class BeneficiaryAssignmentEntity {
  id: string;
  willId: string;
  assetId: string;
  beneficiaryId: string;
  sharePercent?: number;
  createdAt: Date;

  // Relations
  will?: WillEntity;
  asset?: AssetEntity;
  beneficiary?: any;

  constructor(partial: Partial<BeneficiaryAssignmentEntity>) {
    Object.assign(this, partial);
  }

  // Business logic methods
  isValidShare(): boolean {
    if (this.sharePercent === undefined || this.sharePercent === null) return true;
    return this.sharePercent >= 0 && this.sharePercent <= 100;
  }

  getDistributionType(): 'specific' | 'residual' {
    return this.sharePercent !== undefined && this.sharePercent !== null ? 'specific' : 'residual';
  }
}

export class FamilyEntity {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  members?: FamilyMemberEntity[];

  constructor(partial: Partial<FamilyEntity>) {
    Object.assign(this, partial);
  }

  // Business logic methods
  getFamilySize(): number {
    return this.members?.length || 0;
  }

  hasMember(userId: string): boolean {
    return this.members?.some(member => member.userId === userId) || false;
  }

  getMemberRole(userId: string): string | null {
    const member = this.members?.find(m => m.userId === userId);
    return member?.role || null;
  }

  canManageFamily(userId: string): boolean {
    const role = this.getMemberRole(userId);
    return role === 'PARENT' || role === 'ADMIN';
  }
}

export class FamilyMemberEntity {
  userId: string;
  familyId: string;
  role: string;
  
  // Relations
  user?: any;
  family?: FamilyEntity;

  constructor(partial: Partial<FamilyMemberEntity>) {
    Object.assign(this, partial);
  }
}