import { IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';

export class CancelLiquidationDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsUUID()
  @IsNotEmpty()
  liquidationId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  reason: string; // e.g. "Asset withdrawn from auction due to family dispute"

  @IsString()
  @IsNotEmpty()
  cancelledBy: string;
}
