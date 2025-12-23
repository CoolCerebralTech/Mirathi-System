// src/family-service/src/domain/entities/polygamous-house.factory.ts
import { UniqueEntityID } from '../base/unique-entity-id';
import { KenyanCounty } from '../value-objects/family-enums.vo';
import { PolygamousHouse, PolygamousHouseProps } from './polygamous-house.entity';

/**
 * Polygamous House Factory
 *
 * Innovations:
 * 1. Smart house creation with cultural context
 * 2. Automatic house code generation
 * 3. Default asset allocation setup
 * 4. Succession planning templates
 * 5. Legacy data transformation
 */
export class PolygamousHouseFactory {
  /**
   * Create customary polygamous house
   */
  public static createCustomaryHouse(
    familyId: UniqueEntityID,
    houseOrder: number,
    originalWifeId: UniqueEntityID,
    establishedDate: Date,
    createdBy: UniqueEntityID,
    options?: {
      houseName?: string;
      establishmentLocation?: string;
      residentialCounty?: KenyanCounty;
      houseHeadId?: UniqueEntityID;
      establishmentWitnesses?: string[];
    },
  ): PolygamousHouse {
    const houseName = options?.houseName || this.generateHouseName(houseOrder);

    const props: PolygamousHouseProps = {
      familyId,
      houseName,
      houseOrder,
      houseCode: '', // Will be auto-generated
      originalWifeId,
      currentWifeId: originalWifeId,
      establishedDate,
      establishmentType: 'CUSTOMARY',
      establishmentWitnesses: options?.establishmentWitnesses || [
        'Clan Elder 1',
        'Clan Elder 2',
        'Family Representative',
      ],
      establishmentLocation: options?.establishmentLocation || 'Family Homestead',
      courtRecognized: false,
      wifeIds: [originalWifeId],
      childrenIds: [],
      memberCount: 1, // Just the wife initially
      houseAssets: [],
      distributionWeight: 1.0,
      isActive: true,
      hasSeparateHomestead: true,
      financialDependents: 0,
      createdBy,
      lastUpdatedBy: createdBy,
      verificationStatus: 'PENDING_COURT',
      isArchived: false,
      houseHeadId: options?.houseHeadId || originalWifeId,
      residentialCounty: options?.residentialCounty,
    };

    return PolygamousHouse.create(props);
  }

  /**
   * Create Islamic polygamous house
   */
  public static createIslamicHouse(
    familyId: UniqueEntityID,
    houseOrder: number,
    wifeId: UniqueEntityID,
    marriageDate: Date,
    createdBy: UniqueEntityID,
    options?: {
      houseName?: string;
      mosqueLocation?: string;
      imamName?: string;
      mahrAmount?: number;
      courtRecognized?: boolean;
    },
  ): PolygamousHouse {
    const houseName = options?.houseName || `House of ${this.getOrdinal(houseOrder)} Wife`;

    const props: PolygamousHouseProps = {
      familyId,
      houseName,
      houseOrder,
      houseCode: '', // Will be auto-generated
      originalWifeId: wifeId,
      currentWifeId: wifeId,
      establishedDate: marriageDate,
      establishmentType: 'ISLAMIC',
      establishmentWitnesses: [options?.imamName || 'Imam', 'Witness 1', 'Witness 2', 'Wali'],
      establishmentLocation: options?.mosqueLocation || 'Local Mosque',
      courtRecognized: options?.courtRecognized || false,
      wifeIds: [wifeId],
      childrenIds: [],
      memberCount: 1,
      houseAssets: [],
      distributionWeight: 1.0,
      isActive: true,
      hasSeparateHomestead: houseOrder === 1, // First wife usually has separate homestead
      financialDependents: 0,
      createdBy,
      lastUpdatedBy: createdBy,
      verificationStatus: options?.courtRecognized ? 'VERIFIED' : 'PENDING_COURT',
      isArchived: false,
      houseHeadId: wifeId,
    };

    // Add Mahr as initial asset if provided
    if (options?.mahrAmount) {
      props.houseAssets = [
        {
          assetId: `MAHR_${wifeId.toString()}`,
          assetType: 'CASH',
          estimatedValue: options.mahrAmount,
          allocationPercentage: 100,
        },
      ];
    }

    return PolygamousHouse.create(props);
  }

