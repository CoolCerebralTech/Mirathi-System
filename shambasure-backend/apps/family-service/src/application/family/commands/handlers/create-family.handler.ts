import { Injectable } from '@nestjs/common';
import { CommandBus, CommandHandler, EventBus } from '@nestjs/cqrs';

import { Family } from '../../../../domain/aggregates/family.aggregate';
import type { IFamilyRepository } from '../../../../domain/interfaces/repositories/ifamily.repository';
import { Result } from '../../../common/base/result';
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
    commandBus: CommandBus, // ✅ strongly typed
    eventBus: EventBus, // ✅ inject EventBus too
  ) {
    super(commandBus, eventBus); // ✅ pass both to base class
  }

  async execute(command: CreateFamilyCommand): Promise<Result<FamilyResponse>> {
    try {
      const validation = this.validateCommand(command);
      if (validation.isFailure) {
        return Result.fail(validation.error!);
      }

      const requestErrors = this.requestMapper.validateCreateFamilyRequest(command.data);
      if (requestErrors.length > 0) {
        return Result.fail(new Error(`Invalid request data: ${requestErrors.join(', ')}`));
      }

      // Map request → domain props
      const createProps = this.requestMapper.toCreateFamilyProps(command.data);

      // Create aggregate (domain-only)
      const family = Family.create(createProps);

      // Persist aggregate
      await this.familyRepository.create(family);

      // Publish domain events (application responsibility)
      await this.publishDomainEvents(family);

      // Map to response DTO
      const responseDTO = this.familyMapper.toDTO(family);
      const result = Result.ok(responseDTO);

      this.logSuccess(command, result, 'Family created');
      return result;
    } catch (error) {
      this.handleError(error, command, 'CreateFamilyHandler');
    }
  }
}
