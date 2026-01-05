// =============================================================================
// DEBT SERVICES
// =============================================================================
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@shamba/database';

import { Debt, DebtCategory, DebtStatus } from '../../domain/entities/debt.entity';
import { KenyanSuccessionRulesService } from '../../domain/services/net-worth-calculator.service';
import { CalculateNetWorthService } from './estate.service';

@Injectable()
export class AddDebtService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculateNetWorth: CalculateNetWorthService,
    private readonly successionRules: KenyanSuccessionRulesService,
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
    // Verify estate exists
    const estate = await this.prisma.estate.findUnique({
      where: { id: estateId },
    });

    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    // Determine priority using Kenyan law
    const priority = this.successionRules.determineDebtPriority(category, isSecured);

    const debt = Debt.create(
      estateId,
      creditorName,
      description,
      category,
      priority,
      originalAmount,
      outstandingBalance,
    );

    await this.prisma.debt.create({
      data: {
        ...debt.toJSON(),
        originalAmount: originalAmount.toString(),
        outstandingBalance: outstandingBalance.toString(),
      },
    });

    // Recalculate net worth
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
        { priority: 'asc' }, // Critical first
        { createdAt: 'desc' },
      ],
    });

    return debts.map((debt) => ({
      id: debt.id,
      creditorName: debt.creditorName,
      creditorContact: debt.creditorContact,
      description: debt.description,
      category: debt.category,
      priority: debt.priority,
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
    const debt = await this.prisma.debt.findUnique({
      where: { id: debtId },
    });

    if (!debt) {
      throw new NotFoundException('Debt not found');
    }

    const currentBalance = Number(debt.outstandingBalance);

    if (paymentAmount > currentBalance) {
      throw new BadRequestException('Payment amount exceeds outstanding balance');
    }

    const newBalance = currentBalance - paymentAmount;
    const newStatus = newBalance === 0 ? DebtStatus.PAID_IN_FULL : DebtStatus.PARTIALLY_PAID;

    await this.prisma.debt.update({
      where: { id: debtId },
      data: {
        outstandingBalance: newBalance.toString(),
        status: newStatus,
        updatedAt: new Date(),
      },
    });

    // Recalculate net worth
    await this.calculateNetWorth.execute(debt.estateId);
  }
}
