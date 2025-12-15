// domain/policies/law-of-succession-act/section-29-dependant.policy.ts
import { CohabitationRecord } from '../../entities/cohabitation-record.entity';
import { FamilyMember } from '../../entities/family-member.entity';
import {
  FamilyRelationship,
  RelationshipStrength,
} from '../../entities/family-relationship.entity';
import { Marriage, MarriageEndReason } from '../../entities/marriage.entity';
import { DependencyLevel } from '../../value-objects/legal/dependency-level.vo';
import { KenyanLawSection } from '../../value-objects/legal/kenyan-law-section.vo';
import { RelationshipType } from '../../value-objects/legal/relationship-type.vo';

export interface DependantQualificationResult {
  isDependant: boolean;
  section: KenyanLawSection;
  dependencyLevel: DependencyLevel;
  requiresMaintenanceProof: boolean;
  reason: string;
}

export class Section29DependantPolicy {
  /**
   * Main entry point to determine if a person counts as a "Dependant" under Section 29.
   */
  static checkEligibility(
    deceased: FamilyMember,
    candidate: FamilyMember,
    relationship: FamilyRelationship,
    context: {
      marriage?: Marriage; // If spouse
      cohabitation?: CohabitationRecord; // If cohabitor
      wasMaintained?: boolean; // Financial evidence provided?
    },
  ): DependantQualificationResult {
    // 1. Check Section 29(a) - Wives (and former wives)
    if (
      relationship.type === RelationshipType.SPOUSE ||
      relationship.type === RelationshipType.EX_SPOUSE
    ) {
      return this.evaluateSpouse(deceased, candidate, context.marriage, context.wasMaintained);
    }

    // 2. Check Section 29(a) - Children
    if (
      relationship.type === RelationshipType.CHILD ||
      relationship.type === RelationshipType.ADOPTED_CHILD
    ) {
      return this.evaluateChild(candidate, relationship);
    }

    // 3. Check Section 29(5) - Cohabitors ("Woman living as wife")
    if (context.cohabitation && context.cohabitation.isQualifyingForS29) {
      return this.evaluateCohabitor(deceased, context.cohabitation);
    }

    // 4. Check Section 29(b) - Other Relatives (Parents, Step-children, Siblings)
    return this.evaluateExtendedFamily(relationship, context.wasMaintained ?? false);
  }

  /**
   * Evaluates Spouse Eligibility (S.29(a) and S.29(c)).
   * Handles the distinction between Wife (automatic) and Husband (conditional under old LSA text, though Constitution overrides).
   */
  private static evaluateSpouse(
    deceased: FamilyMember,
    candidate: FamilyMember,
    marriage?: Marriage,
    wasMaintained?: boolean,
  ): DependantQualificationResult {
    // Fallback if marriage object missing but relationship exists
    if (!marriage) {
      // If simply "Spouse", assume qualifying for safety, mark for verification
      return {
        isDependant: true,
        section: KenyanLawSection.S29_DEPENDANTS,
        dependencyLevel: DependencyLevel.FULL,
        requiresMaintenanceProof: false,
        reason: 'Spouse (Verification of marriage status required)',
      };
    }

    // CASE 1: The Deceased was Male (S.29(a))
    if (deceased.gender === 'MALE') {
      // Wife or Wives are automatic dependants
      if (marriage.isActive) {
        return {
          isDependant: true,
          section: KenyanLawSection.S29_DEPENDANTS,
          dependencyLevel: DependencyLevel.FULL,
          requiresMaintenanceProof: false, // Automatic
          reason: 'Wife of deceased (S.29(a))',
        };
      }

      // Former Wife (Divorced but maintained)
      if (
        marriage.endReason === MarriageEndReason.DIVORCE ||
        marriage.endReason === MarriageEndReason.ANNULMENT
      ) {
        // Strict LSA: Must have been receiving maintenance
        // If court ordered maintenance exists or wasMaintained is true
        if (wasMaintained || marriage.details?.maintenanceOrderNumber) {
          return {
            isDependant: true,
            section: KenyanLawSection.S29_DEPENDANTS,
            dependencyLevel: DependencyLevel.PARTIAL,
            requiresMaintenanceProof: true,
            reason: 'Former wife receiving maintenance (S.29(a))',
          };
        }
      }
    }

    // CASE 2: The Deceased was Female (S.29(c))
    if (deceased.gender === 'FEMALE') {
      // "Where the deceased was a woman, her husband if he was being maintained by her"
      // Note: Art 27 of Constitution implies equality, but statutes often require proof for husbands
      if (wasMaintained) {
        return {
          isDependant: true,
          section: KenyanLawSection.S29_DEPENDANTS, // Technically S.29(c) falls under the general section
          dependencyLevel: DependencyLevel.PARTIAL,
          requiresMaintenanceProof: true,
          reason: 'Husband maintained by deceased wife (S.29(c))',
        };
      }

      return {
        isDependant: false,
        section: KenyanLawSection.S29_DEPENDANTS,
        dependencyLevel: DependencyLevel.NONE,
        requiresMaintenanceProof: true,
        reason: 'Husband not maintained by deceased (S.29(c))',
      };
    }

    return {
      isDependant: false,
      section: KenyanLawSection.S29_DEPENDANTS,
      dependencyLevel: DependencyLevel.NONE,
      requiresMaintenanceProof: false,
      reason: 'Relationship does not qualify',
    };
  }

