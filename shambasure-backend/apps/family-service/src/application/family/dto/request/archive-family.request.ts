// application/family/dto/request/archive-family.request.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ArchiveFamilyRequest {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Reason for archiving the family',
    example: 'All family members deceased',
    minLength: 5,
    maxLength: 500,
  })
  reason: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User ID archiving the family',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  archivedByUserId: string;
}
