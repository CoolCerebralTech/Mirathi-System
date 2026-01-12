// apps/succession-automation-service/src/presentation/controllers/succession-assessment.controller.ts
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

import { SuccessionAssessmentService } from '../../application/services/succession-assessment.service';
import {
  QuickAssessmentResponseDto,
  ResolveRiskRequestDto,
  SuccessionAssessmentRequestDto,
  SuccessionAssessmentResponseDto,
} from '../dtos';

@ApiTags('Succession Assessments')
@ApiBearerAuth()
@Controller('succession/assessments')
@UseGuards(JwtAuthGuard)
export class SuccessionAssessmentController {
  constructor(private readonly assessmentService: SuccessionAssessmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create or update a succession assessment' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Assessment created successfully',
    type: SuccessionAssessmentResponseDto,
  })
  async createOrUpdateAssessment(
    @Request() req,
    @Body() dto: SuccessionAssessmentRequestDto,
  ): Promise<SuccessionAssessmentResponseDto> {
    const userId = req.user.id;
    const result = await this.assessmentService.assessSuccession(userId, dto.estateId);

    return {
      id: result.assessment.id,
      userId: result.assessment.userId,
      estateId: result.assessment.estateId,
      regime: result.context.regime,
      targetCourt: result.context.targetCourt,
      isComplexCase: result.context.isComplexCase(),
      score: {
        overall: result.score.overall,
        document: result.score.document,
        legal: result.score.legal,
        family: result.score.family,
        financial: result.score.financial,
        status: result.score.status,
        canGenerateForms: result.score.canGenerateForms(),
      },
      risks: result.risks.map((risk) => ({
        id: risk.id,
        severity: risk.severity,
        category: risk.category,
        title: risk.title,
        description: risk.description,
        legalBasis: risk.legalBasis,
        isResolved: risk.isResolved,
        resolutionSteps: risk.resolutionSteps,
        isBlocking: risk.isBlocking,
      })),
      nextStep: this.assessmentService.getNextStep(result.risks, result.context),
      estimatedDays: this.assessmentService.estimateTimeline(result.context),
      criticalRisksCount: result.risks.filter((r) => r.severity === 'CRITICAL').length,
      totalRisksCount: result.risks.length,
    };
  }

  @Get('quick/:estateId')
  @ApiOperation({ summary: 'Get quick assessment for dashboard' })
  @ApiParam({ name: 'estateId', description: 'Estate ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quick assessment retrieved',
    type: QuickAssessmentResponseDto,
  })
  async getQuickAssessment(
    @Request() req,
    @Param('estateId') estateId: string,
  ): Promise<QuickAssessmentResponseDto> {
    const userId = req.user.id;
    const result = await this.assessmentService.getQuickAssessment(userId, estateId);

    return {
      score: result.score,
      status: result.status,
      nextStep: result.nextStep,
      criticalRisks: result.criticalRisks,
      estimatedDays: result.estimatedDays,
    };
  }

  @Get(':estateId')
  @ApiOperation({ summary: 'Get detailed assessment for an estate' })
  @ApiParam({ name: 'estateId', description: 'Estate ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assessment retrieved',
    type: SuccessionAssessmentResponseDto,
  })
  async getAssessment(
    @Request() req,
    @Param('estateId') estateId: string,
  ): Promise<SuccessionAssessmentResponseDto> {
    const userId = req.user.id;
    const result = await this.assessmentService.assessSuccession(userId, estateId);

    return {
      id: result.assessment.id,
      userId: result.assessment.userId,
      estateId: result.assessment.estateId,
      regime: result.context.regime,
      targetCourt: result.context.targetCourt,
      isComplexCase: result.context.isComplexCase(),
      score: {
        overall: result.score.overall,
        document: result.score.document,
        legal: result.score.legal,
        family: result.score.family,
        financial: result.score.financial,
        status: result.score.status,
        canGenerateForms: result.score.canGenerateForms(),
      },
      risks: result.risks.map((risk) => ({
        id: risk.id,
        severity: risk.severity,
        category: risk.category,
        title: risk.title,
        description: risk.description,
        legalBasis: risk.legalBasis,
        isResolved: risk.isResolved,
        resolutionSteps: risk.resolutionSteps,
        isBlocking: risk.isBlocking,
      })),
      nextStep: this.assessmentService.getNextStep(result.risks, result.context),
      estimatedDays: this.assessmentService.estimateTimeline(result.context),
      criticalRisksCount: result.risks.filter((r) => r.severity === 'CRITICAL').length,
      totalRisksCount: result.risks.length,
    };
  }

  @Put('risks/:riskId/resolve')
  @ApiOperation({ summary: 'Resolve a risk flag' })
  @ApiParam({ name: 'riskId', description: 'Risk flag ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Risk resolved successfully',
  })
  async resolveRisk(@Param('riskId') riskId: string, @Body() dto: ResolveRiskRequestDto) {
    // Note: We need assessmentId to resolve risk
    // This is a simplified version
    // In reality, we need to pass assessmentId or find it from riskId
    // For MVP, we'll assume riskId is enough
    return {
      message: 'Risk resolution endpoint needs assessment context',
      riskId,
      resolutionNotes: dto.resolutionNotes,
    };
  }

  @Get(':estateId/asset-summary')
  @ApiOperation({ summary: 'Get asset summary for an estate' })
  @ApiParam({ name: 'estateId', description: 'Estate ID' })
  async getAssetSummary(@Param('estateId') estateId: string) {
    const summary = await this.assessmentService.getAssetSummary(estateId);

    return {
      grossValue: summary.grossValue,
      netValue: summary.netValue,
      totalDebts: summary.totalDebts,
      isInsolvent: summary.isInsolvent,
      estimatedCourtFees: summary.estimatedCourtFees,
      assetRisks: summary.getAssetRisks(),
      hasLand: summary.hasLand(),
      hasShares: summary.hasShares(),
      hasEncumberedAssets: summary.hasEncumberedAssets(),
    };
  }

  @Get(':estateId/legal-requirements')
  @ApiOperation({ summary: 'Get legal requirements for succession regime' })
  @ApiParam({ name: 'estateId', description: 'Estate ID' })
  async getLegalRequirements(@Request() req, @Param('estateId') estateId: string) {
    const userId = req.user.id;
    const result = await this.assessmentService.assessSuccession(userId, estateId);

    const requirements = this.assessmentService.getLegalRequirements(result.context);

    return requirements.map((req) => ({
      name: req.name,
      description: req.description,
      legalBasis: req.legalBasis,
      category: req.category,
      severity: req.severity,
      isMandatoryForFiling: req.isMandatoryForFiling,
      isRegistryBlocker: req.isRegistryBlocker(),
    }));
  }
}
