import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { FamilyAggregate } from '../../../../domain/aggregates/family.aggregate';
import { UniqueEntityID } from '../../../../domain/base/unique-entity-id';
import { FamilyMember } from '../../../../domain/entities/family-member.entity';
import type { IFamilyRepository } from '../../../../domain/interfaces/ifamily.repository';
import { FAMILY_REPOSITORY } from '../../../../domain/interfaces/ifamily.repository';
import { PersonName } from '../../../../domain/value-objects/person-name.vo';
import { AppErrors } from '../../../common/application.error';
import { BaseCommandHandler } from '../../../common/base/base.command-handler';
import { Result } from '../../../common/result';
import { CreateFamilyCommand } from '../impl/create-family.command';

@CommandHandler(CreateFamilyCommand)
export class CreateFamilyHandler
  extends BaseCommandHandler<CreateFamilyCommand, FamilyAggregate, Result<string>>
  implements ICommandHandler<CreateFamilyCommand, Result<string>>
{
  constructor(
    @Inject(FAMILY_REPOSITORY)
    protected readonly repository: IFamilyRepository,
    protected readonly eventBus: EventBus,
  ) {
    super(eventBus, repository as any, undefined);
  }

  async execute(command: CreateFamilyCommand): Promise<Result<string>> {
    this.logger.log(`Executing CreateFamilyCommand for user ${command.userId}`);

    try {
      command.validate();

      // 1. Duplicate Check
      if (command.homeCounty) {
        const exists = await this.repository.existsByNameAndCounty(
          command.familyName,
          command.homeCounty,
        );
        if (exists) {
          return Result.fail(
            new AppErrors.ConflictError(
              `A family named '${command.familyName}' already exists in ${command.homeCounty}.`,
            ),
          );
        }
      }

      // 2. Prepare Value Objects
      const creatorId = new UniqueEntityID(command.userId);

      const creatorName = PersonName.create({
        firstName: command.creatorProfile.firstName,
        lastName: command.creatorProfile.lastName,
        middleName: command.creatorProfile.middleName,
      });

      // 3. Create Creator Member
      const creatorMember = FamilyMember.create({
        name: creatorName,
        userId: creatorId,
        gender: command.creatorProfile.gender,
        dateOfBirth: command.creatorProfile.dateOfBirth,
        dateOfBirthEstimated: false,
        isHeadOfFamily: true,
        isAlive: true,
        isMarried: false,
        hasChildren: false,
        nationalId: command.creatorProfile.nationalId
          ? ({ toString: () => command.creatorProfile.nationalId } as any)
          : undefined,
        nationalIdVerified: false,
        languages: [],
        medicalConditions: [],
        traditionalTitles: [],
        isMissing: false,
        hasDisability: false,
        isMentallyIncapacitated: false,
        isStudent: false,
        initiationRitesCompleted: false,
        createdBy: creatorId,
        lastUpdatedBy: creatorId,
        verificationStatus: 'UNVERIFIED',
        isArchived: false,
      });

      // 4. Create Aggregate
      const family = FamilyAggregate.create(
        {
          name: command.familyName,
          description: command.description,
          creatorId: creatorId,
          homeCounty: command.homeCounty,
          clanName: command.clanName,
          subClan: command.subClan,
          familyTotem: command.totem,
        },
        creatorMember,
      );

      // 5. Save (returns Promise<FamilyAggregate>)
      await this.repository.save(family);

      // 6. Publish Events
      this.publishEventsAndCommit(family);

      this.logger.log(`Family created successfully: ${family.id.toString()}`);

      return Result.ok(family.id.toString());
    } catch (error) {
      return Result.fail(new AppErrors.UnexpectedError(error));
    }
  }
}
