import { Controller, Get, Param, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@shamba/auth';

import { ProbateService } from '../../application/services/probate.service';
import {
  FormPreviewResponseDto,
  GetFormPreviewParamDto,
  ProbateDashboardDto,
} from '../dtos/probate.dto';

@ApiTags('Succession - Probate Forms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('succession/estates/:estateId/probate')
export class ProbateController {
  constructor(private readonly probateService: ProbateService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get the list of required court forms' })
  @ApiResponse({ status: 200, type: ProbateDashboardDto })
  async getDashboard(
    @Param('estateId', ParseUUIDPipe) estateId: string,
    @Req() req: any,
  ): Promise<ProbateDashboardDto> {
    const userId = req.user.sub;

    const result = await this.probateService.generatePreviewDashboard(userId, estateId);

    return {
      previewId: result.preview.id,
      canGenerate: result.canGenerate,
      requiredForms: result.forms,
      warnings: result.warnings,
    };
  }

  @Get('preview/:formType')
  @ApiOperation({ summary: 'Get the HTML preview of a specific form' })
  @ApiResponse({ status: 200, type: FormPreviewResponseDto })
  async getFormPreview(
    @Param('estateId', ParseUUIDPipe) estateId: string,
    @Param() params: GetFormPreviewParamDto, // Validates Enum
  ): Promise<FormPreviewResponseDto> {
    const result = await this.probateService.getFormHtml(estateId, params.formType);

    return {
      formType: result.formType,
      html: result.html,
      disclaimer: result.disclaimer,
      generatedAt: result.generatedAt,
    };
  }
}
