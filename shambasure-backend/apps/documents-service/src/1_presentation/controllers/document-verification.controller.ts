import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles } from '@shamba/auth';

import { DocumentVerificationCommandService } from '../../2_application/services/document-verification.command.service';
import { DocumentVerificationQueryService } from '../../2_application/services/document-verification.query.service';
import { Actor, DocumentId, UserId, VerificationAttemptId } from '../../3_domain/value-objects';
import {
  VerifyDocumentDto,
  VerifyDocumentResponseDto,
  DocumentVerificationHistoryResponseDto,
  VerifierPerformanceResponseDto,
  VerificationAttemptDto,
} from '../../2_application/dtos';

@ApiTags('document-verification')
@ApiBearerAuth()
@Controller('documents/:documentId/verification')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentVerificationController {
  constructor(
    private readonly verificationCommandService: DocumentVerificationCommandService,
    private readonly verificationQueryService: DocumentVerificationQueryService,
  ) {}

  private createActor(req: any): Actor {
    return new Actor(new UserId(req.user.id), req.user.roles || []);
  }

  @Put()
  @Roles('VERIFIER', 'ADMIN')
  @ApiOperation({ summary: 'Verify or reject a document' })
  @ApiResponse({ status: HttpStatus.OK, type: VerifyDocumentResponseDto })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  async verifyDocument(
    @Param('documentId') documentId: string,
    @Body() dto: VerifyDocumentDto,
    @Req() req: any,
  ): Promise<VerifyDocumentResponseDto> {
    const actor = this.createActor(req);
    return this.verificationCommandService.verifyOrRejectDocument(
      new DocumentId(documentId),
      dto,
      actor,
    );
  }

  @Post('bulk')
  @Roles('VERIFIER', 'ADMIN')
  @ApiOperation({ summary: 'Bulk verify/reject documents' })
  @ApiResponse({ status: HttpStatus.OK })
  async bulkVerify(
    @Body() body: { documentIds: string[]; status: 'VERIFIED' | 'REJECTED'; reason?: string },
    @Req() req: any,
  ): Promise<any> {
    const actor = this.createActor(req);
    const documentIds = body.documentIds.map((id) => new DocumentId(id));
    return this.verificationCommandService.bulkVerifyDocuments(
      documentIds,
      body.status,
      actor,
      body.reason,
    );
  }

  @Post('reverify')
  @Roles('VERIFIER', 'ADMIN')
  @ApiOperation({ summary: 'Request re-verification of rejected document' })
  @ApiResponse({ status: HttpStatus.OK, type: VerifyDocumentResponseDto })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  async reverifyDocument(
    @Param('documentId') documentId: string,
    @Body() body: { changeNote?: string },
    @Req() req: any,
  ): Promise<VerifyDocumentResponseDto> {
    const actor = this.createActor(req);
    return this.verificationCommandService.reverifyDocument(
      new DocumentId(documentId),
      actor,
      body.changeNote,
    );
  }

  @Get('history')
  @ApiOperation({ summary: 'Get verification history for document' })
  @ApiResponse({ status: HttpStatus.OK, type: DocumentVerificationHistoryResponseDto })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  async getVerificationHistory(
    @Param('documentId') documentId: string,
    @Req() req: any,
  ): Promise<DocumentVerificationHistoryResponseDto> {
    const actor = this.createActor(req);
    return this.verificationQueryService.getHistoryForDocument(new DocumentId(documentId), actor);
  }

  @Get('attempts')
  @ApiOperation({ summary: 'Get verification attempts' })
  @ApiResponse({ status: HttpStatus.OK, type: [VerificationAttemptDto] })
  async getVerificationAttempts(
    @Query('verifierId') verifierId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Req() req: any,
  ): Promise<VerificationAttemptDto[]> {
    const actor = this.createActor(req);
    const options = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    if (verifierId) {
      return this.verificationQueryService.getAttemptsByVerifier(
        new UserId(verifierId),
        options,
        actor,
      );
    }

    return [];
  }

  @Get('attempts/:attemptId')
  @ApiOperation({ summary: 'Get specific verification attempt' })
  @ApiResponse({ status: HttpStatus.OK, type: VerificationAttemptDto })
  @ApiParam({ name: 'attemptId', description: 'Attempt UUID' })
  async getAttemptById(
    @Param('attemptId') attemptId: string,
    @Req() req: any,
  ): Promise<VerificationAttemptDto> {
    const actor = this.createActor(req);
    return this.verificationQueryService.getAttemptById(
      new VerificationAttemptId(attemptId),
      actor,
    );
  }

  @Get('performance')
  @Roles('VERIFIER', 'ADMIN')
  @ApiOperation({ summary: 'Get verifier performance metrics' })
  @ApiResponse({ status: HttpStatus.OK, type: [VerifierPerformanceResponseDto] })
  async getVerifierPerformance(
    @Query('verifierId') verifierId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Req() req: any,
  ): Promise<VerifierPerformanceResponseDto | VerifierPerformanceResponseDto[]> {
    const actor = this.createActor(req);
    const timeRange =
      startDate && endDate
        ? {
            start: new Date(startDate),
            end: new Date(endDate),
          }
        : undefined;

    if (verifierId) {
      return this.verificationQueryService.getVerifierPerformance(
        new UserId(verifierId),
        timeRange,
        actor,
      );
    }

    return this.verificationQueryService.getVerifierPerformance(actor.id, timeRange, actor);
  }

  @Get('metrics')
  @Roles('VERIFIER', 'ADMIN')
  @ApiOperation({ summary: 'Get verification metrics and analytics' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  async getVerificationMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: any,
  ): Promise<any> {
    const actor = this.createActor(req);
    const timeRange = {
      start: new Date(startDate),
      end: new Date(endDate),
    };
    return this.verificationQueryService.getVerificationAnalytics(timeRange, actor);
  }

  @Get('compliance')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get compliance audit data' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  async getComplianceAudit(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: any,
  ): Promise<any> {
    const actor = this.createActor(req);
    const timeRange = {
      start: new Date(startDate),
      end: new Date(endDate),
    };
    return this.verificationQueryService.getComplianceAudit(timeRange, actor);
  }
}
