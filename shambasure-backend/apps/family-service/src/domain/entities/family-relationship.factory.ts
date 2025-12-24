// src/family-service/src/domain/entities/family-relationship.factory.ts
import { UniqueEntityID } from '../base/unique-entity-id';
import { KenyanLawSection, RelationshipType } from '../value-objects/family-enums.vo';
import { FamilyRelationship, FamilyRelationshipProps } from './family-relationship.entity';

/**
 * Family Relationship Factory
 *
 * Innovations:
 * 1. Smart relationship inference and creation
 * 2. Automatic inverse relationship generation
 * 3. Legal basis auto-assignment based on relationship type
 * 4. Cultural context detection
 * 5. Template-based relationship creation
 */
export class FamilyRelationshipFactory {
  /**
   * Create parent-child relationship
   */
  public static createParentChildRelationship(
    familyId: UniqueEntityID,
    parentId: UniqueEntityID,
    childId: UniqueEntityID,
    isBiological: boolean,
    createdBy: UniqueEntityID,
    options?: {
      isLegal?: boolean;
      adoptionOrderId?: string;
      birthCertificateId?: string;
      dnaTestId?: string;
      dnaMatchPercentage?: number;
    },
  ): FamilyRelationship {
    const legalDocuments: string[] = [];

    if (options?.birthCertificateId) {
      legalDocuments.push(options.birthCertificateId);
    }

    if (options?.adoptionOrderId) {
      legalDocuments.push(options.adoptionOrderId);
    }

    const props: FamilyRelationshipProps = {
      familyId,
      fromMemberId: parentId,
      toMemberId: childId,
      relationshipType: RelationshipType.PARENT,
      inverseRelationshipType: RelationshipType.CHILD,
      isBiological,
      isLegal: options?.isLegal || !!options?.adoptionOrderId,
      isCustomary: false,
      isSpiritual: false,
      isActive: true,
      legalDocuments,
      verificationLevel: 'UNVERIFIED',
      verificationScore: 0,
      closenessIndex: 70, // Default parent-child closeness
      contactFrequency: 'WEEKLY',
      isFinancialDependent: true, // Children are typically dependent
      isCareDependent: true,
      dependencyLevel: 'FULL',
      supportProvided: {
        financial: true,
        housing: true,
        medical: true,
        educational: true,
      },
      inheritanceRights: 'FULL',
      disinherited: false,
      hasConflict: false,
      clanRecognized: false,
      elderWitnesses: [],
      customaryRecognition: false,
      relationshipStrength: 0, // Will be calculated
      createdBy,
      lastUpdatedBy: createdBy,
      isArchived: false,
    };

    // Set biological details if available
    if (options?.dnaTestId) {
      props.dnaTestId = options.dnaTestId;
      props.dnaMatchPercentage = options.dnaMatchPercentage;
      props.biologicalConfidence = options.dnaMatchPercentage;
    }

    // Determine legal basis
    if (isBiological) {
      props.legalBasis = [KenyanLawSection.S35_SPOUSAL_CHILDS_SHARE];
    }

    if (options?.adoptionOrderId) {
      props.relationshipType = RelationshipType.ADOPTED_CHILD;
      props.legalBasis = [KenyanLawSection.S29_DEPENDANTS];
    }

    return FamilyRelationship.create(props);
  }

