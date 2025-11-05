import { IsObject, IsOptional, IsString, IsDateString, MaxLength, IsArray } from 'class-validator';

export class UpdateMetadataDto {
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  documentNumber?: string;

  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  issuingAuthority?: string;

  @IsObject()
  @IsOptional()
  customMetadata?: Record<string, any>;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class UpdateAccessControlDto {
  @IsOptional()
  isPublic?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedViewers?: string[];
}

export class UpdateDocumentResponseDto {
  id: string;
  filename: string;
  metadata?: Record<string, any>;
  documentNumber?: string;
  issueDate?: Date;
  expiryDate?: Date;
  issuingAuthority?: string;
  isPublic: boolean;
  allowedViewers: string[];
  updatedAt: Date;

  constructor(partial: Partial<UpdateDocumentResponseDto>) {
    Object.assign(this, partial);
  }
}
