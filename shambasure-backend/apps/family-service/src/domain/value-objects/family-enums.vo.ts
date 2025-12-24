// src/family-service/src/domain/value-objects/family-enums.vo.ts

/**
 * Family Service Enums - Kenyan Legal Context
 *
 * Updated to align with Prisma schema
 */

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHERS = 'OTHERS', // Changed from NON_BINARY/PREFER_NOT_TO_SAY/CUSTOM to match Prisma
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

export enum GuardianshipStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
  EXPIRED_WARD_MAJORITY = 'EXPIRED_WARD_MAJORITY',
}

export enum GuardianAppointmentSource {
  FAMILY = 'FAMILY',
  COURT = 'COURT',
  WILL = 'WILL',
  CUSTOMARY_LAW = 'CUSTOMARY_LAW',
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
}

// Additional enums from Prisma that might be needed in family service
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
