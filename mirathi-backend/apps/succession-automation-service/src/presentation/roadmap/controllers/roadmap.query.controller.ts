// src/succession-automation/src/presentation/roadmap/controllers/roadmap.query.controller.ts
import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';

// Auth
import { JwtAuthGuard } from '@shamba/auth';

import { Result } from '../../../application/common/result';
// Application Queries
import {
  GetCriticalPathQuery,
  GetRoadmapAnalyticsQuery,
  GetRoadmapDashboardQuery,
} from '../../../application/roadmap/queries/impl/dashboard.queries';
import {
  GetTaskDetailsQuery,
  GetTaskHistoryQuery,
  GetTaskListQuery,
} from '../../../application/roadmap/queries/impl/task.queries';
// Request DTOs (Filters)
import { TaskFilterRequestDto } from '../dtos/request/task-filter.request.dto';
import { RoadmapAnalyticsResponseDto } from '../dtos/response/roadmap-analytics.response.dto';
// Response DTOs
import { RoadmapDashboardResponseDto } from '../dtos/response/roadmap-dashboard.response.dto';
import { TaskDetailResponseDto } from '../dtos/response/task-detail.response.dto';
import {
  TaskListResponseDto,
  TaskSummaryResponseDto,
} from '../dtos/response/task-list.response.dto';
// Mappers
import { RoadmapPresenterMapper } from '../mappers/roadmap-presenter.mapper';

@ApiTags('Succession Roadmap [Read]')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('roadmaps')
export class RoadmapQueryController {
  constructor(private readonly queryBus: QueryBus) {}

  // ==================== DASHBOARD & INSIGHTS ====================

  @Get(':id/dashboard')
  @ApiOperation({ summary: 'Get the main Executor Dashboard view' })
  @ApiResponse({ status: 200, type: RoadmapDashboardResponseDto })
  async getDashboard(@Param('id') id: string) {
    const traceId = uuidv4();
    const query = new GetRoadmapDashboardQuery({ roadmapId: id }, traceId);

    const result = await this.queryBus.execute(query);
    if (result.isFailure) this.handleError(result);

    return RoadmapPresenterMapper.toDashboardResponse(result.getValue());
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get detailed time and cost analytics' })
  @ApiResponse({ status: 200, type: RoadmapAnalyticsResponseDto })
  async getAnalytics(@Param('id') id: string) {
    const traceId = uuidv4();
    const query = new GetRoadmapAnalyticsQuery({ roadmapId: id }, traceId);

    const result = await this.queryBus.execute(query);
    if (result.isFailure) this.handleError(result);

    return RoadmapPresenterMapper.toAnalyticsResponse(result.getValue());
  }

  @Get(':id/critical-path')
  @ApiOperation({ summary: 'Get the sequence of tasks blocking completion' })
  @ApiResponse({ status: 200, type: [TaskSummaryResponseDto] })
  async getCriticalPath(@Param('id') id: string) {
    const traceId = uuidv4();
    const query = new GetCriticalPathQuery({ roadmapId: id }, traceId);

    const result = await this.queryBus.execute(query);
    if (result.isFailure) this.handleError(result);

    return RoadmapPresenterMapper.toCriticalPathResponse(result.getValue());
  }

  // ==================== TASK MANAGEMENT ====================

  @Get(':id/tasks')
  @ApiOperation({ summary: 'Get paginated and filtered list of tasks' })
  @ApiResponse({ status: 200, type: TaskListResponseDto })
  async getTasks(@Param('id') id: string, @Query() filters: TaskFilterRequestDto) {
    const traceId = uuidv4();

    // Map Query Params to Application DTO
    const query = new GetTaskListQuery(
      {
        roadmapId: id,
        ...filters,
      },
      traceId,
    );

    const result = await this.queryBus.execute(query);
    if (result.isFailure) this.handleError(result);

    return RoadmapPresenterMapper.toTaskListResponse(result.getValue());
  }

  @Get(':id/tasks/:taskId')
  @ApiOperation({ summary: 'Get rich details for a specific task' })
  @ApiResponse({ status: 200, type: TaskDetailResponseDto })
  async getTaskDetails(@Param('id') id: string, @Param('taskId') taskId: string) {
    const traceId = uuidv4();
    const query = new GetTaskDetailsQuery({ roadmapId: id, taskId }, traceId);

    const result = await this.queryBus.execute(query);
    if (result.isFailure) this.handleError(result);

    return RoadmapPresenterMapper.toTaskDetailResponse(result.getValue());
  }

  @Get(':id/tasks/:taskId/history')
  @ApiOperation({ summary: 'Get audit history for a task' })
  async getTaskHistory(@Param('id') id: string, @Param('taskId') taskId: string) {
    const traceId = uuidv4();
    const query = new GetTaskHistoryQuery({ roadmapId: id, taskId }, traceId);

    const result = await this.queryBus.execute(query);
    if (result.isFailure) this.handleError(result);

    return result.getValue(); // Raw array (History is simple structure)
  }

  // ==================== HELPER ====================

  private handleError(result: Result<any>) {
    const errorMessage = result.error?.message || 'Unknown error';

    if (errorMessage.includes('not found')) {
      throw new HttpException(errorMessage, HttpStatus.NOT_FOUND);
    } else {
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    }
  }
}
