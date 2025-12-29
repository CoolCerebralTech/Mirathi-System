import { IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';

export class OverrideStrategyDto {
  @IsUUID()
  @IsNotEmpty()
  assessmentId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(50, { message: 'Manual strategy override requires detailed instructions.' })
  newStrategy: string;

  @IsString()
  @IsNotEmpty()
  reasonForOverride: string;
}