  /**
   * Create spousal relationship
   */
  public static createSpousalRelationship(
    familyId: UniqueEntityID,
    spouse1Id: UniqueEntityID,
    spouse2Id: UniqueEntityID,
    marriageDate: Date,
    createdBy: UniqueEntityID,
    options?: {
      marriageCertificateId?: string;
      marriageType?: 'CIVIL' | 'CUSTOMARY' | 'ISLAMIC' | 'CHRISTIAN' | 'HINDU' | 'OTHER';
      isActive?: boolean;
      divorceDecreeId?: string;
    },
  ): FamilyRelationship {
    const legalDocuments: string[] = [];

    if (options?.marriageCertificateId) {
      legalDocuments.push(options.marriageCertificateId);
    }

    if (options?.divorceDecreeId) {
      legalDocuments.push(options.divorceDecreeId);
    }

    const isActive = options?.isActive !== false;

    const props: FamilyRelationshipProps = {
      familyId,
      fromMemberId: spouse1Id,
      toMemberId: spouse2Id,
      relationshipType: RelationshipType.SPOUSE,
      inverseRelationshipType: RelationshipType.SPOUSE,
      isBiological: false,
      isLegal: !!options?.marriageCertificateId || options?.marriageType === 'CIVIL',
      isCustomary: options?.marriageType === 'CUSTOMARY',
      isSpiritual:
        options?.marriageType === 'CHRISTIAN' ||
        options?.marriageType === 'ISLAMIC' ||
        options?.marriageType === 'HINDU',
      isActive,
      startDate: marriageDate,
      endDate: !isActive ? new Date() : undefined, // Would need actual divorce date
      legalDocuments,
      verificationLevel: options?.marriageCertificateId ? 'PARTIALLY_VERIFIED' : 'UNVERIFIED',
      verificationScore: options?.marriageCertificateId ? 70 : 30,
      closenessIndex: 80, // Default spousal closeness
      contactFrequency: 'DAILY',
      isFinancialDependent: true, // Spouses are often financially interdependent
      isCareDependent: true,
      dependencyLevel: 'PARTIAL',
      supportProvided: {
        financial: true,
        housing: true,
        medical: true,
        educational: false,
      },
      inheritanceRights: 'FULL',
      disinherited: false,
      hasConflict: false,
      clanRecognized: options?.marriageType === 'CUSTOMARY',
      elderWitnesses: options?.marriageType === 'CUSTOMARY' ? ['Elder 1', 'Elder 2'] : [],
      customaryRecognition: options?.marriageType === 'CUSTOMARY',
      relationshipStrength: 0, // Will be calculated
      createdBy,
      lastUpdatedBy: createdBy,
      isArchived: false,
    };

    // Determine legal basis
    props.legalBasis = [KenyanLawSection.S35_SPOUSAL_CHILDS_SHARE];

    if (options?.marriageType === 'CUSTOMARY') {
      props.legalBasis.push(KenyanLawSection.S40_POLY_GAMY);
    }

    return FamilyRelationship.create(props);
  }

  /**
   * Create sibling relationship
   */
  public static createSiblingRelationship(
    familyId: UniqueEntityID,
    sibling1Id: UniqueEntityID,
    sibling2Id: UniqueEntityID,
    isFullSibling: boolean,
    createdBy: UniqueEntityID,
    options?: {
      sameParents?: boolean;
      birthCertificates?: string[];
      dnaTestId?: string;
    },
  ): FamilyRelationship {
    const legalDocuments: string[] = [];

    if (options?.birthCertificates) {
      legalDocuments.push(...options.birthCertificates);
    }

    const relationshipType = isFullSibling
      ? RelationshipType.SIBLING
      : RelationshipType.HALF_SIBLING;

    const props: FamilyRelationshipProps = {
      familyId,
      fromMemberId: sibling1Id,
      toMemberId: sibling2Id,
      relationshipType,
      inverseRelationshipType: relationshipType,
      isBiological: true,
      isLegal: false,
      isCustomary: false,
      isSpiritual: false,
      isActive: true,
      legalDocuments,
      verificationLevel: 'UNVERIFIED',
      verificationScore: 0,
      closenessIndex: 60, // Default sibling closeness
      contactFrequency: 'MONTHLY',
      isFinancialDependent: false,
      isCareDependent: false,
      inheritanceRights: 'PARTIAL',
      disinherited: false,
      hasConflict: false,
      clanRecognized: false,
      elderWitnesses: [],
      customaryRecognition: false,
      relationshipStrength: 0, // Will be calculated
      createdBy,
      lastUpdatedBy: createdBy,
      isArchived: false,
    };

    // Set biological details if available
    if (options?.dnaTestId) {
      props.dnaTestId = options.dnaTestId;
      props.dnaMatchPercentage = isFullSibling ? 50 : 25; // Approximate
      props.biologicalConfidence = 95;
    }

    // Determine legal basis
    props.legalBasis = [KenyanLawSection.S29_DEPENDANTS];

    return FamilyRelationship.create(props);
  }

