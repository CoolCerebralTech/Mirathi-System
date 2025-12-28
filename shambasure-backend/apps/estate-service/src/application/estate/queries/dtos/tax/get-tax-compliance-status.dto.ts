import { IsNotEmpty, IsUUID } from 'class-validator';

export class GetTaxComplianceStatusDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;
}
