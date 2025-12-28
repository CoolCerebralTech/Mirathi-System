import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import { Result } from '../../../../common/result';
import {
  ContestGiftCommand,
  ResolveGiftDisputeCommand,
} from '../../impl/gifts/manage-gift-dispute.command';

@CommandHandler(ContestGiftCommand)
export class ContestGiftHandler implements ICommandHandler<ContestGiftCommand> {
  private readonly logger = new Logger(ContestGiftHandler.name);

  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: ContestGiftCommand): Promise<Result<void>> {
    const { dto } = command;
    try {
      const estate = await this.estateRepository.findById(new UniqueEntityID(dto.estateId));
      if (!estate) return Result.fail(new Error(`Estate not found`));

      const gift = estate.gifts.find((g) => g.id.toString() === dto.giftId);
      if (!gift) return Result.fail(new Error(`Gift not found`));

      gift.contest(dto.reason, dto.contestedBy);
      await this.estateRepository.save(estate);
      return Result.ok();
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

@CommandHandler(ResolveGiftDisputeCommand)
export class ResolveGiftDisputeHandler implements ICommandHandler<ResolveGiftDisputeCommand> {
  private readonly logger = new Logger(ResolveGiftDisputeHandler.name);

  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: ResolveGiftDisputeCommand): Promise<Result<void>> {
    const { dto } = command;
    try {
      const estate = await this.estateRepository.findById(new UniqueEntityID(dto.estateId));
      if (!estate) return Result.fail(new Error(`Estate not found`));

      const gift = estate.gifts.find((g) => g.id.toString() === dto.giftId);
      if (!gift) return Result.fail(new Error(`Gift not found`));

      // Reclassification logic handled by domain entity method
      if (dto.outcome === 'RECLASSIFIED_AS_LOAN') {
        gift.reclassifyAsLoan(dto.resolutionDetails, dto.resolvedBy);
      } else if (dto.outcome === 'EXCLUDED') {
        gift.excludeFromHotchpot(dto.resolutionDetails, dto.resolvedBy, dto.courtOrderReference);
      } else {
        // General resolution
        gift.resolveContestation(
          dto.outcome,
          dto.resolutionDetails,
          dto.resolvedBy,
          dto.courtOrderReference,
        );
      }

      await this.estateRepository.save(estate);
      return Result.ok();
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
