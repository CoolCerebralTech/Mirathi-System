import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { BaseCommand, CommandMetadata } from '../base.command';

export enum S26ClaimType {
  MAINTENANCE = 'MAINTENANCE',
  EDUCATION = 'EDUCATION',
  MEDICAL = 'MEDICAL',
  HOUSING = 'HOUSING',
  LIVING_EXPENSES = 'LIVING_EXPENSES',
  FUNERAL_EXPENSES = 'FUNERAL_EXPENSES',
  LEGAL_FEES = 'LEGAL_FEES',
  OTHER = 'OTHER',
}

export class SupportingDocumentCommand {
  @IsUUID()
  documentId: string;

  @IsString()
  documentType: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  documentDate?: Date;
}

export class FileS26ClaimCommand extends BaseCommand {
  @IsUUID()
  dependencyAssessmentId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @IsString()
  currency: string = 'KES';

  @IsEnum(S26ClaimType)
  claimType: S26ClaimType;

  @IsString()
  @MinLength(20)
  claimReason: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  claimStartDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  claimEndDate?: Date;

  @IsOptional()
  @IsString()
  courtCaseNumber?: string;

  @IsOptional()
  @IsUUID()
  legalRepresentativeId?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SupportingDocumentCommand)
  supportingDocuments: SupportingDocumentCommand[];

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  monthlyBreakdownAmount?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  numberOfMonths?: number;

  @IsUUID()
  declaredBy: string;

  @IsDate()
  @Type(() => Date)
  declarationDate: Date;

  @IsBoolean()
  @IsOptional()
  isVerified: boolean = false;

  readonly metadata: CommandMetadata;

  constructor(
    data: Omit<
      FileS26ClaimCommand,
      'metadata' | 'commandType' | 'correlationId' | 'causationId' | 'commandId' | 'timestamp'
    >,
    metadata: CommandMetadata,
    correlationId?: string,
    causationId?: string,
  ) {
    super(correlationId, causationId);
    Object.assign(this, data);
    this.metadata = metadata;
  }

  get commandType(): string {
    return 'FileS26ClaimCommand';
  }
}
