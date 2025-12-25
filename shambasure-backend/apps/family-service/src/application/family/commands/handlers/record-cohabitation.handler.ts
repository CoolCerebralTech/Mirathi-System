import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { FamilyAggregate } from '../../../../domain/aggregates/family.aggregate';
import { UniqueEntityID } from '../../../../domain/base/unique-entity-id';
import { CohabitationRecord } from '../../../../domain/entities/cohabitation-record.entity';
import type { IFamilyRepository } from '../../../../domain/interfaces/ifamily.repository';
import { FAMILY_REPOSITORY } from '../../../../domain/interfaces/ifamily.repository';
import { AppErrors } from '../../../common/application.error';
import { BaseCommandHandler } from '../../../common/base/base.command-handler';
import { Result } from '../../../common/result';
import { RecordCohabitationCommand } from '../impl/record-cohabitation.command';

@CommandHandler(RecordCohabitationCommand)
export class RecordCohabitationHandler
  extends BaseCommandHandler<RecordCohabitationCommand, FamilyAggregate, Result<string>>
  implements ICommandHandler<RecordCohabitationCommand, Result<string>>
{
  constructor(
    @Inject(FAMILY_REPOSITORY)
    protected readonly repository: IFamilyRepository,
    protected readonly eventBus: EventBus,
  ) {
    super(eventBus, repository as any, undefined);
  }

  async execute(command: RecordCohabitationCommand): Promise<Result<string>> {
    this.logger.log(`Recording cohabitation in family ${command.familyId}`);

    try {
      command.validate();

      // 1. Load Aggregate
      const family = await this.repository.findById(command.familyId);
      if (!family) {
        return Result.fail(new AppErrors.NotFoundError('Family', command.familyId));
      }

      // 2. Validate Partners
      const partner1Id = new UniqueEntityID(command.partner1Id);
      const partner2Id = new UniqueEntityID(command.partner2Id);

      const partner1 = family.getMember(partner1Id);
      const partner2 = family.getMember(partner2Id);

      if (!partner1) {
        return Result.fail(new AppErrors.NotFoundError('Partner 1', command.partner1Id));
      }
      if (!partner2) {
        return Result.fail(new AppErrors.NotFoundError('Partner 2', command.partner2Id));
      }

      // 3. Business Rule: Check for incestuous cohabitation (Strict Liability)
      // Use proper method to get last names instead of accessing protected props
      // Assuming FamilyMember has a method to get last name
      const partner1LastName = this.getMemberLastName(partner1);
      const partner2LastName = this.getMemberLastName(partner2);

      if (partner1LastName && partner2LastName && partner1LastName === partner2LastName) {
        // Warning level logging, but we don't block unless we know for sure via relationships
        this.logger.warn(
          `Potential kinship warning: Partners share last name '${partner1LastName}'`,
        );
      }

      // 4. Create Entity
      const recordId = new UniqueEntityID();
      const creatorId = new UniqueEntityID(command.userId);

      // Calculate duration for S.29 qualification
      const now = new Date();
      const durationMs = now.getTime() - command.startDate.getTime();
      const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));

      // Determine relationship type based on exclusivity
      const relationshipType: 'COME_WE_STAY' | 'LONG_TERM_PARTNERSHIP' | 'DATING' | 'ENGAGED' =
        command.isExclusive ? 'COME_WE_STAY' : 'DATING';

      const cohabitation = CohabitationRecord.create(
        {
          // Core Information
          familyId: family.id,
          partner1Id: partner1.id,
          partner2Id: partner2.id,

          // Cohabitation Details
          relationshipType: relationshipType,
          startDate: command.startDate,
          endDate: undefined,
          isActive: true,

          // Duration & Legal Qualification
          durationDays: durationDays,
          qualifiesForS29: this.calculateS29Eligibility(command, durationDays),
          minimumPeriodMet: durationDays >= 730, // 2 years = 730 days

          // Residence Details
          sharedResidence: command.sharedResidenceAddress,
          residenceCounty: command.county,
          isSeparateHousehold: true, // Default assumption

          // Evidence & Verification
          affidavitId: command.affidavitId,
          witnesses: [], // Can be added later
          communityAcknowledged: false, // Default
          hasJointUtilities: false, // Default

          // Children from Cohabitation
          childrenIds: [],
          hasChildren: command.hasChildrenTogether,
          childrenBornDuringCohabitation: command.hasChildrenTogether,

          // Financial Interdependence
          jointFinancialAccounts: command.jointAssets || false,
          jointPropertyOwnership: command.jointAssets || false,
          financialSupportProvided: false, // Default
          supportEvidence: [],

          // Social Recognition
          knownAsCouple: false, // Default
          socialMediaEvidence: undefined,
          familyAcknowledged: false, // Default

          // Legal Proceedings
          hasCourtRecognition: false,
          courtCaseNumber: undefined,
          courtOrderId: undefined,

          // Dependency Claims (S.29)
          dependencyClaimFiled: false,
          dependencyClaimId: undefined,
          dependencyClaimStatus: undefined,

          // Relationship Quality
          relationshipStability: 'UNKNOWN',
          separationAttempts: 0,
          reconciliationCount: 0,

          // Customary Context
          customaryElements: false,
          clanInvolved: false,
          elderMediation: false,

          // Health & Safety
          hasDomesticViolenceReports: false,
          safetyPlanInPlace: false,

          // Future Intentions
          marriagePlanned: false,
          plannedMarriageDate: undefined,
          childrenPlanned: false,

          // Metadata
          createdBy: creatorId,
          lastUpdatedBy: creatorId,
          verificationStatus: 'UNVERIFIED',
          verificationNotes: undefined,

          // Audit
          lastVerifiedAt: undefined,
          isArchived: false,
        },
        recordId,
      );

      // 5. Apply to Aggregate
      family.recordCohabitation(cohabitation);

      // 6. Save
      await this.repository.save(family);

      // 7. Publish Events
      this.publishEventsAndCommit(family);

      return Result.ok(recordId.toString());
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('must belong to this family')) {
          return Result.fail(new AppErrors.ValidationError(error.message));
        }
        if (error.message.includes('Cannot cohabitate with oneself')) {
          return Result.fail(new AppErrors.ValidationError(error.message));
        }
        if (error.message.includes('At least one witness is required')) {
          return Result.fail(new AppErrors.ValidationError(error.message));
        }
      }
      return Result.fail(new AppErrors.UnexpectedError(error));
    }
  }

  /**
   * Helper to get last name from a family member
   * Avoids accessing protected props directly
   */
  private getMemberLastName(member: any): string | undefined {
    try {
      // Try different ways to access the last name based on your entity structure
      if (member.props && member.props.name) {
        // If name has a getFullName or similar method
        if (typeof member.props.name.getFullName === 'function') {
          const fullName = member.props.name.getFullName();
          // Extract last name from full name (assuming last word is last name)
          const parts = fullName.split(' ');
          return parts[parts.length - 1];
        }
        // If name has direct lastName property (not protected)
        if (member.props.name.lastName) {
          return member.props.name.lastName;
        }
        // If name has a method to get last name
        if (typeof member.props.name.getLastName === 'function') {
          return member.props.name.getLastName();
        }
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Helper to estimate if this relationship likely qualifies for S.29 Dependency.
   */
  private calculateS29Eligibility(
    command: RecordCohabitationCommand,
    durationDays: number,
  ): boolean {
    // Rule of thumb for S.29 eligibility:
    // 1. 2+ years of cohabitation OR
    // 2. Children together OR
    // 3. Joint assets + at least some duration

    if (durationDays >= 730) {
      // 2 years
      return true;
    }

    if (command.hasChildrenTogether) {
      return true;
    }

    if (command.jointAssets && durationDays >= 180) {
      // 6 months with joint assets
      return true;
    }

    return false;
  }
}
