// apps/family-service/src/application/services/guardianship.service.ts
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { GuardianshipStatus, RelationshipType } from '@prisma/client';

import { IEventPublisher } from '@shamba/messaging';

import { GuardianAssignedEvent } from '../../domain/events/family.events';
import { FamilyRepository } from '../../infrastructure/repositories/family.repository';
import { EVENT_PUBLISHER, FAMILY_REPOSITORY } from '../../injection.tokens';

export interface GuardianEligibilityChecklist {
  isOver18: boolean;
  hasNoCriminalRecord: boolean;
  isMentallyCapable: boolean;
  hasFinancialStability: boolean;
  hasStableResidence: boolean;
  hasGoodMoralCharacter: boolean;
  isNotBeneficiary: boolean;
  hasNoSubstanceAbuse: boolean;
  isPhysicallyCapable: boolean;
  hasTimeAvailability: boolean;
  hasCloseRelationship: boolean;
  hasWardConsent: boolean;
  understandsLegalDuties: boolean;
  willingToPostBond: boolean;
}

export interface AssignGuardianDto {
  wardId: string;
  guardianId: string;
  isPrimary: boolean;
  checklist: GuardianEligibilityChecklist;
}

@Injectable()
export class GuardianshipService {
  // Weighted Scoring Model
  private readonly ELIGIBILITY_WEIGHT = 0.6;
  private readonly PROXIMITY_WEIGHT = 0.2;
  private readonly RELATIONSHIP_WEIGHT = 0.2;

  constructor(
    @Inject(FAMILY_REPOSITORY)
    private readonly familyRepository: FamilyRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: IEventPublisher,
  ) {}

  // ==========================================================================
  // ASSIGN GUARDIAN
  // ==========================================================================

  async assignGuardian(familyId: string, dto: AssignGuardianDto) {
    // 1. Validate Entities
    const ward = await this.familyRepository.findFamilyMemberById(dto.wardId);
    if (!ward) throw new NotFoundException('Ward (Child) not found');
    if (!ward.isMinor) throw new BadRequestException('Ward must be a minor (under 18)');
    if (!ward.isAlive) throw new BadRequestException('Ward must be alive to assign a guardian');

    const guardian = await this.familyRepository.findFamilyMemberById(dto.guardianId);
    if (!guardian) throw new NotFoundException('Guardian candidate not found');
    if (guardian.isMinor) throw new BadRequestException('Guardian must be an adult (over 18)');
    if (!guardian.isAlive) throw new BadRequestException('Guardian must be alive');

    // 2. Fetch Existing Guardianship
    // We use 'any' here to allow us to seamlessly merge the "Created" (flat) and "Found" (rich) types
    let guardianship: any = await this.familyRepository.findGuardianshipByWard(dto.wardId);

    // 3. Enforce Single Primary Guardian Rule
    if (dto.isPrimary && guardianship) {
      const activePrimary = guardianship.assignments.find((a: any) => a.isPrimary && a.isActive);
      // If there is an active primary guardian who is NOT the current candidate
      if (activePrimary && activePrimary.guardianId !== dto.guardianId) {
        throw new BadRequestException(
          `Ward already has an active primary guardian: ${activePrimary.guardian.firstName}. Demote them to alternate first.`,
        );
      }
    }

    // 4. Calculate Eligibility Logic
    const eligibility = this.calculateEligibility(dto.checklist, guardian, ward);

    // 5. Create or Update Guardianship Aggregate
    if (!guardianship) {
      const newGuardianship = await this.familyRepository.createGuardianship({
        family: { connect: { id: familyId } },
        wardId: dto.wardId,
        wardName: `${ward.firstName} ${ward.lastName}`,
        wardAge: ward.age || 0,
        status: eligibility.status,
        eligibilityChecklist: dto.checklist as any, // Cast to JSON
        eligibilityScore: eligibility.eligibilityScore,
        proximityScore: eligibility.proximityScore,
        relationshipScore: eligibility.relationshipScore,
        overallScore: eligibility.overallScore,
        legalReference: eligibility.legalReference,
        warnings: eligibility.warnings,
        blockingIssues: eligibility.blockingIssues,
      });

      // FIX 1: Manually shape the object to include the missing relation so TS and logic below don't break
      guardianship = { ...newGuardianship, assignments: [] };
    } else {
      // Update existing aggregate scores
      guardianship = await this.familyRepository.updateGuardianship(guardianship.id, {
        overallScore: eligibility.overallScore,
        status: eligibility.status,
      });
      // Ensure we keep the assignments ref if we just updated the parent
      if (!guardianship.assignments) {
        // Re-fetch or pass the previous assignments (Simplified for this context)
        const reloaded = await this.familyRepository.findGuardianshipByWard(dto.wardId);
        guardianship = reloaded;
      }
    }

    // 6. Create Assignment
    // FIX 2: guardianship is now guaranteed to exist and have assignments (even if empty)
    const existingAssignment = guardianship.assignments?.find(
      (a: any) => a.guardianId === dto.guardianId,
    );

    let assignment;
    if (existingAssignment) {
      throw new BadRequestException(
        'This guardian is already assigned. Use update endpoint to modify role.',
      );
    } else {
      assignment = await this.familyRepository.createGuardianAssignment({
        guardianship: { connect: { id: guardianship.id } },
        guardian: { connect: { id: dto.guardianId } },
        ward: { connect: { id: dto.wardId } },
        guardianName: `${guardian.firstName} ${guardian.lastName}`,
        isPrimary: dto.isPrimary,
        isAlternate: !dto.isPrimary,
        priorityOrder: dto.isPrimary ? 1 : 2,
        eligibilitySnapshot: dto.checklist as any,
        eligibilityScore: eligibility.eligibilityScore,
      });
    }

    // 7. Publish Event
    const event = new GuardianAssignedEvent(
      familyId,
      guardianship.id,
      dto.wardId,
      `${ward.firstName} ${ward.lastName}`,
      dto.guardianId,
      `${guardian.firstName} ${guardian.lastName}`,
      dto.isPrimary,
      eligibility.overallScore,
      eligibility.status,
      new Date(),
    );

    // FIX 3: Correct arguments (only 1 arg needed)
    await this.eventPublisher.publish(event);

    return { guardianship, assignment, eligibility };
  }

