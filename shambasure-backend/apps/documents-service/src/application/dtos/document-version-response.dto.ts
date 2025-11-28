import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DocumentVersionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  versionNumber: number;

  @ApiProperty()
  documentId: string;

  @ApiProperty()
  storagePath: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  sizeBytes: number;

  @ApiProperty()
  checksum: string;

  @ApiPropertyOptional()
  changeNote?: string;

  @ApiProperty()
  uploadedBy: string;

  @ApiPropertyOptional()
  uploadedByName?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  downloadUrl?: string;

  @ApiProperty()
  fileSizeHumanReadable: string;

  constructor(partial: Partial<DocumentVersionResponseDto>) {
    Object.assign(this, partial);
  }
}
