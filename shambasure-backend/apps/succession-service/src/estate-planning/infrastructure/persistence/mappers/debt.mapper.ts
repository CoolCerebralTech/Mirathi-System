import { Debt as PrismaDebt } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { Debt } from '../../../domain/entities/debt.entity';
import { AssetValue } from '../../../domain/value-objects/asset-value.vo';

export class DebtMapper {
  static toPersistence(domain: Debt): PrismaDebt {
    return {
      id: domain.getId(),
      ownerId: domain.getOwnerId(),
      assetId: domain.getAssetId(),
      type: domain.getType(),
      description: domain.getDescription(),

      // Financials
      principalAmount: new Decimal(domain.getPrincipalAmount().getAmount()),
      outstandingBalance: new Decimal(domain.getOutstandingBalance().getAmount()),
      currency: domain.getPrincipalAmount().getCurrency(),

      // Creditor
      creditorName: domain.getCreditorName(),
      creditorContact: domain.getCreditorContact(),
      accountNumber: domain.getAccountNumber(),

      // Terms
      dueDate: domain.getDueDate(),
      interestRate: domain.getInterestRate() ? new Decimal(domain.getInterestRate()!) : null,

      // Status
      isPaid: domain.getIsPaid(),
      paidAt: domain.getPaidAt(),

      createdAt: new Date(), // Ignored on update
      updatedAt: new Date(),
    } as unknown as PrismaDebt;
  }

  static toDomain(raw: PrismaDebt): Debt {
    const principal = new AssetValue(Number(raw.principalAmount), raw.currency);
    const balance = new AssetValue(Number(raw.outstandingBalance), raw.currency);

    return Debt.reconstitute({
      id: raw.id,
      ownerId: raw.ownerId,
      assetId: raw.assetId,
      type: raw.type,
      description: raw.description,

      principalAmount: principal,
      outstandingBalance: balance,
      currency: raw.currency,

      creditorName: raw.creditorName,
      creditorContact: raw.creditorContact,
      accountNumber: raw.accountNumber,

      dueDate: raw.dueDate,
      interestRate: raw.interestRate ? Number(raw.interestRate) : null,

      isPaid: raw.isPaid,
      paidAt: raw.paidAt,

      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
