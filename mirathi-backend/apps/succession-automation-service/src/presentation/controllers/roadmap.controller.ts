import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@shamba/auth';

import { RoadmapService } from '../../application/services/roadmap.service';
import { CompleteTaskDto, RoadmapResponseDto } from '../dtos/roadmap.dto';

@ApiTags('Succession - Executor Roadmap')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('succession/estates/:estateId/roadmap')
export class RoadmapController {
  constructor(private readonly roadmapService: RoadmapService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate the step-by-step roadmap' })
  @ApiResponse({ status: 201, type: RoadmapResponseDto })
  async generateRoadmap(@Param('estateId', ParseUUIDPipe) estateId: string, @Req() req: any) {
    const userId = req.user.id;
    return this.roadmapService.generateRoadmap(userId, estateId);
  }

  @Patch('tasks/:taskId/complete')
  @ApiOperation({ summary: 'Mark a task as complete and unlock next steps' })
  async completeTask(
    @Param('estateId', ParseUUIDPipe) estateId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: CompleteTaskDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.roadmapService.completeTask(estateId, taskId, userId, dto.notes);
  }
}
