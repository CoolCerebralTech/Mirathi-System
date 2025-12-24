// src/family-service/src/domain/services/family-structure-policy.service.ts
import { FamilyAggregate } from '../aggregates/family.aggregate';
import { UniqueEntityID } from '../base/unique-entity-id';
import { Marriage } from '../entities/marriage.entity';
import { MarriageStatus, MarriageType, RelationshipType } from '../value-objects/family-enums.vo';

export class PolygamyNotAllowedError extends Error {
  constructor() {
    super('Family structure does not allow polygamy');
    this.name = 'PolygamyNotAllowedError';
  }
}

export class MaximumSpousesExceededError extends Error {
  constructor(maxAllowed: number) {
    super(`Maximum of ${maxAllowed} spouses allowed`);
    this.name = 'MaximumSpousesExceededError';
  }
}

export class MarriageAdoptionConflictError extends Error {
  constructor() {
    super('Marriage and adoption create legal conflict');
    this.name = 'MarriageAdoptionConflictError';
  }
}

export class CulturalMarriageViolationError extends Error {
  constructor(violation: string) {
    super(`Cultural marriage violation: ${violation}`);
    this.name = 'CulturalMarriageViolationError';
  }
}

export class FamilyStructurePolicyService {
  // Islamic law: Maximum 4 wives
  private static readonly ISLAMIC_MAX_WIVES = 4;

  // Customary law: Varies by community
  private static readonly CUSTOMARY_MAX_WIVES = 3;

  // Civil/Christian: Strict monogamy
  private static readonly CIVIL_MAX_SPOUSES = 1;

  /**
   * Check if a marriage can be registered based on family structure policies
   */
  static canRegisterMarriage(family: FamilyAggregate, marriage: Marriage): void {
    const spouse1 = family.getMember(marriage.props.spouse1Id);
    const spouse2 = family.getMember(marriage.props.spouse2Id);

    if (!spouse1 || !spouse2) {
      throw new Error('Both spouses must be family members');
    }

    // Check minimum age (18 for civil, varies for customary)
    this.checkMinimumMarriageAge(marriage, spouse1, spouse2);

    // Check polygamy constraints
    this.checkPolygamyConstraints(family, marriage);

    // Check marriage-adoption conflicts
    this.checkMarriageAdoptionConflicts(family, marriage);

    // Check cultural/religious constraints
    this.checkCulturalConstraints(family, marriage);

    // Check consanguinity (blood relationship) restrictions
    this.checkConsanguinityRestrictions(family, marriage);
  }

  /**
   * Check minimum age requirements based on marriage type
   */
  private static checkMinimumMarriageAge(marriage: Marriage, spouse1: any, spouse2: any): void {
    const age1 = spouse1.calculateAge();
    const age2 = spouse2.calculateAge();

    if (age1 === null || age2 === null) {
      throw new Error('Cannot determine age for marriage validation');
    }

    switch (marriage.props.marriageType) {
      case MarriageType.CIVIL:
      case MarriageType.CHRISTIAN:
        if (age1 < 18 || age2 < 18) {
          throw new Error('Both spouses must be at least 18 for civil/Christian marriage');
        }
        break;

      case MarriageType.ISLAMIC:
        if (age1 < 18 || age2 < 16) {
          throw new Error('Islamic marriage requires groom 18+, bride 16+');
        }
        break;

      case MarriageType.CUSTOMARY:
        // Customary law varies - some allow marriage from puberty
        if (age1 < 16 || age2 < 16) {
          throw new Error('Customary marriage requires both spouses to be at least 16');
        }
        break;

      case MarriageType.HINDU:
        if (age1 < 21 || age2 < 18) {
          throw new Error('Hindu marriage requires groom 21+, bride 18+');
        }
        break;
    }
  }

