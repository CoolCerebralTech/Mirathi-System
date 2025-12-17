// application/family/commands/handlers/update-family-member.handler.ts
import { Injectable } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { FamilyMember } from '../../../../domain/entities/family-member.entity';
import { IFamilyMemberRepository } from '../../../../domain/interfaces/repositories/ifamily-member.repository';
import { Result } from '../../common/result';
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
    private readonly familyMemberRepository: IFamilyMemberRepository,
    private readonly familyMemberMapper: FamilyMemberMapper,
    private readonly requestMapper: RequestToDomainMapper,
    commandBus: any,
    eventPublisher: EventPublisher,
  ) {
    super(commandBus, eventPublisher);
  }

  async execute(command: UpdateFamilyMemberCommand): Promise<Result<FamilyMemberResponse>> {
    try {
      // Validate command
      const validation = this.validateCommand(command);
      if (validation.isFailure) {
        return Result.fail(validation.error);
      }

      // Load family member
      const existingMember = await this.familyMemberRepository.findById(command.memberId);
      if (!existingMember) {
        return Result.fail(`Family member with ID ${command.memberId} not found`);
      }

      // Verify member belongs to the specified family
      if (existingMember.familyId !== command.familyId) {
        return Result.fail(`Family member does not belong to family ${command.familyId}`);
      }

      // Publish events
      const memberWithEvents = this.eventPublisher.mergeObjectContext(existingMember);

      // Update personal info if provided
      const updateProps = this.requestMapper.toUpdateFamilyMemberProps(command.data);
      if (Object.keys(updateProps).length > 0) {
        memberWithEvents.updatePersonalInfo(updateProps);
      }

      // Update contact info if provided
      if (command.data.phoneNumber || command.data.email) {
        memberWithEvents.updateContactInfo({
          phoneNumber: command.data.phoneNumber,
          email: command.data.email,
          alternativePhone: command.data.alternativePhone,
        });
      }

      // Update disability status if provided
      const disabilityParams = this.requestMapper.toUpdateDisabilityParams(command.data);
      if (disabilityParams) {
        memberWithEvents.updateDisabilityStatus(disabilityParams);
      }

      // Mark as deceased if requested
      const deceasedParams = this.requestMapper.toMarkAsDeceasedParams(command.data);
      if (deceasedParams) {
        memberWithEvents.markAsDeceased(deceasedParams);
      }

      // Save updated member
      await this.familyMemberRepository.update(memberWithEvents);

      // Commit events
      memberWithEvents.commit();

      // Map to response
      const response = this.familyMemberMapper.toDTO(memberWithEvents);

      this.logSuccess(command, response, 'Family member updated');
      return Result.ok(response);
    } catch (error) {
      this.handleError(error, command, 'UpdateFamilyMemberHandler');
    }
  }
}
