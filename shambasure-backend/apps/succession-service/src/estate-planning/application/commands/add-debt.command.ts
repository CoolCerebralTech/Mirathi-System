import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject, BadRequestException } from '@nestjs/common';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { v4 as uuidv4 } from 'uuid';
import { DebtType } from '@prisma/client';
import { Debt } from '../../domain/entities/debt.entity';
import type { DebtRepositoryInterface } from '../../domain/interfaces/debt.repository.interface';
import { AssetValue } from '../../domain/value-objects/asset-value.vo';

// --- DTO DEFINITION (Ensure this exists in your DTO folder) ---
export class AddDebtDto {
  @IsEnum(DebtType)
  type: DebtType;

  @IsString()
  @IsNotEmpty()
  creditorName: string;

  @IsNumber()
  @Min(0)
  principalAmount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  assetId?: string; // If secured against a specific asset

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

// --- COMMAND ---
export class AddDebtCommand {
  constructor(
    public readonly userId: string,
    public readonly dto: AddDebtDto,
  ) {}
}

// --- HANDLER ---
@CommandHandler(AddDebtCommand)
export class AddDebtHandler implements ICommandHandler<AddDebtCommand> {
  constructor(
    @Inject('DebtRepositoryInterface')
    private readonly debtRepository: DebtRepositoryInterface,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: AddDebtCommand): Promise<string> {
    const { userId, dto } = command;

    // 1. Validate Value Object construction
    let principal: AssetValue;
    try {
      principal = new AssetValue(dto.principalAmount, dto.currency);
    } catch (e) {
      throw new BadRequestException(`Invalid monetary value: ${e.message}`);
    }

    // 2. Factory Creation
    const debtId = uuidv4();
    const debt = Debt.create(debtId, userId, dto.type, principal, dto.creditorName, dto.assetId);

    // 3. Apply Optional Details
    if (dto.description || dto.dueDate) {
      debt.updateDetails(
        dto.description || '',
        undefined, // creditorContact
        undefined, // accountNumber
        dto.dueDate ? new Date(dto.dueDate) : undefined,
      );
    }

    // 4. Merge & Save
    const debtModel = this.publisher.mergeObjectContext(debt);
    await this.debtRepository.save(debtModel);
    debtModel.commit();

    return debtId;
  }
}
