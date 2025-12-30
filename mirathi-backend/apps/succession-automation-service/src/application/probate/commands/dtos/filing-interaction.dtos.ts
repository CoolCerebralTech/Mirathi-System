import {
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

// ==============================================================================
// 1. Pay Filing Fee
// ==============================================================================
export class PayFilingFeeDto {
  @IsUUID()
  applicationId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string; // 'MPESA', 'CARD', 'BANK_TRANSFER'

  @IsString()
  @IsNotEmpty()
  paymentReference: string; // Transaction ID
}

// ==============================================================================
// 2. File Application (The Big Commit)
// ==============================================================================
export class FileApplicationDto {
  @IsUUID()
  applicationId: string;

  @IsIn(['E_FILING', 'PHYSICAL', 'COURT_REGISTRY'])
  filingMethod: 'E_FILING' | 'PHYSICAL' | 'COURT_REGISTRY';

  @IsString()
  @IsOptional()
  courtCaseNumber?: string; // If known at time of filing (Physical)

  @IsString()
  @IsOptional()
  courtReceiptNumber?: string;

  @IsUUID()
  filedByUserId: string;
}

// ==============================================================================
// 3. Record Court Response
// ==============================================================================
export class RecordCourtResponseDto {
  @IsUUID()
  applicationId: string;

  @IsIn(['ACCEPTED', 'REJECTED', 'QUERIED'])
  outcome: 'ACCEPTED' | 'REJECTED' | 'QUERIED';

  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  queries?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amendmentsRequired?: string[];

  @IsDateString()
  responseDate: string;
}

// ==============================================================================
// 4. Record Gazette Publication
// ==============================================================================
export class RecordGazettePublicationDto {
  @IsUUID()
  applicationId: string;

  @IsString()
  @IsNotEmpty()
  gazetteNoticeNumber: string;

  @IsDateString()
  publishedDate: string;
}

// ==============================================================================
// 5. Record Grant Issuance (Terminal State)
// ==============================================================================
export class RecordGrantIssuanceDto {
  @IsUUID()
  applicationId: string;

  @IsString()
  @IsNotEmpty()
  grantNumber: string;

  @IsString()
  @IsNotEmpty()
  issuedByRegistrar: string;

  @IsString()
  @IsNotEmpty()
  grantType: string; // e.g., "Grant of Probate"

  @IsDateString()
  issuedDate: string;
}
