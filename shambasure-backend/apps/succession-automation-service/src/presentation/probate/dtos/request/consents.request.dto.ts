import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ConsentMethod } from '../../../../domain/entities/family-consent.entity';

// 1. Send Request
export class SendConsentRequestDto {
  @ApiProperty({ enum: ['SMS', 'EMAIL', 'BOTH'], example: 'SMS' })
  @IsEnum(['SMS', 'EMAIL', 'BOTH'])
  method: 'SMS' | 'EMAIL' | 'BOTH';
}

// 2. Grant Consent (Verification)
export class GrantConsentRequestDto {
  @ApiProperty({ enum: ConsentMethod, example: ConsentMethod.SMS_OTP })
  @IsEnum(ConsentMethod)
  method: ConsentMethod;

  @ApiPropertyOptional({ description: 'OTP Code sent to phone', example: '123456' })
  @IsString()
  @IsOptional()
  verificationToken?: string;
}

// 3. Decline Consent
export class DeclineConsentRequestDto {
  @ApiProperty({ example: 'I do not agree with the proposed distribution of land' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({
    enum: ['DISPUTE', 'NOT_INFORMED', 'DISAGREE_WITH_DISTRIBUTION', 'OTHER'],
    example: 'DISAGREE_WITH_DISTRIBUTION',
  })
  @IsEnum(['DISPUTE', 'NOT_INFORMED', 'DISAGREE_WITH_DISTRIBUTION', 'OTHER'])
  category: 'DISPUTE' | 'NOT_INFORMED' | 'DISAGREE_WITH_DISTRIBUTION' | 'OTHER';
}
