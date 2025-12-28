import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import { MoneyVO } from '../../../../../domain/value-objects/money.vo';
import { Result } from '../../../../common/result';
import { EncumberAssetCommand } from '../../impl/assets/encumber-asset.command';

@CommandHandler(EncumberAssetCommand)
export class EncumberAssetHandler implements ICommandHandler<EncumberAssetCommand> {
  private readonly logger = new Logger(EncumberAssetHandler.name);

  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: EncumberAssetCommand): Promise<Result<void>> {
    const { dto, correlationId } = command;

    this.logger.log(
      `Encumbering asset ${dto.assetId} in Estate ${dto.estateId} [CorrelationID: ${correlationId}]`,
    );

    try {
      const estateId = new UniqueEntityID(dto.estateId);
      const estate = await this.estateRepository.findById(estateId);

      if (!estate) {
        return Result.fail(new Error(`Estate not found: ${dto.estateId}`));
      }

      const asset = estate.assets.find((a) => a.id.toString() === dto.assetId);
      if (!asset) {
        return Result.fail(new Error(`Asset ${dto.assetId} not found in estate`));
      }

      let encumbranceAmount: MoneyVO | undefined;
      if (dto.encumbranceAmount) {
        encumbranceAmount = MoneyVO.create({
          amount: dto.encumbranceAmount.amount,
          currency: dto.encumbranceAmount.currency,
        });
      }

      asset.markAsEncumbered(dto.details, dto.encumbranceType, encumbranceAmount, dto.markedBy);

      await this.estateRepository.save(estate);

      this.logger.log(`Asset encumbrance recorded successfully.`);
      return Result.ok();
    } catch (error) {
      this.logger.error(
        `Failed to encumber asset: ${error instanceof Error ? error.message : String(error)}`,
      );
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
