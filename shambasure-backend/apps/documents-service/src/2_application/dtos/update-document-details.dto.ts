import { IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDocumentDetailsDto {
  @ApiPropertyOptional({ description: 'Document number (ID, parcel number, etc.)', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  documentNumber?: string;

  @ApiPropertyOptional({ description: 'Date document was issued', type: String, format: 'date' })
  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @ApiPropertyOptional({ description: 'Date document expires', type: String, format: 'date' })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Authority that issued the document', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  issuingAuthority?: string;
}

export class UpdateDocumentDetailsResponseDto {
  @ApiPropertyOptional()
  id: string;

  @ApiPropertyOptional()
  documentNumber?: string;

  @ApiPropertyOptional()
  issueDate?: Date;

  @ApiPropertyOptional()
  expiryDate?: Date;

  @ApiPropertyOptional()
  issuingAuthority?: string;

  @ApiPropertyOptional()
  updatedAt: Date;

  constructor(partial: Partial<UpdateDocumentDetailsResponseDto>) {
    Object.assign(this, partial);
  }
}
