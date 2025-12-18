import { Injectable } from '@nestjs/common';
import { CommandBus, CommandHandler, EventBus } from '@nestjs/cqrs';

import type { IFamilyRepository } from '../../../../domain/interfaces/repositories/ifamily.repository';
import { Result } from '../../../common/base/result';
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
    commandBus: CommandBus,
    eventBus: EventBus,
  ) {
    super(commandBus, eventBus);
  }

  async execute(command: UpdateFamilyCommand): Promise<Result<FamilyResponse>> {
    try {
      const validation = this.validateCommand(command);
      if (validation.isFailure) return Result.fail(validation.error!);

      // 1. Load Family
      const family = await this.familyRepository.findById(command.familyId);
      if (!family) {
        return Result.fail(new Error(`Family with ID ${command.familyId} not found`));
      }

      // 2. Map Update Props
      const updateParams = this.requestMapper.toUpdateFamilyProps(command.data);

      // 3. Update Domain
      family.updateBasicInfo(updateParams);

      // 4. Persist
      await this.familyRepository.update(family);

      // 5. Publish Events
      await this.publishDomainEvents(family);

      // 6. Response
      const responseDTO = this.familyMapper.toDTO(family);
      const result = Result.ok(responseDTO);

      this.logSuccess(command, result, 'Family updated');
      return result;
    } catch (error) {
      this.handleError(error, command, 'UpdateFamilyHandler');
    }
  }
}
