// apps/succession-automation-service/src/presentation/controllers/probate-forms.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@shamba/auth';

import { ProbateFormService } from '../../application/services/probate-form.service';
import {
  FormStatusResponseDto,
  ProbateFormsResponseDto,
  ValidateFormRequestDto,
  ValidationResultDto,
} from '../dtos';

@ApiTags('Probate Forms')
@ApiBearerAuth()
@Controller('succession/forms')
@UseGuards(JwtAuthGuard)
export class ProbateFormsController {
  constructor(private readonly formService: ProbateFormService) {}

  @Post(':estateId/generate')
  @ApiOperation({ summary: 'Generate probate forms for an estate' })
  @ApiParam({ name: 'estateId', description: 'Estate ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Forms generated successfully',
    type: ProbateFormsResponseDto,
  })
  async generateForms(
    @Request() req,
    @Param('estateId') estateId: string,
  ): Promise<ProbateFormsResponseDto> {
    const userId = req.user.id;
    const result = await this.formService.generateProbateForms(userId, estateId);

    return {
      previewId: result.preview.id,
      isComplete: result.isComplete,
      forms: result.forms.map((form) => ({
        formType: form.formType,
        title: form.title,
        code: form.code,
        htmlPreview: form.htmlPreview,
        purpose: form.purpose,
        instructions: form.instructions,
        missingFields: form.missingFields,
      })),
      missingRequirements: result.missingRequirements,
      totalForms: result.forms.length,
      completedForms: result.forms.filter((f) => f.missingFields.length === 0).length,
    };
  }

  @Get(':estateId/status')
  @ApiOperation({ summary: 'Get form generation status' })
  @ApiParam({ name: 'estateId', description: 'Estate ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Form status retrieved',
    type: FormStatusResponseDto,
  })
  async getFormStatus(@Param('estateId') estateId: string): Promise<FormStatusResponseDto> {
    const status = await this.formService.getFormStatus(estateId);

    return {
      isReady: status.isReady,
      requiredForms: status.requiredForms,
      completedForms: status.completedForms,
      missingForms: status.missingForms,
      missingFields: status.missingFields,
    };
  }

  @Get(':previewId/download')
  @ApiOperation({ summary: 'Download a generated form' })
  @ApiParam({ name: 'previewId', description: 'Form preview ID' })
  @ApiQuery({ name: 'formType', required: true, enum: KenyanFormType })
  @ApiQuery({ name: 'format', required: false, enum: ['html', 'pdf', 'doc'] })
  async downloadForm(
    @Param('previewId') previewId: string,
    @Query('formType') formType: KenyanFormType,
    @Query('format') format: 'html' | 'pdf' | 'doc' = 'html',
  ): Promise<StreamableFile> {
    const result = await this.formService.downloadForm(previewId, formType);

    // For MVP, return HTML content
    // In production, this would convert to PDF/DOC based on format parameter
    const buffer = Buffer.from(result.html, 'utf-8');

    return new StreamableFile(buffer, {
      type: 'text/html',
      disposition: `attachment; filename="${result.filename}"`,
    });
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate form data before submission' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Form validation result',
    type: ValidationResultDto,
  })
  async validateForm(@Body() dto: ValidateFormRequestDto): Promise<ValidationResultDto> {
    const result = this.formService.validateFormData(dto.formType, dto.formData);

    return {
      isValid: result.isValid,
      errors: result.errors,
      warnings: result.warnings,
    };
  }

  @Get(':estateId/forms')
  @ApiOperation({ summary: 'Get all generated forms for an estate' })
  @ApiParam({ name: 'estateId', description: 'Estate ID' })
  async getGeneratedForms(@Param('estateId') estateId: string) {
    // This would fetch forms from the repository
    // For MVP, we'll return a placeholder
    return {
      estateId,
      forms: [],
      message: 'Forms will be available after generation',
    };
  }
}
