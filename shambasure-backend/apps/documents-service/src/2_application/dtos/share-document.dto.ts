import { IsArray, IsUUID, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SharePermissionType {
  VIEW = 'VIEW',
  DOWNLOAD = 'DOWNLOAD',
  EDIT = 'EDIT',
}

export class ShareDocumentDto {
  @ApiProperty({ description: 'User IDs to share document with', type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  userIds: string[];

  @ApiPropertyOptional({ enum: SharePermissionType, default: SharePermissionType.VIEW })
  @IsEnum(SharePermissionType)
  @IsOptional()
  permission?: SharePermissionType = SharePermissionType.VIEW;

  @ApiPropertyOptional({ description: 'Make document publicly accessible' })
  @IsBoolean()
  @IsOptional()
  makePublic?: boolean;
}

export class RevokeAccessDto {
  @ApiProperty({ description: 'User IDs to revoke access from', type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  userIds: string[];
}

export class ShareDocumentResponseDto {
  @ApiProperty()
  documentId: string;

  @ApiProperty({ type: [String] })
  sharedWith: string[];

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty({ type: [String] })
  allowedViewers: string[];

  @ApiProperty()
  sharedAt: Date;

  constructor(partial: Partial<ShareDocumentResponseDto>) {
    Object.assign(this, partial);
  }
}
