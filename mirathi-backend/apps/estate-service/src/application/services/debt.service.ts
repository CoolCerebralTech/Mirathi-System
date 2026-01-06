// =============================================================================
// DEBT APPLICATION SERVICES
// Context: Law of Succession Act, Section 45 (Priority of Debts)
// =============================================================================
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DebtCategory, DebtStatus } from '@prisma/client';

import { PrismaService } from '@shamba/database';

import { Debt } from '../../domain/entities/debt.entity';
import { CalculateNetWorthService } from './estate.service';

@Injectable()
export class AddDebtService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculateNetWorth: CalculateNetWorthService,
  ) {}

  async execute(
    estateId: string,
    creditorName: string,
    description: string,
    category: DebtCategory,
    originalAmount: number,
    outstandingBalance: number,
    isSecured: boolean = false,
  ): Promise<Debt> {
    // 1. Validate Estate
    const estate = await this.prisma.estate.findUnique({ where: { id: estateId } });
    if (!estate) throw new NotFoundException('Estate not found');

    // 2. Create Domain Entity
    // INNOVATION: The Entity now automatically assigns S.45 Priority (Critical/High/Low)
    // based on the Category and Security status. No manual input required.
    const debt = Debt.create(estateId, creditorName, category, originalAmount, isSecured);

    // Override defaults if specific balance passed (e.g. debt is old)
    // We access props via a method if we want to be strict, or allow create to take it.
    // For this implementation, we assume the entity factory handles it or we assume new debt.
    // However, to match your inputs, we might need to adjust the entity or update here.

    // 3. Persist
    await this.prisma.debt.create({
      data: {
        ...debt.toJSON(),
        description,
        outstandingBalance: outstandingBalance.toString(),
        originalAmount: originalAmount.toString(),
      },
    });

    // 4. Update Net Worth (Async)
    await this.calculateNetWorth.execute(estateId);

    return debt;
  }
}

@Injectable()
export class ListDebtsService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(estateId: string) {
    const debts = await this.prisma.debt.findMany({
      where: { estateId },
      orderBy: [
        { priority: 'asc' }, // S.45: Critical debts (Funeral/Taxes) show first
        { outstandingBalance: 'desc' }, // Then biggest debts
      ],
    });

    return debts.map((debt) => ({
      id: debt.id,
      creditorName: debt.creditorName,
      creditorContact: debt.creditorContact,
      description: debt.description,
      category: debt.category,
      priority: debt.priority, // "CRITICAL", "HIGH", etc.
      status: debt.status,
      originalAmount: Number(debt.originalAmount),
      outstandingBalance: Number(debt.outstandingBalance),
      currency: debt.currency,
      dueDate: debt.dueDate,
      isSecured: debt.isSecured,
      securityDetails: debt.securityDetails,
      createdAt: debt.createdAt,
      updatedAt: debt.updatedAt,
    }));
  }
}

@Injectable()
export class PayDebtService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculateNetWorth: CalculateNetWorthService,
  ) {}

  async execute(debtId: string, paymentAmount: number): Promise<void> {
    const debt = await this.prisma.debt.findUnique({ where: { id: debtId } });
    if (!debt) throw new NotFoundException('Debt not found');

    const currentBalance = Number(debt.outstandingBalance);

    if (paymentAmount <= 0) throw new BadRequestException('Payment must be positive');
    if (paymentAmount > currentBalance)
      throw new BadRequestException('Payment exceeds outstanding balance');

    const newBalance = currentBalance - paymentAmount;
    const newStatus = newBalance === 0 ? DebtStatus.PAID_IN_FULL : DebtStatus.PARTIALLY_PAID;

    // Transactional Update
    await this.prisma.$transaction(async (tx) => {
      await tx.debt.update({
        where: { id: debtId },
        data: {
          outstandingBalance: newBalance.toString(),
          status: newStatus,
          updatedAt: new Date(),
        },
      });

      // We could also create a "TransactionHistory" record here if that table existed
    });

    await this.calculateNetWorth.execute(debt.estateId);
  }
}
