import { Injectable } from '@nestjs/common';
import { FamilyMember } from '../entities/family-member.entity';
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
  ): ValidationResult {
    // 1. Identity Check
    if (fromMember.getId() === toMember.getId()) {
      return { isValid: false, error: 'Cannot create a relationship to oneself.' };
    }

    // 2. Chronological Validation (Parent/Child)
    if (type === RelationshipType.PARENT || type === RelationshipType.CHILD) {
      return this.validateParentChildAge(fromMember, toMember, type);
    }

    // 3. Chronological Validation (Grandparent/Grandchild)
    if (type === RelationshipType.GRANDPARENT || type === RelationshipType.GRANDCHILD) {
      // Basic generational gap sanity check (e.g., 30 years minimum)
      return this.validateGenerationalGap(fromMember, toMember, type, 30);
    }

    // 4. Default: relationship allowed
    return { isValid: true };
  }

  private validateParentChildAge(
    memberA: FamilyMember,
    memberB: FamilyMember,
    type: RelationshipType,
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
    const ageDiffYears = (childDob.getTime() - parentDob.getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (ageDiffYears < 10) {
      return {
        isValid: false,
        error: `Biological Improbability: Parent is only ${Math.floor(
          ageDiffYears,
        )} years older than child.`,
      };
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
          error: `Chronology Error: Ancestor must be older than descendant.`,
        };
      }

      const gapYears = (youngerDob.getTime() - olderDob.getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (gapYears < minYears) {
        return {
          isValid: false,
          error: `Generational Gap Warning: Ancestor is only ${Math.floor(
            gapYears,
          )} years older than descendant (minimum recommended ${minYears} years).`,
        };
      }
    }

    return { isValid: true };
  }
}
