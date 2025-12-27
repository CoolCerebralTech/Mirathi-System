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
      // previousValueCurrency, // Does not exist in schema
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

    // Create MoneyVO objects
    const value = MoneyVO.create({
      amount: Number(valueAmount),
      currency: valueCurrency || 'KES',
    });

    // Use current value currency as fallback for previous value
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
      // Cast the string from DB to the Domain Enum type
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
    // Use public getters

    return {
      id: assetValuation.id.toString(),
      assetId: assetValuation.assetId,

      valueAmount: assetValuation.value.amount,
      valueCurrency: assetValuation.value.currency,

      previousValueAmount: assetValuation.previousValue?.amount || null,
      // Schema doesn't support previousValueCurrency

      valuationDate: assetValuation.valuationDate,
      // Cast the Domain Enum string to 'any' to satisfy Prisma's strict Enum type check
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

  /**
   * Convert array of Prisma models to Domain Entities
   */
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

  /**
   * Convert array of Domain Entities to Persistence Objects
   */
  toPersistenceList(assetValuations: AssetValuation[]): any[] {
    return assetValuations.map((valuation) => this.toPersistence(valuation));
  }

  /**
   * Map Prisma valuation source (String/Enum) to Domain enum
   */
  private mapToDomainValuationSource(prismaSource: string): ValuationSource {
    // We match against the limited Prisma Enum values
    switch (prismaSource) {
      case 'MARKET_ESTIMATE':
        return ValuationSource.MARKET_ESTIMATE;
      case 'REGISTERED_VALUER':
        return ValuationSource.REGISTERED_VALUER;
      case 'GOVERNMENT_VALUER':
        return ValuationSource.GOVERNMENT_VALUER;
      case 'CHARTERED_SURVEYOR':
        return ValuationSource.CHARTERED_SURVEYOR;
      case 'INSURANCE_VALUATION':
        return ValuationSource.INSURANCE_VALUATION;
      case 'AGREEMENT_BY_HEIRS':
        return ValuationSource.AGREEMENT_BY_HEIRS;
      case 'COURT_DETERMINATION':
        return ValuationSource.COURT_DETERMINATION;
      // If DB has unknown value, fallback safely
      default:
        return ValuationSource.MARKET_ESTIMATE;
    }
  }

  /**
   * Map Domain valuation source to Prisma enum (String/Enum)
   */
  private mapToPrismaValuationSource(domainSource: ValuationSource): string {
    switch (domainSource) {
      // 1-to-1 Matches
      case ValuationSource.MARKET_ESTIMATE:
        return 'MARKET_ESTIMATE';
      case ValuationSource.REGISTERED_VALUER:
        return 'REGISTERED_VALUER';
      case ValuationSource.GOVERNMENT_VALUER:
        return 'GOVERNMENT_VALUER';
      case ValuationSource.CHARTERED_SURVEYOR:
        return 'CHARTERED_SURVEYOR';
      case ValuationSource.INSURANCE_VALUATION:
        return 'INSURANCE_VALUATION';
      case ValuationSource.AGREEMENT_BY_HEIRS:
        return 'AGREEMENT_BY_HEIRS';
      case ValuationSource.COURT_DETERMINATION:
        return 'COURT_DETERMINATION';

      // Mappings for Extended Domain Types -> Nearest DB Enum
      case ValuationSource.LICENSED_AUCTIONEER:
        return 'REGISTERED_VALUER';
      case ValuationSource.NTSA_VALUATION:
        return 'GOVERNMENT_VALUER';
      case ValuationSource.KRA_VALUATION:
        return 'GOVERNMENT_VALUER';
      case ValuationSource.REAL_ESTATE_AGENT:
        return 'MARKET_ESTIMATE';
      case ValuationSource.MARKET_COMPARABLE:
        return 'MARKET_ESTIMATE';
      case ValuationSource.BANK_VALUATION:
        return 'REGISTERED_VALUER';
      case ValuationSource.FINANCIAL_ADVISOR:
        return 'MARKET_ESTIMATE';
      case ValuationSource.SELF_DECLARED:
        return 'AGREEMENT_BY_HEIRS'; // or Market Estimate
      case ValuationSource.INHERITED_VALUE:
        return 'MARKET_ESTIMATE';
      case ValuationSource.PURCHASE_PRICE:
        return 'MARKET_ESTIMATE';
      case ValuationSource.EXPERT_ESTIMATE:
        return 'MARKET_ESTIMATE';
      case ValuationSource.ONLINE_VALUATION:
        return 'MARKET_ESTIMATE';
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
