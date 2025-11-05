import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '@shamba/auth';

import { DocumentVerificationService } from '../../2_application/services/document-verification.service';
import { DocumentVerificationAttemptResponseDto } from '../../2_application/dtos';

@ApiTags('Document Verification')
@ApiBearerAuth()
@Controller('documents/:documentId/verification')
@UseGuards(JwtAuthGuard)
export class DocumentVerificationController {
  constructor(private readonly verificationService: DocumentVerificationService) {}

  @Get('history')
  @ApiOperation({ summary: 'Get verification history for a document' })
  @ApiResponse({ status: 200, type: [DocumentVerificationAttemptResponseDto] })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiParam({ name: 'documentId', type: String, description: 'Document ID' })
  async getVerificationHistory(
    @Param('documentId') documentId: string,
  ): Promise<DocumentVerificationAttemptResponseDto[]> {
    return this.verificationService.getVerificationHistory(documentId);
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get the latest verification attempt for a document' })
  @ApiResponse({ status: 200, type: DocumentVerificationAttemptResponseDto })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiParam({ name: 'documentId', type: String, description: 'Document ID' })
  async getLatestVerification(
    @Param('documentId') documentId: string,
  ): Promise<DocumentVerificationAttemptResponseDto | null> {
    return this.verificationService.getLatestVerificationAttempt(documentId);
  }

  @Get('verifier-stats')
  @ApiOperation({ summary: 'Get verification statistics for the current verifier' })
  @ApiResponse({ status: 200, description: 'Verifier statistics' })
  @ApiParam({ name: 'documentId', type: String, description: 'Document ID' })
  async getVerifierStats(@Param('documentId') documentId: string, @Req() req: Request) {
    const userId = (req.user as any).id;
    return this.verificationService.getVerifierStats(userId);
  }
}