  /**
   * Create guardian-ward relationship
   */
  public static createGuardianRelationship(
    familyId: UniqueEntityID,
    guardianId: UniqueEntityID,
    wardId: UniqueEntityID,
    guardianshipDate: Date,
    createdBy: UniqueEntityID,
    options?: {
      courtOrderId?: string;
      guardianshipType?: 'TESTAMENTARY' | 'COURT_APPOINTED' | 'CUSTOMARY';
      isTemporary?: boolean;
      responsibilities?: string[];
    },
  ): FamilyRelationship {
    const legalDocuments: string[] = [];

    if (options?.courtOrderId) {
      legalDocuments.push(options.courtOrderId);
    }

    const props: FamilyRelationshipProps = {
      familyId,
      fromMemberId: guardianId,
      toMemberId: wardId,
      relationshipType: RelationshipType.GUARDIAN,
      inverseRelationshipType: RelationshipType.OTHER, // WARD is not in current enum
      isBiological: false,
      isLegal: !!options?.courtOrderId || options?.guardianshipType === 'COURT_APPOINTED',
      isCustomary: options?.guardianshipType === 'CUSTOMARY',
      isSpiritual: options?.guardianshipType === 'TESTAMENTARY',
      isActive: true,
      startDate: guardianshipDate,
      legalDocuments,
      verificationLevel: options?.courtOrderId ? 'PARTIALLY_VERIFIED' : 'UNVERIFIED',
      verificationScore: options?.courtOrderId ? 80 : 40,
      closenessIndex: 50, // Guardian-ward closeness varies
      contactFrequency: 'WEEKLY',
      isFinancialDependent: true,
      isCareDependent: true,
      dependencyLevel: 'FULL',
      supportProvided: {
        financial: true,
        housing: true,
        medical: true,
        educational: true,
      },
      inheritanceRights: 'NONE', // Guardians don't typically inherit from wards
      disinherited: false,
      hasConflict: false,
      clanRecognized: options?.guardianshipType === 'CUSTOMARY',
      elderWitnesses: options?.guardianshipType === 'CUSTOMARY' ? ['Clan Elder'] : [],
      customaryRecognition: options?.guardianshipType === 'CUSTOMARY',
      relationshipStrength: 0, // Will be calculated
      createdBy,
      lastUpdatedBy: createdBy,
      isArchived: false,
    };

    // Determine legal basis
    if (options?.courtOrderId) {
      props.legalBasis = [
        KenyanLawSection.S70_TESTAMENTARY_GUARDIAN,
        KenyanLawSection.S71_COURT_GUARDIAN,
      ];
    }

    return FamilyRelationship.create(props);
  }

