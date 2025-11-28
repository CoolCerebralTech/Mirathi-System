import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export enum RevocationMethod {
  NEW_WILL = 'NEW_WILL',
  DESTRUCTION = 'DESTRUCTION',
  WRITTEN_REVOCATION = 'WRITTEN_REVOCATION',
  MARRIAGE = 'MARRIAGE', // Section 19: Marriage revokes previous will
}

export class RevokeWillDto {
  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsEnum(RevocationMethod)
  method: RevocationMethod;
}
