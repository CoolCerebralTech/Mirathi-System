import { IsNotEmpty, IsUUID } from 'class-validator';

export class GetAssetDetailsDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsUUID()
  @IsNotEmpty()
  assetId: string;
}
