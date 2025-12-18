import { Injectable } from '@nestjs/common';
import { CommandBus, CommandHandler, EventBus } from '@nestjs/cqrs';

import type { IFamilyMemberRepository } from '../../../../domain/interfaces/repositories/ifamily-member.repository';
import { Result } from '../../../common/base/result';
import { FamilyMemberResponse } from '../../dto/response/family-member.response';
import { FamilyMemberMapper } from '../../mappers/family-member.mapper';
import { RequestToDomainMapper } from '../../mappers/request-to-domain.mapper';
import { UpdateFamilyMemberCommand } from '../impl/update-family-member.command';
import { BaseCommandHandler } from './base.command-handler';

@Injectable()
@CommandHandler(UpdateFamilyMemberCommand)
export class UpdateFamilyMemberHandler extends BaseCommandHandler<
  UpdateFamilyMemberCommand,
  Result<FamilyMemberResponse>
> {
  constructor(
    private readonly memberRepository: IFamilyMemberRepository,
    private readonly memberMapper: FamilyMemberMapper,
    private readonly requestMapper: RequestToDomainMapper,
    commandBus: CommandBus,
    eventBus: EventBus,
  ) {
    super(commandBus, eventBus);
  }

  async execute(command: UpdateFamilyMemberCommand): Promise<Result<FamilyMemberResponse>> {
    try {
      // 1. Validate Command Structure
      const validation = this.validateCommand(command);
      if (validation.isFailure) {
        return Result.fail(validation.error!);
      }

      const { memberId, familyId, data } = command;

      // 2. Load Aggregate
      const member = await this.memberRepository.findById(memberId);
      if (!member) {
        return Result.fail(new Error(`Family member with ID ${memberId} not found`));
      }

      // 3. Security/Consistency Check
      if (member.familyId !== familyId) {
        return Result.fail(new Error('Member does not belong to the specified family'));
      }

      // 4. Update Personal Information (Name, Ethnicity, Religion, etc.)
      // The mapper ensures we only pass fields present in the DTO
      const personalInfoParams = this.requestMapper.toUpdateFamilyMemberProps(data);
      member.updatePersonalInfo(personalInfoParams);

      // 5. Update Contact Information
      // Only call if contact fields are present to avoid overwriting with undefined
      if (data.phoneNumber || data.email || data.alternativePhone) {
        member.updateContactInfo({
          phoneNumber: data.phoneNumber,
          email: data.email,
          alternativePhone: data.alternativePhone,
        });
      }

      // 6. Update Disability Status
      // The mapper helps extract the specific disability params cleanly
      const disabilityParams = this.requestMapper.toUpdateDisabilityParams(data);
      if (disabilityParams) {
        member.updateDisabilityStatus({
          disabilityType: disabilityParams.disabilityType,
          requiresSupportedDecisionMaking: disabilityParams.requiresSupportedDecisionMaking,
          certificateId: disabilityParams.certificateId,
        });
      }

      // 7. Persist Changes
      await this.memberRepository.update(member);

      // 8. Publish Domain Events (e.g. FamilyMemberPersonalInfoUpdatedEvent)
      await this.publishDomainEvents(member);

      // 9. Return Response
      const responseDTO = this.memberMapper.toDTO(member);
      const result = Result.ok(responseDTO);

      this.logSuccess(command, result, 'Family member updated');
      return result;
    } catch (error) {
      this.handleError(error, command, 'UpdateFamilyMemberHandler');
    }
  }
}