  /**
   * Create extended family relationship
   */
  public static createExtendedFamilyRelationship(
    familyId: UniqueEntityID,
    fromMemberId: UniqueEntityID,
    toMemberId: UniqueEntityID,
    relationshipType: RelationshipType,
    createdBy: UniqueEntityID,
    options?: {
      isBiological?: boolean;
      isCustomary?: boolean;
      customaryTerm?: string;
      clanRecognized?: boolean;
    },
  ): FamilyRelationship {
    // Calculate inverse relationship
    const inverseMap: Record<RelationshipType, RelationshipType> = {
      [RelationshipType.GRANDPARENT]: RelationshipType.GRANDCHILD,
      [RelationshipType.GRANDCHILD]: RelationshipType.GRANDPARENT,
      [RelationshipType.AUNT_UNCLE]: RelationshipType.NIECE_NEPHEW,
      [RelationshipType.NIECE_NEPHEW]: RelationshipType.AUNT_UNCLE,
      [RelationshipType.COUSIN]: RelationshipType.COUSIN,
      [RelationshipType.SPOUSE]: RelationshipType.SPOUSE,
      [RelationshipType.EX_SPOUSE]: RelationshipType.EX_SPOUSE,
      [RelationshipType.CHILD]: RelationshipType.PARENT,
      [RelationshipType.ADOPTED_CHILD]: RelationshipType.PARENT,
      [RelationshipType.STEPCHILD]: RelationshipType.PARENT,
      [RelationshipType.PARENT]: RelationshipType.CHILD,
      [RelationshipType.SIBLING]: RelationshipType.SIBLING,
      [RelationshipType.HALF_SIBLING]: RelationshipType.HALF_SIBLING,
      [RelationshipType.GUARDIAN]: RelationshipType.OTHER,
      [RelationshipType.OTHER]: RelationshipType.OTHER,
    };

    const inverseType = inverseMap[relationshipType] || RelationshipType.COUSIN;

    const props: FamilyRelationshipProps = {
      familyId,
      fromMemberId,
      toMemberId,
      relationshipType,
      inverseRelationshipType: inverseType,
      isBiological: options?.isBiological || false,
      isLegal: false,
      isCustomary: options?.isCustomary || false,
      isSpiritual: false,
      isActive: true,
      legalDocuments: [],
      verificationLevel: 'UNVERIFIED',
      verificationScore: 20,
      closenessIndex: 40, // Extended family typically less close
      contactFrequency: 'YEARLY',
      isFinancialDependent: false,
      isCareDependent: false,
      inheritanceRights: 'PARTIAL',
      disinherited: false,
      hasConflict: false,
      clanRecognized: options?.clanRecognized || false,
      elderWitnesses: [],
      customaryRecognition: options?.isCustomary || false,
      relationshipStrength: 0, // Will be calculated
      createdBy,
      lastUpdatedBy: createdBy,
      isArchived: false,
    };

    // Add cultural context
    if (options?.customaryTerm) {
      props.relationshipTerm = options.customaryTerm;
    }

    // Determine legal basis
    props.legalBasis = [KenyanLawSection.S29_DEPENDANTS];

    return FamilyRelationship.create(props);
  }

  /**
   * Create ex-spouse relationship
   */
  public static createExSpouseRelationship(
    familyId: UniqueEntityID,
    exSpouse1Id: UniqueEntityID,
    exSpouse2Id: UniqueEntityID,
    divorceDate: Date,
    createdBy: UniqueEntityID,
    options?: {
      divorceDecreeId?: string;
      childrenInvolved?: boolean;
      alimonyAgreement?: string;
    },
  ): FamilyRelationship {
    const legalDocuments: string[] = [];

    if (options?.divorceDecreeId) {
      legalDocuments.push(options.divorceDecreeId);
    }

    const props: FamilyRelationshipProps = {
      familyId,
      fromMemberId: exSpouse1Id,
      toMemberId: exSpouse2Id,
      relationshipType: RelationshipType.EX_SPOUSE,
      inverseRelationshipType: RelationshipType.EX_SPOUSE,
      isBiological: false,
      isLegal: true, // Divorce is a legal process
      isCustomary: false,
      isSpiritual: false,
      isActive: false,
      startDate: new Date(), // Would need actual marriage date
      endDate: divorceDate,
      legalDocuments,
      verificationLevel: options?.divorceDecreeId ? 'PARTIALLY_VERIFIED' : 'UNVERIFIED',
      verificationScore: options?.divorceDecreeId ? 70 : 30,
      closenessIndex: 30, // Typically low after divorce
      contactFrequency: options?.childrenInvolved ? 'MONTHLY' : 'RARELY',
      isFinancialDependent: !!options?.alimonyAgreement,
      isCareDependent: false,
      dependencyLevel: options?.alimonyAgreement ? 'PARTIAL' : undefined,
      supportProvided: {
        financial: !!options?.alimonyAgreement,
        housing: false,
        medical: false,
        educational: false,
      },
      inheritanceRights: 'NONE', // Ex-spouses typically don't inherit
      disinherited: true,
      hasConflict: false, // Would need actual conflict info
      clanRecognized: false,
      elderWitnesses: [],
      customaryRecognition: false,
      relationshipStrength: 0, // Will be calculated
      createdBy,
      lastUpdatedBy: createdBy,
      isArchived: false,
    };

    // Determine legal basis
    props.legalBasis = [KenyanLawSection.S29_DEPENDANTS];

    return FamilyRelationship.create(props);
  }

