import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import { MoneyVO } from '../../../../../domain/value-objects/money.vo';
import { Result } from '../../../../common/result';
import { UpdateAssetValueCommand } from '../../impl/assets/update-asset-value.command';

@CommandHandler(UpdateAssetValueCommand)
export class UpdateAssetValueHandler implements ICommandHandler<UpdateAssetValueCommand> {
  private readonly logger = new Logger(UpdateAssetValueHandler.name);

  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: UpdateAssetValueCommand): Promise<Result<void>> {
    const { dto, correlationId } = command;

    this.logger.log(
      `Updating value for asset ${dto.assetId} in Estate ${dto.estateId} [CorrelationID: ${correlationId}]`,
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

      const newValue = MoneyVO.create({
        amount: dto.newValue.amount,
        currency: dto.newValue.currency,
      });

      asset.updateValue(newValue, dto.source, dto.reason, dto.updatedBy);

      await this.estateRepository.save(estate);

      this.logger.log(`Asset value updated successfully.`);
      return Result.ok();
    } catch (error) {
      this.logger.error(
        `Failed to update asset value: ${error instanceof Error ? error.message : String(error)}`,
      );
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
