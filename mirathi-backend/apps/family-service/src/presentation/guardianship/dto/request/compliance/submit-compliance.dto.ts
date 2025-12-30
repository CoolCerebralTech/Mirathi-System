import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum SubmissionMethod {
  E_FILING = 'E_FILING', // Kenya Judiciary E-Filing
  COURT_PORTAL = 'COURT_PORTAL',
  EMAIL = 'EMAIL',
  PHYSICAL = 'PHYSICAL', // Hard copy delivery
  LAWYER = 'LAWYER', // Handed to advocate
}

export class SubmitComplianceDto {
  @ApiProperty({
    enum: SubmissionMethod,
    description: 'How was this report delivered to the court?',
  })
  @IsEnum(SubmissionMethod)
  method: SubmissionMethod;

  @ApiProperty({
    description: 'Submission notes or description',
    example: 'Uploaded via E-Filing portal, Case No. 123',
  })
  @IsString()
  @IsNotEmpty()
  details: string;

  @ApiPropertyOptional({
    description: 'External reference/receipt number',
    example: 'EF-2025-998877',
  })
  @IsOptional()
  @IsString()
  confirmationNumber?: string;
}
