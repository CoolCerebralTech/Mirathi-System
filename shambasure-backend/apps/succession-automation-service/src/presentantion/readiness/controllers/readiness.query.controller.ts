import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@shamba/auth';

import { FilterRisksQuery } from '../../../application/readiness/queries/impl/filter-risks.query';
// Queries
import { GetAssessmentDashboardQuery } from '../../../application/readiness/queries/impl/get-assessment-dashboard.query';
import { GetDocumentChecklistQuery } from '../../../application/readiness/queries/impl/get-document-checklist.query';
import { GetStrategyRoadmapQuery } from '../../../application/readiness/queries/impl/get-strategy-roadmap.query';
import { SimulateScoreQuery } from '../../../application/readiness/queries/impl/simulate-score.query';
import { RiskCategory, RiskSeverity, RiskStatus } from '../../../domain/entities/risk-flag.entity';
// Request DTOs (for Queries with Body or Complex Filters)
import { SimulateScoreRequestDto } from '../dtos/request/simulate-score.request.dto';
import { FilingChecklistResponseDto } from '../dtos/response/filing-checklist.response.dto';
// Response DTOs
import { ReadinessDashboardResponseDto } from '../dtos/response/readiness-dashboard.response.dto';
import { RiskDetailResponseDto } from '../dtos/response/risk-detail.response.dto';
import { SimulationResultResponseDto } from '../dtos/response/simulation-result.response.dto';
import { StrategyRoadmapResponseDto } from '../dtos/response/strategy-roadmap.response.dto';
// Mapper
import { ReadinessPresenterMapper } from '../mappers/readiness-presenter.mapper';

@ApiTags('Readiness Assessment (Queries)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('readiness')
export class ReadinessQueryController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get main readiness dashboard by Estate ID' })
  @ApiResponse({ type: ReadinessDashboardResponseDto })
  @ApiQuery({ name: 'estateId', required: true, type: String })
  async getDashboardByEstate(@Query('estateId', ParseUUIDPipe) estateId: string) {
    const query = new GetAssessmentDashboardQuery({ estateId });
    const vm = await this.queryBus.execute(query);
    return ReadinessPresenterMapper.toDashboardResponse(vm);
  }

  @Get(':id/dashboard')
  @ApiOperation({ summary: 'Get main readiness dashboard by Assessment ID' })
  @ApiResponse({ type: ReadinessDashboardResponseDto })
  async getDashboardById(@Param('id', ParseUUIDPipe) id: string) {
    const query = new GetAssessmentDashboardQuery({ assessmentId: id });
    const vm = await this.queryBus.execute(query);
    return ReadinessPresenterMapper.toDashboardResponse(vm);
  }

  @Get(':id/strategy')
  @ApiOperation({ summary: 'Get generated legal strategy and milestones' })
  @ApiResponse({ type: StrategyRoadmapResponseDto })
  async getStrategy(@Param('id', ParseUUIDPipe) id: string) {
    const query = new GetStrategyRoadmapQuery({ assessmentId: id });
    const vm = await this.queryBus.execute(query);
    return ReadinessPresenterMapper.toStrategyResponse(vm);
  }

  @Get(':id/checklist')
  @ApiOperation({ summary: 'Get document filing checklist' })
  @ApiResponse({ type: FilingChecklistResponseDto })
  async getChecklist(@Param('id', ParseUUIDPipe) id: string) {
    const query = new GetDocumentChecklistQuery({ assessmentId: id });
    const vm = await this.queryBus.execute(query);
    return ReadinessPresenterMapper.toChecklistResponse(vm);
  }

  @Get(':id/risks')
  @ApiOperation({ summary: 'Get filtered list of risks (Compliance Register)' })
  @ApiResponse({ type: [RiskDetailResponseDto] })
  @ApiQuery({ name: 'severity', enum: RiskSeverity, required: false })
  @ApiQuery({ name: 'category', enum: RiskCategory, required: false })
  @ApiQuery({ name: 'status', enum: RiskStatus, required: false })
  @ApiQuery({ name: 'isBlocking', type: Boolean, required: false })
  @ApiQuery({ name: 'includeResolved', type: Boolean, required: false })
  async getRisks(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('severity') severity?: RiskSeverity,
    @Query('category') category?: RiskCategory,
    @Query('status') status?: RiskStatus,
    @Query('isBlocking') isBlocking?: boolean,
    @Query('includeResolved') includeResolved?: boolean,
  ) {
    // Note: Query params are strings, transformation handled here or in pipe
    const query = new FilterRisksQuery({
      assessmentId: id,
      severity,
      category,
      status,
      isBlocking: isBlocking ? String(isBlocking) === 'true' : undefined,
      includeResolved: includeResolved ? String(includeResolved) === 'true' : undefined,
    });

    const vms = await this.queryBus.execute(query);
    return ReadinessPresenterMapper.toRiskDetailListResponse(vms);
  }

  @Post(':id/simulate')
  @ApiOperation({ summary: 'Run a "What-If" analysis on score improvement' })
  @ApiResponse({ type: SimulationResultResponseDto })
  async simulateScore(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SimulateScoreRequestDto,
  ) {
    const query = new SimulateScoreQuery({
      assessmentId: id,
      risksToResolve: dto.risksToResolve,
    });

    const vm = await this.queryBus.execute(query);
    return ReadinessPresenterMapper.toSimulationResponse(vm);
  }
}
