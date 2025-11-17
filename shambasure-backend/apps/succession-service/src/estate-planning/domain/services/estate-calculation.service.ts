import { Injectable } from '@nestjs/common';
import { AssetType, DebtType, BequestType } from '@prisma/client';
import { WillAggregate } from '../aggregates/will.aggregate';
import { EstateAggregate } from '../aggregates/estate.aggregate';
import { AssetValue } from '../value-objects/asset-value.vo';
import { SharePercentage } from '../value-objects/share-percentage.vo';

export interface EstateSummary {
  totalAssets: AssetValue;
  totalLiabilities: AssetValue;
  netEstateValue: AssetValue;
  assetCount: number;
  liabilityCount: number;
  assetBreakdown: Record<AssetType, { count: number; value: AssetValue }>;
  debtBreakdown: Record<DebtType, { count: number; amount: AssetValue }>;
}

export interface DistributionPlan {
  beneficiaries: Array<{
    beneficiaryId: string;
    beneficiaryName: string;
    relationship: string;
    entitlements: Array<{
      assetId: string;
      assetName: string;
      bequestType: BequestType;
      sharePercentage?: SharePercentage;
      specificAmount?: AssetValue;
      estimatedValue: AssetValue;
      conditions?: string;
    }>;
    totalEntitlement: AssetValue;
  }>;
  totalDistributable: AssetValue;
  debtPayments: Array<{
    debtId: string;
    creditor: string;
    amount: AssetValue;
    priority: number;
  }>;
  administrativeCosts: AssetValue;
  taxEstimates: AssetValue;
}

@Injectable()
export class EstateCalculationService {
  /**
   * Calculate comprehensive estate summary
   */
  calculateEstateSummary(estate: EstateAggregate): EstateSummary {
    const allAssets = estate.getAllAssets();
    const allDebts = estate.getAllDebts();

    // Calculate total assets
    const totalAssets = allAssets.reduce(
      (sum, asset) => {
        return sum.add(asset.getCurrentValue());
      },
      new AssetValue(0, 'KES'),
    );

    // Calculate total liabilities
    const totalLiabilities = allDebts.reduce(
      (sum, debt) => {
        const debtValue = new AssetValue(debt.getOutstandingBalance(), debt.getCurrency());
        return sum.add(debtValue);
      },
      new AssetValue(0, 'KES'),
    );

    // Calculate net value
    const netEstateValue = totalAssets.subtract(totalLiabilities);

    // Calculate asset breakdown
    const assetBreakdown = this.calculateAssetBreakdown(allAssets);

    // Calculate debt breakdown
    const debtBreakdown = this.calculateDebtBreakdown(allDebts);

    return {
      totalAssets,
      totalLiabilities: totalLiabilities,
      netEstateValue,
      assetCount: allAssets.length,
      liabilityCount: allDebts.length,
      assetBreakdown,
      debtBreakdown,
    };
  }

  /**
   * Calculate distribution plan for an estate
   */
  calculateDistributionPlan(will: WillAggregate): DistributionPlan {
    const beneficiaries = will.getAllBeneficiaries();
    const assets = will.getAllAssets();
    const estateSummary = this.calculateEstateSummaryForWill(will);

    // Group beneficiaries and calculate entitlements
    const beneficiaryPlans = beneficiaries.map((beneficiary) => {
      const beneficiaryAssets = will.getBeneficiariesForAsset(beneficiary.getAssetId());
      const entitlements = beneficiaryAssets.map((ba) => {
        const asset = assets.find((a) => a.getId() === ba.getAssetId());
        if (!asset) {
          throw new Error(`Asset ${ba.getAssetId()} not found`);
        }

        const estimatedValue = this.calculateBeneficiaryEntitlement(ba, asset);

        return {
          assetId: asset.getId(),
          assetName: asset.getName(),
          bequestType: ba.getBequestType(),
          sharePercentage: ba.getSharePercentage(),
          specificAmount: ba.getSpecificAmount(),
          estimatedValue,
          conditions: ba.getConditionDetails(),
        };
      });

      const totalEntitlement = entitlements.reduce(
        (sum, entitlement) => {
          return sum.add(entitlement.estimatedValue);
        },
        new AssetValue(0, 'KES'),
      );

      return {
        beneficiaryId: beneficiary.getId(),
        beneficiaryName: beneficiary.getBeneficiaryName(),
        relationship: beneficiary.getBeneficiaryInfo().relationship || 'Unknown',
        entitlements,
        totalEntitlement,
      };
    });

    // Calculate debt payments (Kenyan priority order)
    const debtPayments = this.calculateDebtPayments(estateSummary.totalLiabilities);

    // Estimate administrative costs (Kenyan context)
    const administrativeCosts = this.estimateAdministrativeCosts(estateSummary.totalAssets);

    // Estimate taxes (simplified for Kenya)
    const taxEstimates = this.estimateTaxes(estateSummary.netEstateValue);

    const totalDistributable = estateSummary.netEstateValue
      .subtract(administrativeCosts)
      .subtract(taxEstimates);

    return {
      beneficiaries: beneficiaryPlans,
      totalDistributable,
      debtPayments,
      administrativeCosts,
      taxEstimates,
    };
  }

