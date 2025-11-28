import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsString, IsUUID, ValidateIf } from 'class-validator';

import { DocumentStatusEnum } from '../../domain/value-objects/document-status.vo';

/**
 * Defines the available bulk actions for documents.
 */
export enum BulkActionType {
  DELETE = 'DELETE', // Soft delete
  RESTORE = 'RESTORE', // Restore soft-deleted docs
  SHARE = 'SHARE', // Share documents with users
  REVOKE_ACCESS = 'REVOKE_ACCESS', // Remove shared access
  CHANGE_STATUS = 'CHANGE_STATUS', // Change document status
}

/**
 * DTO for performing bulk operations on multiple documents.
 */
export class BulkOperationDto {
  @ApiProperty({
    description: 'The bulk action to perform on the selected documents',
    enum: BulkActionType,
  })
  @IsEnum(BulkActionType)
  action!: BulkActionType;

  @ApiProperty({
    description: 'List of document IDs to apply the action to',
    type: [String],
    format: 'uuid',
    example: ['2e8f1d9a-cc31-4f9d-89b8-183b4a4b0b55'],
  })
  @IsArray()
  @IsUUID('4', { each: true, message: 'Each documentId must be a valid UUID' })
  @IsNotEmpty({ each: true })
  documentIds!: string[];

  @ApiPropertyOptional({
    description: 'User IDs for sharing or revoking document access',
    type: [String],
    format: 'uuid',
    example: ['caa763a9-7db0-4f4a-85e9-55e91f8b9b1f'],
  })
  @ValidateIf(
    (o: BulkOperationDto) =>
      o.action === BulkActionType.SHARE || o.action === BulkActionType.REVOKE_ACCESS,
  )
  @IsArray()
  @IsUUID('4', { each: true, message: 'Each userId must be a valid UUID' })
  @IsNotEmpty({ each: true })
  userIds?: string[];

  @ApiPropertyOptional({
    description: 'New document status (required if action = CHANGE_STATUS)',
    enum: DocumentStatusEnum,
    example: DocumentStatusEnum.VERIFIED,
  })
  @ValidateIf((o: BulkOperationDto) => o.action === BulkActionType.CHANGE_STATUS)
  @IsEnum(DocumentStatusEnum)
  status?: DocumentStatusEnum;

  @ApiPropertyOptional({
    description: 'Reason for rejection (required if action = CHANGE_STATUS and status = REJECTED)',
    example: 'Document verification failed due to invalid signature.',
  })
  @ValidateIf(
    (o: BulkOperationDto) =>
      o.action === BulkActionType.CHANGE_STATUS && o.status === DocumentStatusEnum.REJECTED,
  )
  @IsString()
  @IsNotEmpty()
  reason?: string;
}

/**
 * DTO for returning the results of a bulk operation.
 */
export class BulkOperationResponseDto {
  @ApiProperty({
    description: 'Number of successful operations',
    example: 48,
  })
  successCount!: number;

  @ApiProperty({
    description: 'Number of failed operations',
    example: 2,
  })
  failedCount!: number;

  @ApiPropertyOptional({
    description: 'List of documents that failed and their error messages',
    type: 'array',
    example: [
      {
        documentId: 'd59f8c3c-ec93-45c7-b2d8-02edc0d4e49d',
        error: 'User not authorized to modify document',
      },
    ],
  })
  errors?: Array<{
    documentId: string;
    error: string;
  }>;

  constructor(partial: Partial<BulkOperationResponseDto>) {
    Object.assign(this, partial);
  }
}
