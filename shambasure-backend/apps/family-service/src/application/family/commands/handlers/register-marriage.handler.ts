import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { FamilyAggregate } from '../../../../domain/aggregates/family.aggregate';
import { UniqueEntityID } from '../../../../domain/base/unique-entity-id';
import { Marriage } from '../../../../domain/entities/marriage.entity';
import type { IFamilyRepository } from '../../../../domain/interfaces/ifamily.repository';
import { FAMILY_REPOSITORY } from '../../../../domain/interfaces/ifamily.repository';
import { MarriageStatus, MarriageType } from '../../../../domain/value-objects/family-enums.vo';
import { AppErrors } from '../../../common/application.error';
import { BaseCommandHandler } from '../../../common/base/base.command-handler';
import { Result } from '../../../common/result';
import { RegisterMarriageCommand } from '../impl/register-marriage.command';

@CommandHandler(RegisterMarriageCommand)
export class RegisterMarriageHandler
  extends BaseCommandHandler<RegisterMarriageCommand, FamilyAggregate, Result<string>>
  implements ICommandHandler<RegisterMarriageCommand, Result<string>>
{
  constructor(
    @Inject(FAMILY_REPOSITORY)
    protected readonly repository: IFamilyRepository,
    protected readonly eventBus: EventBus,
  ) {
    super(eventBus, repository as any, undefined);
  }

  async execute(command: RegisterMarriageCommand): Promise<Result<string>> {
    this.logger.log(`Registering marriage in family ${command.familyId}`);

    try {
      command.validate();

      // 1. Load Aggregate
      const family = await this.repository.findById(command.familyId);
      if (!family) {
        return Result.fail(new AppErrors.NotFoundError('Family', command.familyId));
      }

      // 2. Validate Spouses Exist in Family
      const spouse1 = family.getMember(new UniqueEntityID(command.spouse1Id));
      const spouse2 = family.getMember(new UniqueEntityID(command.spouse2Id));

      if (!spouse1) {
        return Result.fail(new AppErrors.NotFoundError('Spouse 1', command.spouse1Id));
      }
      if (!spouse2) {
        return Result.fail(new AppErrors.NotFoundError('Spouse 2', command.spouse2Id));
      }

      // 3. Prepare Identity
      const marriageId = new UniqueEntityID();
      const createdBy = new UniqueEntityID(command.userId);

      // 4. Map Command to Entity Props
      const marriage = Marriage.create(
        {
          spouse1Id: spouse1.id,
          spouse2Id: spouse2.id,
          marriageType: command.marriageType,
          marriageStatus: MarriageStatus.MARRIED,

          startDate: command.startDate,
          ceremonyLocation: command.location,
          ceremonyCounty: command.county,
          witnesses: command.witnesses,

          // Legal Details
          registrationNumber: command.registrationNumber,
          registeredBy: command.userId, // System user recorded it

          // Polygamy Logic (S.40)
          isPolygamous: command.isPolygamous,
          polygamousHouseId: command.polygamousHouseId
            ? new UniqueEntityID(command.polygamousHouseId)
            : undefined,
          marriageOrder: command.marriageOrder,

          // Customary Details (Dowry)
          bridePricePaid: !!command.dowryPayment,
          bridePriceAmount: command.dowryPayment?.amount,
          bridePriceCurrency: command.dowryPayment?.currency,
          bridePaidInFull: command.dowryPayment?.isPaidInFull || false,
          customaryDetails:
            command.marriageType === MarriageType.CUSTOMARY
              ? {
                  location: command.location || 'Unknown',
                  eldersPresent: command.witnesses, // Elders act as witnesses
                  clanRepresentatives: [],
                  traditionalRitesPerformed: ['Negotiations'], // Default
                  livestockExchanged: command.dowryPayment?.livestockCount,
                }
              : undefined,

          // Defaults
          numberOfChildren: 0,
          childrenIds: [],
          jointProperty: false, // Default to separate until proven otherwise
          isMarriageDissolved: false,
          waitingPeriodCompleted: true,
          isArchived: false,
          verificationStatus: command.registrationNumber ? 'PENDING_VERIFICATION' : 'UNVERIFIED',
          createdBy: createdBy,
          lastUpdatedBy: createdBy,
        },
        marriageId,
      );

      // 5. Register in Aggregate
      // This will throw if business rules are violated (e.g., active marriage exists)
      family.registerMarriage(marriage);

      // 6. Save
      await this.repository.save(family);

      // 7. Publish Events
      this.publishEventsAndCommit(family);

      return Result.ok(marriageId.toString());
    } catch (error) {
      if (error instanceof Error) {
        // Handle Aggregate Business Rule Violations
        if (error.message.includes('Active marriage already exists')) {
          return Result.fail(new AppErrors.ConflictError(error.message));
        }
        if (error.message.includes('Polygamous')) {
          return Result.fail(new AppErrors.ValidationError(error.message));
        }
      }
      return Result.fail(new AppErrors.UnexpectedError(error));
    }
  }
}
