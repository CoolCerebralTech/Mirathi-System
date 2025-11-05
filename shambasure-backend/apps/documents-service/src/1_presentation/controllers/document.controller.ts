// src/1_presentation/controllers/document.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpStatus,
  HttpCode,
  UseGuards,
  Req,
  StreamableFile,
  Header,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '@shamba/auth';

import { DocumentService } from '../../2_application/services/document.service';
import { DocumentVersionService } from '../../2_application/services/document-version.service';
import { StatisticsService } from '../../2_application/services/statistics.service';
import {
  UploadDocumentDto,
  UploadDocumentResponseDto,
  VerifyDocumentDto,
  VerifyDocumentResponseDto,
  QueryDocumentsDto,
  PaginatedDocumentsResponseDto,
  DocumentResponseDto,
  UpdateMetadataDto,
  UpdateDocumentResponseDto,
  UpdateAccessControlDto,
  BulkDeleteDto,
  BulkOperationResponseDto,
  DocumentStatsResponseDto,
  SearchDocumentsDto,
} from '../../2_application/dtos';
import { DocumentMapper } from '../../2_application/mappers/document.mapper';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly documentVersionService: DocumentVersionService,
    private readonly statisticsService: StatisticsService,
    private readonly documentMapper: DocumentMapper,
  ) {}

  // ============================================================================
  // DOCUMENT UPLOAD
  // ============================================================================

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a new document' })
  @ApiResponse({ status: HttpStatus.CREATED, type: UploadDocumentResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid file or validation failed' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        filename: { type: 'string' },
        category: {
          type: 'string',
          enum: [
            'LAND_OWNERSHIP',
            'IDENTITY_PROOF',
            'SUCCESSION_DOCUMENT',
            'FINANCIAL_PROOF',
            'OTHER',
          ],
        },
        assetId: { type: 'string', format: 'uuid', nullable: true },
        willId: { type: 'string', format: 'uuid', nullable: true },
        identityForUserId: { type: 'string', format: 'uuid', nullable: true },
        metadata: { type: 'object', nullable: true },
        documentNumber: { type: 'string', nullable: true },
        issueDate: { type: 'string', format: 'date-time', nullable: true },
        expiryDate: { type: 'string', format: 'date-time', nullable: true },
        issuingAuthority: { type: 'string', nullable: true },
        isPublic: { type: 'boolean', default: false },
        allowedViewers: { type: 'array', items: { type: 'string' }, nullable: true },
      },
    },
  })
  async uploadDocument(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
          new FileTypeValidator({ fileType: /(pdf|jpg|jpeg|png|doc|docx|txt)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() uploadDto: UploadDocumentDto,
    @Req() req: Request,
  ): Promise<UploadDocumentResponseDto> {
    const userId = (req.user as any).id;
    const userName = (req.user as any).name || (req.user as any).email;

    return this.documentService.uploadDocument({
      file: file.buffer,
      filename: uploadDto.filename || file.originalname,
      mimeType: file.mimetype,
      category: uploadDto.category,
      uploaderId: userId,
      uploaderName: userName,
      assetId: uploadDto.assetId,
      willId: uploadDto.willId,
      identityForUserId: uploadDto.identityForUserId,
      metadata: uploadDto.metadata,
      documentNumber: uploadDto.documentNumber,
      issueDate: uploadDto.issueDate ? new Date(uploadDto.issueDate) : undefined,
      expiryDate: uploadDto.expiryDate ? new Date(uploadDto.expiryDate) : undefined,
      issuingAuthority: uploadDto.issuingAuthority,
      isPublic: uploadDto.isPublic,
      allowedViewers: uploadDto.allowedViewers,
    });
  }

  // ============================================================================
  // DOCUMENT RETRIEVAL
  // ============================================================================

  @Get()
  @ApiOperation({ summary: 'Get paginated list of documents' })
  @ApiResponse({ status: HttpStatus.OK, type: PaginatedDocumentsResponseDto })
  async getDocuments(
    @Query() query: QueryDocumentsDto,
    @Req() req: Request,
  ): Promise<PaginatedDocumentsResponseDto> {
    const userId = (req.user as any).id;

    return this.documentService.getDocuments(
      {
        uploaderId: query.uploaderId,
        status: query.status,
        category: query.category,
        assetId: query.assetId,
        willId: query.willId,
        identityForUserId: query.identityForUserId,
        isPublic: query.isPublic,
        encrypted: query.encrypted,
        storageProvider: query.storageProvider,
        documentNumber: query.documentNumber,
        issuingAuthority: query.issuingAuthority,
        createdAfter: query.createdAfter ? new Date(query.createdAfter) : undefined,
        createdBefore: query.createdBefore ? new Date(query.createdBefore) : undefined,
        updatedAfter: query.updatedAfter ? new Date(query.updatedAfter) : undefined,
        updatedBefore: query.updatedBefore ? new Date(query.updatedBefore) : undefined,
        includeDeleted: query.includeDeleted,
      },
      {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
      userId,
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Search documents with full-text capabilities' })
  @ApiResponse({ status: HttpStatus.OK, type: PaginatedDocumentsResponseDto })
  async searchDocuments(
    @Query() searchDto: SearchDocumentsDto,
    @Req() req: Request,
  ): Promise<PaginatedDocumentsResponseDto> {
    const userId = (req.user as any).id;

    return this.documentService.searchDocuments(
      {
        query: searchDto.query,
        category: searchDto.category,
        status: searchDto.status,
        uploaderId: searchDto.uploaderId,
        tags: searchDto.tags,
      },
      {
        page: searchDto.page,
        limit: searchDto.limit,
      },
      userId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: DocumentResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  @ApiParam({ name: 'id', type: String, description: 'Document ID' })
  async getDocumentById(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<DocumentResponseDto> {
    const userId = (req.user as any).id;
    return this.documentService.getDocumentById(id, userId, { includeDownloadUrl: true });
  }

  // ============================================================================
  // DOCUMENT DOWNLOAD
  // ============================================================================

  @Get(':id/download')
  @ApiOperation({ summary: 'Download document file' })
  @ApiResponse({ status: HttpStatus.OK, description: 'File download' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  @ApiParam({ name: 'id', type: String, description: 'Document ID' })
  @Header('Content-Type', 'application/octet-stream')
  @Header('Content-Disposition', 'attachment')
  async downloadDocument(@Param('id') id: string, @Req() req: Request): Promise<StreamableFile> {
    const userId = (req.user as any).id;
    const fileBuffer = await this.documentService.getFileContent(id, userId);

    return new StreamableFile(fileBuffer);
  }

  @Get(':id/download-url')
  @ApiOperation({ summary: 'Get signed download URL for document' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Download URL generated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  @ApiParam({ name: 'id', type: String, description: 'Document ID' })
  async getDownloadUrl(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<{ downloadUrl: string }> {
    const userId = (req.user as any).id;
    const downloadUrl = await this.documentService.generateDownloadUrl(id, userId);

    return { downloadUrl };
  }

  // ============================================================================
  // DOCUMENT VERIFICATION
  // ============================================================================

  @Put(':id/verify')
  @ApiOperation({ summary: 'Verify or reject a document' })
  @ApiResponse({ status: HttpStatus.OK, type: VerifyDocumentResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Only verifiers can verify documents' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Document already verified' })
  @ApiParam({ name: 'id', type: String, description: 'Document ID' })
  async verifyDocument(
    @Param('id') id: string,
    @Body() verifyDto: VerifyDocumentDto,
    @Req() req: Request,
  ): Promise<VerifyDocumentResponseDto> {
    const userId = (req.user as any).id;
    const userName = (req.user as any).name || (req.user as any).email;

    return this.documentService.verifyDocument({
      documentId: id,
      verifierId: userId,
      verifierName: userName,
      status: verifyDto.status,
      reason: verifyDto.reason,
      documentNumber: verifyDto.documentNumber,
      extractedData: verifyDto.extractedData,
      verificationMetadata: verifyDto.verificationMetadata,
    });
  }

  // ============================================================================
  // DOCUMENT METADATA & ACCESS CONTROL
  // ============================================================================

  @Put(':id/metadata')
  @ApiOperation({ summary: 'Update document metadata' })
  @ApiResponse({ status: HttpStatus.OK, type: UpdateDocumentResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Only owner can update document' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Cannot update verified document' })
  @ApiParam({ name: 'id', type: String, description: 'Document ID' })
  async updateMetadata(
    @Param('id') id: string,
    @Body() updateDto: UpdateMetadataDto,
    @Req() req: Request,
  ): Promise<UpdateDocumentResponseDto> {
    const userId = (req.user as any).id;

    return this.documentService.updateDocumentMetadata({
      documentId: id,
      updaterId: userId,
      metadata: updateDto.metadata,
      documentNumber: updateDto.documentNumber,
      issueDate: updateDto.issueDate ? new Date(updateDto.issueDate) : undefined,
      expiryDate: updateDto.expiryDate ? new Date(updateDto.expiryDate) : undefined,
      issuingAuthority: updateDto.issuingAuthority,
      customMetadata: updateDto.customMetadata,
      tags: updateDto.tags,
    });
  }

  @Put(':id/access-control')
  @ApiOperation({ summary: 'Update document access control' })
  @ApiResponse({ status: HttpStatus.OK, type: UpdateDocumentResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only owner can update access control',
  })
  @ApiParam({ name: 'id', type: String, description: 'Document ID' })
  async updateAccessControl(
    @Param('id') id: string,
    @Body() accessControlDto: UpdateAccessControlDto,
    @Req() req: Request,
  ): Promise<UpdateDocumentResponseDto> {
    const userId = (req.user as any).id;

    return this.documentService.updateDocumentAccessControl(
      id,
      userId,
      accessControlDto.isPublic,
      accessControlDto.allowedViewers,
    );
  }

  // ============================================================================
  // DOCUMENT DELETION & RESTORATION
  // ============================================================================

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a document' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Document deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Only owner can delete document' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Cannot delete verified document' })
  @ApiParam({ name: 'id', type: String, description: 'Document ID' })
  async deleteDocument(
    @Param('id') id: string,
    @Req() req: Request,
    @Body('reason') reason?: string,
  ): Promise<void> {
    const userId = (req.user as any).id;
    await this.documentService.deleteDocument(id, userId, reason);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted document' })
  @ApiResponse({ status: HttpStatus.OK, type: DocumentResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Only owner can restore document' })
  @ApiParam({ name: 'id', type: String, description: 'Document ID' })
  async restoreDocument(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<DocumentResponseDto> {
    const userId = (req.user as any).id;
    return this.documentService.restoreDocument(id, userId);
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  @Post('bulk/delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk delete multiple documents' })
  @ApiResponse({ status: HttpStatus.OK, type: BulkOperationResponseDto })
  async bulkDeleteDocuments(
    @Body() bulkDeleteDto: BulkDeleteDto,
    @Req() req: Request,
  ): Promise<BulkOperationResponseDto> {
    const userId = (req.user as any).id;
    return this.documentService.bulkDeleteDocuments(
      bulkDeleteDto.documentIds,
      userId,
      bulkDeleteDto.reason,
    );
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get document statistics overview' })
  @ApiResponse({ status: HttpStatus.OK, type: DocumentStatsResponseDto })
  async getDocumentStats(@Req() req: Request): Promise<DocumentStatsResponseDto> {
    const userId = (req.user as any).id;
    return this.documentService.getDocumentStats(userId);
  }

  @Get('stats/system')
  @ApiOperation({ summary: 'Get system-wide document statistics (Admin only)' })
  @ApiResponse({ status: HttpStatus.OK, type: DocumentStatsResponseDto })
  async getSystemStats(): Promise<DocumentStatsResponseDto> {
    // In production, add admin guard
    return this.statisticsService.getSystemStats();
  }

  @Get('stats/storage')
  @ApiOperation({ summary: 'Get storage usage statistics' })
  async getStorageStats() {
    return this.statisticsService.getStorageStats();
  }
}