  /**
   * Evaluates Children (S.29(a)).
   * "The children of the deceased whether or not maintained..."
   */
  private static evaluateChild(
    candidate: FamilyMember,
    relationship: FamilyRelationship,
  ): DependantQualificationResult {
    // 1. Biological or Adopted Children (Full Rights)
    if (relationship.isBiological || relationship.isAdopted) {
      return {
        isDependant: true,
        section: KenyanLawSection.S29_DEPENDANTS,
        dependencyLevel: DependencyLevel.FULL,
        requiresMaintenanceProof: false, // "Whether or not maintained"
        reason: relationship.isAdopted ? 'Adopted Child (S.29(a))' : 'Biological Child (S.29(a))',
      };
    }

    // 2. Children "taken into his family as his own" (S.29(b))
    // This often covers foster children or step-children treated as own
    if (
      relationship.strength === RelationshipStrength.FOSTER ||
      relationship.strength === RelationshipStrength.STEP
    ) {
      // These technically fall under 29(b) and require maintenance proof
      return {
        isDependant: true, // Conditional
        section: KenyanLawSection.S29_DEPENDANTS,
        dependencyLevel: DependencyLevel.PARTIAL,
        requiresMaintenanceProof: true,
        reason: 'Child taken into family/Step-child (S.29(b))',
      };
    }

    return {
      isDependant: false,
      section: KenyanLawSection.S29_DEPENDANTS,
      dependencyLevel: DependencyLevel.NONE,
      requiresMaintenanceProof: false,
      reason: 'Invalid child relationship',
    };
  }

  /**
   * Evaluates Cohabitors (S.29(5)).
   * "Woman living as wife"
   */
  private static evaluateCohabitor(
    deceased: FamilyMember,
    record: CohabitationRecord,
  ): DependantQualificationResult {
    // Only applies if Deceased is Male and Cohabitor is Female (Text of LSA S.29(5))
    // (Again, Courts may vary, but we implement the statute default)
    if (deceased.gender === 'MALE') {
      return {
        isDependant: true,
        section: KenyanLawSection.S29_DEPENDANTS,
        dependencyLevel: DependencyLevel.FULL, // Treated as wife
        requiresMaintenanceProof: false,
        reason: 'Woman living as wife (S.29(5)) - Presumption of Marriage',
      };
    }

    return {
      isDependant: false,
      section: KenyanLawSection.S29_DEPENDANTS,
      dependencyLevel: DependencyLevel.NONE,
      requiresMaintenanceProof: false,
      reason: 'S.29(5) applies to women living as wives only',
    };
  }

  /**
   * Evaluates Extended Family (S.29(b)).
   * Parents, Siblings, Grandchildren, etc.
   * ALL require proof of maintenance immediately prior to death.
   */
  private static evaluateExtendedFamily(
    relationship: FamilyRelationship,
    wasMaintained: boolean,
  ): DependantQualificationResult {
    const validExtendedTypes = [
      RelationshipType.PARENT,
      RelationshipType.SIBLING,
      RelationshipType.HALF_SIBLING,
      RelationshipType.GRANDPARENT,
      RelationshipType.GRANDCHILD,
      RelationshipType.STEPCHILD,
    ];

    if (validExtendedTypes.includes(relationship.type)) {
      if (wasMaintained) {
        return {
          isDependant: true,
          section: KenyanLawSection.S29_DEPENDANTS,
          dependencyLevel: DependencyLevel.PARTIAL,
          requiresMaintenanceProof: true,
          reason: `${relationship.type} maintained by deceased (S.29(b))`,
        };
      } else {
        return {
          isDependant: false, // Not a dependant if not maintained
          section: KenyanLawSection.S29_DEPENDANTS,
          dependencyLevel: DependencyLevel.NONE,
          requiresMaintenanceProof: true,
          reason: `${relationship.type} not maintained by deceased (S.29(b))`,
        };
      }
    }

    return {
      isDependant: false,
      section: KenyanLawSection.S29_DEPENDANTS,
      dependencyLevel: DependencyLevel.NONE,
      requiresMaintenanceProof: false,
      reason: 'Relationship not covered by Section 29',
    };
  }
}
