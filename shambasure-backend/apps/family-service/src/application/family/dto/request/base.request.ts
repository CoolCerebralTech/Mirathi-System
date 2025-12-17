// application/family/dto/request/base.request.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class BaseRequest {
  @IsUUID('4')
  @IsNotEmpty()
  @ApiProperty({
    description: 'User ID performing the action',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;
}

// Kenyan specific validation constants
export const KENYAN_VALIDATION = {
  NATIONAL_ID: /^\d{8,9}$/,
  KRA_PIN: /^[A-Z]{1}\d{9}[A-Z]{1}$/,
  BIRTH_CERTIFICATE: /^\d{1,10}[A-Z]{0,3}$/,
  PHONE: /^(?:\+254|0)?[17]\d{8}$/,
  NAME: /^[A-Za-zÀ-ÿ\s'-]+$/,
  HOUSE_NAME: /^[A-Za-zÀ-ÿ\s'-]{2,50}$/,
};
