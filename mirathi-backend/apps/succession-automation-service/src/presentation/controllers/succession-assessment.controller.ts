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
} from '../dtos/assessment.dtos';

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

    // Note: Use public methods from Service to get computed values
    const quickAssessment = await this.assessmentService.getQuickAssessment(userId, dto.estateId);

    // Fix: Access properties via toJSON() as the Entity does not expose getters for userId/estateId
    const assessmentProps = result.assessment.toJSON();

    return {
      id: assessmentProps.id,
      userId: assessmentProps.userId,
      estateId: assessmentProps.estateId,
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
      risks: result.risks.map((risk) => {
        const rData = risk.toJSON();
        return {
          id: rData.id,
          severity: rData.severity,
          category: rData.category,
          title: rData.title,
          description: rData.description,
          legalBasis: rData.legalBasis,
          isResolved: rData.isResolved,
          resolutionSteps: rData.resolutionSteps,
          isBlocking: rData.isBlocking,
        };
      }),
      nextStep: quickAssessment.nextStep,
      estimatedDays: quickAssessment.estimatedDays,
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
    return this.assessmentService.getQuickAssessment(userId, estateId);
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
    // Re-use logic to ensure we map correctly using toJSON()
    return this.createOrUpdateAssessment(req, { estateId });
  }

  @Put('assessments/:assessmentId/risks/:riskId/resolve')
  @ApiOperation({ summary: 'Resolve a risk flag' })
  @ApiParam({ name: 'assessmentId', description: 'Assessment ID' })
  @ApiParam({ name: 'riskId', description: 'Risk flag ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Risk resolved successfully',
  })
  async resolveRisk(
    @Param('assessmentId') assessmentId: string,
    @Param('riskId') riskId: string,
    @Body() dto: ResolveRiskRequestDto,
  ) {
    const risk = await this.assessmentService.resolveRisk(assessmentId, riskId);

    return {
      message: 'Risk resolved',
      risk: risk.toJSON(),
      notes: dto.resolutionNotes,
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
