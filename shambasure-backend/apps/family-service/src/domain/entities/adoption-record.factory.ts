// src/family-service/src/domain/entities/adoption-record.factory.ts
import { UniqueEntityID } from '../base/unique-entity-id';
import { KenyanLawSection } from '../value-objects/family-enums.vo';
import { AdoptionRecord, AdoptionRecordProps } from './adoption-record.entity';

/**
 * Adoption Record Factory
 *
 * Innovations:
 * 1. Type-specific adoption record creation with all required fields
 * 2. Automatic legal basis assignment based on adoption type
 * 3. Smart default values for different adoption scenarios
 * 4. Court and social worker integration templates
 * 5. Legacy adoption data transformation
 */
export class AdoptionRecordFactory {
  /**
   * Create statutory adoption (Children's Court)
   */
  public static createStatutoryAdoption(
    familyId: UniqueEntityID,
    adopteeId: UniqueEntityID,
    adoptiveParentId: UniqueEntityID,
    applicationDate: Date,
    courtStation: string,
    createdBy: UniqueEntityID,
    options?: {
      biologicalMotherId?: UniqueEntityID;
      biologicalFatherId?: UniqueEntityID;
      socialWorkerId?: string;
      childAgeAtAdoption?: number;
      childSpecialNeeds?: boolean;
    },
  ): AdoptionRecord {
    const props: AdoptionRecordProps = {
      familyId,
      adopteeId,
      adoptiveParentId,
      adoptionType: 'STATUTORY',
      adoptionStatus: 'PENDING',
      applicationDate,
      courtStation,
      legalBasis: [
        KenyanLawSection.S71_COURT_GUARDIAN, // Court-appointed guardian (for Children's Act reference)
        KenyanLawSection.S73_GUARDIAN_ACCOUNTS, // Guardian accounts and reporting
      ],
      parentalConsentStatus: {
        mother: options?.biologicalMotherId ? 'UNKNOWN' : 'DECEASED',
        father: options?.biologicalFatherId ? 'UNKNOWN' : 'DECEASED',
      },
      consentDocuments: [],
      clanInvolved: false,
      clanElders: [],
      customaryRitesPerformed: [],
      hagueConventionCompliant: true,
      adoptionExpenses: 0,
      governmentFeesPaid: false,
      legalFeesPaid: false,
      subsidyReceived: false,
      childAgeAtAdoption: options?.childAgeAtAdoption || 0,
      childSpecialNeeds: options?.childSpecialNeeds || false,
      medicalHistoryProvided: false,
      siblingGroupAdoption: false,
      siblingAdoptionRecordIds: [],
      previousCareArrangement: 'ORPHANAGE',
      timeInPreviousCareMonths: 0,
      openAdoption: false,
      inheritanceRightsEstablished: false,
      newBirthCertificateIssued: false,
      passportIssued: false,
      appealFiled: false,
      challengePeriodExpired: false,
      postAdoptionMonitoring: true,
      monitoringPeriodMonths: 12,
      verificationStatus: 'UNVERIFIED',
      createdBy,
      lastUpdatedBy: createdBy,
      isArchived: false,
    };

    // Set biological parents if provided
    if (options?.biologicalMotherId) {
      props.biologicalMotherId = options.biologicalMotherId;
    }

    if (options?.biologicalFatherId) {
      props.biologicalFatherId = options.biologicalFatherId;
    }

    // Set social worker if provided
    if (options?.socialWorkerId) {
      props.socialWorkerId = options.socialWorkerId;
    }

    return AdoptionRecord.create(props);
  }