  /**
   * Create court-recognized polygamous house
   */
  public static createCourtRecognizedHouse(
    familyId: UniqueEntityID,
    houseOrder: number,
    wifeId: UniqueEntityID,
    courtDetails: {
      courtCaseNumber: string;
      recognitionDate: Date;
      judgeName: string;
      courtStation: string;
    },
    createdBy: UniqueEntityID,
    options?: {
      houseName?: string;
      originalMarriageDate?: Date;
      childrenIds?: UniqueEntityID[];
    },
  ): PolygamousHouse {
    const houseName = options?.houseName || `Court-Recognized House ${houseOrder}`;

    const props: PolygamousHouseProps = {
      familyId,
      houseName,
      houseOrder,
      houseCode: '', // Will be auto-generated
      originalWifeId: wifeId,
      currentWifeId: wifeId,
      establishedDate: options?.originalMarriageDate || courtDetails.recognitionDate,
      establishmentType: 'COURT_RECOGNIZED',
      establishmentWitnesses: [courtDetails.judgeName, 'Court Clerk', 'Legal Representative'],
      establishmentLocation: courtDetails.courtStation,
      courtRecognized: true,
      courtRecognitionDate: courtDetails.recognitionDate,
      courtCaseNumber: courtDetails.courtCaseNumber,
      wifeIds: [wifeId],
      childrenIds: options?.childrenIds || [],
      memberCount: 1 + (options?.childrenIds?.length || 0),
      houseAssets: [],
      distributionWeight: 1.0,
      isActive: true,
      hasSeparateHomestead: true,
      financialDependents: options?.childrenIds?.length || 0,
      createdBy,
      lastUpdatedBy: createdBy,
      verificationStatus: 'VERIFIED',
      isArchived: false,
      houseHeadId: wifeId,
    };

    return PolygamousHouse.create(props);
  }

  /**
   * Create house from existing marriage
   */
  public static createHouseFromMarriage(
    familyId: UniqueEntityID,
    marriageId: UniqueEntityID,
    wifeId: UniqueEntityID,
    marriageDate: Date,
    marriageType: 'CUSTOMARY' | 'ISLAMIC' | 'TRADITIONAL',
    createdBy: UniqueEntityID,
    options?: {
      houseOrder?: number;
      childrenIds?: UniqueEntityID[];
      bridePricePaid?: boolean;
      bridePriceAmount?: number;
    },
  ): PolygamousHouse {
    const houseOrder = options?.houseOrder || 1;
    const houseName = this.generateHouseName(houseOrder);

    const props: PolygamousHouseProps = {
      familyId,
      houseName,
      houseOrder,
      houseCode: '', // Will be auto-generated
      originalWifeId: wifeId,
      currentWifeId: wifeId,
      establishedDate: marriageDate,
      establishmentType: marriageType,
      establishmentWitnesses: ['Marriage Witness 1', 'Marriage Witness 2', 'Clan Elder'],
      courtRecognized: false,
      wifeIds: [wifeId],
      childrenIds: options?.childrenIds || [],
      memberCount: 1 + (options?.childrenIds?.length || 0),
      houseAssets: [],
      distributionWeight: 1.0,
      isActive: true,
      hasSeparateHomestead: true,
      financialDependents: options?.childrenIds?.length || 0,
      createdBy,
      lastUpdatedBy: createdBy,
      verificationStatus: 'UNVERIFIED',
      isArchived: false,
      houseHeadId: wifeId,
    };

    // Add bride price as asset if paid
    if (options?.bridePricePaid && options?.bridePriceAmount) {
      props.houseAssets.push({
        assetId: `BRIDE_PRICE_${marriageId.toString()}`,
        assetType: 'CASH',
        estimatedValue: options.bridePriceAmount,
        allocationPercentage: 100,
      });
    }

    return PolygamousHouse.create(props);
  }

