import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreatePolygamousHouseDto {
  @IsNotEmpty()
  @IsUUID()
  familyId: string;

  @IsNotEmpty()
  @IsString()
  houseName: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  houseOrder: number;

  @IsNotEmpty()
  @IsDateString()
  establishedDate: string;

  @IsOptional()
  @IsUUID()
  houseHeadId?: string; // Should correspond to the wife leading the house

  // S.40 Compliance
  @IsOptional()
  @IsBoolean()
  courtRecognized?: boolean;

  @IsOptional()
  @IsString()
  s40CertificateNumber?: string;

  @IsOptional()
  @IsString()
  certificateIssuingCourt?: string;

  // Estate Planning
  @IsOptional()
  @IsNumber()
  houseSharePercentage?: number;

  @IsOptional()
  @IsBoolean()
  wivesConsentObtained?: boolean;
}
