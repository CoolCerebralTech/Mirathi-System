import { Body, Controller, Get, HttpStatus, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoadmapPhase } from '@prisma/client';

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
} from '../dtos/roadmap.dtos';

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

    const roadmapData = result.roadmap.toJSON();

    return {
      id: roadmapData.id,
      userId: roadmapData.userId,
      estateId: roadmapData.estateId,
      currentPhase: roadmapData.currentPhase,
      overallProgress: roadmapData.overallProgress,
      totalTasks: roadmapData.totalTasks,
      completedTasks: roadmapData.completedTasks,
      availableTasks: roadmapData.availableTasks,
      lockedTasks: roadmapData.lockedTasks,
      startedAt: roadmapData.startedAt,
      tasks: result.tasks.map((task) => this.mapTaskToDto(task)),
      currentPhaseTasks: result.currentPhaseTasks.map((task) => this.mapTaskToDto(task)),
      nextPhase: result.nextPhase,
      estimatedDays: roadmapData.estimatedDays,
      estimatedCompletion: roadmapData.estimatedCompletion,
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
    const result = await this.roadmapService.getUserRoadmap(userId, estateId);

    const overview = await this.roadmapService.getPhaseOverview(
      result.roadmap.id,
      phase as RoadmapPhase,
    );

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
    const result = await this.roadmapService.getUserRoadmap(userId, estateId);

    const tasks = await this.roadmapService.getRecommendedTasks(result.roadmap.id);

    return {
      tasks: tasks.map((task) => this.mapTaskToDto(task)),
      // Check dependencies on JSON object or check 'dependsOn' getter if exists
      priorityTaskCount: tasks.filter((t) => t.dependsOn.length > 0).length,
    };
  }

  @Post(':roadmapId/tasks/:taskId/start')
  @ApiOperation({ summary: 'Start working on a task' })
  async startTask(
    @Request() req,
    @Param('roadmapId') roadmapId: string,
    @Param('taskId') taskId: string,
    @Body() _dto: StartTaskRequestDto,
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
    // If it's a domain entity, convert to JSON/Props first
    const data = typeof task.toJSON === 'function' ? task.toJSON() : task;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      status: data.status,
      category: data.category,
      phase: data.phase,
      orderIndex: data.orderIndex,
      dependsOnTaskIds: data.dependsOnTaskIds,
      whatIsIt: data.whatIsIt,
      whyNeeded: data.whyNeeded,
      howToGet: data.howToGet,
      estimatedDays: data.estimatedDays,
      completedAt: data.completedAt,
      notes: data.notes,
    };
  }
}
