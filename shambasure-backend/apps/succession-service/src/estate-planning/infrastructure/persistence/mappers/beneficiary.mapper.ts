import {
  BeneficiaryAssignment as PrismaBeneficiary,
  Prisma,
  BequestConditionType,
  BequestType,
} from '@prisma/client';
import {
  BeneficiaryAssignment,
  BeneficiaryReconstituteProps,
} from '../../../domain/entities/beneficiary.entity';

export class BeneficiaryMapper {
  /**
   * Converts a Prisma Database Model to a Domain Entity
   */
  static toDomain(raw: PrismaBeneficiary): BeneficiaryAssignment {
    // 1. Handle Decimal Conversions safely with validation
    const sharePercentage = raw.sharePercent ? this.safeDecimalToNumber(raw.sharePercent) : null;
    const specificAmountVal = raw.specificAmount
      ? this.safeDecimalToNumber(raw.specificAmount)
      : null;
    const alternateShare = raw.alternateSharePercent
      ? this.safeDecimalToNumber(raw.alternateSharePercent)
      : null;

    // 2. Construct Specific Amount Object with proper asset value reconstruction
    const specificAmountData =
      specificAmountVal !== null
        ? {
            amount: specificAmountVal,
            currency: 'KES', // Kenyan succession law default
            valuationDate: raw.createdAt,
          }
        : null;

    // 3. Construct Reconstruction Props
    const props: BeneficiaryReconstituteProps = {
      id: raw.id,
      willId: raw.willId,
      assetId: raw.assetId,

      // Identity Flattening
      userId: raw.beneficiaryId,
      familyMemberId: raw.familyMemberId,
      externalName: raw.externalBeneficiaryName,
      externalContact: raw.externalBeneficiaryContact,
      relationship: null, // Remove metadata extraction since field doesn't exist

      bequestType: raw.bequestType,
      sharePercentage: sharePercentage,
      specificAmount: specificAmountData,

      conditionType: raw.conditionType,
      conditionDetails: raw.conditionDetails,

      alternateBeneficiaryId: raw.alternateBeneficiaryId,
      alternateShare: alternateShare,

      distributionStatus: raw.distributionStatus,
      distributedAt: raw.distributedAt,
      distributionNotes: raw.distributionNotes,

      priority: raw.priority,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };

    return BeneficiaryAssignment.reconstitute(props);
  }

  /**
   * Converts a Domain Entity to a Prisma Persistence format
   */
  static toPersistence(
    entity: BeneficiaryAssignment,
  ): Prisma.BeneficiaryAssignmentUncheckedCreateInput {
    // 1. Extract Value Objects
    const identity = entity.beneficiaryIdentity;
    const share = entity.sharePercentage;
    const specificAmount = entity.specificAmount;
    const alternateShare = entity.alternateShare;

    // 2. Prepare Decimal Values with proper Prisma types
    const sharePercentDecimal = share
      ? new Prisma.Decimal(share.getValue())
      : new Prisma.Decimal(0);
    const specificAmountDecimal = specificAmount
      ? new Prisma.Decimal(specificAmount.getAmount())
      : null;
    const alternateShareDecimal = alternateShare
      ? new Prisma.Decimal(alternateShare.getValue())
      : null;

    // 3. Construct Prisma Object
    return {
      id: entity.id,
      willId: entity.willId,
      assetId: entity.assetId,

      // Identity Mapping
      beneficiaryId: identity.userId || null,
      familyMemberId: identity.familyMemberId || null,
      externalBeneficiaryName: identity.externalName || null,
      externalBeneficiaryContact: identity.externalContact || null,

      // Bequest Details
      bequestType: entity.bequestType,
      sharePercent: sharePercentDecimal, // Fixed: Always provide Decimal, never null
      specificAmount: specificAmountDecimal,

      // Conditions
      hasCondition: entity.conditionType !== BequestConditionType.NONE,
      conditionType: entity.conditionType,
      conditionDetails: entity.conditionDetails,

      // Alternates
      alternateBeneficiaryId: entity.alternateBeneficiaryId,
      alternateSharePercent: alternateShareDecimal,

      // Status
      distributionStatus: entity.distributionStatus,
      distributedAt: entity.distributedAt,
      distributionNotes: entity.distributionNotes,

      priority: entity.priority,

      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Create update-specific persistence data
   */
  static toUpdatePersistence(
    entity: BeneficiaryAssignment,
  ): Prisma.BeneficiaryAssignmentUncheckedUpdateInput {
    const full = this.toPersistence(entity);

    // Omit immutable fields so they are not included in update
    const updatableFields: Omit<
      Prisma.BeneficiaryAssignmentUncheckedCreateInput,
      | 'id'
      | 'willId'
      | 'assetId'
      | 'beneficiaryId'
      | 'familyMemberId'
      | 'externalBeneficiaryName'
      | 'createdAt'
    > = full;

    return {
      ...updatableFields,
      updatedAt: new Date(),
    };
  }

  /**
   * Safe decimal to number conversion with validation
   */
  private static safeDecimalToNumber(decimal: Prisma.Decimal): number {
    try {
      const value = decimal.toNumber();
      if (isNaN(value) || !isFinite(value)) {
        throw new Error('Invalid decimal value');
      }
      return value;
    } catch (error) {
      throw new Error(
        `Failed to convert decimal to number: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Batch domain conversion for performance
   */
  static toDomainBatch(records: PrismaBeneficiary[]): BeneficiaryAssignment[] {
    return records.map((record) => this.toDomain(record));
  }

  /**
   * Batch persistence conversion for performance
   */
  static toPersistenceBatch(
    entities: BeneficiaryAssignment[],
  ): Prisma.BeneficiaryAssignmentUncheckedCreateInput[] {
    return entities.map((entity) => this.toPersistence(entity));
  }

  /**
   * Validate bequest type compatibility for Kenyan law
   */
  static validateBequestTypeCompatibility(
    bequestType: BequestType,
    hasShare: boolean,
    hasSpecificAmount: boolean,
  ): boolean {
    switch (bequestType) {
      case BequestType.PERCENTAGE:
      case BequestType.RESIDUARY:
        return hasShare && !hasSpecificAmount;

      case BequestType.SPECIFIC:
        return hasSpecificAmount && !hasShare;

      case BequestType.CONDITIONAL:
      case BequestType.TRUST:
        return true; // Can have either or both depending on configuration

      default:
        return false;
    }
  }

  /**
   * Get display information for beneficiary (useful for UI/API responses)
   */
  static getBeneficiaryDisplayInfo(entity: BeneficiaryAssignment): {
    name: string;
    type: string;
    relationship?: string;
    contact?: string;
  } {
    const identity = entity.beneficiaryIdentity;

    return {
      name: entity.getBeneficiaryName(),
      type: entity.getBeneficiaryType(),
      relationship: identity.relationship,
      contact: identity.externalContact,
    };
  }
}
