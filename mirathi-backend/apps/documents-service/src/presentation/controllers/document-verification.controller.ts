import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
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

import { JwtAuthGuard, Roles, RolesGuard } from '@shamba/auth';

import {
  DocumentVerificationHistoryResponseDto,
  VerificationAttemptDto,
  VerifierPerformanceResponseDto,
} from '../../application/dtos/verification-history-response.dto';
import {
  VerifyDocumentDto,
  VerifyDocumentResponseDto,
} from '../../application/dtos/verify-document.dto';
import { DocumentVerificationCommandService } from '../../application/services/document-verification.command.service';
import { DocumentVerificationQueryService } from '../../application/services/document-verification.query.service';
import {
  Actor,
  DocumentId,
  DocumentStatusEnum,
  UserId,
  VerificationAttemptId,
} from '../../domain/value-objects';

// Define proper types for the authenticated request
interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    roles: string[];
  };
}

@ApiTags('document-verification')
@ApiBearerAuth()
@Controller('documents/:documentId/verification')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentVerificationController {
  constructor(
    private readonly verificationCommandService: DocumentVerificationCommandService,
    private readonly verificationQueryService: DocumentVerificationQueryService,
  ) {}

  private createActor(req: AuthenticatedRequest): Actor {
    return new Actor(new UserId(req.user.sub), req.user.roles || []);
  }

  @Put()
  @Roles('VERIFIER', 'ADMIN')
  @ApiOperation({ summary: 'Verify or reject a document' })
  @ApiResponse({ status: HttpStatus.OK, type: VerifyDocumentResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid verification request' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found' })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  async verifyDocument(
    @Param('documentId') documentId: string,
    @Body() dto: VerifyDocumentDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<VerifyDocumentResponseDto> {
    const actor = this.createActor(req);
    return await this.verificationCommandService.verifyOrRejectDocument(
      new DocumentId(documentId),
      dto,
      actor,
    );
  }

  @Post('bulk')
  @Roles('VERIFIER', 'ADMIN')
  @ApiOperation({ summary: 'Bulk verify/reject documents' })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid bulk operation' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async bulkVerify(
    @Body()
    body: {
      documentIds: string[];
      status: DocumentStatusEnum.VERIFIED | DocumentStatusEnum.REJECTED;
      reason?: string;
    },
    @Req() req: AuthenticatedRequest,
  ): Promise<{
    successCount: number;
    failedCount: number;
    errors: Array<{ documentId: string; error: string }>;
  }> {
    const actor = this.createActor(req);

    if (!body.documentIds || body.documentIds.length === 0) {
      throw new BadRequestException('documentIds array is required and cannot be empty');
    }

    if (body.status === DocumentStatusEnum.REJECTED && !body.reason) {
      throw new BadRequestException('Reason is required for rejection');
    }

    const documentIds = body.documentIds.map((id) => new DocumentId(id));

    return await this.verificationCommandService.bulkVerifyDocuments(
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
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Document is not rejected' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found' })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  async reverifyDocument(
    @Param('documentId') documentId: string,
    @Body() body: { changeNote?: string },
    @Req() req: AuthenticatedRequest,
  ): Promise<VerifyDocumentResponseDto> {
    const actor = this.createActor(req);
    return await this.verificationCommandService.reverifyDocument(
      new DocumentId(documentId),
      actor,
      body.changeNote,
    );
  }

  @Get('history')
  @ApiOperation({ summary: 'Get verification history for document' })
  @ApiResponse({ status: HttpStatus.OK, type: DocumentVerificationHistoryResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found' })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  async getVerificationHistory(
    @Param('documentId') documentId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<DocumentVerificationHistoryResponseDto> {
    const actor = this.createActor(req);
    return await this.verificationQueryService.getHistoryForDocument(
      new DocumentId(documentId),
      actor,
    );
  }

  @Get('attempts')
  @ApiOperation({ summary: 'Get verification attempts for a verifier' })
  @ApiResponse({ status: HttpStatus.OK, type: [VerificationAttemptDto] })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  @ApiQuery({ name: 'verifierId', required: false, description: 'Verifier UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO string)',
  })
  async getVerificationAttempts(
    @Query('verifierId') verifierId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Req() req?: AuthenticatedRequest, // Add ? to make it optional
  ): Promise<VerificationAttemptDto[]> {
    const actor = this.createActor(req!); // Use ! to assert it's defined

    if (!verifierId) {
      verifierId = actor.id.value;
    }

    const options = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return await this.verificationQueryService.getAttemptsByVerifier(
      new UserId(verifierId),
      options,
      actor,
    );
  }

  @Get('attempts/:attemptId')
  @ApiOperation({ summary: 'Get specific verification attempt' })
  @ApiResponse({ status: HttpStatus.OK, type: VerificationAttemptDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Attempt not found' })
  @ApiParam({ name: 'attemptId', description: 'Attempt UUID' })
  async getAttemptById(
    @Param('attemptId') attemptId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<VerificationAttemptDto> {
    const actor = this.createActor(req);
    return await this.verificationQueryService.getAttemptById(
      new VerificationAttemptId(attemptId),
      actor,
    );
  }

  @Get('performance')
  @Roles('VERIFIER', 'ADMIN')
  @ApiOperation({ summary: 'Get verifier performance metrics' })
  @ApiResponse({ status: HttpStatus.OK, type: VerifierPerformanceResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  @ApiQuery({ name: 'verifierId', required: false, description: 'Verifier UUID' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO string)',
  })
  async getVerifierPerformance(
    @Query('verifierId') verifierId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Req() req?: AuthenticatedRequest, // Add ? to make it optional
  ): Promise<VerifierPerformanceResponseDto> {
    const actor = this.createActor(req!); // Use ! to assert it's defined

    const targetVerifierId = verifierId ? new UserId(verifierId) : actor.id;
    const timeRange =
      startDate && endDate ? { start: new Date(startDate), end: new Date(endDate) } : undefined;

    return await this.verificationQueryService.getVerifierPerformance(
      targetVerifierId,
      actor,
      timeRange,
    );
  }

  @Get('metrics')
  @Roles('VERIFIER', 'ADMIN')
  @ApiOperation({ summary: 'Get verification metrics and analytics' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async getVerificationMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{
    totalAttempts: number;
    totalVerified: number;
    totalRejected: number;
    totalPending: number;
    averageVerificationTimeHours: number;
    byVerifier: Record<string, { verified: number; rejected: number }>;
  }> {
    const actor = this.createActor(req);

    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    const timeRange = {
      start: new Date(startDate),
      end: new Date(endDate),
    };

    return await this.verificationQueryService.getVerificationMetrics(timeRange, actor);
  }

  @Get('compliance')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get compliance audit data' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async getComplianceAudit(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{
    timeRange: { start: Date; end: Date };
    totalDocuments: number;
    verifiedDocuments: number;
    pendingDocuments: number;
    averageVerificationTime: number;
    complianceRate: number;
    verifierActivity: Array<{
      verifierId: string;
      activityCount: number;
      lastActivity: Date;
    }>;
  }> {
    const actor = this.createActor(req);

    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    const timeRange = {
      start: new Date(startDate),
      end: new Date(endDate),
    };

    return await this.verificationQueryService.getComplianceAudit(timeRange, actor);
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get latest verification attempt for document' })
  @ApiResponse({ status: HttpStatus.OK, type: VerificationAttemptDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'No attempts found' })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  async getLatestAttempt(
    @Param('documentId') documentId: string,
    @Req() req?: AuthenticatedRequest, // Add ? to make it optional
  ): Promise<VerificationAttemptDto | null> {
    const actor = this.createActor(req!); // Use ! to assert it's defined
    return await this.verificationQueryService.getLatestAttemptForDocument(
      new DocumentId(documentId),
      actor,
    );
  }
}
