import { Injectable } from '@nestjs/common';
import type { FamilyMember } from '../entities/family-member.entity';
import { RelationshipType } from '@prisma/client';

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
    if (type === 'PARENT' || type === 'CHILD' || type === 'ADOPTED_CHILD') {
      return this.validateParentChildAge(fromMember, toMember, type, metadata);
    }

    // 3. Chronological Validation (Grandparent/Grandchild)
    if (type === 'GRANDPARENT' || type === 'GRANDCHILD') {
      return this.validateGenerationalGap(fromMember, toMember, type, 30);
    }

    // 4. Step-relationship validation
    if (type === 'STEPCHILD') {
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
    const parent = type === 'PARENT' ? memberA : memberB;
    const child = type === 'PARENT' ? memberB : memberA;

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
      // For adoption, allow 18+ year difference
      if (ageDiffYears < 18) {
        return {
          isValid: false,
          error: `Adoption Requirement: Adoptive parent must be at least 18 years older than child (current difference: ${Math.floor(ageDiffYears)} years).`,
        };
      }
    } else {
      // For biological relationships, use stricter rule
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
    const older = type === 'GRANDPARENT' || type === 'AUNT_UNCLE' ? memberA : memberB;
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

  private validateStepRelationship(
    stepParent: FamilyMember,
    stepChild: FamilyMember,
  ): ValidationResult {
    const parentDob = stepParent.getDateOfBirth();
    const childDob = stepChild.getDateOfBirth();

    if (parentDob && childDob) {
      const ageDiffYears = (childDob.getTime() - parentDob.getTime()) / (1000 * 60 * 60 * 24 * 365);

      if (ageDiffYears < 15) {
        return {
          isValid: false,
          error: `Step-parent must be at least 15 years older than step-child (current difference: ${Math.floor(ageDiffYears)} years).`,
        };
      }
    }

    return { isValid: true };
  }
}
