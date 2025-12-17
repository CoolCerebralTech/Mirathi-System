// application/family/commands/handlers/update-family.handler.ts
import { Injectable } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { Family } from '../../../../domain/aggregates/family.aggregate';
import { IFamilyRepository } from '../../../../domain/interfaces/repositories/ifamily.repository';
import { Result } from '../../common/result';
import { FamilyResponse } from '../../dto/response/family.response';
import { FamilyMapper } from '../../mappers/family.mapper';
import { RequestToDomainMapper } from '../../mappers/request-to-domain.mapper';
import { UpdateFamilyCommand } from '../impl/update-family.command';
import { BaseCommandHandler } from './base.command-handler';

@Injectable()
@CommandHandler(UpdateFamilyCommand)
export class UpdateFamilyHandler extends BaseCommandHandler<
  UpdateFamilyCommand,
  Result<FamilyResponse>
> {
  constructor(
    private readonly familyRepository: IFamilyRepository,
    private readonly familyMapper: FamilyMapper,
    private readonly requestMapper: RequestToDomainMapper,
    commandBus: any,
    eventPublisher: EventPublisher,
  ) {
    super(commandBus, eventPublisher);
  }

  async execute(command: UpdateFamilyCommand): Promise<Result<FamilyResponse>> {
    try {
      // Validate command
      const validation = this.validateCommand(command);
      if (validation.isFailure) {
        return Result.fail(validation.error);
      }

      // Load family
      const family = await this.familyRepository.findById(command.familyId);
      if (!family) {
        return Result.fail(`Family with ID ${command.familyId} not found`);
      }

      // Publish events
      const familyWithEvents = this.eventPublisher.mergeObjectContext(family);

      // Update family info
      const updateProps = this.requestMapper.toUpdateFamilyProps(command.data);
      if (Object.keys(updateProps).length > 0) {
        familyWithEvents.updateBasicInfo(updateProps);
      }

      // Save family
      await this.familyRepository.update(familyWithEvents);

      // Commit events
      familyWithEvents.commit();

      // Map to response
      const response = this.familyMapper.toDTO(familyWithEvents);

      this.logSuccess(command, response, 'Family updated');
      return Result.ok(response);
    } catch (error) {
      this.handleError(error, command, 'UpdateFamilyHandler');
    }
  }
}
