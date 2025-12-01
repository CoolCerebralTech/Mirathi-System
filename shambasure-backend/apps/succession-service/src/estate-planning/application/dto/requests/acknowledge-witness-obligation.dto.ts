// acknowledge-witness-obligation.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class AcknowledgeWitnessObligationDto {
  @IsString()
  @IsOptional()
  acknowledgmentMethod?: string; // e.g., 'DIGITAL', 'IN_PERSON'
}
