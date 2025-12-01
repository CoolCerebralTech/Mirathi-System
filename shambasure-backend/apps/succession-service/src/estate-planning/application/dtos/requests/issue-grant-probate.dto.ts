// issue-grant-probate.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class IssueGrantProbateDto {
  @IsString()
  @IsNotEmpty()
  probateCaseNumber: string;

  @IsString()
  @IsNotEmpty()
  courtRegistry: string;
}