  // ==========================================================================
  // CHECK ELIGIBILITY (Simulation)
  // ==========================================================================

  async checkGuardianEligibility(
    guardianId: string,
    wardId: string,
    checklist: GuardianEligibilityChecklist,
  ) {
    const guardian = await this.familyRepository.findFamilyMemberById(guardianId);
    const ward = await this.familyRepository.findFamilyMemberById(wardId);

    if (!guardian || !ward) {
      throw new NotFoundException('Guardian or ward not found');
    }

    return this.calculateEligibility(checklist, guardian, ward);
  }

  // ==========================================================================
  // GET GUARDIANSHIP STATUS
  // ==========================================================================

  async getGuardianshipStatus(wardId: string) {
    const guardianship = await this.familyRepository.findGuardianshipByWard(wardId);

    if (!guardianship) {
      return {
        hasGuardian: false,
        message: 'No guardian assigned yet. This minor is at risk in case of intestacy.',
        status: 'PENDING',
      };
    }

    return {
      hasGuardian: true,
      guardianship,
      primaryGuardian: guardianship.assignments.find((a) => a.isPrimary && a.isActive),
      alternateGuardians: guardianship.assignments.filter((a) => a.isAlternate && a.isActive),
      compliance: {
        isCompliant:
          guardianship.status === GuardianshipStatus.ELIGIBLE ||
          guardianship.status === GuardianshipStatus.ACTIVE,
        issues: guardianship.blockingIssues,
      },
    };
  }

  // ==========================================================================
  // PRIVATE: CORE LOGIC
  // ==========================================================================