  /**
   * Calculate intestate succession according to Kenyan Law of Succession Act
   */
  calculateIntestateDistribution(estate: EstateAggregate, dependants: any[]): DistributionPlan {
    const estateSummary = this.calculateEstateSummary(estate);
    const spouse = dependants.find((d) => d.isSpouse);
    const children = dependants.filter(
      (d) => d.relationship === 'CHILD' || d.relationship === 'ADOPTED_CHILD',
    );
    const parents = dependants.filter((d) => d.relationship === 'PARENT');
    const siblings = dependants.filter((d) => d.relationship === 'SIBLING');

    const beneficiaries: DistributionPlan['beneficiaries'] = [];
    let remainingEstate = estateSummary.netEstateValue;

    // Kenyan intestate succession rules
    if (spouse && children.length > 0) {
      // Spouse gets personal and household effects, plus life interest in residue
      const personalEffects = this.calculatePersonalEffects(estateSummary.totalAssets);
      const spouseShare = personalEffects.add(
        new AssetValue(
          remainingEstate.getAmount() * 0.33, // Life interest in 1/3
          remainingEstate.getCurrency(),
        ),
      );

      beneficiaries.push({
        beneficiaryId: spouse.id,
        beneficiaryName: spouse.name,
        relationship: 'Spouse',
        entitlements: [
          {
            assetId: 'personal-effects',
            assetName: 'Personal and Household Effects',
            bequestType: BequestType.SPECIFIC,
            specificAmount: personalEffects,
            estimatedValue: personalEffects,
          },
        ],
        totalEntitlement: spouseShare,
      });

      remainingEstate = remainingEstate.subtract(personalEffects);
    } else if (spouse && children.length === 0) {
      // Spouse gets entire estate if no children
      beneficiaries.push({
        beneficiaryId: spouse.id,
        beneficiaryName: spouse.name,
        relationship: 'Spouse',
        entitlements: [],
        totalEntitlement: remainingEstate,
      });
      remainingEstate = new AssetValue(0, remainingEstate.getCurrency());
    }

    // Children share the residue equally
    if (children.length > 0 && remainingEstate.getAmount() > 0) {
      const childShareAmount = remainingEstate.getAmount() / children.length;

      children.forEach((child) => {
        beneficiaries.push({
          beneficiaryId: child.id,
          beneficiaryName: child.name,
          relationship: 'Child',
          entitlements: [],
          totalEntitlement: new AssetValue(childShareAmount, remainingEstate.getCurrency()),
        });
      });
    }

    // If no spouse or children, follow other rules
    if (beneficiaries.length === 0) {
      // Parents get the estate
      if (parents.length > 0) {
        const parentShareAmount = remainingEstate.getAmount() / parents.length;
        parents.forEach((parent) => {
          beneficiaries.push({
            beneficiaryId: parent.id,
            beneficiaryName: parent.name,
            relationship: 'Parent',
            entitlements: [],
            totalEntitlement: new AssetValue(parentShareAmount, remainingEstate.getCurrency()),
          });
        });
      }
      // Then siblings
      else if (siblings.length > 0) {
        const siblingShareAmount = remainingEstate.getAmount() / siblings.length;
        siblings.forEach((sibling) => {
          beneficiaries.push({
            beneficiaryId: sibling.id,
            beneficiaryName: sibling.name,
            relationship: 'Sibling',
            entitlements: [],
            totalEntitlement: new AssetValue(siblingShareAmount, remainingEstate.getCurrency()),
          });
        });
      }
    }

    return {
      beneficiaries,
      totalDistributable: estateSummary.netEstateValue,
      debtPayments: this.calculateDebtPayments(estateSummary.totalLiabilities),
      administrativeCosts: this.estimateAdministrativeCosts(estateSummary.totalAssets),
      taxEstimates: this.estimateTaxes(estateSummary.netEstateValue),
    };
  }

