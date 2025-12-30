import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { FamilyAggregate } from '../../../../domain/aggregates/family.aggregate';
import { UniqueEntityID } from '../../../../domain/base/unique-entity-id';
import type { IFamilyRepository } from '../../../../domain/interfaces/ifamily.repository';
import { FAMILY_REPOSITORY } from '../../../../domain/interfaces/ifamily.repository';
import { KenyanNationalId } from '../../../../domain/value-objects/kenyan-identity.vo';
import { AppErrors } from '../../../common/application.error';
import { BaseCommandHandler } from '../../../common/base/base.command-handler';
import { Result } from '../../../common/result';
import { VerifyMemberIdentityCommand } from '../impl/verify-member-identity.command';

@CommandHandler(VerifyMemberIdentityCommand)
export class VerifyMemberIdentityHandler
  extends BaseCommandHandler<VerifyMemberIdentityCommand, FamilyAggregate, Result<string>>
  implements ICommandHandler<VerifyMemberIdentityCommand, Result<string>>
{
  constructor(
    @Inject(FAMILY_REPOSITORY)
    protected readonly repository: IFamilyRepository,
    protected readonly eventBus: EventBus,
  ) {
    super(eventBus, repository as any, undefined);
  }

  async execute(command: VerifyMemberIdentityCommand): Promise<Result<string>> {
    this.logger.log(`Verifying identity for member ${command.memberId}`);

    try {
      command.validate();

      // 1. Load Aggregate
      const family = await this.repository.findById(command.familyId);
      if (!family) {
        return Result.fail(new AppErrors.NotFoundError('Family', command.familyId));
      }

      // 2. Find Member
      const member = family.getMember(new UniqueEntityID(command.memberId));
      if (!member) {
        return Result.fail(new AppErrors.NotFoundError('Member', command.memberId));
      }

      // 3. Update Identity Data (if correction provided)
      const verifierId = new UniqueEntityID(command.userId);

      if (command.correctedNationalId) {
        // Instantiate VO correctly
        const nationalIdVO = new KenyanNationalId(command.correctedNationalId);

        member.updateInformation(
          {
            nationalId: nationalIdVO,
          },
          verifierId,
        );
      }

      // 4. Verify
      const verificationNotes = `${command.verificationMethod}: ${command.notes || ''}`;

      // Assuming verifyNationalId method exists on FamilyMember entity
      member.verifyNationalId(command.isValid, verifierId, verificationNotes);

      // 5. Save
      await this.repository.save(family);

      // 6. Publish Events
      this.publishEventsAndCommit(family);

      return Result.ok(member.id.toString());
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('non-existent national ID')) {
          return Result.fail(
            new AppErrors.ValidationError(
              'Cannot verify a member without a National ID number. Please provide a corrected ID.',
            ),
          );
        }
        if (error.message.includes('Validation')) {
          return Result.fail(new AppErrors.ValidationError(error.message));
        }
      }
      return Result.fail(new AppErrors.UnexpectedError(error));
    }
  }
}
