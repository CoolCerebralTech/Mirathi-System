import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { 
  UploadDocumentDto, 
  UpdateDocumentDto, 
  DocumentResponseDto,
  DocumentVersionResponseDto,
  createSuccessResponse,
} from '@shamba/common';
import { 
  JwtAuthGuard, 
  RolesGuard, 
  CurrentUser,
} from '@shamba/auth';
import { DocumentService } from '../services/document.service';
import { LoggerService } from '@shamba/observability';
import { JwtPayload } from '@shamba/auth';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(
    private documentService: DocumentService,
    private logger: LoggerService,
  ) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        filename: {
          type: 'string',
          example: 'title_deed.pdf',
        },
        mimeType: {
          type: 'string',
          example: 'application/pdf',
        },
        sizeBytes: {
          type: 'number',
          example: 1024000,
        },
        status: {
          type: 'string',
          enum: ['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'],
          example: 'PENDING_VERIFICATION',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a new document' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Document uploaded successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid file or input data' 
  })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDocumentDto: UploadDocumentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Document upload request', 'DocumentsController', { 
      userId: user.userId,
      filename: file.originalname,
    });
    
    const result = await this.documentService.uploadDocument(file, uploadDocumentDto, user.userId);
    
    return createSuccessResponse(result, 'Document uploaded successfully');
  }

  @Post(':id/versions')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        changeNote: {
          type: 'string',
          example: 'Updated with latest information',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Add a new version to a document' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Document version added successfully',
    type: DocumentVersionResponseDto,
  })
  async addDocumentVersion(
    @Param('id') documentId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('changeNote') changeNote: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Adding document version', 'DocumentsController', { 
      documentId,
      userId: user.userId,
    });
    
    const result = await this.documentService.addDocumentVersion(
      documentId,
      file,
      changeNote,
      user.userId,
    );
    
    return createSuccessResponse(result, 'Document version added successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all documents for the current user' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Documents retrieved successfully' 
  })
  async getDocuments(@CurrentUser() user: JwtPayload) {
    this.logger.debug('Fetching user documents', 'DocumentsController', { userId: user.userId });
    
    const result = await this.documentService.getDocumentsByUploader(user.userId, user);
    
    return createSuccessResponse(result, 'Documents retrieved successfully');
  }

  @Get('search')
  @ApiOperation({ summary: 'Search documents' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Search completed successfully' 
  })
  async searchDocuments(
    @Query('q') query: string,
    @Query('status') status: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug('Searching documents', 'DocumentsController', { 
      userId: user.userId,
      query,
      status,
    });
    
    const result = await this.documentService.searchDocuments(
      user.userId,
      query,
      status as any,
      user,
    );
    
    return createSuccessResponse(result, 'Search completed successfully');
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get document statistics for the current user' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Statistics retrieved successfully' 
  })
  async getDocumentStats(@CurrentUser() user: JwtPayload) {
    this.logger.debug('Fetching document statistics', 'DocumentsController', { userId: user.userId });
    
    const result = await this.documentService.getDocumentStats(user.userId, user);
    
    return createSuccessResponse(result, 'Statistics retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Document retrieved successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Document not found' 
  })
  async getDocumentById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.debug('Fetching document by ID', 'DocumentsController', { documentId: id });
    
    const result = await this.documentService.getDocumentById(id, user);
    
    return createSuccessResponse(result, 'Document retrieved successfully');
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download a document' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Document downloaded successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Document not found' 
  })
  async downloadDocument(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    this.logger.debug('Downloading document', 'DocumentsController', { documentId: id });
    
    const { buffer, filename, mimeType } = await this.documentService.downloadDocument(id, user);
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
  }

  @Get(':id/thumbnail')
  @ApiOperation({ summary: 'Get document thumbnail' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Thumbnail retrieved successfully' 
  })
  async getDocumentThumbnail(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    this.logger.debug('Getting document thumbnail', 'DocumentsController', { documentId: id });
    
    const buffer = await this.documentService.getDocumentThumbnail(id, user);
    
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a document' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Document updated successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Access denied' 
  })
  async updateDocument(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Updating document', 'DocumentsController', { documentId: id });
    
    const result = await this.documentService.updateDocument(id, updateDocumentDto, user);
    
    return createSuccessResponse(result, 'Document updated successfully');
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Verify a document' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Document verification completed',
    type: DocumentResponseDto,
  })
  async verifyDocument(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Verifying document', 'DocumentsController', { documentId: id });
    
    const result = await this.documentService.verifyDocument(id, user.userId);
    
    return createSuccessResponse(result, 'Document verification completed');
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a document' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Document rejected successfully',
    type: DocumentResponseDto,
  })
  async rejectDocument(
    @Param('id') id: string,
    @Body() body: { reasons: string[] },
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Rejecting document', 'DocumentsController', { documentId: id });
    
    const result = await this.documentService.rejectDocument(id, user.userId, body.reasons);
    
    return createSuccessResponse(result, 'Document rejected successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Document deleted successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Access denied' 
  })
  async deleteDocument(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.info('Deleting document', 'DocumentsController', { documentId: id });
    
    await this.documentService.deleteDocument(id, user);
    
    return createSuccessResponse(null, 'Document deleted successfully');
  }
}