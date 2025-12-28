import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import { GiftInterVivos } from '../../../../../domain/entities/gift-inter-vivos.entity';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import { MoneyVO } from '../../../../../domain/value-objects/money.vo';
import { Result } from '../../../../common/result';
import { RecordGiftInterVivosCommand } from '../../impl/gifts/record-gift-inter-vivos.command';

@CommandHandler(RecordGiftInterVivosCommand)
export class RecordGiftInterVivosHandler implements ICommandHandler<RecordGiftInterVivosCommand> {
  private readonly logger = new Logger(RecordGiftInterVivosHandler.name);

  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: RecordGiftInterVivosCommand): Promise<Result<void>> {
    const { dto, correlationId } = command;

    this.logger.log(
      `Recording Gift Inter Vivos for Recipient ${dto.recipientId} [CorrelationID: ${correlationId}]`,
    );

    try {
      const estateId = new UniqueEntityID(dto.estateId);
      const estate = await this.estateRepository.findById(estateId);

      if (!estate) {
        return Result.fail(new Error(`Estate not found: ${dto.estateId}`));
      }

      const valueAtTimeOfGift = MoneyVO.create({
        amount: dto.valueAtTimeOfGift.amount,
        currency: dto.valueAtTimeOfGift.currency,
      });

      const gift = GiftInterVivos.create({
        estateId: dto.estateId,
        recipientId: dto.recipientId,
        description: dto.description,
        assetType: dto.assetType,
        valueAtTimeOfGift: valueAtTimeOfGift,
        dateGiven: dto.dateGiven,
        isFormalGift: dto.isFormalGift,
        deedOfGiftRef: dto.deedReference,
      });

      // Add to Estate
      estate.addGift(gift, dto.recordedBy);

      await this.estateRepository.save(estate);

      this.logger.log(`Gift Inter Vivos recorded successfully.`);
      return Result.ok();
    } catch (error) {
      this.logger.error(
        `Failed to record gift: ${error instanceof Error ? error.message : String(error)}`,
      );
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
