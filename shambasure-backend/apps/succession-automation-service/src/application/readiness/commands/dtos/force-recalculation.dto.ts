import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ForceRecalculationDto {
  @IsUUID()
  @IsNotEmpty()
  assessmentId: string;

  @IsString()
  @IsOptional()
  triggerReason?: string; // e.g., "User requested manual refresh"
}