  /**
   * Create relationship from legacy data
   */
  public static createFromLegacyData(
    legacyData: Record<string, any>,
    createdBy: UniqueEntityID,
  ): FamilyRelationship {
    // Map legacy relationship type
    const relationshipType = this.mapLegacyRelationshipType(legacyData.relationship_type);

    const props: FamilyRelationshipProps = {
      familyId: new UniqueEntityID(legacyData.family_id),
      fromMemberId: new UniqueEntityID(legacyData.from_member_id),
      toMemberId: new UniqueEntityID(legacyData.to_member_id),
      relationshipType,
      inverseRelationshipType:
        this.mapLegacyRelationshipType(legacyData.inverse_type) ||
        this.calculateInverseType(relationshipType),
      isBiological: legacyData.is_biological === true,
      isLegal: legacyData.is_legal === true,
      isCustomary: legacyData.is_customary === true,
      isSpiritual: legacyData.is_spiritual === true,
      isActive: legacyData.is_active !== false,
      startDate: legacyData.start_date ? new Date(legacyData.start_date) : undefined,
      endDate: legacyData.end_date ? new Date(legacyData.end_date) : undefined,
      legalBasis: legacyData.legal_basis,
      legalDocuments: legacyData.legal_documents || [],
      courtOrderId: legacyData.court_order_id,
      verificationLevel: this.mapLegacyVerificationLevel(legacyData.verification_level),
      verificationMethod: legacyData.verification_method,
      verificationScore: legacyData.verification_score || 0,
      lastVerifiedAt: legacyData.last_verified ? new Date(legacyData.last_verified) : undefined,
      verifiedBy: legacyData.verified_by ? new UniqueEntityID(legacyData.verified_by) : undefined,
      biologicalConfidence: legacyData.biological_confidence,
      dnaTestId: legacyData.dna_test_id,
      dnaMatchPercentage: legacyData.dna_match_percentage,
      adoptionOrderId: legacyData.adoption_order_id,
      guardianshipOrderId: legacyData.guardianship_order_id,
      marriageId: legacyData.marriage_id ? new UniqueEntityID(legacyData.marriage_id) : undefined,
      customaryRecognition: legacyData.customary_recognition === true,
      clanRecognized: legacyData.clan_recognized === true,
      elderWitnesses: legacyData.elder_witnesses || [],
      traditionalRite: legacyData.traditional_rite,
      relationshipStrength: legacyData.relationship_strength || 0,
      closenessIndex: legacyData.closeness_index || 50,
      contactFrequency: legacyData.contact_frequency || 'MONTHLY',
      isFinancialDependent: legacyData.is_financial_dependent === true,
      isCareDependent: legacyData.is_care_dependent === true,
      dependencyLevel: legacyData.dependency_level,
      supportProvided: legacyData.support_provided,
      inheritanceRights: legacyData.inheritance_rights || 'PARTIAL',
      inheritancePercentage: legacyData.inheritance_percentage,
      disinherited: legacyData.disinherited === true,
      disinheritanceReason: legacyData.disinheritance_reason,
      hasConflict: legacyData.has_conflict === true,
      conflictResolutionStatus: legacyData.conflict_resolution_status,
      relationshipTerm: legacyData.relationship_term,
      culturalSignificance: legacyData.cultural_significance,
      taboos: legacyData.taboos,
      communicationLanguage: legacyData.communication_language,
      createdBy,
      lastUpdatedBy: createdBy,
      notes: legacyData.notes,
      isArchived: legacyData.archived === true,
    };

    return FamilyRelationship.create(props);
  }

