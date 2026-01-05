// apps/family-service/src/application/services/guardianship.service.ts
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { GuardianshipStatus } from '@prisma/client';

import { IEventPublisher } from '@shamba/messaging';

import { GuardianAssignedEvent } from '../../domain/events/family.events';
import { FamilyRepository } from '../../infrastructure/repositories/family.repository';
import { EVENT_PUBLISHER, FAMILY_REPOSITORY } from '../../injection.tokens';

interface GuardianEligibilityChecklist {
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

@Injectable()
export class GuardianshipService {
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

  async assignGuardian(familyId: string, dto: any) {
    // Validate ward
    const ward = await this.familyRepository.findFamilyMemberById(dto.wardId);
    if (!ward) {
      throw new NotFoundException('Ward not found');
    }
    if (!ward.isMinor) {
      throw new BadRequestException('Ward must be a minor (under 18)');
    }
    if (!ward.isAlive) {
      throw new BadRequestException('Ward must be alive');
    }

    // Validate guardian
    const guardian = await this.familyRepository.findFamilyMemberById(dto.guardianId);
    if (!guardian) {
      throw new NotFoundException('Guardian not found');
    }
    if (guardian.isMinor) {
      throw new BadRequestException('Guardian must be an adult (over 18)');
    }
    if (!guardian.isAlive) {
      throw new BadRequestException('Guardian must be alive');
    }

    // Calculate eligibility
    const eligibility = this.calculateEligibility(dto.checklist, guardian, ward);

    // Create/update guardianship
    let guardianship = await this.familyRepository.findGuardianshipByWard(dto.wardId);

    if (!guardianship) {
      guardianship = await this.familyRepository.createGuardianship({
        family: { connect: { id: familyId } },
        wardId: dto.wardId,
        wardName: `${ward.firstName} ${ward.lastName}`,
        wardAge: ward.age || 0,
        status: eligibility.status,
        eligibilityChecklist: dto.checklist,
        eligibilityScore: eligibility.eligibilityScore,
        proximityScore: eligibility.proximityScore,
        relationshipScore: eligibility.relationshipScore,
        overallScore: eligibility.overallScore,
        legalReference: eligibility.legalReference,
        warnings: eligibility.warnings,
        blockingIssues: eligibility.blockingIssues,
      });
    }

    // Create assignment
    const assignment = await this.familyRepository.createGuardianAssignment({
      guardianship: { connect: { id: guardianship.id } },
      guardian: { connect: { id: dto.guardianId } },
      ward: { connect: { id: dto.wardId } },
      guardianName: `${guardian.firstName} ${guardian.lastName}`,
      isPrimary: dto.isPrimary,
      isAlternate: !dto.isPrimary,
      priorityOrder: dto.isPrimary ? 1 : 2,
      eligibilitySnapshot: dto.checklist,
      eligibilityScore: eligibility.eligibilityScore,
    });

    // Publish event
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
    await this.eventPublisher.publish(event.eventType, event);

    return { guardianship, assignment, eligibility };
  }

  // ==========================================================================
  // CHECK ELIGIBILITY
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
        message: 'No guardian assigned yet',
      };
    }

    return {
      hasGuardian: true,
      guardianship,
      primaryGuardian: guardianship.assignments.find((a) => a.isPrimary),
      alternateGuardians: guardianship.assignments.filter((a) => a.isAlternate),
    };
  }

  // ==========================================================================
  // PRIVATE: CALCULATE ELIGIBILITY
  // ==========================================================================

  private calculateEligibility(checklist: GuardianEligibilityChecklist, guardian: any, ward: any) {
    const passedChecks: string[] = [];
    const failedChecks: string[] = [];
    const warnings: string[] = [];
    const blockingIssues: string[] = [];

    // Critical checks
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

    // High priority checks
    const highPriorityChecks = [
      { key: 'hasFinancialStability', label: 'Has financial stability' },
      { key: 'hasStableResidence', label: 'Has stable residence' },
      { key: 'hasGoodMoralCharacter', label: 'Has good moral character' },
    ];

    for (const check of highPriorityChecks) {
      if (checklist[check.key as keyof GuardianEligibilityChecklist]) {
        passedChecks.push(check.label);
      } else {
        failedChecks.push(check.label);
        warnings.push(`⚠️ ${check.label} not confirmed - may affect suitability`);
      }
    }

    // Conflict of interest
    if (!checklist.isNotBeneficiary) {
      warnings.push(
        '⚠️ CONFLICT OF INTEREST: Guardian is also a beneficiary (Section 72, Children Act)',
      );
    }

    // Calculate scores
    const eligibilityScore = this.calculateChecklistScore(checklist);
    const proximityScore = this.calculateProximityScore(guardian, ward);
    const relationshipScore = this.calculateRelationshipScore(guardian, ward);

    const overallScore =
      eligibilityScore * this.ELIGIBILITY_WEIGHT +
      proximityScore * this.PROXIMITY_WEIGHT +
      relationshipScore * this.RELATIONSHIP_WEIGHT;

    // Determine status
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
      warnings.push('Guardian is eligible but with conditions - court review recommended');
    } else {
      status = GuardianshipStatus.INELIGIBLE;
      isEligible = false;
      blockingIssues.push('Overall score too low - does not meet minimum requirements');
    }

    // Next steps
    const nextSteps: string[] = [];
    if (isEligible) {
      nextSteps.push('✅ Guardian is eligible');
      nextSteps.push('📄 Prepare Form P&A 12 (Affidavit of Means)');
      nextSteps.push("🏛️ File with Children's Court for approval");
      if (checklist.willingToPostBond) {
        nextSteps.push('💰 Prepare to post bond (Section 72)');
      }
    } else {
      nextSteps.push('❌ Address blocking issues before proceeding');
      nextSteps.push('👨‍⚖️ Consider alternative guardian');
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

  private calculateProximityScore(guardian: any, ward: any): number {
    const proximityMap: Record<string, number> = {
      PARENT: 100,
      SIBLING: 90,
      GRANDPARENT: 80,
      AUNT_UNCLE: 70,
      COUSIN: 60,
      OTHER: 40,
    };

    return proximityMap[guardian.relationship] || 50;
  }

  private calculateRelationshipScore(guardian: any, ward: any): number {
    let score = 50;

    if (guardian.lastName === ward.lastName) score += 20;
    if (guardian.age && guardian.age >= 25) score += 10;
    if (guardian.currentAddress) score += 10;
    if (guardian.phoneNumber || guardian.email) score += 10;

    return Math.min(score, 100);
  }
}
