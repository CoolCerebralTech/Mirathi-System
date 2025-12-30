import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UniqueEntityID } from '../../../../../domain/base/unique-entity-id';
import { ESTATE_REPOSITORY } from '../../../../../domain/interfaces/estate.repository.interface';
import type { IEstateRepository } from '../../../../../domain/interfaces/estate.repository.interface';
import { MoneyVO } from '../../../../../domain/value-objects/money.vo';
import { Result } from '../../../../common/result';
import { RecordTaxPaymentCommand } from '../../impl/tax/record-tax-payment.command';

@CommandHandler(RecordTaxPaymentCommand)
export class RecordTaxPaymentHandler implements ICommandHandler<RecordTaxPaymentCommand> {
  private readonly logger = new Logger(RecordTaxPaymentHandler.name);

  constructor(@Inject(ESTATE_REPOSITORY) private readonly estateRepository: IEstateRepository) {}

  async execute(command: RecordTaxPaymentCommand): Promise<Result<void>> {
    const { dto, correlationId } = command;

    this.logger.log(
      `Recording Tax Payment of ${dto.amount.amount} for Estate ${dto.estateId} [CorrelationID: ${correlationId}]`,
    );

    try {
      const estateId = new UniqueEntityID(dto.estateId);
      const estate = await this.estateRepository.findById(estateId);

      if (!estate) {
        return Result.fail(new Error(`Estate not found: ${dto.estateId}`));
      }

      const amount = MoneyVO.create({
        amount: dto.amount.amount,
        currency: dto.amount.currency,
      });

      // Domain Logic
      estate.recordTaxPayment(amount, dto.paymentType, dto.paymentReference, dto.paidBy);

      await this.estateRepository.save(estate);

      this.logger.log(`Tax Payment recorded successfully.`);
      return Result.ok();
    } catch (error) {
      this.logger.error(
        `Failed to record tax payment: ${error instanceof Error ? error.message : String(error)}`,
      );
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
