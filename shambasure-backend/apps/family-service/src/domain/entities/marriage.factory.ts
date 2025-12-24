// src/family-service/src/domain/entities/marriage.factory.ts
import { UniqueEntityID } from '../base/unique-entity-id';
import {
  KenyanCounty,
  MarriageEndReason,
  MarriageStatus,
  MarriageType,
} from '../value-objects/family-enums.vo';
import { Marriage, MarriageProps } from './marriage.entity';

/**
 * Marriage Factory
 *
 * Innovations:
 * 1. Smart marriage creation with cultural context
 * 2. Default witness generation
 * 3. Legal requirement auto-completion
 * 4. Marriage type-specific validations
 * 5. Template-based creation for common scenarios
 */
export class MarriageFactory {
  /**
   * Create civil marriage (registry)
   */
  public static createCivilMarriage(
    spouse1Id: UniqueEntityID,
    spouse2Id: UniqueEntityID,
    startDate: Date,
    registrationNumber: string,
    createdBy: UniqueEntityID,
    options?: {
      ceremonyLocation?: string;
      ceremonyCounty?: KenyanCounty;
      witnesses?: string[];
      prenuptialAgreement?: boolean;
    },
  ): Marriage {
    const props: MarriageProps = {
      spouse1Id,
      spouse2Id,
      marriageType: MarriageType.CIVIL,
      marriageStatus: MarriageStatus.MARRIED,
      startDate,
      registrationNumber,
      registrationDistrict: this.detectDistrictFromRegistration(registrationNumber),
      registeredBy: 'Registrar of Marriages',
      witnesses: options?.witnesses || this.generateDefaultWitnesses(),
      bridePricePaid: false,
      bridePaidInFull: false,
      isPolygamous: false,
      numberOfChildren: 0,
      childrenIds: [],
      jointProperty: true,
      isMarriageDissolved: false,
      waitingPeriodCompleted: true,
      createdBy,
      lastUpdatedBy: createdBy,
      verificationStatus: 'VERIFIED', // Civil marriages are pre-verified
      isArchived: false,
      ceremonyLocation: options?.ceremonyLocation,
      ceremonyCounty: options?.ceremonyCounty,
      prenuptialAgreement: options?.prenuptialAgreement,
    };

    return Marriage.create(props);
  }

  /**
   * Create Christian marriage (church)
   */
  public static createChristianMarriage(
    spouse1Id: UniqueEntityID,
    spouse2Id: UniqueEntityID,
    startDate: Date,
    churchDetails: {
      churchName: string;
      pastorName: string;
      location: string;
      county: KenyanCounty;
    },
    createdBy: UniqueEntityID,
    options?: {
      marriageCertificateNumber?: string;
      witnesses?: string[];
      marriageBlessings?: string[];
    },
  ): Marriage {
    const props: MarriageProps = {
      spouse1Id,
      spouse2Id,
      marriageType: MarriageType.CHRISTIAN,
      marriageStatus: MarriageStatus.MARRIED,
      startDate,
      registrationNumber: options?.marriageCertificateNumber,
      registrationDistrict: churchDetails.county,
      registeredBy: churchDetails.pastorName,
      ceremonyLocation: churchDetails.churchName,
      ceremonyCounty: churchDetails.county,
      witnesses: options?.witnesses || this.generateChurchWitnesses(),
      bridePricePaid: false,
      bridePaidInFull: false,
      isPolygamous: false,
      numberOfChildren: 0,
      childrenIds: [],
      jointProperty: true,
      isMarriageDissolved: false,
      waitingPeriodCompleted: true,
      createdBy,
      lastUpdatedBy: createdBy,
      verificationStatus: 'PENDING_VERIFICATION',
      isArchived: false,
      marriageBlessings: options?.marriageBlessings || [
        'May God bless this union',
        'Till death do us part',
      ],
    };

    return Marriage.create(props);
  }

