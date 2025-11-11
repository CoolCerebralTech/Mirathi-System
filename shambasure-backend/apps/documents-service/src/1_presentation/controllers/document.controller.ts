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
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles } from '@shamba/auth';

import { DocumentCommandService } from '../../2_application/services/document.command.service';
import { DocumentQueryService } from '../../2_application/services/document.query.service';
import { StatisticsService } from '../../2_application/services/statistics.service';
import { Actor, DocumentId, UserId } from '../../3_domain/value-objects';
import {
  UploadDocumentDto,
  UploadDocumentResponseDto,
  VerifyDocumentDto,
  VerifyDocumentResponseDto,
  QueryDocumentsDto,
  PaginatedDocumentsResponseDto,
  DocumentResponseDto,
  UpdateDocumentDto,
  UpdateDocumentResponseDto,
  UpdateAccessDto,
  AccessControlResponseDto,
  BulkOperationDto,
  BulkOperationResponseDto,
  SearchDocumentsDto,
  DocumentAnalyticsResponseDto,
  StorageAnalyticsResponseDto,
  DashboardAnalyticsResponseDto,
} from '../2_application/dtos';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentController {
  constructor(
    private readonly documentCommandService: DocumentCommandService,
    private readonly documentQueryService: DocumentQueryService,
    private readonly statisticsService: StatisticsService,
  ) {}

  private createActor(req: any): Actor {
    return new Actor(new UserId(req.user.id), req.user.roles || []);
  }

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a new document' })
  @ApiResponse({ status: HttpStatus.CREATED, type: UploadDocumentResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid file or validation failed' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        fileName: { type: 'string' },
        category: { type: 'string' },
        assetId: { type: 'string', format: 'uuid', nullable: true },
        willId: { type: 'string', format: 'uuid', nullable: true },
        identityForUserId: { type: 'string', format: 'uuid', nullable: true },
        metadata: { type: 'object', nullable: true },
        documentNumber: { type: 'string', nullable: true },
        issueDate: { type: 'string', format: 'date-time', nullable: true },
        expiryDate: { type: 'string', format: 'date-time', nullable: true },
        issuingAuthority: { type: 'string', nullable: true },
        isPublic: { type: 'boolean', default: false },
        retentionPolicy: { type: 'string', nullable: true },
      },
    },
  })
  async uploadDocument(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType:
              /^(application\/pdf|image\/(jpeg|png|gif)|text\/plain|application\/(msword|vnd.openxmlformats-officedocument.wordprocessingml.document))$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @Req() req: any,
  ): Promise<UploadDocumentResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const actor = this.createActor(req);
    return this.documentCommandService.uploadDocument(
      dto,
      file.buffer,
      file.originalname,
      file.mimetype,
      actor,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Query documents with filters and pagination' })
  @ApiResponse({ status: HttpStatus.OK, type: PaginatedDocumentsResponseDto })
  async queryDocuments(
    @Query() dto: QueryDocumentsDto,
    @Req() req: any,
  ): Promise<PaginatedDocumentsResponseDto> {
    const actor = this.createActor(req);
    return this.documentQueryService.queryDocuments(dto, actor);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search documents' })
  @ApiResponse({ status: HttpStatus.OK, type: PaginatedDocumentsResponseDto })
  async searchDocuments(
    @Query() dto: SearchDocumentsDto,
    @Req() req: any,
  ): Promise<PaginatedDocumentsResponseDto> {
    const actor = this.createActor(req);
    return this.documentQueryService.searchDocuments(dto, actor);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: DocumentResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  async getDocumentById(@Param('id') id: string, @Req() req: any): Promise<DocumentResponseDto> {
    const actor = this.createActor(req);
    return this.documentQueryService.getDocumentById(new DocumentId(id), actor);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download document file' })
  @ApiResponse({ status: HttpStatus.OK, description: 'File stream' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  async downloadDocument(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: Response,
  ): Promise<void> {
    const actor = this.createActor(req);
    const result = await this.documentQueryService.downloadDocument(new DocumentId(id), actor);

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    res.setHeader('Content-Length', result.buffer.length);
    res.send(result.buffer);
  }

  @Get(':id/download-url')
  @ApiOperation({ summary: 'Get secure download URL' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Pre-signed URL' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  async getDownloadUrl(@Param('id') id: string, @Req() req: any): Promise<{ url: string }> {
    const actor = this.createActor(req);
    const url = await this.documentQueryService.getDocumentDownloadUrl(new DocumentId(id), actor);
    return { url };
  }

  @Put(':id/verify')
  @Roles('VERIFIER', 'ADMIN')
  @ApiOperation({ summary: 'Verify or reject a document' })
  @ApiResponse({ status: HttpStatus.OK, type: VerifyDocumentResponseDto })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  async verifyDocument(
    @Param('id') id: string,
    @Body() dto: VerifyDocumentDto,
    @Req() req: any,
  ): Promise<VerifyDocumentResponseDto> {
    const actor = this.createActor(req);
    return this.documentCommandService.verifyOrRejectDocument(new DocumentId(id), dto, actor);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update document' })
  @ApiResponse({ status: HttpStatus.OK, type: UpdateDocumentResponseDto })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  async updateDocument(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
    @Req() req: any,
  ): Promise<UpdateDocumentResponseDto> {
    const actor = this.createActor(req);
    return this.documentCommandService.updateDocument(new DocumentId(id), dto, actor);
  }

  @Put(':id/access')
  @ApiOperation({ summary: 'Update document access control' })
  @ApiResponse({ status: HttpStatus.OK, type: AccessControlResponseDto })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  async updateAccess(
    @Param('id') id: string,
    @Body() dto: UpdateAccessDto,
    @Req() req: any,
  ): Promise<AccessControlResponseDto> {
    const actor = this.createActor(req);
    return this.documentCommandService.updateDocumentAccess(new DocumentId(id), dto, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete document' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  async softDeleteDocument(@Param('id') id: string, @Req() req: any): Promise<void> {
    const actor = this.createActor(req);
    await this.documentCommandService.softDeleteDocument(new DocumentId(id), actor);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted document' })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  async restoreDocument(@Param('id') id: string, @Req() req: any): Promise<void> {
    const actor = this.createActor(req);
    await this.documentCommandService.restoreDocument(new DocumentId(id), actor);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Perform bulk operations on documents' })
  @ApiResponse({ status: HttpStatus.OK, type: BulkOperationResponseDto })
  async handleBulkOperation(
    @Body() dto: BulkOperationDto,
    @Req() req: any,
  ): Promise<BulkOperationResponseDto> {
    const actor = this.createActor(req);
    return this.documentCommandService.handleBulkOperation(dto, actor);
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get document statistics overview' })
  @ApiResponse({ status: HttpStatus.OK, type: DocumentAnalyticsResponseDto })
  async getDocumentStats(@Req() req: any): Promise<DocumentAnalyticsResponseDto> {
    const actor = this.createActor(req);
    return this.statisticsService.getDocumentAnalytics(actor);
  }

  @Get('stats/storage')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get storage statistics' })
  @ApiResponse({ status: HttpStatus.OK, type: StorageAnalyticsResponseDto })
  async getStorageStats(@Req() req: any): Promise<StorageAnalyticsResponseDto> {
    const actor = this.createActor(req);
    return this.statisticsService.getStorageAnalytics(actor);
  }

  @Get('stats/dashboard')
  @ApiOperation({ summary: 'Get comprehensive dashboard statistics' })
  @ApiResponse({ status: HttpStatus.OK, type: DashboardAnalyticsResponseDto })
  async getDashboardStats(@Req() req: any): Promise<DashboardAnalyticsResponseDto> {
    const actor = this.createActor(req);
    return this.statisticsService.getDashboardAnalytics(actor);
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get quick dashboard summary' })
  async getDashboardSummary(@Req() req: any): Promise<any> {
    const actor = this.createActor(req);
    return this.statisticsService.getDashboardSummary(actor);
  }
}
