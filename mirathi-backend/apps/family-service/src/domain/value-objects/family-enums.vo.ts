// src/family-service/src/domain/value-objects/family-enums.vo.ts

/**
 * Family Service Enums - Kenyan Legal Context
 *
 * Updated to align with Prisma schema
 */
export enum SuccessionRegime {
  TESTATE = 'TESTATE',
  INTESTATE = 'INTESTATE',
  PARTIALLY_INTESTATE = 'PARTIALLY_INTESTATE',
  CUSTOMARY = 'CUSTOMARY',
}

export enum SuccessionMarriageType {
  MONOGAMOUS = 'MONOGAMOUS',
  POLYGAMOUS = 'POLYGAMOUS',
  COHABITATION = 'COHABITATION',
  SINGLE = 'SINGLE',
}

export enum SuccessionReligion {
  STATUTORY = 'STATUTORY',
  ISLAMIC = 'ISLAMIC',
  HINDU = 'HINDU',
  AFRICAN_CUSTOMARY = 'AFRICAN_CUSTOMARY',
  CHRISTIAN = 'CHRISTIAN',
}
/**
 * House Establishment Types (S.40 Polygamy)
 */
export enum HouseEstablishmentType {
  CUSTOMARY = 'CUSTOMARY',
  ISLAMIC = 'ISLAMIC',
  TRADITIONAL = 'TRADITIONAL',
  COURT_RECOGNIZED = 'COURT_RECOGNIZED',
}

/**
 * Cohabitation Relationship Types
 */
export enum CohabitationType {
  COME_WE_STAY = 'COME_WE_STAY',
  LONG_TERM_PARTNERSHIP = 'LONG_TERM_PARTNERSHIP',
  DATING = 'DATING',
  ENGAGED = 'ENGAGED',
}

/**
 * Cohabitation Stability Levels
 */
export enum CohabitationStability {
  STABLE = 'STABLE',
  VOLATILE = 'VOLATILE',
  ON_OFF = 'ON_OFF',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Adoption Types (Children Act & Customary Law)
 */
export enum AdoptionType {
  STATUTORY = 'STATUTORY',
  CUSTOMARY = 'CUSTOMARY',
  INTERNATIONAL = 'INTERNATIONAL',
  KINSHIP = 'KINSHIP',
  FOSTER_TO_ADOPT = 'FOSTER_TO_ADOPT',
  STEP_PARENT = 'STEP_PARENT',
  RELATIVE = 'RELATIVE',
}

/**
 * Adoption Status
 */
export enum AdoptionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  FINALIZED = 'FINALIZED',
  REVOKED = 'REVOKED',
  ANNULED = 'ANNULED',
  APPEALED = 'APPEALED',
}

/**
 * Verification Status (Used across entities)
 */
export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  DISPUTED = 'DISPUTED',
}

/**
 * Parental Consent Status for Adoption
 */
export enum ParentalConsentStatus {
  CONSENTED = 'CONSENTED',
  WITHHELD = 'WITHHELD',
  UNKNOWN = 'UNKNOWN',
  DECEASED = 'DECEASED',
  TERMINATED = 'TERMINATED',
}

/**
 * Relationship Verification Levels
 */
export enum RelationshipVerificationLevel {
  UNVERIFIED = 'UNVERIFIED',
  PARTIALLY_VERIFIED = 'PARTIALLY_VERIFIED',
  FULLY_VERIFIED = 'FULLY_VERIFIED',
  DISPUTED = 'DISPUTED',
}

/**
 * Conflict Resolution Status
 */
export enum ConflictResolutionStatus {
  RESOLVED = 'RESOLVED',
  PENDING = 'PENDING',
  MEDIATION = 'MEDIATION',
  COURT = 'COURT',
}

/**
 * House Dissolution Reasons (S.40)
 */
export enum HouseDissolutionReason {
  WIFE_DECEASED = 'WIFE_DECEASED',
  WIFE_DIVORCED = 'WIFE_DIVORCED',
  HOUSE_MERGED = 'HOUSE_MERGED',
  COURT_ORDER = 'COURT_ORDER',
}

/**
 * Relationship Verification Methods
 */
