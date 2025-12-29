import {
  ChecklistItemVM,
  FilingChecklistVM,
} from '../../../application/readiness/queries/view-models/filing-checklist.vm';
import { ReadinessDashboardVM } from '../../../application/readiness/queries/view-models/readiness-dashboard.vm';
import { RiskDetailVM } from '../../../application/readiness/queries/view-models/risk-detail.vm';
import { SimulationResultVM } from '../../../application/readiness/queries/view-models/simulation-result.vm';
import { StrategyRoadmapVM } from '../../../application/readiness/queries/view-models/strategy-roadmap.vm';
import { DocumentGap } from '../../../domain/value-objects/document-gap.vo';
import { DocumentGapResponseDto } from '../dtos/response/document-gap.response.dto';
import { FilingChecklistResponseDto } from '../dtos/response/filing-checklist.response.dto';
// Response DTOs
import { ReadinessDashboardResponseDto } from '../dtos/response/readiness-dashboard.response.dto';
import { RiskDetailResponseDto } from '../dtos/response/risk-detail.response.dto';
import { SimulationResultResponseDto } from '../dtos/response/simulation-result.response.dto';
import { StrategyRoadmapResponseDto } from '../dtos/response/strategy-roadmap.response.dto';

export class ReadinessPresenterMapper {
  static toDashboardResponse(vm: ReadinessDashboardVM): ReadinessDashboardResponseDto {
    return {
      assessmentId: vm.assessmentId,
      estateId: vm.estateId,
      lastUpdated: vm.lastUpdated,
      score: vm.score,
      statusLabel: vm.statusLabel,
      statusColor: vm.statusColor,
      confidenceLevel: vm.confidenceLevel,
      summaryMessage: vm.summaryMessage,
      nextBestAction: vm.nextBestAction,
      totalRisks: vm.totalRisks,
      criticalRisks: vm.criticalRisks,
      topRisks: vm.topRisks.map((risk) => this.toRiskDetailResponse(risk)),
      caseContext: {
        courtJurisdiction: vm.caseContext.courtJurisdiction,
        applicationType: vm.caseContext.applicationType,
        estimatedTimeline: vm.caseContext.estimatedTimeline,
        isComplex: vm.caseContext.isComplex,
      },
    };
  }

  static toRiskDetailResponse(vm: RiskDetailVM): RiskDetailResponseDto {
    return {
      id: vm.id,
      title: vm.title,
      description: vm.description,
      severity: vm.severity,
      category: vm.category,
      status: vm.status,
      badgeColor: vm.badgeColor,
      priorityLabel: vm.priorityLabel,
      icon: vm.icon,
      legalBasis: vm.legalBasis,
      mitigationSteps: vm.mitigationSteps,
      daysActive: vm.daysActive,
      isBlocking: vm.isBlocking,
      linkedEntityId: vm.linkedEntityId,
    };
  }

  static toRiskDetailListResponse(vms: RiskDetailVM[]): RiskDetailResponseDto[] {
    return vms.map((vm) => this.toRiskDetailResponse(vm));
  }

  static toChecklistResponse(vm: FilingChecklistVM): FilingChecklistResponseDto {
    // Helper to map items
    const mapItems = (items: ChecklistItemVM[]) =>
      items.map((item) => ({
        documentName: item.documentName,
        description: item.description,
        isMandatory: item.isMandatory,
        isProvided: item.isProvided,
        howToObtain: item.howToObtain,
        severity: item.severity,
      }));

    return {
      readyToPrint: vm.readyToPrint,
      mandatoryMissingCount: vm.mandatoryMissingCount,
      totalProgress: vm.totalProgress,
      categories: {
        identity: mapItems(vm.categories.identity),
        financial: mapItems(vm.categories.financial),
        courtForms: mapItems(vm.categories.courtForms),
        supporting: mapItems(vm.categories.supporting),
      },
    };
  }

  static toStrategyResponse(vm: StrategyRoadmapVM): StrategyRoadmapResponseDto {
    return {
      strategyContent: vm.strategyContent,
      milestones: vm.milestones.map((m) => ({
        title: m.title,
        isCompleted: m.isCompleted,
        blockers: m.blockers,
      })),
      filingFeeEstimate: vm.filingFeeEstimate,
    };
  }

  static toSimulationResponse(vm: SimulationResultVM): SimulationResultResponseDto {
    return {
      currentScore: vm.currentScore,
      projectedScore: vm.projectedScore,
      scoreImprovement: vm.scoreImprovement,
      newStatusLabel: vm.newStatusLabel,
      willBeReadyToFile: vm.willBeReadyToFile,
      remainingBlockersCount: vm.remainingBlockersCount,
    };
  }

  static toDocumentGapResponse(domain: DocumentGap): DocumentGapResponseDto {
    return {
      type: domain.type,
      severity: domain.severity,
      description: domain.description,
      legalBasis: domain.legalBasis || 'N/A',
      obtainingInstructions: domain.obtainingInstructions,
      estimatedTimeDays: domain.estimatedTimeDays,
      alternativeOptions: domain.alternativeOptions,
      isWaivable: domain.isWaivable,
      urgencyMessage: domain.getUrgencyMessage(),
    };
  }

  static toDocumentGapListResponse(domains: DocumentGap[]): DocumentGapResponseDto[] {
    return domains.map((d) => this.toDocumentGapResponse(d));
  }
}
