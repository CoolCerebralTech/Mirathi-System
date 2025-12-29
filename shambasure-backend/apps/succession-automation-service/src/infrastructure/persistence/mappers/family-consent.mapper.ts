// src/succession-automation/src/infrastructure/persistence/mappers/family-consent.mapper.ts
import { FamilyConsent as PrismaFamilyConsent } from '@prisma/client';

import {
  ConsentMethod,
  ConsentStatus,
  FamilyConsent,
  FamilyRole,
} from '../../../domain/entities/family-consent.entity';

/**
 * FamilyConsent Mapper
 *
 * PURPOSE: Translates between Domain Entity and Prisma Model
 *
 * RESPONSIBILITIES:
 * 1. Map domain entity to persistence model (for saving)
 * 2. Map persistence model to domain entity (for reading)
 * 3. Handle value object serialization/deserialization
 * 4. Enforce data integrity during conversion
 *
 * DOMAIN VS PERSISTENCE CONCERNS:
 * - Domain: Business logic, validation, invariants
 * - Persistence: Database representation, optimization, query patterns
 */

export class FamilyConsentMapper {
  /**
   * Map Domain Entity to Prisma Model for CREATE operations
   * applicationId is REQUIRED
   */
  public static toPersistenceCreate(domainEntity: FamilyConsent, applicationId: string): any {
    if (!applicationId) {
      throw new Error('FamilyConsent must have applicationId for persistence');
    }

    // Get props from domain entity
    const props = (domainEntity as any).props;

    // Build the persistence object
    const persistence: any = {
      // --- Core Fields ---
      familyMemberId: domainEntity.familyMemberId,
      fullName: domainEntity.fullName,
      nationalId: props.nationalId || null,
      phoneNumber: props.phoneNumber || null,
      email: props.email || null,

      // --- Role & Relationship ---
      role: this.mapDomainFamilyRoleToPrisma(domainEntity.role),
      relationshipToDeceased: domainEntity.relationshipToDeceased,

      // --- Status ---
      status: this.mapDomainConsentStatusToPrisma(domainEntity.status),
      method: props.method ? this.mapDomainConsentMethodToPrisma(props.method) : null,

      // --- Request Tracking ---
      requestSentAt: props.requestSentAt || null,
      requestSentVia: props.requestSentVia || null,
      requestExpiresAt: props.requestExpiresAt || null,

      // --- Response Tracking ---
      respondedAt: props.respondedAt || null,
      consentGivenAt: props.consentGivenAt || null,
      declinedAt: props.declinedAt || null,
      withdrawnAt: props.withdrawnAt || null,

      // --- Evidence ---
      digitalSignatureId: props.digitalSignatureId || null,
      signatureMethod: props.signatureMethod
        ? this.mapDomainConsentMethodToPrisma(props.signatureMethod)
        : null,
      verificationCode: props.verificationCode || null,
      ipAddress: props.ipAddress || null,
      deviceInfo: props.deviceInfo || null,

      // --- Decline/Withdrawal Logic ---
      declineReason: props.declineReason || null,
      declineCategory: props.declineCategory || null,
      withdrawalReason: props.withdrawalReason || null,

      // --- Legal Representation ---
      hasLegalRepresentative: props.hasLegalRepresentative,
      legalRepresentativeName: props.legalRepresentativeName || null,
      legalRepresentativeContact: props.legalRepresentativeContact || null,

      // --- Notes ---
      notes: props.notes || null,
      internalNotes: props.internalNotes || null,

      // --- Foreign Key ---
      applicationId: applicationId,
    };

    return persistence;
  }

  /**
   * Map Domain Entity to Prisma Model for UPDATE operations
   * Only includes fields that can be updated after creation
   */
  public static toPersistenceUpdate(domainEntity: FamilyConsent): any {
    // Get props from domain entity
    const props = (domainEntity as any).props;

    // Only include fields that can be updated
    const updateData: any = {
      // --- Status & Method ---
      status: this.mapDomainConsentStatusToPrisma(domainEntity.status),
      method: props.method ? this.mapDomainConsentMethodToPrisma(props.method) : null,

      // --- Response Tracking ---
      respondedAt: props.respondedAt || null,
      consentGivenAt: props.consentGivenAt || null,
      declinedAt: props.declinedAt || null,
      withdrawnAt: props.withdrawnAt || null,

      // --- Evidence ---
      digitalSignatureId: props.digitalSignatureId || null,
      signatureMethod: props.signatureMethod
        ? this.mapDomainConsentMethodToPrisma(props.signatureMethod)
        : null,
      verificationCode: props.verificationCode || null,
      ipAddress: props.ipAddress || null,
      deviceInfo: props.deviceInfo || null,

      // --- Decline/Withdrawal Logic ---
      declineReason: props.declineReason || null,
      declineCategory: props.declineCategory || null,
      withdrawalReason: props.withdrawalReason || null,

      // --- Legal Representation ---
      hasLegalRepresentative: props.hasLegalRepresentative,
      legalRepresentativeName: props.legalRepresentativeName || null,
      legalRepresentativeContact: props.legalRepresentativeContact || null,

      // --- Notes ---
      notes: props.notes || null,
      internalNotes: props.internalNotes || null,

      // --- Contact info can be updated ---
      nationalId: props.nationalId || null,
      phoneNumber: props.phoneNumber || null,
      email: props.email || null,
    };

    // Remove null values that are actually undefined
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    return updateData;
  }