export enum RelationshipVerificationMethod {
  DNA = 'DNA',
  DOCUMENT = 'DOCUMENT',
  FAMILY_CONSENSUS = 'FAMILY_CONSENSUS',
  COURT_ORDER = 'COURT_ORDER',
  TRADITIONAL = 'TRADITIONAL',
}

/**
 * Inheritance Right Levels
 */
export enum InheritanceRightLevel {
  FULL = 'FULL',
  LIMITED = 'LIMITED',
  NONE = 'NONE',
  DISPUTED = 'DISPUTED',
}

/**
 * Relationship Support Types
 */
export enum RelationshipSupportType {
  FINANCIAL = 'FINANCIAL',
  HOUSING = 'HOUSING',
  MEDICAL = 'MEDICAL',
  EDUCATIONAL = 'EDUCATIONAL',
  FULL_CARE = 'FULL_CARE',
}

// ============================================================================
// UPDATED ENUMS TO MATCH PRISMA SCHEMA
// ============================================================================

/**
 * Updated Guardianship Status (matching Prisma)
 */
export enum GuardianshipStatus {
  PENDING_ACTIVATION = 'PENDING_ACTIVATION',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
  EMERGENCY = 'EMERGENCY',
}

/**
 * Bond Status for Guardianship
 */
export enum BondStatus {
  NOT_REQUIRED = 'NOT_REQUIRED',
  REQUIRED_PENDING = 'REQUIRED_PENDING',
  POSTED = 'POSTED',
  FORFEITED = 'FORFEITED',
}

/**
 * Guardian Role Types
 */
export enum GuardianRole {
  CARETAKER = 'CARETAKER',
  PROPERTY_MANAGER = 'PROPERTY_MANAGER',
  EDUCATIONAL_GUARDIAN = 'EDUCATIONAL_GUARDIAN',
  MEDICAL_CONSENT = 'MEDICAL_CONSENT',
  LEGAL_REPRESENTATIVE = 'LEGAL_REPRESENTATIVE',
  EMERGENCY = 'EMERGENCY',
  CUSTOMARY = 'CUSTOMARY',
}

/**
 * Guardian Assignment Status
 */
export enum GuardianAssignmentStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
  REVOKED = 'REVOKED',
  DECEASED = 'DECEASED',
  RESIGNED = 'RESIGNED',
}

/**
 * Guardianship Jurisdiction
 */
export enum GuardianshipJurisdiction {
  STATUTORY = 'STATUTORY',
  ISLAMIC = 'ISLAMIC',
  CUSTOMARY = 'CUSTOMARY',
  INTERNATIONAL = 'INTERNATIONAL',
}

/**
 * Compliance Periods for Guardianship
 */
export enum CompliancePeriod {
  QUARTER_1 = 'QUARTER_1',
  QUARTER_2 = 'QUARTER_2',
  QUARTER_3 = 'QUARTER_3',
  QUARTER_4 = 'QUARTER_4',
  ANNUAL = 'ANNUAL',
  BIANNUAL = 'BIANNUAL',
  SPECIAL = 'SPECIAL',
}

/**
 * Compliance Check Status
 */
export enum ComplianceCheckStatus {
  DRAFT = 'DRAFT',
  PENDING_SUBMISSION = 'PENDING_SUBMISSION',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  AMENDMENT_REQUESTED = 'AMENDMENT_REQUESTED',
  OVERDUE = 'OVERDUE',
  EXTENSION_GRANTED = 'EXTENSION_GRANTED',
  WAIVED = 'WAIVED',
}

/**
 * Validation Status
 */
export enum ValidationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  EXCEPTION = 'EXCEPTION',
}

/**
 * Report Types for Guardianship
 */
export enum ReportType {
  ANNUAL_WELFARE = 'ANNUAL_WELFARE',
  QUARTERLY_FINANCIAL = 'QUARTERLY_FINANCIAL',
  MEDICAL_UPDATE = 'MEDICAL_UPDATE',
  EDUCATIONAL_PROGRESS = 'EDUCATIONAL_PROGRESS',
  PROPERTY_MANAGEMENT = 'PROPERTY_MANAGEMENT',
  COURT_MANDATED = 'COURT_MANDATED',
  EMERGENCY_REPORT = 'EMERGENCY_REPORT',
  CLOSING_REPORT = 'CLOSING_REPORT',
}

