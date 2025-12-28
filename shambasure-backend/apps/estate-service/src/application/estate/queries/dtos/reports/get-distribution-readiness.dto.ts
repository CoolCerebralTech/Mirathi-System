import { IsNotEmpty, IsUUID } from 'class-validator';

export class GetDistributionReadinessDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;
}
