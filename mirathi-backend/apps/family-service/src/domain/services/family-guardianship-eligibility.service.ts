// src/family-service/src/domain/services/family-guardianship-eligibility.service.ts
import { FamilyAggregate } from '../aggregates/family.aggregate';
import { UniqueEntityID } from '../base/unique-entity-id';

export class GuardianMustBeFamilyMemberError extends Error {
  constructor() {
    super('Guardian must be a member of the same family');
    this.name = 'GuardianMustBeFamilyMemberError';
  }
}

export class GuardianMustBeAdultError extends Error {
  constructor() {
    super('Guardian must be an adult (18+ years)');
    this.name = 'GuardianMustBeAdultError';
  }
}

export class CircularGuardianshipError extends Error {
  constructor() {
    super('A guardian cannot be a ward of the person they are supposed to guard');
    this.name = 'CircularGuardianshipError';
  }
}

export class GuardianLegallyDisqualifiedError extends Error {
  constructor(reason: string) {
    super(`Guardian is legally disqualified: ${reason}`);
    this.name = 'GuardianLegallyDisqualifiedError';
  }
}

export class WardAlreadyHasGuardianError extends Error {
  constructor() {
    super('Ward already has an active guardianship');
    this.name = 'WardAlreadyHasGuardianError';
  }
}

export class FamilyGuardianshipEligibilityService {
  /**
   * Check if a family member can be appointed as guardian for another family member
   * This encapsulates rules that span both Family and Guardianship aggregates
   */
  static canAppointGuardian(
    family: FamilyAggregate,
    wardId: UniqueEntityID,
    guardianId: UniqueEntityID,
  ): void {
    // 1. Guardian must be a family member
    const guardian = family.getMember(guardianId);
    if (!guardian) {
      throw new GuardianMustBeFamilyMemberError();
    }

    // 2. Guardian must be an adult
    if (!guardian.isAdult()) {
      throw new GuardianMustBeAdultError();
    }

    // 3. Ward must exist in family
    const ward = family.getMember(wardId);
    if (!ward) {
      throw new Error('Ward must be a member of the family');
    }

    // 4. Ward must be a minor or incapacitated adult
    if (!ward.qualifiesForDependencyClaim()) {
      throw new Error('Ward does not qualify for guardianship (not a minor or incapacitated)');
    }

    // 5. Check for circular guardianship
    this.checkForCircularGuardianship(family, wardId, guardianId);

    // 6. Check legal disqualifications
    this.checkLegalDisqualifications(guardian);

    // 7. Check if ward already has active guardianship
    this.checkExistingGuardianship(family, wardId);
  }

  /**
   * Check for circular guardianship relationships
   * Example: A cannot be guardian of B if B is already guardian of A
   */
  private static checkForCircularGuardianship(
    family: FamilyAggregate,
    wardId: UniqueEntityID,
    guardianId: UniqueEntityID,
  ): void {
    // Check if ward is guardian of the proposed guardian
    const wardIsGuardianOfGuardian = family
      .getChildren(guardianId)
      .some((child) => child.id.equals(wardId));

    if (wardIsGuardianOfGuardian) {
      throw new CircularGuardianshipError();
    }

    // Check for other circular relationships (through multiple hops)
    const visited = new Set<string>();
    const stack: UniqueEntityID[] = [wardId];

    while (stack.length > 0) {
      const current = stack.pop()!;
      const key = current.toString();

      if (visited.has(key)) continue;
      visited.add(key);

      // Get all guardians (parents) of current
      const guardians = family.getParents(current);

      for (const guardian of guardians) {
        if (guardian.id.equals(guardianId)) {
          throw new CircularGuardianshipError();
        }
        stack.push(guardian.id);
      }
    }
  }

  /**
   * Check for legal disqualifications (Section 25, Children Act)
   */
  private static checkLegalDisqualifications(guardian: any): void {
    // Note: We would need access to Guardian's legal status, which might be in Guardianship aggregate
    // For now, this is a placeholder for the actual legal checks

    // Section 25(2): Person convicted of offense involving violence or abuse of child
    // Section 25(3): Person declared bankrupt
    // Section 25(4): Person with mental illness
    // Section 25(5): Person with conflict of interest

    if (guardian.props.isMentallyIncapacitated) {
      throw new GuardianLegallyDisqualifiedError('Guardian is mentally incapacitated');
    }

    // In a real system, we would check:
    // - Criminal record
    // - Bankruptcy status
    // - Conflict of interest with ward's estate
    // - Previous guardianship revocations
  }