/**
 * Updated Guardian Appointment Source
 */
export enum GuardianAppointmentSource {
  WILL = 'WILL',
  COURT = 'COURT',
  FAMILY_AGREEMENT = 'FAMILY_AGREEMENT',
  CUSTOMARY_COUNCIL = 'CUSTOMARY_COUNCIL',
  EMERGENCY = 'EMERGENCY',
  MUTUAL = 'MUTUAL',
}

/**
 * Updated Guardianship Termination Reasons
 */
export enum GuardianshipTerminationReason {
  WARD_REACHED_MAJORITY = 'WARD_REACHED_MAJORITY',
  WARD_DECEASED = 'WARD_DECEASED',
  GUARDIAN_DECEASED = 'GUARDIAN_DECEASED',
  GUARDIAN_INCAPACITATED = 'GUARDIAN_INCAPACITATED',
  COURT_REMOVAL = 'COURT_REMOVAL',
  VOLUNTARY_RESIGNATION = 'VOLUNTARY_RESIGNATION',
  WARD_REGAINED_CAPACITY = 'WARD_REGAINED_CAPACITY',
  ADOPTION_FINALIZED = 'ADOPTION_FINALIZED',
  CUSTOMARY_TRANSFER = 'CUSTOMARY_TRANSFER',
}
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHERS = 'OTHERS',
}
export enum KenyanCounty {
  // Updated to match Prisma enum exactly (no emojis)
  BARINGO = 'BARINGO',
  BOMET = 'BOMET',
  BUNGOMA = 'BUNGOMA',
  BUSIA = 'BUSIA',
  ELGEYO_MARAKWET = 'ELGEYO_MARAKWET',
  EMBU = 'EMBU',
  GARISSA = 'GARISSA',
  HOMA_BAY = 'HOMA_BAY',
  ISIOLO = 'ISIOLO',
  KAJIADO = 'KAJIADO',
  KAKAMEGA = 'KAKAMEGA',
  KERICHO = 'KERICHO',
  KIAMBU = 'KIAMBU',
  KILIFI = 'KILIFI',
  KIRINYAGA = 'KIRINYAGA',
  KISII = 'KISII',
  KISUMU = 'KISUMU',
  KITUI = 'KITUI',
  KWALE = 'KWALE',
  LAIKIPIA = 'LAIKIPIA',
  LAMU = 'LAMU',
  MACHAKOS = 'MACHAKOS',
  MAKUENI = 'MAKUENI',
  MANDERA = 'MANDERA',
  MARSABIT = 'MARSABIT',
  MERU = 'MERU',
  MIGORI = 'MIGORI',
  MOMBASA = 'MOMBASA',
  MURANGA = 'MURANGA',
  NAIROBI = 'NAIROBI',
  NAKURU = 'NAKURU',
  NANDI = 'NANDI',
  NAROK = 'NAROK',
  NYAMIRA = 'NYAMIRA',
  NYANDARUA = 'NYANDARUA',
  NYERI = 'NYERI',
  SAMBURU = 'SAMBURU',
  SIAYA = 'SIAYA',
  TAITA_TAVETA = 'TAITA_TAVETA',
  TANA_RIVER = 'TANA_RIVER',
  THARAKA_NITHI = 'THARAKA_NITHI',
  TRANS_NZOIA = 'TRANS_NZOIA',
  TURKANA = 'TURKANA',
  UASIN_GISHU = 'UASIN_GISHU',
  VIHIGA = 'VIHIGA',
  WAJIR = 'WAJIR',
  WEST_POKOT = 'WEST_POKOT',
}

export enum RelationshipType {
  // Immediate Family (matching Prisma)
  SPOUSE = 'SPOUSE',
  EX_SPOUSE = 'EX_SPOUSE',
  CHILD = 'CHILD',
  ADOPTED_CHILD = 'ADOPTED_CHILD',
  STEPCHILD = 'STEPCHILD',
  PARENT = 'PARENT',
  SIBLING = 'SIBLING',
  HALF_SIBLING = 'HALF_SIBLING',

