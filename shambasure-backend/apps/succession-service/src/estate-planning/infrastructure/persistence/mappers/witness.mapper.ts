import { Prisma, WillWitness as PrismaWitness } from '@prisma/client';

import { Witness, WitnessReconstituteProps } from '../../../domain/entities/witness.entity';

export class WitnessMapper {
  /**
   * Converts a Prisma Database Model to a Domain Entity
   */
  static toDomain(raw: PrismaWitness): Witness {
    // 1. Safe JSON extraction for physical address
    const physicalAddress = this.parsePhysicalAddress(raw.physicalAddress);

    // 2. Construct Reconstruction Props with ALL fields
    const props: WitnessReconstituteProps = {
      // Core Identity
      id: raw.id,
      willId: raw.willId,

      // Witness Type and Identity
      witnessType: raw.witnessType,
      witnessId: raw.witnessId,
      fullName: raw.fullName,
      email: raw.email,
      phone: raw.phone,

      // Kenyan Identification
      idNumber: raw.idNumber,
      idType: raw.idType,
      idDocumentId: raw.idDocumentId,
      idVerified: raw.idVerified,

      // Professional witness details
      isProfessionalWitness: raw.isProfessionalWitness,
      professionalCapacity: raw.professionalCapacity,
      professionalLicense: raw.professionalLicense,

      // Relationship Context
      relationship: raw.relationship,
      relationshipDuration: raw.relationshipDuration,
      knowsTestatorWell: raw.knowsTestatorWell,

      // Address Information
      physicalAddress: physicalAddress,
      residentialCounty: raw.residentialCounty,

      // Legal Eligibility (Kenyan Law of Succession Act)
      eligibilityStatus: raw.eligibilityStatus,
      eligibilityVerifiedAt: raw.eligibilityVerifiedAt,
      eligibilityVerifiedBy: raw.eligibilityVerifiedBy,
      ineligibilityReason: raw.ineligibilityReason,

      // Witnessing Process
      status: raw.status,
      signedAt: raw.signedAt,
      signatureType: raw.signatureType,
      signatureData: raw.signatureData,
      signatureLocation: raw.signatureLocation,
      witnessingMethod: raw.witnessingMethod,

      // Verification
      verifiedAt: raw.verifiedAt,
      verifiedBy: raw.verifiedBy,
      verificationMethod: raw.verificationMethod,
      verificationNotes: raw.verificationNotes,

      // Legal Requirements Tracking
      isEligible: raw.isEligible,
      hasConflictOfInterest: raw.hasConflictOfInterest,
      conflictDetails: raw.conflictDetails,
      understandsObligation: raw.understandsObligation,
      obligationAcknowledgedAt: raw.obligationAcknowledgedAt,

      // Communication & Notifications
      invitationSentAt: raw.invitationSentAt,
      invitationMethod: raw.invitationMethod,
      reminderSentAt: raw.reminderSentAt,
      responseReceivedAt: raw.responseReceivedAt,

      // Audit Trail
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };

    return Witness.reconstitute(props);
  }

  /**
   * Converts a Domain Entity to a Prisma Persistence format
   */
  static toPersistence(entity: Witness): Prisma.WillWitnessUncheckedCreateInput {
    // Prepare JSON objects with proper Prisma null handling
    const physicalAddressJson = entity.physicalAddress
      ? (JSON.parse(JSON.stringify(entity.physicalAddress)) as Prisma.JsonObject)
      : Prisma.JsonNull;

    return {
      // Core Identity
      id: entity.id,
      willId: entity.willId,

      // Witness Type and Identity
      witnessType: entity.witnessType,
      witnessId: entity.witnessId,
      fullName: entity.fullName,
      email: entity.email,
      phone: entity.phone,

      // Kenyan Identification
      idNumber: entity.idNumber,
      idType: entity.idType,
      idDocumentId: entity.idDocumentId,
      idVerified: entity.idVerified,

      // Professional witness details
      isProfessionalWitness: entity.isProfessionalWitness,
      professionalCapacity: entity.professionalCapacity,
      professionalLicense: entity.professionalLicense,

      // Relationship Context
      relationship: entity.relationship,
      relationshipDuration: entity.relationshipDuration,
      knowsTestatorWell: entity.knowsTestatorWell,

      // Address Information
      physicalAddress: physicalAddressJson,
      residentialCounty: entity.residentialCounty,

      // Legal Eligibility (Kenyan Law of Succession Act)
      eligibilityStatus: entity.eligibilityStatus,
      eligibilityVerifiedAt: entity.eligibilityVerifiedAt,
      eligibilityVerifiedBy: entity.eligibilityVerifiedBy,
      ineligibilityReason: entity.ineligibilityReason,

      // Witnessing Process
      status: entity.status,
      signedAt: entity.signedAt,
      signatureType: entity.signatureType,
      signatureData: entity.signatureData,
      signatureLocation: entity.signatureLocation,
      witnessingMethod: entity.witnessingMethod,

      // Verification
      verifiedAt: entity.verifiedAt,
      verifiedBy: entity.verifiedBy,
      verificationMethod: entity.verificationMethod,
      verificationNotes: entity.verificationNotes,

      // Legal Requirements Tracking
      isEligible: entity.isEligible,
      hasConflictOfInterest: entity.hasConflictOfInterest,
      conflictDetails: entity.conflictDetails,
      understandsObligation: entity.understandsObligation,
      obligationAcknowledgedAt: entity.obligationAcknowledgedAt,

      // Communication & Notifications
      invitationSentAt: entity.invitationSentAt,
      invitationMethod: entity.invitationMethod,
      reminderSentAt: entity.reminderSentAt,
      responseReceivedAt: entity.responseReceivedAt,

      // Audit Trail
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Create update-specific persistence data
   */
  static toUpdatePersistence(entity: Witness): Prisma.WillWitnessUncheckedUpdateInput {
    const full = this.toPersistence(entity);

    const updatableFields: Omit<
      Prisma.WillWitnessUncheckedCreateInput,
      'id' | 'willId' | 'witnessId' | 'fullName' | 'createdAt'
    > = full;

    return {
      ...updatableFields,
      updatedAt: new Date(),
    };
  }

  /**
   * Parse physical address from Prisma JSON field
   */
  private static parsePhysicalAddress(
    physicalAddress: Prisma.JsonValue,
  ): Record<string, any> | null {
    if (!physicalAddress || typeof physicalAddress !== 'object' || Array.isArray(physicalAddress)) {
      return null;
    }

    return physicalAddress as Record<string, any>;
  }

  /**
   * Batch domain conversion for performance
   */
  static toDomainBatch(records: PrismaWitness[]): Witness[] {
    return records.map((record) => this.toDomain(record));
  }

  /**
   * Batch persistence conversion for performance
   */
  static toPersistenceBatch(entities: Witness[]): Prisma.WillWitnessUncheckedCreateInput[] {
    return entities.map((entity) => this.toPersistence(entity));
  }
}
