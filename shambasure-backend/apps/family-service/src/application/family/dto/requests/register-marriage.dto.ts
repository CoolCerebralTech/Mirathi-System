import { MarriageType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

class ElderWitnessDto {
  @IsNotEmpty() @IsString() name: string;
  @IsNotEmpty() @IsNumber() age: number;
  @IsNotEmpty() @IsString() relationship: string;
}

export class RegisterMarriageDto {
  @IsNotEmpty()
  @IsUUID()
  familyId: string;

  @IsNotEmpty()
  @IsUUID()
  spouse1Id: string;

  @IsNotEmpty()
  @IsUUID()
  spouse2Id: string;

  @IsNotEmpty()
  @IsEnum(MarriageType)
  type: MarriageType;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  // Civil / Christian
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  issuingAuthority?: string;

  @IsOptional()
  @IsDateString()
  certificateIssueDate?: string;

  @IsOptional()
  @IsString()
  registrationDistrict?: string;

  // Customary
  @IsOptional() @IsBoolean() isCustomary?: boolean;
  @IsOptional() @IsString() customaryType?: string;
  @IsOptional() @IsString() ethnicGroup?: string;
  @IsOptional() @IsBoolean() dowryPaid?: boolean;
  @IsOptional() @IsNumber() dowryAmount?: number;
  @IsOptional() @IsString() dowryCurrency?: string;
  @IsOptional() @IsString() ceremonyLocation?: string;
  @IsOptional() @IsBoolean() clanApproval?: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ElderWitnessDto)
  elderWitnesses?: ElderWitnessDto[];

  // Islamic
  @IsOptional() @IsBoolean() isIslamic?: boolean;
  @IsOptional() @IsDateString() nikahDate?: string;
  @IsOptional() @IsString() waliName?: string;
  @IsOptional() @IsNumber() mahrAmount?: number;

  // S.40 Polygamy
  @IsOptional() @IsBoolean() isPolygamous?: boolean;
  @IsOptional() @IsString() s40CertificateNumber?: string;
  @IsOptional() @IsBoolean() isMatrimonialPropertyRegime?: boolean;
}
