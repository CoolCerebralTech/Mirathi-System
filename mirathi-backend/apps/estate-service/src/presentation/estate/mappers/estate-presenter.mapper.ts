import {
  AssetInventoryVM,
  DebtWaterfallVM,
  DependantListVM,
  DistributionPreviewVM,
  EstateDashboardVM,
  GiftListVM,
  MoneyVM,
  SolvencyRadarVM,
} from '../../../application/estate/queries/view-models';
import {
  AssetInventoryResponseDto,
  DebtWaterfallResponseDto,
  DependantListResponseDto,
  DistributionPreviewResponseDto,
  EstateDashboardResponseDto,
  GiftListResponseDto,
  MoneyResponseDto,
  SolvencyRadarResponseDto,
} from '../dtos/response';

/**
 * Estate Presenter Mapper
 *
 * Decouples the internal Application View Models from the external HTTP Response DTOs.
 * Ensures strict API contracts even if internal structures change.
 */
export class EstatePresenterMapper {
  // ===========================================================================
  // SHARED HELPERS
  // ===========================================================================

  static toMoneyDto(vm: MoneyVM): MoneyResponseDto {
    return {
      amount: vm.amount,
      currency: vm.currency,
      formatted: vm.formatted,
    };
  }

  // ===========================================================================
  // DASHBOARD & FINANCIALS
  // ===========================================================================

  static toDashboardDto(vm: EstateDashboardVM): EstateDashboardResponseDto {
    return {
      id: vm.id,
      name: vm.name,
      deceasedName: vm.deceasedName,
      dateOfDeath: vm.dateOfDeath,
      daysSinceDeath: vm.daysSinceDeath,
      status: vm.status,
      isFrozen: vm.isFrozen,
      freezeReason: vm.freezeReason,
      // Financials
      netWorth: this.toMoneyDto(vm.netWorth),
      grossAssets: this.toMoneyDto(vm.grossAssets),
      totalLiabilities: this.toMoneyDto(vm.totalLiabilities),
      cashOnHand: this.toMoneyDto(vm.cashOnHand),
      cashReserved: this.toMoneyDto(vm.cashReserved),
      availableCash: this.toMoneyDto(vm.availableCash),
      // Analysis
      solvencyRatio: vm.solvencyRatio,
      isSolvent: vm.isSolvent,
      taxStatus: vm.taxStatus,
      administrationProgress: vm.administrationProgress,
    };
  }

  static toSolvencyRadarDto(vm: SolvencyRadarVM): SolvencyRadarResponseDto {
    return {
      estateId: vm.estateId,
      generatedAt: vm.generatedAt,
      healthScore: vm.healthScore,
      riskLevel: vm.riskLevel,
      netPosition: this.toMoneyDto(vm.netPosition),
      liquidityAnalysis: {
        liquidCash: this.toMoneyDto(vm.liquidityAnalysis.liquidCash),
        immediateObligations: this.toMoneyDto(vm.liquidityAnalysis.immediateObligations),
        cashShortfall: this.toMoneyDto(vm.liquidityAnalysis.cashShortfall),
        liquidityRatio: vm.liquidityAnalysis.liquidityRatio,
        isLiquid: vm.liquidityAnalysis.isLiquid,
      },
      assetComposition: {
        liquidPercentage: vm.assetComposition.liquidPercentage,
        realEstatePercentage: vm.assetComposition.realEstatePercentage,
        businessPercentage: vm.assetComposition.businessPercentage,
      },
      alerts: vm.alerts,
      recommendations: vm.recommendations,
    };
  }

  // ===========================================================================
  // INVENTORY
  // ===========================================================================

