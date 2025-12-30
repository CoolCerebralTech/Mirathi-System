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
      // Accessing name details via toJSON() since props are protected
      const p1Name = partner1.props.name.toJSON();
      const p2Name = partner2.props.name.toJSON();

      const partner1LastName = p1Name.lastName;
      const partner2LastName = p2Name.lastName;

      if (
        partner1LastName &&
        partner2LastName &&
        partner1LastName.toLowerCase() === partner2LastName.toLowerCase()
      ) {
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
      const relationshipType = command.isExclusive ? 'COME_WE_STAY' : 'DATING';

      // 5. Instantiate Entity
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
          witnesses: command.witnesses || [],
          communityAcknowledged: command.communityAcknowledged || false,

          // Children
          childrenIds: [],
          hasChildren: command.hasChildrenTogether,
          childrenBornDuringCohabitation: command.hasChildrenTogether,

          // Financial Interdependence
          jointFinancialAccounts: command.jointFinancialAccounts || false,
          jointPropertyOwnership: command.jointPropertyOwnership || false,
          financialSupportProvided: false, // Default
          supportEvidence: [],

          // Social Recognition
          knownAsCouple: command.knownAsCouple || false,
          familyAcknowledged: command.familyAcknowledged || false,
          socialMediaEvidence: undefined,

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

          // Utilities
          hasJointUtilities: false,

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

      // 6. Apply to Aggregate
      family.recordCohabitation(cohabitation);

      // 7. Save
      await this.repository.save(family);

      // 8. Publish Events
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
        // Catch-all for entity validation errors
        if (error.message.includes('required')) {
          return Result.fail(new AppErrors.ValidationError(error.message));
        }
      }
      return Result.fail(new AppErrors.UnexpectedError(error));
    }
  }

  /**
   * Helper to estimate if this relationship likely qualifies for S.29 Dependency.
   */
  private calculateS29Eligibility(
    command: RecordCohabitationCommand,
    durationDays: number,
  ): boolean {
    // S.29 Eligibility Heuristic
    if (durationDays >= 730) return true; // 2 years
    if (command.hasChildrenTogether) return true;
    if (command.jointAssets && durationDays >= 180) return true; // 6 months + Assets
    return false;
  }
}
