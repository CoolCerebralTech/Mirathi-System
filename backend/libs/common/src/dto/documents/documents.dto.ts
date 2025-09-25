import { IsString, IsEnum, IsOptional, IsInt, Min, IsUUID, IsMimeType } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentStatus } from '../../enums';

export class UploadDocumentDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  filename: string;

  @ApiProperty()
  @IsString()
  @IsMimeType()
  mimeType: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  sizeBytes: number;

  @ApiPropertyOptional({ enum: DocumentStatus })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;
}

export class UpdateDocumentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  filename?: string;

  @ApiPropertyOptional({ enum: DocumentStatus })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;
}

export class CreateDocumentVersionDto {
  @ApiProperty()
  @IsString()
  storagePath: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeNote?: string;
}

export class DocumentResponseDto extends BaseDto {
  @ApiProperty()
  filename: string;

  @ApiProperty()
  storagePath: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  sizeBytes: number;

  @ApiProperty({ enum: DocumentStatus })
  status: DocumentStatus;

  @ApiProperty()
  uploaderId: string;

  @ApiProperty()
  versions: DocumentVersionResponseDto[];
}

export class DocumentVersionResponseDto extends BaseDto {
  @ApiProperty()
  versionNumber: number;

  @ApiProperty()
  storagePath: string;

  @ApiPropertyOptional()
  changeNote?: string;

  @ApiProperty()
  documentId: string;
}