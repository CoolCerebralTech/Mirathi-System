// src/estate-service/src/infrastructure/persistence/mappers/asset-valuation.mapper.ts
import { Injectable } from '@nestjs/common';
import { AssetValuation as PrismaAssetValuation } from '@prisma/client';

import { UniqueEntityID } from '../../../domain/base/unique-entity-id';
import { AssetValuation } from '../../../domain/entities/asset-valuation.entity';
import { ValuationSource } from '../../../domain/enums/valuation-source.enum';
import { MoneyVO } from '../../../domain/value-objects/money.vo';

@Injectable()
export class AssetValuationMapper {
  /**
   * Convert Prisma model to Domain Entity
   */
  toDomain(prismaValuation: PrismaAssetValuation): AssetValuation {
    if (!prismaValuation) throw new Error('Cannot map null Prisma object');

    const {
      id,
      assetId,
      valueAmount,
      valueCurrency,
      previousValueAmount,
      valuationDate,
      source,
      reason,
      isProfessionalValuation,
      isTaxAcceptable,
      isCourtAcceptable,
      credibilityScore,
      valuerName,
      valuerLicenseNumber,
      valuerInstitution,
      methodology,
      notes,
      supportingDocuments,
      conductedBy,
      verifiedBy,
      verifiedAt,
    } = prismaValuation;

    const value = MoneyVO.create({
      amount: Number(valueAmount),
      currency: valueCurrency || 'KES',
    });

    const previousValue = previousValueAmount
      ? MoneyVO.create({
          amount: Number(previousValueAmount),
          currency: valueCurrency || 'KES',
        })
      : undefined;

    const valuationProps = {
      assetId,
      value,
      previousValue,
      valuationDate,
      source: this.mapToDomainValuationSource(source),
      reason: reason || undefined,
      isProfessionalValuation,
      isTaxAcceptable,
      isCourtAcceptable,
      credibilityScore,
      valuerName: valuerName || undefined,
      valuerLicenseNumber: valuerLicenseNumber || undefined,
      valuerInstitution: valuerInstitution || undefined,
      methodology: methodology || undefined,
      notes: notes || undefined,
      supportingDocuments: supportingDocuments || undefined,
      conductedBy,
      verifiedBy: verifiedBy || undefined,
      verifiedAt: verifiedAt || undefined,
    };

    return AssetValuation.create(valuationProps, new UniqueEntityID(id));
  }

  /**
   * Convert Domain Entity to Prisma Persistence Object
   */
  toPersistence(assetValuation: AssetValuation): any {
    return {
      id: assetValuation.id.toString(),
      assetId: assetValuation.assetId,

      valueAmount: assetValuation.value.amount,
      valueCurrency: assetValuation.value.currency,

      previousValueAmount: assetValuation.previousValue?.amount || null,

      valuationDate: assetValuation.valuationDate,
      // Cast explicitly to satisfy Prisma Enum types
      source: this.mapToPrismaValuationSource(assetValuation.source) as any,
      reason: (assetValuation as any).reason || null,

      isProfessionalValuation: assetValuation.isProfessionalValuation,
      isTaxAcceptable: assetValuation.isTaxAcceptable,
      isCourtAcceptable: assetValuation.isCourtAcceptable,
      credibilityScore: assetValuation.credibilityScore,

      valuerName: assetValuation.valuerName || null,
      valuerLicenseNumber: assetValuation.valuerLicenseNumber || null,
      valuerInstitution: assetValuation.valuerInstitution || null,
      methodology: assetValuation.methodology || null,
      notes: assetValuation.notes || null,
      supportingDocuments: assetValuation.supportingDocuments || [],

      conductedBy: assetValuation.conductedBy,
      verifiedBy: assetValuation.verifiedBy || null,
      verifiedAt: assetValuation.verifiedAt || null,
    };
  }

  toDomainList(prismaValuations: PrismaAssetValuation[]): AssetValuation[] {
    return prismaValuations
      .map((valuation) => {
        try {
          return this.toDomain(valuation);
        } catch {
          return null;
        }
      })
      .filter((valuation): valuation is AssetValuation => valuation !== null);
  }

  toPersistenceList(assetValuations: AssetValuation[]): any[] {
    return assetValuations.map((valuation) => this.toPersistence(valuation));
  }

  /**
   * Map Prisma valuation source (DB Enum) to Domain enum
   */
  private mapToDomainValuationSource(prismaSource: string): ValuationSource {
    switch (prismaSource) {
      case 'MARKET_ESTIMATE':
        return ValuationSource.MARKET_COMPARABLE;
      case 'REGISTERED_VALUER':
        return ValuationSource.REGISTERED_VALUER;
      case 'GOVERNMENT_VALUER':
        return ValuationSource.GOVERNMENT_VALUER;
      case 'CHARTERED_SURVEYOR':
        return ValuationSource.CHARTERED_SURVEYOR;
      case 'INSURANCE_VALUATION':
        return ValuationSource.INSURANCE_VALUATION;
      case 'AGREEMENT_BY_HEIRS':
        // Best fit: heirs agreeing usually implies self-declaration or inheritance logic
        return ValuationSource.SELF_DECLARED;
      case 'COURT_DETERMINATION':
        // Domain doesn't have strict Court Enum, map to Other
        return ValuationSource.OTHER;
      default:
        return ValuationSource.OTHER;
    }
  }