  /**
   * Create customary adoption (clan-based)
   */
  public static createCustomaryAdoption(
    familyId: UniqueEntityID,
    adopteeId: UniqueEntityID,
    adoptiveParentId: UniqueEntityID,
    adoptionDate: Date,
    clanDetails: {
      clanElders: string[];
      customaryRites: string[];
      location: string;
      bridePriceConsideration?: boolean;
    },
    createdBy: UniqueEntityID,
    options?: {
      biologicalParents?: {
        motherId?: UniqueEntityID;
        fatherId?: UniqueEntityID;
      };
      inheritanceEstablished?: boolean;
    },
  ): AdoptionRecord {
    const props: AdoptionRecordProps = {
      familyId,
      adopteeId,
      adoptiveParentId,
      adoptionType: 'CUSTOMARY',
      adoptionStatus: 'FINALIZED', // Customary adoptions are often considered final upon ceremony
      applicationDate: adoptionDate,
      finalizationDate: adoptionDate,
      effectiveDate: adoptionDate,
      courtStation: 'CLAN_COUNCIL',
      legalBasis: [
        KenyanLawSection.S70_TESTAMENTARY_GUARDIAN, // Customary guardianship can be testamentary
      ],
      parentalConsentStatus: {
        mother: options?.biologicalParents?.motherId ? 'CONSENTED' : 'DECEASED',
        father: options?.biologicalParents?.fatherId ? 'CONSENTED' : 'DECEASED',
      },
      consentDocuments: ['CLAN_AGREEMENT_DOCUMENT'],
      clanInvolved: true,
      clanElders: clanDetails.clanElders,
      customaryRitesPerformed: clanDetails.customaryRites,
      bridePriceConsideration: clanDetails.bridePriceConsideration,
      hagueConventionCompliant: false,
      adoptionExpenses: clanDetails.bridePriceConsideration ? 50000 : 0,
      governmentFeesPaid: false,
      legalFeesPaid: false,
      subsidyReceived: false,
      childAgeAtAdoption: 0, // Would need actual age
      childSpecialNeeds: false,
      medicalHistoryProvided: false,
      siblingGroupAdoption: false,
      siblingAdoptionRecordIds: [],
      previousCareArrangement: 'RELATIVE_CARE',
      timeInPreviousCareMonths: 0,
      openAdoption: true, // Customary often maintains biological family ties
      inheritanceRightsEstablished: options?.inheritanceEstablished || false,
      newBirthCertificateIssued: false,
      passportIssued: false,
      appealFiled: false,
      challengePeriodExpired: true,
      postAdoptionMonitoring: false,
      monitoringPeriodMonths: 0,
      verificationStatus: 'PENDING_VERIFICATION',
      createdBy,
      lastUpdatedBy: createdBy,
      isArchived: false,
    };

    // Set biological parents if provided
    if (options?.biologicalParents?.motherId) {
      props.biologicalMotherId = options.biologicalParents.motherId;
    }

    if (options?.biologicalParents?.fatherId) {
      props.biologicalFatherId = options.biologicalParents.fatherId;
    }

    return AdoptionRecord.create(props);
  }

