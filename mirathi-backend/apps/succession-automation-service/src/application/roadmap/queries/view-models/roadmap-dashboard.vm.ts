// src/succession-automation/src/application/roadmap/queries/view-models/roadmap-dashboard.vm.ts
import {
  ExecutorRoadmap,
  RoadmapPhase,
  RoadmapStatus,
} from '../../../../domain/aggregates/executor-roadmap.aggregate';
import { TaskPriority } from '../../../../domain/entities/roadmap-task.entity';

export class PhaseProgressVm {
  phase: RoadmapPhase;
  name: string;
  percentComplete: number;
  status: 'LOCKED' | 'ACTIVE' | 'COMPLETED';
  totalTasks: number;
  completedTasks: number;
}

export class RoadmapDashboardVm {
  id: string;
  estateId: string;
  executorName: string;

  // High-Level Status
  status: RoadmapStatus;
  overallProgress: number;
  currentPhase: RoadmapPhase;
  daysActive: number;

  // Visual Indicators
  healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  statusColor: string;

  // Progress Stepper Data
  phases: PhaseProgressVm[];

  // The "GPS" Recommendation
  nextAction?: {
    taskId: string;
    title: string;
    description: string;
    priority: TaskPriority;
    dueDate?: string;
  };

  // Critical Alerts
  alerts: Array<{
    type: 'RISK' | 'OVERDUE' | 'BLOCKED';
    message: string;
    severity: 'HIGH' | 'CRITICAL';
    linkTo?: string; // Task ID or Risk ID
  }>;

  static fromAggregate(roadmap: ExecutorRoadmap): RoadmapDashboardVm {
    const nextTask = roadmap.getNextRecommendedTask();

    return {
      id: roadmap.id.toString(),
      estateId: roadmap.estateId,
      executorName: roadmap.executorName,
      status: roadmap.status,
      overallProgress: roadmap.percentComplete,
      currentPhase: roadmap.currentPhase,
      daysActive: Math.floor(
        (new Date().getTime() - roadmap.startedAt.getTime()) / (1000 * 60 * 60 * 24),
      ),

      healthStatus: roadmap.getHealthStatus(),
      statusColor: this.getStatusColor(roadmap.getHealthStatus()),

      phases: Object.values(RoadmapPhase).map((phase) => {
        const progress = roadmap.getPhaseProgress(phase);
        const isActive = roadmap.currentPhase === phase;
        const isPast = this.isPhasePast(phase, roadmap.currentPhase);

        return {
          phase,
          name: this.formatPhaseName(phase),
          percentComplete: progress?.percentComplete || 0,
          status: isPast ? 'COMPLETED' : isActive ? 'ACTIVE' : 'LOCKED',
          totalTasks: progress?.totalTasks || 0,
          completedTasks: progress?.completedTasks || 0,
        };
      }),

      nextAction: nextTask
        ? {
            taskId: nextTask.id.toString(),
            title: nextTask.title,
            description: nextTask.description,
            priority: nextTask.priority,
            dueDate: nextTask.dueDate?.toISOString(),
          }
        : undefined,

      alerts: this.generateAlerts(roadmap),
    };
  }

  private static getStatusColor(health: string): string {
    switch (health) {
      case 'HEALTHY':
        return '#10B981'; // Green
      case 'WARNING':
        return '#F59E0B'; // Amber
      case 'CRITICAL':
        return '#EF4444'; // Red
      default:
        return '#6B7280';
    }
  }

  private static formatPhaseName(phase: string): string {
    return phase
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private static isPhasePast(checkPhase: RoadmapPhase, currentPhase: RoadmapPhase): boolean {
    const order = [
      RoadmapPhase.PRE_FILING,
      RoadmapPhase.FILING,
      RoadmapPhase.CONFIRMATION,
      RoadmapPhase.DISTRIBUTION,
      RoadmapPhase.CLOSURE,
    ];
    return order.indexOf(checkPhase) < order.indexOf(currentPhase);
  }

  private static generateAlerts(roadmap: ExecutorRoadmap): RoadmapDashboardVm['alerts'] {
    const alerts: RoadmapDashboardVm['alerts'] = [];

    // Risks
    if (roadmap.blockedByRiskIds.length > 0) {
      alerts.push({
        type: 'RISK',
        message: `${roadmap.blockedByRiskIds.length} critical risks are blocking your progress.`,
        severity: 'CRITICAL',
      });
    }

    // Overdue
    const overdueCount = roadmap.getOverdueTasks().length;
    if (overdueCount > 0) {
      alerts.push({
        type: 'OVERDUE',
        message: `You have ${overdueCount} overdue tasks.`,
        severity: overdueCount > 2 ? 'CRITICAL' : 'HIGH',
      });
    }

    // Blocked Tasks
    const blockedCount = roadmap.getBlockedTasks().length;
    if (blockedCount > 0) {
      alerts.push({
        type: 'BLOCKED',
        message: `${blockedCount} tasks are currently blocked.`,
        severity: 'HIGH',
      });
    }

    return alerts;
  }
}
