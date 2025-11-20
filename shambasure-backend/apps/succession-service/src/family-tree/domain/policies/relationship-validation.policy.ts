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
    if (type === 'PARENT' || type === 'CHILD') {
      return this.validateParentChildAge(fromMember, toMember, type);
    }

    // 3. Chronological Validation (Grandparent)
    if (type === 'GRANDPARENT' || type === 'GRANDCHILD') {
      // Basic sanity check (e.g. 30 year gap min)
      return this.validateGenerationalGap(fromMember, toMember, type, 30);
    }

    return { isValid: true };
  }

  private validateParentChildAge(
    memberA: FamilyMember,
    memberB: FamilyMember,
    type: RelationshipType,
  ): ValidationResult {
    const parent = type === 'PARENT' ? memberA : memberB;
    const child = type === 'PARENT' ? memberB : memberA;

    const parentDob = parent.getDateOfBirth();
    const childDob = child.getDateOfBirth();

    // If dates are unknown, we cannot validate. Assume valid.
    if (!parentDob || !childDob) return { isValid: true };

    // Standard Biological Constraints
    // Parent must be older than child.
    // We allow a small margin (e.g. 10 years) for extreme edge cases,
    // but technically puberty limits this.
    // Let's be strict: Parent must be born BEFORE child.
    if (parentDob >= childDob) {
      return {
        isValid: false,
        error: `Chronology Error: Parent (${parent.getFullName()}) cannot be younger than or same age as Child (${child.getFullName()}).`,
      };
    }

    // "Impossible" biology warning (e.g. Parent is 5 years older)
    const ageDiffYears = (childDob.getTime() - parentDob.getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (ageDiffYears < 10) {
      return {
        isValid: false,
        error: `Biological Improbability: Parent is only ${Math.floor(ageDiffYears)} years older than child.`,
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
    const older = ['GRANDPARENT', 'AUNT_UNCLE'].includes(type) ? memberA : memberB;
    const younger = older === memberA ? memberB : memberA;

    if (older.getDateOfBirth() && younger.getDateOfBirth()) {
      if (older.getDateOfBirth()! >= younger.getDateOfBirth()!) {
        return {
          isValid: false,
          error: `Chronology Error: Ancestor must be older than descendant.`,
        };
      }
    }
    return { isValid: true };
  }
}