  /**
   * Create Islamic marriage (Nikkah)
   */
  public static createIslamicMarriage(
    spouse1Id: UniqueEntityID,
    spouse2Id: UniqueEntityID,
    startDate: Date,
    islamicDetails: {
      imamName: string;
      mosqueLocation: string;
      mahrAmount: number; // Dowry
      witnesses: string[];
      waliName?: string; // Guardian
    },
    createdBy: UniqueEntityID,
    options?: {
      isPolygamous?: boolean;
      polygamousHouseId?: UniqueEntityID;
      marriageOrder?: number;
      registrationNumber?: string;
    },
  ): Marriage {
    const props: MarriageProps = {
      spouse1Id,
      spouse2Id,
      marriageType: MarriageType.ISLAMIC,
      marriageStatus: MarriageStatus.MARRIED, // Polygamous marriages are still MARRIED
      startDate,
      registrationNumber: options?.registrationNumber,
      registrationDistrict: this.extractCountyFromLocation(islamicDetails.mosqueLocation),
      registeredBy: islamicDetails.imamName,
      ceremonyLocation: islamicDetails.mosqueLocation,
      witnesses: islamicDetails.witnesses,
      bridePricePaid: true,
      bridePriceAmount: islamicDetails.mahrAmount,
      bridePriceCurrency: 'KES',
      bridePaidInFull: true, // Mahr is required upfront in Islam
      isPolygamous: options?.isPolygamous || false,
      polygamousHouseId: options?.polygamousHouseId,
      marriageOrder: options?.marriageOrder,
      numberOfChildren: 0,
      childrenIds: [],
      jointProperty: false, // Islamic law has specific property rules
      isMarriageDissolved: false,
      waitingPeriodCompleted: true,
      createdBy,
      lastUpdatedBy: createdBy,
      verificationStatus: 'PENDING_VERIFICATION',
      isArchived: false,
      customaryDetails: {
        eldersPresent: [
          islamicDetails.imamName,
          ...(islamicDetails.waliName ? [islamicDetails.waliName] : []),
        ],
        location: islamicDetails.mosqueLocation,
        clanRepresentatives: [],
        traditionalRitesPerformed: ['Nikkah', 'Sermon', 'Mahr Agreement'],
      },
      marriageBlessings: ['In the name of Allah, the Most Gracious, the Most Merciful'],
    };

    return Marriage.create(props);
  }

  /**
   * Create customary marriage (traditional)
   */
  public static createCustomaryMarriage(
    spouse1Id: UniqueEntityID,
    spouse2Id: UniqueEntityID,
    startDate: Date,
    customaryDetails: {
      eldersPresent: string[];
      location: string;
      bridePrice: {
        amount: number;
        currency: string;
        paidInFull: boolean;
        paymentSchedule?: Array<{ date: Date; amount: number }>;
      };
      traditionalRites: string[];
      clanRepresentatives: string[];
    },
    createdBy: UniqueEntityID,
    options?: {
      isPolygamous?: boolean;
      polygamousHouseId?: UniqueEntityID;
      marriageOrder?: number;
      livestockExchanged?: number;
    },
  ): Marriage {
    const props: MarriageProps = {
      spouse1Id,
      spouse2Id,
      marriageType: MarriageType.CUSTOMARY,
      marriageStatus: MarriageStatus.MARRIED, // Polygamous marriages are still MARRIED
      startDate,
      ceremonyLocation: customaryDetails.location,
      witnesses: customaryDetails.eldersPresent,
      bridePricePaid: true,
      bridePriceAmount: customaryDetails.bridePrice.amount,
      bridePriceCurrency: customaryDetails.bridePrice.currency,
      bridePaidInFull: customaryDetails.bridePrice.paidInFull,
      isPolygamous: options?.isPolygamous || false,
      polygamousHouseId: options?.polygamousHouseId,
      marriageOrder: options?.marriageOrder,
      numberOfChildren: 0,
      childrenIds: [],
      jointProperty: true,
      isMarriageDissolved: false,
      waitingPeriodCompleted: true,
      createdBy,
      lastUpdatedBy: createdBy,
      verificationStatus: 'PENDING_VERIFICATION',
      isArchived: false,
      customaryDetails: {
        eldersPresent: customaryDetails.eldersPresent,
        location: customaryDetails.location,
        clanRepresentatives: customaryDetails.clanRepresentatives,
        traditionalRitesPerformed: customaryDetails.traditionalRites,
        livestockExchanged: options?.livestockExchanged,
      },
      marriageSeason: this.detectMarriageSeason(startDate),
      traditionalGiftsExchanged: ['Blankets', 'Hoes', 'Livestock', 'Jewelry'],
    };

    return Marriage.create(props);
  }