  // Extended Family
  GRANDPARENT = 'GRANDPARENT',
  GRANDCHILD = 'GRANDCHILD',
  AUNT_UNCLE = 'AUNT_UNCLE',
  NIECE_NEPHEW = 'NIECE_NEPHEW',
  COUSIN = 'COUSIN',

  // Legal Relationships
  GUARDIAN = 'GUARDIAN',
  OTHER = 'OTHER', // Added to match Prisma

  // Note: Removed FOSTER_CHILD, CLAN_ELDER, AGE_MATE, GODPARENT,
  // PARTNER, COHABITANT as they don't exist in Prisma schema
}

export enum MarriageType {
  CIVIL = 'CIVIL',
  CHRISTIAN = 'CHRISTIAN',
  CUSTOMARY = 'CUSTOMARY',
  ISLAMIC = 'ISLAMIC',
  HINDU = 'HINDU',
  OTHER = 'OTHER', // Added to match Prisma

  // Note: Removed COHABITATION, TRADITIONAL as they don't exist in Prisma
}

export enum MarriageStatus {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED',
  SEPARATED = 'SEPARATED',

  // Note: Removed ACTIVE, SEPARATED, ANNULED, POLYGAMOUS as they don't match Prisma
}

export enum MarriageEndReason {
  DEATH_OF_SPOUSE = 'DEATH_OF_SPOUSE',
  DIVORCE = 'DIVORCE',
  ANNULMENT = 'ANNULMENT',
  CUSTOMARY_DISSOLUTION = 'CUSTOMARY_DISSOLUTION',
  STILL_ACTIVE = 'STILL_ACTIVE',
}

export enum RelationshipGuardianshipType {
  TEMPORARY = 'TEMPORARY',
  PERMANENT = 'PERMANENT',
  TESTAMENTARY = 'TESTAMENTARY',
  CUSTOMARY = 'CUSTOMARY',
}

export enum KenyanRelationshipCategory {
  SPOUSE = 'SPOUSE',
  CHILDREN = 'CHILDREN',
  PARENTS = 'PARENTS',
  SIBLINGS = 'SIBLINGS',
  EXTENDED_FAMILY = 'EXTENDED_FAMILY',
  NON_FAMILY = 'NON_FAMILY',
}

export enum DependencyLevel {
  NONE = 'NONE',
  PARTIAL = 'PARTIAL',
  FULL = 'FULL',

  // Note: Removed TEMPORARY, MEDICAL, EDUCATIONAL as they don't exist in Prisma
}

export enum GuardianType {
  TESTAMENTARY = 'TESTAMENTARY',
  COURT_APPOINTED = 'COURT_APPOINTED',
  CUSTOMARY = 'CUSTOMARY',
  NATURAL_PARENT = 'NATURAL_PARENT',
}

export enum ComplianceStatus {
  PENDING = 'PENDING',
  FILED = 'FILED',
  OVERDUE = 'OVERDUE',
  REJECTED = 'REJECTED',
}
export enum GuardianReportStatus {
  PENDING = 'PENDING',
  DUE = 'DUE',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  OVERDUE = 'OVERDUE',
  REJECTED = 'REJECTED',
}
export enum InheritanceRights {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
  CUSTOMARY = 'CUSTOMARY',
  NONE = 'NONE',
  PENDING = 'PENDING',
}

export enum KenyanLawSection {
  S26_DEPENDANT_PROVISION = 'S26_DEPENDANT_PROVISION',
  S29_DEPENDANTS = 'S29_DEPENDANTS',
  S35_SPOUSAL_CHILDS_SHARE = 'S35_SPOUSAL_CHILDS_SHARE',
  S40_POLY_GAMY = 'S40_POLY_GAMY',
  S45_DEBT_PRIORITY = 'S45_DEBT_PRIORITY',
  S70_TESTAMENTARY_GUARDIAN = 'S70_TESTAMENTARY_GUARDIAN',
  S71_COURT_GUARDIAN = 'S71_COURT_GUARDIAN',
  S72_GUARDIAN_BOND = 'S72_GUARDIAN_BOND',
  S73_GUARDIAN_ACCOUNTS = 'S73_GUARDIAN_ACCOUNTS',
  S83_EXECUTOR_DUTIES = 'S83_EXECUTOR_DUTIES',
}

