import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsUUID, IsUrl, Max, Min } from 'class-validator';

import { CoOwnershipType } from '../../../../../domain/enums/co-ownership-type.enum';

export class AddAssetCoOwnerRequestDto {
  @ApiProperty({ description: 'Family Member ID of the co-owner' })
  @IsUUID()
  @IsNotEmpty()
  familyMemberId: string;

  @ApiProperty({ example: 50, description: 'Percentage ownership (0-100)' })
  @IsNumber()
  @Min(0.01)
  @Max(100)
  sharePercentage: number;

  @ApiProperty({ enum: CoOwnershipType })
  @IsEnum(CoOwnershipType)
  ownershipType: CoOwnershipType;

  @ApiPropertyOptional({ description: 'URL to proof of ownership document' })
  @IsUrl()
  @IsOptional()
  evidenceUrl?: string;
}
