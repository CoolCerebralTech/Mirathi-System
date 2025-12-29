import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser, JwtAuthGuard, type JwtPayload } from '@shamba/auth';

import { AcknowledgeWarningCommand } from '../../../application/readiness/commands/impl/acknowledge-warning.command';
import { CompleteAssessmentCommand } from '../../../application/readiness/commands/impl/complete-assessment.command';
import { DisputeRiskCommand } from '../../../application/readiness/commands/impl/dispute-risk.command';
import { ForceRecalculationCommand } from '../../../application/readiness/commands/impl/force-recalculation.command';
// Commands
import { InitializeAssessmentCommand } from '../../../application/readiness/commands/impl/initialize-assessment.command';
import { OverrideStrategyCommand } from '../../../application/readiness/commands/impl/override-strategy.command';
import { ResolveRiskManuallyCommand } from '../../../application/readiness/commands/impl/resolve-risk-manually.command';
import { UpdateContextCommand } from '../../../application/readiness/commands/impl/update-context.command';
import { UpdateRiskMitigationCommand } from '../../../application/readiness/commands/impl/update-risk-mitigation.command';
import { AcknowledgeWarningRequestDto } from '../dtos/request/acknowledge-warning.request.dto';
import { CompleteAssessmentRequestDto } from '../dtos/request/complete-assessment.request.dto';
import { DisputeRiskRequestDto } from '../dtos/request/dispute-risk.request.dto';
import { ForceRecalculationRequestDto } from '../dtos/request/force-recalculation.request.dto';
// DTOs
import { InitializeAssessmentRequestDto } from '../dtos/request/initialize-assessment.request.dto';
import { OverrideStrategyRequestDto } from '../dtos/request/override-strategy.request.dto';
import { ResolveRiskRequestDto } from '../dtos/request/resolve-risk.request.dto';
import { UpdateContextRequestDto } from '../dtos/request/update-context.request.dto';
import { UpdateMitigationRequestDto } from '../dtos/request/update-mitigation.request.dto';

@ApiTags('Readiness Assessment (Commands)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('readiness')
export class ReadinessCommandController {
  constructor(private readonly commandBus: CommandBus) {}

  // ==================== LIFECYCLE ====================

  @Post()
  @ApiOperation({ summary: 'Initialize readiness assessment for an Estate' })
  @ApiResponse({ status: 201, description: 'Assessment created successfully' })
  async initialize(@Body() dto: InitializeAssessmentRequestDto) {
    // Map Request DTO to Application DTO
    const command = new InitializeAssessmentCommand({
      estateId: dto.estateId,
      familyId: dto.familyId,
    });

    const result = await this.commandBus.execute(command);
    if (result.isFailure) throw new BadRequestException(result.error?.message);

    return { id: result.getValue() };
  }

  @Post(':id/recalculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Force a full recalculation based on latest Estate/Family data' })
  async recalculate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ForceRecalculationRequestDto,
  ) {
    const command = new ForceRecalculationCommand({
      assessmentId: id,
      triggerReason: dto.triggerReason,
    });

    const result = await this.commandBus.execute(command);
    if (result.isFailure) throw new BadRequestException(result.error?.message);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Lock assessment and mark as Ready to File' })
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteAssessmentRequestDto,
  ) {
    if (!dto.confirm) throw new BadRequestException('Confirmation required');

    const command = new CompleteAssessmentCommand({ assessmentId: id });
    const result = await this.commandBus.execute(command);
    if (result.isFailure) throw new BadRequestException(result.error?.message);
  }

  // ==================== RISK MANAGEMENT ====================

  @Patch(':id/risks/:riskId/resolve')
  @ApiOperation({ summary: 'Manually resolve a specific risk with justification' })
  async resolveRisk(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('riskId', ParseUUIDPipe) riskId: string,
    @Body() dto: ResolveRiskRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new ResolveRiskManuallyCommand(
      { assessmentId: id, riskId, resolutionNotes: dto.resolutionNotes },
      user.sub,
    );

    const result = await this.commandBus.execute(command);
    if (result.isFailure) throw new BadRequestException(result.error?.message);
  }

  @Patch(':id/risks/:riskId/dispute')
  @ApiOperation({ summary: 'Dispute a risk flag (e.g. incorrect legal application)' })
  async disputeRisk(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('riskId', ParseUUIDPipe) riskId: string,
    @Body() dto: DisputeRiskRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new DisputeRiskCommand(
      { assessmentId: id, riskId, reason: dto.reason },
      user.sub,
    );

    const result = await this.commandBus.execute(command);
    if (result.isFailure) throw new BadRequestException(result.error?.message);
  }

  @Patch(':id/risks/:riskId/acknowledge')
  @ApiOperation({ summary: 'Acknowledge a warning (non-blocking risk)' })
  async acknowledgeWarning(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('riskId', ParseUUIDPipe) riskId: string,
    @Body() dto: AcknowledgeWarningRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new AcknowledgeWarningCommand(
      { assessmentId: id, riskId, notes: dto.notes },
      user.sub,
    );

    const result = await this.commandBus.execute(command);
    if (result.isFailure) throw new BadRequestException(result.error?.message);
  }

  @Post(':id/risks/:riskId/mitigation')
  @ApiOperation({ summary: 'Log a mitigation step/progress without full resolution' })
  async updateMitigation(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('riskId', ParseUUIDPipe) riskId: string,
    @Body() dto: UpdateMitigationRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new UpdateRiskMitigationCommand(
      {
        assessmentId: id,
        riskId,
        actionTaken: dto.actionTaken,
        followUpDate: dto.followUpDate,
      },
      user.sub,
    );

    const result = await this.commandBus.execute(command);
    if (result.isFailure) throw new BadRequestException(result.error?.message);
  }

  // ==================== CONTEXT & STRATEGY ====================

  @Put(':id/context')
  @ApiOperation({ summary: 'Update the legal context (Regime, Religion, Marriage)' })
  async updateContext(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContextRequestDto,
  ) {
    const command = new UpdateContextCommand({
      assessmentId: id,
      ...dto,
    });

    const result = await this.commandBus.execute(command);
    if (result.isFailure) throw new BadRequestException(result.error?.message);
  }

  @Put(':id/strategy')
  @ApiOperation({ summary: 'Admin override for the generated legal strategy' })
  async overrideStrategy(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OverrideStrategyRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new OverrideStrategyCommand(
      {
        assessmentId: id,
        newStrategy: dto.newStrategy,
        reasonForOverride: dto.reasonForOverride,
      },
      user.sub,
    );

    const result = await this.commandBus.execute(command);
    if (result.isFailure) throw new BadRequestException(result.error?.message);
  }
}
