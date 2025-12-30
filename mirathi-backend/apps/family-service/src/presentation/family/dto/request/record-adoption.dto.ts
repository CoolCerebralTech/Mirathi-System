import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class RecordAdoptionDto {
  @ApiProperty()
  @IsUUID()
  adopteeId: string;

  @ApiProperty()
  @IsUUID()
  adoptiveParentId: string;

  @ApiProperty({ enum: ['FORMAL', 'CUSTOMARY'] })
  @IsEnum(['FORMAL', 'CUSTOMARY'])
  adoptionType: 'FORMAL' | 'CUSTOMARY';

  @ApiProperty()
  @IsDateString()
  adoptionDate: Date;

  // --- Formal ---
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courtOrderNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courtName?: string;

  // --- Customary ---
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  clanElders?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ceremonyLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  agreementDocumentId?: string;
}
