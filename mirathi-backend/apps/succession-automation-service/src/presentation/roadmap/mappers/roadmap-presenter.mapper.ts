// src/succession-automation/src/presentation/roadmap/mappers/roadmap-presenter.mapper.ts
import { PaginatedListVm } from '../../../application/roadmap/queries/view-models/paginated-list.vm';
import { RoadmapAnalyticsVm } from '../../../application/roadmap/queries/view-models/roadmap-analytics.vm';
import { RoadmapDashboardVm } from '../../../application/roadmap/queries/view-models/roadmap-dashboard.vm';
import {
  RoadmapTaskDetailVm,
  RoadmapTaskSummaryVm,
} from '../../../application/roadmap/queries/view-models/task-detail.vm';
import { RoadmapAnalyticsResponseDto } from '../dtos/response/roadmap-analytics.response.dto';
import { RoadmapDashboardResponseDto } from '../dtos/response/roadmap-dashboard.response.dto';
import { TaskDetailResponseDto } from '../dtos/response/task-detail.response.dto';
import {
  TaskListResponseDto,
  TaskSummaryResponseDto,
} from '../dtos/response/task-list.response.dto';

export class RoadmapPresenterMapper {
  // ==================== DASHBOARD MAPPING ====================

  static toDashboardResponse(vm: RoadmapDashboardVm): RoadmapDashboardResponseDto {
    return {
      id: vm.id,
      estateId: vm.estateId,
      executorName: vm.executorName,
      status: vm.status,
      overallProgress: vm.overallProgress,
      currentPhase: vm.currentPhase,
      daysActive: vm.daysActive,
      healthStatus: vm.healthStatus,
      statusColor: vm.statusColor,
      phases: vm.phases.map((p) => ({
        phase: p.phase,
        name: p.name,
        percentComplete: p.percentComplete,
        status: p.status,
        totalTasks: p.totalTasks,
        completedTasks: p.completedTasks,
      })),
      nextAction: vm.nextAction
        ? {
            taskId: vm.nextAction.taskId,
            title: vm.nextAction.title,
            description: vm.nextAction.description,
            priority: vm.nextAction.priority,
            dueDate: vm.nextAction.dueDate,
          }
        : undefined,
      alerts: vm.alerts.map((a) => ({
        type: a.type,
        message: a.message,
        severity: a.severity,
        linkTo: a.linkTo,
      })),
    };
  }

  // ==================== TASK LIST MAPPING ====================

  static toTaskListResponse(vm: PaginatedListVm<RoadmapTaskSummaryVm>): TaskListResponseDto {
    return {
      items: vm.items.map((task) => this.toTaskSummaryResponse(task)),
      meta: {
        totalItems: vm.meta.totalItems,
        itemCount: vm.meta.itemCount,
        itemsPerPage: vm.meta.itemsPerPage,
        totalPages: vm.meta.totalPages,
        currentPage: vm.meta.currentPage,
      },
    };
  }

  static toTaskSummaryResponse(vm: RoadmapTaskSummaryVm): TaskSummaryResponseDto {
    return {
      id: vm.id,
      shortCode: vm.shortCode,
      title: vm.title,
      category: vm.category,
      phase: vm.phase,
      status: vm.status,
      priority: vm.priority,
      dueDate: vm.dueDate,
      isOverdue: vm.isOverdue,
      daysRemaining: vm.daysRemaining,
      statusIcon: vm.statusIcon,
      urgencyScore: vm.urgencyScore,
      isLocked: vm.isLocked,
    };
  }

  // ==================== TASK DETAIL MAPPING ====================

  static toTaskDetailResponse(vm: RoadmapTaskDetailVm): TaskDetailResponseDto {
    // Map base summary fields
    const summary = this.toTaskSummaryResponse(vm);

    return {
      ...summary,
      description: vm.description,
      detailedInstructions: vm.detailedInstructions,
      quickTips: vm.quickTips,
      commonMistakes: vm.commonMistakes,
      externalLinks: vm.externalLinks.map((link) => ({
        title: link.title,
        url: link.url,
        type: link.type,
      })),
      legalReferences: vm.legalReferences.map((ref) => ({
        act: ref.act,
        section: ref.section,
        description: ref.description,
      })),
      requiresProof: vm.requiresProof,
      proofTypes: vm.proofTypes,
      proofDocumentType: vm.proofDocumentType,
      dependencies: vm.dependencies.map((dep) => ({
        id: dep.id,
        isMet: dep.isMet,
      })),
      completedAt: vm.completedAt,
      completedBy: vm.completedBy,
      completionNotes: vm.completionNotes,
      historyLog: vm.historyLog.map((h) => ({
        action: h.action,
        date: h.date,
        user: h.user,
        details: h.details,
      })),
    };
  }

  // ==================== ANALYTICS MAPPING ====================

  static toAnalyticsResponse(vm: RoadmapAnalyticsVm): RoadmapAnalyticsResponseDto {
    return {
      estimatedCompletionDate: vm.estimatedCompletionDate,
      totalDurationDays: vm.totalDurationDays,
      daysRemaining: vm.daysRemaining,
      isOnTrack: vm.isOnTrack,
      estimatedCostKES: vm.estimatedCostKES,
      costBreakdown: vm.costBreakdown,
      efficiencyScore: vm.efficiencyScore,
      complexityScore: vm.complexityScore,
      riskExposure: vm.riskExposure,
      predictedBottlenecks: vm.predictedBottlenecks,
      recommendedAccelerations: vm.recommendedAccelerations,
      percentileRanking: vm.percentileRanking,
    };
  }

  // ==================== CRITICAL PATH MAPPING ====================

  static toCriticalPathResponse(vms: RoadmapTaskSummaryVm[]): TaskSummaryResponseDto[] {
    return vms.map((vm) => this.toTaskSummaryResponse(vm));
  }
}