  /**
   * Create kinship adoption (relative adoption)
   */
  public static createKinshipAdoption(
    familyId: UniqueEntityID,
    adopteeId: UniqueEntityID,
    adoptiveParentId: UniqueEntityID,
    applicationDate: Date,
    relationship: 'GRANDPARENT' | 'AUNT_UNCLE' | 'SIBLING' | 'COUSIN' | 'OTHER_RELATIVE',
    createdBy: UniqueEntityID,
    options?: {
      courtOrderNumber?: string;
      socialWorkerReportId?: string;
      childAge?: number;
    },
  ): AdoptionRecord {
    const props: AdoptionRecordProps = {
      familyId,
      adopteeId,
      adoptiveParentId,
      adoptionType: 'KINSHIP',
      adoptionStatus: options?.courtOrderNumber ? 'FINALIZED' : 'PENDING',
      applicationDate,
      courtStation: "CHILDREN'S COURT",
      legalBasis: [
        KenyanLawSection.S71_COURT_GUARDIAN, // Court-appointed guardian
      ],
      parentalConsentStatus: {
        mother: 'DECEASED', // Typically for orphaned children
        father: 'DECEASED',
      },
      consentDocuments: [],
      clanInvolved: false,
      clanElders: [],
      customaryRitesPerformed: [],
      hagueConventionCompliant: true,
      adoptionExpenses: 0,
      governmentFeesPaid: false,
      legalFeesPaid: false,
      subsidyReceived: false,
      childAgeAtAdoption: options?.childAge || 0,
      childSpecialNeeds: false,
      medicalHistoryProvided: true, // Usually known in kinship cases
      siblingGroupAdoption: false,
      siblingAdoptionRecordIds: [],
      previousCareArrangement: 'RELATIVE_CARE',
      timeInPreviousCareMonths: 3, // Typically short period with relative
      openAdoption: true,
      inheritanceRightsEstablished: false,
      newBirthCertificateIssued: false,
      passportIssued: false,
      appealFiled: false,
      challengePeriodExpired: options?.courtOrderNumber ? true : false,
      postAdoptionMonitoring: false,
      monitoringPeriodMonths: 0,
      verificationStatus: 'UNVERIFIED',
      createdBy,
      lastUpdatedBy: createdBy,
      isArchived: false,
    };

    // Set court order if provided
    if (options?.courtOrderNumber) {
      props.courtOrderNumber = options.courtOrderNumber;
      props.finalizationDate = applicationDate;
      props.effectiveDate = applicationDate;
    }

    // Set social worker report if provided
    if (options?.socialWorkerReportId) {
      props.socialWorkerReportId = options.socialWorkerReportId;
    }

    return AdoptionRecord.create(props);
  }

  /**
   * Create step-parent adoption
   */
  public static createStepParentAdoption(
    familyId: UniqueEntityID,
    adopteeId: UniqueEntityID,
    adoptiveParentId: UniqueEntityID, // The step-parent
    biologicalParentId: UniqueEntityID, // The parent married to step-parent
    applicationDate: Date,
    marriageDate: Date,
    createdBy: UniqueEntityID,
    options?: {
      otherBiologicalParent?: {
        id: UniqueEntityID;
        consentStatus: 'CONSENTED' | 'WITHHELD' | 'DECEASED';
      };
      courtOrderNumber?: string;
    },
  ): AdoptionRecord {
    const props: AdoptionRecordProps = {
      familyId,
      adopteeId,
      adoptiveParentId,
      adoptionType: 'STEP_PARENT',
      adoptionStatus: options?.courtOrderNumber ? 'FINALIZED' : 'PENDING',
      applicationDate,
      courtStation: "CHILDREN'S COURT",
      legalBasis: [
        KenyanLawSection.S71_COURT_GUARDIAN, // Court appointment
      ],
      parentalConsentStatus: {
        mother: biologicalParentId ? 'CONSENTED' : 'CONSENTED', // Assuming consent from married parent
        father: options?.otherBiologicalParent?.consentStatus || 'UNKNOWN',
      },
      consentDocuments: ['MARRIAGE_CERTIFICATE', 'PARENTAL_CONSENT_AFFIDAVIT'],
      clanInvolved: false,
      clanElders: [],
      customaryRitesPerformed: [],
      hagueConventionCompliant: true,
      adoptionExpenses: 0,
      governmentFeesPaid: false,
      legalFeesPaid: false,
      subsidyReceived: false,
      childAgeAtAdoption: 0, // Would need actual age
      childSpecialNeeds: false,
      medicalHistoryProvided: true,
      siblingGroupAdoption: false,
      siblingAdoptionRecordIds: [],
      previousCareArrangement: 'RELATIVE_CARE',
      timeInPreviousCareMonths: 0,
      openAdoption: false,
      inheritanceRightsEstablished: true, // Step-parent typically inherits
      newBirthCertificateIssued: false,
      passportIssued: false,
      appealFiled: false,
      challengePeriodExpired: options?.courtOrderNumber ? true : false,
      postAdoptionMonitoring: false,
      monitoringPeriodMonths: 0,
      verificationStatus: 'UNVERIFIED',
      createdBy,
      lastUpdatedBy: createdBy,
      isArchived: false,
    };

    // Set biological parents
    props.biologicalMotherId = biologicalParentId; // Assuming mother for example

    if (options?.otherBiologicalParent) {
      props.biologicalFatherId = options.otherBiologicalParent.id;
    }

    // Set court order if provided
    if (options?.courtOrderNumber) {
      props.courtOrderNumber = options.courtOrderNumber;
      props.finalizationDate = applicationDate;
      props.effectiveDate = applicationDate;
    }

    return AdoptionRecord.create(props);
  }

