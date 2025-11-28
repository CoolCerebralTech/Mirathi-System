import { Prisma, WillExecutor as PrismaExecutor } from '@prisma/client';

import { Executor, ExecutorReconstituteProps } from '../../../domain/entities/executor.entity';

export class ExecutorMapper {
  /**
   * Converts a Prisma Database Model to a Domain Entity
   */
  static toDomain(raw: PrismaExecutor): Executor {
    // 1. Safe JSON extraction for addresses
    const physicalAddress = this.parseAddress(raw.physicalAddress);
    const postalAddress = this.parseAddress(raw.postalAddress);

    // 2. Construct Reconstruction Props with ALL fields
    const props: ExecutorReconstituteProps = {
      // Core Identity
      id: raw.id,
      willId: raw.willId,

      // Identity
      executorId: raw.executorId,
      fullName: raw.fullName,
      email: raw.email,
      phone: raw.phone,
      idNumber: raw.idNumber,
      kraPin: raw.kraPin,

      // Professional executor details
      isProfessional: raw.isProfessional,
      professionalQualification: raw.professionalQualification,
      practicingCertificateNumber: raw.practicingCertificateNumber,

      // Relationship context
      relationship: raw.relationship,
      relationshipDuration: raw.relationshipDuration,

      // Address Information
      physicalAddress: physicalAddress,
      postalAddress: postalAddress,

      // Role Configuration
      isPrimary: raw.isPrimary,
      orderOfPriority: raw.orderOfPriority,
      appointmentType: raw.appointmentType,

      // Legal Eligibility (Kenyan Law of Succession Act)
      eligibilityStatus: raw.eligibilityStatus,
      eligibilityVerifiedAt: raw.eligibilityVerifiedAt,
      eligibilityVerifiedBy: raw.eligibilityVerifiedBy,
      ineligibilityReason: raw.ineligibilityReason,

      // Appointment & Service Timeline
      status: raw.status,
      nominatedAt: raw.nominatedAt,
      appointedAt: raw.appointedAt,
      acceptedAt: raw.acceptedAt,
      declinedAt: raw.declinedAt,
      declineReason: raw.declineReason,
      removedAt: raw.removedAt,
      removalReason: raw.removalReason,
      completedAt: raw.completedAt,

      // Compensation (Kenyan Law of Succession Act Section 83)
      isCompensated: raw.isCompensated,
      compensationType: raw.compensationType,
      compensationAmount: raw.compensationAmount,
      compensationPercentage: raw.compensationPercentage,
      hourlyRate: raw.hourlyRate,
      estimatedHours: raw.estimatedHours,
      courtApprovedCompensation: raw.courtApprovedCompensation,

      // Bond & Security (Kenyan Probate Practice)
      requiresBond: raw.requiresBond,
      bondAmount: raw.bondAmount,
      bondProvided: raw.bondProvided,
      bondProvider: raw.bondProvider,
      bondExpiryDate: raw.bondExpiryDate,

      // Duties & Responsibilities
      specificDuties: raw.specificDuties,
      limitations: raw.limitations,
      specialPowers: raw.specialPowers,

      // Communication Preferences
      preferredContactMethod: raw.preferredContactMethod,
      languagePreference: raw.languagePreference,

      // Audit Trail
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };

    return Executor.reconstitute(props);
  }

  /**
   * Converts a Domain Entity to a Prisma Persistence format
   */
  static toPersistence(entity: Executor): Prisma.WillExecutorUncheckedCreateInput {
    // Prepare JSON objects with proper Prisma null handling
    const physicalAddressJson = entity.physicalAddress
      ? (JSON.parse(JSON.stringify(entity.physicalAddress)) as Prisma.JsonObject)
      : Prisma.JsonNull;

    const postalAddressJson = entity.postalAddress
      ? (JSON.parse(JSON.stringify(entity.postalAddress)) as Prisma.JsonObject)
      : Prisma.JsonNull;

    return {
      // Core Identity
      id: entity.id,
      willId: entity.willId,

      // Identity
      executorId: entity.executorId,
      fullName: entity.fullName,
      email: entity.email,
      phone: entity.phone,
      idNumber: entity.idNumber,
      kraPin: entity.kraPin,

      // Professional executor details
      isProfessional: entity.isProfessional,
      professionalQualification: entity.professionalQualification,
      practicingCertificateNumber: entity.practicingCertificateNumber,

      // Relationship context
      relationship: entity.relationship,
      relationshipDuration: entity.relationshipDuration,

      // Address Information
      physicalAddress: physicalAddressJson,
      postalAddress: postalAddressJson,

      // Role Configuration
      isPrimary: entity.isPrimary,
      orderOfPriority: entity.orderOfPriority,
      appointmentType: entity.appointmentType,

      // Legal Eligibility (Kenyan Law of Succession Act)
      eligibilityStatus: entity.eligibilityStatus,
      eligibilityVerifiedAt: entity.eligibilityVerifiedAt,
      eligibilityVerifiedBy: entity.eligibilityVerifiedBy,
      ineligibilityReason: entity.ineligibilityReason,

      // Appointment & Service Timeline
      status: entity.status,
      nominatedAt: entity.nominatedAt,
      appointedAt: entity.appointedAt,
      acceptedAt: entity.acceptedAt,
      declinedAt: entity.declinedAt,
      declineReason: entity.declineReason,
      removedAt: entity.removedAt,
      removalReason: entity.removalReason,
      completedAt: entity.completedAt,

      // Compensation (Kenyan Law of Succession Act Section 83)
      isCompensated: entity.isCompensated,
      compensationType: entity.compensationType,
      compensationAmount: entity.compensationAmount,
      compensationPercentage: entity.compensationPercentage,
      hourlyRate: entity.hourlyRate,
      estimatedHours: entity.estimatedHours,
      courtApprovedCompensation: entity.courtApprovedCompensation,

      // Bond & Security (Kenyan Probate Practice)
      requiresBond: entity.requiresBond,
      bondAmount: entity.bondAmount,
      bondProvided: entity.bondProvided,
      bondProvider: entity.bondProvider,
      bondExpiryDate: entity.bondExpiryDate,

      // Duties & Responsibilities
      specificDuties: entity.specificDuties,
      limitations: entity.limitations,
      specialPowers: entity.specialPowers,

      // Communication Preferences
      preferredContactMethod: entity.preferredContactMethod,
      languagePreference: entity.languagePreference,

      // Audit Trail
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Create update-specific persistence data
   */
  static toUpdatePersistence(entity: Executor): Prisma.WillExecutorUncheckedUpdateInput {
    const full = this.toPersistence(entity);

    const updatableFields: Omit<
      Prisma.WillExecutorUncheckedCreateInput,
      'id' | 'willId' | 'executorId' | 'createdAt'
    > = full;

    return {
      ...updatableFields,
      updatedAt: new Date(),
    };
  }

  /**
   * Parse address from Prisma JSON field
   */
  private static parseAddress(address: Prisma.JsonValue): Record<string, any> | null {
    if (!address || typeof address !== 'object' || Array.isArray(address)) {
      return null;
    }

    return address as Record<string, any>;
  }

  /**
   * Batch domain conversion for performance
   */
  static toDomainBatch(records: PrismaExecutor[]): Executor[] {
    return records.map((record) => this.toDomain(record));
  }

  /**
   * Batch persistence conversion for performance
   */
  static toPersistenceBatch(entities: Executor[]): Prisma.WillExecutorUncheckedCreateInput[] {
    return entities.map((entity) => this.toPersistence(entity));
  }
}