  /**
   * Check if ward already has active guardianship
   * This would typically query the guardianship aggregate/repository
   */
  private static checkExistingGuardianship(
    _family: FamilyAggregate,
    _wardId: UniqueEntityID,
  ): void {
    // This is a cross-aggregate check that would need to query the guardianship repository
    // In a real implementation:
    // const existingGuardianship = guardianshipRepository.findByWardId(wardId);
    // if (existingGuardianship && existingGuardianship.props.status === 'ACTIVE') {
    //   throw new WardAlreadyHasGuardianError();
    // }
  }

  /**
   * Check if multiple guardians can be appointed for same ward
   * (e.g., one for property, one for person)
   */
  static canAppointAdditionalGuardian(
    _existingGuardianId: UniqueEntityID,
    _newGuardianId: UniqueEntityID,
  ): void {
    // Check for conflict between existing and new guardian
    // Example: Both can't have conflicting financial interests
    // This would require checking both guardians' relationships to ward's assets
  }

  /**
   * Validate guardianship termination eligibility
   */
  static canTerminateGuardianship(
    family: FamilyAggregate,
    wardId: UniqueEntityID,
    reason: string,
  ): void {
    const ward = family.getMember(wardId);
    if (!ward) {
      throw new Error('Ward not found in family');
    }

    // Check if ward has reached majority
    if (ward.isAdult() && !ward.props.isMentallyIncapacitated && !ward.props.hasDisability) {
      // Automatic eligibility when ward becomes adult and capable
      return;
    }

    // For incapacitated adults, check if alternative arrangements exist
    if (ward.props.isMentallyIncapacitated || ward.props.hasDisability) {
      if (!reason || reason.length < 20) {
        throw new Error(
          'Detailed reason required for terminating guardianship of incapacitated adult',
        );
      }
    }

    // Check if there's a successor guardian
    // This would require querying the guardianship aggregate
  }

  /**
   * Check emergency guardianship eligibility
   */
  static qualifiesForEmergencyGuardianship(
    family: FamilyAggregate,
    wardId: UniqueEntityID,
    emergencyType: 'MEDICAL' | 'SAFETY' | 'FINANCIAL',
  ): boolean {
    const ward = family.getMember(wardId);
    if (!ward) return false;

    // Emergency guardianship criteria
    switch (emergencyType) {
      case 'MEDICAL':
        return (
          ward.props.isAlive &&
          (ward.isMinor() || ward.props.isMentallyIncapacitated) &&
          !this.hasMedicalDecisionMaker(family, wardId)
        );

      case 'SAFETY':
        return (
          ward.props.isAlive && ward.isMinor() && this.hasImmediateSafetyThreat(family, wardId)
        );

      case 'FINANCIAL':
        return (
          ward.props.isAlive &&
          (ward.isMinor() || ward.props.isMentallyIncapacitated) &&
          this.hasUrgentFinancialNeeds(family, wardId)
        );

      default:
        return false;
    }
  }

  private static hasMedicalDecisionMaker(
    _family: FamilyAggregate,
    _wardId: UniqueEntityID,
  ): boolean {
    // Check if ward already has someone with medical consent authority
    // Would query guardianship aggregate
    return false;
  }

  private static hasImmediateSafetyThreat(
    family: FamilyAggregate,
    wardId: UniqueEntityID,
  ): boolean {
    const ward = family.getMember(wardId);
    if (!ward) return false;

    // Check living conditions
    // Check if primary caregiver is missing/deceased
    // This is simplified - real implementation would check more factors
    return false;
  }

  private static hasUrgentFinancialNeeds(
    _family: FamilyAggregate,
    _wardId: UniqueEntityID,
  ): boolean {
    // Check if ward has immediate financial obligations (school fees, medical bills)
    // Would need access to financial records
    return false;
  }
}
