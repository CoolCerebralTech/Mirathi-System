import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { Estate } from '../../../../../domain/aggregates/estate.aggregate';
import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import { MoneyVO } from '../../../../../domain/value-objects/money.vo';
import { Result } from '../../../../common/result';
import {
  CloseEstateCommand,
  CreateEstateCommand,
  FreezeEstateCommand,
  UnfreezeEstateCommand,
} from '../../impl/lifecycle/lifecycle.commands';

@CommandHandler(CreateEstateCommand)
export class CreateEstateHandler implements ICommandHandler<CreateEstateCommand> {
  private readonly logger = new Logger(CreateEstateHandler.name);
  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: CreateEstateCommand): Promise<Result<string>> {
    const { dto, correlationId } = command;
    this.logger.log(
      `Creating Estate for deceased ${dto.deceasedName} [CorrelationID: ${correlationId}]`,
    );

    try {
      // 1. One Estate per Deceased Rule
      const exists = await this.estateRepository.existsForDeceased(dto.deceasedId);
      if (exists) {
        return Result.fail(new Error(`Estate already exists for deceased: ${dto.deceasedId}`));
      }

      // 2. Prepare Initial Cash if provided
      let initialCash = MoneyVO.zero('KES');
      if (dto.initialCash) {
        initialCash = MoneyVO.create({
          amount: dto.initialCash.amount,
          currency: dto.initialCash.currency,
        });
      }

      // 3. Create Aggregate
      const estate = Estate.create({
        name: dto.name,
        deceasedId: dto.deceasedId,
        deceasedName: dto.deceasedName,
        dateOfDeath: dto.dateOfDeath,
        kraPin: dto.kraPin,
        createdBy: dto.createdBy,
        executorId: dto.executorId,
        initialCash: initialCash,
      });

      // 4. Save
      await this.estateRepository.save(estate);
      this.logger.log(`Estate created successfully. ID: ${estate.id.toString()}`);

      return Result.ok(estate.id.toString());
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}

@CommandHandler(FreezeEstateCommand)
export class FreezeEstateHandler implements ICommandHandler<FreezeEstateCommand> {
  private readonly logger = new Logger(FreezeEstateHandler.name);
  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: FreezeEstateCommand): Promise<Result<void>> {
    const { dto, correlationId } = command;
    this.logger.log(`Freezing Estate ${dto.estateId} [CorrelationID: ${correlationId}]`);

    try {
      const estate = await this.estateRepository.findById(new UniqueEntityID(dto.estateId));
      if (!estate) return Result.fail(new Error(`Estate not found`));

      estate.freeze(dto.reason, dto.frozenBy);
      // Can store courtOrderReference in metadata if needed via a dedicated method or updateState

      await this.estateRepository.save(estate);
      return Result.ok();
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}

@CommandHandler(UnfreezeEstateCommand)
export class UnfreezeEstateHandler implements ICommandHandler<UnfreezeEstateCommand> {
  private readonly logger = new Logger(UnfreezeEstateHandler.name);
  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: UnfreezeEstateCommand): Promise<Result<void>> {
    const { dto } = command;
    try {
      const estate = await this.estateRepository.findById(new UniqueEntityID(dto.estateId));
      if (!estate) return Result.fail(new Error(`Estate not found`));

      estate.unfreeze(dto.reason, dto.unfrozenBy);
      await this.estateRepository.save(estate);
      return Result.ok();
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}

@CommandHandler(CloseEstateCommand)
export class CloseEstateHandler implements ICommandHandler<CloseEstateCommand> {
  private readonly logger = new Logger(CloseEstateHandler.name);
  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: CloseEstateCommand): Promise<Result<void>> {
    const { dto } = command;
    this.logger.log(`Closing Estate ${dto.estateId}`);

    try {
      const estate = await this.estateRepository.findById(new UniqueEntityID(dto.estateId));
      if (!estate) return Result.fail(new Error(`Estate not found`));

      estate.closeEstate(dto.closedBy, dto.closureNotes);
      await this.estateRepository.save(estate);
      return Result.ok();
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
