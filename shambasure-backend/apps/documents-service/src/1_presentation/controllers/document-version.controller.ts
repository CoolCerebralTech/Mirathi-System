import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpStatus,
  UseGuards,
  Req,
  Res,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '@shamba/auth';

import { DocumentVersionCommandService } from '../../2_application/services/document-version.command.service';
import { DocumentVersionQueryService } from '../../2_application/services/document-version.query.service';
import { Actor, DocumentId, UserId } from '../../3_domain/value-objects';
import {
  CreateDocumentVersionDto,
  CreateDocumentVersionResponseDto,
  DocumentVersionQueryDto,
  DocumentVersionResponseDto,
} from '../../2_application/dtos';

// Define proper types for the authenticated request
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    roles: string[];
  };
}

@ApiTags('document-versions')
@ApiBearerAuth()
@Controller('documents/:documentId/versions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentVersionController {
  constructor(
    private readonly versionCommandService: DocumentVersionCommandService,
    private readonly versionQueryService: DocumentVersionQueryService,
  ) {}

  private createActor(req: AuthenticatedRequest): Actor {
    return new Actor(new UserId(req.user.id), req.user.roles || []);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new document version' })
  @ApiResponse({ status: HttpStatus.CREATED, type: CreateDocumentVersionResponseDto })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        changeNote: { type: 'string', nullable: true },
      },
    },
  })
  async createVersion(
    @Param('documentId') documentId: string,
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
    @Body() dto: CreateDocumentVersionDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<CreateDocumentVersionResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const actor = this.createActor(req);
    return await this.versionCommandService.createNewVersion(
      new DocumentId(documentId),
      dto,
      file.buffer,
      file.originalname,
      actor,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all versions for a document' })
  @ApiResponse({ status: HttpStatus.OK, type: [DocumentVersionResponseDto] })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  async getVersions(
    @Param('documentId') documentId: string,
    @Query() dto: DocumentVersionQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<any> {
    const actor = this.createActor(req);
    return await this.versionQueryService.getAllVersionsForDocument(
      new DocumentId(documentId),
      dto,
      actor,
    );
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get the latest version of a document' })
  @ApiResponse({ status: HttpStatus.OK, type: DocumentVersionResponseDto })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  async getLatestVersion(
    @Param('documentId') documentId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<DocumentVersionResponseDto> {
    const actor = this.createActor(req);
    return await this.versionQueryService.getLatestVersion(new DocumentId(documentId), actor);
  }

  @Get(':versionNumber')
  @ApiOperation({ summary: 'Get specific version by number' })
  @ApiResponse({ status: HttpStatus.OK, type: DocumentVersionResponseDto })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  @ApiParam({ name: 'versionNumber', description: 'Version number' })
  async getVersionByNumber(
    @Param('documentId') documentId: string,
    @Param('versionNumber') versionNumber: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<DocumentVersionResponseDto> {
    const actor = this.createActor(req);
    return await this.versionQueryService.getVersionByNumber(
      new DocumentId(documentId),
      parseInt(versionNumber, 10),
      actor,
    );
  }

  @Get(':versionNumber/download')
  @ApiOperation({ summary: 'Download specific version' })
  @ApiResponse({ status: HttpStatus.OK, description: 'File stream' })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  @ApiParam({ name: 'versionNumber', description: 'Version number' })
  async downloadVersion(
    @Param('documentId') documentId: string,
    @Param('versionNumber') versionNumber: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    const actor = this.createActor(req);
    const result = await this.versionQueryService.downloadVersion(
      new DocumentId(documentId),
      parseInt(versionNumber, 10),
      actor,
    );

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    res.setHeader('Content-Length', result.buffer.length.toString());
    res.send(result.buffer);
  }

  @Get(':versionNumber/download-url')
  @ApiOperation({ summary: 'Get secure download URL for version' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Pre-signed URL' })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  @ApiParam({ name: 'versionNumber', description: 'Version number' })
  async getVersionDownloadUrl(
    @Param('documentId') documentId: string,
    @Param('versionNumber') versionNumber: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ url: string }> {
    const actor = this.createActor(req);
    const url = await this.versionQueryService.getVersionDownloadUrl(
      new DocumentId(documentId),
      parseInt(versionNumber, 10),
      actor,
    );
    return { url };
  }

  @Delete(':versionNumber')
  @ApiOperation({ summary: 'Delete a specific version' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  @ApiParam({ name: 'versionNumber', description: 'Version number' })
  async deleteVersion(
    @Param('documentId') documentId: string,
    @Param('versionNumber') versionNumber: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    const actor = this.createActor(req);
    await this.versionCommandService.deleteVersion(
      new DocumentId(documentId),
      parseInt(versionNumber, 10),
      actor,
    );
  }

  @Get('stats/storage')
  @ApiOperation({ summary: 'Get version storage statistics' })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  async getVersionStorageStats(
    @Param('documentId') documentId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<any> {
    const actor = this.createActor(req);
    return await this.versionQueryService.getVersionStats(new DocumentId(documentId), actor);
  }
}
