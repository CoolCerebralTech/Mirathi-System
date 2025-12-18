import { Injectable } from '@nestjs/common';
import { CommandBus, CommandHandler, EventBus } from '@nestjs/cqrs';

import type { IFamilyMemberRepository } from '../../../../domain/interfaces/repositories/ifamily-member.repository';
import type { IFamilyRepository } from '../../../../domain/interfaces/repositories/ifamily.repository';
import { Result } from '../../../common/base/result';
import { RemoveFamilyMemberCommand } from '../impl/remove-family-member.command';
import { BaseCommandHandler } from './base.command-handler';

@Injectable()
@CommandHandler(RemoveFamilyMemberCommand)
export class RemoveFamilyMemberHandler extends BaseCommandHandler<
  RemoveFamilyMemberCommand,
  Result<void>
> {
  constructor(
    private readonly familyRepository: IFamilyRepository,
    private readonly memberRepository: IFamilyMemberRepository,
    commandBus: CommandBus,
    eventBus: EventBus,
  ) {
    super(commandBus, eventBus);
  }

  async execute(command: RemoveFamilyMemberCommand): Promise<Result<void>> {
    try {
      const validation = this.validateCommand(command);
      if (validation.isFailure) return Result.fail(validation.error!);

      // 1. Load Aggregates
      const family = await this.familyRepository.findById(command.familyId);
      if (!family) return Result.fail(new Error('Family not found'));

      const member = await this.memberRepository.findById(command.memberId);
      if (!member) return Result.fail(new Error('Member not found'));

      // 2. Domain Logic: Remove from Family (Updates counts, triggers MemberRemovedEvent)
      family.removeMember(member);

      // 3. Domain Logic: Archive Member (Soft Delete)
      member.archive(command.reason, command.userId);

      // 4. Persist
      await this.familyRepository.update(family);
      await this.memberRepository.update(member);

      // OR if hard delete is required by repo:
      // await this.familyRepository.removeMember(family.id, member.id);

      // 5. Publish Events
      await this.publishDomainEvents(family);
      await this.publishDomainEvents(member);

      this.logSuccess(command, undefined, 'Member removed from family');
      return Result.ok();
    } catch (error) {
      this.handleError(error, command, 'RemoveFamilyMemberHandler');
    }
  }
}
