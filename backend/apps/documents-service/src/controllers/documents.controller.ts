import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpCode,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import {
  DocumentQueryDto,
  createPaginatedResponseDto,
  InitiateDocumentUploadRequestDto,
} from '@shamba/common';
import { JwtAuthGuard, CurrentUser, JwtPayload } from '@shamba/auth';
import { DocumentsService } from '../services/documents.service';
import { DocumentEntity } from '../entities/document.entity';

// Dynamically create the paginated response DTO for Swagger documentation
const PaginatedDocumentResponse = createPaginatedResponseDto(DocumentEntity);

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload a document. The file is sent as form-data.',
    type: InitiateDocumentUploadRequestDto, // This is optional context, not the file itself
  })
  @ApiOperation({ summary: 'Upload a new document' })
  @ApiResponse({ status: HttpStatus.CREATED, type: DocumentEntity })
  async upload(
    @CurrentUser('sub') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }), // 20MB limit
          new FileTypeValidator({ fileType: /(pdf|jpeg|png|msword)/ }),
        ],
      }),
    ) file: Express.Multer.File,
  ): Promise<DocumentEntity> {
    const document = await this.documentsService.createDocument(userId, file);
    return new DocumentEntity(document);
  }

  @Get()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Get a paginated list of documents for the current user' })
  @ApiResponse({ status: HttpStatus.OK, type: PaginatedDocumentResponse })
  async findMyDocuments(
    @CurrentUser('sub') userId: string,
    @Query() query: DocumentQueryDto,
  ) {
    const { documents, total } = await this.documentsService.findForUser(userId, query);
    const documentEntities = documents.map(doc => new DocumentEntity(doc));
    return new PaginatedDocumentResponse(documentEntities, total, query);
  }

  @Get(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Get a single document by its ID' })
  @ApiResponse({ status: HttpStatus.OK, type: DocumentEntity })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<DocumentEntity> {
    const document = await this.documentsService.findOne(id, user);
    return new DocumentEntity(document);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download the physical file for a document' })
  @ApiResponse({ status: HttpStatus.OK, description: 'File content' })
  async download(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const { buffer, document } = await this.documentsService.download(id, user);
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);
    res.send(buffer);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a document' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.documentsService.deleteDocument(id, user);
  }
}