// domain/policies/law-of-succession-act/section-29-dependant.policy.ts
import {
  DependencyLevel,
  KenyanLawSection,
  MarriageEndReason,
  RelationshipType,
} from '@prisma/client';

import { FamilyMember } from '../../entities/family-member.entity';
import { FamilyRelationship } from '../../entities/family-relationship.entity';
import { Marriage } from '../../entities/marriage.entity';

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
   *
   * @param deceased - The deceased family member
   * @param candidate - The person claiming dependancy
   * @param relationship - The documented relationship
   * @param context - Additional evidence (marriage, maintenance history)
   */
  static checkEligibility(
    deceased: FamilyMember,
    candidate: FamilyMember,
    relationship: FamilyRelationship,
    context: {
      marriage?: Marriage; // If spouse
      wasMaintained?: boolean; // Financial evidence provided?
      isCohabiting?: boolean; // For "Living as wife" check
    },
  ): DependantQualificationResult {
    // 1. SPOUSES (S.29(a) & S.29(c))
    if (
      relationship.type === RelationshipType.SPOUSE ||
      relationship.type === RelationshipType.EX_SPOUSE
    ) {
      return this.evaluateSpouse(deceased, candidate, context.marriage, context.wasMaintained);
    }

    // 2. CHILDREN (S.29(a)) - Biological & Adopted
    if (
      relationship.type === RelationshipType.CHILD ||
      relationship.type === RelationshipType.ADOPTED_CHILD
    ) {
      return this.evaluateChild(relationship);
    }

    // 3. STEP-CHILDREN / TAKEN INTO FAMILY (S.29(b))
    if (relationship.type === RelationshipType.STEPCHILD) {
      return this.evaluateStepChild(context.wasMaintained);
    }

    // 4. COHABITORS (S.29(5)) - "Woman living as wife"
    if (context.isCohabiting && deceased.gender === 'MALE' && candidate.gender === 'FEMALE') {
      return this.evaluateCohabitor();
    }

    // 5. OTHER RELATIVES (S.29(b)) - Parents, Siblings, etc.
    return this.evaluateExtendedFamily(relationship.type, context.wasMaintained ?? false);
  }

  // ===========================================================================
  // EVALUATION LOGIC
  // ===========================================================================

  private static evaluateSpouse(
    deceased: FamilyMember,
    candidate: FamilyMember,
    marriage?: Marriage,
    wasMaintained?: boolean,
  ): DependantQualificationResult {
    // NOTE: Accessing properties from the Marriage Entity via toJSON() or direct props
    // requires checking if the public getters expose them.
    // The Marriage Entity provided has a `toJSON()` method that exposes all props.
    // For type safety within the domain, we should ideally add public getters to the Entity,
    // but here we cast safely or check existence.

    if (!marriage) {
      return this.fail('Marriage record not provided for spouse verification');
    }

    const marriageData = marriage.toJSON(); // Access raw state safely
    const isAlive = marriage.isActive;

    // A. Current Spouses
    if (isAlive) {
      // Deceased was Husband (S.29(a)) - Wife is automatic dependant
      if (deceased.gender === 'MALE') {
        return this.success('Wife of deceased (S.29(a))', DependencyLevel.FULL, false);
      }

      // Deceased was Wife (S.29(c)) - Husband requires proof of maintenance
      if (deceased.gender === 'FEMALE') {
        const desc = 'Husband of deceased (S.29(c)) - Maintenance proof typically required';
        return wasMaintained
          ? this.success(desc, DependencyLevel.PARTIAL, true)
          : this.fail(desc + ' [Not Maintained]', true);
      }
    }

    // B. Former Spouses (Divorced)
    if (marriageData.endReason === MarriageEndReason.DIVORCE) {
      // Check maintenanceOrderIssued property from the Entity
      if (wasMaintained || marriageData.maintenanceOrderIssued) {
        return this.success(
          'Former spouse receiving maintenance (S.29(a))',
          DependencyLevel.PARTIAL,
          true,
        );
      }
    }

    return this.fail('Spouse relationship does not meet criteria');
  }

  private static evaluateChild(relationship: FamilyRelationship): DependantQualificationResult {
    // S.29(a): "The children of the deceased whether or not maintained..."
    // Automatic qualification.
    const type = relationship.type === RelationshipType.ADOPTED_CHILD ? 'Adopted' : 'Biological';
    return this.success(`${type} Child (S.29(a))`, DependencyLevel.FULL, false);
  }

  private static evaluateStepChild(wasMaintained: boolean = false): DependantQualificationResult {
    // S.29(b): "...children whom the deceased had taken into his family as his own"
    // Requires maintenance/acceptance proof.
    if (wasMaintained) {
      return this.success('Step-child taken into family (S.29(b))', DependencyLevel.PARTIAL, true);
    }
    return this.fail('Step-child not maintained by deceased', true);
  }

  private static evaluateCohabitor(): DependantQualificationResult {
    // S.29(5): "Woman living as wife"
    // Courts treat this as equivalent to a wife for dependency purposes.
    return this.success('Woman living as wife (S.29(5))', DependencyLevel.FULL, true);
  }

  private static evaluateExtendedFamily(
    type: RelationshipType,
    wasMaintained: boolean,
  ): DependantQualificationResult {
    const validExtendedTypes = [
      RelationshipType.PARENT,
      RelationshipType.SIBLING,
      RelationshipType.HALF_SIBLING,
      RelationshipType.GRANDPARENT,
      RelationshipType.GRANDCHILD,
    ];

    if (validExtendedTypes.includes(type as (typeof validExtendedTypes)[number])) {
      if (wasMaintained) {
        return this.success(
          `${type} maintained by deceased (S.29(b))`,
          DependencyLevel.PARTIAL,
          true,
        );
      } else {
        return this.fail(`${type} not maintained by deceased (S.29(b))`, true);
      }
    }

    return this.fail('Relationship type not covered by Section 29');
  }

  // ===========================================================================
  // HELPER FACTORIES
  // ===========================================================================

  private static success(
    reason: string,
    level: DependencyLevel,
    proofReq: boolean,
  ): DependantQualificationResult {
    return {
      isDependant: true,
      section: KenyanLawSection.S29_DEPENDANTS,
      dependencyLevel: level,
      requiresMaintenanceProof: proofReq,
      reason,
    };
  }

  private static fail(reason: string, proofReq: boolean = false): DependantQualificationResult {
    return {
      isDependant: false,
      section: KenyanLawSection.S29_DEPENDANTS,
      dependencyLevel: DependencyLevel.NONE,
      requiresMaintenanceProof: proofReq,
      reason,
    };
  }
}
