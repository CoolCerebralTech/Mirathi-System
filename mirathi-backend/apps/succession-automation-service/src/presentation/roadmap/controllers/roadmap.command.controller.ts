// src/succession-automation/src/presentation/roadmap/controllers/roadmap.command.controller.ts
import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';

// Auth
import { CurrentUser, JwtAuthGuard, type JwtPayload } from '@shamba/auth';

// Shared Result
import { Result } from '../../../application/common/result';
// Application Commands
import { GenerateRoadmapCommand } from '../../../application/roadmap/commands/impl/generate-roadmap.command';
import { OptimizeRoadmapCommand } from '../../../application/roadmap/commands/impl/optimization.commands';
import { TransitionPhaseCommand } from '../../../application/roadmap/commands/impl/phase.commands';
import { LinkRiskToTaskCommand } from '../../../application/roadmap/commands/impl/risk.commands';
import {
  SkipTaskCommand,
  StartTaskCommand,
  SubmitTaskProofCommand,
} from '../../../application/roadmap/commands/impl/task-execution.commands';
// Request DTOs
import {
  GenerateRoadmapRequestDto,
  OptimizeRoadmapRequestDto,
} from '../dtos/request/lifecycle.request.dto';
import { TransitionPhaseRequestDto } from '../dtos/request/phase-management.request.dto';
import { LinkRiskRequestDto } from '../dtos/request/risk-integration.request.dto';
import {
  SkipTaskRequestDto,
  SubmitTaskProofRequestDto,
} from '../dtos/request/task-execution.request.dto';

@ApiTags('Succession Roadmap [Write]')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('succession/roadmaps')
export class RoadmapCommandController {
  constructor(private readonly commandBus: CommandBus) {}

  // ==================== LIFECYCLE ====================

  @Post()
  @ApiOperation({ summary: 'Generate a new Roadmap based on Readiness Assessment' })
  @ApiResponse({ status: 201, description: 'Roadmap generated successfully', type: String })
  async generateRoadmap(@Body() dto: GenerateRoadmapRequestDto, @CurrentUser() user: JwtPayload) {
    const traceId = uuidv4();

    // Merge Auth User ID into Application DTO
    const command = new GenerateRoadmapCommand(
      {
        ...dto,
        userId: user.sub, // Enforce current user ownership
      },
      traceId,
    );

    const result: Result<string> = await this.commandBus.execute(command);
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @Post(':id/optimize')
  @ApiOperation({ summary: 'Trigger AI Optimization for dates and critical path' })
  async optimizeRoadmap(
    @Param('id') id: string,
    @Body() dto: OptimizeRoadmapRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const traceId = uuidv4();
    const command = new OptimizeRoadmapCommand(
      {
        roadmapId: id,
        userId: user.sub,
        optimizationFocus: dto.optimizationFocus,
      },
      traceId,
    );

    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  // ==================== TASK EXECUTION ====================

  @Post(':id/tasks/:taskId/start')
  @ApiOperation({ summary: 'Mark a task as Started (In Progress)' })
  async startTask(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const traceId = uuidv4();
    const command = new StartTaskCommand(
      {
        roadmapId: id,
        taskId: taskId,
        userId: user.sub,
      },
      traceId,
    );

    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Post(':id/tasks/:taskId/proof')
  @ApiOperation({ summary: 'Submit proof and complete a task' })
  async submitTaskProof(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() dto: SubmitTaskProofRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const traceId = uuidv4();
    const command = new SubmitTaskProofCommand(
      {
        roadmapId: id,
        taskId: taskId,
        userId: user.sub,
        proofType: dto.proofType,
        documentId: dto.documentId,
        transactionReference: dto.transactionReference,
        additionalMetadata: dto.additionalMetadata,
        notes: dto.notes,
      },
      traceId,
    );

    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Post(':id/tasks/:taskId/skip')
  @ApiOperation({ summary: 'Skip a task (requires valid reason)' })
  async skipTask(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() dto: SkipTaskRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const traceId = uuidv4();
    const command = new SkipTaskCommand(
      {
        roadmapId: id,
        taskId: taskId,
        userId: user.sub,
        reason: dto.reason,
      },
      traceId,
    );

    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  // ==================== PHASE & RISK ====================

  @Patch(':id/phase/transition')
  @ApiOperation({ summary: 'Transition to the next legal phase' })
  async transitionPhase(
    @Param('id') id: string,
    @Body() dto: TransitionPhaseRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const traceId = uuidv4();
    const command = new TransitionPhaseCommand(
      {
        roadmapId: id,
        userId: user.sub,
        currentPhase: dto.currentPhase,
      },
      traceId,
    );

    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  @Post(':id/risks/link')
  @ApiOperation({ summary: 'Link a Risk Flag to block specific tasks' })
  async linkRisk(@Param('id') id: string, @Body() dto: LinkRiskRequestDto) {
    const traceId = uuidv4();
    const command = new LinkRiskToTaskCommand(
      {
        roadmapId: id,
        riskId: dto.riskId,
        blockingTaskIds: dto.blockingTaskIds,
        reason: dto.reason,
      },
      traceId,
    );

    const result = await this.commandBus.execute(command);
    return this.handleResult(result);
  }

  // ==================== HELPER ====================

  private handleResult<T>(result: Result<T>, _successStatus: HttpStatus = HttpStatus.OK) {
    if (result.isSuccess) {
      // If result has a value (e.g. ID), return it, otherwise just status
      return result.getValue() ? result.getValue() : { status: 'success' };
    }

    const errorMessage = result.error?.message || 'Unknown error';

    // Simple error mapping - in production use an ExceptionFilter
    if (errorMessage.includes('not found')) {
      throw new HttpException(errorMessage, HttpStatus.NOT_FOUND);
    } else if (errorMessage.includes('already exists')) {
      throw new HttpException(errorMessage, HttpStatus.CONFLICT);
    } else if (errorMessage.includes('Invalid') || errorMessage.includes('mismatch')) {
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    } else {
      throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
