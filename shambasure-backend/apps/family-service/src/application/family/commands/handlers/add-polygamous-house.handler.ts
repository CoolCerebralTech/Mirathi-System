import { Injectable } from '@nestjs/common';
import { CommandBus, CommandHandler, EventBus } from '@nestjs/cqrs';

import { PolygamousHouse } from '../../../../domain/entities/polygamous-house.entity';
import type { IFamilyRepository } from '../../../../domain/interfaces/repositories/ifamily.repository';
import type { IPolygamousHouseRepository } from '../../../../domain/interfaces/repositories/ipolygamous-house.repository';
import { Result } from '../../../common/base/result';
import { PolygamousHouseResponse } from '../../dto/response/polygamous-house.response';
import { PolygamousHouseMapper } from '../../mappers/polygamous-house.mapper';
import { RequestToDomainMapper } from '../../mappers/request-to-domain.mapper';
import { AddPolygamousHouseCommand } from '../impl/add-polygamous-house.command';
import { BaseCommandHandler } from './base.command-handler';

@Injectable()
@CommandHandler(AddPolygamousHouseCommand)
export class AddPolygamousHouseHandler extends BaseCommandHandler<
  AddPolygamousHouseCommand,
  Result<PolygamousHouseResponse>
> {
  constructor(
    private readonly familyRepository: IFamilyRepository,
    private readonly houseRepository: IPolygamousHouseRepository,
    private readonly houseMapper: PolygamousHouseMapper,
    private readonly requestMapper: RequestToDomainMapper,
    commandBus: CommandBus,
    eventBus: EventBus,
  ) {
    super(commandBus, eventBus);
  }

  async execute(command: AddPolygamousHouseCommand): Promise<Result<PolygamousHouseResponse>> {
    try {
      const validation = this.validateCommand(command);
      if (validation.isFailure) return Result.fail(validation.error!);

      const requestErrors = this.requestMapper.validateAddPolygamousHouseRequest(command.data);
      if (requestErrors.length > 0) {
        return Result.fail(new Error(`Invalid request data: ${requestErrors.join(', ')}`));
      }

      // 1. Load Family
      const family = await this.familyRepository.findById(command.familyId);
      if (!family) return Result.fail(new Error('Family not found'));

      // 2. Create House
      const createProps = this.requestMapper.toCreatePolygamousHouseProps(command.data);
      const house = PolygamousHouse.create(createProps);

      // 3. Update Family (Check S.40 Rules)
      family.addPolygamousHouse(house);

      // 4. Persist
      await this.houseRepository.create(house);
      await this.familyRepository.update(family);

      // 5. Publish Events
      await this.publishDomainEvents(house);
      await this.publishDomainEvents(family);

      // 6. Response
      const responseDTO = this.houseMapper.toDTO(house);
      const result = Result.ok(responseDTO);

      this.logSuccess(command, result, 'Polygamous House added');
      return result;
    } catch (error) {
      this.handleError(error, command, 'AddPolygamousHouseHandler');
    }
  }
}
