import { IsArray, IsUUID, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAccessDto {
  @ApiPropertyOptional({
    description:
      'A list of user IDs to grant view access to. This will be merged with existing viewers.',
    type: [String],
    format: 'uuid',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  shareWith?: string[];

  @ApiPropertyOptional({
    description: 'A list of user IDs to revoke view access from.',
    type: [String],
    format: 'uuid',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  revokeFrom?: string[];

  @ApiPropertyOptional({ description: 'Set the document to be publicly accessible or private.' })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

export class AccessControlResponseDto {
  @ApiProperty({ format: 'uuid' })
  documentId: string;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty({ type: [String], format: 'uuid' })
  allowedViewers: string[];

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<AccessControlResponseDto>) {
    Object.assign(this, partial);
  }
}
