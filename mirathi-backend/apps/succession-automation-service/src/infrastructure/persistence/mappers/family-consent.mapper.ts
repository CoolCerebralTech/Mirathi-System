// src/succession-automation/src/infrastructure/persistence/mappers/family-consent.mapper.ts
import {
  ConsentMethod,
  ConsentStatus,
  FamilyConsent,
  FamilyRole,
} from '../../../domain/entities/family-consent.entity';

/**
 * Interface representing the Raw Prisma Model Structure
 * Based on schema.prisma: model FamilyConsent
 */
export interface PrismaFamilyConsentModel {
  id: string;
  applicationId: string;
  familyMemberId: string;
  fullName: string;
  nationalId: string | null;
  phoneNumber: string | null;
  email: string | null;

  // Enums stored as strings
  role: string;
  status: string;
  method: string | null;
  relationshipToDeceased: string;

  // Request
  requestSentAt: Date | null;
  requestSentVia: string | null;
  requestExpiresAt: Date | null;

  // Response
  respondedAt: Date | null;
  consentGivenAt: Date | null;
  declinedAt: Date | null;
  withdrawnAt: Date | null;

  // Evidence
  digitalSignatureId: string | null;
  signatureMethod: string | null;
  verificationCode: string | null;
  ipAddress: string | null;
  deviceInfo: string | null;

  // Reasoning
  declineReason: string | null;
  declineCategory: string | null;
  withdrawalReason: string | null;

  // Legal Rep
  hasLegalRepresentative: boolean;
  legalRepresentativeName: string | null;
  legalRepresentativeContact: string | null;

  // Notes
  notes: string | null;
  internalNotes: string | null;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * FamilyConsent Mapper
 *
 * RESPONSIBILITY:
 * Translates between Domain Entity and Prisma Persistence Model.
 * Handles Enums, Optional fields, and Null/Undefined conversion.
 */
export class FamilyConsentMapper {
  /**
   * Map Domain Entity to Prisma Persistence Object (Create/Update Input)
   */
  public static toPersistence(domainEntity: FamilyConsent, applicationId?: string): any {
    // 1. Validate FK requirement for creation scenarios
    if (!applicationId && !domainEntity.id) {
      // logic for update vs create validation
    }

    // Access properties directly (Architecture Pattern: Props are protected, mapped via infrastructure)
    const props = (domainEntity as any).props;

    // 2. Construct Persistence Object
    return {
      id: domainEntity.id.toString(),
      ...(applicationId ? { applicationId } : {}),

      // --- Identity ---
      familyMemberId: domainEntity.familyMemberId,
      fullName: domainEntity.fullName,
      nationalId: props.nationalId || null,
      phoneNumber: props.phoneNumber || null,
      email: props.email || null,

      // --- Role & Relationship ---
      role: domainEntity.role, // Maps to Enum
      relationshipToDeceased: domainEntity.relationshipToDeceased,

      // --- Status & Method ---
      status: domainEntity.status, // Maps to Enum
      method: props.method || null, // Maps to Enum

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
      signatureMethod: props.signatureMethod || null,
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

      // Timestamps
      updatedAt: new Date(),
    };
  }

  /**
   * Map Prisma Model to Domain Entity for READ operations
   */
  public static toDomain(raw: PrismaFamilyConsentModel): FamilyConsent {
    if (!raw) {
      throw new Error('FamilyConsentMapper: Cannot map null persistence model to domain.');
    }

    // 1. Prepare Domain Props
    // We explicitly cast DB string values back to their Union types/Enums for strict domain typing
    const props = {
      // Identity
      familyMemberId: raw.familyMemberId,
      fullName: raw.fullName,
      nationalId: raw.nationalId || undefined,
      phoneNumber: raw.phoneNumber || undefined,
      email: raw.email || undefined,

      // Role
      role: raw.role as FamilyRole,
      relationshipToDeceased: raw.relationshipToDeceased,

      // Status
      status: raw.status as ConsentStatus,
      method: raw.method ? (raw.method as ConsentMethod) : undefined,

      // Request
      requestSentAt: raw.requestSentAt || undefined,
      requestSentVia: raw.requestSentVia || undefined,
      requestExpiresAt: raw.requestExpiresAt || undefined,

      // Response
      respondedAt: raw.respondedAt || undefined,
      consentGivenAt: raw.consentGivenAt || undefined,
      declinedAt: raw.declinedAt || undefined,
      withdrawnAt: raw.withdrawnAt || undefined,

      // Evidence
      digitalSignatureId: raw.digitalSignatureId || undefined,
      signatureMethod: raw.signatureMethod ? (raw.signatureMethod as ConsentMethod) : undefined,
      verificationCode: raw.verificationCode || undefined,
      ipAddress: raw.ipAddress || undefined,
      deviceInfo: raw.deviceInfo || undefined,

      // Reasons
      declineReason: raw.declineReason || undefined,
      declineCategory: raw.declineCategory as any, // Cast to union type defined in Entity
      withdrawalReason: raw.withdrawalReason || undefined,

      // Legal Rep
      hasLegalRepresentative: raw.hasLegalRepresentative,
      legalRepresentativeName: raw.legalRepresentativeName || undefined,
      legalRepresentativeContact: raw.legalRepresentativeContact || undefined,

      // Notes
      notes: raw.notes || undefined,
      internalNotes: raw.internalNotes || undefined,
    };

    // 2. Reconstitute
    return FamilyConsent.reconstitute(raw.id, props, raw.createdAt, raw.updatedAt);
  }

  /**
   * Map multiple Prisma models to Domain Entities
   */
  public static toDomainArray(models: PrismaFamilyConsentModel[]): FamilyConsent[] {
    return models.map((model) => this.toDomain(model));
  }
}