  /**
   * Create international adoption
   */
  public static createInternationalAdoption(
    familyId: UniqueEntityID,
    adopteeId: UniqueEntityID,
    adoptiveParentId: UniqueEntityID,
    applicationDate: Date,
    countries: {
      sending: string;
      receiving: string;
    },
    createdBy: UniqueEntityID,
    options?: {
      adoptionAgencyId?: string;
      hagueCompliant?: boolean;
      immigrationDocumentId?: string;
    },
  ): AdoptionRecord {
    const props: AdoptionRecordProps = {
      familyId,
      adopteeId,
      adoptiveParentId,
      adoptionType: 'INTERNATIONAL',
      adoptionStatus: 'PENDING',
      applicationDate,
      courtStation: 'HIGH_COURT', // International adoptions often go to higher courts
      legalBasis: [
        KenyanLawSection.S71_COURT_GUARDIAN, // Court supervision
      ],
      parentalConsentStatus: {
        mother: 'DECEASED', // Typically orphans or abandoned children
        father: 'DECEASED',
      },
      consentDocuments: ['INTERNATIONAL_ADOPTION_AGREEMENT'],
      clanInvolved: false,
      clanElders: [],
      customaryRitesPerformed: [],
      receivingCountry: countries.receiving,
      sendingCountry: countries.sending,
      hagueConventionCompliant: options?.hagueCompliant || true,
      immigrationDocumentId: options?.immigrationDocumentId,
      adoptionExpenses: 500000, // International adoptions are expensive
      governmentFeesPaid: false,
      legalFeesPaid: false,
      subsidyReceived: false,
      childAgeAtAdoption: 0,
      childSpecialNeeds: false,
      medicalHistoryProvided: true,
      siblingGroupAdoption: false,
      siblingAdoptionRecordIds: [],
      previousCareArrangement: 'ORPHANAGE',
      timeInPreviousCareMonths: 24, // Typically longer in institutions
      openAdoption: false,
      inheritanceRightsEstablished: false,
      newBirthCertificateIssued: false,
      passportIssued: false,
      appealFiled: false,
      challengePeriodExpired: false,
      postAdoptionMonitoring: true,
      monitoringPeriodMonths: 24, // Longer monitoring for international
      verificationStatus: 'PENDING_VERIFICATION',
      createdBy,
      lastUpdatedBy: createdBy,
      isArchived: false,
    };

    // Set adoption agency if provided
    if (options?.adoptionAgencyId) {
      props.adoptionAgencyId = options.adoptionAgencyId;
    }

    return AdoptionRecord.create(props);
  }