  /**
   * Map Prisma Model to Domain Entity for READ operations
   */
  public static toDomain(prismaModel: PrismaFamilyConsent): FamilyConsent {
    if (!prismaModel) {
      throw new Error('Prisma model cannot be null');
    }

    // Validate required fields
    if (!prismaModel.familyMemberId) {
      throw new Error('Prisma FamilyConsent must have familyMemberId');
    }

    if (!prismaModel.fullName) {
      throw new Error('Prisma FamilyConsent must have fullName');
    }

    if (!prismaModel.role) {
      throw new Error('Prisma FamilyConsent must have role');
    }

    if (!prismaModel.relationshipToDeceased) {
      throw new Error('Prisma FamilyConsent must have relationshipToDeceased');
    }

    if (!prismaModel.status) {
      throw new Error('Prisma FamilyConsent must have status');
    }

    // Prepare domain properties - convert null to undefined for domain
    const domainProps = {
      // --- Identity ---
      familyMemberId: prismaModel.familyMemberId,
      fullName: prismaModel.fullName,
      nationalId: prismaModel.nationalId || undefined,
      phoneNumber: prismaModel.phoneNumber || undefined,
      email: prismaModel.email || undefined,

      // --- Role & Relationship ---
      role: this.mapPrismaFamilyRoleToDomain(prismaModel.role),
      relationshipToDeceased: prismaModel.relationshipToDeceased,

      // --- Consent Status ---
      status: this.mapPrismaConsentStatusToDomain(prismaModel.status),
      method: prismaModel.method
        ? this.mapPrismaConsentMethodToDomain(prismaModel.method)
        : undefined,

      // --- Request Tracking ---
      requestSentAt: prismaModel.requestSentAt || undefined,
      requestSentVia: (prismaModel.requestSentVia as any) || undefined,
      requestExpiresAt: prismaModel.requestExpiresAt || undefined,

      // --- Response Tracking ---
      respondedAt: prismaModel.respondedAt || undefined,
      consentGivenAt: prismaModel.consentGivenAt || undefined,
      declinedAt: prismaModel.declinedAt || undefined,

      // --- Signature/Verification ---
      digitalSignatureId: prismaModel.digitalSignatureId || undefined,
      signatureMethod: prismaModel.signatureMethod
        ? this.mapPrismaConsentMethodToDomain(prismaModel.signatureMethod)
        : undefined,
      verificationCode: prismaModel.verificationCode || undefined,
      ipAddress: prismaModel.ipAddress || undefined,
      deviceInfo: prismaModel.deviceInfo || undefined,

      // --- Decline Reason ---
      declineReason: prismaModel.declineReason || undefined,
      declineCategory: (prismaModel.declineCategory as any) || undefined,

      // --- Legal Representation ---
      hasLegalRepresentative: prismaModel.hasLegalRepresentative,
      legalRepresentativeName: prismaModel.legalRepresentativeName || undefined,
      legalRepresentativeContact: prismaModel.legalRepresentativeContact || undefined,

      // --- Withdrawal ---
      withdrawnAt: prismaModel.withdrawnAt || undefined,
      withdrawalReason: prismaModel.withdrawalReason || undefined,

      // --- Notes ---
      notes: prismaModel.notes || undefined,
      internalNotes: prismaModel.internalNotes || undefined,
    };

    // Reconstitute the domain entity
    return FamilyConsent.reconstitute(
      prismaModel.id,
      domainProps,
      prismaModel.createdAt,
      prismaModel.updatedAt,
    );
  }

  /**
   * Map multiple Prisma models to Domain Entities
   */
  public static toDomainArray(prismaModels: PrismaFamilyConsent[]): FamilyConsent[] {
    return prismaModels.map((model) => this.toDomain(model));
  }

  /**
   * Extract ID for persistence operations
   */
  public static getPersistenceId(domainEntity: FamilyConsent): string | null {
    return domainEntity.id ? domainEntity.id.toString() : null;
  }

  // ==================== ENUM MAPPING HELPERS ====================

