import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class VerifyRelationshipDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['BIRTH_CERTIFICATE', 'AFFIDAVIT', 'DNA_TEST', 'COMMUNITY_RECOGNITION', 'ADOPTION_ORDER'])
  verificationMethod: string;

  @IsString()
  @IsOptional()
  documentReference?: string; // ID of the uploaded document proof
}
