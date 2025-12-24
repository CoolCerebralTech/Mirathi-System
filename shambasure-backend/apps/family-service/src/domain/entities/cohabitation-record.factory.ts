// src/family-service/src/domain/entities/cohabitation-record.factory.ts
import { UniqueEntityID } from '../base/unique-entity-id';
import { KenyanCounty } from '../value-objects/family-enums.vo';
import { CohabitationRecord, CohabitationRecordProps } from './cohabitation-record.entity';

/**
 * Cohabitation Record Factory
 *
 * Innovations:
 * 1. Smart evidence collection for S.29 qualification
 * 2. Automatic witness generation from community context
 * 3. Duration-based legal presumption calculation
 * 4. Template-based creation for common scenarios
 * 5. Legacy data transformation with evidence mapping
 */
export class CohabitationRecordFactory {
  /**
   * Create urban cohabitation (city context)
   */
  public static createUrbanCohabitation(
    familyId: UniqueEntityID,
    partner1Id: UniqueEntityID,
    partner2Id: UniqueEntityID,
    startDate: Date,
    residence: {
      address: string;
      county: KenyanCounty;
      isRented: boolean;
      landlordContact?: string;
    },
    createdBy: UniqueEntityID,
    options?: {
      relationshipType?: CohabitationRecordProps['relationshipType'];
      witnesses?: string[];
      hasJointBills?: boolean;
      neighbors?: string[];
    },
  ): CohabitationRecord {
    const props: CohabitationRecordProps = {
      familyId,
      partner1Id,
      partner2Id,
      relationshipType: options?.relationshipType || 'COME_WE_STAY',
      startDate,
      isActive: true,
      durationDays: 0, // Will be calculated
      qualifiesForS29: false,
      minimumPeriodMet: false,
      sharedResidence: residence.address,
      residenceCounty: residence.county,
      isSeparateHousehold: true,
      witnesses:
        options?.witnesses ||
        this.generateUrbanWitnesses(residence.isRented, residence.landlordContact),
      communityAcknowledged: !!options?.neighbors && options.neighbors.length >= 2,
      hasJointUtilities: options?.hasJointBills || false,
      childrenIds: [],
      hasChildren: false,
      childrenBornDuringCohabitation: false,
      jointFinancialAccounts: false,
      jointPropertyOwnership: false,
      financialSupportProvided: false,
      supportEvidence: [],
      knownAsCouple: true,
      familyAcknowledged: false, // Typically families are less involved in urban settings
      hasCourtRecognition: false,
      dependencyClaimFiled: false,
      relationshipStability: 'STABLE',
      separationAttempts: 0,
      reconciliationCount: 0,
      customaryElements: false,
      clanInvolved: false,
      elderMediation: false,
      hasDomesticViolenceReports: false,
      safetyPlanInPlace: false,
      marriagePlanned: false,
      childrenPlanned: false,
      createdBy,
      lastUpdatedBy: createdBy,
      verificationStatus: 'PENDING_VERIFICATION',
      isArchived: false,
    };

    return CohabitationRecord.create(props);
  }

  /**
   * Create rural cohabitation (village context)
   */
  public static createRuralCohabitation(
    familyId: UniqueEntityID,
    partner1Id: UniqueEntityID,
    partner2Id: UniqueEntityID,
    startDate: Date,
    residence: {
      homestead: string;
      county: KenyanCounty;
      clanLand: boolean;
      elderContact?: string;
    },
    createdBy: UniqueEntityID,
    options?: {
      hasCustomaryElements?: boolean;
      bridePriceDiscussed?: boolean;
      childrenIds?: UniqueEntityID[];
    },
  ): CohabitationRecord {
    const props: CohabitationRecordProps = {
      familyId,
      partner1Id,
      partner2Id,
      relationshipType: 'COME_WE_STAY',
      startDate,
      isActive: true,
      durationDays: 0,
      qualifiesForS29: false,
      minimumPeriodMet: false,
      sharedResidence: residence.homestead,
      residenceCounty: residence.county,
      isSeparateHousehold: !residence.clanLand, // If on clan land, may be part of larger household
      witnesses: this.generateRuralWitnesses(residence.elderContact),
      communityAcknowledged: true, // Rural communities are close-knit
      hasJointUtilities: true, // Typically share resources
      childrenIds: options?.childrenIds || [],
      hasChildren: !!(options?.childrenIds && options.childrenIds.length > 0),
      childrenBornDuringCohabitation: !!(options?.childrenIds && options.childrenIds.length > 0),
      jointFinancialAccounts: false,
      jointPropertyOwnership: residence.clanLand,
      financialSupportProvided: true,
      supportEvidence: ['SHARED_LIVELIHOOD', 'CLAN_SUPPORT'],
      knownAsCouple: true,
      familyAcknowledged: true, // Families are typically involved in rural settings
      hasCourtRecognition: false,
      dependencyClaimFiled: false,
      relationshipStability: 'STABLE',
      separationAttempts: 0,
      reconciliationCount: 0,
      customaryElements: options?.hasCustomaryElements || false,
      clanInvolved: residence.clanLand,
      elderMediation: !!residence.elderContact,
      hasDomesticViolenceReports: false,
      safetyPlanInPlace: false,
      marriagePlanned: options?.bridePriceDiscussed || false,
      childrenPlanned: true, // Typically expected in rural settings
      createdBy,
      lastUpdatedBy: createdBy,
      verificationStatus: 'PENDING_VERIFICATION',
      isArchived: false,
    };

    return CohabitationRecord.create(props);
  }