  /**
   * Create adoption from legacy data
   */
  public static createFromLegacyData(
    legacyData: Record<string, any>,
    createdBy: UniqueEntityID,
  ): AdoptionRecord {
    const props: AdoptionRecordProps = {
      familyId: new UniqueEntityID(legacyData.family_id),
      adopteeId: new UniqueEntityID(legacyData.adoptee_id),
      adoptiveParentId: new UniqueEntityID(legacyData.adoptive_parent_id),
      adoptionType: this.mapLegacyAdoptionType(legacyData.adoption_type),
      adoptionStatus: this.mapLegacyAdoptionStatus(legacyData.status),
      applicationDate: new Date(legacyData.application_date),
      hearingDate: legacyData.hearing_date ? new Date(legacyData.hearing_date) : undefined,
      finalizationDate: legacyData.finalization_date
        ? new Date(legacyData.finalization_date)
        : undefined,
      effectiveDate: legacyData.effective_date ? new Date(legacyData.effective_date) : undefined,
      legalBasis: legacyData.legal_basis || [KenyanLawSection.S71_COURT_GUARDIAN],
      courtOrderNumber: legacyData.court_order_number,
      courtStation: legacyData.court_station || "CHILDREN'S COURT",
      presidingJudge: legacyData.presiding_judge,
      biologicalMotherId: legacyData.biological_mother_id
        ? new UniqueEntityID(legacyData.biological_mother_id)
        : undefined,
      biologicalFatherId: legacyData.biological_father_id
        ? new UniqueEntityID(legacyData.biological_father_id)
        : undefined,
      parentalConsentStatus: {
        mother: this.mapLegacyConsentStatus(legacyData.mother_consent),
        father: this.mapLegacyConsentStatus(legacyData.father_consent),
      },
      consentDocuments: legacyData.consent_documents || [],
      socialWorkerId: legacyData.social_worker_id,
      socialWorkerReportId: legacyData.social_worker_report_id,
      homeStudyReportId: legacyData.home_study_report_id,
      postAdoptionMonitoring: legacyData.post_adoption_monitoring === true,
      monitoringPeriodMonths: legacyData.monitoring_period_months || 0,
      adoptionAgencyId: legacyData.adoption_agency_id,
      agencySocialWorker: legacyData.agency_social_worker,
      agencyApprovalNumber: legacyData.agency_approval_number,
      receivingCountry: legacyData.receiving_country,
      sendingCountry: legacyData.sending_country,
      hagueConventionCompliant: legacyData.hague_compliant === true,
      immigrationDocumentId: legacyData.immigration_document_id,
      clanInvolved: legacyData.clan_involved === true,
      clanElders: legacyData.clan_elders || [],
      customaryRitesPerformed: legacyData.customary_rites || [],
      bridePriceConsideration: legacyData.bride_price_considered === true,
      adoptionExpenses: legacyData.adoption_expenses || 0,
      governmentFeesPaid: legacyData.government_fees_paid === true,
      legalFeesPaid: legacyData.legal_fees_paid === true,
      subsidyReceived: legacyData.subsidy_received === true,
      subsidyAmount: legacyData.subsidy_amount,
      childAgeAtAdoption: legacyData.child_age_at_adoption || 0,
      childSpecialNeeds: legacyData.child_special_needs === true,
      specialNeedsDescription: legacyData.special_needs_description,
      medicalHistoryProvided: legacyData.medical_history_provided === true,
      siblingGroupAdoption: legacyData.sibling_group_adoption === true,
      siblingAdoptionRecordIds: (legacyData.sibling_adoption_record_ids || []).map(
        (id: string) => new UniqueEntityID(id),
      ),
      previousCareArrangement: legacyData.previous_care_arrangement || 'ORPHANAGE',
      timeInPreviousCareMonths: legacyData.time_in_previous_care_months || 0,
      openAdoption: legacyData.open_adoption === true,
      contactAgreement: legacyData.contact_agreement,
      visitationSchedule: legacyData.visitation_schedule,
      inheritanceRightsEstablished: legacyData.inheritance_rights_established === true,
      inheritanceDocumentId: legacyData.inheritance_document_id,
      newBirthCertificateIssued: legacyData.new_birth_certificate_issued === true,
      newBirthCertificateNumber: legacyData.new_birth_certificate_number,
      passportIssued: legacyData.passport_issued === true,
      passportNumber: legacyData.passport_number,
      appealFiled: legacyData.appeal_filed === true,
      appealCaseNumber: legacyData.appeal_case_number,
      challengePeriodExpired: legacyData.challenge_period_expired === true,
      verificationStatus: this.mapLegacyVerification(legacyData.verification_status),
      verificationNotes: legacyData.verification_notes,
      verifiedBy: legacyData.verified_by ? new UniqueEntityID(legacyData.verified_by) : undefined,
      lastVerifiedAt: legacyData.last_verified_at
        ? new Date(legacyData.last_verified_at)
        : undefined,
      createdBy,
      lastUpdatedBy: createdBy,
      isArchived: legacyData.archived === true,
    };

    return AdoptionRecord.create(props);
  }