  /**
   * Create cohabitation record (Come-we-stay)
   */
  public static createCohabitation(
    partner1Id: UniqueEntityID,
    partner2Id: UniqueEntityID,
    startDate: Date,
    evidence: {
      affidavitId: string;
      witnesses: string[];
      proofOfResidence?: string;
    },
    createdBy: UniqueEntityID,
    options?: {
      hasChildren?: boolean;
      childrenIds?: UniqueEntityID[];
    },
  ): Marriage {
    const props: MarriageProps = {
      spouse1Id: partner1Id,
      spouse2Id: partner2Id,
      marriageType: MarriageType.OTHER, // Use OTHER for cohabitation
      marriageStatus: MarriageStatus.MARRIED, // Treat as married for legal purposes
      startDate,
      witnesses: evidence.witnesses,
      bridePricePaid: false,
      bridePaidInFull: false,
      isPolygamous: false,
      numberOfChildren: options?.childrenIds?.length || 0,
      childrenIds: options?.childrenIds || [],
      jointProperty: false,
      isMarriageDissolved: false,
      waitingPeriodCompleted: true,
      createdBy,
      lastUpdatedBy: createdBy,
      verificationStatus: 'PENDING_VERIFICATION',
      isArchived: false,
      cohabitationAffidavitId: evidence.affidavitId,
      customaryDetails: {
        eldersPresent: evidence.witnesses,
        location: '',
        clanRepresentatives: [],
        traditionalRitesPerformed: ['Cohabitation Agreement'],
      },
    };

    return Marriage.create(props);
  }

  /**
   * Create Hindu marriage
   */
  public static createHinduMarriage(
    spouse1Id: UniqueEntityID,
    spouse2Id: UniqueEntityID,
    startDate: Date,
    hinduDetails: {
      templeName: string;
      priestName: string;
      location: string;
      county: KenyanCounty;
      ritualsPerformed: string[];
    },
    createdBy: UniqueEntityID,
    options?: {
      marriageCertificateNumber?: string;
      witnesses?: string[];
    },
  ): Marriage {
    const props: MarriageProps = {
      spouse1Id,
      spouse2Id,
      marriageType: MarriageType.HINDU,
      marriageStatus: MarriageStatus.MARRIED,
      startDate,
      registrationNumber: options?.marriageCertificateNumber,
      registrationDistrict: hinduDetails.county,
      registeredBy: hinduDetails.priestName,
      ceremonyLocation: hinduDetails.templeName,
      ceremonyCounty: hinduDetails.county,
      witnesses: options?.witnesses || ['Witness 1', 'Witness 2'],
      bridePricePaid: false,
      bridePaidInFull: false,
      isPolygamous: false,
      numberOfChildren: 0,
      childrenIds: [],
      jointProperty: true,
      isMarriageDissolved: false,
      waitingPeriodCompleted: true,
      createdBy,
      lastUpdatedBy: createdBy,
      verificationStatus: 'PENDING_VERIFICATION',
      isArchived: false,
      customaryDetails: {
        eldersPresent: [hinduDetails.priestName],
        location: hinduDetails.templeName,
        clanRepresentatives: [],
        traditionalRitesPerformed: hinduDetails.ritualsPerformed,
      },
      marriageBlessings: ['Om Shanti Shanti Shanti'],
    };

    return Marriage.create(props);
  }