  /**
   * Calculate beneficiary's entitlement for a specific asset
   */
  private calculateBeneficiaryEntitlement(
    beneficiary: any, // Beneficiary entity
    asset: any, // Asset entity
  ): AssetValue {
    const assetValue = asset.getCurrentValue();

    switch (beneficiary.getBequestType()) {
      case BequestType.SPECIFIC:
        return beneficiary.getSpecificAmount() || new AssetValue(0, assetValue.getCurrency());

      case BequestType.PERCENTAGE:
        const share = beneficiary.getSharePercentage()?.getValue() || 0;
        const percentageAmount = assetValue.getAmount() * (share / 100);
        return new AssetValue(percentageAmount, assetValue.getCurrency());

      case BequestType.RESIDUARY:
        // This would require more complex calculation involving the entire estate
        return new AssetValue(assetValue.getAmount() * 0.1, assetValue.getCurrency()); // Simplified

      default:
        return new AssetValue(0, assetValue.getCurrency());
    }
  }

  /**
   * Calculate asset breakdown by type
   */
  private calculateAssetBreakdown(
    assets: any[],
  ): Record<AssetType, { count: number; value: AssetValue }> {
    const breakdown: Record<string, { count: number; value: AssetValue }> = {};

    assets.forEach((asset) => {
      const type = asset.getType();
      if (!breakdown[type]) {
        breakdown[type] = {
          count: 0,
          value: new AssetValue(0, 'KES'),
        };
      }

      breakdown[type].count++;
      breakdown[type].value = breakdown[type].value.add(asset.getCurrentValue());
    });

    return breakdown as Record<AssetType, { count: number; value: AssetValue }>;
  }

  /**
   * Calculate debt breakdown by type
   */
  private calculateDebtBreakdown(
    debts: any[],
  ): Record<DebtType, { count: number; amount: AssetValue }> {
    const breakdown: Record<string, { count: number; amount: AssetValue }> = {};

    debts.forEach((debt) => {
      const type = debt.getType();
      if (!breakdown[type]) {
        breakdown[type] = {
          count: 0,
          amount: new AssetValue(0, 'KES'),
        };
      }

      breakdown[type].count++;
      breakdown[type].amount = breakdown[type].amount.add(
        new AssetValue(debt.getOutstandingBalance(), debt.getCurrency()),
      );
    });

    return breakdown as Record<DebtType, { count: number; amount: AssetValue }>;
  }

  /**
   * Calculate debt payments in Kenyan priority order
   */
  private calculateDebtPayments(totalLiabilities: AssetValue): Array<{
    debtId: string;
    creditor: string;
    amount: AssetValue;
    priority: number;
  }> {
    // Simplified implementation
    // In reality, this would use actual debts from the estate
    return [
      {
        debtId: 'estimated-debts',
        creditor: 'Various Creditors',
        amount: totalLiabilities,
        priority: 1,
      },
    ];
  }

  /**
   * Estimate administrative costs for Kenyan probate
   */
  private estimateAdministrativeCosts(totalAssets: AssetValue): AssetValue {
    const amount = totalAssets.getAmount();
    let cost = 0;

    // Kenyan probate fee structure (simplified)
    if (amount <= 1000000) {
      cost = amount * 0.02; // 2% for small estates
    } else if (amount <= 5000000) {
      cost = 20000 + (amount - 1000000) * 0.015; // 1.5% for medium estates
    } else {
      cost = 80000 + (amount - 5000000) * 0.01; // 1% for large estates
    }

    // Cap at reasonable amount
    cost = Math.min(cost, 500000);

    return new AssetValue(cost, totalAssets.getCurrency());
  }

  /**
   * Estimate taxes for Kenyan estate
   */
  private estimateTaxes(netEstateValue: AssetValue): AssetValue {
    const amount = netEstateValue.getAmount();

    // Simplified tax estimation
    // Note: Kenya currently doesn't have inheritance tax, but consider other taxes
    let tax = 0;

    // Stamp duty on property transfers
    if (amount > 1000000) {
      tax = amount * 0.02; // 2% stamp duty estimate
    }

    // Capital gains tax considerations
    if (amount > 5000000) {
      tax += amount * 0.05; // 5% capital gains estimate
    }

    return new AssetValue(tax, netEstateValue.getCurrency());
  }

  /**
   * Calculate personal effects value (Kenyan law)
   */
  private calculatePersonalEffects(totalAssets: AssetValue): AssetValue {
    // Personal and household effects up to a reasonable limit
    const personalEffectsValue = Math.min(totalAssets.getAmount() * 0.1, 1000000);
    return new AssetValue(personalEffectsValue, totalAssets.getCurrency());
  }

  private calculateEstateSummaryForWill(will: WillAggregate): EstateSummary {
    // Create a temporary estate aggregate for the will
    const tempEstate = new EstateAggregate();
    tempEstate.addWill(will);
    return this.calculateEstateSummary(tempEstate);
  }
}