  /**
   * Check polygamy constraints based on marriage type and existing marriages
   */
  private static checkPolygamyConstraints(family: FamilyAggregate, marriage: Marriage): void {
    // Get all active marriages for each spouse
    const spouse1Marriages = family.props.marriages.filter(
      (m) =>
        (m.props.spouse1Id.equals(marriage.props.spouse1Id) ||
          m.props.spouse2Id.equals(marriage.props.spouse1Id)) &&
        // FIX: Use Enum comparison
        m.props.marriageStatus === MarriageStatus.MARRIED &&
        !m.props.isMarriageDissolved,
    );

    const spouse2Marriages = family.props.marriages.filter(
      (m) =>
        (m.props.spouse1Id.equals(marriage.props.spouse2Id) ||
          m.props.spouse2Id.equals(marriage.props.spouse2Id)) &&
        // FIX: Use Enum comparison
        m.props.marriageStatus === MarriageStatus.MARRIED &&
        !m.props.isMarriageDissolved,
    );

    // Determine maximum allowed based on marriage type
    let maxAllowed = this.CIVIL_MAX_SPOUSES;

    switch (marriage.props.marriageType) {
      case MarriageType.ISLAMIC:
        maxAllowed = this.ISLAMIC_MAX_WIVES;

        // Islamic law: Men can have up to 4 wives, women can have only 1 husband
        if (spouse1Marriages.length >= maxAllowed) {
          throw new MaximumSpousesExceededError(maxAllowed);
        }
        if (spouse2Marriages.length >= this.CIVIL_MAX_SPOUSES) {
          throw new MaximumSpousesExceededError(this.CIVIL_MAX_SPOUSES);
        }
        break;

      case MarriageType.CUSTOMARY:
        maxAllowed = this.CUSTOMARY_MAX_WIVES;

        // Customary law often allows polygyny but not polyandry
        if (spouse1Marriages.length >= maxAllowed) {
          throw new MaximumSpousesExceededError(maxAllowed);
        }
        if (spouse2Marriages.length >= this.CIVIL_MAX_SPOUSES) {
          throw new MaximumSpousesExceededError(this.CIVIL_MAX_SPOUSES);
        }
        break;

      case MarriageType.CIVIL:
      case MarriageType.CHRISTIAN:
      case MarriageType.HINDU:
        // Strict monogamy
        if (spouse1Marriages.length >= maxAllowed || spouse2Marriages.length >= maxAllowed) {
          throw new PolygamyNotAllowedError();
        }
        break;

      default:
        // For other types (like cohabitation), no strict limits
        break;
    }
  }

  /**
   * Check for conflicts between marriage and adoption relationships
   */
  private static checkMarriageAdoptionConflicts(family: FamilyAggregate, marriage: Marriage): void {
    // Check if marriage creates parent-child marriage (legally prohibited)
    const spouse1Parents = family.getParents(marriage.props.spouse1Id);
    const spouse2Parents = family.getParents(marriage.props.spouse2Id);

    // Check if spouses are parent-child
    const isSpouse1ParentOfSpouse2 = spouse2Parents.some((parent) =>
      parent.id.equals(marriage.props.spouse1Id),
    );
    const isSpouse2ParentOfSpouse1 = spouse1Parents.some((parent) =>
      parent.id.equals(marriage.props.spouse2Id),
    );

    if (isSpouse1ParentOfSpouse2 || isSpouse2ParentOfSpouse1) {
      throw new MarriageAdoptionConflictError();
    }

    // Check if marriage creates sibling marriage (legally prohibited in most cases)
    const spouse1Siblings = family.getSiblings(marriage.props.spouse1Id);
    const isSiblingMarriage = spouse1Siblings.some((sibling) =>
      sibling.id.equals(marriage.props.spouse2Id),
    );

    if (isSiblingMarriage) {
      throw new Error('Sibling marriage is legally prohibited');
    }
  }

  /**
   * Check cultural and religious constraints
   */
  private static checkCulturalConstraints(family: FamilyAggregate, marriage: Marriage): void {
    // Check clan/tribe restrictions
    const spouse1 = family.getMember(marriage.props.spouse1Id);
    const spouse2 = family.getMember(marriage.props.spouse2Id);

    if (spouse1 && spouse2) {
      // Same clan marriage restrictions (varies by community)
      if (
        spouse1.props.tribe === spouse2.props.tribe &&
        spouse1.props.clanRole &&
        spouse2.props.clanRole &&
        this.isSameClanMarriageProhibited(spouse1.props.tribe)
      ) {
        throw new CulturalMarriageViolationError('Same clan marriage prohibited');
      }

      // Check religious compatibility
      if (
        spouse1.props.religion &&
        spouse2.props.religion &&
        spouse1.props.religion !== spouse2.props.religion &&
        !this.areReligionsCompatibleForMarriage(spouse1.props.religion, spouse2.props.religion)
      ) {
        throw new CulturalMarriageViolationError('Religious marriage compatibility issue');
      }
    }

    // Check for customary requirements
    if (marriage.props.marriageType === MarriageType.CUSTOMARY) {
      if (
        !marriage.props.customaryDetails ||
        marriage.props.customaryDetails.eldersPresent.length < 2
      ) {
        throw new CulturalMarriageViolationError('Customary marriage requires at least 2 elders');
      }

      if (!marriage.props.bridePricePaid && this.isBridePriceRequired(spouse1?.props.tribe)) {
        throw new CulturalMarriageViolationError('Bride price required for this community');
      }
    }
  }