  /**
   * Create cohabitation with children
   */
  public static createCohabitationWithChildren(
    familyId: UniqueEntityID,
    partner1Id: UniqueEntityID,
    partner2Id: UniqueEntityID,
    startDate: Date,
    childrenIds: UniqueEntityID[],
    createdBy: UniqueEntityID,
    options?: {
      residence?: string;
      county?: KenyanCounty;
      birthCertificates?: string[];
    },
  ): CohabitationRecord {
    const props: CohabitationRecordProps = {
      familyId,
      partner1Id,
      partner2Id,
      relationshipType: 'LONG_TERM_PARTNERSHIP',
      startDate,
      isActive: true,
      durationDays: 0,
      qualifiesForS29: false,
      minimumPeriodMet: false,
      sharedResidence: options?.residence || 'Family Home',
      residenceCounty: options?.county || KenyanCounty.NAIROBI,
      isSeparateHousehold: true,
      witnesses: ['Family Member 1', 'Family Member 2', 'Neighbor'],
      communityAcknowledged: true,
      hasJointUtilities: true,
      childrenIds,
      hasChildren: true,
      childrenBornDuringCohabitation: true,
      jointFinancialAccounts: true, // More likely with children
      jointPropertyOwnership: false,
      financialSupportProvided: true,
      supportEvidence: options?.birthCertificates || ['CHILD_BIRTH_RECORDS'],
      knownAsCouple: true,
      familyAcknowledged: true,
      hasCourtRecognition: false,
      dependencyClaimFiled: false,
      relationshipStability: 'STABLE',
      separationAttempts: 0,
      reconciliationCount: 0,
      customaryElements: false,
      clanInvolved: false,
      elderMediation: false,
      hasDomesticViolenceReports: false,
      safetyPlanInPlace: false,
      marriagePlanned: false,
      childrenPlanned: false,
      createdBy,
      lastUpdatedBy: createdBy,
      verificationStatus: 'PENDING_VERIFICATION',
      isArchived: false,
    };

    return CohabitationRecord.create(props);
  }

  /**
   * Create cohabitation from marriage breakdown
   */
  public static createPostMarriageCohabitation(
    familyId: UniqueEntityID,
    partner1Id: UniqueEntityID,
    partner2Id: UniqueEntityID,
    startDate: Date,
    previousMarriageDetails: {
      marriageEndDate: Date;
      divorceDecreeId?: string;
      separationReason: string;
    },
    createdBy: UniqueEntityID,
  ): CohabitationRecord {
    const props: CohabitationRecordProps = {
      familyId,
      partner1Id,
      partner2Id,
      relationshipType: 'LONG_TERM_PARTNERSHIP',
      startDate,
      isActive: true,
      durationDays: 0,
      qualifiesForS29: false,
      minimumPeriodMet: false,
      sharedResidence: 'Shared Residence',
      residenceCounty: KenyanCounty.NAIROBI,
      isSeparateHousehold: true,
      witnesses: ['Previous Marriage Witness', 'Family Counselor'],
      communityAcknowledged: false, // May be stigmatized
      hasJointUtilities: false,
      childrenIds: [],
      hasChildren: false,
      childrenBornDuringCohabitation: false,
      jointFinancialAccounts: false,
      jointPropertyOwnership: false,
      financialSupportProvided: false,
      supportEvidence: previousMarriageDetails.divorceDecreeId
        ? [`DIVORCE_DECREE_${previousMarriageDetails.divorceDecreeId}`]
        : [],
      knownAsCouple: true,
      familyAcknowledged: false, // Families may disapprove
      hasCourtRecognition: false,
      dependencyClaimFiled: false,
      relationshipStability: 'VOLATILE',
      separationAttempts: 1, // Already separated from previous marriage
      reconciliationCount: 0,
      customaryElements: false,
      clanInvolved: false,
      elderMediation: false,
      hasDomesticViolenceReports: false,
      safetyPlanInPlace: false,
      marriagePlanned: false,
      childrenPlanned: false,
      createdBy,
      lastUpdatedBy: createdBy,
      verificationStatus: 'UNVERIFIED',
      isArchived: false,
    };

    return CohabitationRecord.create(props);
  }