  /**
   * Map Domain valuation source to Prisma enum (DB Enum)
   */
  private mapToPrismaValuationSource(domainSource: ValuationSource): string {
    switch (domainSource) {
      // --- Group 1: Registered/Professional -> REGISTERED_VALUER ---
      case ValuationSource.REGISTERED_VALUER:
      case ValuationSource.LICENSED_AUCTIONEER:
      case ValuationSource.BANK_VALUATION: // Banks typically use registered valuers
        return 'REGISTERED_VALUER';

      // --- Group 2: Government -> GOVERNMENT_VALUER ---
      case ValuationSource.GOVERNMENT_VALUER:
      case ValuationSource.NTSA_VALUATION:
      case ValuationSource.KRA_VALUATION:
        return 'GOVERNMENT_VALUER';

      // --- Group 3: Direct Mapping ---
      case ValuationSource.CHARTERED_SURVEYOR:
        return 'CHARTERED_SURVEYOR';
      case ValuationSource.INSURANCE_VALUATION:
        return 'INSURANCE_VALUATION';

      // --- Group 4: Informal/Agreements -> AGREEMENT_BY_HEIRS ---
      case ValuationSource.SELF_DECLARED:
      case ValuationSource.INHERITED_VALUE:
        return 'AGREEMENT_BY_HEIRS';

      // --- Group 5: Market Estimates (Default bucket) -> MARKET_ESTIMATE ---
      case ValuationSource.MARKET_COMPARABLE:
      case ValuationSource.REAL_ESTATE_AGENT:
      case ValuationSource.FINANCIAL_ADVISOR:
      case ValuationSource.PURCHASE_PRICE:
      case ValuationSource.EXPERT_ESTIMATE:
      case ValuationSource.ONLINE_VALUATION:
      case ValuationSource.OTHER:
        return 'MARKET_ESTIMATE';

      default:
        return 'MARKET_ESTIMATE';
    }
  }

  // --- STATISTICS HELPER METHODS ---

  getValuationStatistics(valuations: AssetValuation[]) {
    const professionalCount = valuations.filter((v) => v.isProfessionalValuation).length;
    const taxAcceptableCount = valuations.filter((v) => v.isTaxAcceptable).length;
    const courtAcceptableCount = valuations.filter((v) => v.isCourtAcceptable).length;

    const averageCredibilityScore =
      valuations.length > 0
        ? valuations.reduce((sum, v) => sum + v.credibilityScore, 0) / valuations.length
        : 0;

    const sortedValuations = valuations.sort(
      (a, b) => a.valuationDate.getTime() - b.valuationDate.getTime(),
    );

    const valueChanges = sortedValuations.map((valuation, index) => {
      const previousValuation = index > 0 ? sortedValuations[index - 1] : undefined;
      const changePercentage = previousValuation
        ? valuation.getPercentageChange(previousValuation.value)
        : undefined;

      return {
        date: valuation.valuationDate,
        value: valuation.value,
        changePercentage,
      };
    });

    return {
      totalCount: valuations.length,
      professionalCount,
      taxAcceptableCount,
      courtAcceptableCount,
      averageCredibilityScore,
      valueChanges,
    };
  }

  filterBySource(valuations: AssetValuation[], source: ValuationSource): AssetValuation[] {
    return valuations.filter((valuation) => valuation.source === source);
  }

  filterTaxAcceptable(valuations: AssetValuation[]): AssetValuation[] {
    return valuations.filter((valuation) => valuation.isTaxAcceptable);
  }

  filterCourtAcceptable(valuations: AssetValuation[]): AssetValuation[] {
    return valuations.filter((valuation) => valuation.isCourtAcceptable);
  }

  hasProfessionalValuation(valuations: AssetValuation[]): boolean {
    return valuations.some((valuation) => valuation.isProfessionalValuation);
  }

  calculateValueChange(currentValuation: AssetValuation, previousValuation?: AssetValuation) {
    if (!previousValuation) return undefined;

    const amount = currentValuation.value.subtract(previousValuation.value);
    const percentage = currentValuation.getPercentageChange(previousValuation.value);
    const timeframeDays = Math.floor(
      (currentValuation.valuationDate.getTime() - previousValuation.valuationDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    return {
      amount,
      percentage: percentage || 0,
      timeframeDays,
    };
  }
}