  /**
   * Create marriage from legacy data
   */
  public static createFromLegacyData(
    legacyData: Record<string, any>,
    createdBy: UniqueEntityID,
  ): Marriage {
    // Map legacy data to modern format
    const marriageType = this.mapLegacyMarriageType(legacyData.marriage_type || legacyData.type);
    const marriageStatus = this.mapLegacyMarriageStatus(
      legacyData.status || legacyData.marital_status,
    );

    const props: MarriageProps = {
      spouse1Id: new UniqueEntityID(legacyData.spouse1_id || legacyData.husband_id),
      spouse2Id: new UniqueEntityID(legacyData.spouse2_id || legacyData.wife_id),
      marriageType,
      marriageStatus,
      startDate: new Date(legacyData.start_date || legacyData.marriage_date),
      endDate: legacyData.end_date ? new Date(legacyData.end_date) : undefined,
      endReason: this.mapLegacyEndReason(legacyData.end_reason),
      registrationNumber: legacyData.registration_no || legacyData.certificate_no,
      registrationDistrict: legacyData.district,
      registeredBy: legacyData.registered_by,
      ceremonyLocation: legacyData.location || legacyData.venue,
      ceremonyCounty: legacyData.county as KenyanCounty,
      witnesses: this.parseLegacyWitnesses(legacyData.witnesses),
      bridePricePaid: legacyData.bride_price_paid === true || legacyData.bride_price_paid === 'YES',
      bridePriceAmount: legacyData.bride_price_amount,
      bridePriceCurrency: legacyData.bride_price_currency || 'KES',
      bridePaidInFull: legacyData.bride_paid_full === true,
      isPolygamous: legacyData.is_polygamous === true,
      polygamousHouseId: legacyData.polygamous_house_id
        ? new UniqueEntityID(legacyData.polygamous_house_id)
        : undefined,
      marriageOrder: legacyData.marriage_order,
      numberOfChildren: legacyData.number_of_children || 0,
      childrenIds: (legacyData.children_ids || []).map((id: string) => new UniqueEntityID(id)),
      jointProperty: legacyData.joint_property !== false,
      prenuptialAgreement: legacyData.prenup === true,
      isMarriageDissolved: legacyData.dissolved === true,
      dissolutionDate: legacyData.dissolution_date
        ? new Date(legacyData.dissolution_date)
        : undefined,
      waitingPeriodCompleted: legacyData.waiting_period_completed === true,
      createdBy,
      lastUpdatedBy: createdBy,
      verificationStatus: this.mapLegacyVerification(legacyData.verification_status),
      verificationNotes: legacyData.verification_notes,
      isArchived: legacyData.archived === true,
      customaryDetails: legacyData.customary_details,
      marriageCertificateId: legacyData.certificate_document_id,
      cohabitationAffidavitId: legacyData.affidavit_id,
      divorceDecreeId: legacyData.divorce_decree_id,
      marriageSeason: legacyData.season,
      marriageBlessings: legacyData.blessings,
      traditionalGiftsExchanged: legacyData.gifts,
    };

    return Marriage.create(props);
  }

