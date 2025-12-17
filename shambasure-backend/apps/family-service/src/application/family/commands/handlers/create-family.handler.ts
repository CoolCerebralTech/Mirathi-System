// application/family/commands/handlers/create-family.handler.ts
import { Injectable } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { Family } from '../../../../domain/aggregates/family.aggregate';
import { IFamilyRepository } from '../../../../domain/interfaces/repositories/ifamily.repository';
import { Result } from '../../common/result';
import { FamilyResponse } from '../../dto/response/family.response';
import { FamilyMapper } from '../../mappers/family.mapper';
import { RequestToDomainMapper } from '../../mappers/request-to-domain.mapper';
import { CreateFamilyCommand } from '../impl/create-family.command';
import { BaseCommandHandler } from './base.command-handler';

@Injectable()
@CommandHandler(CreateFamilyCommand)
export class CreateFamilyHandler extends BaseCommandHandler<
  CreateFamilyCommand,
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

  async execute(command: CreateFamilyCommand): Promise<Result<FamilyResponse>> {
    try {
      // Validate command
      const validation = this.validateCommand(command);
      if (validation.isFailure) {
        return Result.fail(validation.error);
      }

      // Validate request data
      const requestErrors = this.requestMapper.validateCreateFamilyRequest(command.data);
      if (requestErrors.length > 0) {
        return Result.fail(`Invalid request data: ${requestErrors.join(', ')}`);
      }

      // Check if family with same name/clan exists (optional)
      // This would require additional repository methods

      // Map request to domain props
      const createProps = this.requestMapper.toCreateFamilyProps(command.data);

      // Create family aggregate
      const family = Family.create(createProps);

      // Publish events (if any)
      const familyWithEvents = this.eventPublisher.mergeObjectContext(family);

      // Save family
      await this.familyRepository.create(familyWithEvents);

      // Commit events
      familyWithEvents.commit();

      // Map to response
      const response = this.familyMapper.toDTO(familyWithEvents);

      this.logSuccess(command, response, 'Family created');
      return Result.ok(response);
    } catch (error) {
      this.handleError(error, command, 'CreateFamilyHandler');
    }
  }
}