  /**
   * Generate template for quick relationship creation
   */
  public static createTemplate(
    templateType: 'PARENT_CHILD' | 'SPOUSAL' | 'SIBLING' | 'GUARDIAN' | 'EXTENDED' | 'EX_SPOUSE',
    familyId: UniqueEntityID,
    fromMemberId: UniqueEntityID,
    toMemberId: UniqueEntityID,
    createdBy: UniqueEntityID,
  ): Partial<FamilyRelationshipProps> {
    const baseTemplate: Partial<FamilyRelationshipProps> = {
      familyId,
      fromMemberId,
      toMemberId,
      isActive: true,
      legalDocuments: [],
      verificationLevel: 'UNVERIFIED',
      verificationScore: 0,
      closenessIndex: 50,
      contactFrequency: 'MONTHLY',
      hasConflict: false,
      clanRecognized: false,
      elderWitnesses: [],
      customaryRecognition: false,
      relationshipStrength: 0,
      createdBy,
      lastUpdatedBy: createdBy,
      isArchived: false,
    };

    switch (templateType) {
      case 'PARENT_CHILD':
        return {
          ...baseTemplate,
          relationshipType: RelationshipType.PARENT,
          inverseRelationshipType: RelationshipType.CHILD,
          isBiological: true,
          closenessIndex: 70,
          contactFrequency: 'WEEKLY',
          isFinancialDependent: true,
          isCareDependent: true,
          dependencyLevel: 'FULL',
          supportProvided: {
            financial: true,
            housing: true,
            medical: true,
            educational: true,
          },
          inheritanceRights: 'FULL',
        };

      case 'SPOUSAL':
        return {
          ...baseTemplate,
          relationshipType: RelationshipType.SPOUSE,
          inverseRelationshipType: RelationshipType.SPOUSE,
          isLegal: true,
          closenessIndex: 80,
          contactFrequency: 'DAILY',
          isFinancialDependent: true,
          isCareDependent: true,
          dependencyLevel: 'PARTIAL',
          supportProvided: {
            financial: true,
            housing: true,
            medical: true,
            educational: false,
          },
          inheritanceRights: 'FULL',
          startDate: new Date(),
        };

      case 'SIBLING':
        return {
          ...baseTemplate,
          relationshipType: RelationshipType.SIBLING,
          inverseRelationshipType: RelationshipType.SIBLING,
          isBiological: true,
          closenessIndex: 60,
          contactFrequency: 'MONTHLY',
          isFinancialDependent: false,
          isCareDependent: false,
          inheritanceRights: 'PARTIAL',
        };

      case 'GUARDIAN':
        return {
          ...baseTemplate,
          relationshipType: RelationshipType.GUARDIAN,
          inverseRelationshipType: RelationshipType.OTHER,
          isLegal: true,
          closenessIndex: 50,
          contactFrequency: 'WEEKLY',
          isFinancialDependent: true,
          isCareDependent: true,
          dependencyLevel: 'FULL',
          supportProvided: {
            financial: true,
            housing: true,
            medical: true,
            educational: true,
          },
          inheritanceRights: 'NONE',
          startDate: new Date(),
        };

      case 'EXTENDED':
        return {
          ...baseTemplate,
          relationshipType: RelationshipType.COUSIN,
          inverseRelationshipType: RelationshipType.COUSIN,
          closenessIndex: 40,
          contactFrequency: 'YEARLY',
          isFinancialDependent: false,
          isCareDependent: false,
          inheritanceRights: 'PARTIAL',
        };

      case 'EX_SPOUSE':
        return {
          ...baseTemplate,
          relationshipType: RelationshipType.EX_SPOUSE,
          inverseRelationshipType: RelationshipType.EX_SPOUSE,
          isLegal: true,
          isActive: false,
          closenessIndex: 30,
          contactFrequency: 'RARELY',
          isFinancialDependent: false,
          isCareDependent: false,
          inheritanceRights: 'NONE',
          disinherited: true,
          endDate: new Date(),
        };

      default:
        return baseTemplate;
    }
  }

