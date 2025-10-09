import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpStatus,
  HttpCode,
  ClassSerializerInterceptor,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import express from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import {
  DocumentQueryDto,
  createPaginatedResponseDto,
  AddDocumentVersionDto,
} from '@shamba/common';
import * as auth from '@shamba/auth';
import { UserRole } from '@shamba/database';
import { DocumentsService } from '../services/documents.service';
import { DocumentEntity, DocumentListEntity } from '../entities/document.entity';

// Paginated response types for Swagger
const PaginatedDocumentResponse = createPaginatedResponseDto(DocumentListEntity);

/**
 * DocumentsController - Document management endpoints
 *
 * ROUTES:
 * - POST /documents/upload - Upload new document
 * - POST /documents/:id/versions - Add new version
 * - GET /documents - List user's documents
 * - GET /documents/:id - Get single document
 * - GET /documents/:id/download - Download latest version
 * - GET /documents/:id/versions/:versionNumber/download - Download specific version
 * - GET /documents/:id/stats - Get document statistics
 * - PATCH /documents/:id/verify - Verify document (admin)
 * - PATCH /documents/:id/reject - Reject document (admin)
 * - DELETE /documents/:id - Delete document
 *
 * ADMIN ROUTES:
 * - GET /documents/admin/all - List all documents (admin)
 * - PATCH /documents/:id/verify - Verify document
 * - PATCH /documents/:id/reject - Reject document
 */
