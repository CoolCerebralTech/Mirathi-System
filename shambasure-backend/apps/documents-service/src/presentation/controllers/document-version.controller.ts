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
import type { Request, Response } from 'express'; // Fixed: Added Request import
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

import { DocumentVersionCommandService } from '../../application/services/document-version.command.service';
import { DocumentVersionQueryService } from '../../application/services/document-version.query.service';
import { Actor, DocumentId, UserId } from '../../domain/value-objects';
import { DocumentVersionResponseDto } from '../../application/dtos/document-version-response.dto';
import {
  CreateDocumentVersionDto,
  CreateDocumentVersionResponseDto,
  DocumentVersionQueryDto,
} from '../../application/dtos/document-version.dto';

// Define proper types for the authenticated request
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    roles: string[];
  };
}

// Define the paginated response interface to match the service
interface PaginatedVersionsResponse {
  data: DocumentVersionResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
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
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid file or validation failed' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found' })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        changeNote: { type: 'string', nullable: true },
      },
      required: ['file'],
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
  @ApiResponse({ status: HttpStatus.OK, type: Object }) // Fixed: Updated to reflect paginated response
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found' })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  async getVersions(
    @Param('documentId') documentId: string,
    @Query() dto: DocumentVersionQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<PaginatedVersionsResponse> {
    // Fixed: Added proper return type
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
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document or version not found' })
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
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document or version not found' })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  @ApiParam({ name: 'versionNumber', description: 'Version number', type: Number })
  async getVersionByNumber(
    @Param('documentId') documentId: string,
    @Param('versionNumber') versionNumber: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<DocumentVersionResponseDto> {
    const actor = this.createActor(req);
    const versionNum = parseInt(versionNumber, 10);

    if (isNaN(versionNum) || versionNum < 1) {
      throw new BadRequestException('Version number must be a positive integer');
    }

    return await this.versionQueryService.getVersionByNumber(
      new DocumentId(documentId),
      versionNum,
      actor,
    );
  }

  @Get(':versionNumber/download')
  @ApiOperation({ summary: 'Download specific version' })
  @ApiResponse({ status: HttpStatus.OK, description: 'File stream' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document or version not found' })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  @ApiParam({ name: 'versionNumber', description: 'Version number', type: Number })
  async downloadVersion(
    @Param('documentId') documentId: string,
    @Param('versionNumber') versionNumber: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    const actor = this.createActor(req);
    const versionNum = parseInt(versionNumber, 10);

    if (isNaN(versionNum) || versionNum < 1) {
      throw new BadRequestException('Version number must be a positive integer');
    }

    const result = await this.versionQueryService.downloadVersion(
      new DocumentId(documentId),
      versionNum,
      actor,
    );

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    res.setHeader('Content-Length', result.size.toString()); // Fixed: Use result.size instead of buffer.length
    res.send(result.buffer);
  }

  @Get(':versionNumber/download-url')
  @ApiOperation({ summary: 'Get secure download URL for version' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Pre-signed URL' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document or version not found' })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  @ApiParam({ name: 'versionNumber', description: 'Version number', type: Number })
  async getVersionDownloadUrl(
    @Param('documentId') documentId: string,
    @Param('versionNumber') versionNumber: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ url: string }> {
    const actor = this.createActor(req);
    const versionNum = parseInt(versionNumber, 10);

    if (isNaN(versionNum) || versionNum < 1) {
      throw new BadRequestException('Version number must be a positive integer');
    }

    const url = await this.versionQueryService.getVersionDownloadUrl(
      new DocumentId(documentId),
      versionNum,
      actor,
    );
    return { url };
  }

  @Delete(':versionNumber')
  @ApiOperation({ summary: 'Delete a specific version' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Version deleted successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid deletion request' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document or version not found' })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  @ApiParam({ name: 'versionNumber', description: 'Version number', type: Number })
  async deleteVersion(
    @Param('documentId') documentId: string,
    @Param('versionNumber') versionNumber: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    const actor = this.createActor(req);
    const versionNum = parseInt(versionNumber, 10);

    if (isNaN(versionNum) || versionNum < 1) {
      throw new BadRequestException('Version number must be a positive integer');
    }

    await this.versionCommandService.deleteVersion(new DocumentId(documentId), versionNum, actor);
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get version statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Version statistics' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found' })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  async getVersionStats(
    @Param('documentId') documentId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<any> {
    // Fixed: Renamed method to match service
    const actor = this.createActor(req);
    return await this.versionQueryService.getVersionStats(new DocumentId(documentId), actor);
  }

  @Get('stats/storage')
  @ApiOperation({ summary: 'Get version storage usage' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Storage usage in bytes' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found' })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  async getVersionStorageUsage(
    @Param('documentId') documentId: string, // Fixed: Renamed method for clarity
    @Req() req: AuthenticatedRequest,
  ): Promise<{ storageUsageBytes: number }> {
    const actor = this.createActor(req);
    const storageUsage = await this.versionQueryService.getVersionStorageUsage(
      new DocumentId(documentId),
      actor,
    );
    return { storageUsageBytes: storageUsage };
  }
}
