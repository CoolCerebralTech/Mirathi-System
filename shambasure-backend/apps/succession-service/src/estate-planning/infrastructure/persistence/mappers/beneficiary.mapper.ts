import { Prisma, BeneficiaryAssignment as PrismaBeneficiary } from '@prisma/client';

import {
  BeneficiaryAssignment,
  BeneficiaryReconstituteProps,
} from '../../../domain/entities/beneficiary.entity';

export class BeneficiaryMapper {
  /**
   * Converts a Prisma Database Model to a Domain Entity
   */
  static toDomain(raw: PrismaBeneficiary): BeneficiaryAssignment {
    // 1. Safe JSON extraction for external address
    const externalAddress = this.parseExternalAddress(raw.externalAddress);

    // 2. Construct Reconstruction Props with ALL fields
    const props: BeneficiaryReconstituteProps = {
      // Core Assignment Properties
      id: raw.id,
      willId: raw.willId,
      assetId: raw.assetId,

      // Beneficiary Identity
      beneficiaryType: raw.beneficiaryType,
      userId: raw.userId,
      familyMemberId: raw.familyMemberId,
      externalName: raw.externalName,
      externalContact: raw.externalContact,
      externalIdentification: raw.externalIdentification,
      externalAddress: externalAddress,

      // Kenyan Relationship Context
      relationshipCategory: raw.relationshipCategory,
      specificRelationship: raw.specificRelationship,
      isDependant: raw.isDependant,

      // Bequest Configuration
      bequestType: raw.bequestType,
      sharePercent: raw.sharePercent, // Raw number from Prisma
      specificAmount: raw.specificAmount,
      currency: raw.currency,

      // Conditions for Kenyan Law
      conditionType: raw.conditionType,
      conditionDetails: raw.conditionDetails,
      conditionMet: raw.conditionMet,
      conditionDeadline: raw.conditionDeadline,

      // Life Interest Support
      hasLifeInterest: raw.hasLifeInterest,
      lifeInterestDuration: raw.lifeInterestDuration,
      lifeInterestEndsAt: raw.lifeInterestEndsAt,

      // Alternate Beneficiary
      alternateAssignmentId: raw.alternateAssignmentId,

      // Distribution Tracking
      distributionStatus: raw.distributionStatus,
      distributedAt: raw.distributedAt,
      distributionNotes: raw.distributionNotes,
      distributionMethod: raw.distributionMethod,

      // Legal Compliance
      isSubjectToDependantsProvision: raw.isSubjectToDependantsProvision,
      courtApprovalRequired: raw.courtApprovalRequired,
      courtApprovalObtained: raw.courtApprovalObtained,

      // Priority & Order
      priority: raw.priority,
      bequestPriority: raw.bequestPriority,

      // Audit Trail
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
    // Prepare JSON objects with proper Prisma null handling
    const externalAddressJson = entity.externalAddress
      ? (JSON.parse(JSON.stringify(entity.externalAddress)) as Prisma.JsonObject)
      : Prisma.JsonNull;

    // Convert SharePercentage value object to raw number
    const sharePercentValue = entity.sharePercent ? entity.sharePercent.getValue() : null;

    return {
      // Core Assignment Properties
      id: entity.id,
      willId: entity.willId,
      assetId: entity.assetId,

      // Beneficiary Identity
      beneficiaryType: entity.beneficiaryType,
      userId: entity.userId,
      familyMemberId: entity.familyMemberId,
      externalName: entity.externalName,
      externalContact: entity.externalContact,
      externalIdentification: entity.externalIdentification,
      externalAddress: externalAddressJson,

      // Kenyan Relationship Context
      relationshipCategory: entity.relationshipCategory,
      specificRelationship: entity.specificRelationship,
      isDependant: entity.isDependant,

      // Bequest Configuration
      bequestType: entity.bequestType,
      sharePercent: sharePercentValue, // Convert to raw number
      specificAmount: entity.specificAmount,
      currency: entity.currency,

      // Conditions for Kenyan Law
      conditionType: entity.conditionType,
      conditionDetails: entity.conditionDetails,
      conditionMet: entity.conditionMet,
      conditionDeadline: entity.conditionDeadline,

      // Life Interest Support
      hasLifeInterest: entity.hasLifeInterest,
      lifeInterestDuration: entity.lifeInterestDuration,
      lifeInterestEndsAt: entity.lifeInterestEndsAt,

      // Alternate Beneficiary
      alternateAssignmentId: entity.alternateAssignmentId,

      // Distribution Tracking
      distributionStatus: entity.distributionStatus,
      distributedAt: entity.distributedAt,
      distributionNotes: entity.distributionNotes,
      distributionMethod: entity.distributionMethod,

      // Legal Compliance
      isSubjectToDependantsProvision: entity.isSubjectToDependantsProvision,
      courtApprovalRequired: entity.courtApprovalRequired,
      courtApprovalObtained: entity.courtApprovalObtained,

      // Priority & Order
      priority: entity.priority,
      bequestPriority: entity.bequestPriority,

      // Audit Trail
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

    const updatableFields: Omit<
      Prisma.BeneficiaryAssignmentUncheckedCreateInput,
      'id' | 'willId' | 'assetId' | 'beneficiaryType' | 'createdAt'
    > = full;

    return {
      ...updatableFields,
      updatedAt: new Date(),
    };
  }

  /**
   * Parse external address from Prisma JSON field
   */
  private static parseExternalAddress(
    externalAddress: Prisma.JsonValue,
  ): Record<string, any> | null {
    if (!externalAddress || typeof externalAddress !== 'object' || Array.isArray(externalAddress)) {
      return null;
    }

    return externalAddress as Record<string, any>;
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
}