  /**
   * Generate template for quick adoption creation
   */
  public static createTemplate(
    templateType: 'STATUTORY' | 'CUSTOMARY' | 'KINSHIP' | 'STEP_PARENT' | 'INTERNATIONAL',
    familyId: UniqueEntityID,
    adopteeId: UniqueEntityID,
    adoptiveParentId: UniqueEntityID,
    createdBy: UniqueEntityID,
  ): Partial<AdoptionRecordProps> {
    const baseTemplate: Partial<AdoptionRecordProps> = {
      familyId,
      adopteeId,
      adoptiveParentId,
      applicationDate: new Date(),
      adoptionStatus: 'PENDING',
      parentalConsentStatus: {
        mother: 'UNKNOWN',
        father: 'UNKNOWN',
      },
      consentDocuments: [],
      clanInvolved: false,
      clanElders: [],
      customaryRitesPerformed: [],
      hagueConventionCompliant: true,
      adoptionExpenses: 0,
      governmentFeesPaid: false,
      legalFeesPaid: false,
      subsidyReceived: false,
      childAgeAtAdoption: 0,
      childSpecialNeeds: false,
      medicalHistoryProvided: false,
      siblingGroupAdoption: false,
      siblingAdoptionRecordIds: [],
      previousCareArrangement: 'ORPHANAGE',
      timeInPreviousCareMonths: 0,
      openAdoption: false,
      inheritanceRightsEstablished: false,
      newBirthCertificateIssued: false,
      passportIssued: false,
      appealFiled: false,
      challengePeriodExpired: false,
      postAdoptionMonitoring: false,
      monitoringPeriodMonths: 0,
      verificationStatus: 'UNVERIFIED',
      createdBy,
      lastUpdatedBy: createdBy,
      isArchived: false,
    };

    switch (templateType) {
      case 'STATUTORY':
        return {
          ...baseTemplate,
          adoptionType: 'STATUTORY',
          courtStation: "CHILDREN'S COURT",
          legalBasis: [KenyanLawSection.S71_COURT_GUARDIAN, KenyanLawSection.S73_GUARDIAN_ACCOUNTS],
          postAdoptionMonitoring: true,
          monitoringPeriodMonths: 12,
        };

      case 'CUSTOMARY':
        return {
          ...baseTemplate,
          adoptionType: 'CUSTOMARY',
          courtStation: 'CLAN_COUNCIL',
          legalBasis: [KenyanLawSection.S70_TESTAMENTARY_GUARDIAN],
          clanInvolved: true,
          clanElders: ['Clan Elder 1', 'Clan Elder 2'],
          customaryRitesPerformed: ['Introduction Rite', 'Blessing Ceremony'],
          openAdoption: true,
          postAdoptionMonitoring: false,
        };

      case 'KINSHIP':
        return {
          ...baseTemplate,
          adoptionType: 'KINSHIP',
          courtStation: "CHILDREN'S COURT",
          legalBasis: [KenyanLawSection.S71_COURT_GUARDIAN],
          previousCareArrangement: 'RELATIVE_CARE',
          timeInPreviousCareMonths: 3,
          openAdoption: true,
          medicalHistoryProvided: true,
          postAdoptionMonitoring: false,
        };

      case 'STEP_PARENT':
        return {
          ...baseTemplate,
          adoptionType: 'STEP_PARENT',
          courtStation: "CHILDREN'S COURT",
          legalBasis: [KenyanLawSection.S71_COURT_GUARDIAN],
          consentDocuments: ['MARRIAGE_CERTIFICATE', 'PARENTAL_CONSENT_AFFIDAVIT'],
          inheritanceRightsEstablished: true,
          medicalHistoryProvided: true,
          postAdoptionMonitoring: false,
        };

      case 'INTERNATIONAL':
        return {
          ...baseTemplate,
          adoptionType: 'INTERNATIONAL',
          courtStation: 'HIGH_COURT',
          legalBasis: [KenyanLawSection.S71_COURT_GUARDIAN],
          receivingCountry: 'UNITED_STATES',
          sendingCountry: 'KENYA',
          adoptionExpenses: 500000,
          previousCareArrangement: 'ORPHANAGE',
          timeInPreviousCareMonths: 24,
          postAdoptionMonitoring: true,
          monitoringPeriodMonths: 24,
        };

      default:
        return baseTemplate;
    }
  }

