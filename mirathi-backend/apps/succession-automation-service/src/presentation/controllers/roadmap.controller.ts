// apps/succession-automation-service/src/presentation/controllers/roadmap.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@shamba/auth';

import { RoadmapOrchestrationService } from '../../application/services/roadmap-orchestration.service';
import {
  CompleteTaskRequestDto,
  ExecutorRoadmapDto,
  RecommendedTasksResponseDto,
  RoadmapPhaseOverviewDto,
  SkipTaskRequestDto,
  StartTaskRequestDto,
  TaskCompletionResponseDto,
} from '../dtos';

@ApiTags('Succession Roadmaps')
@ApiBearerAuth()
@Controller('succession/roadmaps')
@UseGuards(JwtAuthGuard)
export class RoadmapController {
  constructor(private readonly roadmapService: RoadmapOrchestrationService) {}

  @Get(':estateId')
  @ApiOperation({ summary: 'Get roadmap for an estate' })
  @ApiParam({ name: 'estateId', description: 'Estate ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Roadmap retrieved',
    type: ExecutorRoadmapDto,
  })
  async getRoadmap(
    @Request() req,
    @Param('estateId') estateId: string,
  ): Promise<ExecutorRoadmapDto> {
    const userId = req.user.id;
    const result = await this.roadmapService.getUserRoadmap(userId, estateId);

    return {
      id: result.roadmap.id,
      userId: result.roadmap.userId,
      estateId: result.roadmap.estateId,
      currentPhase: result.roadmap.currentPhase as any,
      overallProgress: result.roadmap.overallProgress,
      totalTasks: result.roadmap.totalTasks,
      completedTasks: result.roadmap.completedTasks,
      availableTasks: result.roadmap.availableTasks,
      lockedTasks: result.roadmap.lockedTasks,
      startedAt: result.roadmap.startedAt,
      tasks: result.tasks.map((task) => this.mapTaskToDto(task)),
      currentPhaseTasks: result.currentPhaseTasks.map((task) => this.mapTaskToDto(task)),
      nextPhase: result.nextPhase,
    };
  }

  @Get(':estateId/phases/:phase')
  @ApiOperation({ summary: 'Get phase overview' })
  @ApiParam({ name: 'estateId', description: 'Estate ID' })
  @ApiParam({ name: 'phase', description: 'Roadmap phase' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Phase overview retrieved',
    type: RoadmapPhaseOverviewDto,
  })
  async getPhaseOverview(
    @Request() req,
    @Param('estateId') estateId: string,
    @Param('phase') phase: string,
  ): Promise<RoadmapPhaseOverviewDto> {
    const userId = req.user.id;
    const roadmap = await this.roadmapService.getUserRoadmap(userId, estateId);

    const overview = await this.roadmapService.getPhaseOverview(roadmap.roadmap.id, phase as any);

    return {
      phase: overview.phase,
      totalTasks: overview.totalTasks,
      completed: overview.completed,
      available: overview.available,
      inProgress: overview.inProgress,
      locked: overview.locked,
      progressPercentage: overview.progressPercentage,
      estimatedDays: overview.estimatedDays,
      tasks: overview.tasks.map((task) => this.mapTaskToDto(task)),
    };
  }

  @Get(':estateId/tasks/recommended')
  @ApiOperation({ summary: 'Get recommended tasks to work on' })
  @ApiParam({ name: 'estateId', description: 'Estate ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recommended tasks retrieved',
    type: RecommendedTasksResponseDto,
  })
  async getRecommendedTasks(
    @Request() req,
    @Param('estateId') estateId: string,
  ): Promise<RecommendedTasksResponseDto> {
    const userId = req.user.id;
    const roadmap = await this.roadmapService.getUserRoadmap(userId, estateId);

    const tasks = await this.roadmapService.getRecommendedTasks(roadmap.roadmap.id);

    return {
      tasks: tasks.map((task) => this.mapTaskToDto(task)),
      priorityTaskCount: tasks.filter((t) => t.dependsOn.length > 0).length,
    };
  }

  @Post(':roadmapId/tasks/:taskId/start')
  @ApiOperation({ summary: 'Start working on a task' })
  @ApiParam({ name: 'roadmapId', description: 'Roadmap ID' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Task started successfully',
  })
  async startTask(
    @Request() req,
    @Param('roadmapId') roadmapId: string,
    @Param('taskId') taskId: string,
    @Body() dto: StartTaskRequestDto,
  ) {
    const userId = req.user.id;
    const task = await this.roadmapService.startTask(roadmapId, taskId, userId);

    return {
      message: 'Task started successfully',
      task: this.mapTaskToDto(task),
    };
  }

  @Post(':roadmapId/tasks/:taskId/complete')
  @ApiOperation({ summary: 'Complete a task' })
  @ApiParam({ name: 'roadmapId', description: 'Roadmap ID' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Task completed successfully',
    type: TaskCompletionResponseDto,
  })
  async completeTask(
    @Request() req,
    @Param('roadmapId') roadmapId: string,
    @Param('taskId') taskId: string,
    @Body() dto: CompleteTaskRequestDto,
  ): Promise<TaskCompletionResponseDto> {
    const userId = req.user.id;
    const result = await this.roadmapService.completeTask(roadmapId, taskId, userId, dto.notes);

    return {
      completedTask: this.mapTaskToDto(result.completedTask),
      unlockedTasks: result.unlockedTasks.map((task) => this.mapTaskToDto(task)),
      phaseChanged: result.phaseChanged,
      newPhase: result.newPhase,
    };
  }

  @Post(':roadmapId/tasks/:taskId/skip')
  @ApiOperation({ summary: 'Skip a task' })
  @ApiParam({ name: 'roadmapId', description: 'Roadmap ID' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Task skipped successfully',
  })
  async skipTask(
    @Request() req,
    @Param('roadmapId') roadmapId: string,
    @Param('taskId') taskId: string,
    @Body() dto: SkipTaskRequestDto,
  ) {
    const userId = req.user.id;
    const task = await this.roadmapService.skipTask(roadmapId, taskId, userId, dto.reason);

    return {
      message: 'Task skipped successfully',
      task: this.mapTaskToDto(task),
    };
  }

  private mapTaskToDto(task: any): any {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      category: task.category,
      phase: task.phase,
      orderIndex: task.orderIndex,
      dependsOnTaskIds: task.dependsOnTaskIds,
      whatIsIt: task.whatIsIt,
      whyNeeded: task.whyNeeded,
      howToGet: task.howToGet,
      estimatedDays: task.estimatedDays,
      completedAt: task.completedAt,
      notes: task.notes,
    };
  }
}
