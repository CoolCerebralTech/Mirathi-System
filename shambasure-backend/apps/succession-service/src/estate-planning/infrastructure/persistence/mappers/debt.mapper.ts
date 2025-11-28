import { Prisma, Debt as PrismaDebt } from '@prisma/client';

import { Debt, DebtReconstituteProps } from '../../../domain/entities/debt.entity';

export class DebtMapper {
  static toDomain(raw: PrismaDebt): Debt {
    const props: DebtReconstituteProps = {
      id: raw.id,
      ownerId: raw.ownerId,
      assetId: raw.assetId,
      type: raw.type,
      description: raw.description,
      principalAmount: {
        amount: raw.principalAmount.toNumber(),
        currency: raw.currency,
        valuationDate: raw.createdAt,
      },
      outstandingBalance: {
        amount: raw.outstandingBalance.toNumber(),
        currency: raw.currency,
        valuationDate: raw.updatedAt,
      },
      creditorName: raw.creditorName,
      creditorContact: raw.creditorContact,
      accountNumber: raw.accountNumber,
      dueDate: raw.dueDate,
      interestRate: raw.interestRate?.toNumber() || null,
      isPaid: raw.isPaid,
      paidAt: raw.paidAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };

    return Debt.reconstitute(props);
  }

  static toPersistence(entity: Debt): Prisma.DebtUncheckedCreateInput {
    const principal = entity.principalAmount;
    const outstanding = entity.outstandingBalance;

    return {
      id: entity.id,
      ownerId: entity.ownerId,
      assetId: entity.assetId,
      type: entity.type,
      description: entity.description,
      principalAmount: new Prisma.Decimal(principal.getAmount()),
      outstandingBalance: new Prisma.Decimal(outstanding.getAmount()),
      currency: principal.getCurrency(),
      creditorName: entity.creditorName,
      creditorContact: entity.creditorContact,
      accountNumber: entity.accountNumber,
      dueDate: entity.dueDate,
      interestRate: entity.interestRate ? new Prisma.Decimal(entity.interestRate) : null,
      isPaid: entity.isPaid,
      paidAt: entity.paidAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toUpdatePersistence(entity: Debt): Prisma.DebtUncheckedUpdateInput {
    const full = this.toPersistence(entity);

    const updatableFields: Omit<Prisma.DebtUncheckedCreateInput, 'id' | 'ownerId' | 'createdAt'> =
      full;

    return {
      ...updatableFields,
      updatedAt: new Date(),
    };
  }

  static toDomainBatch(records: PrismaDebt[]): Debt[] {
    return records.map((record) => this.toDomain(record));
  }

  static toPersistenceBatch(entities: Debt[]): Prisma.DebtUncheckedCreateInput[] {
    return entities.map((entity) => this.toPersistence(entity));
  }
}