@ApiTags('Documents')
@Controller('documents')
@UseGuards(auth.JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // ========================================================================
  // UPLOAD OPERATIONS
  // ========================================================================

  /**
   * Upload a new document
   * File validation handled by service layer
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload a document file (PDF, JPEG, PNG)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Document file to upload',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload a new document',
    description: 'Upload a document file. Max size: 10MB. Allowed types: PDF, JPEG, PNG',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Document uploaded successfully',
    type: DocumentEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file or validation failed',
  })
  @ApiResponse({
    status: HttpStatus.PAYLOAD_TOO_LARGE,
    description: 'File size exceeds 10MB limit',
  })
  @ApiResponse({
    status: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
    description: 'File type not supported',
  })
  async upload(
    @auth.CurrentUser('sub') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<DocumentEntity> {
    const document = await this.documentsService.createDocument(userId, file);
    return new DocumentEntity(document);
  }

  /**
   * Add a new version to an existing document
   */
  @Post(':id/versions')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'id',
    description: 'Document UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    description: 'Upload a new version of the document',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        changeNote: {
          type: 'string',
          description: 'Optional note describing changes in this version',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Add a new version to existing document',
    description: 'Upload a new version while preserving history',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Version added successfully',
    type: DocumentEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Not authorized to add version to this document',
  })
  async addVersion(
    @Param('id', ParseUUIDPipe) documentId: string,
    @Body() dto: AddDocumentVersionDto,
    @UploadedFile() file: Express.Multer.File,
    @auth.CurrentUser() user: auth.JwtPayload,
  ): Promise<DocumentEntity> {
    const document = await this.documentsService.addVersion(
      documentId,
      file,
      dto.changeNote || null,
      user,
    );
    return new DocumentEntity(document);
  }

  // ========================================================================
  // READ OPERATIONS
  // ========================================================================

  /**
   * Get paginated list of current user's documents
   */
  @Get()
  @ApiOperation({
    summary: 'List my documents',
    description: 'Get paginated list of documents uploaded by current user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Documents retrieved successfully',
    type: PaginatedDocumentResponse,
  })
  async findMyDocuments(@auth.CurrentUser('sub') userId: string, @Query() query: DocumentQueryDto) {
    const { documents, total } = await this.documentsService.findForUser(userId, query);
    const documentEntities = documents.map((doc) => new DocumentListEntity(doc));
    return new PaginatedDocumentResponse(documentEntities, total, query);
  }

  /**
   * Get single document with full details (including versions)
   */
  @Get(':id')
  @ApiParam({
    name: 'id',
    description: 'Document UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiOperation({
    summary: 'Get document by ID',
    description: 'Retrieve document details including version history',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document retrieved successfully',
    type: DocumentEntity,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Not authorized to access this document',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @auth.CurrentUser() user: auth.JwtPayload,
  ): Promise<DocumentEntity> {
    const document = await this.documentsService.findOne(id, user);
    return new DocumentEntity(document);
  }

  /**
   * Get document statistics for current user
   */
  @Get('stats/me')
  @ApiOperation({
    summary: 'Get my document statistics',
    description: 'Get document count, storage usage, and breakdown by status/type',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
  })
  async getMyStats(@auth.CurrentUser('sub') userId: string) {
    return this.documentsService.getUserStats(userId);
  }

  // ========================================================================
  // DOWNLOAD OPERATIONS
  // ========================================================================

  /**
   * Download latest version of document
   */
  @Get(':id/download')
  @ApiParam({
    name: 'id',
    description: 'Document UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiOperation({
    summary: 'Download document',
    description: 'Download the latest version of the document file',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File downloaded successfully',
    content: {
      'application/pdf': {},
      'image/jpeg': {},
      'image/png': {},
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Not authorized to download this document',
  })
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @auth.CurrentUser() user: auth.JwtPayload,
    @Res() res: express.Response,
  ) {
    const { buffer, document } = await this.documentsService.download(id, user);

    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(document.filename)}"`,
    );
    res.setHeader('Cache-Control', 'private, max-age=3600');

    res.send(buffer);
  }

  /**
   * Download specific version of document
   */
  @Get(':id/versions/:versionNumber/download')
  @ApiParam({
    name: 'id',
    description: 'Document UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiParam({
    name: 'versionNumber',
    description: 'Version number to download',
    type: 'integer',
    example: 1,
  })
  @ApiOperation({
    summary: 'Download specific version',
    description: 'Download a specific historical version of the document',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Version downloaded successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document or version not found',
  })
  async downloadVersion(
    @Param('id', ParseUUIDPipe) documentId: string,
    @Param('versionNumber', ParseIntPipe) versionNumber: number,
    @auth.CurrentUser() user: auth.JwtPayload,
    @Res() res: express.Response,
  ) {
    const { buffer } = await this.documentsService.downloadVersion(documentId, versionNumber, user);

    // Get parent document for filename
    const document = await this.documentsService.findOne(documentId, user);

    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(document.filename)}-v${versionNumber}"`,
    );

    res.send(buffer);
  }

  // ========================================================================
  // ADMIN OPERATIONS
  // ========================================================================

  /**
   * Get all documents (admin only)
   */
  @Get('admin/all')
  @UseGuards(auth.RolesGuard)
  @auth.Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'List all documents (Admin)',
    description: 'Get paginated list of all documents in the system',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Documents retrieved successfully',
    type: PaginatedDocumentResponse,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin role required',
  })
  async findAll(@Query() query: DocumentQueryDto) {
    const { documents, total } = await this.documentsService.findAll(query);
    const documentEntities = documents.map((doc) => new DocumentListEntity(doc));
    return new PaginatedDocumentResponse(documentEntities, total, query);
  }

  /**
   * Verify document (admin only)
   */
  @Patch(':id/verify')
  @UseGuards(auth.RolesGuard)
  @auth.Roles(UserRole.ADMIN)
  @ApiParam({
    name: 'id',
    description: 'Document UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiOperation({
    summary: 'Verify document (Admin)',
    description: 'Mark document as verified (PENDING_VERIFICATION → VERIFIED)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document verified successfully',
    type: DocumentEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Document cannot be verified in current status',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin role required',
  })
  async verify(
    @Param('id', ParseUUIDPipe) id: string,
    @auth.CurrentUser() admin: auth.JwtPayload,
  ): Promise<DocumentEntity> {
    const document = await this.documentsService.verifyDocument(id, admin);
    return new DocumentEntity(document);
  }

  /**
   * Reject document (admin only)
   */
  @Patch(':id/reject')
  @UseGuards(auth.RolesGuard)
  @auth.Roles(UserRole.ADMIN)
  @ApiParam({
    name: 'id',
    description: 'Document UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiOperation({
    summary: 'Reject document (Admin)',
    description: 'Mark document as rejected (PENDING_VERIFICATION → REJECTED)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document rejected successfully',
    type: DocumentEntity,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Document cannot be rejected in current status',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin role required',
  })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @auth.CurrentUser() admin: auth.JwtPayload,
  ): Promise<DocumentEntity> {
    const document = await this.documentsService.rejectDocument(id, admin);
    return new DocumentEntity(document);
  }

  // ========================================================================
  // DELETE OPERATIONS
  // ========================================================================

  /**
   * Delete document
   * Only owner can delete (or admin)
   * Verified documents cannot be deleted
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({
    name: 'id',
    description: 'Document UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiOperation({
    summary: 'Delete document',
    description: 'Delete document and all versions (verified documents cannot be deleted)',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Document deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Verified documents cannot be deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Not authorized to delete this document',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @auth.CurrentUser() user: auth.JwtPayload,
  ): Promise<void> {
    await this.documentsService.deleteDocument(id, user);
  }
}
