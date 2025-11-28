import { GuardianType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

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