/**
 * Helper functions for enum operations
 */
export class EnumHelpers {
  /**
   * Get all relationship types that create legal dependency (S.29 Law of Succession Act)
   */
  static getDependencyRelationshipTypes(): RelationshipType[] {
    return [
      RelationshipType.SPOUSE,
      RelationshipType.CHILD,
      RelationshipType.ADOPTED_CHILD,
      RelationshipType.STEPCHILD,
      RelationshipType.PARENT,
    ];
  }

  /**
   * Get marriage types that require S.40 polygamous house structure (Law of Succession)
   */
  static getPolygamousMarriageTypes(): MarriageType[] {
    return [MarriageType.ISLAMIC, MarriageType.CUSTOMARY];
  }

  /**
   * Get counties by region for better UX grouping
   */
  static getCountiesByRegion(): Record<string, KenyanCounty[]> {
    return {
      'Nairobi Metro': [
        KenyanCounty.NAIROBI,
        KenyanCounty.KIAMBU,
        KenyanCounty.MACHAKOS,
        KenyanCounty.KAJIADO,
      ],
      Coast: [
        KenyanCounty.MOMBASA,
        KenyanCounty.KWALE,
        KenyanCounty.KILIFI,
        KenyanCounty.TANA_RIVER,
        KenyanCounty.LAMU,
        KenyanCounty.TAITA_TAVETA,
      ],
      'Central Region': [
        KenyanCounty.NYANDARUA,
        KenyanCounty.NYERI,
        KenyanCounty.KIRINYAGA,
        KenyanCounty.MURANGA,
      ],
      'Rift Valley': [
        KenyanCounty.TURKANA,
        KenyanCounty.WEST_POKOT,
        KenyanCounty.SAMBURU,
        KenyanCounty.TRANS_NZOIA,
        KenyanCounty.UASIN_GISHU,
        KenyanCounty.ELGEYO_MARAKWET,
        KenyanCounty.NANDI,
        KenyanCounty.BARINGO,
        KenyanCounty.LAIKIPIA,
        KenyanCounty.NAKURU,
        KenyanCounty.NAROK,
        KenyanCounty.KERICHO,
        KenyanCounty.BOMET,
      ],
      Western: [
        KenyanCounty.KAKAMEGA,
        KenyanCounty.VIHIGA,
        KenyanCounty.BUNGOMA,
        KenyanCounty.BUSIA,
      ],
      Nyanza: [
        KenyanCounty.SIAYA,
        KenyanCounty.KISUMU,
        KenyanCounty.HOMA_BAY,
        KenyanCounty.MIGORI,
        KenyanCounty.KISII,
        KenyanCounty.NYAMIRA,
      ],
      Eastern: [
        KenyanCounty.MARSABIT,
        KenyanCounty.ISIOLO,
        KenyanCounty.MERU,
        KenyanCounty.THARAKA_NITHI,
        KenyanCounty.EMBU,
        KenyanCounty.KITUI,
        KenyanCounty.MAKUENI,
      ],
      'North Eastern': [KenyanCounty.GARISSA, KenyanCounty.WAJIR, KenyanCounty.MANDERA],
    };
  }

  /**
   * Get gender pronouns for display
   */
  static getGenderPronouns(gender: Gender): {
    subjective: string;
    objective: string;
    possessive: string;
  } {
    const pronouns = {
      [Gender.MALE]: { subjective: 'he', objective: 'him', possessive: 'his' },
      [Gender.FEMALE]: { subjective: 'she', objective: 'her', possessive: 'her' },
      [Gender.OTHERS]: {
        subjective: 'they',
        objective: 'them',
        possessive: 'their',
      },
    };

    return pronouns[gender] || pronouns[Gender.OTHERS];
  }

  /**
   * Check if a marriage type can be polygamous under Kenyan law
   */
  static canBePolygamous(marriageType: MarriageType): boolean {
    return this.getPolygamousMarriageTypes().includes(marriageType);
  }

  /**
   * Check if relationship qualifies as immediate family for succession
   */
  static isImmediateFamily(relationship: RelationshipType): boolean {
    const immediateFamily = [
      RelationshipType.SPOUSE,
      RelationshipType.CHILD,
      RelationshipType.ADOPTED_CHILD,
      RelationshipType.STEPCHILD,
      RelationshipType.PARENT,
    ];
    return immediateFamily.includes(relationship);
  }

