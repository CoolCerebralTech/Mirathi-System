// src/application/guardianship/commands/handlers/create-guardianship.handler.ts
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus } from '@nestjs/cqrs';

// Domain Imports
import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import {
  GUARDIANSHIP_REPOSITORY,
  type IGuardianshipRepository,
} from '../../../../domain/interfaces/iguardianship.repository';
// Value Objects
import { FamilyMemberReferenceVO } from '../../../../domain/value-objects/family-member-reference.vo';
import { LegalGuardianshipType } from '../../../../domain/value-objects/guardianship-type.vo';
import { KenyanCourtOrderVO } from '../../../../domain/value-objects/kenyan-court-order.vo';
import { PersonName } from '../../../../domain/value-objects/person-name.vo';
// Common
import { AppErrors } from '../../../common/application.error';
import { BaseCommandHandler } from '../../../common/base/base.command-handler';
import { Result } from '../../../common/result';
import { CreateGuardianshipCommand } from '../impl/create-guardianship.command';

@CommandHandler(CreateGuardianshipCommand)
export class CreateGuardianshipHandler extends BaseCommandHandler<
  CreateGuardianshipCommand,
  GuardianshipAggregate,
  Result<string>
> {
  constructor(
    @Inject(GUARDIANSHIP_REPOSITORY)
    private readonly guardianshipRepo: IGuardianshipRepository,
    eventBus: EventBus,
  ) {
    // We pass the repo and eventBus to base, though we might not use base.run() for creation
    super(eventBus, guardianshipRepo);
  }

  async execute(command: CreateGuardianshipCommand): Promise<Result<string>> {
    const { payload } = command;

    try {
      // 1. Check for existing active guardianship for this ward
      // (Strict Boundary: One active guardianship per child)
      const existingGuardianship = await this.guardianshipRepo.findActiveByWardId(payload.wardId);
      if (existingGuardianship) {
        return Result.fail(
          new AppErrors.ConflictError(
            `Active guardianship already exists for ward ${payload.wardId}`,
          ),
        );
      }

      // 2. Construct Value Objects

      // 2a. Ward Reference (Identity)
      const wardName = PersonName.create({
        firstName: payload.wardFirstName,
        lastName: payload.wardLastName,
      });

      const wardReference = FamilyMemberReferenceVO.create({
        memberId: payload.wardId,
        fullName: wardName,
        dateOfBirth: new Date(payload.wardDateOfBirth),
        gender: payload.wardGender,
        isAlive: payload.wardIsAlive,
        verificationStatus: 'UNVERIFIED',
      });

      // 2b. Court Order (if applicable)
      let courtOrderVO: KenyanCourtOrderVO | undefined;

      if (payload.courtOrder) {
        courtOrderVO = KenyanCourtOrderVO.create({
          caseNumber: payload.courtOrder.caseNumber,
          courtStation: payload.courtOrder.courtStation,
          orderDate: payload.courtOrder.orderDate,
          // FIX: Mapped correctly to 'judgeName' as per VO definition
          judgeName: payload.courtOrder.judgeName,
          // FIX: 'orderType' is required by the VO
          orderType: 'GUARDIANSHIP',
        });
      }

      // 3. Create the Aggregate Root
      const guardianship = GuardianshipAggregate.create({
        wardReference,
        guardianshipType: payload.guardianshipType as LegalGuardianshipType,
        courtOrder: courtOrderVO,
        requiresPropertyManagement: payload.requiresPropertyManagement,
        jurisdiction: payload.jurisdiction,
        legalNotes: payload.legalNotes,
        caseNumber: payload.courtOrder?.caseNumber,
      });

      // 4. Persistence Flow (Custom for Create)
      // We do NOT use this.run() here because that expects to load an existing aggregate.

      // Validate one last time (Aggregate invariants)
      guardianship.validate();

      // Save to Repository
      await this.guardianshipRepo.save(guardianship);

      // Dispatch Domain Events (GuardianshipCreatedEvent)
      this.publishEventsAndCommit(guardianship);

      // FIX: Added .toString() to avoid template literal error
      this.logSuccess(command, `Created Guardianship ${guardianship.id.toString()}`);

      return Result.ok(guardianship.id.toString());
    } catch (error) {
      this.handleError(error, command);
      // Ensure we return a Result.fail if handleError doesn't throw (depending on base impl)
      return Result.fail(error as Error);
    }
  }
}