  /**
   * Create cohabitation from legacy data
   */
  public static createFromLegacyData(
    legacyData: Record<string, any>,
    createdBy: UniqueEntityID,
  ): CohabitationRecord {
    const props: CohabitationRecordProps = {
      familyId: new UniqueEntityID(legacyData.family_id),
      partner1Id: new UniqueEntityID(legacyData.partner1_id),
      partner2Id: new UniqueEntityID(legacyData.partner2_id),
      relationshipType: this.mapLegacyRelationshipType(legacyData.relationship_type),
      startDate: new Date(legacyData.start_date),
      endDate: legacyData.end_date ? new Date(legacyData.end_date) : undefined,
      isActive: legacyData.is_active !== false,
      durationDays: legacyData.duration_days || 0,
      qualifiesForS29: legacyData.qualifies_for_s29 === true,
      minimumPeriodMet: legacyData.minimum_period_met === true,
      sharedResidence: legacyData.shared_residence || 'Unknown',
      residenceCounty: legacyData.residence_county as KenyanCounty,
      isSeparateHousehold: legacyData.separate_household !== false,
      affidavitId: legacyData.affidavit_id,
      witnesses: legacyData.witnesses || [],
      communityAcknowledged: legacyData.community_acknowledged === true,
      hasJointUtilities: legacyData.has_joint_utilities === true,
      childrenIds: (legacyData.children_ids || []).map((id: string) => new UniqueEntityID(id)),
      hasChildren: legacyData.has_children === true,
      childrenBornDuringCohabitation: legacyData.children_born_during === true,
      jointFinancialAccounts: legacyData.joint_financial_accounts === true,
      jointPropertyOwnership: legacyData.joint_property_ownership === true,
      financialSupportProvided: legacyData.financial_support_provided === true,
      supportEvidence: legacyData.support_evidence || [],
      knownAsCouple: legacyData.known_as_couple !== false,
      socialMediaEvidence: legacyData.social_media_evidence,
      familyAcknowledged: legacyData.family_acknowledged === true,
      hasCourtRecognition: legacyData.has_court_recognition === true,
      courtCaseNumber: legacyData.court_case_number,
      courtOrderId: legacyData.court_order_id,
      dependencyClaimFiled: legacyData.dependency_claim_filed === true,
      dependencyClaimId: legacyData.dependency_claim_id,
      dependencyClaimStatus: legacyData.dependency_claim_status,
      relationshipStability: this.mapLegacyStability(legacyData.relationship_stability),
      separationAttempts: legacyData.separation_attempts || 0,
      reconciliationCount: legacyData.reconciliation_count || 0,
      customaryElements: legacyData.customary_elements === true,
      clanInvolved: legacyData.clan_involved === true,
      elderMediation: legacyData.elder_mediation === true,
      hasDomesticViolenceReports: legacyData.has_domestic_violence_reports === true,
      safetyPlanInPlace: legacyData.safety_plan_in_place === true,
      marriagePlanned: legacyData.marriage_planned === true,
      plannedMarriageDate: legacyData.planned_marriage_date
        ? new Date(legacyData.planned_marriage_date)
        : undefined,
      childrenPlanned: legacyData.children_planned === true,
      createdBy,
      lastUpdatedBy: createdBy,
      verificationStatus: this.mapLegacyVerification(legacyData.verification_status),
      verificationNotes: legacyData.verification_notes,
      lastVerifiedAt: legacyData.last_verified_at
        ? new Date(legacyData.last_verified_at)
        : undefined,
      isArchived: legacyData.archived === true,
    };

    return CohabitationRecord.create(props);
  }

