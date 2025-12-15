// domain/specifications/member-specifications/is-legal-dependant.spec.ts
import { FamilyMember } from '../../entities/family-member.entity';
import { RelationshipType } from '../../value-objects/legal/relationship-type.vo';

export class IsLegalDependantSpec {
  /**
   * Quick check: Is this person *likely* a dependant?
   * Used for initial flagging.
   */
  isSatisfiedBy(member: FamilyMember, relationshipType: RelationshipType): boolean {
    // 1. Spouses (Automatic S.29(a))
    if (relationshipType === RelationshipType.SPOUSE) {
      return true;
    }

    // 2. Children (Automatic S.29(a))
    if (
      relationshipType === RelationshipType.CHILD ||
      relationshipType === RelationshipType.ADOPTED_CHILD
    ) {
      return true;
    }

    // 3. Vulnerable Members (Potential S.29(b))
    // Parents, Siblings, etc. are only dependants if they relied on the deceased.
    // However, if they are Minors or Disabled, the probability is high.
    if (member.isMinor || member.hasDisability) {
      return true;
    }

    // 4. Student (Young Adult)
    if (member.ageCalculation?.isStudentAge) {
      return true;
    }

    return false;
  }
}