  /**
   * Get guardian types that require court supervision
   */
  static requiresCourtSupervision(guardianType: GuardianType): boolean {
    return [GuardianType.COURT_APPOINTED, GuardianType.CUSTOMARY].includes(guardianType);
  }
  /**
   * Get adoption types that require court supervision
   */
  static getCourtSupervisedAdoptionTypes(): AdoptionType[] {
    return [AdoptionType.STATUTORY, AdoptionType.INTERNATIONAL, AdoptionType.FOSTER_TO_ADOPT];
  }

  /**
   * Get adoption types that are customary
   */
  static getCustomaryAdoptionTypes(): AdoptionType[] {
    return [
      AdoptionType.CUSTOMARY,
      AdoptionType.KINSHIP,
      AdoptionType.STEP_PARENT,
      AdoptionType.RELATIVE,
    ];
  }

  /**
   * Get cohabitation types that qualify for S.29
   */
  static getS29QualifiedCohabitationTypes(): CohabitationType[] {
    return [
      CohabitationType.COME_WE_STAY,
      CohabitationType.LONG_TERM_PARTNERSHIP,
      CohabitationType.ENGAGED,
    ];
  }

  /**
   * Get house establishment types that are legally recognized
   */
  static getLegallyRecognizedHouseTypes(): HouseEstablishmentType[] {
    return [
      HouseEstablishmentType.COURT_RECOGNIZED,
      HouseEstablishmentType.CUSTOMARY,
      HouseEstablishmentType.ISLAMIC,
    ];
  }

  /**
   * Get verification levels that are acceptable for legal purposes
   */
  static getLegallyAcceptedVerificationLevels(): RelationshipVerificationLevel[] {
    return [
      RelationshipVerificationLevel.FULLY_VERIFIED,
      RelationshipVerificationLevel.PARTIALLY_VERIFIED,
    ];
  }

  /**
   * Check if a cohabitation type is likely to have children
   */
  static isCohabitationWithChildrenLikely(type: CohabitationType): boolean {
    return [CohabitationType.COME_WE_STAY, CohabitationType.LONG_TERM_PARTNERSHIP].includes(type);
  }

  /**
   * Get guardian roles that require bond (S.72)
   */
  static getBondRequiredGuardianRoles(): GuardianRole[] {
    return [GuardianRole.PROPERTY_MANAGER, GuardianRole.LEGAL_REPRESENTATIVE];
  }

  /**
   * Check if adoption type creates full inheritance rights
   */
  static createsFullInheritanceRights(adoptionType: AdoptionType): boolean {
    return [AdoptionType.STATUTORY, AdoptionType.CUSTOMARY, AdoptionType.STEP_PARENT].includes(
      adoptionType,
    );
  }

  /**
   * Get conflict resolution methods in order of preference
   */
  static getConflictResolutionHierarchy(): ConflictResolutionStatus[] {
    return [
      ConflictResolutionStatus.RESOLVED,
      ConflictResolutionStatus.MEDIATION,
      ConflictResolutionStatus.COURT,
      ConflictResolutionStatus.PENDING,
    ];
  }

  /**
   * Check if house dissolution affects inheritance
   */
  static isHouseDissolutionInheritanceAffecting(reason: HouseDissolutionReason): boolean {
    return [HouseDissolutionReason.WIFE_DECEASED, HouseDissolutionReason.WIFE_DIVORCED].includes(
      reason,
    );
  }

  /**
   * Get verification methods by reliability score
   */
  static getVerificationMethodReliability(method: RelationshipVerificationMethod): number {
    const reliabilityScores: Record<RelationshipVerificationMethod, number> = {
      [RelationshipVerificationMethod.COURT_ORDER]: 100,
      [RelationshipVerificationMethod.DNA]: 95,
      [RelationshipVerificationMethod.DOCUMENT]: 80,
      [RelationshipVerificationMethod.FAMILY_CONSENSUS]: 60,
      [RelationshipVerificationMethod.TRADITIONAL]: 50,
    };
    return reliabilityScores[method] || 0;
  }

