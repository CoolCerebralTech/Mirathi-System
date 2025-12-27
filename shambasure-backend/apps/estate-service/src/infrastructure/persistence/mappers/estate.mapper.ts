// src/estate-service/src/infrastructure/persistence/mappers/estate.mapper.ts
import { Injectable } from '@nestjs/common';
import { Estate as PrismaEstate } from '@prisma/client';

import { Estate, EstateStatus } from '../../../domain/aggregates/estate.aggregate';
import { UniqueEntityID } from '../../../domain/base/unique-entity-id';
import { MoneyVO } from '../../../domain/value-objects/money.vo';
// Child Mappers
import { AssetMapper } from './asset.mapper';
import { DebtMapper } from './debt.mapper';
import { EstateTaxComplianceMapper } from './estate-tax-compliance.mapper';
import { GiftInterVivosMapper } from './gift-inter-vivos.mapper';
import { LegalDependantMapper } from './legal-dependant.mapper';

@Injectable()
export class EstateMapper {
  constructor(
    private readonly assetMapper: AssetMapper,
    private readonly debtMapper: DebtMapper,
    private readonly giftMapper: GiftInterVivosMapper,
    private readonly dependantMapper: LegalDependantMapper,
    private readonly taxComplianceMapper: EstateTaxComplianceMapper,
  ) {}

  /**
   * Convert Prisma model to Domain Aggregate
   */
  toDomain(
    prismaEstate: PrismaEstate & {
      assets?: any[];
      debts?: any[];
      gifts?: any[]; // Prisma relation: gifts (GiftInterVivos)
      dependants?: any[]; // Prisma relation: dependants (LegalDependant)
      taxCompliance?: any; // Prisma relation: taxCompliance
    },
  ): Estate {
    if (!prismaEstate) throw new Error('Cannot map null Prisma object');

    const {
      id,
      // name, // Removed unused variable
      deceasedId,
      DateOfDeath,
      deceasedName,
      status,
      kraPin,

      cashOnHandAmount,
      cashOnHandCurrency,

      cashReservedDebtsAmount,
      cashReservedDebtsCurrency,

      cashReservedTaxesAmount,
      cashReservedTaxesCurrency,

      isFrozen,
      freezeReason,
      frozenBy,
      frozenAt,

      hasActiveDisputes,
      requiresCourtSupervision,
      isInsolvent,

      createdAt,
      updatedAt,
      createdBy,
      executorId,
      courtCaseNumber,

      // Relations (Defaults to empty array if not loaded via include)
      assets = [],
      debts = [],
      gifts = [],
      dependants = [],
      taxCompliance,
    } = prismaEstate;

    // 1. Money VOs
    const cashOnHand = MoneyVO.create({
      amount: Number(cashOnHandAmount),
      currency: cashOnHandCurrency || 'KES',
    });

    const cashReservedForDebts = MoneyVO.create({
      amount: Number(cashReservedDebtsAmount),
      currency: cashReservedDebtsCurrency || 'KES',
    });

    const cashReservedForTaxes = MoneyVO.create({
      amount: Number(cashReservedTaxesAmount),
      currency: cashReservedTaxesCurrency || 'KES',
    });

    // 2. Child Entities
    // Assuming toDomainList exists on these mappers (it was defined in previous steps)
    const mappedAssets = this.assetMapper.toDomainList(assets);
    const mappedDebts = this.debtMapper.toDomainList(debts);
    const mappedGifts = this.giftMapper.toDomainList(gifts);
    const mappedDependants = this.dependantMapper.toDomainList(dependants);

    // Tax Compliance
    if (!taxCompliance) {
      throw new Error(`Data Integrity Error: Estate ${id} has no Tax Compliance record.`);
    }
    const mappedTaxCompliance = this.taxComplianceMapper.toDomain(taxCompliance);

    // Active Liquidations (Derived from Assets)
    const activeLiquidations = mappedAssets
      .map((a) => a.liquidation)
      .filter((l): l is NonNullable<typeof l> => l !== undefined && l !== null);

    return Estate.reconstitute(
      {
        name: deceasedName,
        deceasedId,
        deceasedName,
        dateOfDeath: DateOfDeath ? new Date(DateOfDeath) : new Date(),
        status: this.mapToDomainStatus(status),
        kraPin,

        assets: mappedAssets,
        debts: mappedDebts,
        gifts: mappedGifts,
        dependants: mappedDependants,
        activeLiquidations,
        taxCompliance: mappedTaxCompliance,

        cashOnHand,
        cashReservedForDebts,
        cashReservedForTaxes,

        isFrozen: isFrozen || false,
        freezeReason: freezeReason || undefined,
        frozenBy: frozenBy || undefined,
        frozenAt: frozenAt ? new Date(frozenAt) : undefined,

        hasActiveDisputes: hasActiveDisputes || false,
        requiresCourtSupervision: requiresCourtSupervision || false,
        isInsolvent: isInsolvent || false,

        createdBy: createdBy || 'SYSTEM',
        executorId: executorId || undefined,
        courtCaseNumber: courtCaseNumber || undefined,

        createdAt,
        updatedAt,
      },
      new UniqueEntityID(id),
    );
  }

  /**
   * Convert Domain Aggregate to Prisma Persistence Object (Root only)
   */
  toPersistence(estate: Estate): any {
    return {
      id: estate.id.toString(),
      deceasedId: estate.deceasedId,
      deceasedName: estate.deceasedName,
      DateOfDeath: estate.dateOfDeath,

      status: this.mapToPrismaStatus(estate.status) as any,
      kraPin: estate.kraPin,

      cashOnHandAmount: estate.cashOnHand.amount,
      cashOnHandCurrency: estate.cashOnHand.currency,

      cashReservedDebtsAmount: estate.cashReservedForDebts.amount,
      cashReservedDebtsCurrency: estate.cashReservedForDebts.currency,

      cashReservedTaxesAmount: estate.cashReservedForTaxes.amount,
      cashReservedTaxesCurrency: estate.cashReservedForTaxes.currency,

      isFrozen: estate.isFrozen,
      freezeReason: estate.freezeReason || null,
      frozenBy: estate.frozenBy || null,
      frozenAt: estate.frozenAt || null,

      hasActiveDisputes: estate.hasActiveDisputes,
      requiresCourtSupervision: estate.requiresCourtSupervision,
      isInsolvent: estate.isInsolvent,

      createdBy: estate.createdBy,
      executorId: estate.executorId || null,
      courtCaseNumber: estate.courtCaseNumber || null,

      createdAt: estate.createdAt,
      updatedAt: estate.updatedAt,
    };
  }

  private mapToDomainStatus(prismaStatus: string): EstateStatus {
    return prismaStatus as EstateStatus;
  }

  private mapToPrismaStatus(domainStatus: EstateStatus): string {
    return domainStatus.toString();
  }
}