  // Helper Methods
  private static mapLegacyRelationshipType(legacyType: string): RelationshipType {
    const mapping: Record<string, RelationshipType> = {
      PARENT: RelationshipType.PARENT,
      CHILD: RelationshipType.CHILD,
      SPOUSE: RelationshipType.SPOUSE,
      EX_SPOUSE: RelationshipType.EX_SPOUSE,
      SIBLING: RelationshipType.SIBLING,
      SIBLING_FULL: RelationshipType.SIBLING,
      SIBLING_HALF: RelationshipType.HALF_SIBLING,
      GRANDPARENT: RelationshipType.GRANDPARENT,
      GRANDCHILD: RelationshipType.GRANDCHILD,
      AUNT: RelationshipType.AUNT_UNCLE,
      UNCLE: RelationshipType.AUNT_UNCLE,
      NIECE: RelationshipType.NIECE_NEPHEW,
      NEPHEW: RelationshipType.NIECE_NEPHEW,
      COUSIN: RelationshipType.COUSIN,
      GUARDIAN: RelationshipType.GUARDIAN,
      WARD: RelationshipType.OTHER, // Map WARD to OTHER
      STEPCHILD: RelationshipType.STEPCHILD,
      ADOPTED_CHILD: RelationshipType.ADOPTED_CHILD,
      // Map legacy types to OTHER
      FOSTER_CHILD: RelationshipType.OTHER,
      CLAN_ELDER: RelationshipType.OTHER,
      AGE_MATE: RelationshipType.OTHER,
      GODPARENT: RelationshipType.OTHER,
      PARTNER: RelationshipType.OTHER,
      COHABITANT: RelationshipType.OTHER,
    };

    return mapping[legacyType?.toUpperCase()] || RelationshipType.OTHER;
  }

  private static calculateInverseType(type: RelationshipType): RelationshipType {
    const inverseMap: Record<RelationshipType, RelationshipType> = {
      [RelationshipType.SPOUSE]: RelationshipType.SPOUSE,
      [RelationshipType.EX_SPOUSE]: RelationshipType.EX_SPOUSE,
      [RelationshipType.CHILD]: RelationshipType.PARENT,
      [RelationshipType.ADOPTED_CHILD]: RelationshipType.PARENT,
      [RelationshipType.STEPCHILD]: RelationshipType.PARENT,
      [RelationshipType.PARENT]: RelationshipType.CHILD,
      [RelationshipType.SIBLING]: RelationshipType.SIBLING,
      [RelationshipType.HALF_SIBLING]: RelationshipType.HALF_SIBLING,
      [RelationshipType.GRANDPARENT]: RelationshipType.GRANDCHILD,
      [RelationshipType.GRANDCHILD]: RelationshipType.GRANDPARENT,
      [RelationshipType.AUNT_UNCLE]: RelationshipType.NIECE_NEPHEW,
      [RelationshipType.NIECE_NEPHEW]: RelationshipType.AUNT_UNCLE,
      [RelationshipType.COUSIN]: RelationshipType.COUSIN,
      [RelationshipType.GUARDIAN]: RelationshipType.OTHER,
      [RelationshipType.OTHER]: RelationshipType.OTHER,
    };

    return inverseMap[type] || RelationshipType.OTHER;
  }

  private static mapLegacyVerificationLevel(
    legacyLevel: string,
  ): FamilyRelationshipProps['verificationLevel'] {
    const mapping: Record<string, FamilyRelationshipProps['verificationLevel']> = {
      VERIFIED: 'FULLY_VERIFIED',
      PARTIAL: 'PARTIALLY_VERIFIED',
      UNVERIFIED: 'UNVERIFIED',
      DISPUTED: 'DISPUTED',
      YES: 'FULLY_VERIFIED',
      NO: 'UNVERIFIED',
      '1': 'FULLY_VERIFIED',
      '0': 'UNVERIFIED',
    };

    return mapping[legacyLevel?.toUpperCase()] || 'UNVERIFIED';
  }
}
