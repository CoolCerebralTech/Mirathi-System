import { Injectable } from '@nestjs/common';
import { CommandBus, CommandHandler, EventBus } from '@nestjs/cqrs';

import { FamilyMember } from '../../../../domain/entities/family-member.entity';
import type { IFamilyMemberRepository } from '../../../../domain/interfaces/repositories/ifamily-member.repository';
import type { IFamilyRepository } from '../../../../domain/interfaces/repositories/ifamily.repository';
import { Result } from '../../../common/base/result';
import { FamilyMemberResponse } from '../../dto/response/family-member.response';
import { FamilyMemberMapper } from '../../mappers/family-member.mapper';
import { RequestToDomainMapper } from '../../mappers/request-to-domain.mapper';
import { AddFamilyMemberCommand } from '../impl/add-family-member.command';
import { BaseCommandHandler } from './base.command-handler';

@Injectable()
@CommandHandler(AddFamilyMemberCommand)
export class AddFamilyMemberHandler extends BaseCommandHandler<
  AddFamilyMemberCommand,
  Result<FamilyMemberResponse>
> {
  constructor(
    private readonly familyRepository: IFamilyRepository,
    private readonly familyMemberRepository: IFamilyMemberRepository,
    private readonly familyMemberMapper: FamilyMemberMapper,
    private readonly requestMapper: RequestToDomainMapper,
    commandBus: CommandBus,
    eventBus: EventBus,
  ) {
    super(commandBus, eventBus);
  }

  async execute(command: AddFamilyMemberCommand): Promise<Result<FamilyMemberResponse>> {
    try {
      const validation = this.validateCommand(command);
      if (validation.isFailure) return Result.fail(validation.error!);

      // 1. Load Family
      const family = await this.familyRepository.findById(command.familyId);
      if (!family) {
        return Result.fail(new Error(`Family with ID ${command.familyId} not found`));
      }

      // 2. Validate Uniqueness
      const isUnique = await this.validateMemberUniqueness(command);
      if (!isUnique) {
        return Result.fail(
          new Error('Family member with same National ID, KRA PIN, or User ID already exists'),
        );
      }

      // 3. Create Member Aggregate
      const createProps = this.requestMapper.toCreateFamilyMemberProps(command.data);
      const familyMember = FamilyMember.create(createProps);

      // 4. Persist Member
      await this.familyMemberRepository.create(familyMember);

      // 5. Update Family Aggregate (Counters)
      family.addMember(familyMember);
      await this.familyRepository.update(family);

      // 6. Publish Events (Member Created & Family Updated)
      await this.publishDomainEvents(familyMember);
      await this.publishDomainEvents(family);

      // 7. Response
      const responseDTO = this.familyMemberMapper.toDTO(familyMember);
      const result = Result.ok(responseDTO);

      this.logSuccess(command, result, 'Family member added');
      return result;
    } catch (error) {
      this.handleError(error, command, 'AddFamilyMemberHandler');
    }
  }

  private async validateMemberUniqueness(command: AddFamilyMemberCommand): Promise<boolean> {
    const { nationalId, kraPin, userId } = command.data;
    if (nationalId && (await this.familyMemberRepository.findByNationalId(nationalId)))
      return false;
    if (kraPin && (await this.familyMemberRepository.findByKraPin(kraPin))) return false;
    if (userId && (await this.familyMemberRepository.findByUserId(userId))) return false;
    return true;
  }
}
