import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { FamilyAggregate } from '../../../../domain/aggregates/family.aggregate';
import { UniqueEntityID } from '../../../../domain/base/unique-entity-id';
import { AdoptionRecord } from '../../../../domain/entities/adoption-record.entity';
import type { IFamilyRepository } from '../../../../domain/interfaces/ifamily.repository';
import { FAMILY_REPOSITORY } from '../../../../domain/interfaces/ifamily.repository';
import { KenyanLawSection } from '../../../../domain/value-objects/family-enums.vo';
import { AppErrors } from '../../../common/application.error';
import { BaseCommandHandler } from '../../../common/base/base.command-handler';
import { Result } from '../../../common/result';
import { RecordAdoptionCommand } from '../impl/record-adoption.command';

@CommandHandler(RecordAdoptionCommand)
export class RecordAdoptionHandler
  extends BaseCommandHandler<RecordAdoptionCommand, FamilyAggregate, Result<string>>
  implements ICommandHandler<RecordAdoptionCommand, Result<string>>
{
  constructor(
    @Inject(FAMILY_REPOSITORY)
    protected readonly repository: IFamilyRepository,
    protected readonly eventBus: EventBus,
  ) {
    super(eventBus, repository as any, undefined);
  }

  async execute(command: RecordAdoptionCommand): Promise<Result<string>> {
    this.logger.log(`Recording adoption in family ${command.familyId}`);

    try {
      command.validate();

      // 1. Load Aggregate
      const family = await this.repository.findById(command.familyId);
      if (!family) {
        return Result.fail(new AppErrors.NotFoundError('Family', command.familyId));
      }

      // 2. Validate Participants
      const adopteeId = new UniqueEntityID(command.adopteeId);
      const parentId = new UniqueEntityID(command.adoptiveParentId);

      const adoptee = family.getMember(adopteeId);
      const parent = family.getMember(parentId);

      if (!adoptee) {
        return Result.fail(new AppErrors.NotFoundError('Adoptee Member', command.adopteeId));
      }
      if (!parent) {
        return Result.fail(
          new AppErrors.NotFoundError('Adoptive Parent Member', command.adoptiveParentId),
        );
      }

      // 3. Business Rule: Age Gap Check
      if (parent.calculateAge() !== null && adoptee.calculateAge() !== null) {
        const parentAge = parent.calculateAge()!;
        const adopteeAge = adoptee.calculateAge()!;

        if (parentAge < 21) {
          return Result.fail(
            new AppErrors.ValidationError('Adoptive parent must be at least 21 years old.'),
          );
        }

        if (parentAge <= adopteeAge) {
          return Result.fail(
            new AppErrors.ValidationError('Adoptive parent must be older than the adoptee.'),
          );
        }
      }

      // 4. Map command types to entity types
      const adoptionType = this.mapAdoptionType(command.adoptionType);

      // 5. Calculate child age at adoption in months
      const childAgeAtAdoption = this.calculateChildAgeAtAdoption(
        adoptee.props.dateOfBirth,
        command.adoptionDate,
      );

      // 6. Create Entity
      const recordId = new UniqueEntityID();
      const creatorId = new UniqueEntityID(command.userId);

      // Determine legal basis based on adoption type
      const legalBasis: KenyanLawSection[] =
        adoptionType === 'CUSTOMARY'
          ? ['CUSTOMARY_LAW' as KenyanLawSection]
          : ['CHILDREN_ACT_S154' as KenyanLawSection, 'CHILDREN_ACT_S165' as KenyanLawSection];

      const adoptionRecord = AdoptionRecord.create(
        {
          // Core Information
          familyId: family.id,
          adopteeId: adoptee.id,
          adoptiveParentId: parent.id,

          // Adoption Details
          adoptionType: adoptionType,
          adoptionStatus: 'FINALIZED', // Assuming we are recording a completed event

          // Dates - using adoptionDate for both application and finalization since it's already done
          applicationDate: command.adoptionDate,
          finalizationDate: command.adoptionDate,
          effectiveDate: command.adoptionDate,

          // Legal Framework
          legalBasis: legalBasis,
          courtOrderNumber: command.courtOrderNumber,
          courtStation: command.courtName || 'Not Specified',
          presidingJudge: undefined,

          // Biological Parents
          biologicalMotherId: undefined,
          biologicalFatherId: undefined,
          parentalConsentStatus: {
            mother: 'UNKNOWN',
            father: 'UNKNOWN',
          },
          consentDocuments: command.agreementDocumentId ? [command.agreementDocumentId] : [],

          // Social Welfare
          socialWorkerId: undefined,
          socialWorkerReportId: undefined,
          homeStudyReportId: undefined,
          postAdoptionMonitoring: false,
          monitoringPeriodMonths: 0,

          // Adoption Agency
          adoptionAgencyId: undefined,
          agencySocialWorker: undefined,
          agencyApprovalNumber: undefined,

          // International Adoption Specific
          receivingCountry: undefined,
          sendingCountry: undefined,
          hagueConventionCompliant: false,
          immigrationDocumentId: undefined,

          // Customary Adoption Specific
          clanInvolved: !!command.clanElders && command.clanElders.length > 0,
          clanElders: command.clanElders || [],
          customaryRitesPerformed: command.ceremonyLocation ? [command.ceremonyLocation] : [],
          bridePriceConsideration: undefined,

          // Financial Aspects
          adoptionExpenses: 0,
          governmentFeesPaid: false,
          legalFeesPaid: false,
          subsidyReceived: false,
          subsidyAmount: undefined,

          // Child Information at Adoption
          childAgeAtAdoption: childAgeAtAdoption,
          childSpecialNeeds: false,
          specialNeedsDescription: undefined,
          medicalHistoryProvided: false,

          // Sibling Groups
          siblingGroupAdoption: false,
          siblingAdoptionRecordIds: [],

          // Previous Care
          previousCareArrangement: 'RELATIVE_CARE', // Default assumption
          timeInPreviousCareMonths: 0,

          // Post-Adoption Contact
          openAdoption: false,
          contactAgreement: undefined,
          visitationSchedule: undefined,

          // Inheritance Rights
          inheritanceRightsEstablished: true, // Adoption establishes inheritance rights
          inheritanceDocumentId: command.agreementDocumentId,

          // Citizenship & Documentation
          newBirthCertificateIssued: false,
          newBirthCertificateNumber: undefined,
          passportIssued: false,
          passportNumber: undefined,

          // Appeals and Challenges
          appealFiled: false,
          appealCaseNumber: undefined,
          challengePeriodExpired: true, // Assuming adoption is already finalized and challenge period passed

          // Verification
          verificationStatus: 'UNVERIFIED',
          verificationNotes: undefined,
          verifiedBy: undefined,
          lastVerifiedAt: undefined,

          // Metadata
          createdBy: creatorId,
          lastUpdatedBy: creatorId,
          isArchived: false,
        },
        recordId,
      );

      // 7. Apply to Aggregate
      family.recordAdoption(adoptionRecord);

      // 8. Save
      await this.repository.save(family);

      // 9. Publish Events
      this.publishEventsAndCommit(family);

      return Result.ok(recordId.toString());
    } catch (error) {
      if (error instanceof Error) {
        // Handle aggregate validation errors
        if (error.message.includes('Adoptee must be')) {
          return Result.fail(new AppErrors.ValidationError(error.message));
        }
        if (error.message.includes('cannot be the same person')) {
          return Result.fail(new AppErrors.ValidationError(error.message));
        }
        if (error.message.includes('Application date cannot be in the future')) {
          return Result.fail(new AppErrors.ValidationError(error.message));
        }
      }
      this.logger.error('Error recording adoption', error);
      return Result.fail(new AppErrors.UnexpectedError(error));
    }
  }

  /**
   * Map command adoption type to entity adoption type
   */
  private mapAdoptionType(
    commandType: 'FORMAL' | 'CUSTOMARY',
  ):
    | 'STATUTORY'
    | 'CUSTOMARY'
    | 'INTERNATIONAL'
    | 'KINSHIP'
    | 'FOSTER_TO_ADOPT'
    | 'STEP_PARENT'
    | 'RELATIVE' {
    switch (commandType) {
      case 'FORMAL':
        return 'STATUTORY';
      case 'CUSTOMARY':
        return 'CUSTOMARY';
      default:
        return 'STATUTORY'; // Default to statutory for safety
    }
  }

  /**
   * Calculate child age at adoption in months
   */
  private calculateChildAgeAtAdoption(dateOfBirth?: Date, adoptionDate?: Date): number {
    if (!dateOfBirth || !adoptionDate) {
      return 0;
    }

    const birthDate = new Date(dateOfBirth);
    const adoptionDay = new Date(adoptionDate);

    if (adoptionDay < birthDate) {
      return 0; // Adoption before birth shouldn't happen, but handle gracefully
    }

    // Calculate months difference
    let months = (adoptionDay.getFullYear() - birthDate.getFullYear()) * 12;
    months += adoptionDay.getMonth() - birthDate.getMonth();

    // Adjust for days
    if (adoptionDay.getDate() < birthDate.getDate()) {
      months--;
    }

    return Math.max(months, 0);
  }
}