  private calculateEligibility(checklist: GuardianEligibilityChecklist, guardian: any, ward: any) {
    const passedChecks: string[] = [];
    const failedChecks: string[] = [];
    const warnings: string[] = [];
    const blockingIssues: string[] = [];

    // 1. Critical Legal Checks (Children Act)
    const criticalChecks = [
      { key: 'isOver18', label: 'Must be over 18 years old', ref: 'Section 70, Children Act' },
      { key: 'hasNoCriminalRecord', label: 'Must have no criminal record', ref: 'Section 71' },
      { key: 'isMentallyCapable', label: 'Must be of sound mind', ref: 'Section 71' },
    ];

    for (const check of criticalChecks) {
      if (checklist[check.key as keyof GuardianEligibilityChecklist]) {
        passedChecks.push(check.label);
      } else {
        failedChecks.push(check.label);
        blockingIssues.push(`CRITICAL: ${check.label} (${check.ref})`);
      }
    }

    // 2. Suitability Checks
    const highPriorityChecks = [
      { key: 'hasFinancialStability', label: 'Financial Stability confirmed' },
      { key: 'hasStableResidence', label: 'Stable Residence confirmed' },
      { key: 'hasGoodMoralCharacter', label: 'Good Moral Character confirmed' },
    ];

    for (const check of highPriorityChecks) {
      if (checklist[check.key as keyof GuardianEligibilityChecklist]) {
        passedChecks.push(check.label);
      } else {
        failedChecks.push(check.label);
        warnings.push(`⚠️ ${check.label} not confirmed - Courts prefer stability.`);
      }
    }

    // 3. Conflict of Interest (Section 72)
    if (!checklist.isNotBeneficiary) {
      warnings.push(
        '⚠️ CONFLICT WARNING: Guardian is also a beneficiary. Requires specific clause in Will (Section 72, Children Act).',
      );
    }

    // 4. Scoring
    const eligibilityScore = this.calculateChecklistScore(checklist);
    const proximityScore = this.calculateProximityScore(guardian, ward);
    const relationshipScore = this.calculateRelationshipScore(guardian, ward);

    const overallScore =
      eligibilityScore * this.ELIGIBILITY_WEIGHT +
      proximityScore * this.PROXIMITY_WEIGHT +
      relationshipScore * this.RELATIONSHIP_WEIGHT;

    // 5. Status Determination
    let status: GuardianshipStatus;
    let isEligible: boolean;

    if (blockingIssues.length > 0) {
      status = GuardianshipStatus.INELIGIBLE;
      isEligible = false;
    } else if (overallScore >= 80) {
      status = GuardianshipStatus.ELIGIBLE;
      isEligible = true;
    } else if (overallScore >= 60) {
      status = GuardianshipStatus.CONDITIONAL;
      isEligible = true;
      warnings.push('Eligible with Conditions - Court may require additional bond.');
    } else {
      status = GuardianshipStatus.INELIGIBLE;
      isEligible = false;
      blockingIssues.push('Score too low (<60) - Does not meet best interests of the child.');
    }

    // 6. Actionable Advice
    const nextSteps: string[] = [];
    if (isEligible) {
      nextSteps.push('✅ Guardian is eligible.');
      nextSteps.push('📝 Add "Testamentary Guardian" clause to Will.');
      if (checklist.willingToPostBond) {
        nextSteps.push('💰 Prepare Bond Security (Section 72).');
      }
    } else {
      nextSteps.push('❌ Resolve blocking issues or select another guardian.');
    }

    return {
      guardianId: guardian.id,
      guardianName: `${guardian.firstName} ${guardian.lastName}`,
      wardId: ward.id,
      wardName: `${ward.firstName} ${ward.lastName}`,
      eligibilityScore: Math.round(eligibilityScore),
      proximityScore: Math.round(proximityScore),
      relationshipScore: Math.round(relationshipScore),
      overallScore: Math.round(overallScore),
      status,
      isEligible,
      passedChecks,
      failedChecks,
      warnings,
      blockingIssues,
      legalReference: 'Children Act (Cap 141), Sections 70-73',
      nextSteps,
    };
  }

  private calculateChecklistScore(checklist: GuardianEligibilityChecklist): number {
    const totalChecks = Object.keys(checklist).length;
    const passedChecks = Object.values(checklist).filter((v) => v === true).length;
    return (passedChecks / totalChecks) * 100;
  }

  /**
   * Calculates "Kinship Distance"
   */
  private calculateProximityScore(guardian: any, _ward: any): number {
    const relToCreator = guardian.relationship as RelationshipType;

    if (relToCreator === RelationshipType.SPOUSE) return 100;
    if (relToCreator === RelationshipType.SIBLING) return 60;
    if (relToCreator === RelationshipType.FATHER || relToCreator === RelationshipType.MOTHER)
      return 80;
    if (relToCreator === RelationshipType.CHILD) return 90;

    return 40;
  }

  private calculateRelationshipScore(guardian: any, ward: any): number {
    let score = 50;
    if (guardian.lastName === ward.lastName) score += 20;
    if (guardian.age && guardian.age >= 25) score += 10;
    if (guardian.phoneNumber && guardian.email) score += 10;
    if (guardian.currentAddress && guardian.currentAddress === ward.currentAddress) score += 10;
    return Math.min(score, 100);
  }
}