  /**
   * Create house from legacy data
   */
  public static createFromLegacyData(
    legacyData: Record<string, any>,
    createdBy: UniqueEntityID,
  ): PolygamousHouse {
    const props: PolygamousHouseProps = {
      familyId: new UniqueEntityID(legacyData.family_id),
      houseName: legacyData.house_name || `House ${legacyData.house_order}`,
      houseOrder: legacyData.house_order || 1,
      houseCode: legacyData.house_code || '',
      originalWifeId: new UniqueEntityID(legacyData.original_wife_id),
      currentWifeId: legacyData.current_wife_id
        ? new UniqueEntityID(legacyData.current_wife_id)
        : undefined,
      establishedDate: new Date(legacyData.established_date),
      establishmentType: this.mapLegacyEstablishmentType(legacyData.establishment_type),
      establishmentWitnesses: legacyData.witnesses || [],
      establishmentLocation: legacyData.location,
      courtRecognized: legacyData.court_recognized === true,
      courtRecognitionDate: legacyData.recognition_date
        ? new Date(legacyData.recognition_date)
        : undefined,
      courtCaseNumber: legacyData.court_case_number,
      recognitionDocumentId: legacyData.recognition_doc_id,
      wifeIds: (legacyData.wife_ids || []).map((id: string) => new UniqueEntityID(id)),
      childrenIds: (legacyData.children_ids || []).map((id: string) => new UniqueEntityID(id)),
      memberCount: legacyData.member_count || 0,
      houseAssets: legacyData.assets || [],
      distributionWeight: legacyData.distribution_weight || 1.0,
      specialAllocation: legacyData.special_allocation,
      isActive: legacyData.is_active !== false,
      dissolutionDate: legacyData.dissolution_date
        ? new Date(legacyData.dissolution_date)
        : undefined,
      dissolutionReason: legacyData.dissolution_reason,
      houseColor: legacyData.house_color,
      houseSymbol: legacyData.house_symbol,
      traditionalName: legacyData.traditional_name,
      houseMotto: legacyData.motto,
      primaryResidence: legacyData.residence,
      residentialCounty: legacyData.residential_county as KenyanCounty,
      hasSeparateHomestead: legacyData.separate_homestead === true,
      houseMonthlyExpenses: legacyData.monthly_expenses,
      houseAnnualIncome: legacyData.annual_income,
      financialDependents: legacyData.financial_dependents || 0,
      successorId: legacyData.successor_id
        ? new UniqueEntityID(legacyData.successor_id)
        : undefined,
      successionRules: legacyData.succession_rules,
      createdBy,
      lastUpdatedBy: createdBy,
      verificationStatus: this.mapLegacyVerification(legacyData.verification_status),
      verificationNotes: legacyData.verification_notes,
      lastAuditedAt: legacyData.last_audited ? new Date(legacyData.last_audited) : undefined,
      isArchived: legacyData.archived === true,
      houseHeadId: legacyData.house_head_id
        ? new UniqueEntityID(legacyData.house_head_id)
        : undefined,
    };

    return PolygamousHouse.create(props);
  }

