import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { FamilyAggregate } from '../../../../domain/aggregates/family.aggregate';
import { UniqueEntityID } from '../../../../domain/base/unique-entity-id';
import { ValueObjectValidationError } from '../../../../domain/base/value-object';
import { FamilyMember } from '../../../../domain/entities/family-member.entity';
import type { IFamilyRepository } from '../../../../domain/interfaces/ifamily.repository';
import { FAMILY_REPOSITORY } from '../../../../domain/interfaces/ifamily.repository';
import { KenyanNationalId } from '../../../../domain/value-objects/kenyan-identity.vo';
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

      // 1. Digital Lawyer: Duplicate Check
      // We assume the repository has this capability to prevent confusion in the same region
      if (command.homeCounty && this.repository.existsByNameAndCounty) {
        const exists = await this.repository.existsByNameAndCounty(
          command.familyName,
          command.homeCounty,
        );
        if (exists) {
          return Result.fail(
            new AppErrors.ConflictError(
              `A family named '${command.familyName}' already exists in ${command.homeCounty}. Please add a distinguisher (e.g., 'The Otieno Family of Kisumu').`,
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

      // Digital Lawyer: Validate National ID
      let nationalIdVO: KenyanNationalId | undefined;
      if (command.creatorProfile.nationalId) {
        try {
          nationalIdVO = new KenyanNationalId(command.creatorProfile.nationalId);
        } catch (e) {
          if (e instanceof ValueObjectValidationError) {
            return Result.fail(new AppErrors.ValidationError(e.message));
          }
          throw e;
        }
      }

      // 3. Create Creator Member (Head of Family)
      const creatorMember = FamilyMember.create({
        name: creatorName,
        // userId: creatorId, // REMOVED: FamilyMember entity doesn't usually link to Auth User directly, the Aggregate does via creatorId
        gender: command.creatorProfile.gender,
        dateOfBirth: command.creatorProfile.dateOfBirth,
        dateOfBirthEstimated: false,
        placeOfBirth: command.homeCounty, // Default place of birth to home county for the creator if not specified

        // Identity
        nationalId: nationalIdVO,
        nationalIdVerified: false,

        // Status
        isHeadOfFamily: true, // This is the genesis member
        isAlive: true,
        isMarried: false, // Initial state
        hasChildren: false,

        // Defaults
        tribe: command.clanName, // Fallback if tribe not explicitly set in profile
        languages: [],
        medicalConditions: [],
        traditionalTitles: [],
        isMissing: false,
        hasDisability: false,
        isMentallyIncapacitated: false,
        isStudent: false,
        initiationRitesCompleted: false,

        // Audit
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
          ancestralHome: command.homeCounty ? `County: ${command.homeCounty}` : undefined,
        },
        creatorMember,
      );

      // 5. Save
      await this.repository.save(family);

      // 6. Publish Events (FamilyCreatedEvent)
      this.publishEventsAndCommit(family);

      this.logger.log(`Family created successfully: ${family.id.toString()}`);

      return Result.ok(family.id.toString());
    } catch (error) {
      // Handle known duplicate key errors from DB if repository check missed it
      if (error instanceof Error && error.message.includes('Duplicate')) {
        return Result.fail(new AppErrors.ConflictError('Family with this name already exists.'));
      }
      return Result.fail(new AppErrors.UnexpectedError(error));
    }
  }
}
