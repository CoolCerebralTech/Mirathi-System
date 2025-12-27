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
    if (!prismaValuation) return null;

    const {
      id,
      assetId,
      valueAmount,
      valueCurrency,
      previousValueAmount,
      previousValueCurrency,
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

    const previousValue = previousValueAmount
      ? MoneyVO.create({
          amount: Number(previousValueAmount),
          currency: previousValueCurrency || valueCurrency || 'KES',
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
   * Convert Domain Entity to Prisma model
   */
  toPersistence(assetValuation: AssetValuation): Partial<PrismaAssetValuation> {
    const props = assetValuation.getProps();

    return {
      id: assetValuation.id.toString(),
      assetId: props.assetId,
      valueAmount: props.value.amount,
      valueCurrency: props.value.currency,
      previousValueAmount: props.previousValue?.amount || null,
      previousValueCurrency: props.previousValue?.currency || null,
      valuationDate: props.valuationDate,
      source: this.mapToPrismaValuationSource(props.source),
      reason: props.reason || null,
      isProfessionalValuation: props.isProfessionalValuation,
      isTaxAcceptable: props.isTaxAcceptable,
      isCourtAcceptable: props.isCourtAcceptable,
      credibilityScore: props.credibilityScore,
      valuerName: props.valuerName || null,
      valuerLicenseNumber: props.valuerLicenseNumber || null,
      valuerInstitution: props.valuerInstitution || null,
      methodology: props.methodology || null,
      notes: props.notes || null,
      supportingDocuments: props.supportingDocuments || null,
      conductedBy: props.conductedBy,
      verifiedBy: props.verifiedBy || null,
      verifiedAt: props.verifiedAt || null,
    };
  }

  /**
   * Convert array of Prisma models to Domain Entities
   */
  toDomainList(prismaValuations: PrismaAssetValuation[]): AssetValuation[] {
    return prismaValuations
      .map((valuation) => this.toDomain(valuation))
      .filter((valuation) => valuation !== null);
  }

  /**
   * Convert array of Domain Entities to Prisma models
   */
  toPersistenceList(assetValuations: AssetValuation[]): Partial<PrismaAssetValuation>[] {
    return assetValuations.map((valuation) => this.toPersistence(valuation));
  }

  /**
   * Map Prisma valuation source to Domain enum
   */
  private mapToDomainValuationSource(prismaSource: string): ValuationSource {
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
      default:
        throw new Error(`Unknown valuation source: ${prismaSource}`);
    }
  }

  /**
   * Map Domain valuation source to Prisma enum
   */
  private mapToPrismaValuationSource(domainSource: ValuationSource): string {
    switch (domainSource) {
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
      default:
        throw new Error(`Unknown valuation source: ${domainSource}`);
    }
  }

  /**
   * Get the latest professional valuation
   */
  getLatestProfessionalValuation(valuations: AssetValuation[]): AssetValuation | undefined {
    const professionalValuations = valuations.filter((v) => v.isProfessionalValuation);

    if (professionalValuations.length === 0) return undefined;

    return professionalValuations.sort(
      (a, b) => b.valuationDate.getTime() - a.valuationDate.getTime(),
    )[0];
  }

  /**
   * Get the most credible valuation (highest credibility score)
   */
  getMostCredibleValuation(valuations: AssetValuation[]): AssetValuation | undefined {
    if (valuations.length === 0) return undefined;

    return valuations.reduce((mostCredible, current) =>
      current.credibilityScore > mostCredible.credibilityScore ? current : mostCredible,
    );
  }

  /**
   * Get valuation statistics
   */
  getValuationStatistics(valuations: AssetValuation[]): {
    totalCount: number;
    professionalCount: number;
    taxAcceptableCount: number;
    courtAcceptableCount: number;
    averageCredibilityScore: number;
    valueChanges: Array<{
      date: Date;
      value: MoneyVO;
      changePercentage?: number;
    }>;
  } {
    const professionalCount = valuations.filter((v) => v.isProfessionalValuation).length;
    const taxAcceptableCount = valuations.filter((v) => v.isTaxAcceptable).length;
    const courtAcceptableCount = valuations.filter((v) => v.isCourtAcceptable).length;

    const averageCredibilityScore =
      valuations.length > 0
        ? valuations.reduce((sum, v) => sum + v.credibilityScore, 0) / valuations.length
        : 0;

    // Sort by date and calculate value changes
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

  /**
   * Filter valuations by source
   */
  filterBySource(valuations: AssetValuation[], source: ValuationSource): AssetValuation[] {
    return valuations.filter((valuation) => valuation.source === source);
  }

  /**
   * Filter valuations that are acceptable for tax purposes
   */
  filterTaxAcceptable(valuations: AssetValuation[]): AssetValuation[] {
    return valuations.filter((valuation) => valuation.isTaxAcceptable);
  }

  /**
   * Filter valuations that are acceptable for court purposes
   */
  filterCourtAcceptable(valuations: AssetValuation[]): AssetValuation[] {
    return valuations.filter((valuation) => valuation.isCourtAcceptable);
  }

  /**
   * Check if asset has professional valuation
   */
  hasProfessionalValuation(valuations: AssetValuation[]): boolean {
    return valuations.some((valuation) => valuation.isProfessionalValuation);
  }

  /**
   * Get percentage change between valuations
   */
  calculateValueChange(
    currentValuation: AssetValuation,
    previousValuation?: AssetValuation,
  ):
    | {
        amount: MoneyVO;
        percentage: number;
        timeframeDays: number;
      }
    | undefined {
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
