import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { IsNumber, IsString, IsNotEmpty, Min } from 'class-validator';
import type { DebtRepositoryInterface } from '../../domain/interfaces/debt.repository.interface';
import { AssetValue } from '../../domain/value-objects/asset-value.vo';

// --- DTO DEFINITION ---
export class RecordDebtPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;
}

// --- COMMAND ---
export class RecordDebtPaymentCommand {
  constructor(
    public readonly debtId: string,
    public readonly userId: string, // The executor or owner making the payment
    public readonly dto: RecordDebtPaymentDto,
  ) {}
}

// --- HANDLER ---
@CommandHandler(RecordDebtPaymentCommand)
export class RecordDebtPaymentHandler implements ICommandHandler<RecordDebtPaymentCommand> {
  constructor(
    @Inject('DebtRepositoryInterface')
    private readonly debtRepository: DebtRepositoryInterface,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: RecordDebtPaymentCommand): Promise<void> {
    const { debtId, userId, dto } = command;

    // 1. Load Aggregate
    const debt = await this.debtRepository.findById(debtId);
    if (!debt) {
      throw new NotFoundException(`Debt ${debtId} not found.`);
    }

    // 2. Security Check
    if (debt.getOwnerId() !== userId) {
      throw new ForbiddenException('Ownership mismatch. You cannot pay this debt.');
    }

    // 3. Process Payment
    const paymentValue = new AssetValue(dto.amount, dto.currency);

    const debtModel = this.publisher.mergeObjectContext(debt);

    try {
      // Domain Logic: Checks currency match and logic bounds
      debtModel.makePayment(paymentValue);
    } catch (e) {
      throw new BadRequestException(e.message);
    }

    // 4. Save State
    await this.debtRepository.save(debtModel);
    debtModel.commit();
  }
}