  /**
   * Generate template for quick cohabitation creation
   */
  public static createTemplate(
    templateType: 'URBAN' | 'RURAL' | 'WITH_CHILDREN' | 'POST_MARRIAGE',
    familyId: UniqueEntityID,
    partner1Id: UniqueEntityID,
    partner2Id: UniqueEntityID,
    createdBy: UniqueEntityID,
  ): Partial<CohabitationRecordProps> {
    const baseTemplate: Partial<CohabitationRecordProps> = {
      familyId,
      partner1Id,
      partner2Id,
      relationshipType: 'COME_WE_STAY',
      startDate: new Date(),
      isActive: true,
      durationDays: 0,
      qualifiesForS29: false,
      minimumPeriodMet: false,
      isSeparateHousehold: true,
      witnesses: ['Witness 1', 'Witness 2'],
      communityAcknowledged: false,
      hasJointUtilities: false,
      childrenIds: [],
      hasChildren: false,
      childrenBornDuringCohabitation: false,
      jointFinancialAccounts: false,
      jointPropertyOwnership: false,
      financialSupportProvided: false,
      supportEvidence: [],
      knownAsCouple: true,
      familyAcknowledged: false,
      hasCourtRecognition: false,
      dependencyClaimFiled: false,
      relationshipStability: 'STABLE',
      separationAttempts: 0,
      reconciliationCount: 0,
      customaryElements: false,
      clanInvolved: false,
      elderMediation: false,
      hasDomesticViolenceReports: false,
      safetyPlanInPlace: false,
      marriagePlanned: false,
      childrenPlanned: false,
      createdBy,
      lastUpdatedBy: createdBy,
      verificationStatus: 'UNVERIFIED',
      isArchived: false,
    };

    switch (templateType) {
      case 'URBAN':
        return {
          ...baseTemplate,
          sharedResidence: 'Apartment in Nairobi',
          residenceCounty: KenyanCounty.NAIROBI,
          hasJointUtilities: true,
          witnesses: ['Neighbor', 'Landlord', 'Friend'],
          communityAcknowledged: true,
        };

      case 'RURAL':
        return {
          ...baseTemplate,
          sharedResidence: 'Family Homestead',
          residenceCounty: KenyanCounty.KISII,
          communityAcknowledged: true,
          familyAcknowledged: true,
          customaryElements: true,
          clanInvolved: true,
          elderMediation: true,
          financialSupportProvided: true,
        };

      case 'WITH_CHILDREN':
        return {
          ...baseTemplate,
          relationshipType: 'LONG_TERM_PARTNERSHIP',
          hasChildren: true,
          childrenBornDuringCohabitation: true,
          jointFinancialAccounts: true,
          financialSupportProvided: true,
          familyAcknowledged: true,
          communityAcknowledged: true,
          supportEvidence: ['Birth Certificates'],
        };

      case 'POST_MARRIAGE':
        return {
          ...baseTemplate,
          relationshipType: 'LONG_TERM_PARTNERSHIP',
          relationshipStability: 'VOLATILE',
          separationAttempts: 1,
          communityAcknowledged: false,
          familyAcknowledged: false,
          supportEvidence: ['Divorce Decree'],
        };

      default:
        return baseTemplate;
    }
  }

  // Helper Methods
  private static generateUrbanWitnesses(isRented: boolean, landlordContact?: string): string[] {
    const witnesses = ['Neighbor 1', 'Neighbor 2'];

    if (isRented && landlordContact) {
      witnesses.push(`Landlord: ${landlordContact}`);
    }

    witnesses.push('Local Shopkeeper');

    return witnesses;
  }

  private static generateRuralWitnesses(elderContact?: string): string[] {
    const witnesses = ['Village Elder', 'Neighbor Farmer'];

    if (elderContact) {
      witnesses.push(`Clan Elder: ${elderContact}`);
    }

    witnesses.push("Local Chief's Representative");

    return witnesses;
  }

  private static mapLegacyRelationshipType(
    legacyType: string,
  ): CohabitationRecordProps['relationshipType'] {
    const mapping: Record<string, CohabitationRecordProps['relationshipType']> = {
      COME_WE_STAY: 'COME_WE_STAY',
      LONG_TERM: 'LONG_TERM_PARTNERSHIP',
      DATING: 'DATING',
      ENGAGED: 'ENGAGED',
      PARTNERSHIP: 'LONG_TERM_PARTNERSHIP',
      COHABITATION: 'COME_WE_STAY',
    };

    return mapping[legacyType?.toUpperCase()] || 'COME_WE_STAY';
  }

  private static mapLegacyStability(
    legacyStability: string,
  ): CohabitationRecordProps['relationshipStability'] {
    const mapping: Record<string, CohabitationRecordProps['relationshipStability']> = {
      STABLE: 'STABLE',
      VOLATILE: 'VOLATILE',
      ON_OFF: 'ON_OFF',
      UNKNOWN: 'UNKNOWN',
      GOOD: 'STABLE',
      BAD: 'VOLATILE',
    };

    return mapping[legacyStability?.toUpperCase()] || 'UNKNOWN';
  }

  private static mapLegacyVerification(
    legacyStatus: any,
  ): CohabitationRecordProps['verificationStatus'] {
    const mapping: Record<string, CohabitationRecordProps['verificationStatus']> = {
      VERIFIED: 'VERIFIED',
      PENDING: 'PENDING_VERIFICATION',
      REJECTED: 'DISPUTED', // Map REJECTED to DISPUTED
      DISPUTED: 'DISPUTED',
      YES: 'VERIFIED',
      NO: 'UNVERIFIED', // Map NO to UNVERIFIED
      '1': 'VERIFIED',
      '0': 'UNVERIFIED',
    };

    return mapping[legacyStatus?.toString().toUpperCase()] || 'UNVERIFIED';
  }
}
