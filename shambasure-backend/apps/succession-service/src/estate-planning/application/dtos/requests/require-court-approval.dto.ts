import { IsNotEmpty, IsString } from 'class-validator';

export class RequireCourtApprovalDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
