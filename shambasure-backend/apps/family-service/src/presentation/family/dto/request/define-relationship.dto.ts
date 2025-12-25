import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';

import { RelationshipType } from '../../../../domain/value-objects/family-enums.vo';

export class DefineRelationshipDto {
  @ApiProperty()
  @IsUUID()
  fromMemberId: string;

  @ApiProperty()
  @IsUUID()
  toMemberId: string;

  @ApiProperty({ enum: RelationshipType })
  @IsEnum(RelationshipType)
  relationshipType: RelationshipType;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isBiological?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isLegal?: boolean;

  @ApiPropertyOptional({ description: 'UUID of an uploaded supporting document' })
  @IsOptional()
  @IsUUID()
  evidenceDocumentId?: string;
}
