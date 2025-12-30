import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { FamilyAggregate } from '../../../../domain/aggregates/family.aggregate';
import { UniqueEntityID } from '../../../../domain/base/unique-entity-id';
import { FamilyMember } from '../../../../domain/entities/family-member.entity';
import { PolygamousHouse } from '../../../../domain/entities/polygamous-house.entity';
import type { IFamilyRepository } from '../../../../domain/interfaces/ifamily.repository';
import { FAMILY_REPOSITORY } from '../../../../domain/interfaces/ifamily.repository';
import { Gender } from '../../../../domain/value-objects/family-enums.vo';
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
      // The Aggregate method `establishPolygamousHouse` also checks this, but failing fast here is good UX
      if (!family.isPolygamous()) {
        return Result.fail(
          new AppErrors.ConflictError(
            'Cannot establish a Polygamous House in a Monogamous family. Please register a second valid marriage first to trigger S.40 compliance.',
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

      // Digital Lawyer: Verify this member is female (Traditional S.40 House Logic)
      if (originalWife.props.gender !== Gender.FEMALE) {
        return Result.fail(
          new AppErrors.ValidationError('Original wife establishing a House must be female.'),
        );
      }

      // 4. Validate house head (could be the wife or the husband/patriarch)
      // Usually, the House Head is the Wife herself, or the Husband managing that specific house
      let houseHead: FamilyMember = originalWife;

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

      // 5. Check for duplicate house order (Aggregate does this too, but we check here for specific error)
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
          courtRecognized: false,
          courtRecognitionDate: undefined,
          courtCaseNumber: undefined,
          recognitionDocumentId: undefined,

          // House Members
          wifeIds: [originalWife.id],
          childrenIds: [],
          memberCount: 1, // Starting with the wife

          // Assets
          houseAssets: [],

          // S.40 Distribution Rules
          distributionWeight: command.distributionWeight || 1.0, // Default 1 share
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

          // Residential
          primaryResidence: command.primaryResidence,
          residentialCounty: command.residentialCounty,
          hasSeparateHomestead: command.hasSeparateHomestead || false,

          // Financial
          houseMonthlyExpenses: command.houseMonthlyExpenses,
          houseAnnualIncome: command.houseAnnualIncome,
          financialDependents: command.financialDependents || 0,

          // Succession
          successorId: command.successorId ? new UniqueEntityID(command.successorId) : undefined,
          successionRules: command.successionRules,

          // Metadata
          createdBy: userId,
          lastUpdatedBy: userId,
          verificationStatus: 'UNVERIFIED',
          verificationNotes: command.verificationNotes,
          isArchived: false,
          lastAuditedAt: undefined,
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
        if (error.message.includes('Polygamous houses exist without')) {
          return Result.fail(new AppErrors.ConflictError(error.message));
        }
      }
      return Result.fail(new AppErrors.UnexpectedError(error));
    }
  }
}
