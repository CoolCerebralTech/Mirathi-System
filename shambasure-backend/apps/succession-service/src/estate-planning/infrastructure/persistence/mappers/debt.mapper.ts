import { DebtType } from '@prisma/client';
import { Debt } from '../../../domain/entities/debt.entity';

export class DebtMapper {
  static toDomain(prismaDebt: any): Debt {
    if (!prismaDebt) return null;

    const debt = new Debt(
      prismaDebt.id,
      prismaDebt.ownerId,
      prismaDebt.type as DebtType,
      prismaDebt.description,
      prismaDebt.principalAmount.toNumber(),
      prismaDebt.creditorName,
      prismaDebt.currency,
    );

    // Set additional properties
    Object.assign(debt, {
      assetId: prismaDebt.assetId,
      outstandingBalance: prismaDebt.outstandingBalance.toNumber(),
      creditorContact: prismaDebt.creditorContact,
      accountNumber: prismaDebt.accountNumber,
      dueDate: prismaDebt.dueDate,
      interestRate: prismaDebt.interestRate?.toNumber(),
      isPaid: prismaDebt.isPaid,
      paidAt: prismaDebt.paidAt,
      createdAt: prismaDebt.createdAt,
      updatedAt: prismaDebt.updatedAt,
    });

    return debt;
  }

  static toPersistence(debt: Debt): any {
    return {
      id: debt.getId(),
      assetId: debt.getAssetId(),
      ownerId: debt.getOwnerId(),
      type: debt.getType(),
      description: debt.getDescription(),
      principalAmount: debt.getPrincipalAmount(),
      outstandingBalance: debt.getOutstandingBalance(),
      currency: debt.getCurrency(),
      creditorName: debt.getCreditorName(),
      creditorContact: debt.getCreditorContact(),
      accountNumber: debt.getAccountNumber(),
      dueDate: debt.getDueDate(),
      interestRate: debt.getInterestRate(),
      isPaid: debt.getIsPaid(),
      paidAt: debt.getPaidAt(),
      createdAt: debt.getCreatedAt(),
      updatedAt: debt.getUpdatedAt(),
    };
  }

  static toDomainList(prismaDebts: any[]): Debt[] {
    return prismaDebts.map((debt) => this.toDomain(debt)).filter(Boolean);
  }
}
