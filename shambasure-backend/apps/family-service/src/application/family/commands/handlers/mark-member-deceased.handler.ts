import { Injectable } from '@nestjs/common';
import { CommandBus, CommandHandler, EventBus } from '@nestjs/cqrs';

import type { IFamilyMemberRepository } from '../../../../domain/interfaces/repositories/ifamily-member.repository';
import type { IFamilyRepository } from '../../../../domain/interfaces/repositories/ifamily.repository';
import { Result } from '../../../common/base/result';
import { FamilyMemberResponse } from '../../dto/response/family-member.response';
import { FamilyMemberMapper } from '../../mappers/family-member.mapper';
import { MarkMemberDeceasedCommand } from '../impl/mark-member-deceased.command';
import { BaseCommandHandler } from './base.command-handler';

@Injectable()
@CommandHandler(MarkMemberDeceasedCommand)
export class MarkMemberDeceasedHandler extends BaseCommandHandler<
  MarkMemberDeceasedCommand,
  Result<FamilyMemberResponse>
> {
  constructor(
    private readonly familyRepository: IFamilyRepository,
    private readonly memberRepository: IFamilyMemberRepository,
    private readonly memberMapper: FamilyMemberMapper,
    commandBus: CommandBus,
    eventBus: EventBus,
  ) {
    super(commandBus, eventBus);
  }

  async execute(command: MarkMemberDeceasedCommand): Promise<Result<FamilyMemberResponse>> {
    try {
      const validation = this.validateCommand(command);
      if (validation.isFailure) return Result.fail(validation.error!);

      const { memberId, familyId, data } = command;

      // 1. Load Aggregates
      const member = await this.memberRepository.findById(memberId);
      if (!member) return Result.fail(new Error('Member not found'));

      const family = await this.familyRepository.findById(familyId);
      if (!family) return Result.fail(new Error('Family not found'));

      if (member.familyId !== familyId) {
        return Result.fail(new Error('Member does not belong to this family'));
      }

      // 2. Update Member State (Domain Logic)
      member.markAsDeceased({
        dateOfDeath: data.dateOfDeath,
        placeOfDeath: data.placeOfDeath,
        deathCertificateNumber: data.deathCertificateNumber,
        causeOfDeath: data.causeOfDeath,
        issuingAuthority: data.issuingAuthority,
      });

      // 3. Update Family State (Counters)
      family.recordMemberDeath(
        member.id,
        data.dateOfDeath,
        data.deathCertificateNumber,
        data.placeOfDeath,
      );

      // 4. Persist (Ideally transactional)
      await this.memberRepository.update(member);
      await this.familyRepository.update(family);

      // 5. Publish Events
      await this.publishDomainEvents(member);
      await this.publishDomainEvents(family);

      // 6. Response
      const responseDTO = this.memberMapper.toDTO(member);
      const result = Result.ok(responseDTO);

      this.logSuccess(command, result, 'Member marked as deceased');
      return result;
    } catch (error) {
      this.handleError(error, command, 'MarkMemberDeceasedHandler');
    }
  }
}
