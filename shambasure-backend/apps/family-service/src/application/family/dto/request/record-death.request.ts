// application/family/dto/request/record-death.request.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class RecordDeathRequest {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Family ID',
    example: 'fam-1234567890',
  })
  familyId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Member ID of the deceased',
    example: 'fm-1234567890',
  })
  familyMemberId: string;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Official Date of Death',
    example: '2023-01-15',
  })
  dateOfDeath: Date;

  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  @ApiProperty({
    description: 'Place of death (Required for succession jurisdiction)',
    example: 'Kenyatta National Hospital, Nairobi',
    maxLength: 200,
  })
  placeOfDeath: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  @ApiProperty({
    description: 'Primary cause of death',
    example: 'Cardiac Arrest',
    maxLength: 200,
  })
  causeOfDeath: string;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  @ApiPropertyOptional({
    description: 'Death certificate number (Critical for legal proof)',
    example: 'DC/2023/12345',
  })
  deathCertificateNumber?: string;

  @IsString()
  @IsOptional()
  @Length(2, 100)
  @ApiPropertyOptional({
    description: 'Authority issuing the certificate',
    example: 'Civil Registry Nairobi',
  })
  issuingAuthority?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User ID reporting the death',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  reportedByUserId: string;
}