  /**
   * Generate template for quick house creation
   */
  public static createTemplate(
    templateType: 'CUSTOMARY' | 'ISLAMIC' | 'COURT_RECOGNIZED',
    familyId: UniqueEntityID,
    houseOrder: number,
    wifeId: UniqueEntityID,
    createdBy: UniqueEntityID,
  ): Partial<PolygamousHouseProps> {
    const baseTemplate: Partial<PolygamousHouseProps> = {
      familyId,
      houseOrder,
      originalWifeId: wifeId,
      currentWifeId: wifeId,
      establishedDate: new Date(),
      wifeIds: [wifeId],
      childrenIds: [],
      memberCount: 1,
      houseAssets: [],
      distributionWeight: 1.0,
      isActive: true,
      hasSeparateHomestead: true,
      financialDependents: 0,
      createdBy,
      lastUpdatedBy: createdBy,
      isArchived: false,
      houseHeadId: wifeId,
    };

    switch (templateType) {
      case 'CUSTOMARY':
        return {
          ...baseTemplate,
          establishmentType: 'CUSTOMARY',
          establishmentWitnesses: ['Clan Elder 1', 'Clan Elder 2'],
          establishmentLocation: 'Family Homestead',
          courtRecognized: false,
          verificationStatus: 'PENDING_COURT',
          traditionalName: 'Nyumba ya Kienyeji',
          houseMotto: 'Unity in tradition',
        };

      case 'ISLAMIC':
        return {
          ...baseTemplate,
          establishmentType: 'ISLAMIC',
          establishmentWitnesses: ['Imam', 'Witness 1', 'Witness 2'],
          establishmentLocation: 'Mosque',
          courtRecognized: false,
          verificationStatus: 'PENDING_COURT',
          houseMotto: 'In the name of Allah',
        };

      case 'COURT_RECOGNIZED':
        return {
          ...baseTemplate,
          establishmentType: 'COURT_RECOGNIZED',
          establishmentWitnesses: ['Judge', 'Court Clerk'],
          establishmentLocation: 'High Court',
          courtRecognized: true,
          courtRecognitionDate: new Date(),
          courtCaseNumber: `CIVIL CASE ${new Date().getFullYear()}/${Math.floor(Math.random() * 1000)}`,
          verificationStatus: 'VERIFIED',
        };

      default:
        return baseTemplate;
    }
  }

  // Helper Methods
  private static generateHouseName(houseOrder: number): string {
    const ordinals = [
      'First',
      'Second',
      'Third',
      'Fourth',
      'Fifth',
      'Sixth',
      'Seventh',
      'Eighth',
      'Ninth',
      'Tenth',
    ];
    const houseNames = [
      'House of Wisdom',
      'House of Strength',
      'House of Peace',
      'House of Prosperity',
      'House of Unity',
      'House of Heritage',
      'House of Legacy',
      'House of Tradition',
      'House of Hope',
      'House of Future',
    ];

    const ordinal = houseOrder <= ordinals.length ? ordinals[houseOrder - 1] : `${houseOrder}th`;
    const houseName = houseNames[(houseOrder - 1) % houseNames.length];

    return `${ordinal} House - ${houseName}`;
  }

  private static getOrdinal(n: number): string {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  }

  private static mapLegacyEstablishmentType(
    legacyType: string,
  ): PolygamousHouseProps['establishmentType'] {
    const mapping: Record<string, PolygamousHouseProps['establishmentType']> = {
      CUSTOMARY: 'CUSTOMARY',
      ISLAMIC: 'ISLAMIC',
      TRADITIONAL: 'TRADITIONAL',
      COURT: 'COURT_RECOGNIZED',
      LEGAL: 'COURT_RECOGNIZED',
    };

    return mapping[legacyType?.toUpperCase()] || 'CUSTOMARY';
  }

  private static mapLegacyVerification(
    legacyStatus: any,
  ): PolygamousHouseProps['verificationStatus'] {
    const mapping: Record<string, PolygamousHouseProps['verificationStatus']> = {
      VERIFIED: 'VERIFIED',
      PENDING: 'PENDING_COURT',
      REJECTED: 'REJECTED',
      COURT_PENDING: 'PENDING_COURT',
      YES: 'VERIFIED',
      NO: 'REJECTED',
      '1': 'VERIFIED',
      '0': 'UNVERIFIED',
    };

    return mapping[legacyStatus?.toString().toUpperCase()] || 'UNVERIFIED';
  }
}
