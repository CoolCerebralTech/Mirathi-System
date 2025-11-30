import { Injectable } from '@nestjs/common';
import { RelationshipType } from '@prisma/client';

import type { FamilyMember } from '../entities/family-member.entity';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

@Injectable()
export class RelationshipValidationPolicy {
  validateRelationship(
    fromMember: FamilyMember,
    toMember: FamilyMember,
    type: RelationshipType,
    metadata?: {
      isAdopted?: boolean;
      isBiological?: boolean;
      bornOutOfWedlock?: boolean;
      adoptionOrderNumber?: string;
    },
  ): ValidationResult {
    // 1. Identity Check
    if (fromMember.getId() === toMember.getId()) {
      return { isValid: false, error: 'Cannot create a relationship to oneself.' };
    }

    // 2. Chronological Validation (Parent/Child)
    if (
      type === RelationshipType.PARENT ||
      type === RelationshipType.CHILD ||
      type === RelationshipType.ADOPTED_CHILD
    ) {
      return this.validateParentChildAge(fromMember, toMember, type, metadata);
    }

    // 3. Chronological Validation (Grandparent/Grandchild)
    if (type === RelationshipType.GRANDPARENT || type === RelationshipType.GRANDCHILD) {
      return this.validateGenerationalGap(fromMember, toMember, type, 30);
    }

    // 4. Step-relationship validation
    if (type === RelationshipType.STEPCHILD) {
      return this.validateStepRelationship(fromMember, toMember);
    }

    // 5. Default: relationship allowed
    return { isValid: true };
  }

  private validateParentChildAge(
    memberA: FamilyMember,
    memberB: FamilyMember,
    type: RelationshipType,
    metadata?: {
      isAdopted?: boolean;
      isBiological?: boolean;
      bornOutOfWedlock?: boolean;
      adoptionOrderNumber?: string;
    },
  ): ValidationResult {
    const parent = type === RelationshipType.PARENT ? memberA : memberB;
    const child = type === RelationshipType.PARENT ? memberB : memberA;

    const parentDob = parent.getDateOfBirth();
    const childDob = child.getDateOfBirth();

    if (!parentDob || !childDob) return { isValid: true };

    // Parent must be born before child
    if (parentDob >= childDob) {
      return {
        isValid: false,
        error: `Chronology Error: Parent (${parent.getFullName()}) cannot be younger than or same age as Child (${child.getFullName()}).`,
      };
    }

    // Biological Improbability (e.g., parent only 10 years older)
    // More lenient for adopted children
    const ageDiffYears = (childDob.getTime() - parentDob.getTime()) / (1000 * 60 * 60 * 24 * 365);

    if (metadata?.isAdopted) {
      // Adoption Act: Adoptive parent generally must be at least 25 years old and 21 years older than child.
      // We'll use a slightly looser check here (18 years) to avoid blocking data entry for existing cases.
      if (ageDiffYears < 18) {
        return {
          isValid: false,
          error: `Adoption Requirement: Adoptive parent must be significantly older than child (current difference: ${Math.floor(ageDiffYears)} years).`,
        };
      }
    } else {
      // For biological relationships, strict biological limits
      if (ageDiffYears < 12) {
        return {
          isValid: false,
          error: `Biological Improbability: Parent is only ${Math.floor(ageDiffYears)} years older than child (minimum 12 years required).`,
        };
      }
    }

    return { isValid: true };
  }

  private validateGenerationalGap(
    memberA: FamilyMember,
    memberB: FamilyMember,
    type: RelationshipType,
    minYears: number,
  ): ValidationResult {
    const older =
      type === RelationshipType.GRANDPARENT || type === RelationshipType.AUNT_UNCLE
        ? memberA
        : memberB;
    const younger = older === memberA ? memberB : memberA;

    const olderDob = older.getDateOfBirth();
    const youngerDob = younger.getDateOfBirth();

    if (olderDob && youngerDob) {
      if (olderDob >= youngerDob) {
        return {
          isValid: false,
          error: 'Chronology Error: Ancestor must be older than descendant.',
        };
      }

      const gapYears = (youngerDob.getTime() - olderDob.getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (gapYears < minYears) {
        return {
          isValid: false,
          error: `Generational Gap Warning: Ancestor is only ${Math.floor(gapYears)} years older than descendant (minimum recommended ${minYears} years).`,
        };
      }
    }

    return { isValid: true };
  }

  private validateStepRelationship(memberA: FamilyMember, memberB: FamilyMember): ValidationResult {
    // In Relationship type 'STEPCHILD', A is usually Step-Parent, B is Step-Child (or vice versa depending on direction).
    // The previous implementation assumed fixed arguments. We need to check direction carefully in service layer.
    // Assuming here: memberA is FROM (Parent), memberB is TO (Child) for standard flow.

    // We will assume simpler check: just ensure reasonable age gap if dates exist.
    const parentDob = memberA.getDateOfBirth();
    const childDob = memberB.getDateOfBirth();

    if (parentDob && childDob) {
      const ageDiffYears = (childDob.getTime() - parentDob.getTime()) / (1000 * 60 * 60 * 24 * 365);

      // Step-parents can be closer in age than biological parents, but typically still older.
      if (ageDiffYears < 10) {
        return {
          isValid: false,
          error: `Step-parent must be reasonably older than step-child (current difference: ${Math.floor(ageDiffYears)} years).`,
        };
      }
    }

    return { isValid: true };
  }
}