  static toAssetInventoryDto(vm: AssetInventoryVM): AssetInventoryResponseDto {
    return {
      totalCount: vm.totalCount,
      totalValue: this.toMoneyDto(vm.totalValue),
      liquidAssetsValue: this.toMoneyDto(vm.liquidAssetsValue),
      items: vm.items.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        description: item.description,
        currentValue: this.toMoneyDto(item.currentValue),
        status: item.status,
        isEncumbered: item.isEncumbered,
        encumbranceDetails: item.encumbranceDetails,
        isCoOwned: item.isCoOwned,
        estateSharePercentage: item.estateSharePercentage,
        identifier: item.identifier,
        location: item.location,
      })),
    };
  }

  // ===========================================================================
  // LIABILITIES (S.45)
  // ===========================================================================

  static toDebtWaterfallDto(vm: DebtWaterfallVM): DebtWaterfallResponseDto {
    // Helper to map individual debt items
    const mapItems = (items: any[]) =>
      items.map((item) => ({
        id: item.id,
        creditorName: item.creditorName,
        description: item.description,
        originalAmount: this.toMoneyDto(item.originalAmount),
        outstandingAmount: this.toMoneyDto(item.outstandingAmount),
        priorityTier: item.priorityTier,
        tierName: item.tierName,
        status: item.status,
        isSecured: item.isSecured,
        dueDate: item.dueDate,
      }));

    return {
      tier1_FuneralExpenses: mapItems(vm.tier1_FuneralExpenses),
      tier2_Testamentary: mapItems(vm.tier2_Testamentary),
      tier3_SecuredDebts: mapItems(vm.tier3_SecuredDebts),
      tier4_TaxesAndWages: mapItems(vm.tier4_TaxesAndWages),
      tier5_Unsecured: mapItems(vm.tier5_Unsecured),
      totalLiabilities: this.toMoneyDto(vm.totalLiabilities),
      totalPaid: this.toMoneyDto(vm.totalPaid),
      highestPriorityOutstanding: vm.highestPriorityOutstanding,
      canPayNextTier: vm.canPayNextTier,
    };
  }

  // ===========================================================================
  // DISTRIBUTION
  // ===========================================================================

  static toDistributionPreviewDto(vm: DistributionPreviewVM): DistributionPreviewResponseDto {
    return {
      estateNetValue: this.toMoneyDto(vm.estateNetValue),
      totalDistributablePool: this.toMoneyDto(vm.totalDistributablePool),
      shares: vm.shares.map((share) => ({
        beneficiaryId: share.beneficiaryId,
        beneficiaryName: share.beneficiaryName,
        relationship: share.relationship,
        grossSharePercentage: share.grossSharePercentage,
        grossShareValue: this.toMoneyDto(share.grossShareValue),
        lessGiftInterVivos: this.toMoneyDto(share.lessGiftInterVivos),
        netDistributableValue: this.toMoneyDto(share.netDistributableValue),
      })),
      readinessCheck: {
        isReady: vm.readinessCheck.isReady,
        blockers: vm.readinessCheck.blockers,
      },
    };
  }

  // ===========================================================================
  // DEPENDANTS & GIFTS
  // ===========================================================================

  static toDependantListDto(vm: DependantListVM): DependantListResponseDto {
    return {
      totalMonthlyNeeds: this.toMoneyDto(vm.totalMonthlyNeeds),
      highRiskCount: vm.highRiskCount,
      items: vm.items.map((item) => ({
        id: item.id,
        name: item.name,
        relationship: item.relationship,
        status: item.status,
        isMinor: item.isMinor,
        age: item.age,
        isIncapacitated: item.isIncapacitated,
        riskLevel: item.riskLevel,
        monthlyMaintenanceNeeds: this.toMoneyDto(item.monthlyMaintenanceNeeds),
        proposedAllocation: item.proposedAllocation
          ? this.toMoneyDto(item.proposedAllocation)
          : undefined,
        evidenceCount: item.evidenceCount,
        hasSufficientEvidence: item.hasSufficientEvidence,
      })),
    };
  }

  static toGiftListDto(vm: GiftListVM): GiftListResponseDto {
    return {
      totalHotchpotAddBack: this.toMoneyDto(vm.totalHotchpotAddBack),
      items: vm.items.map((item) => ({
        id: item.id,
        recipientId: item.recipientId,
        description: item.description,
        assetType: item.assetType,
        valueAtTimeOfGift: this.toMoneyDto(item.valueAtTimeOfGift),
        hotchpotValue: this.toMoneyDto(item.hotchpotValue),
        status: item.status,
        isContested: item.isContested,
        isSubjectToHotchpot: item.isSubjectToHotchpot,
        dateGiven: item.dateGiven,
      })),
    };
  }
}
