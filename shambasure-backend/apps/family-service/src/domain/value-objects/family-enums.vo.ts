// src/family-service/src/domain/value-objects/family-enums.vo.ts

/**
 * Family Service Enums - Kenyan Legal Context
 *
 * Innovations:
 * 1. Culturally-sensitive terminology
 * 2. Legal statute references
 * 3. Multi-religion support
 * 4. Progressive gender options
 */

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  NON_BINARY = 'NON_BINARY',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
  CUSTOM = 'CUSTOM', // For culturally-specific gender identities
}

export enum KenyanCounty {
  // Mapped with emojis for better UX
  // COAST
  MOMBASA = 'MOMBASA 🏝️',
  KWALE = 'KWALE 🏖️',
  KILIFI = 'KILIFI 🥥',
  TANA_RIVER = 'TANA_RIVER 🐊',
  LAMU = 'LAMU ⛵',
  TAITA_TAVETA = 'TAITA_TAVETA 🐘',

  // NORTH EASTERN
  GARISSA = 'GARISSA 🐫',
  WAJIR = 'WAJIR ☀️',
  MANDERA = 'MANDERA 🏜️',

  // EASTERN
  MARSABIT = 'MARSABIT 🌪️',
  ISIOLO = 'ISIOLO 🦁',
  MERU = 'MERU 🌿',
  THARAKA_NITHI = 'THARAKA_NITHI ⛰️',
  EMBU = 'EMBU 🌾',
  KITUI = 'KITUI 🐝',
  MACHAKOS = 'MACHAKOS 🏞️',
  MAKUENI = 'MAKUENI 🍊',

  // CENTRAL
  NYANDARUA = 'NYANDARUA 🥔',
  NYERI = 'NYERI 🗻',
  KIRINYAGA = 'KIRINYAGA 🍚',
  MURANGA = 'MURANGA 🍌',
  KIAMBU = 'KIAMBU ☕',

  // RIFT VALLEY
  TURKANA = 'TURKANA 🕸️',
  WEST_POKOT = 'WEST_POKOT 🐂',
  SAMBURU = 'SAMBURU 🦋',
  TRANS_NZOIA = 'TRANS_NZOIA 🌽',
  UASIN_GISHU = 'UASIN_GISHU 🏃',
  ELGEYO_MARAKWET = 'ELGEYO_MARAKWET 🏃‍♀️',
  NANDI = 'NANDI 🥛',
  BARINGO = 'BARINGO 🐊',
  LAIKIPIA = 'LAIKIPIA 🦓',
  NAKURU = 'NAKURU 🦩',
  NAROK = 'NAROK 🦁',
  KAJIADO = 'KAJIADO 🐄',
  KERICHO = 'KERICHO 🍵',
  BOMET = 'BOMET 🚜',

  // WESTERN
  KAKAMEGA = 'KAKAMEGA 🌲',
  VIHIGA = 'VIHIGA 🗿',
  BUNGOMA = 'BUNGOMA 🚲',
  BUSIA = 'BUSIA 🛂',

  // NYANZA
  SIAYA = 'SIAYA 🎣',
  KISUMU = 'KISUMU 🚢',
  HOMA_BAY = 'HOMA_BAY 🐟',
  MIGORI = 'MIGORI 🚬',
  KISII = 'KISII 🍌',
  NYAMIRA = 'NYAMIRA 🍃',

  // NAIROBI
  NAIROBI = 'NAIROBI 🏙️',
}

export enum RelationshipType {
  // Immediate Family
  SPOUSE = 'SPOUSE 👰',
  CHILD = 'CHILD 👶',
  PARENT = 'PARENT 👴',
  SIBLING = 'SIBLING 👫',

  // Extended Family
  GRANDPARENT = 'GRANDPARENT 👵',
  GRANDCHILD = 'GRANDCHILD 🧒',
  AUNT_UNCLE = 'AUNT_UNCLE 🧑',
  NIECE_NEPHEW = 'NIECE_NEPHEW 🧒',
  COUSIN = 'COUSIN 👥',

  // Legal Relationships
  GUARDIAN = 'GUARDIAN 🛡️',
  WARD = 'WARD 🧸',
  STEPCHILD = 'STEPCHILD 👣',
  ADOPTED_CHILD = 'ADOPTED_CHILD 🤝',
  FOSTER_CHILD = 'FOSTER_CHILD 🏠',

  // Cultural Relationships
  CLAN_ELDER = 'CLAN_ELDER 🧓',
  AGE_MATE = 'AGE_MATE 🤝',
  GODPARENT = 'GODPARENT ✝️',

  // Modern Relationships
  PARTNER = 'PARTNER 💑',
  COHABITANT = 'COHABITANT 🏠',
  EX_SPOUSE = 'EX_SPOUSE 💔',
}

export enum MarriageType {
  CIVIL = 'CIVIL 👨‍⚖️',
  CHRISTIAN = 'CHRISTIAN ✝️',
  ISLAMIC = 'ISLAMIC ☪️',
  HINDU = 'HINDU 🕉️',
  CUSTOMARY = 'CUSTOMARY 🌍', // Recognized under Marriage Act 2014
  COHABITATION = 'COHABITATION 🤝', // "Come we stay"
  TRADITIONAL = 'TRADITIONAL 🎎',
}

export enum MarriageStatus {
  ACTIVE = 'ACTIVE 💕',
  SEPARATED = 'SEPARATED 😔',
  DIVORCED = 'DIVORCED 📜',
  WIDOWED = 'WIDOWED ⚰️',
  ANNULED = 'ANNULED ❌',
  POLYGAMOUS = 'POLYGAMOUS 👥',
}

export enum DependencyLevel {
  NONE = 'NONE',
  PARTIAL = 'PARTIAL', // e.g., contributing to school fees only
  FULL = 'FULL', // e.g., minor children
  TEMPORARY = 'TEMPORARY', // e.g., unemployed sibling
  MEDICAL = 'MEDICAL', // e.g., elderly parent with condition
  EDUCATIONAL = 'EDUCATIONAL',
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
      RelationshipType.PARENT,
      RelationshipType.STEPCHILD,
      RelationshipType.ADOPTED_CHILD,
    ];
  }

  /**
   * Get marriage types that require S.40 polygamous house structure (Law of Succession)
   */
  static getPolygamousMarriageTypes(): MarriageType[] {
    return [MarriageType.ISLAMIC, MarriageType.CUSTOMARY, MarriageType.TRADITIONAL];
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
      [Gender.NON_BINARY]: {
        subjective: 'they',
        objective: 'them',
        possessive: 'their',
      },
      [Gender.PREFER_NOT_TO_SAY]: {
        subjective: 'they',
        objective: 'them',
        possessive: 'their',
      },
      [Gender.CUSTOM]: {
        subjective: 'they',
        objective: 'them',
        possessive: 'their',
      },
    };

    return pronouns[gender] || pronouns[Gender.PREFER_NOT_TO_SAY];
  }
}
