// src/application/dtos/estate.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourtJurisdiction, KenyanFormType } from '@prisma/client';
import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class CreateEstateDto {
  @ApiProperty({ example: 'user-uuid-here' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'John Kamau' })
  @IsString()
  userName: string;

  @ApiPropertyOptional({ example: 'A123456789X' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]\d{9}[A-Z]$/, { message: 'Invalid KRA PIN format (e.g., A000000000Z)' })
  kraPin?: string;
}

export class LegalInsightsDto {
  @ApiProperty({ enum: KenyanFormType })
  recommendedForm: string;

  @ApiProperty()
  explanation: string;

  @ApiProperty()
  estimatedCourtFees: string;

  @ApiProperty({ enum: CourtJurisdiction })
  jurisdiction: string;
}

export class EstateSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userName: string;

  @ApiProperty()
  kraPin?: string;

  @ApiProperty()
  netWorth: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  isInsolvent: boolean;

  @ApiProperty()
  assetCount: number;

  @ApiProperty()
  debtCount: number;

  @ApiProperty({ type: LegalInsightsDto })
  legalInsights: LegalInsightsDto;

  @ApiProperty()
  createdAt: Date;
}