  // Helper Methods
  private static mapLegacyAdoptionType(legacyType: string): AdoptionRecordProps['adoptionType'] {
    const mapping: Record<string, AdoptionRecordProps['adoptionType']> = {
      STATUTORY: 'STATUTORY',
      CUSTOMARY: 'CUSTOMARY',
      INTERNATIONAL: 'INTERNATIONAL',
      KINSHIP: 'KINSHIP',
      FOSTER_TO_ADOPT: 'FOSTER_TO_ADOPT',
      STEP_PARENT: 'STEP_PARENT',
      RELATIVE: 'RELATIVE',
      LEGAL: 'STATUTORY',
      TRADITIONAL: 'CUSTOMARY',
      FOREIGN: 'INTERNATIONAL',
    };

    return mapping[legacyType?.toUpperCase()] || 'STATUTORY';
  }

  private static mapLegacyAdoptionStatus(
    legacyStatus: string,
  ): AdoptionRecordProps['adoptionStatus'] {
    const mapping: Record<string, AdoptionRecordProps['adoptionStatus']> = {
      PENDING: 'PENDING',
      IN_PROGRESS: 'IN_PROGRESS',
      FINALIZED: 'FINALIZED',
      REVOKED: 'REVOKED',
      ANNULED: 'ANNULED',
      APPEALED: 'APPEALED',
      COMPLETED: 'FINALIZED',
      ACTIVE: 'IN_PROGRESS',
      CLOSED: 'FINALIZED',
    };

    return mapping[legacyStatus?.toUpperCase()] || 'PENDING';
  }

  private static mapLegacyConsentStatus(
    legacyConsent: string,
  ): AdoptionRecordProps['parentalConsentStatus']['mother'] {
    const mapping: Record<string, AdoptionRecordProps['parentalConsentStatus']['mother']> = {
      CONSENTED: 'CONSENTED',
      WITHHELD: 'WITHHELD',
      UNKNOWN: 'UNKNOWN',
      DECEASED: 'DECEASED',
      TERMINATED: 'TERMINATED',
      YES: 'CONSENTED',
      NO: 'WITHHELD',
      '1': 'CONSENTED',
      '0': 'WITHHELD',
    };

    return mapping[legacyConsent?.toUpperCase()] || 'UNKNOWN';
  }

  private static mapLegacyVerification(
    legacyStatus: any,
  ): AdoptionRecordProps['verificationStatus'] {
    const mapping: Record<string, AdoptionRecordProps['verificationStatus']> = {
      VERIFIED: 'VERIFIED',
      PENDING: 'PENDING_VERIFICATION',
      REJECTED: 'DISPUTED',
      DISPUTED: 'DISPUTED',
      YES: 'VERIFIED',
      NO: 'UNVERIFIED',
      '1': 'VERIFIED',
      '0': 'UNVERIFIED',
    };

    return mapping[legacyStatus?.toString().toUpperCase()] || 'UNVERIFIED';
  }
}
