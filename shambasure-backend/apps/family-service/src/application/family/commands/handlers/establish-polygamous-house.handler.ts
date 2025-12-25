import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { FamilyAggregate } from '../../../../domain/aggregates/family.aggregate';
import { UniqueEntityID } from '../../../../domain/base/unique-entity-id';
import { FamilyMember } from '../../../../domain/entities/family-member.entity';
import { PolygamousHouse } from '../../../../domain/entities/polygamous-house.entity';
import type { IFamilyRepository } from '../../../../domain/interfaces/ifamily.repository';
import { FAMILY_REPOSITORY } from '../../../../domain/interfaces/ifamily.repository';
import { Gender, KenyanCounty } from '../../../../domain/value-objects/family-enums.vo';
import { AppErrors } from '../../../common/application.error';
import { BaseCommandHandler } from '../../../common/base/base.command-handler';
import { Result } from '../../../common/result';
import { EstablishPolygamousHouseCommand } from '../impl/establish-polygamous-house.command';

@CommandHandler(EstablishPolygamousHouseCommand)
export class EstablishPolygamousHouseHandler
  extends BaseCommandHandler<EstablishPolygamousHouseCommand, FamilyAggregate, Result<string>>
  implements ICommandHandler<EstablishPolygamousHouseCommand, Result<string>>
{
  constructor(
    @Inject(FAMILY_REPOSITORY)
    protected readonly repository: IFamilyRepository,
    protected readonly eventBus: EventBus,
  ) {
    super(eventBus, repository as any, undefined);
  }

  async execute(command: EstablishPolygamousHouseCommand): Promise<Result<string>> {
    this.logger.log(`Establishing Polygamous House for family ${command.familyId}`);

    try {
      command.validate();

      // 1. Load Aggregate
      const family = await this.repository.findById(command.familyId);
      if (!family) {
        return Result.fail(new AppErrors.NotFoundError('Family', command.familyId));
      }

      // 2. Validate Family State (S.40 Pre-requisites)
      if (!family.isPolygamous()) {
        return Result.fail(
          new AppErrors.ConflictError(
            'Cannot establish a Polygamous House in a Monogamous family. Please register a second valid marriage first.',
          ),
        );
      }

      // 3. Get the wife (originalWifeId is required)
      const originalWifeId = new UniqueEntityID(command.originalWifeId);
      const originalWife = family.getMember(originalWifeId);
      if (!originalWife) {
        return Result.fail(
          new AppErrors.NotFoundError('Original Wife Member', command.originalWifeId),
        );
      }

      // Verify this member is female (for wife role)
      const originalWifeGender: Gender = originalWife.props.gender;
      if (originalWifeGender !== Gender.FEMALE) {
        return Result.fail(new AppErrors.ValidationError('Original wife must be female.'));
      }

      // 4. Validate house head (could be the wife or someone else)
      let houseHead: FamilyMember = originalWife; // Default to wife as house head

      if (command.houseHeadId && command.houseHeadId !== command.originalWifeId) {
        const houseHeadId = new UniqueEntityID(command.houseHeadId);
        const foundHouseHead = family.getMember(houseHeadId);

        if (!foundHouseHead) {
          return Result.fail(new AppErrors.NotFoundError('House Head Member', command.houseHeadId));
        }

        // House head must be an adult
        if (!foundHouseHead.isAdult()) {
          return Result.fail(new AppErrors.ValidationError('House head must be an adult.'));
        }

        houseHead = foundHouseHead;
      }

      // 5. Check for duplicate house order
      const existingHouse = family.props.houses.find(
        (house) => house.props.houseOrder === command.houseOrder,
      );

      if (existingHouse) {
        return Result.fail(
          new AppErrors.ConflictError(`House order ${command.houseOrder} already exists.`),
        );
      }

      // 6. Create Entity
      const houseId = new UniqueEntityID();
      const userId = new UniqueEntityID(command.userId);

      // Handle optional successorId
      const successorId = command.successorId ? new UniqueEntityID(command.successorId) : undefined;

      // Handle optional residentialCounty (assuming it's an enum)
      let residentialCounty: KenyanCounty | undefined;
      if (command.residentialCounty) {
        // You might need to validate/enforce the enum type here
        residentialCounty = command.residentialCounty;
      }

      const house = PolygamousHouse.create(
        {
          familyId: family.id,
          houseName: command.houseName,
          houseOrder: command.houseOrder,
          houseCode: command.houseCode || `HOUSE_${command.houseOrder}`,

          // House Leadership
          houseHeadId: houseHead.id,
          originalWifeId: originalWife.id,
          currentWifeId: originalWife.id,

          // Establishment Details
          establishedDate: new Date(),
          establishmentType: command.establishmentType || 'CUSTOMARY',
          establishmentWitnesses: command.establishmentWitnesses || [],
          establishmentLocation: command.establishmentLocation,

          // Legal Status
          courtRecognized: false, // Default, can be verified later
          courtRecognitionDate: undefined,
          courtCaseNumber: undefined,
          recognitionDocumentId: undefined,

          // House Members
          wifeIds: [originalWife.id], // Start with the original wife
          childrenIds: [],
          memberCount: 1, // Denormalized count

          // House Assets (empty initially)
          houseAssets: [],

          // S.40 Distribution Rules
          distributionWeight: command.distributionWeight || 1.0,
          specialAllocation: command.specialAllocation,

          // House Status
          isActive: true,
          dissolutionDate: undefined,
          dissolutionReason: undefined,

          // Cultural Context
          houseColor: command.houseColor,
          houseSymbol: command.houseSymbol,
          traditionalName: command.traditionalName,
          houseMotto: command.houseMotto,

          // Residential Information
          primaryResidence: command.primaryResidence,
          residentialCounty: residentialCounty,
          hasSeparateHomestead: command.hasSeparateHomestead || false,

          // Financial Information
          houseMonthlyExpenses: command.houseMonthlyExpenses,
          houseAnnualIncome: command.houseAnnualIncome,
          financialDependents: command.financialDependents || 0,

          // Succession Planning
          successorId: successorId,
          successionRules: command.successionRules,

          // Metadata
          createdBy: userId,
          lastUpdatedBy: userId,
          verificationStatus: 'UNVERIFIED',
          verificationNotes: command.verificationNotes,

          // Audit
          lastAuditedAt: undefined,
          isArchived: false,
        },
        houseId,
      );

      // 7. Execute Domain Logic
      family.establishPolygamousHouse(house);

      // 8. Save
      await this.repository.save(family);

      // 9. Publish Events
      this.publishEventsAndCommit(family);

      return Result.ok(houseId.toString());
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          return Result.fail(new AppErrors.ConflictError(error.message));
        }
        if (error.message.includes('non-polygamous')) {
          return Result.fail(new AppErrors.ValidationError(error.message));
        }
        if (error.message.includes('must have at least one wife')) {
          return Result.fail(new AppErrors.ValidationError(error.message));
        }
        if (error.message.includes('House order must be at least 1')) {
          return Result.fail(new AppErrors.ValidationError(error.message));
        }
      }
      return Result.fail(new AppErrors.UnexpectedError(error));
    }
  }
}