  /**
   * Generate template for quick marriage addition
   */
  public static createTemplate(
    templateType: 'CIVIL' | 'CHRISTIAN' | 'ISLAMIC' | 'CUSTOMARY' | 'OTHER' | 'HINDU',
    spouse1Id: UniqueEntityID,
    spouse2Id: UniqueEntityID,
    createdBy: UniqueEntityID,
  ): Partial<MarriageProps> {
    const baseTemplate: Partial<MarriageProps> = {
      spouse1Id,
      spouse2Id,
      marriageStatus: MarriageStatus.MARRIED,
      startDate: new Date(),
      bridePricePaid: false,
      bridePaidInFull: false,
      isPolygamous: false,
      numberOfChildren: 0,
      childrenIds: [],
      jointProperty: true,
      isMarriageDissolved: false,
      waitingPeriodCompleted: true,
      createdBy,
      lastUpdatedBy: createdBy,
      verificationStatus: 'UNVERIFIED',
      isArchived: false,
    };

    switch (templateType) {
      case 'CIVIL':
        return {
          ...baseTemplate,
          marriageType: MarriageType.CIVIL,
          registrationDistrict: 'NAIROBI',
          registeredBy: 'Registrar of Marriages',
          witnesses: ['Witness 1', 'Witness 2'],
        };

      case 'CHRISTIAN':
        return {
          ...baseTemplate,
          marriageType: MarriageType.CHRISTIAN,
          ceremonyLocation: 'Local Church',
          ceremonyCounty: KenyanCounty.NAIROBI,
          registeredBy: 'Pastor',
          witnesses: ['Best Man', 'Maid of Honor'],
          marriageBlessings: ['God bless this union'],
        };

      case 'ISLAMIC':
        return {
          ...baseTemplate,
          marriageType: MarriageType.ISLAMIC,
          bridePricePaid: true,
          bridePriceAmount: 50000,
          bridePriceCurrency: 'KES',
          bridePaidInFull: true,
          jointProperty: false,
          ceremonyLocation: 'Local Mosque',
          registeredBy: 'Imam',
          witnesses: ['Witness 1', 'Witness 2'],
          customaryDetails: {
            eldersPresent: ['Imam', 'Wali'],
            location: 'Mosque',
            clanRepresentatives: [],
            traditionalRitesPerformed: ['Nikkah'],
          },
        };

      case 'CUSTOMARY':
        return {
          ...baseTemplate,
          marriageType: MarriageType.CUSTOMARY,
          bridePricePaid: true,
          bridePriceAmount: 100000,
          bridePriceCurrency: 'KES',
          bridePaidInFull: false,
          ceremonyLocation: 'Family Home',
          witnesses: ['Elder 1', 'Elder 2'],
          customaryDetails: {
            eldersPresent: ['Elder 1', 'Elder 2'],
            location: 'Family Home',
            clanRepresentatives: ['Clan Representative'],
            traditionalRitesPerformed: ['Introduction', 'Negotiations'],
          },
          marriageSeason: this.detectMarriageSeason(new Date()),
        };

      case 'OTHER':
        return {
          ...baseTemplate,
          marriageType: MarriageType.OTHER,
          jointProperty: false,
          witnesses: ['Friend 1', 'Friend 2'],
          customaryDetails: {
            eldersPresent: ['Friend 1', 'Friend 2'],
            location: 'Shared Residence',
            clanRepresentatives: [],
            traditionalRitesPerformed: ['Cohabitation Agreement'],
          },
        };

      case 'HINDU':
        return {
          ...baseTemplate,
          marriageType: MarriageType.HINDU,
          ceremonyLocation: 'Hindu Temple',
          ceremonyCounty: KenyanCounty.NAIROBI,
          registeredBy: 'Priest',
          witnesses: ['Witness 1', 'Witness 2'],
          customaryDetails: {
            eldersPresent: ['Priest'],
            location: 'Temple',
            clanRepresentatives: [],
            traditionalRitesPerformed: ['Saptapadi', 'Kanyadaan'],
          },
        };

      default:
        return baseTemplate;
    }
  }

  // Helper Methods
  private static generateDefaultWitnesses(): string[] {
    return ['Witness A', 'Witness B'];
  }

  private static generateChurchWitnesses(): string[] {
    return ['Best Man', 'Maid of Honor'];
  }

  private static detectDistrictFromRegistration(registrationNumber: string): string {
    // Extract district code from registration number pattern
    const patterns: Record<string, string> = {
      NRB: 'NAIROBI',
      MSA: 'MOMBASA',
      KSM: 'KISUMU',
      NKR: 'NAKURU',
    };

    for (const [code, district] of Object.entries(patterns)) {
      if (registrationNumber.includes(code)) {
        return district;
      }
    }

    return 'UNKNOWN';
  }