  /**
   * Map Domain FamilyRole to Prisma Enum string
   */
  private static mapDomainFamilyRoleToPrisma(role: FamilyRole): string {
    const mapping: Record<FamilyRole, string> = {
      [FamilyRole.SURVIVING_SPOUSE]: 'SURVIVING_SPOUSE',
      [FamilyRole.ADULT_CHILD]: 'ADULT_CHILD',
      [FamilyRole.MINOR_CHILD]: 'MINOR_CHILD',
      [FamilyRole.GUARDIAN_OF_MINOR]: 'GUARDIAN_OF_MINOR',
      [FamilyRole.BENEFICIARY]: 'BENEFICIARY',
      [FamilyRole.EXECUTOR]: 'EXECUTOR',
      [FamilyRole.ADMINISTRATOR]: 'ADMINISTRATOR',
      [FamilyRole.PARENT]: 'PARENT',
      [FamilyRole.SIBLING]: 'SIBLING',
      [FamilyRole.OTHER_RELATIVE]: 'OTHER_RELATIVE',
    };

    const prismaRole = mapping[role];
    if (!prismaRole) {
      throw new Error(`Invalid FamilyRole: ${role}`);
    }
    return prismaRole;
  }

  /**
   * Map Prisma FamilyRole string to Domain Enum
   */
  private static mapPrismaFamilyRoleToDomain(role: string): FamilyRole {
    const mapping: Record<string, FamilyRole> = {
      SURVIVING_SPOUSE: FamilyRole.SURVIVING_SPOUSE,
      ADULT_CHILD: FamilyRole.ADULT_CHILD,
      MINOR_CHILD: FamilyRole.MINOR_CHILD,
      GUARDIAN_OF_MINOR: FamilyRole.GUARDIAN_OF_MINOR,
      BENEFICIARY: FamilyRole.BENEFICIARY,
      EXECUTOR: FamilyRole.EXECUTOR,
      ADMINISTRATOR: FamilyRole.ADMINISTRATOR,
      PARENT: FamilyRole.PARENT,
      SIBLING: FamilyRole.SIBLING,
      OTHER_RELATIVE: FamilyRole.OTHER_RELATIVE,
    };

    const domainRole = mapping[role];
    if (!domainRole) {
      throw new Error(`Invalid Prisma FamilyRole: ${role}`);
    }
    return domainRole;
  }

  /**
   * Map Domain ConsentStatus to Prisma Enum string
   */
  private static mapDomainConsentStatusToPrisma(status: ConsentStatus): string {
    const mapping: Record<ConsentStatus, string> = {
      [ConsentStatus.PENDING]: 'PENDING',
      [ConsentStatus.GRANTED]: 'GRANTED',
      [ConsentStatus.DECLINED]: 'DECLINED',
      [ConsentStatus.NOT_REQUIRED]: 'NOT_REQUIRED',
      [ConsentStatus.EXPIRED]: 'EXPIRED',
      [ConsentStatus.WITHDRAWN]: 'WITHDRAWN',
    };

    const prismaStatus = mapping[status];
    if (!prismaStatus) {
      throw new Error(`Invalid ConsentStatus: ${status}`);
    }
    return prismaStatus;
  }

  /**
   * Map Prisma ConsentStatus string to Domain Enum
   */
  private static mapPrismaConsentStatusToDomain(status: string): ConsentStatus {
    const mapping: Record<string, ConsentStatus> = {
      PENDING: ConsentStatus.PENDING,
      GRANTED: ConsentStatus.GRANTED,
      DECLINED: ConsentStatus.DECLINED,
      NOT_REQUIRED: ConsentStatus.NOT_REQUIRED,
      EXPIRED: ConsentStatus.EXPIRED,
      WITHDRAWN: ConsentStatus.WITHDRAWN,
    };

    const domainStatus = mapping[status];
    if (!domainStatus) {
      throw new Error(`Invalid Prisma ConsentStatus: ${status}`);
    }
    return domainStatus;
  }

  /**
   * Map Domain ConsentMethod to Prisma Enum string
   */
  private static mapDomainConsentMethodToPrisma(method: ConsentMethod): string {
    const mapping: Record<ConsentMethod, string> = {
      [ConsentMethod.SMS_OTP]: 'SMS_OTP',
      [ConsentMethod.EMAIL_LINK]: 'EMAIL_LINK',
      [ConsentMethod.DIGITAL_SIGNATURE]: 'DIGITAL_SIGNATURE',
      [ConsentMethod.WET_SIGNATURE]: 'WET_SIGNATURE',
      [ConsentMethod.BIOMETRIC]: 'BIOMETRIC',
      [ConsentMethod.WITNESS_MARK]: 'WITNESS_MARK',
      [ConsentMethod.IN_PERSON]: 'IN_PERSON',
    };

    const prismaMethod = mapping[method];
    if (!prismaMethod) {
      throw new Error(`Invalid ConsentMethod: ${method}`);
    }
    return prismaMethod;
  }

