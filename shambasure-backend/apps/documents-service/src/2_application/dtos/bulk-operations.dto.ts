import { IsArray, IsUUID, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentStatusEnum } from '../../3_domain/value-objects/document-status.vo';

export class BulkOperationDto {
  @ApiProperty({ description: 'Array of document IDs', type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  documentIds: string[];
}

export class BulkUpdateStatusDto extends BulkOperationDto {
  @ApiProperty({
    enum: [
      DocumentStatusEnum.VERIFIED,
      DocumentStatusEnum.REJECTED,
      DocumentStatusEnum.PENDING_VERIFICATION,
    ],
  })
  @IsEnum([
    DocumentStatusEnum.VERIFIED,
    DocumentStatusEnum.REJECTED,
    DocumentStatusEnum.PENDING_VERIFICATION,
  ])
  status: DocumentStatusEnum;

  @ApiPropertyOptional({ description: 'Reason for status change (required for REJECTED)' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class BulkUpdateMetadataDto extends BulkOperationDto {
  @ApiProperty({ description: 'Metadata to apply to all documents' })
  @IsObject()
  metadata: Record<string, any>;
}

export class BulkDeleteDto extends BulkOperationDto {
  @ApiPropertyOptional({ description: 'Reason for deletion' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class BulkShareDto extends BulkOperationDto {
  @ApiProperty({ description: 'User IDs to share documents with', type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  userIds: string[];
}

export class BulkOperationResponseDto {
  @ApiProperty({ description: 'Number of successful operations' })
  successCount: number;

  @ApiProperty({ description: 'Number of failed operations' })
  failedCount: number;

  @ApiProperty({ description: 'Details of failed operations', type: [Object] })
  errors: Array<{
    documentId: string;
    error: string;
  }>;

  constructor(partial: Partial<BulkOperationResponseDto>) {
    Object.assign(this, partial);
  }
}