  private static extractCountyFromLocation(location: string): KenyanCounty {
    const countyKeywords: Record<string, KenyanCounty> = {
      nairobi: KenyanCounty.NAIROBI,
      mombasa: KenyanCounty.MOMBASA,
      kisumu: KenyanCounty.KISUMU,
      nakuru: KenyanCounty.NAKURU,
      eldoret: KenyanCounty.UASIN_GISHU,
    };

    const lowerLocation = location.toLowerCase();
    for (const [keyword, county] of Object.entries(countyKeywords)) {
      if (lowerLocation.includes(keyword)) {
        return county;
      }
    }

    return KenyanCounty.NAIROBI;
  }

  private static detectMarriageSeason(date: Date): string {
    const month = date.getMonth() + 1;

    if (month >= 3 && month <= 5) return 'LONG_RAINS'; // March-May
    if (month >= 10 && month <= 12) return 'SHORT_RAINS'; // October-December
    if (month >= 6 && month <= 9) return 'DRY_SEASON'; // June-September
    return 'HARVEST'; // January-February
  }

  private static mapLegacyMarriageType(legacyType: string): MarriageType {
    const mapping: Record<string, MarriageType> = {
      CIVIL: MarriageType.CIVIL,
      CHRISTIAN: MarriageType.CHRISTIAN,
      ISLAMIC: MarriageType.ISLAMIC,
      MUSLIM: MarriageType.ISLAMIC,
      CUSTOMARY: MarriageType.CUSTOMARY,
      TRADITIONAL: MarriageType.CUSTOMARY, // Map TRADITIONAL to CUSTOMARY
      COHABITATION: MarriageType.OTHER, // Map COHABITATION to OTHER
      COME_WE_STAY: MarriageType.OTHER,
      HINDU: MarriageType.HINDU,
      OTHER: MarriageType.OTHER,
    };

    return mapping[legacyType?.toUpperCase()] || MarriageType.CIVIL;
  }

  private static mapLegacyMarriageStatus(legacyStatus: string): MarriageStatus {
    const mapping: Record<string, MarriageStatus> = {
      ACTIVE: MarriageStatus.MARRIED,
      MARRIED: MarriageStatus.MARRIED,
      DIVORCED: MarriageStatus.DIVORCED,
      WIDOWED: MarriageStatus.WIDOWED,
      SEPARATED: MarriageStatus.SEPARATED,
      ANNULED: MarriageStatus.DIVORCED, // Map ANNULED to DIVORCED
      POLYGAMOUS: MarriageStatus.MARRIED, // Map POLYGAMOUS to MARRIED
      SINGLE: MarriageStatus.SINGLE,
    };

    return mapping[legacyStatus?.toUpperCase()] || MarriageStatus.MARRIED;
  }

  private static mapLegacyEndReason(legacyReason: string): MarriageEndReason | undefined {
    const mapping: Record<string, MarriageEndReason> = {
      DIVORCE: MarriageEndReason.DIVORCE,
      DEATH: MarriageEndReason.DEATH_OF_SPOUSE,
      ANNULMENT: MarriageEndReason.ANNULMENT,
      CUSTOMARY: MarriageEndReason.CUSTOMARY_DISSOLUTION,
      ACTIVE: MarriageEndReason.STILL_ACTIVE,
    };

    return mapping[legacyReason?.toUpperCase()];
  }

  private static parseLegacyWitnesses(witnesses: any): string[] {
    if (!witnesses) return [];

    if (Array.isArray(witnesses)) {
      return witnesses;
    }

    if (typeof witnesses === 'string') {
      return witnesses.split(/[,;]/).map((w) => w.trim());
    }

    return [];
  }

  private static mapLegacyVerification(status: any): MarriageProps['verificationStatus'] {
    const mapping: Record<string, MarriageProps['verificationStatus']> = {
      VERIFIED: 'VERIFIED',
      PENDING: 'PENDING_VERIFICATION',
      REJECTED: 'REJECTED',
      YES: 'VERIFIED',
      NO: 'REJECTED',
      '1': 'VERIFIED',
      '0': 'UNVERIFIED',
    };

    return mapping[status?.toString().toUpperCase()] || 'UNVERIFIED';
  }
}
