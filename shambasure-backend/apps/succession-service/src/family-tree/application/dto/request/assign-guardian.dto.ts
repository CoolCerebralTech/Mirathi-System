import { IsUUID, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { GuardianType } from '@prisma/client';

export class AssignGuardianDto {
  @IsUUID()
  @IsNotEmpty()
  wardId: string; // The Minor

  @IsUUID()
  @IsNotEmpty()
  guardianId: string; // The Adult

  @IsEnum(GuardianType)
  type: GuardianType;

  @IsString()
  @IsOptional()
  appointedBy?: string; // e.g., "Will of John Doe" or "Court Order 123"
}
