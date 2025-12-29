import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser, JwtAuthGuard, type JwtPayload } from '@shamba/auth';

import {
  RecordConsentDeclineCommand,
  RecordConsentGrantCommand,
  RequestFamilyConsentCommand,
} from '../../../application/probate/commands/impl/consent-management.commands';
import {
  FileApplicationCommand,
  PayFilingFeeCommand,
  RecordCourtResponseCommand,
  RecordGrantIssuanceCommand,
} from '../../../application/probate/commands/impl/filing-interaction.commands';
import {
  GenerateFormBundleCommand,
  RegenerateFormsCommand,
  ReviewFormCommand,
  SignFormCommand,
} from '../../../application/probate/commands/impl/form-strategy.commands';
// Commands
import {
  AutoGenerateApplicationCommand,
  CreateApplicationCommand,
  WithdrawApplicationCommand,
} from '../../../application/probate/commands/impl/lifecycle.commands';
import {
  DeclineConsentRequestDto,
  GrantConsentRequestDto,
  SendConsentRequestDto,
} from '../dtos/request/consents.request.dto';
import {
  PayFilingFeeRequestDto,
  RecordCourtResponseRequestDto,
  RecordGrantRequestDto,
  SubmitFilingRequestDto,
} from '../dtos/request/filing.request.dto';
import {
  GenerateFormsRequestDto,
  RegenerateFormsRequestDto,
  ReviewFormRequestDto,
  SignFormRequestDto,
} from '../dtos/request/forms.request.dto';
// Request DTOs
import {
  AutoGenerateRequestDto,
  CreateApplicationRequestDto,
  WithdrawApplicationRequestDto,
} from '../dtos/request/lifecycle.request.dto';

@ApiTags('Probate Application [Commands]')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('probate-applications')
export class ProbateCommandController {
  constructor(private readonly commandBus: CommandBus) {}

  // ===========================================================================
  // 1. Lifecycle
  // ===========================================================================

  @Post()
  @ApiOperation({ summary: 'Manually create a new probate application' })
  @ApiResponse({ status: 201, description: 'Application created successfully' })
  async create(@Body() dto: CreateApplicationRequestDto, @CurrentUser() user: JwtPayload) {
    // Map request to internal command DTO logic
    const command = new CreateApplicationCommand({
      ...dto,
      applicantUserId: user.sub, // Enforce authenticated user as applicant
      applicantFullName: dto.applicantFullName || 'Unknown Applicant',
    });
    const result = await this.commandBus.execute(command);
    if (result.isFailure) throw new Error(result.error?.message);
    return { id: result.getValue() };
  }