  /**
   * Map Prisma ConsentMethod string to Domain Enum
   */
  private static mapPrismaConsentMethodToDomain(method: string): ConsentMethod {
    const mapping: Record<string, ConsentMethod> = {
      SMS_OTP: ConsentMethod.SMS_OTP,
      EMAIL_LINK: ConsentMethod.EMAIL_LINK,
      DIGITAL_SIGNATURE: ConsentMethod.DIGITAL_SIGNATURE,
      WET_SIGNATURE: ConsentMethod.WET_SIGNATURE,
      BIOMETRIC: ConsentMethod.BIOMETRIC,
      WITNESS_MARK: ConsentMethod.WITNESS_MARK,
      IN_PERSON: ConsentMethod.IN_PERSON,
    };

    const domainMethod = mapping[method];
    if (!domainMethod) {
      throw new Error(`Invalid Prisma ConsentMethod: ${method}`);
    }
    return domainMethod;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Extract domain entity IDs from Prisma models
   */
  public static extractIds(prismaModels: PrismaFamilyConsent[]): string[] {
    return prismaModels.map((model) => model.id);
  }

  /**
   * Check if a consent is eligible for batch processing
   */
  public static isEligibleForBatch(prismaModel: PrismaFamilyConsent): boolean {
    if (!prismaModel.status) return false;

    const pendingStatuses = ['PENDING', 'EXPIRED'];
    return pendingStatuses.includes(prismaModel.status);
  }

  /**
   * Validate Prisma model before conversion
   */
  public static validatePrismaModel(prismaModel: PrismaFamilyConsent): string[] {
    const errors: string[] = [];

    if (!prismaModel.familyMemberId) {
      errors.push('familyMemberId is required');
    }

    if (!prismaModel.fullName) {
      errors.push('fullName is required');
    }

    if (!prismaModel.role) {
      errors.push('role is required');
    }

    if (!prismaModel.relationshipToDeceased) {
      errors.push('relationshipToDeceased is required');
    }

    if (!prismaModel.status) {
      errors.push('status is required');
    }

    // Validate role-specific requirements
    if (prismaModel.role === 'MINOR_CHILD' && !prismaModel.hasLegalRepresentative) {
      errors.push('MINOR_CHILD must have legal representative');
    }

    // Validate contact info based on status
    if (prismaModel.status === 'PENDING') {
      if (!prismaModel.phoneNumber && !prismaModel.email) {
        errors.push('PENDING consent must have at least one contact method');
      }
    }

    return errors;
  }

  /**
   * Create update data for specific status changes
   */
  public static createStatusUpdateData(domainEntity: FamilyConsent): Record<string, any> {
    const props = (domainEntity as any).props;

    const updateData: Record<string, any> = {
      status: this.mapDomainConsentStatusToPrisma(domainEntity.status),
    };

    // Add relevant fields based on status
    switch (domainEntity.status) {
      case ConsentStatus.GRANTED:
        updateData.method = props.method ? this.mapDomainConsentMethodToPrisma(props.method) : null;
        updateData.respondedAt = props.respondedAt || null;
        updateData.consentGivenAt = props.consentGivenAt || null;
        updateData.digitalSignatureId = props.digitalSignatureId || null;
        updateData.signatureMethod = props.signatureMethod
          ? this.mapDomainConsentMethodToPrisma(props.signatureMethod)
          : null;
        break;

      case ConsentStatus.DECLINED:
        updateData.respondedAt = props.respondedAt || null;
        updateData.declinedAt = props.declinedAt || null;
        updateData.declineReason = props.declineReason || null;
        updateData.declineCategory = props.declineCategory || null;
        break;

      case ConsentStatus.WITHDRAWN:
        updateData.withdrawnAt = props.withdrawnAt || null;
        updateData.withdrawalReason = props.withdrawalReason || null;
        break;

      case ConsentStatus.EXPIRED:
        // No additional fields needed
        break;
    }

    return updateData;
  }
}

// ==================== TYPE UTILITIES ====================

/**
 * Simplified types for common operations
 */
export interface FamilyConsentCreateData {
  familyMemberId: string;
  fullName: string;
  role: string;
  relationshipToDeceased: string;
  status: string;
  applicationId: string;
  nationalId?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
}

export interface FamilyConsentUpdateData {
  status?: string;
  method?: string | null;
  respondedAt?: Date | null;
  consentGivenAt?: Date | null;
  declinedAt?: Date | null;
  withdrawnAt?: Date | null;
  digitalSignatureId?: string | null;
  signatureMethod?: string | null;
  declineReason?: string | null;
  withdrawalReason?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
}