  /**
   * Get support types that create dependency claims
   */
  static getDependencyCreatingSupportTypes(): RelationshipSupportType[] {
    return [
      RelationshipSupportType.FULL_CARE,
      RelationshipSupportType.FINANCIAL,
      RelationshipSupportType.MEDICAL,
    ];
  }

  /**
   * Check if guardianship status allows property management
   */
  static allowsPropertyManagement(status: GuardianshipStatus): boolean {
    return [GuardianshipStatus.ACTIVE, GuardianshipStatus.EMERGENCY].includes(status);
  }

  /**
   * Get compliance periods by frequency
   */
  static getCompliancePeriodFrequency(
    period: CompliancePeriod,
  ): 'QUARTERLY' | 'BIANNUAL' | 'ANNUAL' | 'SPECIAL' {
    const frequencyMap: Record<CompliancePeriod, any> = {
      [CompliancePeriod.QUARTER_1]: 'QUARTERLY',
      [CompliancePeriod.QUARTER_2]: 'QUARTERLY',
      [CompliancePeriod.QUARTER_3]: 'QUARTERLY',
      [CompliancePeriod.QUARTER_4]: 'QUARTERLY',
      [CompliancePeriod.BIANNUAL]: 'BIANNUAL',
      [CompliancePeriod.ANNUAL]: 'ANNUAL',
      [CompliancePeriod.SPECIAL]: 'SPECIAL',
    };
    return frequencyMap[period];
  }

  /**
   * Get report types by required frequency
   */
  static getReportFrequency(reportType: ReportType): CompliancePeriod {
    const frequencyMap: Record<ReportType, CompliancePeriod> = {
      [ReportType.ANNUAL_WELFARE]: CompliancePeriod.ANNUAL,
      [ReportType.QUARTERLY_FINANCIAL]: CompliancePeriod.QUARTER_1,
      [ReportType.MEDICAL_UPDATE]: CompliancePeriod.BIANNUAL,
      [ReportType.EDUCATIONAL_PROGRESS]: CompliancePeriod.QUARTER_1,
      [ReportType.PROPERTY_MANAGEMENT]: CompliancePeriod.QUARTER_1,
      [ReportType.COURT_MANDATED]: CompliancePeriod.SPECIAL,
      [ReportType.EMERGENCY_REPORT]: CompliancePeriod.SPECIAL,
      [ReportType.CLOSING_REPORT]: CompliancePeriod.SPECIAL,
    };
    return frequencyMap[reportType] || CompliancePeriod.ANNUAL;
  }
}

// ============================================================================
// TYPE ALIASES FOR PRISMA COMPATIBILITY
// ============================================================================

/**
 * Type aliases to match Prisma enum names in the domain
 * These ensure type safety when mapping between domain and persistence
 */
export type PrismaHouseEstablishmentType = HouseEstablishmentType;
export type PrismaCohabitationType = CohabitationType;
export type PrismaCohabitationStability = CohabitationStability;
export type PrismaAdoptionType = AdoptionType;
export type PrismaAdoptionStatus = AdoptionStatus;
export type PrismaVerificationStatus = VerificationStatus;
export type PrismaParentalConsentStatus = ParentalConsentStatus;
export type PrismaRelationshipVerificationLevel = RelationshipVerificationLevel;
export type PrismaConflictResolutionStatus = ConflictResolutionStatus;
export type PrismaHouseDissolutionReason = HouseDissolutionReason;
export type PrismaRelationshipVerificationMethod = RelationshipVerificationMethod;
export type PrismaInheritanceRightLevel = InheritanceRightLevel;
export type PrismaRelationshipSupportType = RelationshipSupportType;
export type PrismaGuardianshipStatus = GuardianshipStatus;
export type PrismaBondStatus = BondStatus;
export type PrismaGuardianRole = GuardianRole;
export type PrismaGuardianAssignmentStatus = GuardianAssignmentStatus;
export type PrismaGuardianshipJurisdiction = GuardianshipJurisdiction;
export type PrismaCompliancePeriod = CompliancePeriod;
export type PrismaComplianceCheckStatus = ComplianceCheckStatus;
export type PrismaValidationStatus = ValidationStatus;
export type PrismaReportType = ReportType;
