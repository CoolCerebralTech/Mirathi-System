import { ApiProperty } from '@nestjs/swagger';

import { FormStatus, SignatureType } from '../../../../domain/entities/generated-form.entity';

export class SignatureStatusResponseDto {
  @ApiProperty({ example: 'Jane Doe' })
  signatoryName: string;

  @ApiProperty({ example: 'Beneficiary' })
  role: string;

  @ApiProperty({ example: true })
  hasSigned: boolean;

  @ApiProperty({ required: false })
  signedAt?: Date;

  @ApiProperty({ required: false, enum: SignatureType })
  signatureType?: SignatureType;
}

export class FormItemResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  id: string;

  @ApiProperty({ example: 'P&A 80' })
  code: string;

  @ApiProperty({ example: 'Petition for Letters of Administration' })
  name: string;

  @ApiProperty({ enum: FormStatus, example: FormStatus.GENERATED })
  status: FormStatus;

  @ApiProperty({ example: 'PRIMARY_PETITION' })
  category: string;

  @ApiProperty({ example: 1 })
  version: number;

  @ApiProperty()
  generatedAt: Date;

  @ApiProperty({ description: 'Short-lived signed URL for downloading' })
  downloadUrl: string;

  @ApiProperty({ required: false, description: 'HTML preview URL' })
  previewUrl?: string;

  @ApiProperty({ example: true })
  canSign: boolean;

  @ApiProperty({ example: true })
  canRegenerate: boolean;

  @ApiProperty({ example: 2 })
  signaturesRequired: number;

  @ApiProperty({ example: 1 })
  signaturesObtained: number;

  @ApiProperty({ type: [SignatureStatusResponseDto] })
  signatories: SignatureStatusResponseDto[];

  @ApiProperty({ required: false })
  rejectionReason?: string;
}

export class FormBundleResponseDto {
  @ApiProperty()
  applicationId: string;

  @ApiProperty({ type: [FormItemResponseDto], description: 'Main P&A Forms' })
  primaryPetitions: FormItemResponseDto[];

  @ApiProperty({ type: [FormItemResponseDto], description: 'Supporting Affidavits' })
  affidavits: FormItemResponseDto[];

  @ApiProperty({ type: [FormItemResponseDto], description: 'Consents and Guarantees' })
  consentsAndGuarantees: FormItemResponseDto[];

  @ApiProperty({ type: [FormItemResponseDto], description: 'Other Documents' })
  others: FormItemResponseDto[];

  @ApiProperty({ example: false })
  allApproved: boolean;

  @ApiProperty({ example: false })
  allSigned: boolean;
}
