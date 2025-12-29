import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class SimulateScoreDto {
  @IsUUID()
  assessmentId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  risksToResolve: string[]; // List of RiskFlag IDs to tentatively "resolve"
}
