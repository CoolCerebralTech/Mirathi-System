// apps/documents-service/src/presentation/controllers/document.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard } from '@shamba/auth';

import { DocumentService } from '../../application/services/document.service';
import { UploadDocumentDto } from '../dto/upload-document.dto';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  /**
   * POST /documents/initiate-upload
   * Step 1: User initiates upload
   */
  @Post('initiate-upload')
  async initiateUpload(@Body() dto: UploadDocumentDto, @Request() req: any) {
    const uploaderId = req.user.userId;
    return this.documentService.initiateUpload(uploaderId, dto.documentName);
  }

  /**
   * POST /documents/upload/:documentId
   * Step 2: User uploads file
   */
  @Post('upload/:documentId')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('documentId') documentId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const uploaderId = req.user.userId;

    return this.documentService.processUpload(documentId, file.buffer, file.mimetype, uploaderId);
  }

  /**
   * GET /documents
   * Get user's documents
   */
  @Get()
  async getDocuments(@Request() req: any) {
    const uploaderId = req.user.userId;
    return this.documentService.getUserDocuments(uploaderId);
  }

  /**
   * GET /documents/:id
   * Get specific document details
   */
  @Get(':id')
  async getDocument(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.userId;
    return this.documentService.getDocumentById(id, userId);
  }

  /**
   * GET /documents/:id/view
   * Get presigned URL to view document
   */
  @Get(':id/view')
  async getDocumentUrl(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.userId;
    return this.documentService.getDocumentUrl(id, userId);
  }

  /**
   * DELETE /documents/:id
   * Delete document
   */
  @Delete(':id')
  async deleteDocument(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.userId;
    await this.documentService.deleteDocument(id, userId);
    return { message: 'Document deleted successfully' };
  }
}