  @Post('auto-generate')
  @ApiOperation({ summary: 'Auto-generate application from Readiness Assessment' })
  async autoGenerate(@Body() dto: AutoGenerateRequestDto, @CurrentUser() user: JwtPayload) {
    const command = new AutoGenerateApplicationCommand({
      ...dto,
      applicantUserId: user.sub,
    });
    const result = await this.commandBus.execute(command);
    if (result.isFailure) throw new Error(result.error?.message);
    return { id: result.getValue() };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Withdraw an active application' })
  async withdraw(
    @Param('id') id: string,
    @Body() dto: WithdrawApplicationRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new WithdrawApplicationCommand({
      applicationId: id,
      reason: dto.reason,
      withdrawnByUserId: user.sub,
    });
    const result = await this.commandBus.execute(command);
    if (result.isFailure) throw new Error(result.error?.message);
    return { message: 'Application withdrawn successfully' };
  }

  // ===========================================================================
  // 2. Forms Strategy
  // ===========================================================================

  @Post(':id/forms/generate')
  @ApiOperation({ summary: 'Generate the legal form bundle' })
  async generateForms(
    @Param('id') id: string,
    @Body() dto: GenerateFormsRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new GenerateFormBundleCommand({
      applicationId: id,
      triggeredByUserId: user.sub,
      forceRegeneration: dto.forceRegeneration,
    });
    const result = await this.commandBus.execute(command);
    if (result.isFailure) throw new Error(result.error?.message);
    return { message: 'Forms generated successfully' };
  }

  @Post(':id/forms/regenerate')
  @ApiOperation({ summary: 'Regenerate forms after context change' })
  async regenerateForms(
    @Param('id') id: string,
    @Body() dto: RegenerateFormsRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new RegenerateFormsCommand({
      applicationId: id,
      reason: dto.reason,
      triggeredByUserId: user.sub,
    });
    const result = await this.commandBus.execute(command);
    if (result.isFailure) throw new Error(result.error?.message);
    return { message: 'Forms regenerated successfully' };
  }

  @Patch(':id/forms/:formId/review')
  @ApiOperation({ summary: 'Approve or review a generated form' })
  async reviewForm(
    @Param('id') id: string,
    @Param('formId') formId: string,
    @Body() dto: ReviewFormRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new ReviewFormCommand({
      applicationId: id,
      formId: formId,
      reviewedByUserId: user.sub,
      notes: dto.notes,
    });
    const result = await this.commandBus.execute(command);
    if (result.isFailure) throw new Error(result.error?.message);
    return { message: 'Form review recorded' };
  }

  @Post(':id/forms/:formId/sign')
  @ApiOperation({ summary: 'Apply digital signature to a form' })
  async signForm(
    @Param('id') id: string,
    @Param('formId') formId: string,
    @Body() dto: SignFormRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new SignFormCommand({
      applicationId: id,
      formId: formId,
      signatoryId: user.sub, // Assuming logged-in user is signing
      ...dto,
    });
    const result = await this.commandBus.execute(command);
    if (result.isFailure) throw new Error(result.error?.message);
    return { message: 'Form signed successfully' };
  }

  // ===========================================================================
  // 3. Consent Management
  // ===========================================================================

  @Post(':id/consents/:consentId/request')
  @ApiOperation({ summary: 'Send consent request via SMS/Email' })
  async requestConsent(
    @Param('id') id: string,
    @Param('consentId') consentId: string,
    @Body() dto: SendConsentRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new RequestFamilyConsentCommand({
      applicationId: id,
      consentId: consentId,
      method: dto.method,
      triggeredByUserId: user.sub,
    });
    const result = await this.commandBus.execute(command);
    if (result.isFailure) throw new Error(result.error?.message);
    return { message: 'Consent request sent' };
  }

  @Post(':id/consents/:consentId/grant')
  @ApiOperation({ summary: 'Record consent granted (Verification)' })
  async grantConsent(
    @Param('id') id: string,
    @Param('consentId') consentId: string,
    @Body() dto: GrantConsentRequestDto,
  ) {
    const command = new RecordConsentGrantCommand({
      applicationId: id,
      consentId: consentId,
      method: dto.method,
      verificationToken: dto.verificationToken,
    });
    const result = await this.commandBus.execute(command);
    if (result.isFailure) throw new Error(result.error?.message);
    return { message: 'Consent recorded successfully' };
  }

  @Post(':id/consents/:consentId/decline')
  @ApiOperation({ summary: 'Record consent dispute' })
  async declineConsent(
    @Param('id') id: string,
    @Param('consentId') consentId: string,
    @Body() dto: DeclineConsentRequestDto,
  ) {
    const command = new RecordConsentDeclineCommand({
      applicationId: id,
      consentId: consentId,
      reason: dto.reason,
      category: dto.category,
    });
    const result = await this.commandBus.execute(command);
    if (result.isFailure) throw new Error(result.error?.message);
    return { message: 'Consent declined recorded' };
  }

  // ===========================================================================
  // 4. Filing & Court Interaction
  // ===========================================================================

  @Post(':id/fees/pay')
  @ApiOperation({ summary: 'Pay filing fees' })
  async payFees(@Param('id') id: string, @Body() dto: PayFilingFeeRequestDto) {
    const command = new PayFilingFeeCommand({
      applicationId: id,
      ...dto,
    });
    const result = await this.commandBus.execute(command);
    if (result.isFailure) throw new Error(result.error?.message);
    return { message: 'Payment recorded' };
  }

  @Post(':id/filing/submit')
  @ApiOperation({ summary: 'Submit application to court' })
  async submitFiling(
    @Param('id') id: string,
    @Body() dto: SubmitFilingRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const command = new FileApplicationCommand({
      applicationId: id,
      filedByUserId: user.sub,
      ...dto,
    });
    const result = await this.commandBus.execute(command);
    if (result.isFailure) throw new Error(result.error?.message);
    return { message: 'Application filed successfully' };
  }

  @Post(':id/court-response')
  @ApiOperation({ summary: 'Record court outcome (Rejection/Query)' })
  async recordCourtResponse(@Param('id') id: string, @Body() dto: RecordCourtResponseRequestDto) {
    const command = new RecordCourtResponseCommand({
      applicationId: id,
      ...dto,
    });
    const result = await this.commandBus.execute(command);
    if (result.isFailure) throw new Error(result.error?.message);
    return { message: 'Court response recorded' };
  }

  @Post(':id/grant')
  @ApiOperation({ summary: 'Record final grant issuance' })
  async recordGrant(@Param('id') id: string, @Body() dto: RecordGrantRequestDto) {
    const command = new RecordGrantIssuanceCommand({
      applicationId: id,
      ...dto,
    });
    const result = await this.commandBus.execute(command);
    if (result.isFailure) throw new Error(result.error?.message);
    return { message: 'Grant recorded successfully' };
  }
}
