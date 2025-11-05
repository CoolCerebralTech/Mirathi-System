import {
  Controller,
  Get,
  Post,
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
  StreamableFile,
  Header,
  Body,
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

import { DocumentVersionService } from '../../2_application/services/document-version.service';
import { DocumentVersionResponseDto } from '../../2_application/dtos';

@ApiTags('Document Versions')
@ApiBearerAuth()
@Controller('documents/:documentId/versions')
@UseGuards(JwtAuthGuard)
export class DocumentVersionController {
  constructor(private readonly documentVersionService: DocumentVersionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new version of a document' })
  @ApiResponse({ status: HttpStatus.CREATED, type: DocumentVersionResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Only owner can create versions' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid file or validation failed' })
  @ApiParam({ name: 'documentId', type: String, description: 'Document ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        changeNote: { type: 'string', nullable: true },
      },
    },
  })
  async createVersion(
    @Param('documentId') documentId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
          new FileTypeValidator({ fileType: /(pdf|jpg|jpeg|png|doc|docx|txt)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('changeNote') changeNote?: string,
    @Req() req: Request,
  ): Promise<DocumentVersionResponseDto> {
    const userId = (req.user as any).id;
    const userName = (req.user as any).name || (req.user as any).email;

    return this.documentVersionService.createVersion({
      documentId,
      file: file.buffer,
      filename: file.originalname,
      mimeType: file.mimetype,
      uploadedBy: userId,
      uploadedByName: userName,
      changeNote,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all versions of a document' })
  @ApiResponse({ status: HttpStatus.OK, type: [DocumentVersionResponseDto] })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  @ApiParam({ name: 'documentId', type: String, description: 'Document ID' })
  async getVersions(
    @Param('documentId') documentId: string,
    @Req() req: Request,
  ): Promise<DocumentVersionResponseDto[]> {
    const userId = (req.user as any).id;
    return this.documentVersionService.getDocumentVersions(documentId, userId, {
      includeDownloadUrl: true,
    });
  }

  @Get(':versionNumber')
  @ApiOperation({ summary: 'Get specific version of a document' })
  @ApiResponse({ status: HttpStatus.OK, type: DocumentVersionResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Version not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  @ApiParam({ name: 'documentId', type: String, description: 'Document ID' })
  @ApiParam({ name: 'versionNumber', type: Number, description: 'Version number' })
  async getVersion(
    @Param('documentId') documentId: string,
    @Param('versionNumber') versionNumber: number,
    @Req() req: Request,
  ): Promise<DocumentVersionResponseDto> {
    const userId = (req.user as any).id;
    return this.documentVersionService.getVersion(documentId, versionNumber, userId);
  }

  @Get(':versionNumber/download')
  @ApiOperation({ summary: 'Download specific version of a document' })
  @ApiResponse({ status: HttpStatus.OK, description: 'File download' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Version not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  @ApiParam({ name: 'documentId', type: String, description: 'Document ID' })
  @ApiParam({ name: 'versionNumber', type: Number, description: 'Version number' })
  @Header('Content-Type', 'application/octet-stream')
  @Header('Content-Disposition', 'attachment')
  async downloadVersion(
    @Param('documentId') documentId: string,
    @Param('versionNumber') versionNumber: number,
    @Req() req: Request,
  ): Promise<StreamableFile> {
    const userId = (req.user as any).id;
    const fileBuffer = await this.documentVersionService.getVersionFile(
      documentId,
      versionNumber,
      userId,
    );

    return new StreamableFile(fileBuffer);
  }
}
