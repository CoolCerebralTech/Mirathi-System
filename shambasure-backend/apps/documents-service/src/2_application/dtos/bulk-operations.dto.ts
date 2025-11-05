import { IsArray, IsUUID, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { DocumentStatusEnum } from '../../3_domain/value-objects/document-status.vo';

export class BulkOperationDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  documentIds: string[];
}

export class BulkUpdateStatusDto extends BulkOperationDto {
  @IsEnum([
    DocumentStatusEnum.VERIFIED,
    DocumentStatusEnum.REJECTED,
    DocumentStatusEnum.PENDING_VERIFICATION,
  ])
  status: DocumentStatusEnum;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class BulkUpdateMetadataDto extends BulkOperationDto {
  @IsObject()
  metadata: Record<string, any>;
}

export class BulkDeleteDto extends BulkOperationDto {
  @IsString()
  @IsOptional()
  reason?: string;
}

export class BulkOperationResponseDto {
  success: number;
  failed: number;
  errors: Array<{
    documentId: string;
    error: string;
  }>;

  constructor(partial: Partial<BulkOperationResponseDto>) {
    Object.assign(this, partial);
  }
}
