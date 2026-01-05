// apps/documents-service/src/presentation/controllers/verification.controller.ts
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard, Roles, RolesGuard } from '@shamba/auth';

import { VerificationService } from '../../application/services/verification.service';
import { VerifyDocumentDto } from '../dto/verify-document.dto';

@Controller('verification')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('VERIFIER', 'ADMIN')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  /**
   * GET /verification/pending
   * Get all documents pending verification
   */
  @Get('pending')
  async getPendingDocuments() {
    return this.verificationService.getPendingDocuments();
  }

  /**
   * GET /verification/documents/:id
   * Get document for verification with view URL
   */
  @Get('documents/:id')
  async getDocumentForVerification(@Param('id') id: string) {
    return this.verificationService.getDocumentForVerification(id);
  }

  /**
   * POST /verification/verify
   * Verify document (approve or reject)
   */
  @Post('verify')
  async verifyDocument(@Body() dto: VerifyDocumentDto, @Request() req: any) {
    const verifierId = req.user.userId;
    const userRole = req.user.role;

    // Only VERIFIER and ADMIN can verify
    if (!['VERIFIER', 'ADMIN'].includes(userRole)) {
      throw new ForbiddenException('Only verifiers can perform this action');
    }

    return this.verificationService.verifyDocument(
      dto.documentId,
      verifierId,
      dto.action,
      dto.notes,
    );
  }
}
