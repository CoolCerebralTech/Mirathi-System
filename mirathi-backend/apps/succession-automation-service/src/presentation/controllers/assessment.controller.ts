import { Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@shamba/auth';

import { AssessmentService } from '../../application/services/assessment.service';
import { ReadinessAssessmentResponseDto } from '../dtos/assessment.dto';

@ApiTags('Succession - Readiness Assessment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('succession/estates/:estateId/assessment')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post('analyze')
  @ApiOperation({ summary: 'Run (or re-run) the readiness analysis' })
  @ApiResponse({ status: 201, type: ReadinessAssessmentResponseDto })
  async analyzeReadiness(
    @Param('estateId', ParseUUIDPipe) estateId: string,
    @Req() req: any,
  ): Promise<ReadinessAssessmentResponseDto> {
    const userId = req.user.id; // Extracted from JWT

    const entity = await this.assessmentService.analyzeReadiness(userId, estateId);

    // Map Entity to DTO
    return {
      id: entity.id,
      status: entity.status,
      scores: {
        overall: entity.overallScore,
        document: (entity as any).props.documentScore, // Accessing props for DTO mapping
        legal: (entity as any).props.legalScore,
        family: (entity as any).props.familyScore,
        financial: (entity as any).props.financialScore,
      },
      totalRisks: entity.props.totalRisks,
      risks: [], // Risks are usually fetched via separate endpoint or service returns tuple
      nextSteps: entity.props.nextSteps,
      lastCheckedAt: entity.props.lastCheckedAt,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get the current assessment status' })
  @ApiResponse({ status: 200, type: ReadinessAssessmentResponseDto })
  async getAssessment(
    @Param('estateId', ParseUUIDPipe) estateId: string,
  ): Promise<ReadinessAssessmentResponseDto> {
    const entity = await this.assessmentService.getAssessment(estateId);

    // In a real app, use a dedicated Mapper class
    return {
      id: entity.id,
      status: entity.status,
      scores: {
        overall: entity.overallScore,
        document: (entity as any).props.documentScore,
        legal: (entity as any).props.legalScore,
        family: (entity as any).props.familyScore,
        financial: (entity as any).props.financialScore,
      },
      totalRisks: entity.props.totalRisks,
      risks: [],
      nextSteps: entity.props.nextSteps,
      lastCheckedAt: entity.props.lastCheckedAt,
    };
  }

  @Get('risks')
  @ApiOperation({ summary: 'Get detailed risk analysis' })
  async getRisks(@Param('estateId', ParseUUIDPipe) estateId: string) {
    const risks = await this.assessmentService.getRisks(estateId);
    return risks.map((r) => r.toJSON());
  }
}