  /**
   * Check consanguinity (blood relationship) restrictions
   */
  private static checkConsanguinityRestrictions(family: FamilyAggregate, marriage: Marriage): void {
    // Simple check: prevent marriage between first-degree relatives
    const isFirstDegreeRelative = this.areFirstDegreeRelatives(family, marriage);
    if (isFirstDegreeRelative) {
      throw new Error('Marriage between first-degree relatives is legally prohibited');
    }
  }

  private static isSameClanMarriageProhibited(tribe?: string): boolean {
    const prohibitedTribes = ['KIKUYU', 'LUO', 'KAMBA']; // Example
    return prohibitedTribes.includes(tribe || '');
  }

  private static areReligionsCompatibleForMarriage(religion1: string, religion2: string): boolean {
    const compatibilityMatrix: Record<string, string[]> = {
      CHRISTIAN: ['CHRISTIAN', 'CATHOLIC', 'PROTESTANT'],
      MUSLIM: ['MUSLIM'],
      HINDU: ['HINDU'],
      TRADITIONAL: ['TRADITIONAL', 'CHRISTIAN', 'MUSLIM'],
    };

    const compatibleWith1 = compatibilityMatrix[religion1] || [];
    const compatibleWith2 = compatibilityMatrix[religion2] || [];

    return compatibleWith1.includes(religion2) || compatibleWith2.includes(religion1);
  }

  private static isBridePriceRequired(tribe?: string): boolean {
    const tribesRequiringBridePrice = ['KIKUYU', 'LUHYA', 'KALENJIN', 'KAMBA', 'MERU'];
    return tribesRequiringBridePrice.includes(tribe || '');
  }

  private static areFirstDegreeRelatives(family: FamilyAggregate, marriage: Marriage): boolean {
    // Check parent-child relationship
    const spouse1Parents = family.getParents(marriage.props.spouse1Id);
    const spouse2Parents = family.getParents(marriage.props.spouse2Id);

    // Check if one spouse is parent of the other
    const isSpouse1ParentOfSpouse2 = spouse2Parents.some((parent) =>
      parent.id.equals(marriage.props.spouse1Id),
    );
    const isSpouse2ParentOfSpouse1 = spouse1Parents.some((parent) =>
      parent.id.equals(marriage.props.spouse2Id),
    );

    return isSpouse1ParentOfSpouse2 || isSpouse2ParentOfSpouse1;
  }

  /**
   * Check if family can establish polygamous house (S.40 compliance)
   */
  static canEstablishPolygamousHouse(family: FamilyAggregate, houseOrder: number): void {
    if (!family.isPolygamous()) {
      throw new PolygamyNotAllowedError();
    }

    // Check house order sequence
    const existingHouses = family.props.houses;
    const maxOrder = existingHouses.reduce(
      (max, house) => Math.max(max, house.props.houseOrder),
      0,
    );

    if (houseOrder > maxOrder + 1) {
      throw new Error('Polygamous houses must be established in sequence');
    }

    // Check if house order already exists
    const orderExists = existingHouses.some((house) => house.props.houseOrder === houseOrder);
    if (orderExists) {
      throw new Error(`House order ${houseOrder} already exists`);
    }
  }

  /**
   * Check adoption eligibility based on family structure
   */
  static canProceedWithAdoption(
    family: FamilyAggregate,
    adoptiveParentId: UniqueEntityID,
    adopteeId: UniqueEntityID,
  ): void {
    const adoptiveParent = family.getMember(adoptiveParentId);
    const adoptee = family.getMember(adopteeId);

    if (!adoptiveParent || !adoptee) {
      throw new Error('Both adoptive parent and adoptee must be family members');
    }

    // Age gap requirement (usually at least 18 years older)
    const parentAge = adoptiveParent.calculateAge();
    const childAge = adoptee.calculateAge();

    if (parentAge !== null && childAge !== null && parentAge - childAge < 18) {
      throw new Error('Adoptive parent must be at least 18 years older than adoptee');
    }

    // Check if adoptee already has 2 legal parents
    const existingParents = family.getParents(adopteeId);
    if (existingParents.length >= 2) {
      throw new Error('Child already has two legal parents');
    }

    // Check for existing adoption relationship
    const existingAdoptionRelationship = family.props.relationships.find(
      (r) =>
        r.props.fromMemberId.equals(adoptiveParentId) &&
        r.props.toMemberId.equals(adopteeId) &&
        r.props.relationshipType === RelationshipType.PARENT &&
        r.props.isLegal,
    );

    if (existingAdoptionRelationship) {
      throw new Error('Adoption relationship already exists');
    }
  }
}
